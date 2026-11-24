import Link from "next/link";
import { site } from "@/content/site";
import { NAV } from "./nav";

export function Footer() {
  return (
    <footer className="footer">
      <nav className="footer__nav text-meta" aria-label="Footer">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href}>{n.label}</Link>
        ))}
      </nav>
      <ul className="footer__links text-meta">
        <li><a href={site.github} target="_blank" rel="noopener noreferrer">GitHub</a></li>
        <li><a href={site.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
        <li><a href={`mailto:${site.email}`}>{site.email}</a></li>
      </ul>
      <p className="footer__updated text-meta">Last updated {site.updated}</p>
    </footer>
  );
}
