# Zapbolt

A feedback collection platform with an embeddable widget and management dashboard.

## Overview

Zapbolt consists of two main applications:

- **Widget** - A lightweight (~20KB) embeddable script for collecting user feedback with screenshot capture and session replay
- **Dashboard** - A Next.js web application for managing projects and reviewing feedback

## Tech Stack

| Component | Technology |
|-----------|------------|
| Monorepo | Turborepo + pnpm |
| Widget | Vanilla TypeScript + Vite |
| Dashboard | Next.js 14 (App Router) |
| UI Components | shadcn/ui + Tailwind CSS |
| State Management | TanStack Query (React Query) |
| Authentication | NextAuth.js v5 |
| Forms | React Hook Form + Zod |

## Project Structure

```
zapbolt/
├── apps/
│   ├── dashboard/          # Next.js dashboard application
│   └── widget/             # Embeddable feedback widget
├── packages/
│   └── shared/             # Shared types and constants
├── turbo.json              # Turborepo configuration
└── pnpm-workspace.yaml     # pnpm workspace configuration
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/zapbolt.git
cd zapbolt

# Install dependencies
pnpm install

# Build shared packages
pnpm build
```

### Environment Setup

Create environment files for the dashboard:

```bash
cp apps/dashboard/.env.example apps/dashboard/.env.local
```

Configure the following variables:

```env
# Authentication (required)
AUTH_SECRET=generate-a-random-secret-here

# API URL
API_URL=https://api.zapbolt.io
NEXT_PUBLIC_API_URL=https://api.zapbolt.io

# Stripe (optional, for billing)
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run specific app
pnpm --filter @zapbolt/dashboard dev
pnpm --filter @zapbolt/widget dev
```

The dashboard will be available at `http://localhost:3000` and the widget dev server at `http://localhost:5173`.

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @zapbolt/widget build
```

The widget bundle will be output to `apps/widget/dist/widget.js`.

## Widget Usage

### Basic Installation

Add the script tag to your website, just before the closing `</body>` tag:

```html
<script
  src="https://cdn.zapbolt.io/widget.js"
  data-project-id="your-project-id"
></script>
```

### Configuration Options

You can configure the widget via data attributes:

```html
<script
  src="https://cdn.zapbolt.io/widget.js"
  data-project-id="your-project-id"
  data-position="bottom-right"
  data-primary-color="#3b82f6"
  data-api-url="https://api.zapbolt.io"
></script>
```

Or initialize programmatically:

```html
<script src="https://cdn.zapbolt.io/widget.js"></script>
<script>
  Zapbolt.init({
    projectId: 'your-project-id',
    position: 'bottom-right',  // bottom-right | bottom-left | top-right | top-left
    primaryColor: '#3b82f6',
    onSubmit: (feedback) => {
      console.log('Feedback submitted:', feedback.id);
    },
    onError: (error) => {
      console.error('Submission failed:', error);
    }
  });
</script>
```

### Programmatic API

```javascript
// Open the feedback modal
Zapbolt.open();

// Close the feedback modal
Zapbolt.close();

// Check if modal is open
Zapbolt.isOpen();

// Destroy the widget
Zapbolt.destroy();
```

## Dashboard Features

### Projects
- Create and manage multiple projects
- Configure widget appearance (colors, position)
- Copy installation script
- Regenerate API keys
- URL pattern matching for widget display

### Feedback Management
- View all feedback with filters (status, category, priority)
- Search feedback by message content
- Screenshot lightbox view
- Session replay playback (Pro tier)
- Status workflow (New → In Progress → Resolved → Closed)
- Internal notes for team collaboration

### Billing
- Free, Pro, and Enterprise tiers
- Stripe integration for payments
- Usage tracking and limits

## Tier Limits

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Projects | 1 | 10 | Unlimited |
| Feedback/month | 50 | 1,000 | Unlimited |
| Screenshot capture | ✓ | ✓ | ✓ |
| Session replay | ✗ | ✓ | ✓ |
| Custom branding | ✗ | ✓ | ✓ |
| Webhooks | ✗ | ✓ | ✓ |
| API access | ✗ | ✓ | ✓ |
| Data retention | 30 days | 1 year | Unlimited |

## Development

### Scripts

```bash
pnpm dev          # Start development servers
pnpm build        # Build all packages
pnpm lint         # Run linting
pnpm test         # Run tests
pnpm clean        # Clean build artifacts
```

### Adding UI Components

The dashboard uses shadcn/ui. To add new components:

```bash
cd apps/dashboard
npx shadcn@latest add [component-name]
```

### Testing

```bash
# Run unit tests
pnpm test

# Run e2e tests (dashboard)
pnpm --filter @zapbolt/dashboard test:e2e

# Check widget bundle size
pnpm --filter @zapbolt/widget build
gzip -c apps/widget/dist/widget.js | wc -c  # Should be < 20KB
```

## Deployment

### Widget

Build and deploy the widget bundle to a CDN:

```bash
pnpm --filter @zapbolt/widget build
# Upload apps/widget/dist/widget.js to your CDN
```

### Dashboard

Deploy to Vercel or any Node.js hosting:

```bash
pnpm --filter @zapbolt/dashboard build
pnpm --filter @zapbolt/dashboard start
```

Or deploy to Vercel:

```bash
cd apps/dashboard
vercel
```

## API Requirements

The frontend expects a backend API with the following endpoints:

- `POST /auth/login` - User authentication
- `POST /auth/signup` - User registration
- `GET /auth/me` - Get current user
- `GET /projects` - List projects
- `POST /projects` - Create project
- `GET /projects/:id` - Get project
- `PATCH /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project
- `GET /projects/:id/feedback` - List feedback for project
- `GET /feedback/:id` - Get feedback item
- `PATCH /feedback/:id` - Update feedback
- `POST /widget/init` - Initialize widget config
- `POST /widget/submit` - Submit feedback

## License

MIT
