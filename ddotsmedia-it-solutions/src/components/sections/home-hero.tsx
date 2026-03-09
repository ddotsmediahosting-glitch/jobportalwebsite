import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteContent } from "@/server/content/store";

export async function HomeHero() {
  const content = await getSiteContent();

  return (
    <section className="section-space relative overflow-hidden">
      <div className="glass-orb left-[6%] top-[10%] h-28 w-28 bg-[rgba(238,213,86,0.18)]" />
      <div className="glass-orb bottom-[12%] right-[8%] h-36 w-36 bg-[rgba(241,140,77,0.12)]" />
      <div className="container-shell relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <p className="eyebrow">{content.hero.eyebrow}</p>
          <h1 className="display-title max-w-5xl">{content.hero.title}</h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--color-text-muted)]">
            {content.hero.description}
          </p>
          <div className="flex flex-wrap gap-4">
            <Button href="/consultation">Book a Strategy Call</Button>
            <Button href="/services" variant="secondary">
              Explore Services <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
            {content.hero.highlights.map((item) => (
              <div
                className="rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-4"
                key={item.title}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  {item.title}
                </p>
                <p className="mt-2 text-sm font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="panel relative overflow-hidden rounded-[2rem] p-6">
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
              <p className="font-medium">What Clients Need Most</p>
            </div>
            <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--color-accent-soft)]">
              2026
            </span>
          </div>
          <div className="space-y-4">
            {content.services.slice(0, 3).map((service) => (
              <div
                key={service.slug}
                className="rounded-3xl border border-white/15 bg-[var(--color-card)] p-4 transition hover:-translate-y-0.5 hover:bg-[var(--color-card-strong)]"
              >
                <p className="font-display text-lg font-semibold">{service.title}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
                  {service.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
