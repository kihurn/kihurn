import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../../../styles/lab.css";
import { ExperimentWorkbench } from "@/components/lab/ExperimentWorkbench";
import { FaceDemo } from "@/components/lab/FaceDemo";
import { Flow, ProjectLinks, ShotSlot } from "@/components/lab/Parts";
import { caseStudies } from "@/content/caseStudies";
import { experiments, isExperimentSlug } from "@/content/experiments";
import { projects } from "@/content/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  const caseParams = projects.filter((p) => p.caseStudy && caseStudies[p.slug]).map((p) => ({ slug: p.slug }));
  const expParams = experiments.map((e) => ({ slug: e.slug }));
  return [...caseParams, ...expParams];
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  if (isExperimentSlug(slug)) {
    const exp = experiments.find((e) => e.slug === slug);
    return exp ? { title: `${exp.title} · Lab`, description: exp.subtitle } : {};
  }
  const p = projects.find((x) => x.slug === slug);
  return p ? { title: p.name, description: p.summary.slice(0, 160) } : {};
}

export default async function LabDetailPage({ params }: Params) {
  const { slug } = await params;

  if (isExperimentSlug(slug)) {
    const idx = experiments.findIndex((e) => e.slug === slug);
    const spec = experiments[idx];
    const prev = idx > 0 ? experiments[idx - 1] : null;
    const next = idx < experiments.length - 1 ? experiments[idx + 1] : null;
    return <ExperimentWorkbench spec={spec} prev={prev} next={next} />;
  }

  const p = projects.find((x) => x.slug === slug && x.caseStudy);
  const cs = caseStudies[slug];
  if (!p || !cs) notFound();

  return (
    <main id="main" className="labpage case">
      <Link className="case__back text-meta" href="/lab">
        ← Lab
      </Link>
      <header className="labpage__head">
        <h1 className="text-display">{p.name}</h1>
        <ul className="pentry__tags">
          {(p.tags ?? []).map((t) => (
            <li key={t} className="chip text-meta">
              {t}
            </li>
          ))}
        </ul>
      </header>

      <section className="lab-sec" aria-labelledby="cs-problem">
        <h2 id="cs-problem" className="lab-sec__title text-label">Problem</h2>
        <p className="text-body">{cs.problem}</p>
      </section>

      <section className="lab-sec" aria-labelledby="cs-built">
        <h2 id="cs-built" className="lab-sec__title text-label">What I built</h2>
        <dl className="pentry__parts">
          <div>
            <dt className="text-label">My part</dt>
            <dd className="text-body">{p.myPart}</dd>
          </div>
          {p.teamPart ? (
            <div>
              <dt className="text-label">The team</dt>
              <dd className="text-body">{p.teamPart}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="lab-sec" aria-labelledby="cs-how">
        <h2 id="cs-how" className="lab-sec__title text-label">How it works</h2>
        {cs.flow.length > 0 ? <Flow steps={cs.flow} label={`How ${p.name} works`} /> : null}
        {cs.diagramTodo ? <ShotSlot internal={p.status === "internal"} slug={p.slug} name={p.name} /> : null}
        {cs.how.map((para) => (
          <p key={para} className="text-body">{para}</p>
        ))}
        {p.slug === "securefin" ? <FaceDemo /> : null}
      </section>

      <section className="lab-sec" aria-labelledby="cs-result">
        <h2 id="cs-result" className="lab-sec__title text-label">Result</h2>
        <p className="text-body">{cs.result}</p>
      </section>

      <section className="lab-sec" aria-labelledby="cs-stack">
        <h2 id="cs-stack" className="lab-sec__title text-label">Stack</h2>
        <ul className="pentry__stack">
          {p.stack.map((s) => (
            <li key={s} className="chip text-meta">{s}</li>
          ))}
        </ul>
      </section>

      <section className="lab-sec" aria-labelledby="cs-links">
        <h2 id="cs-links" className="lab-sec__title text-label">Links</h2>
        <ProjectLinks p={{ ...p, caseStudy: false }} />
      </section>
    </main>
  );
}
