"use client";

import { useEffect, useState } from "react";
import { calendarWeeks, type ContributionDay } from "@/lib/contributions";

const CACHE_KEY = "kh:github-calendar:v1";
const format = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

export function ContributionCalendar({ today }: { today: string }) {
  const [days, setDays] = useState<ContributionDay[]>([]);
  const [activeCell, setActiveCell] = useState("");
  const cells = calendarWeeks(days, today);
  const total = (days.length ? days : cells).reduce((sum, day) => sum + (day?.count ?? 0), 0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const cache = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null");
        if (Array.isArray(cache?.days) && cache.days.length >= 350) {
          setDays(cache.days);
          if (Date.now() - cache.fetchedAt < 3_600_000) return;
        }
      } catch {}

      try {
        const response = await fetch("/api/contributions", { signal: controller.signal });
        if (!response.ok) return;
        const incoming = await response.json() as ContributionDay[];
        if (controller.signal.aborted || incoming.length < 350) return;
        setDays(incoming);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ days: incoming, fetchedAt: Date.now() }));
      } catch {}
    }

    void load();
    return () => controller.abort();
  }, []);

  return (
    <>
      <div className="github-calendar" role="group" aria-label="GitHub contribution calendar">
        {cells.map((day, index) => {
          if (!day) return <i key={index} aria-hidden="true" />;
          const label = `${day.count} contribution${day.count === 1 ? "" : "s"} · ${format.format(new Date(day.date))}`;
          const intensity = 0.1 + day.level * 0.19;
          return (
            <button
              key={day.date}
              type="button"
              aria-label={label}
              data-day={day.date}
              tabIndex={day.date === (activeCell || today) ? 0 : -1}
              style={{ "--cell-ink": intensity } as React.CSSProperties}
              onFocus={() => setActiveCell(day.date)}
              onKeyDown={(event) => {
                const offset = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }[event.key];
                if (offset === undefined) return;
                event.preventDefault();
                const target = cells[index + offset];
                if (target) event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-day="${target.date}"]`)?.focus();
              }}
            >
              <span aria-hidden="true">{label}</span>
            </button>
          );
        })}
      </div>
      <p className="github-calendar__total text-mono-meta">
        {days.length ? "CONTRIBUTIONS" : "SAMPLE"} :: {total} / YR
      </p>
    </>
  );
}
