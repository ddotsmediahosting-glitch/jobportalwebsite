# Architecture Notes

## 1. Project Direction

Ddotsmedia IT Solutions needs a premium marketing website with real operational value. This is not a static brochure site. The architecture must support:
- high-conversion lead capture
- SEO-driven growth
- reusable content publishing
- portfolio and case study storytelling
- structured service marketing
- careers intake
- optional AI automation without hard vendor lock-in

The implementation target is a production-ready website that can run locally on `localhost:3000` and deploy cleanly through Docker.

## 2. Chosen Architecture

### Application Pattern
`Next.js App Router monolith`

This will be a full-stack React application where:
- public pages are server-rendered or statically generated where useful
- form handling uses secure server-side route handlers
- content is modeled in structured TypeScript and MDX
- AI endpoints are isolated behind internal service abstractions
- domain logic lives outside route files to preserve maintainability

### Why This Is The Practical Choice

- better SEO than a pure client-rendered Vite SPA
- fewer moving parts than React + separate Express API
- easier metadata, sitemap, robots, and schema implementation
- simpler localhost and Docker workflow
- lower operational burden for a business website
- preserves ability to split services later if requirements expand

## 3. Rendering Strategy

### Static Generation
Use for:
- home
- about
- services listing
- service detail pages
- portfolio listing
- project detail pages
- blog listing and blog details
- FAQ
- legal pages
- industries page
- AI solutions page

### Dynamic/Server Handling
Use for:
- contact submissions
- consultation request submissions
- newsletter submissions
- careers application submissions
- AI assistant requests
- lead qualification
- booking request workflows

## 4. Data Strategy

### Initial MVP Data Sources
- `content/*.mdx` for blog posts and long-form resources
- `src/data/*.ts` for services, projects, testimonials, FAQs, jobs, industries
- `src/config/*.ts` for SEO defaults, navigation, company info, analytics flags

### Why No Database In Phase 1

A database is not required for the first production version if:
- leads are delivered via email and structured logs
- blog content is file-based
- portfolio and careers content are code-managed

This keeps the architecture lean while still supporting production deployment.

### Database Upgrade Path

If persistence becomes necessary in Phase 4 or later, use:
- `PostgreSQL`
- `Prisma ORM`

Reasons:
- clean schema evolution
- stable Node ecosystem fit
- easy migration from file-backed content to persisted leads or application records

## 5. CMS Strategy

### Recommended MVP
File-based MDX + structured data.

### Recommended Future CMS
`Sanity`

Reasoning:
- good editorial experience
- strong structured content modeling
- practical Next.js integration
- suitable for blog, case studies, service landing content, FAQs, testimonials

To stay CMS-ready, the codebase will isolate content access behind repository-style data loaders so file-based and CMS-backed implementations can share the same page components.

## 6. Design System Direction

Brand direction:
- premium tech consultancy
- dark neutral surfaces with selective cyan/blue accent gradients
- strong contrast and spacious typography
- clear enterprise-style trust signals
- motion used for emphasis, not decoration

Core UI foundations:
- sticky transparent-to-solid navbar
- bold hero with layered background effects
- editorial-quality section spacing
- high-signal cards with restrained glass effects
- animated metrics, process timeline, and proof sections
- reusable CTA bands optimized for inquiry capture

## 7. Route Map

### Public Routes
- `/`
- `/about`
- `/services`
- `/services/[slug]`
- `/portfolio`
- `/portfolio/[slug]`
- `/blog`
- `/blog/[slug]`
- `/careers`
- `/careers/[slug]`
- `/contact`
- `/faq`
- `/industries`
- `/ai-solutions`
- `/consultation`
- `/privacy-policy`
- `/terms-and-conditions`

### API Routes
- `/api/contact`
- `/api/consultation`
- `/api/newsletter`
- `/api/careers/apply`
- `/api/ai/chat`
- `/api/ai/lead-qualify`
- `/api/ai/content-assist`
- `/api/health`

## 8. Page Modules

### Global
- site header
- mobile navigation drawer
- footer
- CTA ribbon
- breadcrumb system
- page hero variants
- SEO metadata builder
- schema helpers

### Homepage
- hero
- trust bar
- service highlights
- company positioning
- process/workflow
- featured case studies
- industries served
- technology stack
- testimonials
- blog teaser
- lead capture CTA

### Services
- service grid
- capability overview
- comparison/benefit sections
- pricing guidance or engagement model cards
- service detail conversion blocks

### Portfolio
- filterable project gallery
- project result cards
- technology tags
- case study metrics

### Blog
- category/tag filtering
- featured article layout
- related posts
- newsletter signup

### Careers
- open roles listing
- company culture/value blocks
- application form
- resume upload structure

### Contact
- inquiry form
- consultation form
- company contact cards
- office map placeholder
- WhatsApp CTA

## 9. Lead Generation Architecture

Lead capture points:
- primary hero CTA
- contact page
- service detail CTA blocks
- consultation booking page
- newsletter signup
- downloadable brochure gate
- AI chatbot escalation flow

Submission flow:
1. Client-side validation
2. Server-side Zod validation
3. anti-spam checks
4. rate limiting
5. structured log event
6. optional email notification
7. optional AI lead qualification summary
8. success response with analytics event

## 10. AI Integration Plan

### AI Principles
- optional by configuration
- provider-agnostic
- no hardcoded secrets
- graceful fallback when disabled
- prompt and provider logic isolated from UI

### Planned AI Modules

#### AI Chat Assistant
Purpose:
- answer visitor questions
- recommend relevant services
- route users to contact or consultation flows
- collect lead data when intent is strong

Architecture:
- frontend chat widget
- server route for chat requests
- provider abstraction supporting OpenAI, Anthropic, or mock provider
- retrieval-ready knowledge source built from service, FAQ, and company content

#### AI Lead Qualification
Purpose:
- classify incoming leads by service
- assign urgency
- detect budget or enterprise intent cues
- generate concise internal summary

Output example:
- lead type
- interested services
- urgency
- estimated deal quality
- recommended response action

#### AI Content Assistance
Purpose:
- generate first-draft meta descriptions
- summarize project data into case study teasers
- assist future admin workflows for blog drafts

#### AI FAQ Assistant
Purpose:
- answer knowledge questions from structured company content
- provide deterministic fallback from local FAQ dataset when AI is off

## 11. Security And Reliability

Planned controls:
- server-side validation on every form endpoint
- rate limiting on public APIs
- honeypot field and timestamp heuristics for spam
- file size and MIME validation for resume uploads
- environment variable validation at boot
- structured error boundaries
- consistent API error envelope
- request correlation IDs in logs

## 12. SEO Architecture

Planned SEO features:
- route-level metadata
- canonical URLs
- Open Graph tags
- Twitter cards
- JSON-LD schema
- sitemap generation
- robots.txt
- semantic landmarks
- internal linking blocks
- blog and industry landing pages for organic acquisition

Schema targets:
- `Organization`
- `ProfessionalService`
- `BreadcrumbList`
- `FAQPage`
- `Article`
- `WebPage`
- `JobPosting` where relevant

## 13. Analytics And Tracking

The codebase will be analytics-ready rather than vendor-hardcoded.

Planned support:
- Google Analytics
- Google Tag Manager
- CTA click tracking hooks
- form submission events
- newsletter signup events
- consultation booking events
- chat engagement events

## 14. Docker And Runtime Strategy

### Development
- run directly with Node on localhost
- hot reload via Next dev server

### Production Container
- multi-stage Docker build
- standalone Next output
- minimal runtime image
- configurable via environment variables

### Optional Compose
For future persisted features:
- app service
- optional postgres service
- optional redis service

Phase 2 will start with a single app container because the initial architecture does not require database or queue infrastructure.

## 15. Phase 2 Build Baseline

Minimum scaffold target for next phase:
- Next.js initialized
- Tailwind configured
- base layout and route groups created
- shared data/config layer created
- initial page shells added
- API handler skeletons added
- Docker and env files added
- lint/test/build scripts working
