import type { MetadataRoute } from "next";
import { careerOpenings } from "@/data/careers";
import { blogPosts } from "@/data/posts";
import { portfolioProjects } from "@/data/portfolio";
import { services } from "@/data/services";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/about",
    "/services",
    "/portfolio",
    "/blog",
    "/careers",
    "/contact",
    "/faq",
    "/industries",
    "/ai-solutions",
    "/consultation",
    "/privacy-policy",
    "/terms-and-conditions",
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteConfig.url}${route}`,
      lastModified: new Date(),
    })),
    ...services.map((service) => ({
      url: `${siteConfig.url}/services/${service.slug}`,
      lastModified: new Date(),
    })),
    ...portfolioProjects.map((project) => ({
      url: `${siteConfig.url}/portfolio/${project.slug}`,
      lastModified: new Date(),
    })),
    ...blogPosts.map((post) => ({
      url: `${siteConfig.url}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
    })),
    ...careerOpenings.map((opening) => ({
      url: `${siteConfig.url}/careers/${opening.slug}`,
      lastModified: new Date(),
    })),
  ];
}
