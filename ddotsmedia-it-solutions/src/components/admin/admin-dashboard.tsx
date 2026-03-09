"use client";

import { useEffect, useMemo, useState } from "react";
import type { SiteContent } from "@/types/site-content";

type AdminDashboardProps = {
  initialContent: SiteContent;
};

type JsonSectionKey =
  | "services"
  | "engagementModels"
  | "portfolioProjects"
  | "blogPosts"
  | "careerOpenings"
  | "faqItems"
  | "industries"
  | "testimonials"
  | "companyStats"
  | "processSteps"
  | "technologies"
  | "whyChooseUs"
  | "industryProblems";

type LeadRecord = {
  id: string;
  channel: string;
  createdAt: string;
  payload: Record<string, unknown>;
  context: {
    ip: string;
    userAgent: string;
    referer: string;
    correlationId: string;
  };
};

const jsonSections: Array<{ key: JsonSectionKey; label: string }> = [
  { key: "services", label: "Services" },
  { key: "engagementModels", label: "Engagement Models" },
  { key: "portfolioProjects", label: "Our Projects" },
  { key: "blogPosts", label: "Blog Posts" },
  { key: "careerOpenings", label: "Career Openings" },
  { key: "faqItems", label: "FAQ Items" },
  { key: "industries", label: "Industries" },
  { key: "testimonials", label: "Testimonials" },
  { key: "companyStats", label: "Stats" },
  { key: "processSteps", label: "Process Steps" },
  { key: "technologies", label: "Technologies" },
  { key: "whyChooseUs", label: "Why Choose Us" },
  { key: "industryProblems", label: "Industry Problems" },
];

export function AdminDashboard({ initialContent }: AdminDashboardProps) {
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState<"content" | "operations">("content");
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [leadFilter, setLeadFilter] = useState("all");

  const jsonState = useMemo(
    () =>
      Object.fromEntries(
        jsonSections.map((section) => [
          section.key,
          JSON.stringify(content[section.key], null, 2),
        ]),
      ) as Record<JsonSectionKey, string>,
    [content],
  );

  const summary = useMemo(
    () => [
      { label: "Services", value: content.services.length },
      { label: "Projects", value: content.portfolioProjects.length },
      { label: "Posts", value: content.blogPosts.length },
      { label: "Open Roles", value: content.careerOpenings.length },
    ],
    [content],
  );

  const filteredLeads = useMemo(() => {
    if (leadFilter === "all") {
      return leads;
    }

    return leads.filter((lead) => lead.channel === leadFilter);
  }, [leadFilter, leads]);

  useEffect(() => {
    async function loadLeads() {
      setLoadingLeads(true);
      const response = await fetch("/api/admin/leads");

      if (!response.ok) {
        setLoadingLeads(false);
        return;
      }

      const payload = (await response.json()) as { leads: LeadRecord[] };
      setLeads(payload.leads);
      setLoadingLeads(false);
    }

    void loadLeads();
  }, []);

  async function saveContent() {
    setSaving(true);
    setStatus("");

    const response = await fetch("/api/admin/content", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(content),
    });

    const payload = await response.json();

    if (!response.ok) {
      setStatus("Save failed. Check any JSON blocks and required fields.");
      setSaving(false);
      return;
    }

    setContent(payload.content);
    setStatus("Content saved successfully.");
    setSaving(false);
  }

  async function resetContent() {
    setSaving(true);
    setStatus("");

    const response = await fetch("/api/admin/content/reset", {
      method: "POST",
    });

    const payload = await response.json();

    if (!response.ok) {
      setStatus("Reset failed.");
      setSaving(false);
      return;
    }

    setContent(payload.content);
    setStatus("Content reset to the default project seed.");
    setSaving(false);
  }

  async function exportContent() {
    await navigator.clipboard.writeText(JSON.stringify(content, null, 2));
    setStatus("Current content JSON copied to clipboard.");
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  function updateJsonSection(key: JsonSectionKey, value: string) {
    try {
      const parsed = JSON.parse(value);
      setContent((current) => ({ ...current, [key]: parsed }));
      setStatus("");
    } catch {
      setStatus(`Invalid JSON in ${key}.`);
    }
  }

  return (
    <div className="section-space">
      <div className="container-shell space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Admin Panel</p>
            <h1 className="section-title mt-3">Edit core website content and theme.</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full border border-white/15 bg-[var(--color-card)] px-5 py-3 text-sm font-semibold"
              onClick={logout}
              type="button"
            >
              Logout
            </button>
            <button
              className="rounded-full border border-white/15 bg-[var(--color-card)] px-5 py-3 text-sm font-semibold"
              onClick={exportContent}
              type="button"
            >
              Export JSON
            </button>
            <button
              className="rounded-full border border-white/15 bg-[var(--color-card)] px-5 py-3 text-sm font-semibold"
              onClick={resetContent}
              type="button"
            >
              Reset Content
            </button>
            <button
              className="rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)]"
              disabled={saving}
              onClick={saveContent}
              type="button"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          {summary.map((item) => (
            <article className="panel rounded-[1.5rem] p-5" key={item.label}>
              <p className="eyebrow">{item.label}</p>
              <p className="mt-3 font-display text-3xl font-bold">{item.value}</p>
            </article>
          ))}
        </section>

        <section className="flex flex-wrap gap-3">
          <button
            className={`rounded-full px-5 py-3 text-sm font-semibold ${
              activeView === "content"
                ? "bg-[var(--color-primary)] text-[var(--color-ink)]"
                : "border border-white/15 bg-[var(--color-card)]"
            }`}
            onClick={() => setActiveView("content")}
            type="button"
          >
            Content
          </button>
          <button
            className={`rounded-full px-5 py-3 text-sm font-semibold ${
              activeView === "operations"
                ? "bg-[var(--color-primary)] text-[var(--color-ink)]"
                : "border border-white/15 bg-[var(--color-card)]"
            }`}
            onClick={() => setActiveView("operations")}
            type="button"
          >
            Operations
          </button>
          <a
            className="rounded-full border border-white/15 bg-[var(--color-card)] px-5 py-3 text-sm font-semibold"
            href="/"
            rel="noreferrer"
            target="_blank"
          >
            Open Website
          </a>
        </section>

        {activeView === "content" ? (
          <>
            <section className="grid gap-4 lg:grid-cols-2">
              <article className="panel rounded-[1.75rem] p-6">
                <p className="eyebrow">Company</p>
                <div className="mt-4 grid gap-3">
                  <input
                    className="rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3"
                    onChange={(event) =>
                      setContent((current) => ({
                        ...current,
                        companyInfo: { ...current.companyInfo, name: event.target.value },
                      }))
                    }
                    placeholder="Company name"
                    value={content.companyInfo.name}
                  />
                  <input
                    className="rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3"
                    onChange={(event) =>
                      setContent((current) => ({
                        ...current,
                        companyInfo: { ...current.companyInfo, email: event.target.value },
                      }))
                    }
                    placeholder="Email"
                    value={content.companyInfo.email}
                  />
                  <input
                    className="rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3"
                    onChange={(event) =>
                      setContent((current) => ({
                        ...current,
                        companyInfo: { ...current.companyInfo, phone: event.target.value },
                      }))
                    }
                    placeholder="Phone"
                    value={content.companyInfo.phone}
                  />
                  <input
                    className="rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3"
                    onChange={(event) =>
                      setContent((current) => ({
                        ...current,
                        companyInfo: { ...current.companyInfo, whatsapp: event.target.value },
                      }))
                    }
                    placeholder="WhatsApp URL"
                    value={content.companyInfo.whatsapp}
                  />
                  <textarea
                    className="min-h-24 rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3"
                    onChange={(event) =>
                      setContent((current) => ({
                        ...current,
                        companyInfo: { ...current.companyInfo, address: event.target.value },
                      }))
                    }
                    placeholder="Address"
                    value={content.companyInfo.address}
                  />
                </div>
              </article>

              <article className="panel rounded-[1.75rem] p-6">
                <p className="eyebrow">Site Settings</p>
                <div className="mt-4 grid gap-3">
                  <input
                    className="rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3"
                    onChange={(event) =>
                      setContent((current) => ({
                        ...current,
                        siteSettings: { ...current.siteSettings, name: event.target.value },
                      }))
                    }
                    value={content.siteSettings.name}
                  />
                  <input
                    className="rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3"
                    onChange={(event) =>
                      setContent((current) => ({
                        ...current,
                        siteSettings: {
                          ...current.siteSettings,
                          shortName: event.target.value,
                        },
                      }))
                    }
                    value={content.siteSettings.shortName}
                  />
                  <textarea
                    className="min-h-28 rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3"
                    onChange={(event) =>
                      setContent((current) => ({
                        ...current,
                        siteSettings: {
                          ...current.siteSettings,
                          description: event.target.value,
                        },
                      }))
                    }
                    value={content.siteSettings.description}
                  />
                  <textarea
                    className="min-h-24 rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3 font-mono text-sm"
                    onChange={(event) =>
                      setContent((current) => ({
                        ...current,
                        siteSettings: {
                          ...current.siteSettings,
                          keywords: event.target.value
                            .split(",")
                            .map((item) => item.trim())
                            .filter(Boolean),
                        },
                      }))
                    }
                    value={content.siteSettings.keywords.join(", ")}
                  />
                </div>
              </article>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <article className="panel rounded-[1.75rem] p-6">
                <p className="eyebrow">Homepage Hero</p>
                <div className="mt-4 grid gap-3">
                  <input
                    className="rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3"
                    onChange={(event) =>
                      setContent((current) => ({
                        ...current,
                        hero: { ...current.hero, eyebrow: event.target.value },
                      }))
                    }
                    value={content.hero.eyebrow}
                  />
                  <textarea
                    className="min-h-24 rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3"
                    onChange={(event) =>
                      setContent((current) => ({
                        ...current,
                        hero: { ...current.hero, title: event.target.value },
                      }))
                    }
                    value={content.hero.title}
                  />
                  <textarea
                    className="min-h-32 rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3"
                    onChange={(event) =>
                      setContent((current) => ({
                        ...current,
                        hero: { ...current.hero, description: event.target.value },
                      }))
                    }
                    value={content.hero.description}
                  />
                </div>
              </article>

              <article className="panel rounded-[1.75rem] p-6">
                <p className="eyebrow">Theme Colors</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {Object.entries(content.theme).map(([key, value]) => (
                    <label className="space-y-2" key={key}>
                      <span className="text-sm font-medium capitalize">{key}</span>
                      <input
                        className="rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3"
                        onChange={(event) =>
                          setContent((current) => ({
                            ...current,
                            theme: {
                              ...current.theme,
                              [key]: event.target.value,
                            },
                          }))
                        }
                        value={value}
                      />
                    </label>
                  ))}
                </div>
              </article>
            </section>

            <section className="grid gap-4">
              {jsonSections.map((section) => (
                <article className="panel rounded-[1.75rem] p-6" key={section.key}>
                  <p className="eyebrow">{section.label}</p>
                  <textarea
                    className="mt-4 min-h-64 w-full rounded-[1.5rem] border border-white/15 bg-[var(--color-card)] px-4 py-3 font-mono text-sm"
                    defaultValue={jsonState[section.key]}
                    onBlur={(event) => updateJsonSection(section.key, event.target.value)}
                  />
                </article>
              ))}
            </section>
          </>
        ) : (
          <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <article className="panel rounded-[1.75rem] p-6">
              <p className="eyebrow">Lead Inbox</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["all", "contact", "consultation", "newsletter", "careers"].map(
                  (item) => (
                    <button
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        leadFilter === item
                          ? "bg-[var(--color-primary)] text-[var(--color-ink)]"
                          : "border border-white/15 bg-[var(--color-card)]"
                      }`}
                      key={item}
                      onClick={() => setLeadFilter(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
              <p className="mt-4 text-sm text-[var(--color-text-muted)]">
                {loadingLeads
                  ? "Loading leads..."
                  : `${filteredLeads.length} lead(s) in the current view.`}
              </p>
            </article>

            <div className="grid gap-4">
              {filteredLeads.length === 0 ? (
                <article className="panel rounded-[1.75rem] p-6 text-sm text-[var(--color-text-muted)]">
                  No leads available yet.
                </article>
              ) : (
                filteredLeads.map((lead) => (
                  <article className="panel rounded-[1.75rem] p-6" key={lead.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="eyebrow">{lead.channel}</p>
                        <h2 className="mt-2 font-display text-xl font-semibold">
                          {String(
                            lead.payload.fullName ??
                              lead.payload.email ??
                              lead.payload.roleSlug ??
                              lead.id,
                          )}
                        </h2>
                      </div>
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                        {new Date(lead.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-[var(--color-text-muted)] md:grid-cols-2">
                      <p>Email: {String(lead.payload.email ?? "-")}</p>
                      <p>Company: {String(lead.payload.company ?? "-")}</p>
                      <p>Service: {String(lead.payload.serviceInterest ?? "-")}</p>
                      <p>IP: {lead.context.ip}</p>
                    </div>
                    <pre className="mt-4 overflow-x-auto rounded-[1rem] border border-white/10 bg-black/10 p-4 text-xs text-[var(--color-text-muted)]">
                      {JSON.stringify(lead.payload, null, 2)}
                    </pre>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {status ? <p className="text-sm text-[var(--color-text-muted)]">{status}</p> : null}
      </div>
    </div>
  );
}
