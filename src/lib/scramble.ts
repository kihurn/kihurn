export const DEFAULT_SCRAMBLE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/+#%&*:";

/**
 * Computes a deterministic single frame of a left-to-right text decode/scramble.
 * Characters up to the resolved threshold render their target glyph; whitespace
 * is always preserved so layout width stays stable.
 */
export function computeScrambledFrame(
  target: string,
  progress: number,
  tick: number,
  glyphs: string = DEFAULT_SCRAMBLE_GLYPHS,
): string {
  if (!target) return "";
  const clamped = Math.max(0, Math.min(1, progress));
  if (clamped >= 1) return target;

  const resolvedCount = Math.floor(clamped * target.length);
  const poolLen = glyphs.length || 1;
  let out = "";

  for (let i = 0; i < target.length; i++) {
    const ch = target[i];
    if (ch === " " || ch === "\u00a0" || ch === "·" || ch === "—") {
      out += ch;
      continue;
    }
    if (i < resolvedCount) {
      out += ch;
    } else {
      const idx = Math.abs((i * 17 + tick * 7 + ch.charCodeAt(0)) % poolLen);
      out += glyphs[idx];
    }
  }
  return out;
}
