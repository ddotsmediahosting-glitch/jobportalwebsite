import { PageShell } from "@/components/shared/page-shell";

export default function TermsAndConditionsPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Terms & Conditions"
      description="Use of this website is subject to applicable law, fair use of contact channels, and respect for the company’s intellectual property, materials, and published content."
    >
      <section className="section-space pt-0">
        <div className="container-shell panel rounded-[1.75rem] p-6 text-sm leading-8 text-[var(--color-text-muted)]">
          <p>
            Website content is provided for informational and commercial inquiry
            purposes. Project terms, delivery scope, pricing, timelines, and
            service obligations are governed by separate client agreements.
          </p>
          <p className="mt-4">
            Users must not misuse forms, attempt to compromise the website, or
            reproduce protected content without permission.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
