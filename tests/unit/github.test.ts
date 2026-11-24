import { afterEach, describe, expect, it } from "vitest";
import { getActivity } from "@/lib/server/github";
import { getActivityRepos } from "@/lib/projects";
import { projects } from "@/content/projects";

type Ev = Record<string, unknown>;
const push = (n: number, at: string): Ev => ({
  type: "PushEvent",
  created_at: at,
  payload: { size: n, commits: Array.from({ length: n }, () => ({})), ref: "refs/heads/main" },
});

function fakeFetch(map: Record<string, { status: number; body?: Ev[] }>, seen: { url: string; init?: RequestInit }[] = []) {
  return (async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url);
    seen.push({ url: u, init });
    const key = Object.keys(map).find((k) => u.includes(`/repos/${k}/events`));
    const r = key ? map[key] : { status: 404 };
    return new Response(JSON.stringify(r.body ?? []), { status: r.status });
  }) as unknown as typeof fetch;
}

afterEach(() => {
  delete process.env.GITHUB_TOKEN;
});

describe("getActivity", () => {
  it("turns a push of 3 commits into 'pushed 3 commits'", async () => {
    const f = fakeFetch({ "a/one": { status: 200, body: [push(3, "2026-11-20T10:00:00Z")] } });
    const out = await getActivity(["a/one"], 8, f);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ repo: "a/one", text: "pushed 3 commits", at: "2026-11-20T10:00:00Z" });
    expect(out[0].url).toMatch(/^https:\/\/github\.com\/a\/one/);
  });

  it("uses the singular for one commit", async () => {
    const f = fakeFetch({ "a/one": { status: 200, body: [push(1, "2026-11-20T10:00:00Z")] } });
    expect((await getActivity(["a/one"], 8, f))[0].text).toBe("pushed 1 commit");
  });

  it("reports releases and tags, and ignores other events", async () => {
    const f = fakeFetch({
      "a/one": {
        status: 200,
        body: [
          { type: "ReleaseEvent", created_at: "2026-11-21T00:00:00Z", payload: { release: { tag_name: "v1.2", html_url: "https://github.com/a/one/releases/tag/v1.2" } } },
          { type: "CreateEvent", created_at: "2026-11-20T00:00:00Z", payload: { ref_type: "tag", ref: "v1.1" } },
          { type: "CreateEvent", created_at: "2026-11-19T00:00:00Z", payload: { ref_type: "branch", ref: "dev" } },
          { type: "WatchEvent", created_at: "2026-11-18T00:00:00Z", payload: {} },
        ],
      },
    });
    const out = await getActivity(["a/one"], 8, f);
    expect(out.map((o) => o.text)).toEqual(["released v1.2", "tagged v1.1"]);
  });

  it("merges repos newest first and cuts to the limit", async () => {
    const f = fakeFetch({
      "a/one": { status: 200, body: [push(1, "2026-11-10T00:00:00Z"), push(2, "2026-11-01T00:00:00Z")] },
      "b/two": { status: 200, body: [push(4, "2026-11-15T00:00:00Z")] },
    });
    const out = await getActivity(["a/one", "b/two"], 8, f);
    expect(out.map((o) => o.repo)).toEqual(["b/two", "a/one", "a/one"]);
    expect(await getActivity(["a/one", "b/two"], 2, f)).toHaveLength(2);
  });

  it("survives one repo 404ing and another 403ing: returns the good repo's items, no throw", async () => {
    const f = fakeFetch({
      "gone/repo": { status: 404 },
      "limited/repo": { status: 403 },
      "ok/repo": { status: 200, body: [push(2, "2026-11-12T00:00:00Z")] },
    });
    const out = await getActivity(["gone/repo", "limited/repo", "ok/repo"], 8, f);
    expect(out.map((o) => o.repo)).toEqual(["ok/repo"]);
  });

  it("returns [] when the network fails", async () => {
    const f = (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    await expect(getActivity(["a/one", "b/two"], 8, f)).resolves.toEqual([]);
  });

  it("returns [] when GitHub sends junk", async () => {
    const f = (async () => new Response("<html>nope</html>", { status: 200 })) as unknown as typeof fetch;
    await expect(getActivity(["a/one"], 8, f)).resolves.toEqual([]);
  });

  it("sends Authorization only when GITHUB_TOKEN is set, and asks for hourly revalidation", async () => {
    const seen: { url: string; init?: RequestInit }[] = [];
    const f = fakeFetch({ "a/one": { status: 200, body: [] } }, seen);
    await getActivity(["a/one"], 8, f);
    expect(new Headers(seen[0].init?.headers).get("authorization")).toBeNull();
    expect((seen[0].init as { next?: { revalidate?: number } }).next?.revalidate).toBe(3600);
    process.env.GITHUB_TOKEN = "ghp_test";
    await getActivity(["a/one"], 8, f);
    expect(new Headers(seen[1].init?.headers).get("authorization")).toBe("Bearer ghp_test");
  });
});

describe("getActivityRepos", () => {
  it("lists repos of home or ecosystem projects, never the profile repo", () => {
    const repos = getActivityRepos(projects);
    expect(repos).toEqual(expect.arrayContaining(["kihurn/Otto", "kihurn/C0RE", "kihurn/Billy", "kihurn/V4ULT"]));
    expect(repos).not.toContain("kihurn/kihurn");
    expect(repos).not.toContain("YusriArman/op-26");
  });
});
