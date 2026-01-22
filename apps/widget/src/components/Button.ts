import { createElement, getShadowRoot } from '../core/shadow-dom';
import { getConfig } from '../core/config';

const FEEDBACK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  <line x1="9" y1="10" x2="15" y2="10"></line>
</svg>`;

let buttonElement: HTMLButtonElement | null = null;
let onClickCallback: (() => void) | null = null;

export function createButton(onClick: () => void): HTMLButtonElement {
  const shadow = getShadowRoot();
  if (!shadow) {
    throw new Error('[Zapbolt] Shadow DOM not initialized');
  }

  const config = getConfig();

  // Create button
  buttonElement = createElement('button', `zb-button zb-button--${config.position}`);
  buttonElement.innerHTML = FEEDBACK_ICON;
  buttonElement.style.backgroundColor = config.primaryColor;
  buttonElement.style.color = config.textColor;
  buttonElement.setAttribute('aria-label', config.buttonText);
  buttonElement.setAttribute('title', config.buttonText);

  // Store callback
  onClickCallback = onClick;
  buttonElement.addEventListener('click', handleClick);

  // Add to shadow DOM
  shadow.appendChild(buttonElement);

  return buttonElement;
}

function handleClick(): void {
  if (onClickCallback) {
    onClickCallback();
  }
}

export function showButton(): void {
  if (buttonElement) {
    buttonElement.style.display = 'flex';
  }
}

export function hideButton(): void {
  if (buttonElement) {
    buttonElement.style.display = 'none';
  }
}

export function destroyButton(): void {
  if (buttonElement) {
    buttonElement.removeEventListener('click', handleClick);
    buttonElement.remove();
    buttonElement = null;
  }
  onClickCallback = null;
}

export function updateButtonPosition(
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
): void {
  if (buttonElement) {
    buttonElement.className = `zb-button zb-button--${position}`;
  }
}
