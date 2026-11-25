"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { NowPlaying } from "@/lib/nowPlaying";

const NowPlayingContext = createContext<NowPlaying | null>(null);

export function NowPlayingProvider({ children }: { children: ReactNode }) {
  const [track, setTrack] = useState<NowPlaying | null>(null);

  useEffect(() => {
    let controller: AbortController | undefined;
    let configured = true;

    async function update() {
      if (!configured || document.hidden || controller) return;
      const request = new AbortController();
      controller = request;
      try {
        const response = await fetch("/api/now-playing", { signal: request.signal });
        if (!response.ok) throw new Error("Now playing unavailable");
        const current: NowPlaying = await response.json();
        if (request.signal.aborted) return;
        configured = current.status !== "unconfigured";
        setTrack(current);
      } catch {
        if (!request.signal.aborted) setTrack({ status: "unavailable" });
      } finally {
        if (controller === request) controller = undefined;
      }
    }

    void update();
    const interval = window.setInterval(update, 20_000);
    document.addEventListener("visibilitychange", update);
    return () => {
      controller?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return <NowPlayingContext.Provider value={track}>{children}</NowPlayingContext.Provider>;
}

export function useNowPlaying() {
  return useContext(NowPlayingContext);
}
