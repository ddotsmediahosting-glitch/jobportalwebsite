import Link from "next/link";
import { MotionReveal } from "@/components/shared/motion-reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { getSiteContent } from "@/server/content/store";

export async function PortfolioSection() {
  const { portfolioProjects } = await getSiteContent();

  return (
    <section className="section-space">
      <div className="container-shell space-y-10">
        <SectionHeading
          eyebrow="Case Studies"
          title="Selected work across platforms, automation, and growth-led digital products."
          description="The portfolio system is set up for filterable case studies, metrics, technology stacks, and client-ready storytelling."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {portfolioProjects.map((project, index) => (
            <MotionReveal delay={index * 0.05} key={project.slug}>
              <Link
                className="panel group block rounded-[1.75rem] p-6 transition hover:-translate-y-1"
                href={`/portfolio/${project.slug}`}
              >
                <p className="eyebrow">{project.category}</p>
                <h3 className="mt-3 font-display text-2xl font-semibold">
                  {project.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
                  {project.summary}
                </p>
                <p className="mt-6 text-sm font-semibold text-[var(--color-primary)]">
                  {project.outcome}
                </p>
              </Link>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
