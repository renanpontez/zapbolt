# @zapbolt/widget

A lightweight, embeddable feedback widget for collecting user feedback with screenshot capture and session replay capabilities.

## Features

- **Zero dependencies on host page** - Self-contained IIFE bundle
- **Shadow DOM isolation** - Styles won't leak or be affected by host page CSS
- **Screenshot capture** - Powered by html2canvas with automatic compression
- **Session replay** - Records user interactions via rrweb (Pro tier only)
- **Responsive design** - Desktop modal with mobile bottom-sheet behavior
- **URL pattern matching** - Show/hide widget based on URL include/exclude rules
- **Customizable** - Colors, position, categories, and branding
- **Rate limiting aware** - Handles API rate limits with countdown display

## Installation

### Script Tag (Recommended)

Add the script tag before the closing `</body>` tag:

```html
<script
  src="https://cdn.zapbolt.io/widget.js"
  data-project-id="proj_abc123"
></script>
```

The widget will auto-initialize when the DOM is ready.

### With Custom Options

```html
<script
  src="https://cdn.zapbolt.io/widget.js"
  data-project-id="proj_abc123"
  data-position="bottom-left"
  data-primary-color="#8b5cf6"
  data-api-url="https://api.zapbolt.io"
></script>
```

### Programmatic Initialization

For more control, initialize manually:

```html
<script src="https://cdn.zapbolt.io/widget.js"></script>
<script>
  Zapbolt.init({
    projectId: 'proj_abc123',
    position: 'bottom-right',
    primaryColor: '#3b82f6',
    onSubmit: (feedback) => {
      console.log('Feedback submitted:', feedback.id);
    },
    onError: (error) => {
      console.error('Submission failed:', error.message);
    }
  });
</script>
```

## Configuration Options

### Script Tag Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-project-id` | string | **required** | Your Zapbolt project ID |
| `data-position` | string | `bottom-right` | Button position: `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `data-primary-color` | string | `#3b82f6` | Primary color (hex) |
| `data-api-url` | string | `https://api.zapbolt.io` | Custom API endpoint |

### Programmatic Config

```typescript
interface ZapboltConfig {
  projectId: string;                    // Required: Your project ID
  apiUrl?: string;                      // API endpoint (default: https://api.zapbolt.io)
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;                // Hex color for button/accents
  onSubmit?: (feedback: { id: string }) => void;  // Success callback
  onError?: (error: Error) => void;     // Error callback
}
```

### Server-Side Config (via Dashboard)

These options are fetched from your project settings:

| Option | Description |
|--------|-------------|
| `buttonText` | Text displayed on the floating button |
| `textColor` | Button text color |
| `showBranding` | Show "Powered by Zapbolt" footer |
| `categories` | Feedback categories (Bug, Feature, etc.) |
| `collectEmail` | Email field mode: `required`, `optional`, `hidden` |
| `enableScreenshot` | Enable screenshot capture |
| `enableSessionReplay` | Enable session recording (Pro tier) |

## API

The widget exposes a global `Zapbolt` object:

```typescript
// Initialize the widget
await Zapbolt.init(config);

// Open the feedback modal
Zapbolt.open();

// Close the feedback modal
Zapbolt.close();

// Check if modal is open
const isOpen = Zapbolt.isOpen();

// Destroy widget and clean up
Zapbolt.destroy();
```

## Architecture

```
src/
├── index.ts              # Entry point, global API, auto-init
├── api/
│   └── client.ts         # API communication, metadata collection
├── components/
│   ├── Button.ts         # Floating action button
│   ├── Form.ts           # Feedback form with validation
│   ├── Modal.ts          # Modal container with animations
│   └── Toast.ts          # Success/error notifications
├── core/
│   ├── config.ts         # Configuration management
│   ├── shadow-dom.ts     # Shadow DOM isolation
│   └── url-matcher.ts    # URL pattern matching
├── features/
│   ├── screenshot.ts     # Screenshot capture (html2canvas)
│   └── session-replay.ts # Session recording (rrweb)
└── styles/
    └── widget.css        # All widget styles
```

## How It Works

### Initialization Flow

1. **Script loads** - Detects `data-*` attributes on script tag
2. **Config fetch** - Calls `GET /api/widget/init?projectId={id}` for server config
3. **URL check** - Evaluates include/exclude patterns against current URL
4. **Shadow DOM** - Creates isolated container with closed shadow root
5. **UI render** - Creates button, modal, and form components
6. **Session replay** - Starts recording if enabled and tier allows

### Submission Flow

1. **Form validation** - Category required, message 10-2000 chars
2. **Screenshot capture** - If enabled, captures page (hides widget first)
3. **Metadata collection** - URL, user agent, screen size, session ID, timestamp
4. **API call** - `POST /api/widget/submit` with all data
5. **Rate limiting** - If 429, shows countdown and disables form
6. **Callbacks** - Triggers `onSubmit` or `onError` based on result

### Shadow DOM Isolation

The widget uses a closed Shadow DOM to completely isolate its styles:

```javascript
shadowRoot = container.attachShadow({ mode: 'closed' });
```

This means:
- Host page CSS cannot affect widget appearance
- Widget CSS cannot leak to the host page
- Widget elements are hidden from `document.querySelector`

### Screenshot Capture

Uses [html2canvas](https://html2canvas.hertzen.com/) with automatic compression:

1. Temporarily hides widget container
2. Renders page to canvas
3. Converts to JPEG starting at 85% quality
4. Reduces quality until under 2MB limit
5. If still too large, scales down canvas dimensions
6. Returns base64-encoded string

### Session Replay

Uses [rrweb](https://www.rrweb.io/) for session recording (Pro tier only):

- **Event limit**: 1000 events (circular buffer)
- **Duration limit**: 60 seconds
- **Privacy**: Masks password and email inputs
- **Custom masking**: Add `zb-mask` class or `data-sensitive` attribute
- **Block elements**: Add `zb-block` class or `data-private` attribute

### URL Pattern Matching

Control where the widget appears using include/exclude patterns:

```
// Wildcards supported:
*   - Match any characters within path segment
**  - Match any characters including /
?   - Match single character

// Examples:
https://example.com/*          - Homepage and top-level pages
https://example.com/app/**     - All /app/ subpaths
https://example.com/user/?     - /user/1, /user/a, etc.
```

**Pattern evaluation order:**
1. Check exclude patterns - if any match, hide widget
2. If include patterns exist, at least one must match
3. No patterns = show everywhere

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Run linter
pnpm lint

# Run tests
pnpm test
```

### Build Output

The Vite build produces a single IIFE bundle:

```bash
dist/widget.js
```

Build optimizations:
- Terser minification with 2 passes
- Console and debugger statements stripped
- Private property mangling (`_prefix`)
- No sourcemaps in production
- ES2020 target

## Metadata Collected

Each feedback submission includes:

| Field | Description |
|-------|-------------|
| `url` | Current page URL |
| `userAgent` | Browser user agent string |
| `screenWidth` | Screen width in pixels |
| `screenHeight` | Screen height in pixels |
| `devicePixelRatio` | Display pixel density |
| `timestamp` | ISO 8601 submission time |
| `sessionId` | Random ID persisted in sessionStorage |

## Error Handling

The widget handles errors gracefully:

- **Network errors** - Shows "Failed to connect" message
- **Rate limiting** - Shows countdown timer, disables form
- **Invalid config** - Logs warning, uses defaults
- **Screenshot failure** - Submits without screenshot
- **Session replay failure** - Continues without recording

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

Requires ES2020 features:
- Optional chaining (`?.`)
- Nullish coalescing (`??`)
- `Promise.allSettled`

## License

Proprietary - Zapbolt Inc.
