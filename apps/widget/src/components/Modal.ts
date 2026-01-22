import { createElement, getShadowRoot } from '../core/shadow-dom';
import { getConfig } from '../core/config';

const CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="18" y1="6" x2="6" y2="18"></line>
  <line x1="6" y1="6" x2="18" y2="18"></line>
</svg>`;

let overlayElement: HTMLDivElement | null = null;
let modalElement: HTMLDivElement | null = null;
let modalBody: HTMLDivElement | null = null;
let isVisible = false;
let onCloseCallback: (() => void) | null = null;

export function createModal(onClose: () => void): HTMLDivElement {
  const shadow = getShadowRoot();
  if (!shadow) {
    throw new Error('[Zapbolt] Shadow DOM not initialized');
  }

  const config = getConfig();
  onCloseCallback = onClose;

  // Create overlay
  overlayElement = createElement('div', 'zb-overlay');
  overlayElement.addEventListener('click', handleClose);

  // Create modal container
  modalElement = createElement('div', `zb-modal zb-modal--${config.position}`);

  // Create header
  const header = createElement('div', 'zb-modal__header');

  const title = createElement('h2', 'zb-modal__title');
  title.textContent = 'Send Feedback';

  const closeButton = createElement('button', 'zb-modal__close');
  closeButton.innerHTML = CLOSE_ICON;
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.addEventListener('click', handleClose);

  header.appendChild(title);
  header.appendChild(closeButton);

  // Create body
  modalBody = createElement('div', 'zb-modal__body');

  // Assemble modal
  modalElement.appendChild(header);
  modalElement.appendChild(modalBody);

  // Add to shadow DOM
  shadow.appendChild(overlayElement);
  shadow.appendChild(modalElement);

  // Handle escape key
  document.addEventListener('keydown', handleKeyDown);

  return modalElement;
}

function handleClose(): void {
  hideModal();
  if (onCloseCallback) {
    onCloseCallback();
  }
}

function handleKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && isVisible) {
    handleClose();
  }
}

export function showModal(): void {
  if (overlayElement && modalElement) {
    overlayElement.classList.add('zb-overlay--visible');
    modalElement.classList.add('zb-modal--visible');
    isVisible = true;

    // Focus trap - focus first focusable element
    setTimeout(() => {
      const focusable = modalElement?.querySelector<HTMLElement>(
        'button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }, 100);
  }
}

export function hideModal(): void {
  if (overlayElement && modalElement) {
    overlayElement.classList.remove('zb-overlay--visible');
    modalElement.classList.remove('zb-modal--visible');
    isVisible = false;
  }
}

export function isModalVisible(): boolean {
  return isVisible;
}

export function getModalBody(): HTMLDivElement | null {
  return modalBody;
}

export function setModalContent(content: HTMLElement): void {
  if (modalBody) {
    modalBody.innerHTML = '';
    modalBody.appendChild(content);
  }
}

export function appendToModal(element: HTMLElement): void {
  if (modalElement) {
    modalElement.appendChild(element);
  }
}

export function destroyModal(): void {
  document.removeEventListener('keydown', handleKeyDown);

  if (overlayElement) {
    overlayElement.removeEventListener('click', handleClose);
    overlayElement.remove();
    overlayElement = null;
  }

  if (modalElement) {
    modalElement.remove();
    modalElement = null;
  }

  modalBody = null;
  isVisible = false;
  onCloseCallback = null;
}

export function updateModalPosition(
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
): void {
  if (modalElement) {
    modalElement.className = `zb-modal zb-modal--${position}${isVisible ? ' zb-modal--visible' : ''}`;
  }
}
