export type EditableService = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  highlights: string[];
};

export type EditablePortfolioProject = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  outcome: string;
};

export type EditableBlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  category: string;
};

export type EditableCareerOpening = {
  slug: string;
  title: string;
  location: string;
  type: string;
  summary: string;
};

export type SiteContent = {
  companyInfo: {
    name: string;
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
    hours: string;
    socialLinks: Array<{ label: string; href: string }>;
  };
  siteSettings: {
    name: string;
    shortName: string;
    description: string;
    keywords: string[];
  };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    highlights: Array<{ title: string; value: string }>;
  };
  theme: {
    surface: string;
    surfaceElevated: string;
    surfaceSoft: string;
    card: string;
    cardStrong: string;
    border: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryStrong: string;
    accent: string;
    accentSoft: string;
    ink: string;
    danger: string;
  };
  services: EditableService[];
  engagementModels: Array<{ title: string; description: string }>;
  portfolioProjects: EditablePortfolioProject[];
  blogPosts: EditableBlogPost[];
  careerOpenings: EditableCareerOpening[];
  faqItems: Array<{ question: string; answer: string }>;
  industries: string[];
  testimonials: Array<{ name: string; company: string; quote: string }>;
  companyStats: Array<{ value: string; label: string }>;
  processSteps: Array<{ title: string; description: string }>;
  technologies: string[];
  whyChooseUs: Array<{ title: string; description: string }>;
  industryProblems: Array<{ industry: string; challenge: string }>;
};
