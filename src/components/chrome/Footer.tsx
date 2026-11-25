"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { site } from "@/content/site";
import { subscribeFps, subscribeScroll } from "@/lib/telemetry";
import { formatKLTime } from "@/lib/time";
import { PALETTE_PAGES } from "./nav";

export function Footer() {
  const timeRef = useRef<HTMLSpanElement>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);
  const scrollRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const tick = () => {
      if (timeRef.current) {
        const now = new Date();
        const hhmm = formatKLTime(now).replace(/^KL\s*/, "");
        timeRef.current.textContent = `KL ${hhmm}`;
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    return subscribeFps((fps) => {
      if (fpsRef.current) fpsRef.current.textContent = String(fps).padStart(2, "0");
    });
  }, []);

  useEffect(() => {
    return subscribeScroll((progress) => {
      if (scrollRef.current) {
        scrollRef.current.textContent = `${String(Math.round(progress * 100)).padStart(3, "0")}%`;
      }
    });
  }, []);

  return (
    <footer className="footer">
      <div className="footer__col">
        <nav className="footer__nav text-meta" aria-label="Footer">
          {PALETTE_PAGES.map((n) => (
            <Link key={n.href} href={n.href}>{n.label}</Link>
          ))}
        </nav>
        <ul className="footer__links text-meta">
          <li><a href={site.github} target="_blank" rel="noopener noreferrer">GitHub</a></li>
          <li><a href={site.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
          <li><a href={`mailto:${site.email}`}>{site.email}</a></li>
        </ul>
      </div>
      <div className="footer__hud text-hud" aria-label="Footer telemetry">
        <span className="footer__chip">
          <span className="hud__k">LOC::</span>
          <span className="hud__v" ref={timeRef}>KL --:--</span>
        </span>
        <span className="footer__chip">
          <span className="hud__k">FPS::</span>
          <span className="hud__v" ref={fpsRef}>60</span>
        </span>
        <span className="footer__chip">
          <span className="hud__k">BOOKING::</span>
          <span className="hud__v">OPEN</span>
        </span>
        <span className="footer__chip">
          <span className="hud__k">SCROLL::</span>
          <span className="hud__v" ref={scrollRef}>000%</span>
        </span>
      </div>
    </footer>
  );
}
