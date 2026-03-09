"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { mainNavigation } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/15 bg-[var(--color-surface-elevated)]/90 backdrop-blur-xl">
      <div className="container-shell flex h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo compact />
          <div className="hidden border-l border-white/15 pl-4 text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)] xl:block">
            IT Solutions
          </div>
        </div>

        <nav aria-label="Primary navigation" className="hidden items-center gap-6 md:flex">
          {mainNavigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                className={cn(
                  "text-sm font-medium text-[var(--color-text-muted)] transition hover:text-white",
                  isActive && "text-[var(--color-primary)]",
                )}
                href={item.href as Route}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Button className="hidden md:inline-flex" href="/consultation">
            Book a Consultation
          </Button>
          <button
            aria-controls="mobile-navigation"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[var(--color-card)] text-white transition hover:bg-[var(--color-card-strong)] md:hidden"
            onClick={() => setIsOpen((current) => !current)}
            type="button"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div
          className="border-t border-white/10 bg-[rgba(30,84,89,0.9)] px-4 py-4 md:hidden"
          id="mobile-navigation"
        >
          <div className="container-shell space-y-3">
            {mainNavigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  className={cn(
                    "block rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-[var(--color-text-muted)] transition hover:border-white/10 hover:bg-white/5 hover:text-white",
                    isActive &&
                      "border-white/15 bg-[var(--color-card)] text-[var(--color-primary)]",
                  )}
                  href={item.href as Route}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <Button className="mt-2 w-full" href="/consultation" onClick={() => setIsOpen(false)}>
              Book a Consultation
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
