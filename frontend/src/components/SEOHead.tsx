import { useEffect } from 'react';

const SITE_NAME = 'DdotsmediaJobs';
const BASE_URL = import.meta.env.VITE_FRONTEND_URL || 'https://ddotsmediajobs.com';
const DEFAULT_DESC = 'Find the best jobs in UAE – Abu Dhabi, Dubai, Sharjah and all Emirates. Thousands of verified job listings updated daily.';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-default.png`;

export interface SEOProps {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  jsonLd?: object;
  canonical?: string;
  noIndex?: boolean;
}

function setMetaName(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaProp(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(data: object) {
  let el = document.getElementById('seo-jsonld');
  if (!el) {
    el = document.createElement('script');
    el.id = 'seo-jsonld';
    el.setAttribute('type', 'application/ld+json');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd() {
  document.getElementById('seo-jsonld')?.remove();
}

export function SEOHead({
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  jsonLd,
  canonical,
  noIndex = false,
}: SEOProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – UAE Jobs Portal`;
    document.title = fullTitle;

    const desc = description || DEFAULT_DESC;
    const ogImg = ogImage || DEFAULT_OG_IMAGE;
    const ogTit = ogTitle || fullTitle;
    const ogDesc = ogDescription || desc;
    const pageUrl = ogUrl || window.location.href;

    // Standard
    setMetaName('description', desc);
    setMetaName('robots', noIndex ? 'noindex,nofollow' : 'index,follow');

    // Open Graph
    setMetaProp('og:title', ogTit);
    setMetaProp('og:description', ogDesc);
    setMetaProp('og:image', ogImg);
    setMetaProp('og:url', pageUrl);
    setMetaProp('og:type', ogType);
    setMetaProp('og:site_name', SITE_NAME);

    // Twitter Card
    setMetaName('twitter:card', twitterCard);
    setMetaName('twitter:title', ogTit);
    setMetaName('twitter:description', ogDesc);
    setMetaName('twitter:image', ogImg);
    setMetaName('twitter:site', '@DdotsmediaJobs');

    // Canonical
    setCanonical(canonical || pageUrl);

    // JSON-LD
    if (jsonLd) {
      setJsonLd(jsonLd);
    } else {
      removeJsonLd();
    }
  }, [title, description, ogTitle, ogDescription, ogImage, ogUrl, ogType, twitterCard, jsonLd, canonical, noIndex]);

  return null;
}

// ── Helpers to build common JSON-LD schemas ────────────────────────────────────

export function buildJobPostingSchema(job: {
  title: string;
  description: string;
  slug: string;
  publishedAt?: string | null;
  expiresAt?: string | null;
  employmentType: string;
  workMode: string;
  emirate: string;
  location?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  skills?: string[];
  employer: { companyName: string; logoUrl?: string | null; website?: string | null };
  category: { name: string };
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description.replace(/<[^>]+>/g, ' ').slice(0, 500),
    datePosted: job.publishedAt ?? new Date().toISOString(),
    validThrough: job.expiresAt,
    employmentType: job.employmentType,
    url: `${BASE_URL}/jobs/${job.slug}`,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.employer.companyName,
      sameAs: job.employer.website,
      logo: job.employer.logoUrl,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || job.emirate,
        addressRegion: job.emirate,
        addressCountry: 'AE',
      },
    },
    ...(job.workMode === 'REMOTE' ? { jobLocationType: 'TELECOMMUTE' } : {}),
    ...(job.salaryMin && job.salaryMax
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: job.salaryCurrency || 'AED',
            value: {
              '@type': 'QuantitativeValue',
              minValue: job.salaryMin,
              maxValue: job.salaryMax,
              unitText: 'MONTH',
            },
          },
        }
      : {}),
    skills: job.skills?.join(', '),
    occupationalCategory: job.category.name,
  };
  return schema;
}

export function buildOrganizationSchema(employer: {
  companyName: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  emirate?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: employer.companyName,
    url: employer.website || `${BASE_URL}/companies/${employer.slug}`,
    logo: employer.logoUrl,
    description: employer.description,
    address: employer.emirate
      ? { '@type': 'PostalAddress', addressRegion: employer.emirate, addressCountry: 'AE' }
      : undefined,
  };
}
