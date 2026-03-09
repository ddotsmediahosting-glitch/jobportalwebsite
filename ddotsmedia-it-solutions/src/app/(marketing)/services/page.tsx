import Link from "next/link";
import { CtaBand } from "@/components/sections/cta-band";
import { ServiceGridSection } from "@/components/sections/service-grid";
import { PageShell } from "@/components/shared/page-shell";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteContent } from "@/server/content/store";

export const metadata = buildMetadata({
  title: "Services",
  description: "Explore the service portfolio of Ddotsmedia IT Solutions.",
  pathname: "/services",
});

export default async function ServicesPage() {
  const { engagementModels, services } = await getSiteContent();

  return (
    <>
      <PageShell
        eyebrow="Services"
        title="Services built around websites, software delivery, AI automation, and digital growth."
        description="Our service model is designed to meet companies at different stages: launching a stronger online presence, building an internal platform, modernizing customer experience, or creating automation capacity."
      >
        <section className="section-space pt-0">
          <div className="container-shell grid gap-4 md:grid-cols-3">
            {engagementModels.map((model) => (
              <article className="panel rounded-[1.75rem] p-6" key={model.title}>
                <p className="eyebrow">Engagement Model</p>
                <h2 className="mt-3 font-display text-2xl font-semibold">
                  {model.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
                  {model.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </PageShell>
      <ServiceGridSection />
      <section className="section-space pt-0">
        <div className="container-shell rounded-[2rem] border border-white/15 bg-[var(--color-card)] p-6 md:p-10">
          <p className="eyebrow">Service Pathways</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {services.slice(0, 4).map((service) => (
              <Link
                className="rounded-[1.5rem] border border-white/15 bg-[var(--color-card-strong)] p-5"
                href={`/services/${service.slug}`}
                key={service.slug}
              >
                <h3 className="font-display text-xl font-semibold">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
                  {service.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CtaBand
        title="Need help choosing the right engagement model?"
        description="We can scope a website, product, automation system, or transformation roadmap around your current business stage."
      />
    </>
  );
}
