export function CmsPage({ title }: { title: string }) {
  return (
    <div className="prose max-w-none rounded border bg-white p-4">
      <h1>{title}</h1>
      <p>Content managed by admin CMS endpoint (placeholder for About/Contact/Privacy/Terms).</p>
    </div>
  );
}
