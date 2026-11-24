import { site } from "@/content/site";
import { ArrowRightIcon, SearchIcon, SunIcon } from "./icons";
import { NAV } from "./nav";

export interface PaletteProject {
  slug: string;
  name: string;
  caseStudy: boolean;
}

function Item({ label, hint, value, href, action }: { label: string; hint?: string; value: string; href?: string; action?: string }) {
  return (
    <button className="cmd__item" type="button" data-cmd-item data-href={href} data-action={action} data-value={value}>
      <span className="cmd__icon" aria-hidden="true">
        {action ? <SunIcon /> : <ArrowRightIcon />}
      </span>
      <span className="cmd__label">{label}</span>
      {hint ? <span className="cmd__hint text-mono-meta">{hint}</span> : null}
    </button>
  );
}

export function CommandPalette({ projects }: { projects: PaletteProject[] }) {
  return (
    <>
      <div className="overlay" data-overlay aria-hidden="true" />
      <div className="cmd" data-cmd aria-hidden="true">
        <div className="cmd__panel" role="dialog" aria-modal="true" aria-label="Command menu">
          <div className="cmd__search">
            <SearchIcon />
            <input
              className="cmd__input"
              data-cmd-input
              name="q"
              type="text"
              placeholder="Search anything"
              aria-label="Search"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <div className="cmd__body">
            <div className="cmd__fade" aria-hidden="true" />
            <div className="cmd__list" data-cmd-list>
              <div className="cmd__hl" data-cmd-hl hidden aria-hidden="true" />
              <div className="cmd__group" data-cmd-group>
                <p className="cmd__heading text-label">Pages</p>
                {NAV.map((n) => (
                  <Item key={n.href} label={n.label} hint={n.href} href={n.href} value={`page ${n.label} ${n.href}`} />
                ))}
              </div>
              {projects.length > 0 ? (
                <div className="cmd__group" data-cmd-group>
                  <p className="cmd__heading text-label">Lab</p>
                  {projects.map((p) => (
                    <Item
                      key={p.slug}
                      label={p.name}
                      href={p.caseStudy ? `/lab/${p.slug}` : `/lab#${p.slug}`}
                      value={`lab project ${p.name}`}
                    />
                  ))}
                </div>
              ) : null}
              <div className="cmd__group" data-cmd-group>
                <p className="cmd__heading text-label">Actions</p>
                <Item label="Email me" href={`mailto:${site.email}`} value="action email contact mail" />
                <Item label="Toggle theme" action="theme:toggle" value="action toggle theme light dark" />
              </div>
              <p className="cmd__empty text-body u-muted" data-cmd-empty hidden>No results.</p>
            </div>
            <div className="cmd__fade cmd__fade--bottom" aria-hidden="true" />
          </div>
          <div className="cmd__footer">
            <span className="cmd__fkey text-meta"><kbd>↑↓</kbd> Navigate</span>
            <span className="cmd__fkey text-meta"><kbd>↵</kbd> Select</span>
            <span className="cmd__fkey text-meta"><kbd>esc</kbd> Close</span>
          </div>
        </div>
      </div>
    </>
  );
}
