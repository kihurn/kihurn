import type { Metadata } from "next";
import Link from "next/link";
import "../../styles/home.css";
import "../../styles/about-board.css";
import "../../styles/pages.css";
import { AboutBehaviors } from "@/components/about/AboutBehaviors";
import { AboutBoard } from "@/components/about/AboutBoard";
import { AboutDialogs } from "@/components/about/AboutDialogs";
import { skillGroups, spokenLanguages, timeline } from "@/content/about";
import { now } from "@/content/now";

export const metadata: Metadata = {
  title: "About",
  description: "Wong Ki Hurn: Computer Science student and part-time system engineer in Subang Jaya, Malaysia.",
};

export default function AboutPage() {
  return (
    <main id="main" className="aboutpage">
      <h1 className="u-sr-only">About Wong Ki Hurn</h1>
      <AboutBoard />
      <AboutDialogs />
      <AboutBehaviors />

      <div className="aboutpage__rest">
        <section className="page__sec" aria-labelledby="now-box">
          <h2 id="now-box" className="page__title text-label">
            Currently
          </h2>
          <ul className="now">
            {now.map((l) => (
              <li key={l.label} className="now__row">
                <span className="now__k text-mono-meta">{l.label}</span>
                <span className="now__v text-body">{l.text}</span>
                {l.since ? <span className="now__since text-meta">since {l.since}</span> : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="page__sec" aria-labelledby="timeline-h">
          <h2 id="timeline-h" className="page__title text-label">
            Timeline
          </h2>
          <ol className="timeline" data-timeline>
            {timeline.map((t) => (
              <li key={`${t.title}-${t.when}`} className="timeline__row">
                <span className="timeline__when text-mono-meta">{t.when}</span>
                <div className="timeline__main">
                  <p className="timeline__kind text-meta">{t.kind}</p>
                  <h3 className="timeline__title">{t.title}</h3>
                  <p className="timeline__org text-body">{t.org}</p>
                  {t.detail ? <p className="timeline__detail text-body">{t.detail}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="page__sec" aria-labelledby="skills-h">
          <h2 id="skills-h" className="page__title text-label">
            Skills
          </h2>
          <div className="skills">
            {skillGroups.map((g) => (
              <div key={g.heading} className="skills__group">
                <h3 className="skills__h">{g.heading}</h3>
                <ul className="skills__list">
                  {g.items.map((i) => (
                    <li key={i} className="chip text-meta">
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-body about__spoken">
            <span className="text-mono-meta">Spoken:</span> {spokenLanguages.join(", ")}
          </p>
        </section>

        <p className="about__last text-body">
          <Link href="/gigs" className="about__crew">
            When I&apos;m not building, I&apos;m usually crewing events →
          </Link>
        </p>
      </div>
    </main>
  );
}
