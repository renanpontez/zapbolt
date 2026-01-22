# Zapbolt Backend Agent Prompt

You are building the backend for **Zapbolt.io** - a B2B SaaS feedback widget. This document contains everything you need to build the backend independently.

---

## Product Overview

Zapbolt is a feedback collection tool. The backend serves:

1. **Widget API** - Public endpoints for feedback submission
2. **Dashboard API** - Authenticated endpoints for managing projects/feedback
3. **Widget Script** - Dynamic JavaScript served per client

---

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Fastify (or Express)
- **Language:** TypeScript
- **Database:** PostgreSQL 15+
- **ORM:** Prisma
- **Cache:** Redis (rate limiting, sessions)
- **File Storage:** AWS S3 or Cloudflare R2
- **Auth:** JWT (access tokens) + refresh tokens
- **Email:** Resend or SendGrid
- **Hosting:** Railway, Render, or AWS

---

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Entry point
│   ├── app.ts                # Fastify app setup
│   ├── config/
│   │   ├── env.ts            # Environment variables
│   │   └── constants.ts      # App constants
│   ├── routes/
│   │   ├── auth.ts           # Auth routes
│   │   ├── projects.ts       # Project CRUD
│   │   ├── feedback.ts       # Feedback management
│   │   ├── widget.ts         # Widget config + script
│   │   ├── uploads.ts        # Presigned URLs
│   │   └── billing.ts        # Stripe webhooks
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── projectController.ts
│   │   ├── feedbackController.ts
│   │   └── widgetController.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── projectService.ts
│   │   ├── feedbackService.ts
│   │   ├── emailService.ts
│   │   ├── storageService.ts # S3 operations
│   │   └── stripeService.ts
│   ├── middleware/
│   │   ├── auth.ts           # JWT verification
│   │   ├── rateLimit.ts      # Rate limiting
│   │   └── validate.ts       # Request validation
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── hash.ts
│   │   └── errors.ts
│   └── types/
│       └── index.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── scripts/
│   └── widget-template.js    # Widget JS template
├── tests/
├── Dockerfile
└── docker-compose.yml
```

---

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Client {
  id              String    @id @default(uuid())
  email           String    @unique
  passwordHash    String?
  name            String?
  companyName     String?
  plan            Plan      @default(FREE)
  stripeCustomerId String?  @unique
  stripeSubscriptionId String?
  emailVerified   Boolean   @default(false)
  emailVerifyToken String?
  passwordResetToken String?
  passwordResetExpires DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  projects        Project[]
  teamMemberships TeamMember[]

  @@map("clients")
}

model Project {
  id          String   @id @default(uuid())
  clientId    String
  name        String
  websiteUrl  String?
  scriptId    String   @unique @default(uuid())
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  client      Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  config      WidgetConfig?
  feedback    Feedback[]

  @@index([clientId])
  @@index([scriptId])
  @@map("projects")
}

model WidgetConfig {
  id          String   @id @default(uuid())
  projectId   String   @unique
  urlPatterns Json     @default("[]")
  theme       Json     @default("{\"primaryColor\": \"#6366f1\", \"position\": \"bottom-left\"}")
  features    Json     @default("{\"categoryEnabled\": true, \"emailEnabled\": true, \"screenshotEnabled\": true}")
  customCss   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("widget_configs")
}

model Feedback {
  id              String   @id @default(uuid())
  projectId       String

  // User input
  category        Category
  message         String
  email           String?
  priority        Priority?

  // Auto-captured context
  pageUrl         String
  userAgent       String?
  viewportWidth   Int?
  viewportHeight  Int?
  referrerUrl     String?
  contextJson     Json?

  // Attachments
  screenshotKey   String?
  sessionReplayKey String?

  // Management
  status          FeedbackStatus @default(NEW)
  internalNotes   String?

  // Rate limiting
  submitterIp     String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId, createdAt(sort: Desc)])
  @@index([status])
  @@index([category])
  @@map("feedback")
}

model TeamMember {
  id        String   @id @default(uuid())
  clientId  String
  email     String
  role      TeamRole @default(MEMBER)
  invitedAt DateTime @default(now())
  acceptedAt DateTime?

  client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@unique([clientId, email])
  @@map("team_members")
}

model RateLimitEntry {
  id          String   @id @default(uuid())
  projectId   String
  ip          String
  count       Int      @default(1)
  windowStart DateTime
  windowEnd   DateTime

  @@index([projectId, ip, windowEnd])
  @@map("rate_limit_entries")
}

// Enums
enum Plan {
  FREE
  PRO
  BUSINESS
}

enum Category {
  BUG
  FEATURE
  GENERAL
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

enum FeedbackStatus {
  NEW
  IN_REVIEW
  PLANNED
  IN_PROGRESS
  COMPLETED
  WONT_DO
}

enum TeamRole {
  ADMIN
  MEMBER
}
```

---

## API Endpoints

### Authentication

#### POST /api/auth/signup
```typescript
// Request
{
  email: string;      // required, valid email
  password: string;   // required, min 8 chars
  name?: string;
  companyName?: string;
}

// Response 201
{
  id: string;
  email: string;
  name: string;
  plan: "FREE";
  accessToken: string;
  refreshToken: string;
}

// Errors: 400 (validation), 409 (email exists)
```

#### POST /api/auth/login
```typescript
// Request
{
  email: string;
  password: string;
}

// Response 200
{
  id: string;
  email: string;
  name: string;
  plan: string;
  accessToken: string;   // JWT, expires 15min
  refreshToken: string;  // expires 7 days
}

// Errors: 401 (invalid credentials)
```

#### POST /api/auth/refresh
```typescript
// Request
{
  refreshToken: string;
}

// Response 200
{
  accessToken: string;
  refreshToken: string;
}
```

#### POST /api/auth/forgot-password
```typescript
// Request
{ email: string; }

// Response 200
{ message: "If email exists, reset link sent" }

// Always return 200 to prevent email enumeration
```

#### POST /api/auth/reset-password
```typescript
// Request
{
  token: string;
  password: string;
}

// Response 200
{ message: "Password reset successful" }
```

---

### Projects

**All routes require authentication (Bearer token)**

#### GET /api/projects
```typescript
// Response 200
{
  projects: [
    {
      id: string;
      name: string;
      websiteUrl: string;
      scriptId: string;
      isActive: boolean;
      feedbackCount: number;
      createdAt: string;
    }
  ],
  limit: number;  // based on plan (1, 3, unlimited)
}
```

#### POST /api/projects
```typescript
// Request
{
  name: string;        // required
  websiteUrl?: string;
}

// Response 201
{
  id: string;
  name: string;
  websiteUrl: string;
  scriptId: string;
  isActive: true;
  createdAt: string;
}

// Errors: 403 (plan limit reached)
```

#### GET /api/projects/:id
```typescript
// Response 200
{
  id: string;
  name: string;
  websiteUrl: string;
  scriptId: string;
  isActive: boolean;
  config: WidgetConfig;
  stats: {
    totalFeedback: number;
    thisWeek: number;
    byStatus: { NEW: 5, IN_REVIEW: 2, ... };
    byCategory: { BUG: 3, FEATURE: 4, ... };
  };
  createdAt: string;
}
```

#### PATCH /api/projects/:id
```typescript
// Request
{
  name?: string;
  websiteUrl?: string;
  isActive?: boolean;
}

// Response 200
{ ...updated project }
```

#### DELETE /api/projects/:id
```typescript
// Response 204 (no content)
// Cascade deletes: config, feedback, files
```

---

### Widget Config

#### GET /api/projects/:id/config
```typescript
// Response 200
{
  id: string;
  urlPatterns: [
    { pattern: "/app/*", type: "wildcard" },
    { pattern: "!/checkout/*", type: "exclusion" }
  ];
  theme: {
    primaryColor: "#6366f1";
    position: "bottom-left" | "bottom-right";
    iconUrl?: string;
    buttonText: string;
  };
  features: {
    categoryEnabled: boolean;
    emailEnabled: boolean;
    screenshotEnabled: boolean;
    priorityEnabled: boolean;
  };
}
```

#### PATCH /api/projects/:id/config
```typescript
// Request (partial update)
{
  urlPatterns?: Pattern[];
  theme?: Partial<Theme>;
  features?: Partial<Features>;
}

// Response 200
{ ...updated config }
```

---

### Feedback

#### GET /api/projects/:id/feedback
```typescript
// Query params
?page=1
&limit=25
&category=BUG
&status=NEW
&search=keyword
&sortBy=createdAt
&sortOrder=desc

// Response 200
{
  feedback: [
    {
      id: string;
      category: string;
      message: string;       // truncated to 100 chars
      email?: string;
      pageUrl: string;
      status: string;
      hasScreenshot: boolean;
      hasReplay: boolean;
      createdAt: string;
    }
  ];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### GET /api/feedback/:id
```typescript
// Response 200
{
  id: string;
  category: string;
  message: string;        // full message
  email?: string;
  priority?: string;
  pageUrl: string;
  userAgent?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  referrerUrl?: string;
  screenshotUrl?: string; // presigned URL, expires 1hr
  sessionReplayUrl?: string;
  status: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### PATCH /api/feedback/:id
```typescript
// Request
{
  status?: FeedbackStatus;
  internalNotes?: string;
}

// Response 200
{ ...updated feedback }
```

#### DELETE /api/feedback/:id
```typescript
// Response 204
// Also deletes S3 files
```

---

### Widget Public Endpoints (No Auth)

#### GET /widget/:scriptId.js
```typescript
// Serves dynamically generated JavaScript
// Content-Type: application/javascript
// Cache-Control: public, max-age=3600

// Response: JavaScript code with embedded config
```

#### POST /api/widget/feedback
```typescript
// Request (from widget)
{
  scriptId: string;      // required, identifies project
  category: string;      // required
  message: string;       // required, max 1000 chars
  email?: string;
  priority?: string;
  pageUrl: string;       // required
  userAgent?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  referrerUrl?: string;
  screenshotKey?: string;    // if screenshot uploaded
  sessionReplayKey?: string; // if replay uploaded (Pro)
}

// Headers
X-Forwarded-For: IP address (for rate limiting)

// Response 201
{
  id: string;
  message: "Feedback submitted successfully";
}

// Errors:
// 400 - validation error
// 404 - invalid scriptId
// 429 - rate limited
```

---

### File Uploads

#### POST /api/uploads/presigned
```typescript
// Request (authenticated for dashboard, or with scriptId for widget)
{
  type: "screenshot" | "replay";
  contentType: "image/jpeg" | "application/json";
  size: number;  // bytes
}

// Response 200
{
  uploadUrl: string;     // presigned PUT URL
  key: string;           // S3 object key to store in feedback
  expiresIn: 300;        // seconds
}
```

---

### Billing (Stripe)

#### POST /api/billing/create-checkout
```typescript
// Request
{
  plan: "PRO" | "BUSINESS";
  successUrl: string;
  cancelUrl: string;
}

// Response 200
{
  checkoutUrl: string;  // Stripe Checkout URL
}
```

#### POST /api/billing/portal
```typescript
// Response 200
{
  portalUrl: string;  // Stripe Customer Portal
}
```

#### POST /api/webhooks/stripe
```typescript
// Stripe webhook endpoint
// Events to handle:
// - checkout.session.completed → upgrade plan
// - customer.subscription.updated → plan change
// - customer.subscription.deleted → downgrade to free
// - invoice.payment_failed → notify client
```

---

## Widget Script Generation

```typescript
// services/widgetService.ts

export function generateWidgetScript(config: WidgetConfig, scriptId: string): string {
  return `
(function() {
  'use strict';

  const CONFIG = ${JSON.stringify({
    scriptId,
    apiUrl: process.env.API_URL,
    urlPatterns: config.urlPatterns,
    theme: config.theme,
    features: config.features,
  })};

  // URL pattern matching
  function shouldShow() {
    const path = window.location.pathname;
    const patterns = CONFIG.urlPatterns;

    // Check exclusions first
    for (const p of patterns.filter(x => x.pattern.startsWith('!'))) {
      if (matchPattern(p.pattern.slice(1), path)) return false;
    }

    // Check inclusions
    for (const p of patterns.filter(x => !x.pattern.startsWith('!'))) {
      if (matchPattern(p.pattern, path)) return true;
    }

    return patterns.length === 0; // Show on all pages if no patterns
  }

  function matchPattern(pattern, path) {
    if (pattern.endsWith('/*')) {
      return path.startsWith(pattern.slice(0, -1));
    }
    return pattern === path;
  }

  // Initialize widget
  if (shouldShow()) {
    // Load widget core
    const script = document.createElement('script');
    script.src = CONFIG.apiUrl + '/widget/core.js';
    script.async = true;
    script.onload = () => window.__zapbolt.init(CONFIG);
    document.head.appendChild(script);
  }
})();
`;
}
```

---

## Rate Limiting

```typescript
// middleware/rateLimit.ts

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

interface RateLimitConfig {
  windowMs: number;    // time window in ms
  maxRequests: number; // max requests per window
}

const LIMITS: Record<string, RateLimitConfig> = {
  feedbackSubmit: { windowMs: 60 * 60 * 1000, maxRequests: 5 },   // 5 per hour
  apiGeneral: { windowMs: 60 * 1000, maxRequests: 100 },          // 100 per minute
  authLogin: { windowMs: 15 * 60 * 1000, maxRequests: 5 },        // 5 per 15 min
};

export async function checkRateLimit(
  key: string,
  type: keyof typeof LIMITS
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const config = LIMITS[type];
  const windowKey = `ratelimit:${type}:${key}`;

  const current = await redis.incr(windowKey);
  if (current === 1) {
    await redis.pexpire(windowKey, config.windowMs);
  }

  const ttl = await redis.pttl(windowKey);
  const resetAt = new Date(Date.now() + ttl);

  return {
    allowed: current <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - current),
    resetAt,
  };
}
```

---

## Authentication Middleware

```typescript
// middleware/auth.ts

import jwt from 'jsonwebtoken';
import { FastifyRequest, FastifyReply } from 'fastify';

interface JwtPayload {
  sub: string;      // client ID
  email: string;
  plan: string;
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing authorization token' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    request.client = {
      id: payload.sub,
      email: payload.email,
      plan: payload.plan,
    };
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}

// JWT token generation
export function generateTokens(client: { id: string; email: string; plan: string }) {
  const accessToken = jwt.sign(
    { sub: client.id, email: client.email, plan: client.plan },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { sub: client.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}
```

---

## S3 Storage Service

```typescript
// services/storageService.ts

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET!;

export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
}

export async function getDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  await s3.send(command);
}

// Key format: {projectId}/screenshots/{feedbackId}.jpg
// Key format: {projectId}/replays/{feedbackId}.json
```

---

## Environment Variables

```bash
# .env.example

# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/zapbolt

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=another-secret-key-min-32-chars

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
S3_BUCKET=zapbolt-uploads

# Stripe
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_BUSINESS_PRICE_ID=price_xxx

# Email (Resend)
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@zapbolt.io

# Frontend URL (for CORS, emails)
FRONTEND_URL=http://localhost:3001
```

---

## Security Considerations

### Input Validation
```typescript
// Use Zod for all request validation
import { z } from 'zod';

const feedbackSchema = z.object({
  scriptId: z.string().uuid(),
  category: z.enum(['BUG', 'FEATURE', 'GENERAL']),
  message: z.string().min(1).max(1000),
  email: z.string().email().optional(),
  pageUrl: z.string().url().max(2000),
  // ... etc
});
```

### XSS Prevention
- Sanitize all user input before storage
- Use parameterized queries (Prisma handles this)
- Set Content-Type headers correctly

### CORS Configuration
```typescript
app.register(cors, {
  origin: [
    process.env.FRONTEND_URL,
    /\.zapbolt\.io$/,  // subdomains
  ],
  credentials: true,
});

// Widget endpoints allow any origin
app.register(cors, {
  origin: '*',
  prefix: '/widget',
});
```

### SQL Injection
- Prisma ORM prevents SQL injection by default
- Never use raw queries with user input

### Rate Limiting Headers
```typescript
// Return rate limit info in headers
reply.header('X-RateLimit-Limit', limit);
reply.header('X-RateLimit-Remaining', remaining);
reply.header('X-RateLimit-Reset', resetAt.toISOString());
```

---

## Development Timeline

### Week 1: Foundation
- [ ] Project setup (Fastify + TypeScript)
- [ ] Prisma schema + migrations
- [ ] Auth endpoints (signup, login, refresh)
- [ ] JWT middleware

### Week 2: Core API
- [ ] Projects CRUD
- [ ] Widget config endpoints
- [ ] Widget script generation
- [ ] S3 presigned URLs

### Week 3: Feedback
- [ ] Feedback submission endpoint
- [ ] Feedback list with filters
- [ ] Feedback detail + update
- [ ] Rate limiting

### Week 4: Polish
- [ ] Stripe billing integration
- [ ] Email service (verification, password reset)
- [ ] Slack integration webhook
- [ ] Error handling + logging

---

## Testing Strategy

```typescript
// Use Vitest for unit tests
// Use Supertest for integration tests

// tests/feedback.test.ts
import { describe, it, expect } from 'vitest';
import { app } from '../src/app';

describe('Feedback API', () => {
  it('should submit feedback successfully', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/widget/feedback',
      payload: {
        scriptId: 'test-script-id',
        category: 'BUG',
        message: 'Test feedback',
        pageUrl: 'https://example.com/test',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toHaveProperty('id');
  });

  it('should rate limit excessive submissions', async () => {
    // Submit 6 times (limit is 5)
    for (let i = 0; i < 6; i++) {
      const response = await app.inject({...});
      if (i < 5) {
        expect(response.statusCode).toBe(201);
      } else {
        expect(response.statusCode).toBe(429);
      }
    }
  });
});
```

---

## Deployment

### Docker
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Health Check
```typescript
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});
```

---

## Success Criteria

- [ ] All endpoints respond < 200ms (p95)
- [ ] 99.9% uptime
- [ ] Zero SQL injection vulnerabilities
- [ ] Rate limiting working correctly
- [ ] S3 uploads/downloads working
- [ ] Stripe webhooks processing correctly
- [ ] Comprehensive test coverage (> 80%)

---

**Questions? Check the main PRD or ask the product team.**
