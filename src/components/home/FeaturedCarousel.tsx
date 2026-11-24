"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Project } from "@/content/types";
import { HalftoneImage } from "@/components/media/HalftoneImage";

const pad = (n: number) => String(n).padStart(2, "0");
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+";

/** Title that scrambles into place when it changes; instant under reduced motion. */
function ScrambleText({ text }: { text: string }) {
  // null = show the real text; a string = mid-scramble frame
  const [frame, setFrame] = useState<string | null>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    const dur = 350;
    const id = setInterval(() => {
      const p = Math.min(1, (performance.now() - start) / dur);
      if (p >= 1) {
        clearInterval(id);
        setFrame(null);
        return;
      }
      const settled = Math.floor(p * text.length);
      setFrame(
        [...text]
          .map((ch, i) => (i < settled || ch === " " ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join(""),
      );
    }, 32);
    return () => {
      clearInterval(id);
      setFrame(null);
    };
  }, [text]);
  return <span aria-label={text}>{frame ?? text}</span>;
}

export function FeaturedCarousel({ items }: { items: Project[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const n = items.length;

  const slideWidth = () => track.current?.clientWidth ?? 1;

  // keep the counter in step with swipes, wheel and keys
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.min(n - 1, Math.max(0, Math.round(el.scrollLeft / slideWidth()))));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [n]);

  const go = useCallback(
    (to: number) => {
      const el = track.current;
      if (!el) return;
      const i = Math.min(n - 1, Math.max(0, to));
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollTo({ left: i * el.clientWidth, behavior: reduced ? "auto" : "smooth" });
      setIndex(i);
    },
    [n],
  );

  if (n === 0) return null;
  const current = items[index];

  return (
    <section
      className="fc"
      aria-roledescription="carousel"
      aria-label="Featured projects"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(index + 1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(index - 1);
        }
      }}
    >
      <div className="fc__head">
        <p className="fc__counter text-mono-meta" data-fc-counter aria-live="polite">
          {`Nº${pad(index + 1)}/${pad(n)}`}
        </p>
        <div className="fc__nav">
          <button type="button" className="fc__btn" aria-label="Previous project" onClick={() => go(index - 1)} disabled={index === 0}>
            ←
          </button>
          <button type="button" className="fc__btn" aria-label="Next project" onClick={() => go(index + 1)} disabled={index === n - 1}>
            →
          </button>
        </div>
      </div>

      <ul ref={track} className="fc__track" data-fc-track>
        {items.map((p, i) => (
          <li key={p.slug} className="fc__slide" aria-hidden={i !== index} aria-roledescription="slide" aria-label={`${i + 1} of ${n}`}>
            <HalftoneImage
              src={`/placeholder/shot-${p.slug}.svg`}
              alt={`TODO: screenshot of ${p.name}`}
              width={800}
              height={600}
              className="fc__shot"
            />
          </li>
        ))}
      </ul>

      <div className="fc__body">
        <h3 className="fc__title text-display">
          <ScrambleText text={current.name} />
        </h3>
        <ul className="fc__tags">
          {(current.tags ?? []).map((t) => (
            <li key={t} className="chip text-meta">
              {t}
            </li>
          ))}
          {current.finishedOn && current.finishedOn !== "TODO" ? <li className="chip text-meta">{current.finishedOn}</li> : null}
        </ul>
        <p className="fc__summary text-body">{current.summary}</p>
        <Link className="fc__link text-nav" href={current.caseStudy ? `/lab/${current.slug}` : `/lab#${current.slug}`}>
          View project <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}
