
export const crewRoles = [
  "Internal usher",
  "External usher",
  "Registration",
  "Ticket collection",
  "Photographer",
  "Projectionist",
  "Runner",
] as const;

export interface GigEvent {
  slug: string;
  name: string;
  role: string;
  detail: string;
}

export const events: GigEvent[] = [
  {
    slug: "wnbf-malaysia-2025",
    name: "WNBF Malaysia 2025",
    role: "Event usher and crew",
    detail: "Two days, 14-hour shifts.",
  },
  {
    slug: "circus-funtasia",
    name: "Circus Funtasia",
    role: "Event Crew & Production",
    detail: "",
  },
  {
    slug: "orientation-party-2026",
    name: "Orientation Party 2026",
    role: "Ticketing platform developer",
    detail: "I built Elysium for attendee registration, ticket collection, and gate check-in.",
  },
  {
    slug: "law-ball-2025",
    name: "Taylor's Law Society Law Ball 2025",
    role: "Event volunteer",
    detail: "",
  },
];
