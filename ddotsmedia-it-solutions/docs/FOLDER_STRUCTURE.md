# Proposed Folder Structure

```text
ddotsmedia-it-solutions/
|-- app/
|   |-- (marketing)/
|   |   |-- page.tsx
|   |   |-- about/page.tsx
|   |   |-- services/page.tsx
|   |   |-- services/[slug]/page.tsx
|   |   |-- portfolio/page.tsx
|   |   |-- portfolio/[slug]/page.tsx
|   |   |-- blog/page.tsx
|   |   |-- blog/[slug]/page.tsx
|   |   |-- careers/page.tsx
|   |   |-- careers/[slug]/page.tsx
|   |   |-- contact/page.tsx
|   |   |-- faq/page.tsx
|   |   |-- industries/page.tsx
|   |   |-- ai-solutions/page.tsx
|   |   |-- consultation/page.tsx
|   |   |-- privacy-policy/page.tsx
|   |   |-- terms-and-conditions/page.tsx
|   |-- api/
|   |   |-- contact/route.ts
|   |   |-- consultation/route.ts
|   |   |-- newsletter/route.ts
|   |   |-- careers/apply/route.ts
|   |   |-- ai/chat/route.ts
|   |   |-- ai/lead-qualify/route.ts
|   |   |-- ai/content-assist/route.ts
|   |   |-- health/route.ts
|   |-- globals.css
|   |-- layout.tsx
|   |-- not-found.tsx
|   |-- robots.ts
|   |-- sitemap.ts
|-- content/
|   |-- blog/
|   |-- resources/
|-- docs/
|   |-- ARCHITECTURE.md
|   |-- FOLDER_STRUCTURE.md
|-- public/
|   |-- images/
|   |-- icons/
|   |-- og/
|-- src/
|   |-- components/
|   |   |-- ai/
|   |   |-- blog/
|   |   |-- careers/
|   |   |-- contact/
|   |   |-- forms/
|   |   |-- layout/
|   |   |-- marketing/
|   |   |-- portfolio/
|   |   |-- sections/
|   |   |-- seo/
|   |   |-- services/
|   |   |-- shared/
|   |   |-- ui/
|   |-- config/
|   |   |-- analytics.ts
|   |   |-- company.ts
|   |   |-- navigation.ts
|   |   |-- site.ts
|   |-- content/
|   |   |-- loaders/
|   |   |-- mappers/
|   |-- data/
|   |   |-- careers.ts
|   |   |-- faq.ts
|   |   |-- industries.ts
|   |   |-- portfolio.ts
|   |   |-- services.ts
|   |   |-- testimonials.ts
|   |-- lib/
|   |   |-- analytics/
|   |   |-- seo/
|   |   |-- utils/
|   |-- server/
|   |   |-- ai/
|   |   |   |-- providers/
|   |   |   |-- prompts/
|   |   |   |-- knowledge/
|   |   |   |-- index.ts
|   |   |-- email/
|   |   |-- leads/
|   |   |-- logging/
|   |   |-- rate-limit/
|   |   |-- uploads/
|   |-- types/
|   |-- validation/
|   |   |-- careers.ts
|   |   |-- consultation.ts
|   |   |-- contact.ts
|   |   |-- newsletter.ts
|-- tests/
|   |-- e2e/
|   |-- integration/
|   |-- unit/
|-- .dockerignore
|-- .env.example
|-- .gitignore
|-- docker-compose.yml
|-- Dockerfile
|-- eslint.config.js
|-- middleware.ts
|-- next.config.ts
|-- package.json
|-- playwright.config.ts
|-- postcss.config.js
|-- prettier.config.js
|-- tailwind.config.ts
|-- tsconfig.json
|-- README.md
|-- TODO_MASTER.md
```

## Folder Rationale

### `app/`
Owns routes, metadata, sitemap, robots, and API handlers using the App Router.

### `src/components/`
Reusable UI and feature components, separated by business domain to keep the codebase navigable.

### `src/server/`
Server-only domain logic. Route handlers should stay thin and delegate to these modules.

### `src/data/`
Structured launch content for services, projects, testimonials, FAQs, and jobs.

### `content/`
MDX content for blog and resource marketing.

### `src/validation/`
Zod schemas shared by forms and APIs.

### `tests/`
Clear separation between unit, integration, and end-to-end coverage.
