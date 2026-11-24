export type Lens = "networking" | "fullstack" | "ai" | "security";
export type Status = "building" | "paused" | "done" | "internal";

export interface Project {
  slug: string;
  name: string;
  summary: string;
  repo?: string; // "owner/name"
  live?: string; // full https URL
  status: Status;
  lenses: Lens[];
  stack: string[];
  myPart: string;
  teamPart?: string;
  uses: string[]; // slugs this project depends on (ecosystem edges)
  ecosystem: boolean; // drawn as a live node on the Lab map
  showOnHome: boolean;
  featured: boolean;
  caseStudy: boolean;
  finishedOn?: string; // "YYYY-MM" or "TODO"
  tags?: string[]; // e.g. "SHIPPED", "DEMO", "INTERNAL", "WIP"
}

export interface NowLine {
  label: "Building" | "Working" | "Studying" | "Learning";
  text: string;
  since?: string;
}

export interface FaqEntry {
  id: string;
  question: string;
  keywords: string[];
  answer: string;
}

export interface NewsItem {
  date: string;
  title: string;
  category: "Project" | "Lab" | "Cert" | "Community";
  href?: string;
}
