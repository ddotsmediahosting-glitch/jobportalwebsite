"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { services } from "@/data/services";
import {
  type ContactInput,
  contactSchema,
} from "@/validation/contact";

export function ContactForm() {
  const [serverMessage, setServerMessage] = useState<string>("");
  const [serverError, setServerError] = useState<string>("");
  const [submittedAt] = useState(() => Date.now().toString());
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      website: "",
      submittedAt,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError("");
    setServerMessage("");

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      setServerError("We could not send your inquiry. Please try again.");
      return;
    }

    setServerMessage("Inquiry sent successfully. Our team will follow up shortly.");
    reset();
  });

  return (
    <form className="panel rounded-[1.75rem] p-6" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Full Name</span>
          <input
            className="w-full rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3 outline-none"
            {...register("fullName")}
            placeholder="Your name"
          />
          {errors.fullName && (
            <span className="text-sm text-[var(--color-danger)]">
              {errors.fullName.message}
            </span>
          )}
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Email</span>
          <input
            className="w-full rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3 outline-none"
            {...register("email")}
            placeholder="you@company.com"
          />
          {errors.email && (
            <span className="text-sm text-[var(--color-danger)]">
              {errors.email.message}
            </span>
          )}
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Company</span>
          <input
            className="w-full rounded-2xl border border-white/15 bg-[var(--color-card)] px-4 py-3 outline-none"
            {...register("company")}
            placeholder="Company name"
          />
          {errors.company && (
            <span className="text-sm text-[var(--color-danger)]">
              {errors.company.message}
            </span>
          )}
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Service Interest</span>
          <select
            className="w-full rounded-2xl border border-white/15 bg-[var(--color-surface-soft)] px-4 py-3 outline-none"
            {...register("serviceInterest")}
          >
            <option value="">Select a service</option>
            {services.map((service) => (
              <option key={service.slug} value={service.title}>
                {service.title}
              </option>
            ))}
          </select>
          {errors.serviceInterest && (
            <span className="text-sm text-[var(--color-danger)]">
              {errors.serviceInterest.message}
            </span>
          )}
        </label>
      </div>
      <input type="hidden" {...register("website")} />
      <input type="hidden" {...register("submittedAt")} />
      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium">Project Brief</span>
        <textarea
          className="min-h-40 w-full rounded-[1.5rem] border border-white/15 bg-[var(--color-card)] px-4 py-3 outline-none"
          {...register("message")}
          placeholder="Tell us what you need, your goals, timeline, and any key constraints."
        />
        {errors.message && (
          <span className="text-sm text-[var(--color-danger)]">
            {errors.message.message}
          </span>
        )}
      </label>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          className="rounded-full bg-[var(--color-primary)] px-5 py-3 font-semibold text-[var(--color-ink)]"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Sending..." : "Send Inquiry"}
        </button>
        {serverMessage ? (
          <p className="text-sm text-[var(--color-accent)]">{serverMessage}</p>
        ) : null}
        {serverError ? (
          <p className="text-sm text-[var(--color-danger)]">{serverError}</p>
        ) : null}
      </div>
    </form>
  );
}
