"use client";

import { useNowPlaying } from "@/components/chrome/NowPlayingProvider";

export function Cassette() {
  const track = useNowPlaying();
  const playing = track?.status === "playing";
  const title = playing ? track.title
    : track?.status === "unconfigured" ? "Spotify disconnected"
    : track?.status === "unavailable" ? "Signal unavailable"
    : track?.status === "idle" ? "Nothing playing"
    : "Checking Spotify";

  return (
    <div className="cassette" data-playing={playing}>
      <div className="cassette__body">
        <div className="cassette__back" aria-hidden="true" />
        <div className="cassette__edge" aria-hidden="true" />
        <div className="cassette__face">
          <div className="cassette__label">
            <div className="cassette__meta text-mono-sm">
              <span><i aria-hidden="true" />{playing ? "NOW PLAYING" : "OFF AIR"}</span>
              <span>SPOTIFY</span>
            </div>
            <strong className="cassette__title" aria-live="polite">
              {playing && track.url ? <a href={track.url} target="_blank" rel="noreferrer">{title}</a> : title}
            </strong>
            {playing ? <span className="cassette__artist">{track.artist}</span> : null}
          </div>
          <div className="cassette__window" aria-hidden="true">
            <span className="cassette__hub" />
            <span className="cassette__ribbon" />
            <span className="cassette__hub" />
          </div>
          <div className="cassette__head" aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="cassette__screws" aria-hidden="true"><i /><i /><i /><i /></div>
        </div>
      </div>
    </div>
  );
}
