# UAE Job Portal

A production-ready full-stack job portal built for the UAE market.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, TypeScript, Express, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7, BullMQ |
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| Auth | JWT (access + refresh token rotation) |
| Storage | Local filesystem (S3-compatible adapter included) |
| Billing | Mock provider (Stripe adapter included) |
| Email | Nodemailer (SMTP) via BullMQ queue |
| Monorepo | npm workspaces |
| Containers | Docker Compose |

---

## Default Accounts (after seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@uaejobs.local | Admin#12345 |
| Employer | acme@example.com | Test#12345 |
| Employer | techcorp@example.com | Test#12345 |
| Seeker | seeker@example.com | Test#12345 |

---

## Quick Start (Docker)

```bash
cd uae-job-portal

# Copy env file and fill in secrets
cp .env.example .env

# Build and start all services
docker compose up --build -d

# Run migrations + seed
docker compose exec api npx prisma migrate deploy
docker compose exec api npx ts-node prisma/seed.ts
```

- Frontend: http://localhost:5173
- API: http://localhost:4000
- API Docs (Swagger): http://localhost:4000/api/docs

---

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL 16 running locally (or Docker)
- Redis 7 running locally (or Docker)

### Setup

```bash
# Start just the infrastructure
docker compose up postgres redis -d

# Install all workspace dependencies
cd uae-job-portal
npm install

# Copy and configure env
cp .env.example .env
# Edit .env — set DATABASE_URL, REDIS_URL, JWT secrets, SMTP

# Run DB migrations
cd apps/api
npx prisma migrate dev

# Seed database
npx ts-node prisma/seed.ts

# Start everything in dev mode (from monorepo root)
cd ../..
npm run dev
```

This runs `apps/api` on port 4000 and `apps/web` on port 5173 concurrently.

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/uaejobs

# Redis
REDIS_URL=redis://localhost:6379

# JWT — generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=<64-char-hex>
JWT_REFRESH_SECRET=<64-char-hex>

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173

# SMTP (use Mailtrap for dev)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=<user>
SMTP_PASS=<pass>
SMTP_FROM=noreply@uaejobs.local

# Storage: local | s3
STORAGE_PROVIDER=local

# AWS S3 (only if STORAGE_PROVIDER=s3)
AWS_BUCKET_NAME=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Billing: mock | stripe
BILLING_PROVIDER=mock

# Stripe (only if BILLING_PROVIDER=stripe)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Seed defaults
SEED_ADMIN_EMAIL=admin@uaejobs.local
SEED_ADMIN_PASSWORD=Admin#12345
```

---

## Project Structure

```
uae-job-portal/
├── apps/
│   ├── api/                     # Express API
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Full DB schema
│   │   │   └── seed.ts          # Seed data
│   │   ├── src/
│   │   │   ├── config/          # Typed config
│   │   │   ├── lib/             # jwt, storage, queue, email
│   │   │   ├── middleware/      # auth, rbac, validation, errorHandler
│   │   │   ├── modules/
│   │   │   │   ├── auth/        # register, login, refresh, OTP, password reset
│   │   │   │   ├── jobs/        # CRUD, search, FTS, slug, quota
│   │   │   │   ├── applications/# pipeline, kanban, status updates
│   │   │   │   ├── seeker/      # profile, resumes, saved jobs, alerts
│   │   │   │   ├── employer/    # profile, team, billing
│   │   │   │   └── admin/       # users, employers, jobs, reports, audit, settings, CMS
│   │   │   ├── workers/         # BullMQ email, job-alerts, cleanup workers
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   └── tests/               # Jest + Supertest
│   └── web/                     # React SPA
│       └── src/
│           ├── components/      # UI kit + layout + shared components
│           ├── contexts/        # AuthContext
│           ├── hooks/           # useDebounce
│           ├── lib/             # axios instance with token refresh
│           ├── pages/
│           │   ├── public/      # Home, Jobs, JobDetail, Auth, Profile, etc.
│           │   ├── employer/    # Dashboard, PostJob, ManageJobs, Pipeline, etc.
│           │   └── admin/       # Dashboard, Users, Employers, Jobs, Categories, etc.
│           ├── routes/          # React Router v6 with lazy loading + guards
│           ├── App.tsx
│           └── main.tsx
└── packages/
    └── shared/                  # Shared Zod schemas + TypeScript types
```

---

## API Overview

Base URL: `/api/v1`

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register (SEEKER or EMPLOYER) |
| POST | `/auth/login` | Login → access + refresh token |
| POST | `/auth/refresh` | Rotate refresh token |
| POST | `/auth/logout` | Invalidate refresh token |
| GET | `/auth/me` | Current user |
| POST | `/auth/verify-email` | Verify OTP |
| POST | `/auth/forgot-password` | Send reset email |
| POST | `/auth/reset-password` | Reset with token |

### Jobs (public)
| Method | Path | Description |
|---|---|---|
| GET | `/jobs` | List jobs (filters, FTS, pagination) |
| GET | `/jobs/:slug` | Job detail |

### Seeker
| Method | Path | Description |
|---|---|---|
| GET/PUT | `/seeker/profile` | Seeker profile |
| POST/DELETE | `/seeker/resumes` | Upload/delete resume |
| PATCH | `/seeker/resumes/:id/primary` | Set primary resume |
| POST | `/jobs/:slug/apply` | Apply to a job |
| GET | `/seeker/applications` | My applications |
| POST/DELETE | `/seeker/saved-jobs/:jobId` | Save/unsave job |
| GET | `/seeker/saved-jobs` | Saved jobs list |

### Employer
| Method | Path | Description |
|---|---|---|
| GET/PUT | `/employer/profile` | Company profile |
| POST | `/employer/jobs` | Create job |
| GET/PUT/DELETE | `/employer/jobs/:id` | Manage job |
| PATCH | `/employer/jobs/:id/publish` | Publish job |
| GET | `/employer/applications` | Applications list |
| PATCH | `/employer/applications/:id/status` | Update status |
| GET/POST/DELETE | `/employer/team` | Team management |
| GET/POST | `/employer/billing` | Billing + subscribe |

### Admin
| Method | Path | Description |
|---|---|---|
| GET | `/admin/stats` | Platform stats |
| GET/PATCH/DELETE | `/admin/users/:id` | User management |
| GET/PATCH | `/admin/employers/:id/verify` | Employer verification |
| GET/PATCH | `/admin/jobs/:id/moderate` | Job moderation |
| GET/POST/PUT/DELETE | `/admin/categories` | Category tree |
| GET/PATCH | `/admin/reports/:id/resolve` | Report resolution |
| GET | `/admin/audit-logs` | Audit log |
| GET/PUT | `/admin/settings/:key` | Site settings |
| GET/POST/PUT/DELETE | `/admin/content-pages` | CMS |

Full interactive docs: http://localhost:4000/api/docs

---

## Running Tests

```bash
cd apps/api
npm test
```

Tests cover: registration, login, email verification, token refresh, duplicate detection, validation.

---

## Features

- **UAE-specific**: 7 Emirates filter, AED salary, visa status, work mode (onsite/remote/hybrid)
- **RBAC**: SEEKER, EMPLOYER, ADMIN, SUB_ADMIN roles with middleware enforcement
- **Application pipeline**: SUBMITTED → VIEWED → SHORTLISTED → INTERVIEW → OFFER → HIRED/REJECTED
- **Subscription plans**: FREE / STANDARD (499 AED/mo) / PREMIUM (1,299 AED/mo) with job post quotas
- **Employer verification**: Trade license upload + admin review flow
- **Job moderation**: Optional approval gate (`jobs_require_approval` setting)
- **Full-text search**: PostgreSQL `to_tsvector` across title, description, requirements
- **Category tree**: Unlimited depth, jobs can belong to any category
- **Email queue**: OTP, verification, password reset, application status notifications
- **Job alerts**: Daily BullMQ cron matches seeker preferences
- **Audit log**: All admin actions recorded with metadata
- **CMS**: Admin-managed static content pages (About, Privacy, Terms)
- **Storage adapter**: Switch between local and S3 via env var
- **Billing adapter**: Switch between mock and Stripe via env var
