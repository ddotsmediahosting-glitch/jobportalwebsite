# CLAUDE.md — ddotsmediajobs Job Portal

## Project overview
Full-stack UAE job portal built with Express.js + React 18.
Working directory is always `c:\Users\web\Desktop\ddotsmediajobs\jobportalwebsite\`.
The root `ddotsmediajobs/` folder contains an older copy — do NOT work there.

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Express.js + TypeScript + Prisma ORM |
| Frontend | React 18 + Vite + TailwindCSS + React Query |
| Database | MariaDB 11 |
| Cache | Redis 7 |
| AI | Anthropic Claude (via `ANTHROPIC_API_KEY`) |
| Auth | JWT (access 15m + refresh 7d) |
| Storage | Local (`backend/uploads/`) or AWS S3 |

---

## Directory structure

```
jobportalwebsite/
├── backend/          Express API (TypeScript + Prisma)
│   └── src/
│       ├── modules/  Feature modules (auth, jobs, employers, …)
│       └── lib/      Shared utilities (ai, cache, seo, mailer, …)
├── frontend/         React 18 + Vite SPA
│   └── src/
│       ├── pages/    Route-level components (admin/, employer/, public/, ai/, cv/)
│       ├── components/
│       └── routes/index.tsx   All app routes
├── shared/           Zod schemas + TypeScript types shared by both
├── docker-compose.yml
└── .env
```

---

## Docker (dev/prod)

```bash
# Start
docker compose up -d

# Rebuild after code changes
docker compose up --build -d

# Restart single service
docker compose restart api

# Seed database
docker exec jobportalwebsite-api-1 sh -c "cd /app/backend && npx tsx prisma/seed.ts"
```

**Ports:**
- Frontend: http://localhost:3001
- API: http://localhost:4001
- MariaDB: localhost:3307
- Redis: localhost:6380

---

## Seeded credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@uaejobs.local | Admin#12345 |
| Job Seeker | seeker@example.com | Seeker#12345 |
| Employer | employer1@techcorp.ae | Employer#123 |

---

## Backend modules (22 total)

`auth`, `users`, `jobs`, `applications`, `employers`, `categories`, `admin`, `ai`, `cv`, `billing`, `notifications`, `marketing`, `whatsapp`, `whatsapp-links`, `reviews`, `salary`, `seo`, `candidates`, `user-jobs`, `content`, `community`, `market`

Each module follows the pattern: `*.router.ts` → `*.controller.ts` → `*.service.ts`

---

## Frontend pages

- `pages/admin/` — Dashboard, Analytics, Users, Employers, Jobs, Categories, Reports, Subscriptions, Marketing, WhatsAppBot, AuditLogs, Community, Settings
- `pages/employer/` — Dashboard, QuickPost (AI auto-post), PostJob, ManageJobs, ApplicationsPipeline, CompanyProfile, Team, Billing, Analytics, CandidateSearch, InterviewScheduler, SocialMarketing, AIInsights
- `pages/ai/` — CareerAdvisor, InterviewPrep, SalaryInsights
- `pages/cv/` — CVAnalyzer, CVBuilder
- `pages/public/` — Home, Jobs, JobDetail, Login, Register, Profile, Applications, SavedJobs, Community, Companies, SalaryExplorer, TrendingJobs, WhatsAppGroups, Blog

---

## Key env vars to configure

```bash
# SMTP (required for email verification)
SMTP_HOST=smtp.gmail.com        # or smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@ddotsmediajobs.com

# AI features
ANTHROPIC_API_KEY=sk-ant-...

# JWT
JWT_SECRET=...
JWT_REFRESH_SECRET=...
```

---

## Common tasks

```bash
# TypeScript check
npx tsc --noEmit -p backend/tsconfig.json
npx tsc --noEmit -p frontend/tsconfig.json

# Prisma
cd backend && npx prisma migrate dev     # run migrations
cd backend && npx prisma studio          # GUI browser

# Install deps
npm install          # root workspace
```

---

## Coding conventions

- Backend errors: throw `AppError(statusCode, message)` or `ForbiddenError(message)`
- All API responses: `{ success: true, data: ... }` or `{ success: false, error: "..." }`
- Frontend API calls: use `api.get/post/put/delete` from `src/lib/api.ts`
- Error display: `getApiError(err)` from `src/lib/api.ts` → pass to `toast.error()`
- Employer routes protected by: `authenticate` + `requireRole('EMPLOYER', 'ADMIN', 'SUB_ADMIN')`
- Admin routes protected by: `authenticate` + `requireRole('ADMIN', 'SUB_ADMIN')`
- AI feature guard: always check `ANTHROPIC_API_KEY` is set before calling AI endpoints
