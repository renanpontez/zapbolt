# Zapbolt.io - Product Requirements Document (PRD)

**Version:** 1.0
**Last Updated:** January 2026
**Status:** MVP Planning

---

## Executive Summary

Zapbolt is a lightweight B2B SaaS feedback widget that enables companies to collect bug reports, feature requests, and suggestions directly from their users—without disrupting the user experience. The widget embeds via a simple script tag and captures visual context (screenshots) automatically. Premium tiers include session replay to see exactly what users experienced before submitting feedback.

**Tagline:** "Feedback at lightning speed"

**Core Value Proposition:** 5-minute integration, visual context with every submission, affordable pricing starting free.

---

## Problem Statement

### The Problem
Product teams struggle to collect actionable, contextual feedback from users:

1. **Fragmented feedback channels** - Feedback arrives via email, support tickets, social media, Slack—scattered and unorganized
2. **Lack of context** - Users say "it's broken" but can't explain what they saw or did
3. **High friction** - Existing tools require users to leave the app, create accounts, or fill lengthy forms
4. **Expensive solutions** - Enterprise tools like Userback ($99+/mo) or session replay tools ($300+/mo) price out startups

### The Impact
- Engineers waste hours reproducing bugs without visual context
- Product teams miss valuable feature insights buried in support tickets
- Users give up on reporting issues due to friction
- Small teams can't afford proper feedback tooling

### Our Solution
Zapbolt provides a lightweight, embeddable feedback widget that:
- Installs in 5 minutes (single script tag)
- Captures screenshots automatically
- Records session replays (Pro tier) for full context
- Costs $0-99/mo vs $200-500/mo for alternatives

---

## Target Users & Personas

### Primary Persona: Developer Dave
**Role:** Full-stack developer at a 10-50 person SaaS startup
**Age:** 25-35
**Goals:**
- Ship features quickly without constant interruptions
- Get clear bug reports with reproduction steps
- Minimal time spent on tooling setup

**Pain Points:**
- Spends 30% of bug-fixing time just reproducing issues
- Hates complex integrations that require days of work
- Current solution is a shared spreadsheet or email inbox

**Quote:** "Just show me what the user saw when it broke."

---

### Secondary Persona: Product Manager Paula
**Role:** PM at a growing B2B SaaS (50-200 employees)
**Age:** 28-40
**Goals:**
- Centralize all user feedback in one place
- Prioritize features based on user demand
- Close the feedback loop with users

**Pain Points:**
- Feedback is scattered across Intercom, email, and Slack
- Can't quantify which features users want most
- No way to show users their feedback was heard

**Quote:** "I need to know what users actually want, not what sales thinks they want."

---

### Tertiary Persona: Agency Owner Alex
**Role:** Runs a web development agency with 5-15 clients
**Age:** 30-45
**Goals:**
- Collect client feedback during development/UAT
- Professional-looking feedback portal per client
- Bill clients for premium features

**Pain Points:**
- Each client has different feedback preferences
- Managing multiple feedback channels is chaotic
- Free tools look unprofessional

**Quote:** "I need one tool that works for all my clients."

---

## Pricing Tiers

| Tier | Price | Submissions | Projects | Features |
|------|-------|-------------|----------|----------|
| **Free** | $0/mo | 50/mo | 1 | Widget, screenshots, basic dashboard |
| **Pro** | $29/mo | Unlimited | 3 | + Session replays, integrations, priority support |
| **Business** | $99/mo | Unlimited | Unlimited | + Custom branding, API access, SSO, dedicated support |

---

## User Stories by Epic

### Epic 1: Client Onboarding & Project Setup

#### Story 1.1: Sign Up
```
As a potential customer,
I want to create an account quickly,
So that I can start collecting feedback immediately.

Acceptance Criteria:
- Sign up with email/password or Google OAuth
- Email verification required before full access
- Onboarding flow guides to first project creation
- Time to first project: < 2 minutes
```

#### Story 1.2: Create Project
```
As a client,
I want to create a project for my application,
So that I can configure and install the feedback widget.

Acceptance Criteria:
- Enter project name and website URL
- Receive unique project ID (e.g., "abc123")
- See installation instructions immediately after creation
- Can create multiple projects (based on plan limits)
```

#### Story 1.3: Install Widget
```
As a developer,
I want to install the widget with a single script tag,
So that I can start collecting feedback in minutes.

Acceptance Criteria:
- Copy script tag: <script src="https://zapbolt.io/widget/abc123.js" async></script>
- Widget loads within 2 seconds of page load
- No console errors on clean installation
- Works with React, Vue, Angular, vanilla JS sites
```

---

### Epic 2: Widget Configuration

#### Story 2.1: Configure URL Patterns
```
As a client,
I want to specify which pages show the feedback widget,
So that it only appears where relevant.

Acceptance Criteria:
- Add URL patterns: exact ("/dashboard"), wildcard ("/app/*"), regex ("/product/\d+")
- Add exclusion patterns: "!/checkout/*"
- Test patterns with URL input field
- Changes reflect within 5 minutes (CDN cache)
```

#### Story 2.2: Customize Appearance
```
As a client,
I want to customize the widget's look,
So that it matches my brand.

Acceptance Criteria:
- Set primary color (hex picker)
- Choose position: bottom-left or bottom-right
- Upload custom icon (SVG/PNG, max 50KB)
- Set button tooltip text
- Live preview before saving
```

#### Story 2.3: Configure Form Fields
```
As a client,
I want to configure what fields appear in the feedback form,
So that I collect the right information.

Acceptance Criteria:
- Toggle: Category dropdown (Bug/Feature/General)
- Toggle: Email field (optional for users)
- Toggle: Screenshot capture button
- Toggle: Priority selector (Low/Medium/High)
- All toggles on by default
```

---

### Epic 3: Widget Display & Interaction

#### Story 3.1: Display Floating Button
```
As an end user,
I want to see a subtle feedback button,
So that I can easily submit feedback when needed.

Acceptance Criteria:
- Circular button appears in configured position
- Button has hover effect and tooltip
- Button uses Shadow DOM (CSS isolation)
- Z-index ensures visibility above page content
- Respects configured URL patterns
```

#### Story 3.2: Open Feedback Form
```
As an end user,
I want to click the button to open a feedback form,
So that I can describe my feedback.

Acceptance Criteria:
- Modal opens centered on screen
- Form contains: category, message (required), email (optional)
- Close via X button, clicking outside, or ESC key
- Body scroll locked when modal open
- Focus trapped within modal (accessibility)
```

#### Story 3.3: Capture Screenshot
```
As an end user,
I want to capture a screenshot of the current page,
So that I can show what I'm experiencing.

Acceptance Criteria:
- "Capture Screenshot" button in form
- Screenshot captured via html2canvas
- Preview thumbnail shown after capture
- Option to remove and retake
- Screenshot captured at 0.5x scale (max 500KB)
```

#### Story 3.4: Submit Feedback
```
As an end user,
I want to submit my feedback,
So that the product team receives it.

Acceptance Criteria:
- Submit button shows loading state
- Success message displayed for 3 seconds
- Modal closes after success
- Error message if submission fails (with retry option)
- Rate limited: 5 submissions per hour per IP
```

---

### Epic 4: Automatic Context Capture

#### Story 4.1: Capture Page Context
```
As a client,
I want automatic technical context with each submission,
So that I can reproduce issues easily.

Acceptance Criteria:
- Capture: current URL, user agent, viewport size, timestamp
- Capture: referrer URL, browser language
- Store as JSON in feedback record
- Display in "Technical Details" section of dashboard
```

#### Story 4.2: Session Replay (Pro)
```
As a client on Pro plan,
I want session replays attached to feedback,
So that I can see exactly what the user experienced.

Acceptance Criteria:
- Record last 60 seconds of user session (ring buffer)
- Use rrweb library for DOM recording
- Recording attached when user submits feedback
- Playback available in dashboard with play/pause/scrub
- Max recording size: 2MB compressed
- Sensitive inputs masked automatically
```

---

### Epic 5: Dashboard - Feedback Management

#### Story 5.1: View Feedback List
```
As a client,
I want to see all feedback in a dashboard,
So that I can triage and respond.

Acceptance Criteria:
- Table with: ID, category, message preview, URL, date, status
- Pagination: 25 items per page
- Filter by: category, status, date range
- Search by message text
- Sort by: newest first (default), oldest first
```

#### Story 5.2: View Feedback Details
```
As a client,
I want to view full details of a submission,
So that I can understand the complete context.

Acceptance Criteria:
- Full message text
- Screenshot (if attached) - click to enlarge
- Session replay player (if Pro)
- Technical details: URL, browser, viewport, timestamp
- Status dropdown to update
- Internal notes field (not visible to users)
```

#### Story 5.3: Update Feedback Status
```
As a client,
I want to update feedback status,
So that I can track progress.

Acceptance Criteria:
- Statuses: New, In Review, Planned, In Progress, Completed, Won't Do
- Status change saves immediately
- Optional: Email notification to user (if email provided)
- Status history logged (audit trail)
```

---

### Epic 6: Integrations (Pro+)

#### Story 6.1: Slack Notifications
```
As a client,
I want Slack notifications for new feedback,
So that my team responds quickly.

Acceptance Criteria:
- Connect Slack workspace via OAuth
- Select channel for notifications
- Configure: notify all feedback, or filter by category/priority
- Message includes: title, category, URL, link to dashboard
```

#### Story 6.2: Webhook Integration
```
As a client,
I want to send feedback to webhooks,
So that I can integrate with my own systems.

Acceptance Criteria:
- Add webhook URL
- Select events: new feedback, status change
- Payload includes full feedback object as JSON
- Retry failed webhooks 3 times
```

---

### Epic 7: Account & Billing

#### Story 7.1: Manage Subscription
```
As a client,
I want to manage my subscription,
So that I can upgrade/downgrade as needed.

Acceptance Criteria:
- View current plan and usage
- Upgrade to Pro or Business (Stripe Checkout)
- Downgrade with prorated credit
- Cancel subscription (keeps data for 30 days)
- View billing history and download invoices
```

#### Story 7.2: Team Management (Business)
```
As a Business client,
I want to invite team members,
So that my team can access the dashboard.

Acceptance Criteria:
- Invite via email
- Roles: Admin (full access), Member (view + manage feedback)
- Remove team members
- SSO via SAML (Business only)
```

---

## Technical Requirements

### Widget Technical Specs
- **Bundle size:** < 20KB initial, < 100KB with screenshot library
- **Loading:** Async/defer, non-blocking
- **Isolation:** Shadow DOM for CSS isolation
- **Compatibility:** Chrome, Firefox, Safari, Edge (last 2 versions)
- **Screenshot:** html2canvas library, lazy-loaded on demand
- **Session replay:** rrweb library (Pro only), lazy-loaded

### Dashboard Technical Specs
- **Framework:** Next.js 14+ with App Router
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** React Query for server state
- **Auth:** NextAuth.js with JWT
- **Hosting:** Vercel

### API Technical Specs
- **Framework:** Node.js + Express or Fastify
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT tokens + API keys
- **Rate limiting:** Redis-based
- **File storage:** AWS S3 or Cloudflare R2

---

## Database Schema

### Tables

```sql
-- Clients (users who sign up for Zapbolt)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  company_name VARCHAR(255),
  plan VARCHAR(50) DEFAULT 'free', -- free, pro, business
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects (one client can have multiple projects)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  website_url VARCHAR(500),
  script_id VARCHAR(32) UNIQUE NOT NULL, -- used in script URL
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Widget configurations
CREATE TABLE widget_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  url_patterns JSONB DEFAULT '[]',
  theme JSONB DEFAULT '{"primaryColor": "#6366f1", "position": "bottom-left"}',
  features JSONB DEFAULT '{"categoryEnabled": true, "emailEnabled": true, "screenshotEnabled": true}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Feedback submissions
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- User input
  category VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  email VARCHAR(255),
  priority VARCHAR(20),

  -- Auto-captured context
  page_url TEXT NOT NULL,
  user_agent TEXT,
  viewport_width INTEGER,
  viewport_height INTEGER,
  referrer_url TEXT,

  -- Attachments
  screenshot_key TEXT, -- S3 key
  session_replay_key TEXT, -- S3 key (Pro only)

  -- Management
  status VARCHAR(50) DEFAULT 'new',
  internal_notes TEXT,

  -- Rate limiting
  submitter_ip VARCHAR(45),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_script_id ON projects(script_id);
CREATE INDEX idx_feedback_project_id ON feedback(project_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX idx_feedback_status ON feedback(status);
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Create account |
| POST | /api/auth/login | Login, returns JWT |
| POST | /api/auth/logout | Invalidate session |
| POST | /api/auth/forgot-password | Send reset email |
| POST | /api/auth/reset-password | Reset with token |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List client's projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project details |
| PATCH | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |

### Widget Config
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects/:id/config | Get widget config |
| PATCH | /api/projects/:id/config | Update widget config |

### Feedback
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects/:id/feedback | List feedback (paginated) |
| POST | /api/feedback | Submit feedback (public, from widget) |
| GET | /api/feedback/:id | Get feedback details |
| PATCH | /api/feedback/:id | Update status/notes |
| DELETE | /api/feedback/:id | Delete feedback |

### Widget Script
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /widget/:scriptId.js | Serve widget script (CDN cached) |

### File Uploads
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/uploads/screenshot | Get presigned upload URL |
| POST | /api/uploads/replay | Get presigned upload URL (Pro) |

---

## Success Metrics

### Product Metrics
| Metric | Target (Month 3) | Target (Month 6) |
|--------|------------------|------------------|
| Signups | 500 | 2,000 |
| Active projects | 200 | 800 |
| Feedback submissions | 5,000 | 25,000 |
| Free → Pro conversion | 5% | 8% |
| Monthly churn | < 5% | < 3% |

### Technical Metrics
| Metric | Target |
|--------|--------|
| Widget load time | < 500ms (p95) |
| API response time | < 200ms (p95) |
| Uptime | 99.9% |
| Screenshot success rate | > 90% |

---

## MVP Scope

### In Scope (V1.0)
- Client signup/login
- Project creation (1 for free, 3 for Pro)
- Widget script generation
- URL pattern configuration
- Widget appearance customization
- Feedback form (category, message, email)
- Screenshot capture
- Automatic context capture
- Dashboard: list, view, filter, search feedback
- Status management
- Slack integration (Pro)

### Out of Scope (Future)
- Session replay (V1.1 - Pro feature)
- Team members (V1.2 - Business feature)
- Custom branding/white-label (V1.2)
- API access (V1.2)
- SSO/SAML (V2.0)
- Mobile SDK (V2.0)
- Public roadmap/voting (V2.0)
- AI categorization (V3.0)

---

## Roadmap

### V1.0 - MVP (Week 1-4)
- Core widget functionality
- Basic dashboard
- Free + Pro tiers

### V1.1 - Session Replay (Week 5-8)
- rrweb integration
- Replay player in dashboard
- Storage optimization

### V1.2 - Business Features (Week 9-12)
- Team management
- Custom branding
- API access
- Advanced integrations (Jira, Linear)

### V2.0 - Scale (Month 4-6)
- SSO/SAML
- Public roadmap
- Mobile SDK
- Advanced analytics

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CSP blocking widget | High | High | Documentation, iframe fallback |
| html2canvas failures | Medium | Medium | Fallback to manual upload |
| Session replay storage costs | Medium | Medium | Compression, 30-day retention |
| Low conversion free → paid | Medium | High | Usage-based upgrade prompts |
| Competitor response | Low | Medium | Fast iteration, niche focus |

---

## Open Questions

1. Should we offer annual billing discount? (20% off)
2. What's the session replay retention period? (30 days proposed)
3. Should free tier have Zapbolt branding on widget?
4. Do we need GDPR/cookie consent features at launch?

---

**Document Owner:** Product Team
**Next Review:** After MVP launch
