import { getContainer } from '../core/shadow-dom';

let html2canvasModule: typeof import('html2canvas') | null = null;

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const INITIAL_QUALITY = 0.85;
const MIN_QUALITY = 0.5;
const QUALITY_STEP = 0.1;

/**
 * Lazily load html2canvas module
 */
async function loadHtml2Canvas(): Promise<typeof import('html2canvas')> {
  if (html2canvasModule) {
    return html2canvasModule;
  }

  html2canvasModule = await import('html2canvas');
  return html2canvasModule;
}

/**
 * Capture screenshot of the current page
 * Returns base64 encoded JPEG image
 */
export async function captureScreenshot(): Promise<string> {
  const html2canvas = await loadHtml2Canvas();
  const container = getContainer();

  // Temporarily hide widget
  if (container) {
    container.style.display = 'none';
  }

  try {
    const canvas = await html2canvas.default(document.body, {
      scale: 1,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      ignoreElements: (element) => {
        // Ignore the widget container
        return element.id === 'zapbolt-widget' || element.hasAttribute('data-zapbolt');
      },
    });

    // Convert to JPEG with compression
    let quality = INITIAL_QUALITY;
    let base64 = canvas.toDataURL('image/jpeg', quality);

    // Reduce quality until under size limit
    while (getBase64Size(base64) > MAX_SIZE_BYTES && quality > MIN_QUALITY) {
      quality -= QUALITY_STEP;
      base64 = canvas.toDataURL('image/jpeg', quality);
    }

    // If still too large, resize the canvas
    if (getBase64Size(base64) > MAX_SIZE_BYTES) {
      base64 = await resizeAndCompress(canvas, MAX_SIZE_BYTES);
    }

    return base64;
  } finally {
    // Show widget again
    if (container) {
      container.style.display = '';
    }
  }
}

/**
 * Calculate approximate size of base64 string in bytes
 */
function getBase64Size(base64: string): number {
  // Remove data URL prefix
  const base64Data = base64.split(',')[1] || base64;
  // Base64 encodes 3 bytes in 4 characters
  return Math.ceil((base64Data.length * 3) / 4);
}

/**
 * Resize canvas and compress until under max size
 */
async function resizeAndCompress(
  originalCanvas: HTMLCanvasElement,
  maxSize: number
): Promise<string> {
  let scale = 0.9;
  let base64: string;

  do {
    const width = Math.floor(originalCanvas.width * scale);
    const height = Math.floor(originalCanvas.height * scale);

    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = width;
    resizedCanvas.height = height;

    const ctx = resizedCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(originalCanvas, 0, 0, width, height);
    base64 = resizedCanvas.toDataURL('image/jpeg', MIN_QUALITY);

    scale -= 0.1;
  } while (getBase64Size(base64) > maxSize && scale > 0.3);

  return base64;
}

/**
 * Check if screenshot capture is supported
 */
export function isScreenshotSupported(): boolean {
  return typeof document !== 'undefined' && typeof HTMLCanvasElement !== 'undefined';
}
