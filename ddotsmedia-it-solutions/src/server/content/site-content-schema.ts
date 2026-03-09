import { z } from "zod";

export const siteContentSchema = z.object({
  companyInfo: z.object({
    name: z.string().min(2),
    email: z.email(),
    phone: z.string().min(3),
    whatsapp: z.string().url(),
    address: z.string().min(2),
    hours: z.string().min(2),
    socialLinks: z.array(
      z.object({
        label: z.string().min(1),
        href: z.string().url(),
      }),
    ),
  }),
  siteSettings: z.object({
    name: z.string().min(2),
    shortName: z.string().min(2),
    description: z.string().min(10),
    keywords: z.array(z.string().min(1)),
  }),
  hero: z.object({
    eyebrow: z.string().min(2),
    title: z.string().min(10),
    description: z.string().min(20),
    highlights: z.array(
      z.object({
        title: z.string().min(1),
        value: z.string().min(1),
      }),
    ),
  }),
  theme: z.object({
    surface: z.string().min(4),
    surfaceElevated: z.string().min(4),
    surfaceSoft: z.string().min(4),
    card: z.string().min(4),
    cardStrong: z.string().min(4),
    border: z.string().min(4),
    text: z.string().min(4),
    textMuted: z.string().min(4),
    primary: z.string().min(4),
    primaryStrong: z.string().min(4),
    accent: z.string().min(4),
    accentSoft: z.string().min(4),
    ink: z.string().min(4),
    danger: z.string().min(4),
  }),
  services: z.array(
    z.object({
      slug: z.string().min(1),
      title: z.string().min(1),
      summary: z.string().min(1),
      description: z.string().min(1),
      highlights: z.array(z.string().min(1)),
    }),
  ),
  engagementModels: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
    }),
  ),
  portfolioProjects: z.array(
    z.object({
      slug: z.string().min(1),
      title: z.string().min(1),
      category: z.string().min(1),
      summary: z.string().min(1),
      outcome: z.string().min(1),
    }),
  ),
  blogPosts: z.array(
    z.object({
      slug: z.string().min(1),
      title: z.string().min(1),
      excerpt: z.string().min(1),
      publishedAt: z.string().min(1),
      category: z.string().min(1),
    }),
  ),
  careerOpenings: z.array(
    z.object({
      slug: z.string().min(1),
      title: z.string().min(1),
      location: z.string().min(1),
      type: z.string().min(1),
      summary: z.string().min(1),
    }),
  ),
  faqItems: z.array(
    z.object({
      question: z.string().min(1),
      answer: z.string().min(1),
    }),
  ),
  industries: z.array(z.string().min(1)),
  testimonials: z.array(
    z.object({
      name: z.string().min(1),
      company: z.string().min(1),
      quote: z.string().min(1),
    }),
  ),
  companyStats: z.array(
    z.object({
      value: z.string().min(1),
      label: z.string().min(1),
    }),
  ),
  processSteps: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
    }),
  ),
  technologies: z.array(z.string().min(1)),
  whyChooseUs: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
    }),
  ),
  industryProblems: z.array(
    z.object({
      industry: z.string().min(1),
      challenge: z.string().min(1),
    }),
  ),
});
