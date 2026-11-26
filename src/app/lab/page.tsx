import type { Metadata } from "next";
import Link from "next/link";
import "../../styles/lab-wheel.css";
import "../../styles/lab.css";
import { EcosystemMap } from "@/components/lab/EcosystemMap";
import { LabBrowser } from "@/components/lab/LabBrowser";
import { LabWheel, type LabItem } from "@/components/lab/LabWheel";
import { BookCard, ChatPath } from "@/components/lab/Parts";
import { experiments } from "@/content/experiments";
import { projects } from "@/content/projects";
import { media } from "@/data/media";
import { availableMedia } from "@/lib/server/media";
import { LENS_LABEL, getEcosystemGraph, projectHref, projectTag, wheelOrder } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Lab",
  description: "Interactive shaders, physics experiments, and everything Ki Hurn has built.",
};

const experimentItems: LabItem[] = experiments.map((exp) => ({
  slug: exp.slug,
  name: exp.title,
  tag: exp.engine,
  pill: `EXP::${exp.index}`,
  href: `/lab/${exp.slug}`,
  year: exp.year,
  summary: exp.subtitle,
  kind: "experiment",
}));

const photos = Object.fromEntries(projects.map((p) => [
  p.slug,
  p.status === "internal" ? undefined : availableMedia(media.projects[p.slug]),
]));

const projectItems: LabItem[] = wheelOrder(projects).map((p) => ({
  slug: p.slug,
  name: p.name,
  tag: LENS_LABEL[p.lenses[0]] ?? "SYSTEMS",
  pill: projectTag(p),
  href: projectHref(p),
  year: p.finishedOn?.slice(0, 4),
  summary: p.summary,
  kind: "project",
  photo: photos[p.slug],
}));

const labItems: LabItem[] = [...experimentItems, ...projectItems];

export default function LabPage() {
  const { nodes, edges } = getEcosystemGraph(projects);
  return (
    <main id="main" className="labpage">
      <div className="container">
        <LabWheel items={labItems} />
      </div>

      <div className="labpage__rest">
        <header className="labpage__head">
          <h2 className="text-display">Project index</h2>
          <p className="text-body labpage__intro">
            Finished work, projects in development, and concepts I&apos;m exploring.
          </p>
        </header>

        <section className="lab-sec" aria-labelledby="map-h">
          <h2 id="map-h" className="lab-sec__title text-label">
            AI ecosystem
          </h2>
          <EcosystemMap nodes={nodes} edges={edges} />
          <p className="lab-sec__note text-meta">
            A line means the project&apos;s README says it uses the other. Greyed nodes are still in progress.
          </p>
        </section>

        <ChatPath />
        <LabBrowser projects={projects} photos={photos} />

        <section className="lab-sec" aria-labelledby="exp-h">
          <h2 id="exp-h" className="lab-sec__title text-label">
            Motion &amp; shader workbench (01–04)
          </h2>
          <ul className="exp-shelf" data-row-list>
            {experiments.map((exp) => (
              <li key={exp.slug}>
                <Link href={`/lab/${exp.slug}`} className="exp-shelf__card">
                  <div className="exp-shelf__top text-mono-sm u-muted">
                    <span>EXP::{exp.index}</span>
                    <span>{exp.engine}</span>
                  </div>
                  <h3 className="text-h5">{exp.title}</h3>
                  <p className="text-body-sm u-muted">{exp.subtitle}</p>
                  <span className="exp-shelf__cta text-mono-sm">OPEN STAGE →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="lab-sec" aria-labelledby="book-h">
          <h2 id="book-h" className="lab-sec__title text-label">
            Elsewhere
          </h2>
          <BookCard />
        </section>
      </div>
    </main>
  );
}
