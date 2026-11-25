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

    const boardItems = [...document.querySelectorAll<HTMLElement>("[data-canvas-item]")];
    const scrim = document.querySelector<HTMLElement>("[data-canvas-scrim]");
    const exitWrap = document.querySelector<HTMLElement>("[data-canvas-exit]");
    const exitBtn = document.querySelector<HTMLElement>("[data-canvas-close]");
    const desktop = window.matchMedia("(min-width: 64rem)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let activeCard: HTMLElement | null = null;

    function deactivateCard(restoreFocus = false) {
      if (!activeCard) return;
      const previous = activeCard;
      previous.classList.remove("is-active");
      activeCard = null;
      boardItems.forEach((item) => { item.inert = false; });
      if (scrim) scrim.hidden = true;
      if (exitWrap) exitWrap.hidden = true;
      if (restoreFocus) previous.focus({ preventScroll: true });
    }

    function activateCard(item: HTMLElement) {
      if (!desktop.matches || item.classList.contains("ov3__hero")) return;
      if (activeCard === item) {
        deactivateCard(true);
        return;
      }
      activeCard = item;
      item.classList.add("is-active");
      boardItems.forEach((other) => { other.inert = other !== item; });
      if (scrim) scrim.hidden = false;
      if (exitWrap) exitWrap.hidden = false;
      item.focus({ preventScroll: true });
    }

    boardItems.forEach((item) => {
      const surface = item.matches("[data-depth-card]") ? item : item.querySelector<HTMLElement>("[data-depth-card]");
      if (!surface) return;
      const style = surface.style;
      style.setProperty("--rest-rotation", `${item.dataset.rot ?? "0"}deg`);
      let pointer: number | null = null;
      let offsetX = 0;
      let offsetY = 0;
      let pressX = 0;
      let pressY = 0;
      let startX = 0;
      let startY = 0;
      let wasDragged = false;
      let frame = 0;

      const settle = () => {
        cancelAnimationFrame(frame);
        frame = 0;
        delete surface.dataset.lifted;
        for (const property of ["--tilt-x", "--tilt-y", "--shine-x", "--shine-y", "--shadow-x"]) {
          style.removeProperty(property);
        }
      };

      on(surface, "pointermove", (ev) => {
        const event = ev as PointerEvent;
        if (pointer !== null) {
          if (pointer !== event.pointerId) return;
          const dx = event.clientX - pressX;
          const dy = event.clientY - pressY;
          wasDragged ||= Math.hypot(dx, dy) > 6;
          if (!wasDragged) return;
          offsetX = Math.max(-65, Math.min(65, startX + dx));
          offsetY = Math.max(-45, Math.min(45, startY + dy));
          style.setProperty("--drag-x", `${offsetX}px`);
          style.setProperty("--drag-y", `${offsetY}px`);
          return;
        }
        if (motion.matches || event.pointerType !== "mouse") return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          frame = 0;
          const rect = surface.getBoundingClientRect();
          const x = Math.max(-0.5, Math.min(0.5, (event.clientX - rect.left) / Math.max(1, rect.width) - 0.5));
          const y = Math.max(-0.5, Math.min(0.5, (event.clientY - rect.top) / Math.max(1, rect.height) - 0.5));
          style.setProperty("--tilt-x", `${-y * 17}deg`);
          style.setProperty("--tilt-y", `${x * 21}deg`);
          style.setProperty("--shine-x", `${(x + 0.5) * 100}%`);
          style.setProperty("--shine-y", `${(y + 0.5) * 100}%`);
          style.setProperty("--shadow-x", `${-x * 32}px`);
          surface.dataset.lifted = "";
        });
      });
      on(surface, "pointerleave", settle);
      on(motion, "change", settle);

      on(surface, "pointerdown", (ev) => {
        const event = ev as PointerEvent;
        const target = event.target as Element;
        if (target.closest("a,button,input,textarea,select") || !desktop.matches || pointer !== null || event.button !== 0 || event.pointerType !== "mouse") return;
        if (motion.matches) {
          activateCard(item);
          return;
        }
        pointer = event.pointerId;
        pressX = event.clientX;
        pressY = event.clientY;
        startX = offsetX;
        startY = offsetY;
        wasDragged = false;
        item.classList.add("is-held");
        surface.setPointerCapture(event.pointerId);
      });

      const endDrag = (ev: Event) => {
        const event = ev as PointerEvent;
        if (pointer !== event.pointerId) return;
        pointer = null;
        item.classList.remove("is-held");
        if (surface.hasPointerCapture(event.pointerId)) surface.releasePointerCapture(event.pointerId);
        if (event.type === "pointerup" && !wasDragged) activateCard(item);
        if (!item.matches(":hover")) settle();
      };

      on(surface, "pointerup", endDrag);
      on(surface, "pointercancel", endDrag);
      on(surface, "lostpointercapture", endDrag);
      on(item, "keydown", (ev) => {
        const event = ev as KeyboardEvent;
        if (event.target !== item || !desktop.matches || item.classList.contains("ov3__hero") || !["Enter", " "].includes(event.key)) return;
        event.preventDefault();
        activateCard(item);
      });
      on(desktop, "change", () => {
        offsetX = offsetY = 0;
        style.removeProperty("--drag-x");
        style.removeProperty("--drag-y");
        if (!desktop.matches) deactivateCard();
      });
      cleanups.push(settle);
    });

    if (scrim) on(scrim, "click", () => deactivateCard(true));
    if (exitBtn) on(exitBtn, "click", () => deactivateCard(true));
    on(window, "keydown", (ev) => {
      if ((ev as KeyboardEvent).key === "Escape") deactivateCard(true);
    });

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
