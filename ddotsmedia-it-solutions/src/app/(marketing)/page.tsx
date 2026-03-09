import { HomeHero } from "@/components/sections/home-hero";
import { BlogSection } from "@/components/sections/blog-section";
import { CtaBand } from "@/components/sections/cta-band";
import { FaqSection } from "@/components/sections/faq-section";
import { PortfolioSection } from "@/components/sections/portfolio-section";
import { ProcessSection } from "@/components/sections/process-section";
import { ServiceGridSection } from "@/components/sections/service-grid";
import { StatsStrip } from "@/components/sections/stats-strip";
import { TechStackSection } from "@/components/sections/tech-stack-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { WhyChooseSection } from "@/components/sections/why-choose-section";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Ddotsmedia IT Solutions",
  description:
    "Premium IT solutions website scaffold for web, mobile, cloud, and AI delivery.",
  pathname: "/",
});

export default function HomePage() {
  return (
    <main id="main-content">
      <HomeHero />
      <StatsStrip />
      <ServiceGridSection />
      <WhyChooseSection />
      <ProcessSection />
      <PortfolioSection />
      <TechStackSection />
      <TestimonialsSection />
      <BlogSection />
      <FaqSection />
      <CtaBand
        title="Need a website or software product that looks premium and performs like a real business asset?"
        description="Book a consultation with Ddotsmedia IT Solutions to discuss your goals, architecture options, launch priorities, and the fastest path to a production-ready outcome."
      />
    </main>
  );
}
