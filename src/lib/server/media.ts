import "server-only";
import { statSync } from "node:fs";
import { join } from "node:path";

export function availableMedia(path: string | undefined): string | undefined {
  if (!path) return;
  if (statSync(join(process.cwd(), "public", path), { throwIfNoEntry: false })?.isFile()) return path;
}
