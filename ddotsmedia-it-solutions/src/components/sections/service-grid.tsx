import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MotionReveal } from "@/components/shared/motion-reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { getSiteContent } from "@/server/content/store";

export async function ServiceGridSection() {
  const { services } = await getSiteContent();

  return (
    <section className="section-space">
      <div className="container-shell space-y-10">
        <SectionHeading
          eyebrow="Services"
          title="Capabilities built to cover product delivery, growth, and automation."
          description="Ddotsmedia IT Solutions brings strategy, design, engineering, SEO, and AI implementation together so execution does not break across vendors."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service, index) => (
            <MotionReveal delay={index * 0.04} key={service.slug}>
              <Link
                className="panel group flex h-full flex-col rounded-[1.75rem] p-6 transition hover:-translate-y-1"
                href={`/services/${service.slug}`}
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="eyebrow">Service</span>
                  <ArrowUpRight className="h-4 w-4 text-[var(--color-primary)] transition group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
                <h3 className="font-display text-2xl font-semibold">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
                  {service.summary}
                </p>
                <ul className="mt-6 space-y-2 text-sm text-[var(--color-text-muted)]">
                  {service.highlights.map((highlight) => (
                    <li key={highlight}>- {highlight}</li>
                  ))}
                </ul>
              </Link>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
