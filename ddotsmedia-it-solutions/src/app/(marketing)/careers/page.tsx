import Link from "next/link";
import { CtaBand } from "@/components/sections/cta-band";
import { PageShell } from "@/components/shared/page-shell";
import { getSiteContent } from "@/server/content/store";

export default async function CareersPage() {
  const { careerOpenings } = await getSiteContent();

  return (
    <>
      <PageShell
        eyebrow="Careers"
        title="We are building a team that values design quality, technical rigor, and pragmatic delivery."
        description="The careers module supports structured listings, detail pages, and application flows so hiring can scale without a fragmented experience."
      >
        <section className="section-space pt-0">
          <div className="container-shell grid gap-4">
            {careerOpenings.map((opening) => (
              <Link
                key={opening.slug}
                className="panel rounded-[1.75rem] p-6"
                href={`/careers/${opening.slug}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-semibold">
                      {opening.title}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                      {opening.location} · {opening.type}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--color-primary)]">
                    View Role
                  </p>
                </div>
                <p className="mt-4 text-sm leading-7 text-[var(--color-text-muted)]">
                  {opening.summary}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </PageShell>
      <CtaBand
        title="Interested in helping shape premium digital products and client systems?"
        description="Explore the open roles and apply through the structured careers flow."
      />
    </>
  );
}
