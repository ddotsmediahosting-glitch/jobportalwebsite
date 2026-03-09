import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { getSiteContent, buildThemeStyle } from "@/server/content/store";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: content.siteSettings.name,
      template: `%s | ${content.siteSettings.name}`,
    },
    description: content.siteSettings.description,
    keywords: [...content.siteSettings.keywords],
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: content.siteSettings.name,
      description: content.siteSettings.description,
      url: siteUrl,
      siteName: content.siteSettings.name,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: content.siteSettings.name,
      description: content.siteSettings.description,
    },
    applicationName: content.siteSettings.name,
    category: "technology",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = await getSiteContent();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${spaceGrotesk.variable} bg-[var(--color-surface)] font-sans text-[var(--color-text)] antialiased`}
      >
        <style dangerouslySetInnerHTML={{ __html: buildThemeStyle(content.theme) }} />
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: content.companyInfo.name,
              url: siteUrl,
              email: content.companyInfo.email,
              telephone: content.companyInfo.phone,
              sameAs: content.companyInfo.socialLinks.map((link) => link.href),
            }),
          }}
        />
      </body>
    </html>
  );
}
