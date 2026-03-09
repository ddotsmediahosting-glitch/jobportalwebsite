import { notFound } from "next/navigation";
import { CtaBand } from "@/components/sections/cta-band";
import { PageShell } from "@/components/shared/page-shell";
import { getSiteContent } from "@/server/content/store";

export async function generateStaticParams() {
  const { portfolioProjects } = await getSiteContent();
  return portfolioProjects.map((project) => ({ slug: project.slug }));
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { portfolioProjects } = await getSiteContent();
  const project = portfolioProjects.find((item) => item.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <>
      <PageShell
        eyebrow={project.category}
        title={project.title}
        description={project.outcome}
      >
        <section className="section-space pt-0">
          <div className="container-shell grid gap-4 lg:grid-cols-3">
            <article className="panel rounded-[1.75rem] p-6 lg:col-span-2">
              <p className="eyebrow">Project Summary</p>
              <p className="mt-4 text-sm leading-8 text-[var(--color-text-muted)]">
                {project.summary} This page template is ready for full challenge,
                solution, stack, metrics, gallery, and testimonial content in the
                next iteration.
              </p>
            </article>
            <article className="panel rounded-[1.75rem] p-6">
              <p className="eyebrow">Outcome</p>
              <p className="mt-4 text-sm leading-8 text-[var(--color-text-muted)]">
                {project.outcome}
              </p>
            </article>
          </div>
        </section>
      </PageShell>
      <CtaBand
        title="Need a similarly structured digital transformation project?"
        description="We can scope a platform, commerce experience, automation flow, or internal system around your specific delivery constraints."
      />
    </>
  );
}
