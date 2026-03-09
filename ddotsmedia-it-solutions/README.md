# Ddotsmedia IT Solutions

Premium full-stack company website scaffold for Ddotsmedia IT Solutions, built with Next.js, React, Tailwind CSS, and a Node-based server runtime via the Next App Router.

## Current Status

Phase 1, Phase 2, and Phase 3 are complete.

Implemented in the scaffold:
- Next.js App Router project foundation
- premium global design system, layout shell, and motion-enabled section components
- full marketing page layer for homepage, about, services, portfolio, blog, careers, contact, FAQ, industries, AI solutions, consultation, and legal pages
- reusable config and data modules
- file-backed admin panel for editable site content, collections, and theme colors
- client-side inquiry, consultation, and career application forms
- API route skeletons for contact, consultation, newsletter, careers, and AI endpoints
- validation modules with Zod
- initial AI provider abstraction with a mock provider
- test tooling with Vitest and Playwright
- Docker and localhost runtime files

## Stack

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`
- `Framer Motion`
- `React Hook Form`
- `Zod`
- `Vitest`
- `Playwright`
- `Docker`

## Project Structure

- `src/app` route handlers, page routes, metadata routes
- `src/components` UI, layout, sections, shared components
- `src/config` company, navigation, analytics, site settings
- `src/data` launch content for services, portfolio, careers, FAQ, and blog
- `src/server` lead handling, logging, and AI provider skeletons
- `src/validation` shared request validation schemas
- `tests` unit and e2e scaffolding
- `docs` architecture and planning notes

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Start development server:

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

Admin access:

- URL: `http://localhost:3000/admin/login`
- Default username: `admin`
- Default password: `Admin#12345`

Change these via `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`.

## Quality Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Playwright smoke test:

```bash
npx playwright install
npm run test:e2e
```

## Docker

Build image:

```bash
docker build -t ddotsmedia-it-solutions .
```

Run container:

```bash
docker run --env-file .env.local -p 3000:3000 ddotsmedia-it-solutions
```

Or use compose:

```bash
docker compose up --build
```

The default compose file is for local Docker use and mounts [storage](/c:/Users/web/Desktop/Node%20apps/jobportal/ddotsmedia-it-solutions/storage) so admin edits and leads persist across container restarts.

## VPS Hosting

Recommended production shape:
- `Next.js app` container
- `Nginx` reverse proxy container
- persistent Docker volume for `/app/storage`
- DNS pointed to the VPS public IP
- HTTPS handled by your reverse proxy or edge

Production files:
- [docker-compose.prod.yml](/c:/Users/web/Desktop/Node%20apps/jobportal/ddotsmedia-it-solutions/docker-compose.prod.yml)
- [deploy/nginx/default.conf](/c:/Users/web/Desktop/Node%20apps/jobportal/ddotsmedia-it-solutions/deploy/nginx/default.conf)
- [.env.production.example](/c:/Users/web/Desktop/Node%20apps/jobportal/ddotsmedia-it-solutions/.env.production.example)

Example VPS steps:

```bash
cp .env.production.example .env.production
docker compose -f docker-compose.prod.yml up -d --build
```

After deployment:
- app traffic goes through Nginx on port `80`
- the `web` service is health-checked via `/api/health`
- admin content and lead submissions persist in the Docker volume `ddotsmedia_storage`
- set `NEXT_PUBLIC_SITE_URL` to your real domain before launch

Recommended server tasks before going live:
- attach a domain name
- terminate HTTPS with Nginx, Caddy, or Cloudflare
- replace the default admin credentials
- configure a real email provider
- back up the `ddotsmedia_storage` volume
- restrict server SSH access and enable a firewall

## Environment Variables

See [.env.example](/c:/Users/web/Desktop/Node%20apps/jobportal/ddotsmedia-it-solutions/.env.example).

Important values:
- `NEXT_PUBLIC_SITE_URL`
- `EMAIL_PROVIDER`
- `CONTACT_RECEIVER`
- `AI_PROVIDER`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `ENABLE_AI_CHAT`
- `ENABLE_AI_LEAD_QUALIFICATION`

## Notes

- The AI layer currently uses a mock provider so the project remains runnable without external credentials.
- Public page routes, admin editing, and lead capture are production-shaped and container-ready.
- Public APIs include rate limiting, spam checks, structured logging, and a health endpoint for infrastructure monitoring.
