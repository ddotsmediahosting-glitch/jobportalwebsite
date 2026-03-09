import { PageShell } from "@/components/shared/page-shell";
import { CtaBand } from "@/components/sections/cta-band";
import { ProcessSection } from "@/components/sections/process-section";
import { StatsStrip } from "@/components/sections/stats-strip";
import { WhyChooseSection } from "@/components/sections/why-choose-section";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "About Us",
  description: "Learn about Ddotsmedia IT Solutions and its delivery philosophy.",
  pathname: "/about",
});

export default function AboutPage() {
  return (
    <>
      <PageShell
        eyebrow="About"
        title="Ddotsmedia IT Solutions helps ambitious businesses turn technology into a growth engine."
        description="We work at the intersection of design, engineering, SEO, cloud delivery, and AI automation. The goal is straightforward: build digital systems that improve visibility, trust, operations, and commercial performance."
      />
      <StatsStrip />
      <WhyChooseSection />
      <ProcessSection />
      <CtaBand
        title="Need a delivery partner that can handle product thinking and execution?"
        description="We support businesses that want sharper digital positioning, better systems, and more disciplined technical delivery."
      />
    </>
  );
}
