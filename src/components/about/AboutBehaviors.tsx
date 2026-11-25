"use client";

import { useEffect } from "react";

export function AboutBehaviors() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const on = (t: EventTarget, type: string, fn: (e: Event) => void, opts?: AddEventListenerOptions) => {
      t.addEventListener(type, fn, opts);
      cleanups.push(() => t.removeEventListener(type, fn, opts));
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    const board = document.querySelector<HTMLElement>("[data-canvas]");
    const boardItems = [...document.querySelectorAll<HTMLElement>("[data-canvas-item]")];
    const scrim = document.querySelector<HTMLElement>("[data-canvas-scrim]");
    const exitWrap = document.querySelector<HTMLElement>("[data-canvas-exit]");
    const exitBtn = document.querySelector<HTMLElement>("[data-canvas-close]");
    let activeCard: HTMLElement | null = null;

    function positionInspection() {
      const slot = activeCard?.parentElement?.getBoundingClientRect();
      if (!activeCard || !slot) return;
      const width = document.documentElement.clientWidth;
      const height = window.innerHeight;
      const scale = Math.min(1.55, (width - 28) / slot.width, (height - 104) / slot.height);
      activeCard.style.setProperty("--inspect-x", `${(width - slot.width) / 2 - slot.left}px`);
      activeCard.style.setProperty("--inspect-y", `${(height - slot.height) / 2 - slot.top - 12}px`);
      activeCard.style.setProperty("--inspect-scale", String(scale));
    }

    function deactivateCard(restoreFocus = false) {
      if (!activeCard) return;
      const previous = activeCard;
      activeCard = null;
      previous.classList.remove("is-active");
      if (board) delete board.dataset.inspecting;
      boardItems.forEach((item) => { item.inert = false; });
      if (scrim) scrim.hidden = true;
      if (exitWrap) exitWrap.hidden = true;
      if (restoreFocus) previous.focus({ preventScroll: true });
    }

    function activateCard(item: HTMLElement) {
      if (activeCard) return;
      activeCard = item;
      if (board) board.dataset.inspecting = "";
      positionInspection();
      item.classList.add("is-active");
      boardItems.forEach((other) => { other.inert = other !== item; });
      if (scrim) scrim.hidden = false;
      if (exitWrap) exitWrap.hidden = false;
      exitBtn?.focus({ preventScroll: true });
    }

    for (const item of boardItems) {
      let press: { x: number; y: number } | undefined;
      on(item, "pointerdown", (event) => {
        const pointer = event as PointerEvent;
        press = { x: pointer.clientX, y: pointer.clientY };
      });
      on(item, "click", (event) => {
        const click = event as MouseEvent;
        const target = click.target;
        const moved = press && Math.hypot(click.clientX - press.x, click.clientY - press.y) > 8;
        press = undefined;
        if (!moved && target instanceof Element && !target.closest("a,button,input,textarea,select")) activateCard(item);
      });
      on(item, "keydown", (event) => {
        const key = event as KeyboardEvent;
        if (key.target === item && ["Enter", " "].includes(key.key)) {
          key.preventDefault();
          activateCard(item);
        }
      });
    }

    if (scrim) on(scrim, "click", () => deactivateCard(true));
    if (exitBtn) on(exitBtn, "click", () => deactivateCard(true));
    on(window, "resize", positionInspection);
    on(window, "keydown", (event) => {
      if (!activeCard || document.querySelector("dialog[open]")) return;
      const key = event as KeyboardEvent;
      if (key.key === "Escape") deactivateCard(true);
      if (key.key !== "Tab") return;
      const stops = [activeCard, ...activeCard.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),[tabindex='0']")];
      if (exitBtn) stops.push(exitBtn);
      const visibleStops = stops.filter((element) => element.tabIndex >= 0 && element.getClientRects().length);
      const index = visibleStops.indexOf(document.activeElement as HTMLElement);
      const next = key.shiftKey ? (index <= 0 ? visibleStops.length - 1 : index - 1) : (index + 1) % visibleStops.length;
      key.preventDefault();
      visibleStops[next]?.focus({ preventScroll: true });
    });
    cleanups.push(() => deactivateCard());

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

    return () => cleanups.forEach((c) => c());
  }, []);

  return null;
}
