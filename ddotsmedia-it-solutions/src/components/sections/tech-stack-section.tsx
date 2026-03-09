import { MotionReveal } from "@/components/shared/motion-reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { getSiteContent } from "@/server/content/store";

export async function TechStackSection() {
  const { technologies } = await getSiteContent();

  return (
    <section className="section-space">
      <div className="container-shell space-y-10">
        <SectionHeading
          eyebrow="Technology Stack"
          title="A modern delivery stack that supports speed, maintainability, and growth."
          description="The implementation strategy reflects the same positioning the brand promises: modern, pragmatic, and built for results."
        />
        <div className="flex flex-wrap gap-3">
          {technologies.map((item, index) => (
            <MotionReveal delay={index * 0.03} key={item}>
              <span className="rounded-full border border-white/15 bg-[var(--color-card)] px-4 py-2 text-sm font-medium">
                {item}
              </span>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
