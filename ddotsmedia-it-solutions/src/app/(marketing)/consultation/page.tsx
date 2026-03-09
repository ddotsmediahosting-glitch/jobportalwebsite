import { ConsultationForm } from "@/components/forms/consultation-form";
import { PageShell } from "@/components/shared/page-shell";

export default function ConsultationPage() {
  return (
    <PageShell
      eyebrow="Consultation"
      title="Book a consultation to clarify the right scope, stack, and delivery path."
      description="Use this flow when you need strategic clarity before committing to a new website, platform, app, automation initiative, or broader digital transformation project."
    >
      <section className="section-space pt-0">
        <div className="container-shell grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <article className="panel rounded-[1.75rem] p-6">
            <p className="eyebrow">What To Expect</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--color-text-muted)]">
              <li>• Scope clarification</li>
              <li>• Architecture recommendation</li>
              <li>• Delivery model suggestion</li>
              <li>• Estimated next-step plan</li>
            </ul>
          </article>
          <ConsultationForm />
        </div>
      </section>
    </PageShell>
  );
}
