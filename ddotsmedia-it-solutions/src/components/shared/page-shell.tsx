import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type PageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function PageShell({
  eyebrow,
  title,
  description,
  children,
}: PageShellProps) {
  return (
    <main id="main-content">
      <section className="section-space">
        <div className="container-shell">
          <div className="panel rounded-[2rem] px-6 py-14 md:px-10">
            <div className="max-w-4xl space-y-6">
              <p className="eyebrow">{eyebrow}</p>
              <h1 className="display-title max-w-4xl text-balance">{title}</h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--color-text-muted)]">
                {description}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button href="/contact">Start a Project</Button>
                <Button href="/portfolio" variant="secondary">
                  View Case Studies <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {children}
    </main>
  );
}
