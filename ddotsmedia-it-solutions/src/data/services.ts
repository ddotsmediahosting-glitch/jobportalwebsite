import type { Service } from "@/types/content";

export const services: Service[] = [
  {
    slug: "web-development",
    title: "Web Development",
    summary: "High-performance websites and platforms designed to convert and scale.",
    description:
      "We design and engineer web products that combine premium UX, reliable architecture, and measurable business performance.",
    highlights: ["Next.js architecture", "API integrations", "SEO-ready delivery"],
  },
  {
    slug: "mobile-app-development",
    title: "Mobile App Development",
    summary: "Cross-platform mobile experiences with product-grade design and delivery.",
    description:
      "From business apps to customer platforms, we build mobile products with strong usability and clean backend integration.",
    highlights: ["iOS and Android strategy", "Reusable APIs", "Analytics-ready"],
  },
  {
    slug: "ui-ux-design",
    title: "UI/UX Design",
    summary: "Product and interface design focused on clarity, trust, and action.",
    description:
      "We design digital experiences with strong hierarchy, conversion thinking, accessibility, and implementation-ready design systems.",
    highlights: ["Design systems", "User journey mapping", "Prototype validation"],
  },
  {
    slug: "ecommerce-development",
    title: "E-commerce Development",
    summary: "Storefronts and buying journeys built for performance and growth.",
    description:
      "We build commerce experiences that reduce friction, improve conversion, and support integrations across payment, logistics, and CRM tools.",
    highlights: ["Conversion optimization", "Checkout UX", "Platform integrations"],
  },
  {
    slug: "custom-software-development",
    title: "Custom Software Development",
    summary: "Business systems engineered around your workflow instead of forcing new ones.",
    description:
      "From operations platforms to internal portals, we deliver software that reflects your process, reporting, and team structure.",
    highlights: ["Workflow automation", "Admin dashboards", "Role-based access"],
  },
  {
    slug: "cloud-solutions",
    title: "Cloud Solutions",
    summary: "Cloud-ready architecture, migration, deployment, and ongoing support.",
    description:
      "We design infrastructure and delivery pipelines that improve reliability, release speed, and operational visibility.",
    highlights: ["Containerization", "CI/CD setup", "Scalable hosting"],
  },
  {
    slug: "ai-solutions",
    title: "AI Solutions",
    summary: "Practical AI automation for lead qualification, support, and operations.",
    description:
      "We integrate AI where it reduces manual effort, speeds decisions, and improves customer experience without overengineering.",
    highlights: ["Chat assistants", "Lead scoring", "Workflow automation"],
  },
  {
    slug: "seo-digital-marketing",
    title: "SEO & Digital Marketing",
    summary: "Acquisition systems built on technical SEO, content, and analytics.",
    description:
      "We align site architecture, landing pages, content strategy, and measurement so digital growth does not depend on guesswork.",
    highlights: ["Technical SEO", "Content strategy", "Analytics instrumentation"],
  },
  {
    slug: "maintenance-support",
    title: "Maintenance & Support",
    summary: "Ongoing technical support, optimization, and release management.",
    description:
      "We support platforms after launch with monitoring, fixes, enhancements, security updates, and structured improvement cycles.",
    highlights: ["Performance reviews", "Release support", "Issue response"],
  },
  {
    slug: "it-consulting",
    title: "IT Consulting",
    summary: "Technology direction and execution plans grounded in business priorities.",
    description:
      "We help leadership teams make better product, architecture, automation, and vendor decisions with clear technical guidance.",
    highlights: ["Roadmapping", "Architecture audits", "Delivery planning"],
  },
];

export const engagementModels = [
  {
    title: "Discovery Sprint",
    description:
      "A focused strategy engagement to define scope, architecture, design direction, and execution priorities.",
  },
  {
    title: "Project Delivery",
    description:
      "End-to-end product, website, app, or automation delivery with structured milestones and release planning.",
  },
  {
    title: "Ongoing Partnership",
    description:
      "A retained model for growth improvements, support, experimentation, and technical operations.",
  },
] as const;
