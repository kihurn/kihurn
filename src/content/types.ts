export type Lens = "networking" | "fullstack" | "ai" | "security";
export type Status = "building" | "paused" | "done" | "internal";

export interface Project {
  slug: string;
  name: string;
  summary: string;
  repo?: string;
  live?: string;
  status: Status;
  lenses: Lens[];
  stack: string[];
  myPart: string;
  teamPart?: string;
  uses: string[];
  ecosystem: boolean;
  showOnHome: boolean;
  featured: boolean;
  caseStudy: boolean;
  finishedOn?: string;
  tags?: string[];
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
