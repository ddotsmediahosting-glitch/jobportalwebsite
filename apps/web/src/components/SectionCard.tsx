import type { ReactNode } from "react";

export function SectionCard(props: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">{props.title}</h2>
      {props.children}
    </section>
  );
}
