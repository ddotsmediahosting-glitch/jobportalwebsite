import { Button } from "@/components/ui/button";

type CtaBandProps = {
  title: string;
  description: string;
};

export function CtaBand({ title, description }: CtaBandProps) {
  return (
    <section className="section-space">
      <div className="container-shell">
        <div className="panel rounded-[2rem] px-6 py-10 md:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow">Ready To Build</p>
              <h2 className="section-title mt-3">{title}</h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--color-text-muted)]">
                {description}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button href="/consultation">Book Consultation</Button>
              <Button href="/contact" variant="secondary">
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
