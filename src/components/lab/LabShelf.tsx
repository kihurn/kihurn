"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, AudioLines, CircuitBoard, Disc, Grid2X2, Layers, Network, Shield, Terminal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CaseStudy } from "@/content/caseStudies";
import type { Lens } from "@/content/types";
import { normalizeLabMode, type LabViewMode } from "@/lib/labSchematics";
import { projectEmblems } from "@/lib/projectEmblems";
import { LabMiniStage } from "./LabMiniStage";
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
const modes: LabViewMode[] = ["wheel", "grid", "list"];
const emblems = { fullstack: Terminal, ai: CircuitBoard, networking: Network, security: Shield, motion: AudioLines };
const experimentEmblems = { "vocal-orb": AudioLines, "polka-field": Grid2X2, "rotary-detent": Disc, "paper-poster": Layers } as const;
const number = (n: number) => String(n).padStart(2, "0");
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Cover({ book, index, onOpen, compact = false }: {
  book: ShelfBook; index: number; onOpen: () => void; compact?: boolean;
}) {
  const Emblem = experimentEmblems[book.slug as keyof typeof experimentEmblems] ?? emblems[book.categories[0]] ?? Terminal;
  const artwork = projectEmblems[book.slug];
  return (
    <button type="button" className="shelf-cover" data-compact={compact || undefined} onClick={onOpen}
      aria-label={`Open book: ${book.title}`}>
      <span className="shelf-cover__binding text-mono-meta"><span>N°{number(index)}</span><span>{book.year}</span></span>
      <span className="shelf-cover__body">
        <span className="shelf-cover__imprint text-mono-meta"><span>{book.category}</span><span>{book.status}</span></span>
        <span className="shelf-cover__art" aria-hidden="true">
          {book.photo ? <Image src={book.photo} alt="" fill sizes="330px" /> : artwork ? (
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
              <path d={artwork} />
            </svg>
          ) : <Emblem strokeWidth={1} />}
        </span>
        <span className="shelf-cover__title">{book.title}</span>
        {!compact && <span className="shelf-cover__summary">{book.summary}</span>}
        <span className="shelf-cover__foot">
          {!compact && <span className="shelf-cover__stack">{book.stack.slice(0, 2).map((tech) => <span key={tech}>{tech}</span>)}</span>}
          <span className="shelf-cover__cue text-mono-meta">Open book <ArrowRight size={15} /></span>
        </span>
      </span>
    </button>
  );
}

function Spread({ book, index, total, direction, onClose, onTurn, canTurn }: {
  book: ShelfBook; index: number; total: number; direction: number; onClose: () => void;
  onTurn: (step: number) => void; canTurn: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (node && !node.open) node.showModal();
  }, []);

  return (
    <dialog ref={dialog} className="shelf-spread" aria-labelledby="shelf-open-title" data-lenis-prevent
      onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="shelf-spread__bound">
        <div className="shelf-spread__tools">
          <button type="button" className="shelf-action shelf-spread__close" onClick={onClose} autoFocus>
            <X size={16} /><span>Close book</span><span>Back to shelf</span>
          </button>
          <div className="shelf-spread__steps" aria-label="Browse open books">
            <button type="button" className="shelf-action" disabled={!canTurn} onClick={() => onTurn(-1)}><ArrowLeft size={15} /> Prev</button>
            <button type="button" className="shelf-action" disabled={!canTurn} onClick={() => onTurn(1)}>Next <ArrowRight size={15} /></button>
          </div>
        </div>
        <div key={book.slug} className="shelf-spread__pages" data-direction={direction}>
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
        <div className="shelf-spread__leaf" aria-hidden="true"><span>{book.title}</span></div>
      </div>
    </dialog>
  );
}

export function LabShelf({ books }: { books: ShelfBook[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [mode, setMode] = useState<LabViewMode>("wheel");
  const [selected, setSelected] = useState(books[0].slug);
  const [open, setOpen] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);
  const wheel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const visible = filter === "all" ? books : books.filter((book) => book.categories.includes(filter));
  const active = visible.find((book) => book.slug === selected) ?? visible[0];
  const opened = books.find((book) => book.slug === open);

  useEffect(() => {
    const syncSlug = (slug: string) => {
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
    };
  }, [books]);

  useEffect(() => {
    const track = wheel.current;
    if (!track || open) return;
    const center = () => {
      const current = track.querySelector<HTMLElement>('[aria-current="true"]');
      if (current) track.scrollTop = current.offsetTop - (track.clientHeight - current.offsetHeight) / 2;
    };
    const frame = requestAnimationFrame(center);
    const observer = new ResizeObserver(center);
    observer.observe(track);
    let horizontal = 0;
    let lastWheel = 0;
    const horizontalWheel = (event: WheelEvent) => {
      if (!event.shiftKey && Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      const now = performance.now();
      if (now - lastWheel > 200) horizontal = 0;
      lastWheel = now;
      horizontal += event.deltaX || event.deltaY;
      if (Math.abs(horizontal) < 45) return;
      track.scrollBy({ top: Math.sign(horizontal) * 60, behavior: "instant" });
      horizontal = 0;
    };
    track.addEventListener("wheel", horizontalWheel, { passive: false });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      track.removeEventListener("wheel", horizontalWheel);
    };
  }, [filter, mode, open]);

  function moveTo(book: ShelfBook) {
    setSelected(book.slug);
    const track = wheel.current;
    const row = track?.querySelector<HTMLElement>(`[data-spine="${book.slug}"]`);
    if (track && row) track.scrollTo({
      top: row.offsetTop - (track.clientHeight - row.offsetHeight) / 2,
      behavior: reducedMotion() ? "instant" : "smooth",
    });
  }

  function openBook(book: ShelfBook, step = 0) {
    if (!open) opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelected(book.slug);
    setDirection(step);
    setOpen(book.slug);
    window.history[open ? "replaceState" : "pushState"](null, "", `#${book.slug}`);
  }

  function closeBook() {
    setOpen(null);
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    requestAnimationFrame(() => {
      if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });
    });
  }

  function stepWheel(step: number) {
    const next = visible[visible.indexOf(active) + step];
    if (next) moveTo(next);
  }

  function turnBook(step: number) {
    const index = visible.findIndex((book) => book.slug === open);
    const next = visible[(index + step + visible.length) % visible.length];
    if (next) openBook(next, step);
  }

  return (
    <div className="shelf">
      <header className="shelf__header">
        <h1 className="text-display">Lab</h1>
        <div className="shelf__filters" aria-label="Filter books" role="group">
          {filters.map(({ id, label }) => <button key={id} type="button" className="shelf-action" aria-pressed={filter === id}
            onClick={() => setFilter(id)}>{label}</button>)}
        </div>
        <div className="shelf__modes" aria-label="Shelf view" role="group">
          {modes.map((view) => <button key={view} type="button" className="shelf-action" aria-pressed={mode === view}
            onClick={() => { setMode(view); try { localStorage.setItem("lab-mode", view); } catch {} }}>{view}</button>)}
        </div>
      </header>
      {mode === "wheel" && active && (
        <div className="shelf__wheel">
          <div className="shelf__column">
            <div ref={wheel} className="shelf__track" data-lenis-prevent tabIndex={0} role="region" aria-label="Book spine wheel"
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  stepWheel(event.key === "ArrowDown" ? 1 : -1);
                } else if (event.key === "Enter" && event.target === event.currentTarget) {
                  event.preventDefault();
                  openBook(active);
                }
              }}
              onScroll={(event) => {
                const el = event.currentTarget;
                const current = visible[Math.min(visible.length - 1, Math.max(0, Math.round(el.scrollTop / 60)))];
                if (current) setSelected(current.slug);
              }}>
              {visible.map((book) => (
                <button key={book.slug} type="button" className="shelf-spine" data-spine={book.slug}
                  aria-current={active.slug === book.slug ? true : undefined}
                  onClick={() => active.slug === book.slug ? openBook(book) : moveTo(book)}>
                  <span className="shelf-spine__index text-mono-meta">{number(books.indexOf(book) + 1)}</span>
                  <span className="shelf-spine__title">{book.title}</span>
                  {active.slug === book.slug && <><span className="shelf-spine__category text-mono-meta">{book.category}</span>
                    <span className="shelf-spine__view text-mono-meta">View <ArrowRight size={15} /></span></>}
                </button>
              ))}
            </div>
            <div className="shelf__wheel-controls">
              <button type="button" className="shelf-action" aria-label="Previous spine" disabled={visible[0] === active} onClick={() => stepWheel(-1)}><ArrowUp size={16} /></button>
              <span className="text-mono-meta">{number(visible.indexOf(active) + 1)} / {number(visible.length)}</span>
              <button type="button" className="shelf-action" aria-label="Next spine" disabled={visible.at(-1) === active} onClick={() => stepWheel(1)}><ArrowDown size={16} /></button>
            </div>
            <p className="shelf__touch-hint text-mono-meta">Swipe to browse projects</p>
          </div>
          <div className="shelf__preview"><Cover book={active} index={books.indexOf(active) + 1} onOpen={() => openBook(active)} /></div>
        </div>
      )}
      {mode === "grid" && <div className="shelf__scroll shelf__grid" data-lenis-prevent>
        {visible.map((book) => <Cover key={book.slug} book={book} index={books.indexOf(book) + 1} compact onOpen={() => openBook(book)} />)}
      </div>}
      {mode === "list" && <div className="shelf__scroll" data-lenis-prevent>
        <ol className="shelf__list">
          {visible.map((book) => <li key={book.slug}>
            <button type="button" className="shelf-row" onClick={() => openBook(book)}>
              <span className="text-mono-meta">{number(books.indexOf(book) + 1)}</span><strong>{book.title}</strong>
              <span className="shelf-row__category text-mono-meta">{book.category}</span>
              <span className="text-mono-meta">{book.status}</span><ArrowRight size={17} aria-hidden="true" />
            </button>
          </li>)}
        </ol>
      </div>}
      {opened && <Spread book={opened} index={books.indexOf(opened) + 1} total={books.length}
        direction={direction} onClose={closeBook} onTurn={turnBook} canTurn={visible.length > 1} />}
    </div>
  );
}
