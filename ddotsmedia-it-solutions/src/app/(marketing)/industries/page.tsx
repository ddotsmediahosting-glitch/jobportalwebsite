import { CtaBand } from "@/components/sections/cta-band";
import { PageShell } from "@/components/shared/page-shell";
import { getSiteContent } from "@/server/content/store";

export default async function IndustriesPage() {
  const { industries, industryProblems } = await getSiteContent();

  return (
    <>
      <PageShell
        eyebrow="Industries"
        title="Solutions shaped around industry-specific friction, not generic service lists."
        description="Ddotsmedia IT Solutions works across sectors where customer experience, operations, lead handling, and digital trust directly affect growth."
      >
        <section className="section-space pt-0">
          <div className="container-shell flex flex-wrap gap-3">
            {industries.map((industry) => (
              <span
                key={industry}
                className="rounded-full border border-white/15 bg-[var(--color-card)] px-4 py-2 text-sm"
              >
                {industry}
              </span>
            ))}
          </div>
        </section>
        <section className="section-space pt-0">
          <div className="container-shell grid gap-4 md:grid-cols-2">
            {industryProblems.map((item) => (
              <article className="panel rounded-[1.75rem] p-6" key={item.industry}>
                <p className="eyebrow">{item.industry}</p>
                <p className="mt-4 text-sm leading-8 text-[var(--color-text-muted)]">
                  {item.challenge}
                </p>
              </article>
            ))}
          </div>
        </section>
      </PageShell>
      <CtaBand
        title="Need sector-specific messaging and digital workflows?"
        description="We can shape pages, funnels, software, and automation flows around the reality of your industry instead of forcing a generic template."
      />
    </>
  );
}
