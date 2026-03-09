import { CtaBand } from "@/components/sections/cta-band";
import { FaqSection } from "@/components/sections/faq-section";
import { PageShell } from "@/components/shared/page-shell";

export default function FaqPage() {
  return (
    <>
      <PageShell
        eyebrow="FAQ"
        title="Questions clients ask before they commit to a digital partner."
        description="This page is designed to remove uncertainty around scope, process, technology choices, AI use, and support expectations."
      />
      <FaqSection />
      <CtaBand
        title="Still have questions about process, pricing, or scope?"
        description="Use the consultation or contact flow and we will respond with a practical recommendation rather than a generic sales reply."
      />
    </>
  );
}
