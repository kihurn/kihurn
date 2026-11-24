import Link from "next/link";
import { BellIcon, SearchIcon } from "./icons";
import { StatusBar } from "./StatusBar";
import { ThemeSwitch } from "./ThemeSwitch";
import { Wordmark } from "./Wordmark";
import { NAV } from "./nav";

interface Props {
  chatOnline: boolean | null;
  building: string | null;
}

export function Header({ chatOnline, building }: Props) {
  return (
    <header className="header" data-header>
      <StatusBar chatOnline={chatOnline} building={building} />
      <div className="header__bar">
        <div className="header__lead">
          <Link className="header__logo" href="/" aria-label="KIHURN., home">
            <Wordmark />
          </Link>
        </div>
        <div className="header__center">
          <nav className="navpill" aria-label="Primary">
            <span className="navpill__pill" data-nav-pill aria-hidden="true" />
            <ul className="navpill__list">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link className="navpill__link text-nav" href={n.href}>
                    <span className="roll" data-roll aria-hidden="true">{n.label}</span>
                    <span className="u-sr-only">{n.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <button className="cmdk" type="button" data-cmd-open aria-label="Open command menu" aria-keyshortcuts="Control+K Meta+K">
            <span className="cmdk__label roll text-nav" aria-hidden="true">⌘K</span>
          </button>
        </div>
        <div className="header__right">
          <button className="notifbell" type="button" data-notif-open aria-label="What’s new" aria-haspopup="dialog" aria-expanded="false" aria-controls="notif">
            <span className="notifbell__icon" aria-hidden="true"><BellIcon /></span>
            <span className="notifbell__badge" data-notif-dot data-open="false" hidden aria-hidden="true">
              <span className="notifbell__dot" />
            </span>
          </button>
          <button className="navsearch" type="button" data-cmd-open aria-label="Search" aria-keyshortcuts="Control+K Meta+K">
            <SearchIcon />
          </button>
          <ThemeSwitch />
          <button className="navtrigger" type="button" data-drawer-open aria-label="Menu" aria-expanded="false" aria-controls="drawer">
            <span className="navtrigger__bars" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
