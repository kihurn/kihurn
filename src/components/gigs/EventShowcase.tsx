"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import type { GigEvent } from "@/content/gigs";
import { OptionalPhoto } from "@/components/media/OptionalPhoto";

type Slide = GigEvent & { photo?: string };

export function EventShowcase({ slides }: { slides: Slide[] }) {
  const stack = useRef<HTMLButtonElement>(null);
  const animation = useRef<Animation>(null);
  const gesture = useRef<{ id: number; x: number; y: number; card: HTMLElement; started: boolean }>(null);
  const ignoreClick = useRef(false);
  const [index, setIndex] = useState(0);
  const active = slides[index];
  if (!active) return null;

  function cycle(direction: -1 | 1, dragOffset = 0) {
    if (slides.length < 2) return;
    animation.current?.cancel();
    const depth = direction === 1 ? 0 : slides.length - 1;
    const moving = stack.current?.querySelector<HTMLElement>(`[data-stack-position="${depth}"]`);
    if (moving && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const current = getComputedStyle(moving).transform;
      const slideOut = `translateX(${direction === 1 ? (dragOffset > 0 ? 54 : -54) : 54}%) rotate(${direction === 1 && dragOffset <= 0 ? -10 : 10}deg)`;
      animation.current = moving.animate([
        { transform: current, translate: `${dragOffset}px`, zIndex: direction === 1 ? 12 : 0 },
        { transform: slideOut, translate: "0px", zIndex: direction === 1 ? 12 : 0, offset: .45 },
        { transform: slideOut, translate: "0px", zIndex: direction === 1 ? 0 : 12, offset: .48 },
        { transform: "var(--polaroid-pose)", translate: "0px", zIndex: direction === 1 ? 0 : 12 },
      ], { duration: 390, easing: "ease-in-out" });
    }
    setIndex((current) => (current + direction + slides.length) % slides.length);
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>) {
    ignoreClick.current = false;
    if (!event.isPrimary || event.button !== 0) return;
    const card = event.currentTarget.querySelector<HTMLElement>('[data-stack-position="0"]');
    if (card) gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, card, started: false };
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const drag = gesture.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    if (!drag.started) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(event.clientY - drag.y)) return;
      drag.started = true;
      animation.current?.cancel();
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      drag.card.style.translate = `${Math.max(-100, Math.min(100, dx))}px`;
    }
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>) {
    const drag = gesture.current;
    if (!drag || drag.id !== event.pointerId) return;
    gesture.current = null;
    drag.card.style.removeProperty("translate");
    if (!drag.started) return;
    ignoreClick.current = true;
    const dx = event.clientX - drag.x;
    const offset = Math.max(-100, Math.min(100, dx));
    if (event.type === "pointerup" && Math.abs(dx) > 38) cycle(dx < 0 ? 1 : -1, dx < 0 ? offset : 0);
  }

  return (
    <section className="page__sec gig-showcase" id="events" aria-labelledby="events-h">
      <div className="gig-showcase__head">
        <h2 id="events-h" className="text-h2">Event showcase</h2>
        <div className="gig-showcase__controls">
          <button type="button" aria-label="Previous event" aria-controls="event-photos" onClick={() => cycle(-1)}>
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <span className="text-mono-meta" aria-live="polite">{index + 1} / {slides.length}</span>
          <button type="button" aria-label="Next event" aria-controls="event-photos" onClick={() => cycle(1)}>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
      <button
        id="event-photos"
        ref={stack}
        type="button"
        className="events"
        aria-label={`Next photo. Showing ${active.name}`}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerLeave={(event) => { if (!gesture.current?.started) endDrag(event); }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onClick={(event) => {
          if (!ignoreClick.current || event.detail === 0) cycle(1);
          ignoreClick.current = false;
        }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          cycle(event.key === "ArrowLeft" ? -1 : 1);
        }}
      >
        {slides.map((slide, position) => (
          <span key={slide.slug} className="event" data-event data-stack-position={(position - index + slides.length) % slides.length} aria-hidden="true">
            <OptionalPhoto className="event__photo" src={slide.photo} width={960} height={600} alt="">
              <Image className="event__photo" src="/placeholder/event.svg" width={960} height={600} alt="" unoptimized />
            </OptionalPhoto>
            <span className="event__caption">{slide.name}</span>
          </span>
        ))}
      </button>
      <p className="gig-showcase__credit text-body" aria-live="polite">
        <strong>{active.role}</strong>{active.detail && <> · {active.detail}</>}
      </p>
    </section>
  );
}
