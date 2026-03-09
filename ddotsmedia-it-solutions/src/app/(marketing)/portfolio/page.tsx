import Link from "next/link";
import { CtaBand } from "@/components/sections/cta-band";
import { PageShell } from "@/components/shared/page-shell";
import { getSiteContent } from "@/server/content/store";

export default async function PortfolioPage() {
  const { industries, portfolioProjects } = await getSiteContent();

  return (
    <>
      <PageShell
        eyebrow="Portfolio"
        title="Selected work across software platforms, commerce, and AI-assisted workflows."
        description="Our portfolio is structured to show what was built, why it mattered, and how the delivery translated into stronger business outcomes."
      >
        <section className="section-space pt-0">
          <div className="container-shell flex flex-wrap gap-3">
            {industries.map((industry) => (
              <span
                className="rounded-full border border-white/15 bg-[var(--color-card)] px-4 py-2 text-sm"
                key={industry}
              >
                {industry}
              </span>
            ))}
          </div>
        </section>
        <section className="section-space pt-0">
          <div className="container-shell grid gap-4 md:grid-cols-2">
            {portfolioProjects.map((project) => (
              <Link
                key={project.slug}
                className="panel rounded-[1.75rem] p-6"
                href={`/portfolio/${project.slug}`}
              >
                <p className="eyebrow">{project.category}</p>
                <h2 className="mt-3 font-display text-2xl font-semibold">
                  {project.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
                  {project.summary}
                </p>
                <p className="mt-5 text-sm font-semibold text-[var(--color-primary)]">
                  {project.outcome}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </PageShell>
      <CtaBand
        title="Want your next project to become a stronger sales asset?"
        description="We design case-study-worthy products by aligning UX, engineering quality, and business results from the start."
      />
    </>
  );
}
