"use client";

type FpsListener = (fps: number) => void;
type ScrollListener = (progress: number, scrolling: boolean) => void;

const fpsListeners = new Set<FpsListener>();
let fpsRaf = 0;
let fpsFrames = 0;
let fpsLast = 0;
let currentFps = 60;

function tickFps(now: number) {
  fpsFrames++;
  if (!fpsLast) fpsLast = now;
  const dt = now - fpsLast;
  if (dt >= 500) {
    currentFps = Math.max(1, Math.min(240, Math.round((fpsFrames * 1000) / dt)));
    fpsFrames = 0;
    fpsLast = now;
    fpsListeners.forEach((fn) => fn(currentFps));
  }
  if (fpsListeners.size > 0) {
    fpsRaf = requestAnimationFrame(tickFps);
  } else {
    fpsRaf = 0;
  }
}

export function subscribeFps(fn: FpsListener): () => void {
  fpsListeners.add(fn);
  fn(currentFps);
  if (!fpsRaf && typeof requestAnimationFrame !== "undefined") {
    fpsFrames = 0;
    fpsLast = 0;
    fpsRaf = requestAnimationFrame(tickFps);
  }
  return () => {
    fpsListeners.delete(fn);
    if (fpsListeners.size === 0 && fpsRaf) {
      cancelAnimationFrame(fpsRaf);
      fpsRaf = 0;
    }
  };
}

const scrollListeners = new Set<ScrollListener>();
let scrollBound = false;
let scrollRaf = 0;
let scrollTimer = 0;
let currentProgress = 0;
let isScrolling = false;

function computeProgress(): number {
  const doc = document.documentElement;
  const max = Math.max(0, doc.scrollHeight - window.innerHeight);
  if (max <= 0) return 0;
  return Math.max(0, Math.min(1, window.scrollY / max));
}

function emitScroll() {
  scrollRaf = 0;
  currentProgress = computeProgress();
  scrollListeners.forEach((fn) => fn(currentProgress, isScrolling));
}

function onScrollEvent() {
  isScrolling = true;
  if (!scrollRaf) scrollRaf = requestAnimationFrame(emitScroll);
  window.clearTimeout(scrollTimer);
  scrollTimer = window.setTimeout(() => {
    isScrolling = false;
    currentProgress = computeProgress();
    scrollListeners.forEach((fn) => fn(currentProgress, false));
  }, 900);
}

function onResizeEvent() {
  if (!scrollRaf) scrollRaf = requestAnimationFrame(emitScroll);
}

export function subscribeScroll(fn: ScrollListener): () => void {
  scrollListeners.add(fn);
  if (typeof window !== "undefined") {
    if (!scrollBound) {
      scrollBound = true;
      window.addEventListener("scroll", onScrollEvent, { passive: true });
      window.addEventListener("resize", onResizeEvent, { passive: true });
    }
    currentProgress = computeProgress();
    fn(currentProgress, isScrolling);
  }
  return () => {
    scrollListeners.delete(fn);
    if (scrollListeners.size === 0 && scrollBound && typeof window !== "undefined") {
      scrollBound = false;
      window.removeEventListener("scroll", onScrollEvent);
      window.removeEventListener("resize", onResizeEvent);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      scrollRaf = 0;
      window.clearTimeout(scrollTimer);
    }
  };
}
