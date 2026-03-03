# UAE Job Portal (Monorepo)

Production-oriented full-stack UAE job portal with RBAC, job lifecycle, applications pipeline, admin controls, Prisma/PostgreSQL, React frontend, OpenAPI docs, Docker, and background jobs.

## Stack
- Backend: Node.js + TypeScript + Express + Prisma + PostgreSQL
- Frontend: React + TypeScript + Vite + React Router + React Query + Tailwind
- Auth: JWT access/refresh + bcrypt + optional OTP field
- Queues: BullMQ + Redis
- Docs: Swagger/OpenAPI at `/api/docs`
- Tests: Jest + Supertest (API smoke), Playwright smoke (web)

## Monorepo Structure
- `apps/api` Express API
- `apps/web` React web app (public + employer + admin routes)
- `packages/shared` shared types + zod schemas
- `docker-compose.yml` postgres, redis, api, web

## Quick Start (Docker)
1. Copy env:
   - `cp .env.example .env` (or on Windows: `Copy-Item .env.example .env`)
2. Run:
   - `docker compose up --build`
3. API:
   - `http://localhost:4000/health`
   - `http://localhost:4000/api/docs`
4. Web:
   - `http://localhost:5173`

## Quick Start (Local)
1. `npm ci`
2. `npm run prisma:generate -w @uaejobs/api`
3. Ensure Postgres + Redis are running and `.env` is set.
4. `npm run prisma:push -w @uaejobs/api`
5. `npm run seed -w @uaejobs/api`
6. Run API and web in separate terminals:
   - `npm run dev:api`
   - `npm run dev:web`

## Environment Variables
See `.env.example` for full list.

Required core values:
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `VITE_API_URL`

## Default Seed Accounts
- Super Admin:
  - Email: `admin@uaejobs.local`
  - Password: `Admin#12345`
- Seed Employer User:
  - Email: `hr@techme.ae`
  - Password: `Employer#123`

## Core Implemented Modules
- Auth (`/api/v1/auth` + `/api/v1/auth/admin/login`)
- Users/profile/saved jobs/export/delete account
- Categories (tree, reorder, admin CRUD)
- Jobs (create, search/filter/full-text query, detail, publish, clone, report)
- Applications (apply + status pipeline)
- Employers (profile, team invites, analytics, subscriptions)
- Files (CV, trade license, logo upload)
- Notifications, optional messaging
- Admin (`/admin/api/v1/*`): users, verification, moderation, reports, subscriptions, audit, settings
- Background jobs: email, alerts, cleanup scheduler via BullMQ

## Routes Overview
- Public/Seeker pages: `/`, `/jobs`, `/jobs/:slug`, `/profile`, `/resume`, `/applications`, `/saved-jobs`
- Employer pages: `/employer`, `/employer/company`, `/employer/post-job`, `/employer/jobs`, `/employer/pipeline`, `/employer/billing`, `/employer/team`
- Admin pages: `/admin`, `/admin/users`, `/admin/employers`, `/admin/jobs`, `/admin/categories`, `/admin/reports`, `/admin/settings`, `/admin/audit`
- SEO category routes: `/c/:categorySlug`, `/c/:categorySlug/:subSlug`

## Testing
- API:
  - `npm run test -w @uaejobs/api`
- Web Playwright smoke:
  - `npm run test:e2e -w @uaejobs/web`

## Screenshot Placeholders
- `docs/screenshots/home.png`
- `docs/screenshots/jobs-list.png`
- `docs/screenshots/employer-dashboard.png`
- `docs/screenshots/admin-dashboard.png`

## Notes
- Billing provider is interface-based with mock provider by default.
- Storage is adapter-based with local default and S3-compatible placeholder.
- Employer verification requirement for publishing is configurable via env flag.
