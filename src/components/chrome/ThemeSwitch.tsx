import { MoonIcon, SunIcon } from "./icons";

export function ThemeSwitch() {
  return (
    <div className="themetoggle" role="group" aria-label="Theme" data-theme-toggle>
      <button className="themetoggle__seg" type="button" data-theme-set="light" aria-label="Light theme" aria-pressed="false">
        <span className="themetoggle__bg" data-theme-bg aria-hidden="true" />
        <SunIcon className="themetoggle__icon" />
      </button>
      <button className="themetoggle__seg" type="button" data-theme-set="dark" aria-label="Dark theme" aria-pressed="true">
        <MoonIcon className="themetoggle__icon" />
      </button>
    </div>
  );
}
