import { SectionHeading } from "@/components/shared/section-heading";
import { getSiteContent } from "@/server/content/store";

export async function FaqSection() {
  const { faqItems } = await getSiteContent();

  return (
    <section className="section-space">
      <div className="container-shell space-y-10">
        <SectionHeading
          eyebrow="FAQ"
          title="Answers aligned to common objections, delivery concerns, and scope questions."
          description="These entries are built to support both the FAQ page and future search schema and AI assistant retrieval."
        />
        <div className="grid gap-4">
          {faqItems.map((item) => (
            <article className="panel rounded-[1.5rem] p-6" key={item.question}>
              <h3 className="font-display text-xl font-semibold">{item.question}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
                {item.answer}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
