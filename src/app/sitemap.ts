import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { site } from "@/content/site";

const BASE = "https://kihurn.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(site.updated);
  const pages = ["", "/lab", "/about", "/gigs", "/contact"].map((p) => ({
    url: `${BASE}${p}`,
    lastModified,
    changeFrequency: p === "" ? ("weekly" as const) : ("monthly" as const),
    priority: p === "" ? 1 : 0.7,
  }));
  const studies = projects
    .filter((p) => p.caseStudy)
    .map((p) => ({ url: `${BASE}/lab/${p.slug}`, lastModified, changeFrequency: "monthly" as const, priority: 0.6 }));
  return [...pages, ...studies];
}
