import { createElement } from '../core/shadow-dom';
import { getConfig } from '../core/config';
import type { FeedbackCategory, FeedbackPriority } from '@zapbolt/shared';

const CAMERA_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
  <circle cx="12" cy="13" r="4"></circle>
</svg>`;

const REMOVE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="18" y1="6" x2="6" y2="18"></line>
  <line x1="6" y1="6" x2="18" y2="18"></line>
</svg>`;

export interface FormData {
  category: FeedbackCategory;
  message: string;
  email?: string;
  priority?: FeedbackPriority;
  screenshotBase64?: string;
}

export interface FormCallbacks {
  onSubmit: (data: FormData) => void;
  onScreenshotCapture: () => Promise<string | null>;
}

interface FormElements {
  form: HTMLFormElement;
  categoryContainer: HTMLDivElement;
  messageInput: HTMLTextAreaElement;
  emailInput?: HTMLInputElement;
  prioritySelect?: HTMLSelectElement;
  screenshotContainer: HTMLDivElement;
  screenshotBtn: HTMLButtonElement;
  screenshotPreview: HTMLDivElement | null;
  submitBtn: HTMLButtonElement;
  countdownEl: HTMLDivElement | null;
}

let elements: FormElements | null = null;
let callbacks: FormCallbacks | null = null;
let selectedCategory: FeedbackCategory = 'bug';
let screenshotData: string | null = null;
let isSubmitting = false;
let rateLimitedUntil = 0;
let countdownInterval: ReturnType<typeof setInterval> | null = null;

const CATEGORY_MAP: Record<string, FeedbackCategory> = {
  Bug: 'bug',
  Feature: 'feature',
  Improvement: 'improvement',
  Question: 'question',
  Other: 'other',
};

export function createForm(formCallbacks: FormCallbacks): HTMLFormElement {
  callbacks = formCallbacks;
  const config = getConfig();

  // Create form
  const form = createElement('form', 'zb-form');
  form.addEventListener('submit', handleSubmit);

  // Category selection
  const categoryField = createElement('div', 'zb-field');
  const categoryLabel = createElement('label', 'zb-label');
  categoryLabel.textContent = 'Category';

  const categoryContainer = createElement('div', 'zb-categories');

  config.categories.forEach((cat) => {
    const button = createElement('button', 'zb-category');
    button.type = 'button';
    button.textContent = cat;
    button.dataset.category = CATEGORY_MAP[cat] || 'other';

    if (button.dataset.category === selectedCategory) {
      button.classList.add('zb-category--selected');
    }

    button.addEventListener('click', () => selectCategory(button));
    categoryContainer.appendChild(button);
  });

  categoryField.appendChild(categoryLabel);
  categoryField.appendChild(categoryContainer);
  form.appendChild(categoryField);

  // Message input
  const messageField = createElement('div', 'zb-field');
  const messageLabel = createElement('label', 'zb-label zb-label--required');
  messageLabel.textContent = 'Message';

  const messageInput = createElement('textarea', 'zb-textarea') as HTMLTextAreaElement;
  messageInput.name = 'message';
  messageInput.placeholder = 'Describe your feedback...';
  messageInput.required = true;
  messageInput.minLength = 10;
  messageInput.maxLength = 2000;

  messageField.appendChild(messageLabel);
  messageField.appendChild(messageInput);
  form.appendChild(messageField);

  // Email input (based on config)
  let emailInput: HTMLInputElement | undefined;
  if (config.collectEmail !== 'hidden') {
    const emailField = createElement('div', 'zb-field');
    const emailLabel = createElement(
      'label',
      `zb-label${config.collectEmail === 'required' ? ' zb-label--required' : ''}`
    );
    emailLabel.textContent = 'Email';

    emailInput = createElement('input', 'zb-input') as HTMLInputElement;
    emailInput.type = 'email';
    emailInput.name = 'email';
    emailInput.placeholder = 'your@email.com';
    emailInput.required = config.collectEmail === 'required';

    emailField.appendChild(emailLabel);
    emailField.appendChild(emailInput);
    form.appendChild(emailField);
  }

  // Priority select
  const priorityField = createElement('div', 'zb-field');
  const priorityLabel = createElement('label', 'zb-label');
  priorityLabel.textContent = 'Priority';

  const prioritySelect = createElement('select', 'zb-select') as HTMLSelectElement;
  prioritySelect.name = 'priority';

  const priorities: { value: FeedbackPriority; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  priorities.forEach(({ value, label }) => {
    const option = createElement('option') as HTMLOptionElement;
    option.value = value;
    option.textContent = label;
    if (value === 'medium') option.selected = true;
    prioritySelect.appendChild(option);
  });

  priorityField.appendChild(priorityLabel);
  priorityField.appendChild(prioritySelect);
  form.appendChild(priorityField);

  // Screenshot section
  const screenshotContainer = createElement('div', 'zb-field');
  let screenshotBtn: HTMLButtonElement;

  if (config.enableScreenshot) {
    screenshotBtn = createElement('button', 'zb-screenshot-btn') as HTMLButtonElement;
    screenshotBtn.type = 'button';
    screenshotBtn.innerHTML = `${CAMERA_ICON}<span>Capture Screenshot</span>`;
    screenshotBtn.addEventListener('click', handleScreenshotCapture);
    screenshotContainer.appendChild(screenshotBtn);
  } else {
    screenshotBtn = createElement('button') as HTMLButtonElement;
    screenshotBtn.style.display = 'none';
  }

  form.appendChild(screenshotContainer);

  // Submit button
  const submitBtn = createElement('button', 'zb-submit') as HTMLButtonElement;
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Send Feedback';
  submitBtn.style.backgroundColor = config.primaryColor;
  submitBtn.style.color = config.textColor;
  form.appendChild(submitBtn);

  // Branding
  if (config.showBranding) {
    const branding = createElement('div', 'zb-branding');
    branding.innerHTML = 'Powered by <a href="https://zapbolt.io" target="_blank" rel="noopener">Zapbolt</a>';
    form.appendChild(branding);
  }

  elements = {
    form,
    categoryContainer,
    messageInput,
    emailInput,
    prioritySelect,
    screenshotContainer,
    screenshotBtn,
    screenshotPreview: null,
    submitBtn,
    countdownEl: null,
  };

  return form;
}

function selectCategory(button: HTMLButtonElement): void {
  if (!elements) return;

  // Remove selection from all
  elements.categoryContainer.querySelectorAll('.zb-category').forEach((btn) => {
    btn.classList.remove('zb-category--selected');
  });

  // Select clicked
  button.classList.add('zb-category--selected');
  selectedCategory = (button.dataset.category as FeedbackCategory) || 'other';
}

async function handleScreenshotCapture(): Promise<void> {
  if (!elements || !callbacks) return;

  const btn = elements.screenshotBtn;
  btn.classList.add('zb-screenshot-btn--loading');
  btn.innerHTML = `<span class="zb-spinner"></span><span>Capturing...</span>`;

  try {
    const base64 = await callbacks.onScreenshotCapture();

    if (base64) {
      screenshotData = base64;
      showScreenshotPreview(base64);
    }
  } catch (error) {
    console.error('[Zapbolt] Screenshot capture failed:', error);
  } finally {
    btn.classList.remove('zb-screenshot-btn--loading');
    btn.innerHTML = `${CAMERA_ICON}<span>Capture Screenshot</span>`;
  }
}

function showScreenshotPreview(base64: string): void {
  if (!elements) return;

  // Remove existing preview
  if (elements.screenshotPreview) {
    elements.screenshotPreview.remove();
  }

  const preview = createElement('div', 'zb-screenshot');

  const img = createElement('img', 'zb-screenshot__img') as HTMLImageElement;
  img.src = base64;
  img.alt = 'Screenshot preview';

  const removeBtn = createElement('button', 'zb-screenshot__remove') as HTMLButtonElement;
  removeBtn.type = 'button';
  removeBtn.innerHTML = REMOVE_ICON;
  removeBtn.setAttribute('aria-label', 'Remove screenshot');
  removeBtn.addEventListener('click', removeScreenshot);

  preview.appendChild(img);
  preview.appendChild(removeBtn);

  elements.screenshotContainer.insertBefore(preview, elements.screenshotBtn);
  elements.screenshotBtn.style.display = 'none';
  elements.screenshotPreview = preview;
}

function removeScreenshot(): void {
  if (!elements) return;

  screenshotData = null;

  if (elements.screenshotPreview) {
    elements.screenshotPreview.remove();
    elements.screenshotPreview = null;
  }

  elements.screenshotBtn.style.display = 'flex';
}

function handleSubmit(e: Event): void {
  e.preventDefault();

  if (!elements || !callbacks || isSubmitting) return;

  // Check rate limit
  if (Date.now() < rateLimitedUntil) {
    return;
  }

  const formData: FormData = {
    category: selectedCategory,
    message: elements.messageInput.value.trim(),
    priority: elements.prioritySelect?.value as FeedbackPriority,
  };

  if (elements.emailInput?.value) {
    formData.email = elements.emailInput.value.trim();
  }

  if (screenshotData) {
    formData.screenshotBase64 = screenshotData;
  }

  // Validate
  if (formData.message.length < 10) {
    showFieldError(elements.messageInput, 'Message must be at least 10 characters');
    return;
  }

  callbacks.onSubmit(formData);
}

function showFieldError(field: HTMLElement, message: string): void {
  // Remove existing error
  const existingError = field.parentElement?.querySelector('.zb-error');
  existingError?.remove();

  const error = createElement('span', 'zb-error');
  error.textContent = message;
  field.parentElement?.appendChild(error);

  field.focus();
}

export function setSubmitting(submitting: boolean): void {
  isSubmitting = submitting;

  if (!elements) return;

  const btn = elements.submitBtn;

  if (submitting) {
    btn.disabled = true;
    btn.innerHTML = '<span class="zb-spinner"></span><span>Sending...</span>';
  } else {
    btn.disabled = false;
    btn.textContent = 'Send Feedback';
  }
}

export function setRateLimited(untilTimestamp: number): void {
  rateLimitedUntil = untilTimestamp;

  if (!elements) return;

  // Show countdown
  updateCountdown();

  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  countdownInterval = setInterval(() => {
    if (Date.now() >= rateLimitedUntil) {
      clearInterval(countdownInterval!);
      countdownInterval = null;
      removeCountdown();
    } else {
      updateCountdown();
    }
  }, 1000);
}

function updateCountdown(): void {
  if (!elements) return;

  const remaining = Math.ceil((rateLimitedUntil - Date.now()) / 1000);

  if (!elements.countdownEl) {
    elements.countdownEl = createElement('div', 'zb-countdown');
    elements.submitBtn.parentElement?.insertBefore(elements.countdownEl, elements.submitBtn);
  }

  elements.countdownEl.textContent = `Please wait ${remaining}s before submitting again`;
  elements.submitBtn.disabled = true;
}

function removeCountdown(): void {
  if (!elements) return;

  elements.countdownEl?.remove();
  elements.countdownEl = null;
  elements.submitBtn.disabled = false;
}

export function resetForm(): void {
  if (!elements) return;

  elements.form.reset();
  selectedCategory = 'bug';
  screenshotData = null;

  // Reset category selection
  const firstCategory = elements.categoryContainer.querySelector('.zb-category');
  if (firstCategory) {
    elements.categoryContainer.querySelectorAll('.zb-category').forEach((btn) => {
      btn.classList.remove('zb-category--selected');
    });
    firstCategory.classList.add('zb-category--selected');
  }

  // Remove screenshot preview
  if (elements.screenshotPreview) {
    elements.screenshotPreview.remove();
    elements.screenshotPreview = null;
  }

  elements.screenshotBtn.style.display = 'flex';

  // Remove any errors
  elements.form.querySelectorAll('.zb-error').forEach((el) => el.remove());
}

export function destroyForm(): void {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  elements = null;
  callbacks = null;
  selectedCategory = 'bug';
  screenshotData = null;
  isSubmitting = false;
  rateLimitedUntil = 0;
}
