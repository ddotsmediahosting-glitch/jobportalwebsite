import { MotionReveal } from "@/components/shared/motion-reveal";
import { getSiteContent } from "@/server/content/store";

export async function StatsStrip() {
  const { companyStats } = await getSiteContent();

  return (
    <section className="section-space pt-0">
      <div className="container-shell">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {companyStats.map((stat, index) => (
            <MotionReveal delay={index * 0.05} key={stat.label}>
              <div className="panel rounded-[1.5rem] p-6">
                <p className="font-display text-3xl font-bold text-[var(--color-primary)]">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  {stat.label}
                </p>
              </div>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
