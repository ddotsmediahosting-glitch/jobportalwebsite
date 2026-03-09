import Link from "next/link";
import { CtaBand } from "@/components/sections/cta-band";
import { PageShell } from "@/components/shared/page-shell";
import { getSiteContent } from "@/server/content/store";

export default async function OurProjectsPage() {
  const { industries, portfolioProjects } = await getSiteContent();

  return (
    <>
      <PageShell
        eyebrow="Our Projects"
        title="A dedicated projects page for showcasing delivery quality and business outcomes."
        description="This page highlights selected digital products, platforms, automation systems, and growth-focused implementations completed by Ddotsmedia IT Solutions."
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
        title="Need your own project featured here next?"
        description="We can scope, design, build, and launch the next digital product or transformation initiative around your business goals."
      />
    </>
  );
}
