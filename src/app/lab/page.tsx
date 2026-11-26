import type { Metadata } from "next";
import "../../styles/lab.css";
import "../../styles/lab-shelf.css";
import { LabShelf, type ShelfBook } from "@/components/lab/LabShelf";
import { caseStudies } from "@/content/caseStudies";
import { experiments } from "@/content/experiments";
import { projects } from "@/content/projects";
import { media } from "@/data/media";
import { LENS_LABEL, projectTag, wheelOrder } from "@/lib/projects";
import { availableMedia } from "@/lib/server/media";

export const metadata: Metadata = {
  title: "Lab",
  description: "A shelf of software projects, system designs and interactive motion experiments.",
};

const books: ShelfBook[] = [
  ...experiments.map((exp) => ({
    slug: exp.slug, title: exp.title, categories: ["motion" as const], category: "MOTION",
    status: `EXP::${exp.index}`, year: exp.year, summary: exp.subtitle, description: exp.summary,
    stack: [exp.engine], stage: `/lab/${exp.slug}`,
  })),
  ...wheelOrder(projects).map((p) => ({
    slug: p.slug, title: p.name, categories: p.lenses, category: LENS_LABEL[p.lenses[0]] ?? "SYSTEMS",
    status: projectTag(p), year: p.finishedOn?.slice(0, 4), summary: p.summary,
    stack: p.stack, photo: p.status === "internal" ? undefined : availableMedia(media.projects[p.slug]),
    repo: p.repo, live: p.live, role: p.myPart, team: p.teamPart, internal: p.status === "internal",
    tags: p.tags, dependencies: p.uses.map((slug) => projects.find((project) => project.slug === slug)?.name ?? slug),
    study: p.caseStudy ? caseStudies[p.slug] : undefined,
  })),
];

export default function LabPage() {
  return <main id="main"><LabShelf books={books} /></main>;
}
