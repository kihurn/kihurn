import type { Metadata } from "next";
import "../../styles/lab.css";
import { EcosystemMap } from "@/components/lab/EcosystemMap";
import { LabBrowser } from "@/components/lab/LabBrowser";
import { BookCard, ChatPath } from "@/components/lab/Parts";
import { projects } from "@/content/projects";
import { getEcosystemGraph } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Lab",
  description: "Everything Ki Hurn has built, led by a map of how his AI projects connect.",
};

export default function LabPage() {
  const { nodes, edges } = getEcosystemGraph(projects);
  return (
    <main id="main" className="lab">
      <header className="lab__head">
        <h1 className="text-display">Lab</h1>
        <p className="text-body lab__intro">
          Everything I&apos;ve built: the finished work first, then what&apos;s still in progress. Start with how my AI
          projects connect.
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
      <LabBrowser projects={projects} />

      <section className="lab-sec" aria-labelledby="book-h">
        <h2 id="book-h" className="lab-sec__title text-label">
          Elsewhere
        </h2>
        <BookCard />
      </section>
    </main>
  );
}
