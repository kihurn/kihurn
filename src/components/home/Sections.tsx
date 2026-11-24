import Link from "next/link";
import type { NowLine, Project } from "@/content/types";
import type { ActivityItem } from "@/lib/server/github";

const href = (p: Project) => (p.caseStudy ? `/lab/${p.slug}` : `/lab#${p.slug}`);

export function NowList({ lines }: { lines: NowLine[] }) {
  return (
    <section className="hs" aria-labelledby="now-h">
      <h2 id="now-h" className="hs__title text-label">
        Now
      </h2>
      <ul className="now" data-now>
        {lines.map((l) => (
          <li key={l.label} className="now__row">
            <span className="now__k text-mono-meta">{l.label}</span>
            <span className="now__v text-body">{l.text}</span>
            {l.since ? <span className="now__since text-meta">since {l.since}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProjectCard({ p }: { p: Project }) {
  return (
    <li className="pcard">
      <div className="pcard__meta">
        {(p.tags ?? []).map((t) => (
          <span key={t} className="chip text-meta">
            {t}
          </span>
        ))}
        {p.finishedOn && p.finishedOn !== "TODO" ? <span className="chip text-meta">{p.finishedOn}</span> : null}
      </div>
      <h3 className="pcard__name">
        <Link href={href(p)}>{p.name}</Link>
      </h3>
      <p className="pcard__summary text-body">{p.summary}</p>
    </li>
  );
}

export function BuildingList({ items }: { items: Project[] }) {
  if (items.length === 0) return null;
  return (
    <section className="hs" aria-labelledby="building-h">
      <h2 id="building-h" className="hs__title text-label">
        Building
      </h2>
      <ul className="pcards" data-building>
        {items.map((p) => (
          <ProjectCard key={p.slug} p={p} />
        ))}
      </ul>
    </section>
  );
}

export function RecentlyDone({ items }: { items: Project[] }) {
  if (items.length === 0) return null;
  return (
    <section className="hs" aria-labelledby="done-h">
      <h2 id="done-h" className="hs__title text-label">
        Recently done
      </h2>
      <ul className="pcards" data-done>
        {items.map((p) => (
          <ProjectCard key={p.slug} p={p} />
        ))}
      </ul>
    </section>
  );
}

function ago(iso: string): string {
  const days = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 60) return `${days} days ago`;
  return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(iso));
}

/** Renders nothing when GitHub gave us nothing, so a rate limit never leaves a hole. */
export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="hs" aria-labelledby="activity-h">
      <h2 id="activity-h" className="hs__title text-label">
        Recent activity
      </h2>
      <ul className="activity" data-activity>
        {items.map((a) => (
          <li key={`${a.repo}-${a.at}-${a.text}`} className="activity__row">
            <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-body">
              <span className="activity__repo text-mono-meta">{a.repo.split("/")[1]}</span> {a.text}
            </a>
            <time className="activity__when text-meta" dateTime={a.at}>
              {ago(a.at)}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}
