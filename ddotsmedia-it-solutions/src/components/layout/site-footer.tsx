import Link from "next/link";
import type { Route } from "next";
import { Logo } from "@/components/brand/logo";
import { mainNavigation } from "@/config/navigation";
import { getSiteContent } from "@/server/content/store";

export async function SiteFooter() {
  const { companyInfo } = await getSiteContent();
  const legalLinks = [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms-and-conditions" },
    { label: "FAQ", href: "/faq" },
  ] as const;

  return (
    <footer className="relative overflow-hidden border-t border-white/15 bg-[rgba(32,87,92,0.46)] py-12">
      <div className="glass-orb right-[-3rem] top-[-3rem] h-32 w-32 bg-[rgba(238,213,86,0.18)]" />
      <div className="glass-orb bottom-[-3rem] left-[-3rem] h-40 w-40 bg-[rgba(241,140,77,0.16)]" />
      <div className="container-shell relative grid gap-10 md:grid-cols-[1.15fr_0.75fr_0.75fr_0.85fr]">
        <div className="space-y-5">
          <Logo />
          <p className="max-w-xl text-sm text-[var(--color-text-muted)]">
            Digital products, AI workflows, and custom software delivery built
            for companies that need technical depth with commercial focus.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-[var(--color-text-muted)]">
            <a
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 transition hover:bg-white/10 hover:text-white"
              href={companyInfo.whatsapp}
              rel="noreferrer"
              target="_blank"
            >
              WhatsApp
            </a>
            <a
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 transition hover:bg-white/10 hover:text-white"
              href={`mailto:${companyInfo.email}`}
            >
              Email Us
            </a>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
            Explore
          </p>
          <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
            {mainNavigation.map((item) => (
              <li key={item.href}>
                <Link className="transition hover:text-white" href={item.href as Route}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
            Company
          </p>
          <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
            {legalLinks.map((item) => (
              <li key={item.href}>
                <Link className="transition hover:text-white" href={item.href as Route}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3 text-sm text-[var(--color-text-muted)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
            Contact
          </p>
          <p>{companyInfo.address}</p>
          <p>
            <a className="transition hover:text-white" href={`mailto:${companyInfo.email}`}>
              {companyInfo.email}
            </a>
          </p>
          <p>
            <a className="transition hover:text-white" href={`tel:${companyInfo.phone}`}>
              {companyInfo.phone}
            </a>
          </p>
        </div>
      </div>
      <div className="container-shell relative mt-10 border-t border-white/10 pt-5 text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
        Ddotsmedia IT Solutions. Delivery-first software, AI, cloud, and growth systems.
      </div>
    </footer>
  );
}
