import "server-only";

const TTL_MS = 30_000;
let cache: { at: number; online: boolean } | null = null;

export function resetHealthCache() {
  cache = null;
}

export async function isC0reOnline(
  opts: { fetchImpl?: typeof fetch; now?: () => number; timeoutMs?: number } = {},
): Promise<boolean> {
  const { fetchImpl = fetch, now = Date.now, timeoutMs = 2000 } = opts;
  const t = now();
  if (cache && t - cache.at < TTL_MS) return cache.online;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  let online = false;
  try {
    const res = await fetchImpl(`${process.env.C0RE_URL ?? ""}${process.env.C0RE_HEALTH_PATH ?? "/api/tags"}`, {
      signal: ctl.signal,
      headers: { Authorization: `Bearer ${process.env.C0RE_API_KEY ?? ""}` },
      cache: "no-store",
    });
    online = res.ok;
  } catch {
    online = false;
  } finally {
    clearTimeout(timer);
  }
  cache = { at: t, online };
  return online;
}
