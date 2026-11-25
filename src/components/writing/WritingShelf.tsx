"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Article, WritingTag } from "@/content/writing";
import { buildBookCoverSpec } from "@/lib/writingCovers";

const TAGS: Array<"All" | WritingTag> = ["All", "web", "design", "motion", "tools"];

export function WritingShelf({ items }: { items: Article[] }) {
  const years = useMemo(
    () => ["All", ...Array.from(new Set(items.map((a) => a.year))).sort((a, b) => Number(b) - Number(a))],
    [items],
  );
  const [year, setYear] = useState<string>("All");
  const [tag, setTag] = useState<"All" | WritingTag>("All");

  const visible = useMemo(
    () =>
      items.filter((a) => {
        if (year !== "All" && a.year !== year) return false;
        if (tag !== "All" && !a.tags.includes(tag)) return false;
        return true;
      }),
    [items, year, tag],
  );

  return (
    <div className="writing">
      <div className="writing__controls" aria-label="Filter articles">
        <div className="writing__group" role="group" aria-label="Filter by topic">
          <span className="writing__label text-mono-sm">TOPIC::</span>
          {TAGS.map((t) => (
            <button
              key={t}
              type="button"
              className="chip text-meta writing__btn"
              aria-pressed={tag === t}
              onClick={() => setTag(t)}
            >
              {t === "All" ? "All" : t.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="writing__group" role="group" aria-label="Filter by year">
          <span className="writing__label text-mono-sm">YEAR::</span>
          {years.map((y) => (
            <button
              key={y}
              type="button"
              className="chip text-meta writing__btn"
              aria-pressed={year === y}
              onClick={() => setYear(y)}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <p className="text-mono-meta u-muted" aria-live="polite">
        EDITION_SHELF:: {String(visible.length).padStart(2, "0")} / {String(items.length).padStart(2, "0")} · HOVER COVER TO PEEK INSIDE
      </p>

      {visible.length === 0 ? (
        <p className="text-body u-muted">No essays match both filters.</p>
      ) : (
        <ul className="bookgrid" data-row-list>
          {visible.map((a, idx) => {
            const spec = buildBookCoverSpec(a, idx);
            return (
              <li key={a.slug} className="bookcard">
                <Link href={`/writing/${a.slug}`} className="bookcard__link" data-hover>
                  <div className="bookcard__page" aria-hidden="true">
                    <div className="bookcard__page-head text-mono-sm">
                      <span>FOLIO::{spec.issueNo}</span>
                      <span>{a.readTime.toUpperCase()} READ</span>
                    </div>
                    <p className="bookcard__page-ch text-label">{spec.chapterHeading}</p>
                    <p className="bookcard__page-excerpt text-body-sm">{spec.excerpt}</p>
                    <span className="bookcard__page-go text-mono-sm">OPEN ESSAY →</span>
                  </div>

                  <div className="bookcard__cover">
                    <div className="bookcard__spine" aria-hidden="true">
                      <span className="text-mono-sm">N°{spec.issueNo}</span>
                      <span className="bookcard__spine-rule" />
                      <span className="text-mono-sm">{a.year}</span>
                    </div>

                    <div className="bookcard__front">
                      <div className="bookcard__fhead text-mono-sm">
                        <span>{spec.editionLabel}</span>
                        <span>{a.date}</span>
                      </div>

                      <div className="bookcard__fmid">
                        <h2 className="bookcard__title text-h4">{a.title}</h2>
                        <p className="bookcard__summary text-body-sm u-muted">{a.summary}</p>
                      </div>

                      <div className="bookcard__ffoot">
                        <div className="bookcard__tags">
                          {a.tags.map((t) => (
                            <span key={t} className="chip text-meta chip--pill">
                              {t.toUpperCase()}
                            </span>
                          ))}
                        </div>
                        <span className="text-mono-sm u-muted">{a.readTime} · READ →</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
