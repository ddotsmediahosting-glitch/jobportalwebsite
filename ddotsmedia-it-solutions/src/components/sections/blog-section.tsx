import Link from "next/link";
import { MotionReveal } from "@/components/shared/motion-reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { getSiteContent } from "@/server/content/store";

export async function BlogSection() {
  const { blogPosts } = await getSiteContent();

  return (
    <section className="section-space">
      <div className="container-shell space-y-10">
        <SectionHeading
          eyebrow="Insights"
          title="Content blocks are being shaped for thought leadership and search visibility."
          description="The blog is structured for SEO-rich internal linking, article templates, and future content publishing workflows."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {blogPosts.map((post, index) => (
            <MotionReveal delay={index * 0.04} key={post.slug}>
              <Link
                className="panel block h-full rounded-[1.75rem] p-6"
                href={`/blog/${post.slug}`}
              >
                <p className="eyebrow">{post.category}</p>
                <h3 className="mt-3 font-display text-2xl font-semibold">
                  {post.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">
                  {post.excerpt}
                </p>
              </Link>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
