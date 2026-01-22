import type { WidgetInitConfig, WidgetInitResponse } from '@zapbolt/shared';
import type { UrlPattern } from './url-matcher';

export interface WidgetConfig {
  projectId: string;
  apiUrl: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor: string;
  textColor: string;
  buttonText: string;
  showBranding: boolean;
  categories: string[];
  collectEmail: 'required' | 'optional' | 'hidden';
  enableScreenshot: boolean;
  enableSessionReplay: boolean;
  urlPatterns: UrlPattern[];
  tier: string;
  onSubmit?: (feedback: { id: string }) => void;
  onError?: (error: Error) => void;
}

const DEFAULT_CONFIG: Omit<WidgetConfig, 'projectId'> = {
  apiUrl: 'https://api.zapbolt.io',
  position: 'bottom-right',
  primaryColor: '#3b82f6',
  textColor: '#ffffff',
  buttonText: 'Feedback',
  showBranding: true,
  categories: ['Bug', 'Feature', 'Improvement', 'Question', 'Other'],
  collectEmail: 'optional',
  enableScreenshot: true,
  enableSessionReplay: false,
  urlPatterns: [],
  tier: 'free',
};

let config: WidgetConfig | null = null;

export function getConfig(): WidgetConfig {
  if (!config) {
    throw new Error('[Zapbolt] Widget not initialized. Call Zapbolt.init() first.');
  }
  return config;
}

export function setConfig(newConfig: Partial<WidgetConfig> & { projectId: string }): WidgetConfig {
  // Filter out undefined values to prevent overwriting defaults
  const filteredConfig = Object.fromEntries(
    Object.entries(newConfig).filter(([, value]) => value !== undefined)
  );

  config = {
    ...DEFAULT_CONFIG,
    ...filteredConfig,
  } as WidgetConfig;
  return config;
}

export async function fetchRemoteConfig(
  projectId: string,
  apiUrl: string
): Promise<WidgetInitResponse | null> {
  try {
    const response = await fetch(`${apiUrl}/api/widget/init?projectId=${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[Zapbolt] Failed to fetch remote config:', error);
    return null;
  }
}

export function mergeRemoteConfig(
  localConfig: WidgetConfig,
  remoteConfig: WidgetInitResponse
): WidgetConfig {
  return {
    ...localConfig,
    position: (remoteConfig.config.position as WidgetConfig['position']) || localConfig.position,
    primaryColor: remoteConfig.config.primaryColor || localConfig.primaryColor,
    textColor: remoteConfig.config.textColor || localConfig.textColor,
    buttonText: remoteConfig.config.buttonText || localConfig.buttonText,
    showBranding: remoteConfig.config.showBranding ?? localConfig.showBranding,
    categories: remoteConfig.config.categories.length > 0
      ? remoteConfig.config.categories
      : localConfig.categories,
    collectEmail: (remoteConfig.config.collectEmail as WidgetConfig['collectEmail']) || localConfig.collectEmail,
    enableScreenshot: remoteConfig.config.enableScreenshot ?? localConfig.enableScreenshot,
    enableSessionReplay: remoteConfig.config.enableSessionReplay ?? localConfig.enableSessionReplay,
    urlPatterns: remoteConfig.urlPatterns?.length > 0
      ? remoteConfig.urlPatterns
      : localConfig.urlPatterns,
    tier: remoteConfig.tier || localConfig.tier,
  };
}
