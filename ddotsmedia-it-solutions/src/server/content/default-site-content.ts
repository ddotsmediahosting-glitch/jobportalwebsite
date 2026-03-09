import { analyticsConfig } from "@/config/analytics";
import { companyInfo } from "@/config/company";
import { siteConfig } from "@/config/site";
import { careerOpenings } from "@/data/careers";
import {
  companyStats,
  industryProblems,
  processSteps,
  technologies,
  whyChooseUs,
} from "@/data/company";
import { faqItems } from "@/data/faq";
import { industries } from "@/data/industries";
import { portfolioProjects } from "@/data/portfolio";
import { blogPosts } from "@/data/posts";
import { engagementModels, services } from "@/data/services";
import { testimonials } from "@/data/testimonials";
import type { SiteContent } from "@/types/site-content";

void analyticsConfig;

export const defaultSiteContent: SiteContent = {
  companyInfo: {
    ...companyInfo,
    socialLinks: [...companyInfo.socialLinks],
  },
  siteSettings: {
    name: siteConfig.name,
    shortName: siteConfig.shortName,
    description: siteConfig.description,
    keywords: [...siteConfig.keywords],
  },
  hero: {
    eyebrow: "Modern IT Delivery",
    title:
      "Premium websites, software, and AI workflows for companies that need real business traction.",
    description:
      "Ddotsmedia IT Solutions designs and builds web platforms, mobile apps, brand-grade interfaces, and automation systems that turn digital operations into a growth asset instead of a maintenance burden.",
    highlights: [
      { title: "Positioning", value: "High-end tech brand execution" },
      { title: "Focus", value: "Lead generation, SEO, automation" },
      { title: "Delivery", value: "Strategy, design, engineering" },
    ],
  },
  theme: {
    surface: "#4398a0",
    surfaceElevated: "rgba(52, 132, 139, 0.86)",
    surfaceSoft: "#347d84",
    card: "rgba(243, 240, 232, 0.12)",
    cardStrong: "rgba(243, 240, 232, 0.18)",
    border: "rgba(243, 240, 232, 0.34)",
    text: "#f7f4eb",
    textMuted: "rgba(247, 244, 235, 0.8)",
    primary: "#eed556",
    primaryStrong: "#f18c4d",
    accent: "#bfd25d",
    accentSoft: "#f7d97e",
    ink: "#17484d",
    danger: "#b84444",
  },
  services: [...services],
  engagementModels: [...engagementModels],
  portfolioProjects: [...portfolioProjects],
  blogPosts: [...blogPosts],
  careerOpenings: [...careerOpenings],
  faqItems: [...faqItems],
  industries: [...industries],
  testimonials: [...testimonials],
  companyStats: [...companyStats],
  processSteps: [...processSteps],
  technologies: [...technologies],
  whyChooseUs: [...whyChooseUs],
  industryProblems: [...industryProblems],
};
