import Link from "next/link";
import { news } from "@/content/news";
import { ArrowRightIcon, ArrowUpRightIcon } from "./icons";

function when(date: string): string {
  if (date === "TODO") return "TODO:";
  const parts = date.split("-").map(Number);
  const d = new Date(Date.UTC(parts[0], (parts[1] ?? 1) - 1, parts[2] ?? 1));
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    month: "short",
    year: "numeric",
    ...(parts[2] ? { day: "numeric" } : {}),
  }).format(d);
}

/** The "What's new" drawer (the bell button lives in Header). */
export function NewsPanel() {
  const items = [...news]
    .sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0))
    .slice(0, 6);
  return (
    <div className="notif" id="notif" data-notif aria-hidden="true">
      <div className="notif__panel" role="dialog" aria-modal="true" aria-label="What’s new">
        <div className="notif__head">
          <p className="notif__title text-label">LOG::UPDATES</p>
          <span className="notif__count text-meta" data-notif-count hidden />
          <button className="notif__clear text-meta" type="button" data-notif-clear hidden>Mark all read</button>
        </div>
        <div className="notif__body">
          <div className="notif__fade" aria-hidden="true" />
          <div className="notif__list" data-notif-list>
            {items.map((n) => {
              const inner = (
                <>
                  <div className="notif__main">
                    <div className="notif__meta">
                      <span className="chip text-meta chip--pill">{n.category}</span>
                      <span className="notif__time text-meta">{when(n.date)}</span>
                    </div>
                    <p className="notif__summary">{n.title}</p>
                  </div>
                  <span className="notif__dot" aria-hidden="true" />
                  {n.href ? (
                    <span className="linkcircle notif__link" aria-hidden="true"><ArrowUpRightIcon /></span>
                  ) : null}
                </>
              );
              return n.href ? (
                <Link key={n.title} data-date={n.date} href={n.href} className="notif__item notif__item--link">{inner}</Link>
              ) : (
                <div key={n.title} data-date={n.date} className="notif__item">{inner}</div>
              );
            })}
          </div>
          <div className="notif__fade notif__fade--bottom" aria-hidden="true" />
        </div>
        <div className="notif__footer">
          <Link className="notif__all text-mono-meta" href="/changelog">
            <span>View changelog</span>
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </div>
  );
}
