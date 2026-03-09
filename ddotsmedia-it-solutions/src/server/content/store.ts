import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { defaultSiteContent } from "@/server/content/default-site-content";
import { siteContentSchema } from "@/server/content/site-content-schema";
import type { SiteContent } from "@/types/site-content";

const storageDir = path.join(process.cwd(), "storage");
const storagePath = path.join(storageDir, "site-content.json");

async function ensureStoreFile() {
  await mkdir(storageDir, { recursive: true });

  try {
    await readFile(storagePath, "utf8");
  } catch {
    await writeFile(storagePath, JSON.stringify(defaultSiteContent, null, 2), "utf8");
  }
}

function looksUninitialized(content: SiteContent) {
  return (
    content.services.length === 0 &&
    content.portfolioProjects.length === 0 &&
    content.blogPosts.length === 0 &&
    content.careerOpenings.length === 0
  );
}

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  await ensureStoreFile();
  const raw = await readFile(storagePath, "utf8");
  const parsed = JSON.parse(raw);
  const validated = siteContentSchema.parse(parsed);

  if (looksUninitialized(validated)) {
    await writeFile(storagePath, JSON.stringify(defaultSiteContent, null, 2), "utf8");
    return defaultSiteContent;
  }

  return validated;
});

export async function saveSiteContent(content: SiteContent) {
  const validated = siteContentSchema.parse(content);
  await ensureStoreFile();
  await writeFile(storagePath, JSON.stringify(validated, null, 2), "utf8");
  return validated;
}

export function buildThemeStyle(theme: SiteContent["theme"]) {
  return `
    :root {
      --color-surface: ${theme.surface};
      --color-surface-elevated: ${theme.surfaceElevated};
      --color-surface-soft: ${theme.surfaceSoft};
      --color-card: ${theme.card};
      --color-card-strong: ${theme.cardStrong};
      --color-border: ${theme.border};
      --color-text: ${theme.text};
      --color-text-muted: ${theme.textMuted};
      --color-primary: ${theme.primary};
      --color-primary-strong: ${theme.primaryStrong};
      --color-accent: ${theme.accent};
      --color-accent-soft: ${theme.accentSoft};
      --color-ink: ${theme.ink};
      --color-danger: ${theme.danger};
    }
  `;
}
