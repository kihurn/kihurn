"use client";

import { useEffect } from "react";

const TRACKS = [
  { title: "Nujabes — Feather", artist: "Modal Soul (2005)", bpm: "92" },
  { title: "Ryo Fukui — Scenery", artist: "Scenery (1976)", bpm: "116" },
  { title: "LAMP — Yume Utsutsu", artist: "For Lovers (2004)", bpm: "84" },
];

/**
 * Client behaviour for /about:
 * - Native <dialog> open/close + SVG signature stroke animation
 * - Magnetic row reader highlight inside "The record"
 * - 3D pointer tilt & specular shine on the postage stamp
 * - Draggable / focusable board cards with scrim & Escape exit
 * - Live KL clock, /api/chat/health sync, commit tape toggle & radio deck
 */
export function AboutBehaviors() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const on = (t: EventTarget, type: string, fn: (e: Event) => void, opts?: AddEventListenerOptions) => {
      t.addEventListener(type, fn, opts);
      cleanups.push(() => t.removeEventListener(type, fn, opts));
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- Native <dialog> + signature stroke animation ----
    function animateSignature(dlg: Element) {
      const path = dlg.querySelector<SVGPathElement>("[data-sig-path]");
      if (!path || reduced) return;
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
      path.getBoundingClientRect();
      path.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.22, 1, .36, 1) 0.15s";
      path.style.strokeDashoffset = "0";
    }

    on(document, "click", (e) => {
      const t = e.target as HTMLElement;
      const opener = t.closest<HTMLElement>("[data-dialog-open]");
      if (opener) {
        const d = document.querySelector<HTMLDialogElement>(`dialog[data-dialog="${opener.dataset.dialogOpen}"]`);
        if (d && !d.open) {
          d.showModal();
          opener.setAttribute("aria-expanded", "true");
          animateSignature(d);
        }
        return;
      }
      const closer = t.closest("[data-dialog-close]");
      const dlg = t.closest("dialog");
      if (closer && dlg) return (dlg as HTMLDialogElement).close();
      if (t instanceof HTMLDialogElement && t.open) t.close();
    });

    document.querySelectorAll("dialog[data-dialog]").forEach((d) => {
      on(d, "close", () => {
        document
          .querySelectorAll<HTMLElement>(`[data-dialog-open="${(d as HTMLElement).dataset.dialog}"]`)
          .forEach((b) => b.setAttribute("aria-expanded", "false"));
      });
    });

    // ---- Magnetic row reader inside "The record" ----
    const recBody = document.querySelector<HTMLElement>("[data-record-body]");
    const recReader = document.querySelector<HTMLElement>("[data-record-reader]");
    if (recBody && recReader) {
      recReader.style.opacity = "0";
      recReader.style.transition = "transform 0.25s cubic-bezier(.16, 1, .3, 1), opacity 0.2s ease";
      recBody.querySelectorAll<HTMLElement>(".rec__row").forEach((row) => {
        on(row, "mouseenter", () => {
          recReader.style.opacity = "1";
          recReader.style.transform = `translateY(${row.offsetTop}px)`;
        });
      });
      on(recBody, "mouseleave", () => {
        recReader.style.opacity = "0";
      });
    }

    // ---- 3D tilt & specular shine on the postage stamp & postcard ----
    const stamp = document.querySelector<HTMLElement>("[data-tilt]");
    const shine = document.querySelector<HTMLElement>("[data-tilt-shine]");
    const frankStage = document.querySelector<HTMLElement>("[data-frank-stage]");
    const frankCard = document.querySelector<HTMLElement>("[data-frank-card]");
    if (frankStage && frankCard && !reduced) {
      frankCard.style.transition = "transform 0.42s cubic-bezier(.16, 1, .3, 1)";
      on(frankStage, "pointermove", (ev) => {
        const e = ev as PointerEvent;
        const r = frankStage.getBoundingClientRect();
        const nx = (e.clientX - r.left) / Math.max(1, r.width) - 0.5;
        const ny = (e.clientY - r.top) / Math.max(1, r.height) - 0.5;
        frankCard.style.transform = `perspective(1100px) rotateX(${(-ny * 4.5).toFixed(2)}deg) rotateY(${(nx * 4.5).toFixed(2)}deg)`;
      });
      on(frankStage, "pointerleave", () => {
        frankCard.style.transform = "perspective(1100px) rotateX(0deg) rotateY(0deg)";
      });
    }
    if (stamp && !reduced) {
      stamp.style.transition = "transform 0.35s cubic-bezier(.16, 1, .3, 1)";
      on(stamp, "pointermove", (ev) => {
        const e = ev as PointerEvent;
        const r = stamp.getBoundingClientRect();
        const nx = (e.clientX - r.left) / Math.max(1, r.width) - 0.5;
        const ny = (e.clientY - r.top) / Math.max(1, r.height) - 0.5;
        stamp.style.transform = `perspective(700px) rotateX(${(-ny * 10).toFixed(2)}deg) rotateY(${(nx * 10).toFixed(2)}deg) scale(1.02)`;
        if (shine) {
          shine.style.opacity = "0.75";
          shine.style.setProperty("--shx", `${((nx + 0.5) * 100).toFixed(1)}%`);
          shine.style.setProperty("--shy", `${((ny + 0.5) * 100).toFixed(1)}%`);
        }
      });
      on(stamp, "pointerleave", () => {
        stamp.style.transform = "perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)";
        if (shine) shine.style.opacity = "0";
      });
    }

    // ---- Interactive draggable / focusable board cards (desktop) ----
    const boardItems = [...document.querySelectorAll<HTMLElement>("[data-canvas-item]")];
    const scrim = document.querySelector<HTMLElement>("[data-canvas-scrim]");
    const exitWrap = document.querySelector<HTMLElement>("[data-canvas-exit]");
    const exitBtn = document.querySelector<HTMLElement>("[data-canvas-close]");
    let zTop = 10;
    let activeCard: HTMLElement | null = null;

    function deactivateCard() {
      if (!activeCard) return;
      activeCard.classList.remove("is-active");
      activeCard.style.zIndex = String(++zTop);
      boardItems.forEach((it) => it.classList.remove("is-dimmed"));
      if (scrim) scrim.hidden = true;
      if (exitWrap) exitWrap.hidden = true;
      activeCard = null;
    }

    function activateCard(el: HTMLElement) {
      if (window.innerWidth < 1024) return;
      activeCard = el;
      el.style.zIndex = "60";
      el.classList.add("is-active");
      boardItems.forEach((it) => {
        if (it !== el) it.classList.add("is-dimmed");
      });
      if (scrim) scrim.hidden = false;
      if (exitWrap) exitWrap.hidden = false;
    }

    boardItems.forEach((item) => {
      const baseRot = Number(item.dataset.rot ?? "0");
      let dx = 0;
      let dy = 0;
      let dragging = false;
      let moved = 0;
      let startX = 0;
      let startY = 0;

      const applyTransform = (scale = 1, rot = baseRot) => {
        if (window.innerWidth < 1024) {
          item.style.transform = "";
          return;
        }
        item.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot}deg) scale(${scale})`;
      };
      applyTransform();

      on(item, "pointerdown", (ev) => {
        const e = ev as PointerEvent;
        if (window.innerWidth < 1024) return;
        const target = e.target as HTMLElement;
        if (target.closest("a, button, input")) return;
        dragging = true;
        moved = 0;
        startX = e.clientX - dx;
        startY = e.clientY - dy;
        item.style.zIndex = String(++zTop);
        item.classList.add("is-held");
        try {
          item.setPointerCapture(e.pointerId);
        } catch {}
      });

      on(item, "pointermove", (ev) => {
        if (!dragging) return;
        const e = ev as PointerEvent;
        const nx = e.clientX - startX;
        const ny = e.clientY - startY;
        moved += Math.abs(nx - dx) + Math.abs(ny - dy);
        dx = Math.max(-260, Math.min(260, nx));
        dy = Math.max(-180, Math.min(180, ny));
        applyTransform(1.01, baseRot);
      });

      const endDrag = (ev: Event) => {
        if (!dragging) return;
        dragging = false;
        item.classList.remove("is-held");
        const e = ev as PointerEvent;
        try {
          if (item.hasPointerCapture(e.pointerId)) item.releasePointerCapture(e.pointerId);
        } catch {}
        applyTransform(1, baseRot);
        if (moved < 6 && !item.classList.contains("ov3__hero")) {
          if (activeCard === item) deactivateCard();
          else activateCard(item);
        }
      };

      on(item, "pointerup", endDrag);
      on(item, "pointercancel", endDrag);
    });

    if (scrim) on(scrim, "click", deactivateCard);
    if (exitBtn) on(exitBtn, "click", deactivateCard);
    on(window, "keydown", (ev) => {
      if ((ev as KeyboardEvent).key === "Escape") deactivateCard();
    });

    // ---- Telemetry clock + /api/chat/health sync + tape flip ----
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kuala_Lumpur",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const tick = () => {
      document.querySelectorAll("[data-about-time]").forEach((n) => (n.textContent = `${fmt.format(new Date())} MYT`));
    };
    tick();
    const clock = window.setInterval(tick, 1000);
    cleanups.push(() => window.clearInterval(clock));

    const state = document.querySelector<HTMLElement>("[data-about]");
    const label = document.querySelector<HTMLElement>("[data-about-state]");
    const live = window.setTimeout(() => {
      if (state) state.dataset.state = "live";
      if (label) label.textContent = "Live";
    }, 900);
    cleanups.push(() => window.clearTimeout(live));

    let alive = true;
    fetch("/api/chat/health")
      .then((r) => r.json())
      .then((j: { online?: boolean }) => {
        if (!alive) return;
        document.querySelectorAll("[data-online]").forEach((el) => {
          el.textContent = j.online ? "C0RE::READY" : "STANDBY";
        });
      })
      .catch(() => {
        if (!alive) return;
        document.querySelectorAll("[data-online]").forEach((el) => {
          el.textContent = "STANDBY";
        });
      });
    cleanups.push(() => {
      alive = false;
    });

    const scope = document.querySelector<HTMLElement>("[data-about-scope]");
    if (scope) {
      on(scope, "click", () => {
        const next = scope.getAttribute("aria-pressed") !== "true";
        scope.setAttribute("aria-pressed", String(next));
        document.documentElement.toggleAttribute("data-tape", next);
        if (next) document.documentElement.setAttribute("data-tape", "green");
        else document.documentElement.removeAttribute("data-tape");
      });
    }

    // ---- Interactive Radio / Music Rotation Deck ----
    const deck = document.querySelector<HTMLElement>("[data-radio-deck]");
    const toggleBtn = document.querySelector<HTMLElement>("[data-radio-toggle]");
    const nextBtn = document.querySelector<HTMLElement>("[data-radio-next]");
    const statusEl = document.querySelector<HTMLElement>("[data-radio-status]");
    const titleEl = document.querySelector<HTMLElement>("[data-radio-title]");
    const artistEl = document.querySelector<HTMLElement>("[data-radio-artist]");
    const bpmEl = document.querySelector<HTMLElement>("[data-radio-bpm]");
    const barEl = document.querySelector<HTMLElement>("[data-radio-bar]");
    const elapsedEl = document.querySelector<HTMLElement>("[data-radio-elapsed]");

    let playing = true;
    let trackIdx = 0;
    let progress = 0.42;

    const paintTrack = () => {
      const tr = TRACKS[trackIdx];
      if (titleEl) titleEl.textContent = tr.title;
      if (artistEl) artistEl.textContent = tr.artist;
      if (bpmEl) bpmEl.textContent = tr.bpm;
    };

    if (toggleBtn && deck) {
      on(toggleBtn, "click", () => {
        playing = !playing;
        deck.dataset.on = String(playing);
        toggleBtn.setAttribute("aria-pressed", String(playing));
        toggleBtn.textContent = playing ? "PAUSE" : "PLAY";
        if (statusEl) statusEl.textContent = playing ? "SPIN" : "HOLD";
      });
    }
    if (nextBtn) {
      on(nextBtn, "click", () => {
        trackIdx = (trackIdx + 1) % TRACKS.length;
        progress = 0.08;
        paintTrack();
      });
    }

    const radioTimer = window.setInterval(() => {
      if (!playing) return;
      progress += 0.006;
      if (progress >= 1) {
        progress = 0;
        trackIdx = (trackIdx + 1) % TRACKS.length;
        paintTrack();
      }
      if (barEl) barEl.style.transform = `scaleX(${progress.toFixed(3)})`;
      if (elapsedEl) {
        const secs = Math.floor(progress * 240);
        const mm = String(Math.floor(secs / 60)).padStart(2, "0");
        const ss = String(secs % 60).padStart(2, "0");
        elapsedEl.textContent = `${mm}:${ss}`;
      }
    }, 1000);
    cleanups.push(() => window.clearInterval(radioTimer));

    return () => cleanups.forEach((c) => c());
  }, []);

  return null;
}
