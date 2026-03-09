import { MotionReveal } from "@/components/shared/motion-reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { getSiteContent } from "@/server/content/store";

export async function TestimonialsSection() {
  const { testimonials } = await getSiteContent();

  return (
    <section className="section-space">
      <div className="container-shell space-y-10">
        <SectionHeading
          eyebrow="Testimonials"
          title="Trust signals should feel specific, commercial, and earned."
          description="These reusable testimonial cards will evolve into a richer proof system with company logos, sectors, and linked case studies."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <MotionReveal delay={index * 0.06} key={testimonial.company}>
              <article className="panel rounded-[1.75rem] p-6">
                <p className="text-lg leading-8">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <p className="mt-6 font-semibold">{testimonial.name}</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {testimonial.company}
                </p>
              </article>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
