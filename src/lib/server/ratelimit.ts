import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type Bucket = "chat" | "contact";
export interface LimitResult {
  allowed: boolean;
  retryAfterS?: number;
}

const WINDOWS: Record<Bucket, { ms: number; max: number; label: string }[]> = {
  chat: [
    { ms: 60_000, max: 10, label: "1 m" },
    { ms: 86_400_000, max: 50, label: "1 d" },
  ],
  contact: [
    { ms: 600_000, max: 3, label: "10 m" },
    { ms: 86_400_000, max: 10, label: "1 d" },
  ],
};

let clock: () => number = Date.now;
export const setClock = (fn: () => number) => {
  clock = fn;
};

const hits = new Map<string, number[]>();
export const resetLimits = () => hits.clear();

let warned = false;
function memoryCheck(key: string, bucket: Bucket): LimitResult {
  const now = clock();
  const wins = WINDOWS[bucket];
  const k = `${bucket}:${key}`;
  const longest = wins[wins.length - 1].ms;
  const list = (hits.get(k) ?? []).filter((t) => now - t < longest);
  for (const w of wins) {
    const inWin = list.filter((t) => now - t < w.ms);
    if (inWin.length >= w.max) {
      const oldest = inWin[0];
      hits.set(k, list);
      return { allowed: false, retryAfterS: Math.max(1, Math.ceil((oldest + w.ms - now) / 1000)) };
    }
  }
  list.push(now);
  hits.set(k, list);
  return { allowed: true };
}

const upstash = new Map<string, Ratelimit>();
function upstashLimiter(bucket: Bucket, i: number): Ratelimit {
  const id = `${bucket}${i}`;
  let rl = upstash.get(id);
  if (!rl) {
    const w = WINDOWS[bucket][i];
    rl = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(w.max, w.label as `${number} ${"m" | "d"}`),
      prefix: `kh:${id}`,
    });
    upstash.set(id, rl);
  }
  return rl;
}

export async function checkLimit(key: string, bucket: Bucket): Promise<LimitResult> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      for (let i = 0; i < WINDOWS[bucket].length; i++) {
        const r = await upstashLimiter(bucket, i).limit(key);
        if (!r.success) return { allowed: false, retryAfterS: Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)) };
      }
      return { allowed: true };
    } catch {
    }
  } else if (process.env.NODE_ENV === "production" && !warned) {
    warned = true;
    console.warn("ratelimit: Upstash env vars missing, using per-instance memory limits");
  }
  return memoryCheck(key, bucket);
}
