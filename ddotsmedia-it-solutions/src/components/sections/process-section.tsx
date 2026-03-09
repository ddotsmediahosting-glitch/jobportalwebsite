import { MotionReveal } from "@/components/shared/motion-reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { getSiteContent } from "@/server/content/store";

export async function ProcessSection() {
  const { processSteps } = await getSiteContent();

  return (
    <section className="section-space">
      <div className="container-shell space-y-10">
        <SectionHeading
          eyebrow="Process"
          title="A delivery workflow designed to reduce ambiguity and move faster."
          description="We keep the process tight: strategy first, scoped design, disciplined build cycles, and measurable optimization after launch."
        />
        <div className="grid gap-4 lg:grid-cols-4">
          {processSteps.map((step, index) => (
            <MotionReveal delay={index * 0.06} key={step.title}>
              <article className="panel h-full rounded-[1.5rem] p-6">
                <p className="font-display text-4xl font-bold text-white/30">
                  0{index + 1}
                </p>
                <h3 className="mt-6 font-display text-2xl font-semibold">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
                  {step.description}
                </p>
              </article>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
