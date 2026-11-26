import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "../../styles/home.css";
import "../../styles/about-board.css";
import "../../styles/pages.css";
import { AboutBehaviors } from "@/components/about/AboutBehaviors";
import { AboutBoard } from "@/components/about/AboutBoard";
import { AboutDialogs } from "@/components/about/AboutDialogs";
import { education, experience, firewallCertificate, skillGroups, spokenLanguages } from "@/content/about";
import { now } from "@/content/now";

export const metadata: Metadata = {
  title: "About",
  description: "Wong Ki Hurn is a full-stack developer, Computer Science student and part-time system engineer in Subang Jaya, Malaysia.",
};

export const revalidate = 3600;

const profileSections = [
  { id: "experience", title: "Experience", entries: experience },
  { id: "education", title: "Education", entries: education },
];

export default function AboutPage() {
  return (
    <main id="main" className="aboutpage">
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

        {profileSections.map(({ id, title, entries }) => (
          <section key={id} id={id} className="page__sec" aria-labelledby={`${id}-h`}>
            <h2 id={`${id}-h`} className="page__title text-label">{title}</h2>
            <ol className="timeline">
              {entries.map((entry) => (
                <li key={entry.title} className="timeline__row">
                  <span className="timeline__when text-mono-meta">{entry.when}</span>
                  <div className="timeline__main">
                    <h3 className="timeline__title">{entry.title}</h3>
                    <p className="timeline__org text-body">{entry.org}</p>
                    <p className="timeline__detail text-body">{entry.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}

        <section id="certifications" className="page__sec" aria-labelledby="certifications-h">
          <h2 id="certifications-h" className="page__title text-label">Certifications</h2>
          <div className="timeline">
            <article className="timeline__row">
              <time className="timeline__when text-mono-meta" dateTime={firewallCertificate.date}>
                {firewallCertificate.issued}
              </time>
              <div className="timeline__main">
                <h3 className="timeline__title">{firewallCertificate.title}</h3>
                <p className="timeline__org text-body">{firewallCertificate.issuer} · Certificate of Completion · 40 hours</p>
                <a className="about__certificate" href={firewallCertificate.image} target="_blank" rel="noopener noreferrer">
                  <Image
                    src={firewallCertificate.image}
                    alt="EDU-210 certificate awarded to Ki Hurn Wong"
                    width={1286}
                    height={909}
                    unoptimized
                  />
                  <span className="text-mono-meta">View full-size certificate ↗</span>
                </a>
              </div>
            </article>
          </div>
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
