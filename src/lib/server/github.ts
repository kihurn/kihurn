import "server-only";

export interface ActivityItem {
  repo: string;
  text: string;
  at: string;
  url: string;
}

interface GhEvent {
  type?: string;
  created_at?: string;
  payload?: {
    size?: number;
    commits?: unknown[];
    ref?: string;
    ref_type?: string;
    release?: { tag_name?: string; html_url?: string };
  };
}

function toItem(repo: string, e: GhEvent): ActivityItem | null {
  const at = e.created_at;
  if (!at || Number.isNaN(Date.parse(at))) return null;
  const p = e.payload ?? {};
  if (e.type === "PushEvent") {
    const n = p.size ?? p.commits?.length ?? 0;
    if (n < 1) return null;
    return { repo, text: `pushed ${n} commit${n === 1 ? "" : "s"}`, at, url: `https://github.com/${repo}/commits` };
  }
  if (e.type === "ReleaseEvent" && p.release?.tag_name) {
    return {
      repo,
      text: `released ${p.release.tag_name}`,
      at,
      url: p.release.html_url ?? `https://github.com/${repo}/releases`,
    };
  }
  if (e.type === "CreateEvent" && p.ref_type === "tag" && p.ref) {
    return { repo, text: `tagged ${p.ref}`, at, url: `https://github.com/${repo}/releases/tag/${p.ref}` };
  }
  return null;
}

async function fetchRepo(repo: string, fetchImpl: typeof fetch): Promise<ActivityItem[]> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const base = process.env.GITHUB_API_BASE ?? "https://api.github.com";
    const res = await fetchImpl(`${base}/repos/${repo}/events?per_page=10`, {
      headers,
      next: { revalidate: 3600 },
    } as RequestInit);
    if (!res.ok) return [];
    const events: unknown = await res.json();
    if (!Array.isArray(events)) return [];
    return events.map((e) => toItem(repo, e as GhEvent)).filter((x): x is ActivityItem => x !== null);
  } catch {
    return [];
  }
}

export async function getActivity(repos: string[], limit = 8, fetchImpl: typeof fetch = fetch): Promise<ActivityItem[]> {
  const perRepo = await Promise.all(repos.map((r) => fetchRepo(r, fetchImpl)));
  return perRepo
    .flat()
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, limit);
}
