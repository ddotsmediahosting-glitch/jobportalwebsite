import { useEffect } from 'react';

const SITE_NAME = 'DdotsmediaJobs';
const BASE_URL = import.meta.env.VITE_FRONTEND_URL || 'https://ddotsmediajobs.com';
const DEFAULT_DESC = 'Find the best jobs in UAE – Abu Dhabi, Dubai, Sharjah and all Emirates. Thousands of verified job listings updated daily.';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-default.svg`;

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
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
  keywords,
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
    // Title is passed already formatted — don't double-append site name for job pages
    const fullTitle = title || `${SITE_NAME} – UAE Jobs Portal`;
    document.title = fullTitle;

    const desc = description || DEFAULT_DESC;
    const ogImg = ogImage || DEFAULT_OG_IMAGE;
    const ogTit = ogTitle || fullTitle;
    const ogDesc = ogDescription || desc;
    const pageUrl = ogUrl || window.location.href;

    // Standard
    setMetaName('description', desc);
    setMetaName('robots', noIndex ? 'noindex,nofollow' : 'index,follow');
    if (keywords) setMetaName('keywords', keywords);

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
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl, ogType, twitterCard, jsonLd, canonical, noIndex]);

  return null;
}

// ── Helpers to build common JSON-LD schemas ────────────────────────────────────

const EMIRATES_LABELS_LOCAL: Record<string, string> = {
  ABU_DHABI: 'Abu Dhabi', DUBAI: 'Dubai', SHARJAH: 'Sharjah',
  AJMAN: 'Ajman', UMM_AL_QUWAIN: 'Umm Al Quwain',
  RAS_AL_KHAIMAH: 'Ras Al Khaimah', FUJAIRAH: 'Fujairah',
};

const EMP_TYPE_SCHEMA: Record<string, string> = {
  FULL_TIME: 'FULL_TIME', PART_TIME: 'PART_TIME', CONTRACT: 'CONTRACTOR',
  TEMPORARY: 'TEMPORARY', INTERNSHIP: 'INTERN', FREELANCE: 'OTHER',
};

function toDateString(iso?: string | null): string {
  if (!iso) return new Date().toISOString().split('T')[0];
  return iso.split('T')[0];
}

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
  category: { name: string; parent?: { name: string } | null };
}) {
  const cityName = EMIRATES_LABELS_LOCAL[job.emirate] || job.emirate;
  const plainDescription = job.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description: plainDescription,
    datePosted: toDateString(job.publishedAt),
    validThrough: job.expiresAt ? toDateString(job.expiresAt) : undefined,
    employmentType: EMP_TYPE_SCHEMA[job.employmentType] || job.employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.employer.companyName,
      ...(job.employer.website ? { sameAs: job.employer.website } : {}),
      ...(job.employer.logoUrl ? { logo: job.employer.logoUrl } : {}),
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || cityName,
        addressRegion: cityName,
        addressCountry: 'UAE',
      },
    },
    ...(job.workMode === 'REMOTE' ? { jobLocationType: 'TELECOMMUTE' } : {}),
    ...(job.salaryMin || job.salaryMax
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: job.salaryCurrency || 'AED',
            value: {
              '@type': 'QuantitativeValue',
              ...(job.salaryMin ? { minValue: job.salaryMin } : {}),
              ...(job.salaryMax ? { maxValue: job.salaryMax } : {}),
              unitText: 'MONTH',
            },
          },
        }
      : {}),
    ...(job.skills?.length ? { skills: job.skills.join(', ') } : {}),
    occupationalCategory: job.category.parent
      ? `${job.category.parent.name} > ${job.category.name}`
      : job.category.name,
    url: `${BASE_URL}/job/${job.slug}`,
  };
  return schema;
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
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
