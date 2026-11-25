import type { Metadata } from "next";
import Link from "next/link";
import "../../styles/pages.css";
import { news } from "@/content/news";
import { ArrowUpRightIcon } from "@/components/chrome/icons";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Chronological build log and site updates synced with the top notification drawer.",
};

function formatDate(date: string): string {
  if (date === "TODO") return "UNSCHEDULED";
  const parts = date.split("-").map(Number);
  const d = new Date(Date.UTC(parts[0], (parts[1] ?? 1) - 1, parts[2] ?? 1));
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    month: "short",
    year: "numeric",
    ...(parts[2] ? { day: "2-digit" } : {}),
  })
    .format(d)
    .toUpperCase();
}

export default function ChangelogPage() {
  const items = [...news].sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));

  return (
    <main id="main" className="page">
      <header className="page__head">
        <p className="text-mono-meta u-muted">LOG::CHRONOLOGICAL</p>
        <h1 className="text-display">Changelog</h1>
        <p className="page__intro text-body">
          A chronological build log of site upgrades, shipped projects, and milestones—synced with the header update
          drawer.
        </p>
      </header>

      <ol className="changelog" aria-label="Site build log">
        {items.map((item, idx) => (
          <li key={`${item.date}-${item.title}`} className="changelog__row">
            <div className="changelog__meta text-mono-meta">
              <span className="changelog__idx">LOG::N°{String(items.length - idx).padStart(2, "0")}</span>
              <span className="u-muted">{formatDate(item.date)}</span>
            </div>
            <div className="changelog__main">
              <span className="chip text-meta chip--pill">{item.category}</span>
              <p className="changelog__title text-h6">{item.title}</p>
            </div>
            {item.href && item.href !== "/changelog" ? (
              <Link href={item.href} className="changelog__link text-mono-meta" data-hover>
                <span>OPEN</span>
                <ArrowUpRightIcon />
              </Link>
            ) : (
              <span className="text-mono-meta u-muted">SYNCED</span>
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}
