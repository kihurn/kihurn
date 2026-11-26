import type { Metadata } from "next";
import "../../styles/lab.css";
import "../../styles/systems.css";
import { EcosystemMap } from "@/components/lab/EcosystemMap";
import { ChatPath } from "@/components/lab/Parts";
import { projects } from "@/content/projects";
import { getEcosystemGraph } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Systems",
  description: "The architecture behind C0RE, the portfolio chat, and their connected projects.",
};

export default function SystemsPage() {
  const { nodes, edges } = getEcosystemGraph(projects);
  return (
    <main id="main" className="systems">
      <header className="labpage__head"><h1 className="text-display">Systems</h1></header>
      <section className="lab-sec" aria-labelledby="map-h">
        <h2 id="map-h" className="lab-sec__title text-label">AI ecosystem</h2>
        <EcosystemMap nodes={nodes} edges={edges} projects={projects.filter((project) => nodes.some((node) => node.slug === project.slug))} />
      </section>
      <ChatPath />
    </main>
  );
}
