import { ContactForm } from "@/components/forms/contact-form";
import { PageShell } from "@/components/shared/page-shell";
import { getSiteContent } from "@/server/content/store";

export default async function ContactPage() {
  const { companyInfo } = await getSiteContent();

  return (
    <PageShell
      eyebrow="Contact"
      title="Tell us what you want to build, improve, automate, or launch next."
      description="Whether you need a premium website, a custom platform, AI automation, or ongoing technical support, we can shape the right next step."
    >
      <section className="section-space pt-0">
        <div className="container-shell grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <article className="panel rounded-[1.75rem] p-6">
              <p className="eyebrow">Direct Contact</p>
              <div className="mt-4 space-y-3 text-sm text-[var(--color-text-muted)]">
                <p>{companyInfo.email}</p>
                <p>{companyInfo.phone}</p>
                <p>{companyInfo.address}</p>
                <p>{companyInfo.hours}</p>
              </div>
            </article>
            <article className="panel rounded-[1.75rem] p-6">
              <p className="eyebrow">WhatsApp</p>
              <a className="mt-4 block text-sm font-semibold text-[var(--color-primary)]" href={companyInfo.whatsapp}>
                Open WhatsApp conversation
              </a>
            </article>
          </div>
          <ContactForm />
        </div>
      </section>
    </PageShell>
  );
}
