import type { Ref } from "react";

export const BADGE_WIDTH = 264;
export const BADGE_HEIGHT = 390;
export const FRAME_BORDER = 16;
export const ART_WIDTH = BADGE_WIDTH - FRAME_BORDER * 2;
export const ART_HEIGHT = BADGE_HEIGHT - FRAME_BORDER * 2;
export const QR_SIZE = 132;
export const QR_CENTER_Y = 146;
export const CARD_PAPER = "#EAE9E5";
export const CARD_INK = "#1A1A1A";

const center = ART_WIDTH / 2;
const dots = Array.from({ length: 169 }, (_, i) => {
  const x = i % 13 - 6;
  const y = Math.floor(i / 13) - 6;
  return { x: center + x * 7, y: 112 + y * 7, radius: Math.max(.4, 2.8 - (Math.abs(x + y) + Math.abs(x - y) * .55) * .24) };
});

export function LanyardArtwork({ back = false, artRef }: { back?: boolean; artRef: Ref<SVGSVGElement> }) {
  const grainId = back ? "pass-back-grain" : "pass-front-grain";
  return (
    <svg
      ref={artRef}
      className="lanyard__art"
      xmlns="http://www.w3.org/2000/svg"
      width={ART_WIDTH}
      height={ART_HEIGHT}
      viewBox={`0 0 ${ART_WIDTH} ${ART_HEIGHT}`}
      aria-hidden="true"
      fill={CARD_INK}
      fontFamily="Arial, sans-serif"
    >
      <defs>
        <filter id={grainId} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="23" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <rect width={ART_WIDTH} height={ART_HEIGHT} fill={CARD_PAPER} />
      <rect width={ART_WIDTH} height={ART_HEIGHT} filter={`url(#${grainId})`} opacity=".055" />
      <g fill="none" stroke={CARD_INK} strokeOpacity=".35" strokeWidth="1">
        <path d="M14 39.5H218 M14 299.5H218" />
        <rect x=".5" y=".5" width={ART_WIDTH - 1} height={ART_HEIGHT - 1} opacity=".34" />
      </g>
      {back ? (
        <>
          <g fontFamily="Consolas, monospace" fontSize="8" letterSpacing=".55">
            <text x="14" y="25">INDEX :: /GIGS</text>
            <text x="218" y="25" textAnchor="end">EVENT PORTFOLIO</text>
          </g>
          <path
            d="M42 86V72H56 M176 72H190V86 M42 206V220H56 M176 220H190V206"
            fill="none"
            stroke={CARD_INK}
            strokeWidth="1"
          />
          <g textAnchor="middle" fontFamily="Consolas, monospace" letterSpacing=".34">
            <text x={center} y="241" fontSize="8.5">SCAN :: LIVE EVENTS &amp; CREW LOG</text>
            <text x={center} y="255" fontSize="8" opacity=".72">kihurn.vercel.app/gigs</text>
          </g>
          <text x="14" y="278" fontSize="9.3">
            <tspan x="14">Live event crewing, production operations,</tspan>
            <tspan x="14" dy="12">and high-concurrency ticketing infrastructure.</tspan>
          </text>
          <g transform="translate(30 326)" fill="none" stroke={CARD_INK} opacity=".55">
            <circle r="14" strokeWidth=".7" />
            <circle r="11" strokeWidth=".6" strokeDasharray="1.5 2" />
            <text y="3" fill={CARD_INK} stroke="none" textAnchor="middle" fontFamily="Consolas, monospace" fontSize="8">KH</text>
          </g>
          <text x="218" y="329" textAnchor="end" fontFamily="Consolas, monospace" fontSize="9" letterSpacing=".9">KH-GIG-001</text>
        </>
      ) : (
        <>
          <g fontFamily="Consolas, monospace" fontSize="8" letterSpacing=".4">
            <text x="14" y="25">KH :: PASS N°001</text>
            <rect x="138.5" y="13.5" width="79" height="17" fill="none" stroke={CARD_INK} strokeWidth="1" />
            <text x="178" y="25" textAnchor="middle">CREW / SYSTEMS</text>
          </g>
          <g>
            <path d="M67 63H165V161H67Z M67 112H165 M116 63V161" fill="none" stroke={CARD_INK} strokeWidth=".55" opacity=".19" />
            {dots.map((dot, i) => <circle key={i} cx={dot.x} cy={dot.y} r={dot.radius} />)}
          </g>
          <text x="14" y="190" fontSize="26" fontWeight="700" letterSpacing="-1.05">Wong Ki Hurn</text>
          <text x="14" y="209" fontSize="10.8">CS, Systems &amp; Event Production</text>
          <path d="M14 227.5H218 M116.5 228V288 M14 261.5H218 M14 288.5H218" fill="none" stroke={CARD_INK} strokeOpacity=".43" strokeWidth="1" />
          <g fontFamily="Consolas, monospace" fontSize="8.2" letterSpacing=".2">
            <text x="14" y="241">BASE ::</text>
            <text x="14" y="253">KL / SUBANG JAYA</text>
            <text x="126" y="241">VALID ::</text>
            <text x="126" y="253">2025—2026</text>
            <text x="14" y="278">CLEARANCE ::</text>
            <text x="126" y="278">FULL-STACK / NET</text>
          </g>
          <g>
            {Array.from({ length: 68 }, (_, i) => <rect key={i} x={14 + i * 3} y="310" width={1 + ((i * 17) % 29) % 2} height="24" />)}
          </g>
        </>
      )}
    </svg>
  );
}
