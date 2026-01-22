import styles from '../styles/widget.css?inline';

let shadowRoot: ShadowRoot | null = null;
let container: HTMLDivElement | null = null;

export function createShadowContainer(): ShadowRoot {
  if (shadowRoot) return shadowRoot;

  // Create container element
  container = document.createElement('div');
  container.id = 'zapbolt-widget';
  container.setAttribute('data-zapbolt', 'true');

  // Attach closed shadow DOM for complete isolation
  shadowRoot = container.attachShadow({ mode: 'closed' });

  // Inject styles
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  shadowRoot.appendChild(styleElement);

  // Add to DOM
  document.body.appendChild(container);

  return shadowRoot;
}

export function getShadowRoot(): ShadowRoot | null {
  return shadowRoot;
}

export function getContainer(): HTMLDivElement | null {
  return container;
}

export function destroyWidget(): void {
  if (container && container.parentNode) {
    container.parentNode.removeChild(container);
  }
  container = null;
  shadowRoot = null;
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  attributes?: Record<string, string>
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  return element;
}

export function setCustomProperties(primaryColor: string, textColor: string): void {
  if (!shadowRoot) return;

  const root = shadowRoot.host as HTMLElement;
  root.style.setProperty('--zb-primary', primaryColor);
  root.style.setProperty('--zb-text', textColor);
}
