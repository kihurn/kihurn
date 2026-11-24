import Link from "next/link";
import { site } from "@/content/site";
import { NAV } from "./nav";

export function MobileNav() {
  return (
    <div className="drawer" id="drawer" data-drawer aria-hidden="true">
      <div className="drawer__sheet" data-drawer-sheet role="dialog" aria-modal="true" aria-label="Menu">
        <span className="drawer__handle" aria-hidden="true" />
        <nav className="drawer__nav" aria-label="Mobile">
          {NAV.map((n) => (
            <Link key={n.href} className="drawer__link" href={n.href} data-drawer-link>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="drawer__meta">
          <ul className="socials footer__links">
            <li><a href={site.github} target="_blank" rel="noopener noreferrer">GitHub</a></li>
            <li><a href={site.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            <li><a href={`mailto:${site.email}`}>Email</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
