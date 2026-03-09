import Link from "next/link";
import type { ComponentPropsWithoutRef, ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  href?: ComponentProps<typeof Link>["href"];
  variant?: "primary" | "secondary" | "ghost";
};

const variants = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-ink)] hover:bg-[var(--color-accent-soft)]",
  secondary:
    "border border-[var(--color-border)] bg-white/8 text-white hover:bg-[var(--color-card-strong)]",
  ghost: "text-[var(--color-text-muted)] hover:text-white",
};

export function Button({
  className,
  variant = "primary",
  href,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
    variants[variant],
    className,
  );

  if (href) {
    return (
      <Link className={classes} href={href}>
        {props.children}
      </Link>
    );
  }

  return <button className={classes} {...props} />;
}
