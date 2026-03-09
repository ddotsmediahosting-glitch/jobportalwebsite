import Link from "next/link";
import { CtaBand } from "@/components/sections/cta-band";
import { PageShell } from "@/components/shared/page-shell";
import { getSiteContent } from "@/server/content/store";

export default async function BlogPage() {
  const { blogPosts } = await getSiteContent();

  return (
    <>
      <PageShell
        eyebrow="Insights"
        title="A business-facing content hub for search visibility, expertise, and lead nurture."
        description="The blog is structured to support SEO, internal linking, industry positioning, and reusable insight blocks for campaigns and newsletters."
      >
        <section className="section-space pt-0">
          <div className="container-shell grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                className="panel rounded-[1.75rem] p-6"
                href={`/blog/${post.slug}`}
              >
                <p className="eyebrow">{post.category}</p>
                <h2 className="mt-3 font-display text-2xl font-semibold">
                  {post.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
                  {post.excerpt}
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                  {post.publishedAt}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </PageShell>
      <CtaBand
        title="Need content and landing pages that support actual growth?"
        description="We can plan the architecture, templates, SEO structure, and measurement model around your acquisition goals."
      />
    </>
  );
}
