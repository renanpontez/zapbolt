import { createElement, getShadowRoot } from '../core/shadow-dom';
import { getConfig } from '../core/config';

const SUCCESS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="20 6 9 17 4 12"></polyline>
</svg>`;

const ERROR_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"></circle>
  <line x1="15" y1="9" x2="9" y2="15"></line>
  <line x1="9" y1="9" x2="15" y2="15"></line>
</svg>`;

let toastElement: HTMLDivElement | null = null;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;

type ToastType = 'success' | 'error';

export function showToast(message: string, type: ToastType = 'success', duration = 3000): void {
  const shadow = getShadowRoot();
  if (!shadow) return;

  // Remove existing toast
  if (toastElement) {
    hideToast();
  }

  const config = getConfig();

  // Create toast
  toastElement = createElement('div', `zb-toast zb-toast--${type} zb-toast--${config.position}`);

  const icon = createElement('span');
  icon.innerHTML = type === 'success' ? SUCCESS_ICON : ERROR_ICON;

  const text = createElement('span');
  text.textContent = message;

  toastElement.appendChild(icon);
  toastElement.appendChild(text);

  shadow.appendChild(toastElement);

  // Trigger animation
  requestAnimationFrame(() => {
    toastElement?.classList.add('zb-toast--visible');
  });

  // Auto-hide
  if (duration > 0) {
    hideTimeout = setTimeout(() => {
      hideToast();
    }, duration);
  }
}

export function hideToast(): void {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  if (toastElement) {
    toastElement.classList.remove('zb-toast--visible');

    // Remove after animation
    setTimeout(() => {
      toastElement?.remove();
      toastElement = null;
    }, 300);
  }
}

export function showSuccess(message: string, duration = 3000): void {
  showToast(message, 'success', duration);
}

export function showError(message: string, duration = 4000): void {
  showToast(message, 'error', duration);
}
