"use client";

import { useEffect, useRef, useState } from "react";
import { formatLcpMetric } from "@/lib/chrome";
import { subscribeFps } from "@/lib/telemetry";
import { formatKLTime } from "@/lib/time";

interface Props {
  /** null = unknown / not checked yet */
  chatOnline: boolean | null;
  building: string | null;
}

const ROTATION = ["Nujabes — Feather", "Ryo Fukui — Scenery", "LAMP — Yume Utsutsu"] as const;

export function StatusBar({ chatOnline: initial, building }: Props) {
  const [chatOnline, setChatOnline] = useState<boolean | null>(initial);
  const [lcp, setLcp] = useState<string>("—");
  const barRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const syncHostTheme = () => {
      const root = document.documentElement;
      const theme = root.dataset.theme ?? "dark";
      const mode = root.dataset.themeMode ?? "dark";
      if (barRef.current) {
        barRef.current.dataset.theme = theme;
        const header = barRef.current.closest<HTMLElement>("[data-header]");
        if (header) {
          header.dataset.theme = theme;
          header.dataset.themeMode = mode;
        }
      }
    };
    syncHostTheme();
    const obs = new MutationObserver(syncHostTheme);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-theme-mode"],
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const tick = () => {
      if (timeRef.current) {
        const now = new Date();
        const hhmm = formatKLTime(now).replace(/^KL\s*/, "");
        const sec = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Kuala_Lumpur",
          second: "2-digit",
        }).format(now);
        timeRef.current.textContent = `KL ${hhmm}:${sec}`;
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    return subscribeFps((fps) => {
      if (fpsRef.current) fpsRef.current.textContent = `${String(fps).padStart(2, "0")}`;
    });
  }, []);

  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;
    let observer: PerformanceObserver | null = null;
    let paintObserver: PerformanceObserver | null = null;
    let hasRealLcp = false;
    let initRaf = 0;

    const existingLcp = performance.getEntriesByType("largest-contentful-paint");
    if (existingLcp.length > 0) {
      hasRealLcp = true;
      const value = formatLcpMetric(existingLcp[existingLcp.length - 1].startTime);
      initRaf = requestAnimationFrame(() => setLcp(value));
    }

    try {
      observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (!last) return;
        hasRealLcp = true;
        setLcp(formatLcpMetric(last.startTime));
      });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // ignore unsupported buffered LCP observers
    }

    try {
      paintObserver = new PerformanceObserver((list) => {
        if (hasRealLcp) return;
        const fcp = list.getEntries().find((e) => e.name === "first-contentful-paint");
        if (fcp) setLcp(formatLcpMetric(fcp.startTime));
      });
      paintObserver.observe({ type: "paint", buffered: true });
    } catch {
      // ignore unsupported paint observer
    }

    return () => {
      cancelAnimationFrame(initRaf);
      observer?.disconnect();
      paintObserver?.disconnect();
    };
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
    const id = window.setInterval(poll, 60_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const onlineText = chatOnline === null ? "SYNC" : chatOnline ? "C0RE" : "STANDBY";
  const track = building ? `${ROTATION[0]}` : ROTATION[1];

  return (
    <div ref={barRef} className="hud statusbar" data-statusbar aria-label="Telemetry HUD">
      <span className="hud__chip text-hud statusbar__chip" data-readout="loc">
        <span className="hud__k">LOC::</span>
        <span className="hud__v" ref={timeRef}>KL --:--:--</span>
      </span>
      <span className="hud__chip text-hud statusbar__chip" data-readout="fps">
        <span className="hud__k">FPS::</span>
        <span className="hud__v" ref={fpsRef}>60</span>
      </span>
      <span className="hud__chip text-hud statusbar__chip statusbar__chip--wide" data-readout="lcp">
        <span className="hud__k">LCP::</span>
        <span className="hud__v">{lcp}</span>
      </span>
      <span className="hud__chip text-hud statusbar__chip statusbar__chip--wide" data-readout="online">
        <span className={`hud__dot ${chatOnline ? "is-live" : ""}`} aria-hidden="true" />
        <span className="hud__k">ONLINE::</span>
        <span className="hud__v">{onlineText}</span>
      </span>
      <span className="hud__chip text-hud statusbar__chip statusbar__chip--wide" data-readout="listening">
        <span className="hud__k">LISTENING::</span>
        <span className="hud__v hud__v--trunc" title={track}>{track}</span>
      </span>
      <span className="hud__chip hud__chip--booking text-hud statusbar__chip statusbar__chip--wide" data-readout="booking">
        <span className="hud__k">BOOKING::</span>
        <span className="hud__v">OPEN</span>
      </span>
    </div>
  );
}
