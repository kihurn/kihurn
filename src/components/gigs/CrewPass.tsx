"use client";

import { useState } from "react";
import { crewRoles } from "@/content/gigs";
import { site } from "@/content/site";
import { HalftoneImage } from "@/components/media/HalftoneImage";

export function CrewPass() {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      className="pass"
      data-flipped={flipped}
      aria-pressed={flipped}
      aria-label="Crew pass. Press to flip it and see the roles."
      onClick={() => setFlipped((f) => !f)}
    >
      <span className="pass__inner" data-pass-inner>
        <span className="pass__face pass__front" aria-hidden={flipped}>
          <span className="pass__hole" aria-hidden="true" />
          <HalftoneImage src="/placeholder/headshot.svg" alt="TODO: headshot" width={4} height={5} className="pass__photo" />
          <span className="pass__name text-display">{site.name}</span>
          <span className="pass__kind text-mono-meta">CREW · ALL ACCESS</span>
        </span>
        <span className="pass__face pass__back" data-pass-back aria-hidden={!flipped}>
          <span className="pass__k text-mono-meta">ROLES</span>
          <ul className="pass__roles">
            {crewRoles.map((r) => (
              <li key={r} className="text-body">
                {r}
              </li>
            ))}
          </ul>
          <span className="pass__hint text-meta">Press to flip back</span>
        </span>
      </span>
    </button>
  );
}
