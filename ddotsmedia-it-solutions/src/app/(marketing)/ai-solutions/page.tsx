import { CtaBand } from "@/components/sections/cta-band";
import { PageShell } from "@/components/shared/page-shell";

export default function AiSolutionsPage() {
  return (
    <>
      <PageShell
        eyebrow="AI Solutions"
        title="AI implementation focused on speed, qualification, support, and operational leverage."
        description="We use AI where it creates measurable value: lead qualification, website assistance, workflow summarization, case study generation, content operations, and knowledge retrieval."
      >
        <section className="section-space pt-0">
          <div className="container-shell grid gap-4 md:grid-cols-2">
            <article className="panel rounded-[1.75rem] p-6">
              <p className="eyebrow">Included In Architecture</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--color-text-muted)]">
                <li>• AI website assistant abstraction</li>
                <li>• Lead qualification service</li>
                <li>• Content assistance hooks</li>
                <li>• FAQ and knowledge assistant readiness</li>
              </ul>
            </article>
            <article className="panel rounded-[1.75rem] p-6">
              <p className="eyebrow">Implementation Principle</p>
              <p className="mt-4 text-sm leading-8 text-[var(--color-text-muted)]">
                No hardcoded provider lock-in, no fake keys, and no AI for its own
                sake. The system is modular so providers can be enabled only when
                needed.
              </p>
            </article>
          </div>
        </section>
      </PageShell>
      <CtaBand
        title="Want AI added to your website or business workflow in a controlled way?"
        description="We can define the right use cases, provider model, guardrails, and rollout path based on your business needs."
      />
    </>
  );
}
