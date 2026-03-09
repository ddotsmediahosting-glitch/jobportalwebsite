import { notFound } from "next/navigation";
import { CtaBand } from "@/components/sections/cta-band";
import { PageShell } from "@/components/shared/page-shell";
import { getSiteContent } from "@/server/content/store";

export async function generateStaticParams() {
  const { services } = await getSiteContent();
  return services.map((service) => ({ slug: service.slug }));
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { services } = await getSiteContent();
  const service = services.find((item) => item.slug === slug);

  if (!service) {
    notFound();
  }

  return (
    <>
      <PageShell
        eyebrow="Service Detail"
        title={service.title}
        description={service.description}
      >
        <section className="section-space pt-0">
          <div className="container-shell grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <article className="panel rounded-[1.75rem] p-6">
              <p className="eyebrow">What This Covers</p>
              <ul className="mt-4 space-y-3 text-[var(--color-text-muted)]">
                {service.highlights.map((highlight) => (
                  <li key={highlight}>• {highlight}</li>
                ))}
              </ul>
            </article>
            <article className="panel rounded-[1.75rem] p-6">
              <p className="eyebrow">Best Fit</p>
              <p className="mt-4 text-sm leading-7 text-[var(--color-text-muted)]">
                This service is ideal for businesses that need sharper delivery,
                clearer systems, and better commercial outcomes from digital
                execution.
              </p>
            </article>
          </div>
        </section>
      </PageShell>
      <CtaBand
        title={`Need ${service.title.toLowerCase()} support?`}
        description="We can scope the work, define milestones, and recommend the fastest route to a production-ready launch."
      />
    </>
  );
}
