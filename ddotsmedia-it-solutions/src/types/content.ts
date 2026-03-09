export type Service = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  highlights: string[];
};

export type PortfolioProject = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  outcome: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  category: string;
};

export type CareerOpening = {
  slug: string;
  title: string;
  location: string;
  type: string;
  summary: string;
};
