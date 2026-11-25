import type { NewsItem } from "./types";

// Dates come from the original brief. Unknown dates are the literal text TODO.
// ISO "YYYY-MM-DD" is exact, "YYYY-MM" is month only.
export const news: NewsItem[] = [
  {
    date: "2026-11-24",
    title: "Print-shop HUD chrome, live telemetry bar, and 3-mode theme flip",
    category: "Lab",
    href: "/changelog",
  },
  {
    date: "2026-10",
    title: "Palo Alto Networks Firewall Essentials (EDU-210) training",
    category: "Cert",
    href: "/about",
  },
  {
    date: "2026-09",
    title: "Hosted and marketed ImagineHack 2026 (250+ participants)",
    category: "Community",
    href: "/gigs",
  },
  {
    date: "2026-08",
    title: "Launched Elysium registration & k6-tested check-in for 1,800 attendees",
    category: "Project",
    href: "/lab/elysium",
  },
];
