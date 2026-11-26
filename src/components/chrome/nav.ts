export const NAV = [
  { href: "/about", label: "About" },
  { href: "/lab", label: "Lab" },
  { href: "/writing", label: "Writing" },
  { href: "/gigs", label: "Gigs" },
  { href: "/systems", label: "Systems" },
  { href: "/studio", label: "Studio" },
  { href: "/contact", label: "Contact" },
] as const;

export const PALETTE_PAGES = [
  { href: "/", label: "Home" },
  ...NAV,
  { href: "/changelog", label: "Changelog" },
] as const;
