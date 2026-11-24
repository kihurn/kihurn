import type { NewsItem } from "./types";

// Dates come from the original brief. Unknown dates are the literal text TODO.
// ISO "YYYY-MM-DD" is exact, "YYYY-MM" is month only.
export const news: NewsItem[] = [
  { date: "2026-10", title: "Palo Alto Networks Firewall Essentials (EDU-210) training", category: "Cert" },
  { date: "TODO", title: "Hosted and marketed ImagineHack 2026 (250+ participants)", category: "Community" },
];
