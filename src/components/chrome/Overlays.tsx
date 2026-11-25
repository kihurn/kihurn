import { CommandPalette, type PaletteProject } from "./CommandPalette";
import { MobileNav } from "./MobileNav";
import { NewsPanel } from "./NewsBell";
import { Preloader } from "./Preloader";
import { RouteTransition } from "./RouteTransition";
import { ScrollDial } from "./ScrollDial";
import { ThemeParticles } from "./ThemeParticles";

export function Overlays({ projects }: { projects: PaletteProject[] }) {
  return (
    <>
      <Preloader />
      <RouteTransition />
      <ThemeParticles />
      <CommandPalette projects={projects} />
      <NewsPanel />
      <MobileNav />
      <ScrollDial />
      <div className="hud-toast text-mono-meta" role="status" aria-live="polite" data-hud-toast hidden />
    </>
  );
}
