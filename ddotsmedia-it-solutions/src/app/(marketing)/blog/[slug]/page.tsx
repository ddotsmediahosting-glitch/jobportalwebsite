import { notFound } from "next/navigation";
import { CtaBand } from "@/components/sections/cta-band";
import { PageShell } from "@/components/shared/page-shell";
import { getSiteContent } from "@/server/content/store";

export async function generateStaticParams() {
  const { blogPosts } = await getSiteContent();
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { blogPosts } = await getSiteContent();
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <PageShell
        eyebrow={post.category}
        title={post.title}
        description={post.excerpt}
      >
        <section className="section-space pt-0">
          <div className="container-shell grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="panel rounded-[1.75rem] p-6">
              <p className="text-sm leading-8 text-[var(--color-text-muted)]">
                This article template is ready for full MDX rendering, author
                metadata, related posts, newsletter capture, and structured SEO
                enhancements. The current build keeps the route production-ready
                while the editorial layer is expanded in the next content pass.
              </p>
            </article>
            <aside className="panel rounded-[1.75rem] p-6">
              <p className="eyebrow">Published</p>
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                {post.publishedAt}
              </p>
            </aside>
          </div>
        </section>
      </PageShell>
      <CtaBand
        title="Want content that positions your company as the obvious technical partner?"
        description="We can build the page templates, category structure, and conversion pathways around your services and industry targets."
      />
    </>
  );
}
