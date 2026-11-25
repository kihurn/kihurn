export type NowPlaying =
  | { status: "unconfigured" | "unavailable" | "idle" }
  | { status: "playing"; title: string; artist: string; url: string | null };
