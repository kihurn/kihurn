import { wrapHalfOffset, wrapIndex } from "@/lib/wheelMath";

export function bindLabWheel(shelf: HTMLElement, track: HTMLDivElement, initial: number, select: (slug: string) => void) {
  const rows = Array.from(track.querySelectorAll<HTMLElement>("[data-spine]"));
  const count = rows.length;
  const looping = count >= 5;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const limit = (value: number) => looping ? value : Math.max(0, Math.min(count - 1, value));
  let position = initial;
  let target = initial;
  let selected = initial;
  let frame = 0;
  let settle = 0;
  let lastFrame = 0;
  let stepSize = 76;
  let drag: { id: number; startY: number; startAt: number; time: number; y: number; velocity: number; moved: boolean } | null = null;
  let suppressClick = false;
  let frozen = false;

  function render() {
    const index = wrapIndex(Math.round(position), count);
    if (selected !== index) {
      selected = index;
      select(rows[index].dataset.spine!);
    }
    rows.forEach((row, index) => {
      const offset = looping ? wrapHalfOffset(index - position, count) : index - position;
      const distance = Math.abs(offset);
      const angle = Math.max(-1.1, Math.min(1.1, offset * .2));
      const taper = Math.max(.74, 1 - distance * .045);
      const fade = Math.max(0, 1 - distance / 5.6);
      const seam = looping ? Math.min(1, (count / 2 - distance) * 2) : 1;
      row.style.transform = `translate3d(${(Math.cos(angle) - 1) * stepSize * 4}px, ${offset * stepSize}px, 0) rotate(${angle * 42}deg) scale(${taper})`;
      row.style.opacity = String(fade * seam);
      row.style.visibility = fade * seam > .025 ? "visible" : "hidden";
    });
  }

  function tick(time: number) {
    frame = 0;
    const elapsed = lastFrame ? Math.min(time - lastFrame, 32) : 16;
    lastFrame = time;
    if (Math.abs(target - position) < .003) {
      position = target;
      lastFrame = 0;
      render();
      return;
    }
    position += (target - position) * (1 - Math.exp(-elapsed / 67));
    render();
    frame = requestAnimationFrame(tick);
  }

  function stop() {
    window.clearTimeout(settle);
    cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = 0;
    target = position;
  }

  function move(value: number) {
    target = limit(value);
    if (reduced.matches) {
      position = target = Math.round(target);
      render();
    } else if (!frame) frame = requestAnimationFrame(tick);
  }

  function measure() {
    stepSize = parseFloat(getComputedStyle(track).getPropertyValue("--shelf-row-step")) || 76;
    render();
  }

  function onWheel(event: WheelEvent) {
    if (event.ctrlKey || (event.target as Element).closest("dialog")) return;
    event.preventDefault();
    if (drag || frozen) return;
    window.clearTimeout(settle);
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const pixels = delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stepSize : 1);
    if (reduced.matches) {
      move(Math.round(target) + Math.sign(pixels));
      return;
    }
    move(target + Math.max(-3, Math.min(3, pixels / stepSize)));
    settle = window.setTimeout(() => move(Math.round(target)), 105);
  }

  const down = (event: PointerEvent) => {
    if (event.button !== 0 || drag) return;
    suppressClick = false;
    stop();
    drag = { id: event.pointerId, startY: event.clientY, startAt: position, time: event.timeStamp, y: event.clientY, velocity: 0, moved: false };
  };
  const pointerMove = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return;
    const offset = drag.startY - event.clientY;
    if (!drag.moved && Math.abs(offset) < 5) return;
    if (!drag.moved) {
      drag.moved = true;
      track.parentElement?.setPointerCapture(event.pointerId);
      track.dataset.dragging = "true";
    }
    const elapsed = Math.max(8, event.timeStamp - drag.time);
    drag.velocity = drag.velocity * .4 + (drag.y - event.clientY) / elapsed * .6;
    drag.time = event.timeStamp;
    drag.y = event.clientY;
    position = target = limit(drag.startAt + offset / stepSize);
    render();
  };
  const release = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return;
    const velocity = event.type === "pointerup" && event.timeStamp - drag.time < 90 && !reduced.matches ? drag.velocity : 0;
    suppressClick = drag.moved;
    drag = null;
    delete track.dataset.dragging;
    const coast = Math.max(-3, Math.min(3, velocity * 125 / stepSize));
    move(Math.round(position + coast));
  };
  const leave = (event: PointerEvent) => { if (!drag?.moved) release(event); };
  const click = (event: MouseEvent) => {
    if (!suppressClick || event.detail === 0) return;
    suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const controls = new AbortController();
  const signal = controls.signal;
  const wheelWindow = track.parentElement!;
  shelf.addEventListener("wheel", onWheel, { passive: false, signal });
  wheelWindow.addEventListener("pointerdown", down, { signal });
  wheelWindow.addEventListener("pointermove", pointerMove, { signal });
  wheelWindow.addEventListener("pointerup", release, { signal });
  wheelWindow.addEventListener("pointercancel", release, { signal });
  wheelWindow.addEventListener("pointerleave", leave, { signal });
  wheelWindow.addEventListener("click", click, { capture: true, signal });
  const resize = new ResizeObserver(measure);
  resize.observe(track);
  measure();

  return {
    freeze() { frozen = true; },
    step(delta: number) {
      window.clearTimeout(settle);
      move(Math.round(target) + delta);
    },
    goTo(index: number) {
      window.clearTimeout(settle);
      move(looping ? Math.round(position + wrapHalfOffset(index - position, count)) : index);
    },
    dispose() {
      stop();
      controls.abort();
      resize.disconnect();
      delete track.dataset.dragging;
    },
  };
}
