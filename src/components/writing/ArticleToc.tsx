"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  heading: string;
}

export function ArticleToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const els = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0 || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0, 1] },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  return (
    <aside className="article__toc" aria-label="Table of contents">
      <p className="text-mono-sm u-muted">INDEX::</p>
      <ol className="article__toc-list">
        {items.map((item, i) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`article__toc-link text-meta ${active === item.id ? "is-active" : ""}`}
              aria-current={active === item.id ? "location" : undefined}
            >
              <span className="text-mono-meta">{String(i + 1).padStart(2, "0")}</span>
              <span>{item.heading}</span>
            </a>
          </li>
        ))}
      </ol>
    </aside>
  );
}
