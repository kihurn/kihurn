export function isMouseWheel(event: WheelEvent, delta: number) {
  if (event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL) return true;
  const legacyDelta = (event as WheelEvent & { wheelDelta?: number }).wheelDelta;
  if (legacyDelta) return Number.isInteger(delta) && Math.abs(delta) >= 40 && legacyDelta % 120 === 0;
  return delta !== 0 && delta % 100 === 0;
}
