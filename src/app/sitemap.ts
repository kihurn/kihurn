import type { MetadataRoute } from "next";
import { site } from "@/content/site";

const BASE = "https://kihurn.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(site.updated);
  return ["", "/lab", "/about", "/gigs", "/systems", "/contact"].map((p) => ({
    url: `${BASE}${p}`,
    lastModified,
    changeFrequency: p === "" ? ("weekly" as const) : ("monthly" as const),
    priority: p === "" ? 1 : 0.7,
  }));
}
