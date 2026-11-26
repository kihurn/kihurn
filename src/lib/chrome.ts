export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export const TOUCH_LAYOUT_QUERY = "(hover: none) and (pointer: coarse)";

export function normalizeThemeMode(raw: string | null | undefined): ThemeMode {
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "dark";
}

export function resolveThemeMode(mode: ThemeMode, prefersLight: boolean): ResolvedTheme {
  if (mode === "system") return prefersLight ? "light" : "dark";
  return mode;
}

export function getThemeMetaColor(resolved: ResolvedTheme): string {
  return resolved === "light" ? "#d6d6d5" : "#1e1e1e";
}

export function getMonogramPrefix(pathname: string): string {
  if (!pathname || pathname === "/") return "KH";
  if (pathname.startsWith("/about")) return "About";
  if (pathname.startsWith("/lab")) return "Lab";
  if (pathname.startsWith("/writing")) return "Writing";
  if (pathname.startsWith("/studio")) return "Studio";
  if (pathname.startsWith("/contact")) return "Contact";
  if (pathname.startsWith("/changelog")) return "Changelog";
  if (pathname.startsWith("/gigs")) return "Gigs";
  return "KH";
}

export function formatLcpMetric(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  return ms >= 100 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}
