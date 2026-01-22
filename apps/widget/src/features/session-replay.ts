import { getConfig } from '../core/config';

type RRWebModule = typeof import('rrweb');
type EventWithTime = Parameters<Parameters<RRWebModule['record']>[0]['emit']>[0];

let rrwebModule: RRWebModule | null = null;
let stopRecording: (() => void) | null = null;
let events: EventWithTime[] = [];
let isRecording = false;

const MAX_EVENTS = 1000;
const MAX_DURATION_MS = 60 * 1000; // 60 seconds
let recordingStartTime = 0;

/**
 * Lazily load rrweb module
 */
async function loadRRWeb(): Promise<RRWebModule> {
  if (rrwebModule) {
    return rrwebModule;
  }

  rrwebModule = await import('rrweb');
  return rrwebModule;
}

/**
 * Start session replay recording
 * Only available for Pro tier
 */
export async function startRecording(): Promise<void> {
  const config = getConfig();

  if (!config.enableSessionReplay || config.tier === 'free') {
    console.info('[Zapbolt] Session replay not available on free tier');
    return;
  }

  if (isRecording) {
    return;
  }

  try {
    const rrweb = await loadRRWeb();

    events = [];
    recordingStartTime = Date.now();
    isRecording = true;

    stopRecording = rrweb.record({
      emit(event) {
        // Check duration limit
        if (Date.now() - recordingStartTime > MAX_DURATION_MS) {
          stopRecordingSession();
          return;
        }

        // Check event limit
        if (events.length >= MAX_EVENTS) {
          // Remove oldest events to make room
          events.shift();
        }

        events.push(event);
      },
      maskInputOptions: {
        password: true,
        email: true,
      },
      maskTextClass: 'zb-mask',
      maskTextSelector: '[data-sensitive]',
      blockClass: 'zb-block',
      blockSelector: '[data-private]',
      sampling: {
        mousemove: 50,
        mouseInteraction: true,
        scroll: 150,
        media: 800,
        input: 'last',
      },
      recordCanvas: false,
      recordCrossOriginIframes: false,
    });

    console.info('[Zapbolt] Session replay recording started');
  } catch (error) {
    console.error('[Zapbolt] Failed to start session replay:', error);
    isRecording = false;
  }
}

/**
 * Stop session replay recording
 */
export function stopRecordingSession(): void {
  if (stopRecording) {
    stopRecording();
    stopRecording = null;
  }
  isRecording = false;
}

/**
 * Get recorded session data as compressed string
 */
export function getSessionReplayData(): string | null {
  if (events.length === 0) {
    return null;
  }

  try {
    // Return as JSON string (compression should happen on server)
    return JSON.stringify(events);
  } catch (error) {
    console.error('[Zapbolt] Failed to serialize session replay data:', error);
    return null;
  }
}

/**
 * Clear recorded events
 */
export function clearEvents(): void {
  events = [];
}

/**
 * Check if session replay is currently recording
 */
export function isCurrentlyRecording(): boolean {
  return isRecording;
}

/**
 * Get current event count
 */
export function getEventCount(): number {
  return events.length;
}

/**
 * Check if session replay is supported
 */
export function isSessionReplaySupported(): boolean {
  return (
    typeof document !== 'undefined' &&
    typeof MutationObserver !== 'undefined' &&
    typeof WeakMap !== 'undefined'
  );
}
