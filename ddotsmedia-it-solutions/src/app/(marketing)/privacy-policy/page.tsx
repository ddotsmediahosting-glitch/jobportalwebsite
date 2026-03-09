import { PageShell } from "@/components/shared/page-shell";

export default function PrivacyPolicyPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Privacy Policy"
      description="Ddotsmedia IT Solutions collects only the information necessary to respond to inquiries, deliver services, support hiring workflows, and improve website performance. Personal data is processed with reasonable safeguards and is not sold."
    >
      <section className="section-space pt-0">
        <div className="container-shell panel rounded-[1.75rem] p-6 text-sm leading-8 text-[var(--color-text-muted)]">
          <p>
            Information submitted through forms may include contact details,
            company details, and project information. This data is used for
            communication, qualification, delivery planning, and service-related
            administration.
          </p>
          <p className="mt-4">
            Analytics and technical logs may be used to understand website
            performance and improve the user experience. Contact us if you need
            access, correction, or deletion support regarding submitted data.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
