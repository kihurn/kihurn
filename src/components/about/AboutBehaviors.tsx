"use client";

import { useEffect } from "react";

/**
 * Client behaviour for /about: native <dialog> open/close for "About me",
 * "The record" and "On file", the local clock in the telemetry card and the
 * tape-over toggle. Live feeds (radio, online count, commits) are not wired:
 * the source reads them from its own backend.
 */
export function AboutBehaviors() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const on = (t: EventTarget, type: string, fn: (e: Event) => void) => {
      t.addEventListener(type, fn);
      cleanups.push(() => t.removeEventListener(type, fn));
    };

    on(document, "click", (e) => {
      const t = e.target as HTMLElement;
      const opener = t.closest<HTMLElement>("[data-dialog-open]");
      if (opener) {
        const d = document.querySelector<HTMLDialogElement>(`dialog[data-dialog="${opener.dataset.dialogOpen}"]`);
        if (d && !d.open) {
          d.showModal();
          opener.setAttribute("aria-expanded", "true");
        }
        return;
      }
      const closer = t.closest("[data-dialog-close]");
      const dlg = t.closest("dialog");
      if (closer && dlg) return (dlg as HTMLDialogElement).close();
      // click on the backdrop (the dialog element itself)
      if (t instanceof HTMLDialogElement && t.open) t.close();
    });
    document.querySelectorAll("dialog[data-dialog]").forEach((d) => {
      on(d, "close", () => {
        document
          .querySelectorAll<HTMLElement>(`[data-dialog-open="${(d as HTMLElement).dataset.dialog}"]`)
          .forEach((b) => b.setAttribute("aria-expanded", "false"));
      });
    });

    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kuala_Lumpur",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const tick = () => {
      document.querySelectorAll("[data-about-time]").forEach((n) => (n.textContent = fmt.format(new Date())));
    };
    tick();
    const clock = setInterval(tick, 1000);
    cleanups.push(() => clearInterval(clock));

    const state = document.querySelector<HTMLElement>("[data-about]");
    const label = document.querySelector<HTMLElement>("[data-about-state]");
    const live = setTimeout(() => {
      if (state) state.dataset.state = "live";
      if (label) label.textContent = "Live";
    }, 1200);
    cleanups.push(() => clearTimeout(live));

    const scope = document.querySelector<HTMLElement>("[data-about-scope]");
    if (scope) {
      on(scope, "click", () => {
        const next = scope.getAttribute("aria-pressed") !== "true";
        scope.setAttribute("aria-pressed", String(next));
        if (state) state.toggleAttribute("data-flipped", next);
      });
    }

    return () => cleanups.forEach((c) => c());
  }, []);

  return null;
}
