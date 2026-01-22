# Zapbolt Frontend Agent Prompt

You are building the frontend for **Zapbolt.io** - a B2B SaaS feedback widget. This document contains everything you need to build the frontend independently.

---

## Product Overview

Zapbolt is a feedback collection tool with two frontend components:

1. **Widget** - Embeddable JavaScript that runs on client websites
2. **Dashboard** - Web app where clients manage feedback

---

## Tech Stack

### Widget (Embeddable Script)
- **Framework:** Vanilla JS or Preact (< 10KB)
- **Styling:** CSS-in-JS (inline styles) for isolation
- **Isolation:** Shadow DOM
- **Screenshot:** html2canvas (lazy-loaded)
- **Session Replay:** rrweb (lazy-loaded, Pro only)
- **Build:** Vite or esbuild
- **Output:** Single JS file served from CDN

### Dashboard (Web App)
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod
- **Auth:** NextAuth.js
- **Hosting:** Vercel

---

## Component 1: Widget

### Architecture

```
widget/
├── src/
│   ├── index.ts          # Entry point, config loader
│   ├── init.ts           # URL matching, injection logic
│   ├── components/
│   │   ├── Button.ts     # Floating trigger button
│   │   ├── Modal.ts      # Feedback form modal
│   │   ├── Form.ts       # Form fields and validation
│   │   ├── Screenshot.ts # Screenshot capture UI
│   │   └── Success.ts    # Success message
│   ├── services/
│   │   ├── api.ts        # Submit feedback to API
│   │   ├── screenshot.ts # html2canvas wrapper
│   │   └── replay.ts     # rrweb wrapper (Pro)
│   ├── utils/
│   │   ├── dom.ts        # Shadow DOM helpers
│   │   ├── url.ts        # URL pattern matching
│   │   └── context.ts    # Capture page context
│   └── styles/
│       └── widget.css    # Widget styles (embedded)
├── dist/
│   └── widget.js         # Built output
└── vite.config.ts
```

### Widget Behavior

```
Page Load → Fetch Config → Check URL Pattern → Inject Button
                                                    ↓
                                            User Clicks Button
                                                    ↓
                                            Open Modal (lazy load form)
                                                    ↓
                                            User Fills Form
                                                    ↓
                                            [Optional] Capture Screenshot
                                                    ↓
                                            Submit to API
                                                    ↓
                                            Show Success → Close Modal
```

### Widget Components

#### 1. Floating Button
```typescript
// Position: bottom-left or bottom-right (configurable)
// Size: 56px circular button
// Z-index: 2147483647 (max safe integer)
// Hover: scale(1.05) + shadow
// Contains: Icon (chat bubble or custom)

interface ButtonConfig {
  position: 'bottom-left' | 'bottom-right';
  primaryColor: string;
  iconUrl?: string;
  tooltip: string;
}
```

#### 2. Modal Container
```typescript
// Centered modal with backdrop
// Max-width: 480px
// Body scroll lock when open
// Close: X button, ESC key, backdrop click
// Focus trap for accessibility

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryColor: string;
}
```

#### 3. Feedback Form
```typescript
interface FeedbackFormData {
  category: 'bug' | 'feature' | 'general';
  message: string;        // required, max 1000 chars
  email?: string;         // optional
  priority?: 'low' | 'medium' | 'high';
  screenshotBlob?: Blob;
}

// Validation:
// - message: required, 1-1000 chars
// - email: optional, valid email format
// - category: required, one of enum values
```

#### 4. Screenshot Capture
```typescript
// Button: "Capture Screenshot"
// On click: Use html2canvas to capture document.body
// Show: Thumbnail preview (150x100)
// Options: Remove, Retake
// Compression: JPEG 0.8 quality, max 500KB

async function captureScreenshot(): Promise<Blob> {
  const html2canvas = await import('html2canvas');
  const canvas = await html2canvas.default(document.body, {
    scale: 0.5,
    logging: false,
    useCORS: true,
  });
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.8);
  });
}
```

### URL Pattern Matching

```typescript
// Support patterns:
// - Exact: "/dashboard" matches only /dashboard
// - Wildcard: "/app/*" matches /app/anything
// - Exclusion: "!/checkout/*" excludes even if other patterns match

function matchUrl(patterns: Pattern[], currentPath: string): boolean {
  const exclusions = patterns.filter(p => p.pattern.startsWith('!'));
  const inclusions = patterns.filter(p => !p.pattern.startsWith('!'));

  // Check exclusions first
  for (const excl of exclusions) {
    if (matchPattern(excl.pattern.slice(1), currentPath)) {
      return false;
    }
  }

  // Check inclusions
  for (const incl of inclusions) {
    if (matchPattern(incl.pattern, currentPath)) {
      return true;
    }
  }

  return false;
}
```

### Context Capture

```typescript
interface PageContext {
  url: string;
  userAgent: string;
  viewportWidth: number;
  viewportHeight: number;
  referrer: string;
  timestamp: string;
  language: string;
}

function captureContext(): PageContext {
  return {
    url: window.location.href,
    userAgent: navigator.userAgent,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    referrer: document.referrer,
    timestamp: new Date().toISOString(),
    language: navigator.language,
  };
}
```

### Widget Performance Requirements

| Metric | Target |
|--------|--------|
| Initial bundle size | < 20KB gzipped |
| Time to button visible | < 500ms |
| Screenshot library load | < 150KB (lazy) |
| Total memory usage | < 5MB |

---

## Component 2: Dashboard

### Architecture

```
dashboard/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Sidebar + header + OnboardingProvider
│   │   ├── page.tsx             # Dashboard home
│   │   ├── projects/
│   │   │   ├── page.tsx         # Project list
│   │   │   ├── new/page.tsx     # Create project
│   │   │   └── [id]/
│   │   │       ├── page.tsx     # Project overview
│   │   │       ├── feedback/page.tsx    # Feedback list
│   │   │       ├── settings/page.tsx    # Widget config
│   │   │       └── install/page.tsx     # Install instructions
│   │   ├── feedback/
│   │   │   └── [id]/page.tsx    # Feedback detail
│   │   ├── settings/
│   │   │   ├── page.tsx         # Account settings
│   │   │   ├── billing/page.tsx # Subscription
│   │   │   └── team/page.tsx    # Team members
│   │   └── integrations/page.tsx
│   ├── api/                     # API routes
│   │   └── user/
│   │       └── onboarding/route.ts  # Mark onboarding complete
│   └── layout.tsx
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── onboarding/              # Onboarding tour system
│   │   ├── OnboardingProvider.tsx   # Context + state management
│   │   ├── OnboardingTour.tsx       # Main tour orchestrator
│   │   ├── Tooltip.tsx              # Floating tooltip component
│   │   ├── Spotlight.tsx            # Backdrop with cutout
│   │   ├── TourProgress.tsx         # Step indicator (1 of 3)
│   │   └── steps/
│   │       ├── WelcomeStep.tsx      # Initial welcome spotlight
│   │       ├── CreateProjectStep.tsx # Points to projects nav
│   │       └── InstallWidgetStep.tsx # Points to script tag
│   ├── feedback/
│   │   ├── FeedbackList.tsx
│   │   ├── FeedbackCard.tsx
│   │   ├── FeedbackDetail.tsx
│   │   ├── ScreenshotViewer.tsx
│   │   └── ReplayPlayer.tsx
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   ├── UrlPatternEditor.tsx
│   │   └── ThemeCustomizer.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── PageHeader.tsx
├── lib/
│   ├── api.ts                   # API client
│   ├── auth.ts                  # Auth helpers
│   └── utils.ts
└── hooks/
    ├── useFeedback.ts
    ├── useProjects.ts
    ├── useOnboarding.ts         # Onboarding state management
    └── useSubscription.ts
```

### Key Screens

#### 1. Login/Signup
- Email + password form
- Google OAuth button
- Link to forgot password
- Redirect to dashboard on success

#### 2. Dashboard Home
- Quick stats: total feedback, this week, unread
- Recent feedback (last 5)
- Quick actions: view all, create project

#### 3. Project List
- Card grid of projects
- Each card: name, URL, feedback count, last activity
- "New Project" button
- Plan limit indicator

#### 4. Project Feedback List
```typescript
interface FeedbackListProps {
  projectId: string;
}

// Features:
// - Table view with columns: category, message preview, URL, date, status
// - Filters: category, status, date range
// - Search: by message text
// - Pagination: 25 per page
// - Click row to open detail
```

#### 5. Feedback Detail
```typescript
interface FeedbackDetailProps {
  feedbackId: string;
}

// Sections:
// 1. Header: category badge, status dropdown, date
// 2. Message: full text
// 3. Screenshot: thumbnail, click to enlarge (lightbox)
// 4. Session Replay: rrweb player (Pro only)
// 5. Technical Details: collapsible, URL, browser, viewport
// 6. Internal Notes: textarea, save button
```

#### 6. Widget Settings
```typescript
// Tabs:
// 1. URL Patterns
//    - List of patterns with add/edit/delete
//    - Pattern type selector (exact, wildcard)
//    - Test URL input
//
// 2. Appearance
//    - Color picker for primary color
//    - Position toggle (left/right)
//    - Icon upload
//    - Live preview
//
// 3. Form Fields
//    - Toggle: category enabled
//    - Toggle: email field enabled
//    - Toggle: screenshot enabled
//    - Toggle: priority enabled
```

#### 7. Install Instructions
```typescript
// Show:
// 1. Script tag to copy
// 2. "Copy" button with success feedback
// 3. Framework-specific instructions (React, Vue, Next.js)
// 4. "Test Installation" button that checks if widget loaded
```

---

## Onboarding Tour System

The dashboard includes a 3-step onboarding tour to guide new users through setup. Goal: "Time to first project: < 2 minutes".

### Tour Flow

```
Step 1: Welcome Spotlight (centered modal)
    ↓ User clicks "Let's Go"
Step 2: Create Project (tooltip → Projects nav item)
    ↓ User creates a project (auto-detected via React Query)
Step 3: Install Widget (tooltip → script tag section)
    ↓ User clicks "Got it!" or "Skip"
Complete → Mark onboarding_completed_at in database
```

### Trigger Conditions

Show onboarding when ALL are true:
- User is authenticated
- `user.onboardingCompletedAt === null`
- User has 0 projects
- Screen width >= 768px (desktop only)

### Key Components

```typescript
// OnboardingProvider - Wraps dashboard, provides context
interface OnboardingContextType {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
}

// Tooltip - Floating tooltip attached to UI elements
interface TooltipProps {
  targetSelector: string;      // e.g., '[data-tour="projects"]'
  position: 'top' | 'bottom' | 'left' | 'right';
  title: string;
  description: string;
  primaryAction: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

// Spotlight - Full-screen backdrop with CSS clip-path cutout
interface SpotlightProps {
  targetSelector?: string;
  padding?: number;
  centered?: boolean;  // For welcome screen
}
```

### Data Attributes

Components that can be targeted by the tour use `data-tour` attributes:
- `data-tour="projects"` - Projects nav item in sidebar
- `data-tour="install-widget"` - Script tag copy section

### State Management

- **Database**: `users.onboarding_completed_at` (null = not completed)
- **localStorage**: `zapbolt_onboarding_step` (persists current step across refreshes)
- **React Query**: Detects project creation to auto-advance tour

### API Endpoint

```
POST /api/user/onboarding
Response: { success: true }
```

Marks `onboarding_completed_at` with current timestamp.

---

### UI Components (shadcn/ui)

Required components:
- Button, Input, Textarea, Select
- Card, Table, Badge, Avatar
- Dialog, Sheet, Popover, Tooltip
- Tabs, Dropdown Menu
- Toast notifications
- Form (with react-hook-form)
- Data table with sorting/filtering

### Design System

```css
/* Colors */
--primary: #6366f1;      /* Indigo */
--primary-dark: #4f46e5;
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;
--gray-50: #f9fafb;
--gray-900: #111827;

/* Typography */
--font-sans: Inter, system-ui, sans-serif;
--font-mono: JetBrains Mono, monospace;

/* Spacing */
--spacing-unit: 4px;

/* Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
```

### API Integration

```typescript
// lib/api.ts
import { QueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = {
  // Projects
  getProjects: () => fetch(`${API_URL}/projects`),
  createProject: (data) => fetch(`${API_URL}/projects`, { method: 'POST', body: JSON.stringify(data) }),

  // Feedback
  getFeedback: (projectId, params) => fetch(`${API_URL}/projects/${projectId}/feedback?${params}`),
  getFeedbackDetail: (id) => fetch(`${API_URL}/feedback/${id}`),
  updateFeedback: (id, data) => fetch(`${API_URL}/feedback/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Config
  getWidgetConfig: (projectId) => fetch(`${API_URL}/projects/${projectId}/config`),
  updateWidgetConfig: (projectId, data) => fetch(`${API_URL}/projects/${projectId}/config`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// hooks/useFeedback.ts
export function useFeedback(projectId: string) {
  return useQuery({
    queryKey: ['feedback', projectId],
    queryFn: () => api.getFeedback(projectId),
  });
}
```

---

## Session Replay Player (Pro)

```typescript
// Use rrweb-player for playback
// https://github.com/rrweb-io/rrweb/tree/master/packages/rrweb-player

import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';

interface ReplayPlayerProps {
  events: any[];  // rrweb events array
}

function ReplayPlayer({ events }: ReplayPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && events.length > 0) {
      new rrwebPlayer({
        target: containerRef.current,
        props: {
          events,
          width: 800,
          height: 450,
          autoPlay: false,
        },
      });
    }
  }, [events]);

  return <div ref={containerRef} />;
}
```

---

## Development Timeline

### Week 1-2: Widget Core
- [ ] Project setup (Vite + TypeScript)
- [ ] Shadow DOM injection
- [ ] Floating button component
- [ ] Modal + form components
- [ ] URL pattern matching
- [ ] API submission

### Week 2-3: Widget Features
- [ ] Screenshot capture (html2canvas)
- [ ] Context capture
- [ ] Error handling
- [ ] Loading states
- [ ] Cross-browser testing

### Week 3-4: Dashboard Core
- [ ] Next.js project setup
- [ ] Auth flow (login, signup, forgot password)
- [ ] Layout (sidebar, header)
- [ ] Projects CRUD

### Week 4-5: Dashboard Feedback
- [ ] Feedback list with filters
- [ ] Feedback detail view
- [ ] Screenshot lightbox
- [ ] Status management
- [ ] Internal notes

### Week 5-6: Dashboard Settings
- [ ] Widget configuration UI
- [ ] URL pattern editor
- [ ] Theme customizer
- [ ] Install instructions
- [ ] Billing/subscription

### Week 6+: Polish
- [ ] Session replay player (Pro)
- [ ] Integrations page
- [ ] Team management
- [ ] Performance optimization
- [ ] Accessibility audit

---

## Testing Strategy

### Widget
- Unit tests: Vitest
- E2E: Playwright (test on real sites)
- Cross-browser: BrowserStack
- Performance: Lighthouse

### Dashboard
- Unit tests: Jest + React Testing Library
- E2E: Playwright
- Component tests: Storybook

---

## Deployment

### Widget
- Build: `npm run build` → dist/widget.js
- Upload to CDN (CloudFlare R2 or AWS CloudFront)
- Cache: 1 hour TTL (with versioning for updates)
- URL format: `https://zapbolt.io/widget/{scriptId}.js`

### Dashboard
- Deploy to Vercel
- Environment variables for API URL
- Preview deployments for PRs

---

## Success Criteria

- [ ] Widget loads in < 500ms
- [ ] Widget bundle < 20KB (without screenshot lib)
- [ ] Dashboard pages load in < 1s
- [ ] Lighthouse score > 90 (dashboard)
- [ ] Works on Chrome, Firefox, Safari, Edge
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Mobile-responsive dashboard

---

**Questions? Check the main PRD or ask the product team.**
