export const companyStats = [
  { value: "40+", label: "projects delivered" },
  { value: "12", label: "core delivery disciplines" },
  { value: "4-8 weeks", label: "typical sprint-to-launch range" },
  { value: "24/6", label: "support-ready operating model" },
] as const;

export const processSteps = [
  {
    title: "Discover",
    description:
      "We clarify goals, users, constraints, and commercial priorities before design or engineering starts.",
  },
  {
    title: "Design",
    description:
      "We shape the information flow, interface system, and conversion journey with implementation in mind.",
  },
  {
    title: "Build",
    description:
      "We deliver in milestones with clean architecture, QA discipline, and transparent progress updates.",
  },
  {
    title: "Optimize",
    description:
      "We improve performance, SEO, funnel outcomes, and feature quality after launch instead of treating launch as the finish line.",
  },
] as const;

export const technologies = [
  "Next.js",
  "React",
  "Node.js",
  "TypeScript",
  "Tailwind CSS",
  "PostgreSQL",
  "Prisma",
  "Docker",
  "OpenAI",
  "AWS",
  "Vercel",
  "Cloudflare",
] as const;

export const whyChooseUs = [
  {
    title: "Business-first engineering",
    description:
      "We balance product quality with growth, operations, and delivery realities instead of optimizing only for code aesthetics.",
  },
  {
    title: "Design that sells",
    description:
      "Our interfaces are structured to increase clarity, trust, and action rather than just look modern in screenshots.",
  },
  {
    title: "AI without gimmicks",
    description:
      "We implement AI where it produces measurable operational value and avoid novelty-driven complexity.",
  },
  {
    title: "Built to scale",
    description:
      "Architecture, SEO, analytics, and deployment are treated as first-class concerns from the start.",
  },
] as const;

export const industryProblems = [
  {
    industry: "Healthcare",
    challenge: "Booking friction, manual coordination, and fragmented communication.",
  },
  {
    industry: "Retail & E-commerce",
    challenge: "Conversion leakage, weak retention workflows, and disconnected systems.",
  },
  {
    industry: "Real Estate",
    challenge: "Lead follow-up inconsistency and limited digital trust signals.",
  },
  {
    industry: "Education",
    challenge: "Admissions communication, student onboarding, and content discoverability.",
  },
] as const;
