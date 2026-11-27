import { CommandPalette, type PaletteProject } from "./CommandPalette";
import { MobileNav } from "./MobileNav";
import { NewsPanel } from "./NewsBell";
import { Preloader } from "./Preloader";
import { PageTransitionWipe } from "./PageTransitionWipe";
import { WheelScroll } from "./WheelScroll";

export function Overlays({ projects }: { projects: PaletteProject[] }) {
  return (
    <>
      <Preloader />
      <PageTransitionWipe />
      <CommandPalette projects={projects} />
      <NewsPanel />
      <MobileNav />
      <WheelScroll />
      <div className="hud-toast text-mono-meta" role="status" aria-live="polite" data-hud-toast hidden />
    </>
  );
}
