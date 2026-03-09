import { MotionReveal } from "@/components/shared/motion-reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { getSiteContent } from "@/server/content/store";

export async function WhyChooseSection() {
  const { whyChooseUs } = await getSiteContent();

  return (
    <section className="section-space">
      <div className="container-shell space-y-10">
        <SectionHeading
          eyebrow="Why Choose Us"
          title="The site is being built to reflect an actual high-trust technology partner."
          description="The message, layout, and conversion paths are positioned around executive clarity, delivery confidence, and measurable value."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {whyChooseUs.map((item, index) => (
            <MotionReveal delay={index * 0.05} key={item.title}>
              <article className="panel rounded-[1.75rem] p-6">
                <h3 className="font-display text-2xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
                  {item.description}
                </p>
              </article>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
