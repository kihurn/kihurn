"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, AudioLines, ChevronLeft, ChevronRight, CircuitBoard, Disc, Grid2X2, Layers, Network, Shield, Terminal, X } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CaseStudy } from "@/content/caseStudies";
import type { Lens } from "@/content/types";
import { normalizeLabMode, type LabViewMode } from "@/lib/labSchematics";
import { projectEmblems } from "@/lib/projectEmblems";
import { LabMiniStage } from "./LabMiniStage";
import { bindLabWheel } from "./LabWheelMotion";
import { ShotSlot } from "./Parts";

type Category = Lens | "motion";
type Filter = Category | "all";

export interface ShelfBook {
  slug: string;
  title: string;
  categories: Category[];
  category: string;
  status: string;
  year?: string;
  summary: string;
  description?: string;
  stack: string[];
  photo?: string;
  repo?: string;
  live?: string;
  role?: string;
  team?: string;
  tags?: string[];
  dependencies?: string[];
  internal?: boolean;
  study?: CaseStudy;
  stage?: string;
}

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" }, { id: "fullstack", label: "Full stack" }, { id: "ai", label: "AI" },
  { id: "networking", label: "Networking" }, { id: "security", label: "Security" }, { id: "motion", label: "Motion" },
];
const modes: LabViewMode[] = ["list", "wheel", "grid"];
const emblems = { fullstack: Terminal, ai: CircuitBoard, networking: Network, security: Shield, motion: AudioLines };
const experimentEmblems = { "vocal-orb": AudioLines, "polka-field": Grid2X2, "rotary-detent": Disc, "paper-poster": Layers } as const;
const number = (n: number) => String(n).padStart(2, "0");
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const departDuration = 380;
const closeDuration = 300;

function Cover({ book, index, onOpen, compact = false, livePreview = false }: {
  book: ShelfBook; index: number; onOpen?: () => void; compact?: boolean; livePreview?: boolean;
}) {
  const Face = onOpen ? "button" : "span";
  const Emblem = experimentEmblems[book.slug as keyof typeof experimentEmblems] ?? emblems[book.categories[0]] ?? Terminal;
  const artwork = projectEmblems[book.slug];
  return (
    <Face type={onOpen ? "button" : undefined} className="shelf-cover" data-compact={compact || undefined} onClick={onOpen}
      aria-label={onOpen ? `Open book: ${book.title}` : undefined}>
      <span className="shelf-cover__binding text-mono-meta"><span>N°{number(index)}</span><span>{book.year}</span></span>
      <span className="shelf-cover__body">
        <span className="shelf-cover__imprint text-mono-meta"><span>{book.category}</span><span>{book.status}</span></span>
        <span className="shelf-cover__art" aria-hidden="true">
          {book.photo ? <Image src={book.photo} alt="" fill sizes="330px" /> : livePreview ? (
            <LabMiniStage slug={book.slug} cover />
          ) : artwork ? (
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
              <path d={artwork} />
            </svg>
          ) : <Emblem strokeWidth={1} />}
        </span>
        <span className="shelf-cover__title">{compact && book.slug === "ibuniaga" ? "IbuNiaga Portal" : book.title}</span>
        {!compact && <span className="shelf-cover__summary">{book.summary}</span>}
        <span className="shelf-cover__foot">
          {!compact && <span className="shelf-cover__stack">{book.stack.slice(0, 2).map((tech) => <span key={tech}>{tech}</span>)}</span>}
          <span className="shelf-cover__cue text-mono-meta">Open book <ArrowRight size={15} /></span>
        </span>
      </span>
    </Face>
  );
}

function Spread({ book, index, total, direction, closing, onClose, onTurn, canTurn }: {
  book: ShelfBook; index: number; total: number; direction: number; onClose: () => void;
  onTurn: (step: number) => void; canTurn: boolean; closing: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (!node.open) node.showModal();
    let paint = 0;
    const frame = requestAnimationFrame(() => {
      paint = requestAnimationFrame(() => { node.dataset.unfolded = "true"; });
    });
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(paint); };
  }, []);

  return (
    <dialog ref={dialog} className="shelf-spread" aria-labelledby="shelf-open-title" data-closing={closing || undefined} data-lenis-prevent
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="shelf-spread__bound">
        <div className="shelf-spread__tools">
          <button type="button" className="shelf-action shelf-spread__close" onClick={onClose} autoFocus>
            <X size={16} /><span>Close book</span><span>Back to shelf</span>
          </button>
          <div className="shelf-spread__steps" aria-label="Browse open books">
            <button type="button" className="shelf-action" disabled={!canTurn || closing} onClick={() => onTurn(-1)}><ArrowLeft size={15} /> Prev</button>
            <button type="button" className="shelf-action" disabled={!canTurn || closing} onClick={() => onTurn(1)}>Next <ArrowRight size={15} /></button>
          </div>
        </div>
        <div key={book.slug} className="shelf-spread__pages" data-direction={direction}>
          <div className="shelf-spread__hinge">
          <section className="shelf-spread__page shelf-spread__visuals" aria-label="Visuals and links">
            {book.stage ? (
              <div className="shelf-spread__stage"><LabMiniStage slug={book.slug} /></div>
            ) : (
              <ShotSlot internal={Boolean(book.internal)} slug={book.slug} name={book.title} photo={book.photo} />
            )}
            {book.stack.length > 0 && <ul className="pentry__stack" aria-label="Technology stack">
              {book.stack.map((tech) => <li className="chip text-meta" key={tech}>{tech}</li>)}
            </ul>}
            <div className="shelf-spread__links">
              {book.repo && <a href={`https://github.com/${book.repo}`} target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={16} /></a>}
              {book.live && <a href={book.live} target="_blank" rel="noopener noreferrer">Live Service <ArrowUpRight size={16} /></a>}
              {book.stage && <Link href={book.stage}>Open Live Stage <ArrowUpRight size={16} /></Link>}
              {book.study && <Link href={`/lab/${book.slug}`}>Read case study <ArrowRight size={16} /></Link>}
              {book.internal && <span>Walkthrough on request.</span>}
            </div>
          </section>
            <div className="shelf-spread__jacket" aria-hidden="true"><Cover book={book} index={index} /></div>
          </div>
          <section className="shelf-spread__page shelf-spread__details">
            <div className="shelf-spread__folio text-mono-meta">
              <span>N°{number(index)} / {number(total)}</span>
              {book.year && <span>{book.year}</span>}
              <span className="chip text-meta">{book.status}</span>
              {book.tags?.slice(1).map((tag) => <span className="chip text-meta" key={tag}>{tag}</span>)}
            </div>
            <h2 id="shelf-open-title">{book.title}</h2>
            <p>{book.summary}</p>
            {book.description && <p>{book.description}</p>}
            {book.role && <section><h3>My role</h3><p>{book.role}</p></section>}
            {book.team && <section><h3>The team</h3><p>{book.team}</p></section>}
            {(book.study || Boolean(book.dependencies?.length)) && <section>
              <h3>Architecture</h3>
              {book.study && <>
                <p>{book.study.problem}</p>
                {book.study.how.map((note) => <p key={note}>{note}</p>)}
                <p>{book.study.result}</p>
              </>}
              {Boolean(book.dependencies?.length) && <p>Uses {book.dependencies?.join(", ")}.</p>}
            </section>}
          </section>
        </div>
      </div>
    </dialog>
  );
}

export function LabShelf({ books }: { books: ShelfBook[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [mode, setMode] = useState<LabViewMode>("wheel");
  const [selected, setSelected] = useState(books[0].slug);
  const [open, setOpen] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [direction, setDirection] = useState(0);
  const shelf = useRef<HTMLDivElement>(null);
  const wheel = useRef<HTMLDivElement>(null);
  const motion = useRef<ReturnType<typeof bindLabWheel> | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const modesRef = useRef<HTMLDivElement>(null);
  const dockRects = useRef<DOMRect[] | null>(null);
  const dockMotion = useRef<Animation[]>([]);
  const timer = useRef(0);
  const opener = useRef<HTMLElement | null>(null);
  const visible = useMemo(() => filter === "all" ? books : books.filter((book) => book.categories.includes(filter)), [books, filter]);
  const active = visible.find((book) => book.slug === selected) ?? visible[0];
  const opened = books.find((book) => book.slug === open);
  const busy = Boolean(open || pending);
  const activeIndex = visible.indexOf(active);

  useEffect(() => {
    const syncSlug = (slug: string) => {
      window.clearTimeout(timer.current);
      setPending(null);
      setClosing(false);
      if (books.some((book) => book.slug === slug)) {
        setFilter("all");
        setSelected(slug);
        setDirection(0);
        setOpen(slug);
      } else setOpen(null);
    };
    const sync = () => syncSlug(window.location.hash.slice(1));
    const navigate = (event: Event) => {
      const location = new URL((event as CustomEvent<{ href: string }>).detail.href, window.location.href);
      if (location.pathname === "/lab" && location.hash) syncSlug(location.hash.slice(1));
    };
    const frame = requestAnimationFrame(() => {
      try { setMode(normalizeLabMode(localStorage.getItem("lab-mode"))); } catch {}
      sync();
    });
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    window.addEventListener("kh:navigate", navigate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
      window.removeEventListener("kh:navigate", navigate);
      window.clearTimeout(timer.current);
    };
  }, [books]);

  useLayoutEffect(() => {
    const track = wheel.current;
    const root = shelf.current;
    if (!track || !root) return;
    const rows = Array.from(track.querySelectorAll("[data-spine]"));
    const initial = Math.max(0, rows.findIndex((row) => row.getAttribute("aria-current") === "true"));
    const controller = bindLabWheel(root, track, initial, setSelected);
    motion.current = controller;
    if (busy) controller.freeze();
    return () => { controller.dispose(); motion.current = null; };
  }, [visible, mode, busy]);

  useLayoutEffect(() => {
    const before = dockRects.current;
    dockRects.current = null;
    if (!before || reducedMotion()) return;
    dockMotion.current.forEach((animation) => animation.cancel());
    dockMotion.current = [filtersRef.current, modesRef.current].flatMap((el, index) => {
      if (!el) return [];
      const after = el.getBoundingClientRect();
      const dx = before[index].left + (before[index].width - after.width) / 2 - after.left;
      const dy = before[index].top - after.top;
      return [el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
        duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      })];
    });
  }, [mode]);

  useEffect(() => {
    if (!pending) return;
    const cancel = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      window.clearTimeout(timer.current);
      setPending(null);
    };
    window.addEventListener("keydown", cancel);
    return () => window.removeEventListener("keydown", cancel);
  }, [pending]);

  function switchMode(view: LabViewMode) {
    if (view === mode || busy) return;
    const docks = [filtersRef.current, modesRef.current];
    dockRects.current = docks[0] && docks[1] ? docks.map((el) => el!.getBoundingClientRect()) : null;
    shelf.current?.setAttribute("data-morph", "true");
    window.scrollTo({ top: 0, behavior: "instant" });
    setMode(view);
    try { localStorage.setItem("lab-mode", view); } catch {}
  }

  function showBook(book: ShelfBook, step = 0) {
    setSelected(book.slug);
    setDirection(step);
    setOpen(book.slug);
    setPending(null);
    window.history[open ? "replaceState" : "pushState"](null, "", `#${book.slug}`);
  }

  function openBook(book: ShelfBook) {
    if (busy) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (mode !== "wheel" || reducedMotion()) {
      showBook(book);
      return;
    }
    setPending(book.slug);
    timer.current = window.setTimeout(() => showBook(book), departDuration);
  }

  function finishClose() {
    setClosing(false);
    setOpen(null);
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    requestAnimationFrame(() => {
      if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });
    });
  }

  function closeBook() {
    if (closing) return;
    if (reducedMotion()) {
      finishClose();
      return;
    }
    setClosing(true);
    timer.current = window.setTimeout(finishClose, closeDuration);
  }

  function turnBook(step: number) {
    const index = visible.findIndex((book) => book.slug === open);
    const next = visible[(index + step + visible.length) % visible.length];
    if (next && !closing) showBook(next, step);
  }

  return (
    <div ref={shelf} className="shelf" data-mode={mode} data-book-phase={pending ? "departing" : open ? "open" : undefined}>
      <header className="shelf__header">
        <h1 className="text-display">Lab</h1>
        <div ref={filtersRef} className="shelf__filters" aria-label="Filter books" role="group" inert={busy}>
          {filters.map(({ id, label }) => <button key={id} type="button" className="shelf-action" aria-pressed={filter === id}
            onClick={() => setFilter(id)}>{label}</button>)}
        </div>
        <div ref={modesRef} className="shelf__modes" aria-label="Shelf view" role="group" inert={busy}>
          {mode === "wheel" && <button type="button" className="shelf-action shelf__arrow" aria-label="Previous spine"
            disabled={visible.length < 5 && activeIndex === 0} onClick={() => motion.current?.step(-1)}><ChevronLeft size={16} /></button>}
          {modes.map((view) => <button key={view} type="button" className="shelf-action" aria-pressed={mode === view}
            onClick={() => switchMode(view)}>{view}</button>)}
          {mode === "wheel" && <button type="button" className="shelf-action shelf__arrow" aria-label="Next spine"
            disabled={visible.length < 5 && activeIndex === visible.length - 1} onClick={() => motion.current?.step(1)}><ChevronRight size={16} /></button>}
        </div>
      </header>
      {mode === "wheel" && active && (
        <div className="shelf__wheel" inert={busy}>
          <div className="shelf__column">
            <div className="shelf__wheel-window" data-lenis-prevent>
              <div ref={wheel} className="shelf__track" tabIndex={0} role="region" aria-label="Book spine wheel"
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    motion.current?.step(event.key === "ArrowDown" ? 1 : -1);
                  } else if (event.key === "Enter" && event.target === event.currentTarget) {
                    event.preventDefault();
                    openBook(active);
                  }
                }}>
                {visible.map((book, index) => (
                  <div key={book.slug} className="shelf__detent" data-spine={book.slug} aria-current={active === book ? true : undefined}>
                    <button type="button" className="shelf__arc-title" tabIndex={-1} aria-hidden={active === book || undefined} onClick={() => motion.current?.goTo(index)}>
                      <span className="shelf-spine__index text-mono-meta">{number(books.indexOf(book) + 1)}</span>
                      <span className="shelf-spine__title">{book.title}</span>
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="shelf-spine" aria-label={`Open spine: ${active.title}`} onClick={() => openBook(active)}>
                <span className="shelf-spine__category text-mono-meta">{active.category}</span>
                <span className="shelf-spine__view text-mono-meta">View <ArrowRight size={15} /></span>
              </button>
            </div>
            <p className="shelf__touch-hint text-mono-meta">Swipe to browse projects</p>
          </div>
          <div className="shelf__preview"><Cover book={active} index={books.indexOf(active) + 1} livePreview={!open} onOpen={() => openBook(active)} /></div>
        </div>
      )}
      {mode === "grid" && <div className="shelf__grid">
        {visible.map((book) => <Cover key={book.slug} book={book} index={books.indexOf(book) + 1} compact onOpen={() => openBook(book)} />)}
      </div>}
      {mode === "list" && (
        <ol className="shelf__list">
          {visible.map((book) => <li key={book.slug}>
            <button type="button" className="shelf-row" onClick={() => openBook(book)}>
              <span className="text-mono-meta">{number(books.indexOf(book) + 1)}</span><strong>{book.title}</strong>
              <span className="shelf-row__category text-mono-meta">{book.category}</span>
              <span className="text-mono-meta">{book.status}</span><ArrowRight size={17} aria-hidden="true" />
            </button>
          </li>)}
        </ol>
      )}
      {opened && <Spread book={opened} index={books.indexOf(opened) + 1} total={books.length}
        direction={direction} closing={closing} onClose={closeBook} onTurn={turnBook} canTurn={visible.length > 1} />}
    </div>
  );
}
