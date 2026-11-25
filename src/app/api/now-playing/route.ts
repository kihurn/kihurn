import type { NowPlaying } from "@/lib/nowPlaying";

let cache: { until: number; result: Promise<NowPlaying> } | undefined;
let token: { value: string; until: number } | undefined;

async function fetchNowPlaying(): Promise<NowPlaying> {
  const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret, SPOTIFY_REFRESH_TOKEN: refresh } = process.env;
  if (!id || !secret || !refresh) return { status: "unconfigured" };

  try {
    if (!token || token.until <= Date.now()) {
      const auth = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }),
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      });
      if (!auth.ok) return { status: "unavailable" };
      const data = await auth.json() as { access_token?: string; expires_in?: number };
      if (!data.access_token) return { status: "unavailable" };
      token = { value: data.access_token, until: Date.now() + Math.max(0, (data.expires_in ?? 0) - 30) * 1000 };
    }

    const result = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${token.value}` },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (result.status === 204) return { status: "idle" };
    if (result.status === 401) token = undefined;
    if (!result.ok) return { status: "unavailable" };
    const data = await result.json() as {
      is_playing?: boolean;
      device?: { is_private_session?: boolean };
      item?: { type?: string; id?: string; name?: string; artists?: { name: string }[] };
    };
    const item = data.item;
    if (!data.is_playing || data.device?.is_private_session || item?.type !== "track" || !item.name) return { status: "idle" };
    const url = item.id && /^[a-zA-Z0-9]{22}$/.test(item.id) ? `https://open.spotify.com/track/${item.id}` : null;
    return { status: "playing", title: item.name, artist: item.artists?.map((artist) => artist.name).join(", ") || "Spotify", url };
  } catch {
    return { status: "unavailable" };
  }
}

export async function GET() {
  if (!cache || Date.now() >= cache.until) cache = { until: Date.now() + 15_000, result: fetchNowPlaying() };
  return Response.json(await cache.result, { headers: { "Cache-Control": "public, s-maxage=15" } });
}
