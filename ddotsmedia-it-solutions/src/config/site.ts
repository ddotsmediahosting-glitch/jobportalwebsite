export const siteConfig = {
  name: "Ddotsmedia IT Solutions",
  shortName: "Ddotsmedia",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  description:
    "Ddotsmedia IT Solutions builds web platforms, mobile apps, AI-powered workflows, and cloud-ready digital products for ambitious businesses.",
  keywords: [
    "IT solutions company",
    "web development agency",
    "mobile app development",
    "custom software development",
    "AI automation services",
    "cloud solutions",
  ],
} as const;
