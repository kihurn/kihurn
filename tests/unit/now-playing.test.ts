import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

function configure() {
  vi.stubEnv("SPOTIFY_CLIENT_ID", "client");
  vi.stubEnv("SPOTIFY_CLIENT_SECRET", "secret");
  vi.stubEnv("SPOTIFY_REFRESH_TOKEN", "refresh");
}

describe("Spotify now playing", () => {
  it("reports a disconnected account when credentials are missing", async () => {
    vi.stubEnv("SPOTIFY_REFRESH_TOKEN", "");
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    const { GET } = await import("@/app/api/now-playing/route");
    expect(await (await GET()).json()).toEqual({ status: "unconfigured" });
    expect(request).not.toHaveBeenCalled();
  });

  it("reads the current track and shares its short cache across visitors", async () => {
    configure();
    const id = "0123456789ABCDEFGHIJKL";
    const request = vi.fn()
      .mockResolvedValueOnce(Response.json({ access_token: "access", expires_in: 3600 }))
      .mockResolvedValueOnce(Response.json({
        is_playing: true,
        item: { type: "track", id, name: "Test title", artists: [{ name: "Test artist" }] },
      }));
    vi.stubGlobal("fetch", request);
    const { GET } = await import("@/app/api/now-playing/route");
    const responses = await Promise.all([GET(), GET()]);
    for (const response of responses) {
      expect(await response.json()).toEqual({
        status: "playing",
        title: "Test title",
        artist: "Test artist",
        url: `https://open.spotify.com/track/${id}`,
      });
    }
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[1][0]).toBe("https://api.spotify.com/v1/me/player/currently-playing");
    expect(request.mock.calls[1][1].method ?? "GET").toBe("GET");
  });

  it.each([
    { is_playing: false },
    { is_playing: true, device: { is_private_session: true } },
  ])("reports idle for paused or private playback", async (playback) => {
    configure();
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(Response.json({ access_token: "access", expires_in: 3600 }))
      .mockResolvedValueOnce(Response.json({ ...playback, item: { type: "track", name: "Hidden track" } })));
    const { GET } = await import("@/app/api/now-playing/route");
    expect(await (await GET()).json()).toEqual({ status: "idle" });
  });
});
