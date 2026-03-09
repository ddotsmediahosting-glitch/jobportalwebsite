import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  compact?: boolean;
};

export function Logo({ className, compact = false }: LogoProps) {
  return (
    <Link
      aria-label="Ddotsmedia IT Solutions home"
      className={cn("inline-flex items-center gap-3", className)}
      href="/"
    >
      <Image
        alt="Ddotsmedia logo"
        className={cn("h-auto", compact ? "w-28" : "w-36 sm:w-40")}
        height={260}
        priority
        src="/ddotsmedia-logo.svg"
        width={720}
      />
    </Link>
  );
}
