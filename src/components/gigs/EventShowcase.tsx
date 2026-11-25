"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import type { GigEvent } from "@/content/gigs";
import { OptionalPhoto } from "@/components/media/OptionalPhoto";

type Slide = GigEvent & { photo?: string };

export function EventShowcase({ slides }: { slides: Slide[] }) {
  const track = useRef<HTMLUListElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ pointer: number; x: number; left: number; moved: boolean }>(null);
  const suppressClick = useRef(false);
  const [index, setIndex] = useState(0);
  const [event, setEvent] = useState<Slide>();

  function closestSlide(list: HTMLUListElement) {
    const first = list.firstElementChild as HTMLElement;
    let nearest = 0;
    let distance = Infinity;
    Array.from(list.children).forEach((child, i) => {
      const offset = Math.abs((child as HTMLElement).offsetLeft - first.offsetLeft - list.scrollLeft);
      if (offset < distance) {
        nearest = i;
        distance = offset;
      }
    });
    return nearest;
  }

  function goTo(next: number) {
    const list = track.current;
    if (!list) return;
    const first = list.firstElementChild as HTMLElement;
    const card = list.children[Math.max(0, Math.min(slides.length - 1, next))] as HTMLElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({ left: card.offsetLeft - first.offsetLeft, behavior: reduced ? "instant" : "smooth" });
  }

  function startDrag(event: PointerEvent<HTMLUListElement>) {
    suppressClick.current = false;
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    drag.current = { pointer: event.pointerId, x: event.clientX, left: event.currentTarget.scrollLeft, moved: false };
  }

  function moveDrag(event: PointerEvent<HTMLUListElement>) {
    const gesture = drag.current;
    if (!gesture || event.pointerId !== gesture.pointer || !event.buttons) return;
    const distance = event.clientX - gesture.x;
    if (!gesture.moved && Math.abs(distance) < 6) return;
    const list = event.currentTarget;
    if (!gesture.moved) {
      gesture.moved = true;
      list.dataset.dragging = "";
      list.setPointerCapture(event.pointerId);
    }
    list.scrollLeft = gesture.left - distance;
  }

  function endDrag(event: PointerEvent<HTMLUListElement>) {
    const gesture = drag.current;
    if (!gesture || event.pointerId !== gesture.pointer) return;
    drag.current = null;
    if (!gesture.moved) return;
    const list = event.currentTarget;
    const nearest = closestSlide(list);
    suppressClick.current = true;
    delete list.dataset.dragging;
    goTo(nearest);
  }

  return (
    <section className="page__sec gig-showcase" id="events" aria-labelledby="events-h">
      <div className="gig-showcase__head">
        <h2 id="events-h" className="text-h2">Event showcase</h2>
        <div className="gig-showcase__controls">
          <button type="button" aria-label="Previous event" aria-controls="event-slides" disabled={index === 0} onClick={() => goTo(closestSlide(track.current!) - 1)}>
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <span className="text-mono-meta" aria-live="polite">{index + 1} / {slides.length}</span>
          <button type="button" aria-label="Next event" aria-controls="event-slides" disabled={index === slides.length - 1} onClick={() => goTo(closestSlide(track.current!) + 1)}>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
      <ul
        id="event-slides"
        ref={track}
        className="events"
        onScroll={(event) => setIndex(closestSlide(event.currentTarget))}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerLeave={(event) => { if (!drag.current?.moved) endDrag(event); }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onClickCapture={(event) => {
          if (suppressClick.current && event.detail > 0) event.stopPropagation();
          suppressClick.current = false;
        }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          goTo(closestSlide(event.currentTarget) + (event.key === "ArrowLeft" ? -1 : 1));
        }}
      >
        {slides.map((slide) => (
          <li key={slide.slug} className="event" data-event>
            <button
              type="button"
              className="event__card"
              aria-haspopup="dialog"
              onClick={(click) => {
                opener.current = click.currentTarget;
                setEvent(slide);
                dialog.current?.showModal();
              }}
            >
              <OptionalPhoto className="event__photo" src={slide.photo} width={960} height={600} alt="">
                <Image className="event__photo" src="/placeholder/event.svg" width={960} height={600} alt="" unoptimized />
              </OptionalPhoto>
              <span className="event__caption">
                <span className="text-h5">{slide.name}</span>
                <ArrowUpRight size={22} aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <dialog ref={dialog} className="event-details" aria-labelledby="event-details-title" onClose={() => opener.current?.focus({ preventScroll: true })}>
        <button type="button" className="event-details__close" aria-label="Close" onClick={() => dialog.current?.close()}>
          <X size={20} aria-hidden="true" />
        </button>
        <h3 className="text-h3" id="event-details-title">{event?.name}</h3>
        <p className="text-h6">{event?.role}</p>
        {event?.detail && <p className="text-body">{event.detail}</p>}
      </dialog>
    </section>
  );
}
