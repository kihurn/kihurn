import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import "../../../styles/lab.css";
import { ExperimentWorkbench } from "@/components/lab/ExperimentWorkbench";
import { caseStudies } from "@/content/caseStudies";
import { experiments, isExperimentSlug } from "@/content/experiments";
import { projects } from "@/content/projects";
import { projectHref } from "@/lib/projects";

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

  permanentRedirect(projectHref(p));
}
