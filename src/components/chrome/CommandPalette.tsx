import { experiments } from "@/content/experiments";
import { site } from "@/content/site";
import { ArrowRightIcon, CopyIcon, MonitorIcon, MoonIcon, SearchIcon, SunIcon, TerminalIcon } from "./icons";
import { PALETTE_PAGES } from "./nav";

export interface PaletteProject {
  slug: string;
  name: string;
  caseStudy: boolean;
}

function Item({
  label,
  hint,
  value,
  href,
  action,
  icon,
}: {
  label: string;
  hint?: string;
  value: string;
  href?: string;
  action?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button className="cmd__item" type="button" data-cmd-item data-href={href} data-action={action} data-value={value}>
      <span className="cmd__icon" aria-hidden="true">
        {icon ?? <ArrowRightIcon />}
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
            <SearchIcon className="cmd__search-icon" />
            <input
              className="cmd__input"
              data-cmd-input
              name="q"
              type="text"
              placeholder="Jump to page, theme, or tool…"
              aria-label="Search commands"
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
                {PALETTE_PAGES.map((n) => (
                  <Item key={n.href} label={n.label} hint={n.href === "/gigs" ? "KHGigs :: /gigs" : n.href} href={n.href} value={`page ${n.label} ${n.href}${n.href === "/gigs" ? " KHGigs" : ""}`} />
                ))}
              </div>
              {projects.length > 0 ? (
                <div className="cmd__group" data-cmd-group>
                  <p className="cmd__heading text-label">Lab</p>
                  {projects.map((p) => (
                    <Item
                      key={p.slug}
                      label={p.name}
                      hint={p.caseStudy ? `/lab/${p.slug}` : `/lab#${p.slug}`}
                      href={p.caseStudy ? `/lab/${p.slug}` : `/lab#${p.slug}`}
                      value={`lab project ${p.name} ${p.slug}`}
                    />
                  ))}
                  {experiments.map((exp) => (
                    <Item
                      key={exp.slug}
                      label={`${exp.index} · ${exp.title}`}
                      hint={`/lab/${exp.slug}`}
                      href={`/lab/${exp.slug}`}
                      value={`lab experiment shader ${exp.title} ${exp.slug}`}
                    />
                  ))}
                </div>
              ) : null}
              <div className="cmd__group" data-cmd-group>
                <p className="cmd__heading text-label">Theme</p>
                <Item label="Theme: Light (Paper Stock)" hint="#D6D6D5" action="theme:light" value="theme light paper stock" icon={<SunIcon />} />
                <Item label="Theme: Dark (Charcoal Ink)" hint="#1E1E1E" action="theme:dark" value="theme dark charcoal ink" icon={<MoonIcon />} />
                <Item label="Theme: System" hint="AUTO" action="theme:system" value="theme system auto preference" icon={<MonitorIcon />} />
              </div>
              <div className="cmd__group" data-cmd-group>
                <p className="cmd__heading text-label">Tools</p>
                <Item label="Toggle telemetry HUD" hint="HUD::" action="telemetry:toggle" value="tool toggle telemetry hud overlay statusbar" icon={<TerminalIcon />} />
                <Item label="Copy email address" hint={site.email} action="copy:email" value={`tool copy email ${site.email}`} icon={<CopyIcon />} />
                <Item label="Copy current URL" hint="URL" action="copy:url" value="tool copy url link share" icon={<CopyIcon />} />
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
