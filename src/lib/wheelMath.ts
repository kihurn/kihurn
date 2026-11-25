export function wrapIndex(v: number, n: number): number {
  if (n <= 0) return 0;
  return ((v % n) + n) % n;
}

export function wrapHalfOffset(v: number, n: number): number {
  if (n <= 0) return 0;
  return wrapIndex(v + n / 2, n) - n / 2;
}

export function snapWheelTarget(currentTarget: number, deltaSteps: number): number {
  return Math.round(currentTarget + deltaSteps);
}

export function wheelStepDirection(pos: number, targetIndex: number, count: number): number {
  const off = wrapHalfOffset(targetIndex - pos, count);
  return Math.round(pos) + Math.round(off);
}
