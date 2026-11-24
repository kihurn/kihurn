"use client";

import { useEffect, useState } from "react";
import { formatKLTime } from "@/lib/time";
import { site } from "@/content/site";

interface Props {
  /** null = unknown / not checked yet */
  chatOnline: boolean | null;
  building: string | null;
}

export function StatusBar({ chatOnline: initial, building }: Props) {
  const [chatOnline, setChatOnline] = useState<boolean | null>(initial);
  // render a stable placeholder on the server, then tick on the client
  const [time, setTime] = useState("KL --:--");
  useEffect(() => {
    const tick = () => setTime(formatKLTime(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const r = await fetch("/api/chat/health");
        const j = (await r.json()) as { online?: boolean };
        if (alive) setChatOnline(Boolean(j.online));
      } catch {
        if (alive) setChatOnline(false);
      }
    };
    poll();
    const id = setInterval(poll, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const chat = chatOnline === null ? "…" : chatOnline ? "ONLINE" : "NAPPING";

  return (
    <div className="hud statusbar" data-statusbar aria-label="Status">
      <span className="hud__chip text-hud statusbar__chip" data-readout="time">
        <span className="hud__v">{time}</span>
      </span>
      <span className="hud__chip text-hud statusbar__chip" data-readout="chat">
        <span className="hud__k">CHAT::</span>
        <span className="hud__v">{chat}</span>
      </span>
      <span className="hud__chip text-hud statusbar__chip statusbar__chip--wide" data-readout="status">
        <span className="hud__v">{site.statusLine}</span>
      </span>
      <span className="hud__chip text-hud statusbar__chip statusbar__chip--wide" data-readout="building">
        <span className="hud__k">BUILDING::</span>
        <span className="hud__v">{building ? building.toUpperCase() : "—"}</span>
      </span>
    </div>
  );
}
