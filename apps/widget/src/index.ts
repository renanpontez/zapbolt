import {
  createShadowContainer,
  destroyWidget,
  setCustomProperties,
} from './core/shadow-dom';
import { setConfig, getConfig, fetchRemoteConfig, mergeRemoteConfig } from './core/config';
import { shouldShowWidget, getCurrentUrl } from './core/url-matcher';
import { createButton, showButton, hideButton, destroyButton } from './components/Button';
import {
  createModal,
  showModal,
  hideModal,
  setModalContent,
  appendToModal,
  destroyModal,
} from './components/Modal';
import {
  createForm,
  setSubmitting,
  setRateLimited,
  resetForm,
  destroyForm,
  type FormData,
} from './components/Form';
import { showSuccess, showError } from './components/Toast';
import { captureScreenshot } from './features/screenshot';
import {
  startRecording,
  stopRecordingSession,
  getSessionReplayData,
  clearEvents,
} from './features/session-replay';
import { submitFeedback } from './api/client';

interface ZapboltConfig {
  projectId: string;
  apiUrl?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;
  onSubmit?: (feedback: { id: string }) => void;
  onError?: (error: Error) => void;
}

interface ZapboltAPI {
  init: (config: ZapboltConfig) => Promise<void>;
  open: () => void;
  close: () => void;
  destroy: () => void;
  isOpen: () => boolean;
}

let isInitialized = false;
let isOpen = false;

/**
 * Initialize the Zapbolt widget
 */
async function init(userConfig: ZapboltConfig): Promise<void> {
  console.log('[Zapbolt] init() called with:', userConfig);

  if (isInitialized) {
    console.warn('[Zapbolt] Widget already initialized');
    return;
  }

  if (!userConfig.projectId) {
    throw new Error('[Zapbolt] projectId is required');
  }

  // Set initial config
  console.log('[Zapbolt] Setting initial config...');
  let config = setConfig({
    projectId: userConfig.projectId,
    apiUrl: userConfig.apiUrl || 'https://api.zapbolt.io',
    position: userConfig.position,
    primaryColor: userConfig.primaryColor,
    onSubmit: userConfig.onSubmit,
    onError: userConfig.onError,
  });
  console.log('[Zapbolt] Initial config set:', config);

  // Fetch remote config and merge
  console.log('[Zapbolt] Fetching remote config from:', config.apiUrl);
  try {
    const remoteConfig = await fetchRemoteConfig(config.projectId, config.apiUrl);
    console.log('[Zapbolt] Remote config response:', remoteConfig);
    if (remoteConfig) {
      config = setConfig(mergeRemoteConfig(config, remoteConfig));
      console.log('[Zapbolt] Merged config:', config);
    }
  } catch (error) {
    console.error('[Zapbolt] Failed to fetch remote config:', error);
  }

  // Check URL patterns
  const currentUrl = getCurrentUrl();
  console.log('[Zapbolt] Current URL:', currentUrl);
  console.log('[Zapbolt] URL patterns:', config.urlPatterns);
  if (!shouldShowWidget(currentUrl, config.urlPatterns)) {
    console.info('[Zapbolt] Widget hidden based on URL patterns');
    return;
  }

  // Create shadow DOM container
  console.log('[Zapbolt] Creating shadow DOM container...');
  const shadowRoot = createShadowContainer();
  console.log('[Zapbolt] Shadow root created:', shadowRoot);
  setCustomProperties(config.primaryColor, config.textColor);

  // Create UI components
  console.log('[Zapbolt] Creating button...');
  createButton(handleButtonClick);
  console.log('[Zapbolt] Creating modal...');
  createModal(handleModalClose);

  // Create and set form
  console.log('[Zapbolt] Creating form...');
  const form = createForm({
    onSubmit: handleFormSubmit,
    onScreenshotCapture: captureScreenshot,
  });
  setModalContent(form);

  // Start session replay if enabled
  if (config.enableSessionReplay && config.tier !== 'free') {
    startRecording();
  }

  isInitialized = true;
  console.info('[Zapbolt] Widget initialized successfully!');
}

/**
 * Handle floating button click
 */
function handleButtonClick(): void {
  if (isOpen) {
    close();
  } else {
    open();
  }
}

/**
 * Handle modal close
 */
function handleModalClose(): void {
  isOpen = false;
  showButton();
}

/**
 * Handle form submission
 */
async function handleFormSubmit(formData: FormData): Promise<void> {
  setSubmitting(true);

  try {
    const config = getConfig();

    // Get session replay data if recording
    const sessionReplayData = getSessionReplayData();

    const response = await submitFeedback({
      category: formData.category,
      message: formData.message,
      email: formData.email,
      priority: formData.priority,
      screenshotBase64: formData.screenshotBase64,
      sessionReplayData: sessionReplayData || undefined,
    });

    if (response.success && response.data) {
      showSuccess('Thank you for your feedback!');
      resetForm();
      clearEvents();

      // Close modal after delay
      setTimeout(() => {
        close();
      }, 1500);

      // Call user callback
      if (config.onSubmit) {
        config.onSubmit({ id: response.data.id });
      }
    } else {
      const error = response.error;

      if (error?.code === 'RATE_LIMITED') {
        const retryAfter = (error.details?.retryAfter as number) || 60;
        setRateLimited(Date.now() + retryAfter * 1000);
        showError(error.message);
      } else {
        showError(error?.message || 'Failed to submit feedback');
      }

      // Call error callback
      if (config.onError) {
        config.onError(new Error(error?.message || 'Submission failed'));
      }
    }
  } catch (error) {
    showError('An unexpected error occurred');
    console.error('[Zapbolt] Submission error:', error);

    const config = getConfig();
    if (config.onError) {
      config.onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  } finally {
    setSubmitting(false);
  }
}

/**
 * Open the feedback modal
 */
function open(): void {
  if (!isInitialized) {
    console.warn('[Zapbolt] Widget not initialized');
    return;
  }

  showModal();
  hideButton();
  isOpen = true;
}

/**
 * Close the feedback modal
 */
function close(): void {
  if (!isInitialized) {
    return;
  }

  hideModal();
  showButton();
  isOpen = false;
}

/**
 * Check if modal is open
 */
function isModalOpen(): boolean {
  return isOpen;
}

/**
 * Destroy the widget and clean up
 */
function destroy(): void {
  if (!isInitialized) {
    return;
  }

  stopRecordingSession();
  clearEvents();
  destroyForm();
  destroyModal();
  destroyButton();
  destroyWidget();

  isInitialized = false;
  isOpen = false;

  console.info('[Zapbolt] Widget destroyed');
}

// Create global API
const Zapbolt: ZapboltAPI = {
  init,
  open,
  close,
  destroy,
  isOpen: isModalOpen,
};

// Expose to window
declare global {
  interface Window {
    Zapbolt: ZapboltAPI;
  }
}

window.Zapbolt = Zapbolt;

// Auto-init: extracts config from script URL query params
(() => {
  console.log('[Zapbolt] Script loaded, starting auto-init...');

  interface GlobalConfig {
    projectId: string;
    position?: ZapboltConfig['position'];
    primaryColor?: string;
    apiUrl?: string;
  }

  function getScriptUrl(): URL | null {
    // Try document.currentScript first
    let scriptSrc = (document.currentScript as HTMLScriptElement | null)?.src;

    if (!scriptSrc) {
      // Fallback: find script by src containing widget.js
      const scripts = document.querySelectorAll<HTMLScriptElement>('script[src*="widget.js"]');
      scriptSrc = scripts[scripts.length - 1]?.src;
    }

    if (scriptSrc) {
      try {
        return new URL(scriptSrc);
      } catch {
        console.error('[Zapbolt] Invalid script URL:', scriptSrc);
      }
    }
    return null;
  }

  function getConfigFromScriptUrl(): GlobalConfig | null {
    const scriptUrl = getScriptUrl();
    console.log('[Zapbolt] Script URL:', scriptUrl?.href);

    if (!scriptUrl) {
      console.warn('[Zapbolt] Could not find widget script URL');
      return null;
    }

    const params = scriptUrl.searchParams;
    const projectId = params.get('projectId') || params.get('project-id') || params.get('pid');

    if (!projectId) {
      console.warn('[Zapbolt] No projectId in script URL');
      return null;
    }

    // API URL defaults to script origin (e.g., http://localhost:3001)
    // This means the widget.js should be served from the API server
    const apiUrl = `${scriptUrl.protocol}//${scriptUrl.host}`;

    return {
      projectId,
      apiUrl,
      position: params.get('position') as ZapboltConfig['position'] || undefined,
      primaryColor: params.get('primaryColor') || params.get('color') || undefined,
    };
  }

  function autoInit(): void {
    console.log('[Zapbolt] Running autoInit...');

    const config = getConfigFromScriptUrl();
    console.log('[Zapbolt] Config from URL:', config);

    if (config?.projectId) {
      console.log('[Zapbolt] Initializing with:', config);
      Zapbolt.init({
        projectId: config.projectId,
        position: config.position,
        primaryColor: config.primaryColor,
        apiUrl: config.apiUrl,
      });
    } else {
      console.warn('[Zapbolt] No projectId found! Add ?projectId=xxx to the script URL');
      console.warn('[Zapbolt] Example: <script src="https://yourapi.com/widget.js?projectId=abc123"></script>');
    }
  }

  // Wait for DOM ready before auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();

export default Zapbolt;
export type { ZapboltConfig, ZapboltAPI };
