import { CommandPalette, type PaletteProject } from "./CommandPalette";
import { MobileNav } from "./MobileNav";
import { NewsPanel } from "./NewsBell";

export function Overlays({ projects }: { projects: PaletteProject[] }) {
  return (
    <>
      <CommandPalette projects={projects} />
      <NewsPanel />
      <MobileNav />
    </>
  );
}
