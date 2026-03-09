import { notFound } from "next/navigation";
import { CareerApplyForm } from "@/components/forms/career-apply-form";
import { PageShell } from "@/components/shared/page-shell";
import { getSiteContent } from "@/server/content/store";

export async function generateStaticParams() {
  const { careerOpenings } = await getSiteContent();
  return careerOpenings.map((opening) => ({ slug: opening.slug }));
}

export default async function CareerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { careerOpenings } = await getSiteContent();
  const opening = careerOpenings.find((item) => item.slug === slug);

  if (!opening) {
    notFound();
  }

  return (
    <PageShell
      eyebrow={`${opening.location} · ${opening.type}`}
      title={opening.title}
      description={opening.summary}
    >
      <section className="section-space pt-0">
        <div className="container-shell grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <article className="panel rounded-[1.75rem] p-6">
            <p className="eyebrow">Role Snapshot</p>
            <p className="mt-4 text-sm leading-8 text-[var(--color-text-muted)]">
              We are looking for people who can think clearly, execute
              carefully, and contribute to a client-facing delivery culture.
            </p>
          </article>
          <CareerApplyForm roleSlug={opening.slug} />
        </div>
      </section>
    </PageShell>
  );
}
