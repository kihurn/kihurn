"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

type Theme = "light" | "dark" | "system";
type VTDocument = Document & { startViewTransition?: (cb: () => Promise<void> | void) => unknown };

function resolveTheme(t: Theme): "light" | "dark" {
  if (t === "system") return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  return t;
}

function applyTheme(t: Theme) {
  const resolved = resolveTheme(t);
  document.documentElement.dataset.theme = resolved;
  try {
    localStorage.setItem("theme", t);
  } catch {}
  const fav = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (fav) fav.href = `/favicon-${resolved}.svg`;
  document.querySelectorAll<HTMLElement>("[data-theme-set]").forEach((b) => {
    const pressed = b.dataset.themeSet === resolved;
    b.setAttribute("aria-pressed", String(pressed));
    const bg = document.querySelector<HTMLElement>("[data-theme-bg]");
    if (pressed && bg && bg.parentElement !== b) b.prepend(bg);
  });
}

function splitRoll(el: HTMLElement) {
  if (el.dataset.rolled) return;
  const text = el.textContent ?? "";
  el.dataset.rolled = "1";
  el.textContent = "";
  [...text].forEach((ch, i) => {
    const s = document.createElement("span");
    s.style.setProperty("--index", String(i));
    s.textContent = ch;
    el.appendChild(s);
  });
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ChromeBehaviors() {
  const router = useRouter();
  const pathname = usePathname();
  const settle = useRef<(() => void) | null>(null);

  // route change finished: release the view transition / fade
  useEffect(() => {
    settle.current?.();
    settle.current = null;
    document.documentElement.classList.remove("is-routing");
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel);
    const $$ = <T extends HTMLElement>(sel: string) => [...document.querySelectorAll<T>(sel)];
    const cleanups: Array<() => void> = [];
    root.dataset.hydrated = "true"; // lets tests (and anything else) know client code is live
    const on = (
      t: Document | HTMLElement | Window,
      type: string,
      fn: (e: Event) => void,
      opts?: AddEventListenerOptions,
    ) => {
      t.addEventListener(type, fn, opts);
      cleanups.push(() => t.removeEventListener(type, fn, opts));
    };

    // ---- navigation with View Transitions (fade fallback, none when reduced) ----
    function go(path: string) {
      if (reducedMotion()) return router.push(path);
      const doc = document as VTDocument;
      if (doc.startViewTransition) {
        doc.startViewTransition(
          () =>
            new Promise<void>((res) => {
              settle.current = res;
              setTimeout(res, 1000);
              router.push(path);
            }),
        );
      } else {
        root.classList.add("is-routing");
        setTimeout(() => router.push(path), 200);
      }
    }

    // ---- theme ----
    let stored: Theme = "dark";
    try {
      const s = localStorage.getItem("theme");
      if (s === "light" || s === "dark" || s === "system") stored = s;
    } catch {}
    applyTheme(stored);

    $$("[data-roll]").forEach(splitRoll);

    // ---- overlays: palette / notifications / drawer ----
    const cmd = $("[data-cmd]")!;
    const notif = $("[data-notif]")!;
    const drawer = $("[data-drawer]")!;
    const input = $<HTMLInputElement>("[data-cmd-input]")!;

    function closeAll() {
      [cmd, notif, drawer].forEach((p) => {
        p.classList.remove("is-open");
        p.setAttribute("aria-hidden", "true");
      });
      $$("[data-notif-open]").forEach((b) => b.setAttribute("aria-expanded", "false"));
      $$("[data-drawer-open]").forEach((b) => b.setAttribute("aria-expanded", "false"));
      root.classList.remove("is-overlay");
    }
    function open(panel: HTMLElement) {
      closeAll();
      panel.classList.add("is-open");
      panel.setAttribute("aria-hidden", "false");
      root.classList.add("is-overlay");
    }
    const isOpen = (p: HTMLElement) => p.classList.contains("is-open");

    const items = () => $$("[data-cmd-item]");
    const visibleItems = () => items().filter((i) => !i.hidden);
    let sel = 0;
    function select(i: number, scroll = true) {
      const v = visibleItems();
      if (!v.length) return;
      sel = (i + v.length) % v.length;
      items().forEach((n) => n.removeAttribute("data-selected"));
      const it = v[sel];
      it.setAttribute("data-selected", "true");
      const hl = $("[data-cmd-hl]");
      if (hl) {
        hl.hidden = false;
        hl.style.transform = `translateY(${it.offsetTop}px)`;
        hl.style.height = `${it.offsetHeight}px`;
      }
      if (scroll) it.scrollIntoView({ block: "nearest" });
    }
    function filter() {
      const terms = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      items().forEach((it) => {
        const val = (it.dataset.value ?? it.textContent ?? "").toLowerCase();
        it.hidden = !terms.every((t) => val.includes(t));
      });
      $$("[data-cmd-group]").forEach((g) => {
        g.hidden = !g.querySelector("[data-cmd-item]:not([hidden])");
      });
      const empty = $("[data-cmd-empty]");
      if (empty) empty.hidden = visibleItems().length > 0;
      select(0, false);
    }
    function openCmd() {
      open(cmd);
      input.value = "";
      filter();
      setTimeout(() => input.focus(), 30);
    }
    function run(it: HTMLElement) {
      const action = it.dataset.action;
      const href = it.dataset.href;
      closeAll();
      if (action === "theme:toggle") applyTheme(root.dataset.theme === "light" ? "dark" : "light");
      else if (href) {
        if (href.startsWith("mailto:")) window.location.href = href;
        else if (href.startsWith("http")) window.open(href, "_blank", "noopener,noreferrer");
        else go(href);
      }
    }

    on(input, "input", filter);
    on(document, "click", (e) => {
      const t = e.target as HTMLElement;
      const themeBtn = t.closest<HTMLElement>("[data-theme-set]");
      if (themeBtn) return applyTheme(themeBtn.dataset.themeSet as Theme);
      const item = t.closest<HTMLElement>("[data-cmd-item]");
      if (item) return run(item);
      if (t.closest("[data-cmd-open]")) return isOpen(cmd) ? closeAll() : openCmd();
      if (t.closest("[data-notif-open]")) {
        if (isOpen(notif)) return closeAll();
        open(notif);
        $$("[data-notif-open]").forEach((b) => b.setAttribute("aria-expanded", "true"));
        return;
      }
      if (t.closest("[data-drawer-open]")) {
        if (isOpen(drawer)) return closeAll();
        open(drawer);
        $$("[data-drawer-open]").forEach((b) => b.setAttribute("aria-expanded", "true"));
        return;
      }
      if (t.closest("[data-overlay]") || t === cmd || t === notif || t === drawer) closeAll();
    });

    // local links go through the view transition
    on(
      document,
      "click",
      (e) => {
        const me = e as MouseEvent;
        const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href^='/']");
        if (!a || a.target === "_blank" || me.metaKey || me.ctrlKey || me.shiftKey || me.button !== 0) return;
        const href = a.getAttribute("href")!;
        const path = href.split(/[?#]/)[0];
        if (href.includes("#") && path === window.location.pathname) return;
        e.preventDefault();
        e.stopPropagation();
        closeAll();
        go(href);
      },
      { capture: true },
    );

    on(
      cmd,
      "mousemove",
      (e) => {
        const it = (e.target as HTMLElement).closest<HTMLElement>("[data-cmd-item]");
        if (!it) return;
        const idx = visibleItems().indexOf(it);
        if (idx >= 0 && idx !== sel) select(idx, false);
      },
      { passive: true },
    );

    on(document, "keydown", (e) => {
      const k = e as KeyboardEvent;
      if ((k.metaKey || k.ctrlKey) && k.key.toLowerCase() === "k") {
        k.preventDefault();
        return isOpen(cmd) ? closeAll() : openCmd();
      }
      if (k.key === "Escape") return closeAll();
      if (isOpen(cmd)) {
        if (k.key === "ArrowDown") {
          k.preventDefault();
          select(sel + 1);
        } else if (k.key === "ArrowUp") {
          k.preventDefault();
          select(sel - 1);
        } else if (k.key === "Enter") {
          const it = visibleItems()[sel];
          if (it) {
            k.preventDefault();
            run(it);
          }
        }
      }
    });

    // ---- "What's new": unread state kept in localStorage ----
    const SEEN = "notif-seen";
    let seen = 0;
    try {
      seen = Number(localStorage.getItem(SEEN) ?? 0);
    } catch {}
    const nItems = $$("[data-notif-list] .notif__item");
    const paintUnread = () => {
      let unread = 0;
      nItems.forEach((n) => {
        const isUnread = Date.parse(n.dataset.date ?? "") > seen;
        if (isUnread) unread++;
        n.toggleAttribute("data-unread", isUnread);
      });
      const dot = $("[data-notif-dot]");
      if (dot) dot.hidden = unread === 0;
      const count = $("[data-notif-count]");
      if (count) {
        count.hidden = unread === 0;
        count.textContent = String(unread);
      }
      const clear = $("[data-notif-clear]");
      if (clear) clear.hidden = unread === 0;
    };
    paintUnread();
    on(document, "click", (e) => {
      if ((e.target as HTMLElement).closest("[data-notif-clear]")) {
        seen = Date.now();
        try {
          localStorage.setItem(SEEN, String(seen));
        } catch {}
        paintUnread();
      }
    });

    return () => cleanups.forEach((c) => c());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // nav pill follows the current route and hover
  useEffect(() => {
    const links = [...document.querySelectorAll<HTMLAnchorElement>(".navpill__link")];
    const pill = document.querySelector<HTMLElement>("[data-nav-pill]");
    const list = document.querySelector<HTMLElement>(".navpill__list");
    if (!pill || !list) return;
    const place = (a: HTMLAnchorElement | null) => {
      if (!a) {
        pill.style.opacity = "0";
        return;
      }
      // the pill is positioned inside its offsetParent (the padded nav), so measure against that
      const host = (pill.offsetParent as HTMLElement | null) ?? list;
      const hr = host.getBoundingClientRect();
      const r = a.getBoundingClientRect();
      pill.style.width = `${r.width}px`;
      pill.style.height = `${r.height}px`;
      pill.style.transform = `translate(${r.left - hr.left - host.clientLeft}px, ${r.top - hr.top - host.clientTop}px)`;
      pill.style.opacity = "1";
    };
    const current = links.find((a) => a.getAttribute("href") === pathname) ?? null;
    links.forEach((a) => a.toggleAttribute("aria-current", a === current));
    place(current);
    document.fonts?.ready.then(() => place(current));
    const leave = () => place(current);
    const hs = links.map((a) => [a, () => place(a)] as const);
    hs.forEach(([a, h]) => a.addEventListener("mouseenter", h));
    list.addEventListener("mouseleave", leave);
    window.addEventListener("resize", leave);
    return () => {
      hs.forEach(([a, h]) => a.removeEventListener("mouseenter", h));
      list.removeEventListener("mouseleave", leave);
      window.removeEventListener("resize", leave);
    };
  }, [pathname]);

  return null;
}
