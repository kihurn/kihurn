const FOLD_DURATION = 350;
const FLIGHT_DURATION = 550;

export async function launchLetter(sheet: HTMLFormElement, layer: HTMLDivElement, signal: AbortSignal) {
  const plane = layer.querySelector("svg");
  if (!plane || signal.aborted || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const rect = sheet.getBoundingClientRect();
  const planeWidth = plane.clientWidth;
  const planeHeight = plane.clientHeight;
  const x = rect.left + rect.width / 2;
  const y = Math.max(86, Math.min(innerHeight - 85, rect.bottom - 112));
  const shiftY = y - (rect.top + rect.height / 2);
  const endX = innerWidth + planeWidth;
  const endY = -planeHeight;
  const animation = sheet.animate([
    { clipPath: "polygon(0 0, 100% 0, 100% 50%, 100% 100%, 0 100%, 0 50%)", transform: "none", opacity: 1 },
    { clipPath: "polygon(0 19%, 100% 0, 96% 74%, 72% 95%, 26% 91%, 11% 55%)", transform: `translateY(${shiftY * .62}px) scale(.69,.57)`, opacity: 1, offset: .55 },
    { opacity: 1, offset: .82 },
    { clipPath: "polygon(0 40%, 100% 0, 76% 100%, 49% 69%, 32% 88%, 28% 60%)", transform: `translateY(${shiftY}px) scale(${planeWidth / rect.width},${planeHeight / rect.height})`, opacity: 0 },
  ], { duration: FOLD_DURATION, easing: "cubic-bezier(.3,.06,.25,1)", fill: "forwards" });

  const start = `translate(${x}px,${y}px)`;
  const assembly = plane.animate([{ transform: start, opacity: 0 }, { transform: start, opacity: 1 }],
    { delay: 245, duration: 105, easing: "ease-out", fill: "forwards" });
  const active = [animation, assembly];
  const cancel = () => active.forEach((motion) => motion.cancel());
  signal.addEventListener("abort", cancel, { once: true });

  const point = (t: number) => {
    const u = 1 - t;
    return {
      x: u ** 3 * x + 3 * u ** 2 * t * (x + 34) + 3 * u * t ** 2 * (x + (endX - x) * .62) + t ** 3 * endX,
      y: u ** 3 * y + 3 * u ** 2 * t * (y - 7) + 3 * u * t ** 2 * (y - (y - endY) * .24) + t ** 3 * endY,
    };
  };

  try {
    await animation.finished;
    const keyframes = Array.from({ length: 25 }, (_, index) => {
      const progress = (index / 24) ** 1.42;
      const position = point(progress);
      const next = point(progress + .001);
      const angle = Math.atan2(next.y - position.y, next.x - position.x) * 180 / Math.PI + 15;
      return { transform: `translate(${position.x}px,${position.y}px) rotate(${angle}deg)`, opacity: 1 };
    });
    const flight = plane.animate(keyframes, { duration: FLIGHT_DURATION, fill: "forwards" });
    active.push(flight);
    layer.querySelectorAll("i").forEach((dot, index) => {
      const time = .12 + index * .055;
      const position = point(time ** 1.42);
      const transform = `translate(${position.x - 20}px,${position.y + (index % 3 - 1) * 7 + 5}px)`;
      active.push(dot.animate([
        { transform, opacity: .65 },
        { transform, opacity: .46, offset: .36 },
        { transform: `${transform} scale(.72)`, opacity: 0 },
      ], { delay: time * FLIGHT_DURATION + 25, duration: 165, easing: "ease-out" }));
    });
    await flight.finished;
  } finally {
    signal.removeEventListener("abort", cancel);
  }
}
