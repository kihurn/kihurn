"use client";

import { usePathname } from "next/navigation";
import { getMonogramPrefix } from "@/lib/chrome";

export function Wordmark({ short = false }: { short?: boolean }) {
  const pathname = usePathname() || "/";
  const prefix = short ? "KH" : getMonogramPrefix(pathname);

  return (
    <span className="logo logo--wordmark wordmark" aria-hidden="true">
      <span className="wordmark__prefix">{prefix}</span>
      <span className="wordmark__colon">::</span>
    </span>
  );
}
