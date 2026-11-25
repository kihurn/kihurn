import Link from "next/link";
import { HalftonePortrait } from "@/components/chrome/HalftonePortrait";

// Deterministic 24x7 commit heat matrix (no random SSR mismatch)
const HEAT_CELLS = Array.from({ length: 168 }, (_, i) => {
  const v = ((i * 37 + 13) % 19) / 18;
  const heat = v > 0.78 ? 0.88 : v > 0.52 ? 0.52 : v > 0.28 ? 0.26 : 0.08;
  return { id: i, heat: heat.toFixed(2), delay: ((i % 24) * 0.018).toFixed(3) };
});

export function AboutBoard() {
  return (
    <div className="ov3" data-canvas>
      <h2 className="u-sr-only">The board</h2>
      <header className="ov3__ticket">
        <span className="ov3__ticket-name text-label">The Front Office</span>
        <span className="ov3__ticket-kv text-mono-meta" aria-label="File status">
          <span><span className="k">JOB::</span><b>N°00</b></span>
          <span><span className="k">EST::</span><span className="v">2005</span></span>
          <span><span className="k">STATUS::</span><b>OPEN</b></span>
        </span>
      </header>

      <div className="ov3__board">
        {/* Centerpiece Postcard & Postage Stamp */}
        <section
          className="ov3__item ov3__hero"
          data-canvas-item
          data-rot="0"
          tabIndex={0}
          style={{ "--fx": "0", "--fy": "0.02" } as React.CSSProperties}
          data-frank-stage
          aria-label="Wong Ki Hurn"
        >
          <div className="ov3__hero-gl" data-frank-gl aria-hidden="true" />
          <div className="ov3__hero-layer" data-frank-layer>
            <article className="ov3__env u-card" data-frank-card data-hit data-marks-surface>
              <span className="ov3__field" data-marks aria-hidden="true">
                {/* Custom geometric archival stamps */}
                <svg className="mark" style={{ width: 76, height: 76, top: "14%", left: "14%", opacity: 0.14, transform: "rotate(-12deg)" }} viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" />
                  <circle cx="40" cy="40" r="24" stroke="currentColor" strokeWidth="1" />
                  <text x="40" y="38" textAnchor="middle" fill="currentColor" className="mark__t" fontSize="8">MY·47500</text>
                  <text x="40" y="49" textAnchor="middle" fill="currentColor" className="mark__t" fontSize="7">SYS·ENG</text>
                </svg>
                <svg className="mark" style={{ width: 92, height: 48, top: "48%", left: "42%", opacity: 0.13, transform: "rotate(7deg)" }} viewBox="0 0 110 54" fill="none">
                  <rect x="2" y="2" width="106" height="50" rx="4" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="2" y1="18" x2="108" y2="18" stroke="currentColor" strokeWidth="1" />
                  <text x="55" y="13" textAnchor="middle" fill="currentColor" className="mark__t" fontSize="8">TAYLOR&apos;S · CS</text>
                  <text x="55" y="38" textAnchor="middle" fill="currentColor" className="mark__t" fontSize="10">FILED::2026</text>
                </svg>
              </span>

              <span className="ov3__imprints" data-marks-avoid>
                <button
                  className="ov3__imprint"
                  type="button"
                  data-dialog-open="record"
                  aria-label="The record: work and study"
                  aria-haspopup="dialog"
                  aria-expanded="false"
                  title="The record"
                >
                  <svg width="1em" height="1em" aria-hidden="true" data-icon="suitcase-work">
                    <symbol id="ai:local:suitcase-work" viewBox="0 0 24 24">
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M21.25 18.25v-9.5a2 2 0 0 0-2-2H4.75a2 2 0 0 0-2 2v9.5a2 2 0 0 0 2 2h14.5a2 2 0 0 0 2-2ZM7.75 6.75v-2a2 2 0 0 1 2-2h4.5a2 2 0 0 1 2 2v2"
                      />
                    </symbol>
                    <use href="#ai:local:suitcase-work" />
                  </svg>
                </button>
                <button
                  className="ov3__imprint"
                  type="button"
                  data-dialog-open="onfile"
                  aria-label="On file: training and community"
                  aria-haspopup="dialog"
                  aria-expanded="false"
                  title="On file"
                >
                  <svg width="1em" height="1em" aria-hidden="true" data-icon="trophy">
                    <symbol id="ai:local:trophy" viewBox="0 0 24 24">
                      <g fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5">
                        <path d="M12 18v-3m6.25-10.25h1a2 2 0 0 1 2 2v.5a3 3 0 0 1-3 3" />
                        <path d="M5.75 4.75a2 2 0 0 1 2-2h8.5a2 2 0 0 1 2 2v4.5a6 6 0 0 1-6 6h-.5a6 6 0 0 1-6-6zm1 14.5a1.5 1.5 0 0 1 1.5-1.5h7.5a1.5 1.5 0 0 1 1.5 1.5v.5a1.5 1.5 0 0 1-1.5 1.5h-7.5a1.5 1.5 0 0 1-1.5-1.5zm-1-14.5h-1a2 2 0 0 0-2 2v.5a3 3 0 0 0 3 3" />
                      </g>
                    </symbol>
                    <use href="#ai:local:trophy" />
                  </svg>
                </button>
              </span>

              <div
                className="frank"
                style={{ "--sw": "208px", "--sh": "260px", "--cut": "url(#stamp-cut-kh)" } as React.CSSProperties}
              >
                <svg className="frank__defs" aria-hidden="true" focusable="false">
                  <defs>
                    <clipPath id="stamp-cut-kh">
                      <path d="M0 0 L3.84 0 A4.52 4.52 0 0 0 12.89 0 L14.47 0 A4.52 4.52 0 0 0 23.51 0 L25.10 0 A4.52 4.52 0 0 0 34.14 0 L35.72 0 A4.52 4.52 0 0 0 44.77 0 L46.35 0 A4.52 4.52 0 0 0 55.39 0 L56.97 0 A4.52 4.52 0 0 0 66.02 0 L67.60 0 A4.52 4.52 0 0 0 76.64 0 L78.23 0 A4.52 4.52 0 0 0 87.27 0 L88.85 0 A4.52 4.52 0 0 0 97.90 0 L99.48 0 A4.52 4.52 0 0 0 108.52 0 L110.10 0 A4.52 4.52 0 0 0 119.15 0 L120.73 0 A4.52 4.52 0 0 0 129.77 0 L131.36 0 A4.52 4.52 0 0 0 140.40 0 L141.98 0 A4.52 4.52 0 0 0 151.03 0 L152.61 0 A4.52 4.52 0 0 0 161.65 0 L163.23 0 A4.52 4.52 0 0 0 172.28 0 L173.86 0 A4.52 4.52 0 0 0 182.90 0 L184.49 0 A4.52 4.52 0 0 0 193.53 0 L195.11 0 A4.52 4.52 0 0 0 204.16 0 L208 0 L208 3.28 A4.52 4.52 0 0 0 208 12.32 L208 13.90 A4.52 4.52 0 0 0 208 22.95 L208 24.53 A4.52 4.52 0 0 0 208 33.57 L208 35.16 A4.52 4.52 0 0 0 208 44.20 L208 45.78 A4.52 4.52 0 0 0 208 54.83 L208 56.41 A4.52 4.52 0 0 0 208 65.45 L208 67.03 A4.52 4.52 0 0 0 208 76.08 L208 77.66 A4.52 4.52 0 0 0 208 86.70 L208 88.29 A4.52 4.52 0 0 0 208 97.33 L208 98.91 A4.52 4.52 0 0 0 208 107.96 L208 109.54 A4.52 4.52 0 0 0 208 118.58 L208 120.17 A4.52 4.52 0 0 0 208 129.21 L208 130.79 A4.52 4.52 0 0 0 208 139.83 L208 141.42 A4.52 4.52 0 0 0 208 150.46 L208 152.04 A4.52 4.52 0 0 0 208 161.09 L208 162.67 A4.52 4.52 0 0 0 208 171.71 L208 173.30 A4.52 4.52 0 0 0 208 182.34 L208 183.92 A4.52 4.52 0 0 0 208 192.97 L208 194.55 A4.52 4.52 0 0 0 208 203.59 L208 205.17 A4.52 4.52 0 0 0 208 214.22 L208 215.80 A4.52 4.52 0 0 0 208 224.84 L208 226.43 A4.52 4.52 0 0 0 208 235.47 L208 237.05 A4.52 4.52 0 0 0 208 246.10 L208 247.68 A4.52 4.52 0 0 0 208 256.72 L208 260 L204.16 260 A4.52 4.52 0 0 0 195.11 260 L193.53 260 A4.52 4.52 0 0 0 184.49 260 L182.90 260 A4.52 4.52 0 0 0 173.86 260 L172.28 260 A4.52 4.52 0 0 0 163.23 260 L161.65 260 A4.52 4.52 0 0 0 152.61 260 L151.03 260 A4.52 4.52 0 0 0 141.98 260 L140.40 260 A4.52 4.52 0 0 0 131.36 260 L129.77 260 A4.52 4.52 0 0 0 120.73 260 L119.15 260 A4.52 4.52 0 0 0 110.10 260 L108.52 260 A4.52 4.52 0 0 0 99.48 260 L97.90 260 A4.52 4.52 0 0 0 88.85 260 L87.27 260 A4.52 4.52 0 0 0 78.23 260 L76.64 260 A4.52 4.52 0 0 0 67.60 260 L66.02 260 A4.52 4.52 0 0 0 56.97 260 L55.39 260 A4.52 4.52 0 0 0 46.35 260 L44.77 260 A4.52 4.52 0 0 0 35.72 260 L34.14 260 A4.52 4.52 0 0 0 25.10 260 L23.51 260 A4.52 4.52 0 0 0 14.47 260 L12.89 260 A4.52 4.52 0 0 0 3.84 260 L0 260 L0 256.72 A4.52 4.52 0 0 0 0 247.68 L0 246.10 A4.52 4.52 0 0 0 0 237.05 L0 235.47 A4.52 4.52 0 0 0 0 226.43 L0 224.84 A4.52 4.52 0 0 0 0 215.80 L0 214.22 A4.52 4.52 0 0 0 0 205.17 L0 203.59 A4.52 4.52 0 0 0 0 194.55 L0 192.97 A4.52 4.52 0 0 0 0 183.92 L0 182.34 A4.52 4.52 0 0 0 0 173.30 L0 171.71 A4.52 4.52 0 0 0 0 162.67 L0 161.09 A4.52 4.52 0 0 0 0 152.04 L0 150.46 A4.52 4.52 0 0 0 0 141.42 L0 139.83 A4.52 4.52 0 0 0 0 130.79 L0 129.21 A4.52 4.52 0 0 0 0 120.17 L0 118.58 A4.52 4.52 0 0 0 0 109.54 L0 107.96 A4.52 4.52 0 0 0 0 98.91 L0 97.33 A4.52 4.52 0 0 0 0 88.29 L0 86.70 A4.52 4.52 0 0 0 0 77.66 L0 76.08 A4.52 4.52 0 0 0 0 67.03 L0 65.45 A4.52 4.52 0 0 0 0 56.41 L0 54.83 A4.52 4.52 0 0 0 0 45.78 L0 44.20 A4.52 4.52 0 0 0 0 35.16 L0 33.57 A4.52 4.52 0 0 0 0 24.53 L0 22.95 A4.52 4.52 0 0 0 0 13.90 L0 12.32 A4.52 4.52 0 0 0 0 3.28 L0 0 Z" />
                    </clipPath>
                    <filter id="stamp-print-kh" colorInterpolationFilters="sRGB">
                      <feColorMatrix
                        type="matrix"
                        values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0"
                      />
                      <feComponentTransfer>
                        <feFuncR type="discrete" tableValues=".00 .11 .22 .33 .44 .56 .67 .78 .89 1" />
                        <feFuncG type="discrete" tableValues=".00 .11 .22 .33 .44 .56 .67 .78 .89 1" />
                        <feFuncB type="discrete" tableValues=".00 .11 .22 .33 .44 .56 .67 .78 .89 1" />
                      </feComponentTransfer>
                    </filter>
                    <filter id="pm-ink-kh" x="-8%" y="-8%" width="116%" height="116%">
                      <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="41" result="r" />
                      <feDisplacementMap in="SourceGraphic" in2="r" scale="1.2" result="d" />
                      <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed="48" result="m" />
                      <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 3 -0.9" result="mm" />
                      <feComposite in="d" in2="mm" operator="in" />
                    </filter>
                  </defs>
                </svg>
                <div className="frank__stamp" data-tilt style={{ "--print": "url(#stamp-print-kh)" } as React.CSSProperties}>
                  <div className="frank__photo u-no-drag">
                    <HalftonePortrait variant="stamp" />
                  </div>
                  <span className="frank__cap">
                    Wong Ki Hurn
                    <svg className="frank__waves" viewBox="0 0 26 10" fill="none" aria-hidden="true" focusable="false">
                      <path d="M1 2c3-1.6 5-1.6 8 0s5 1.6 8 0 5-1.6 8 0" />
                      <path d="M1 5c3-1.6 5-1.6 8 0s5 1.6 8 0 5-1.6 8 0" />
                      <path d="M1 8c3-1.6 5-1.6 8 0s5 1.6 8 0 5-1.6 8 0" />
                    </svg>
                  </span>
                </div>
                <span className="frank__shine" data-tilt-shine aria-hidden="true" />
                <svg className="frank__postmark" data-marks-avoid viewBox="0 0 190 96" fill="none" aria-hidden="true" focusable="false">
                  <defs>
                    <path id="pm-arc-top-kh" d="M11 48a37 37 0 0 1 74 0" />
                    <path id="pm-arc-bot-kh" d="M15 48a33 33 0 0 0 66 0" />
                  </defs>
                  <g filter="url(#pm-ink-kh)">
                    <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="1.6" />
                    <circle cx="48" cy="48" r="33" stroke="currentColor" strokeWidth="1" />
                    <text className="frank__postmark-type" fill="currentColor">
                      <textPath href="#pm-arc-top-kh" startOffset="50%" textAnchor="middle">SUBANG JAYA</textPath>
                    </text>
                    <text className="frank__postmark-type" fill="currentColor">
                      <textPath href="#pm-arc-bot-kh" startOffset="50%" textAnchor="middle">MALAYSIA · MY</textPath>
                    </text>
                    <path d="M31 44h34M31 52h34" stroke="currentColor" strokeWidth="1.6" strokeLinecap="butt" />
                    <path d="M94 30q11-5 22 0t22 0 22 0 22 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M94 42q11-5 22 0t22 0 22 0 22 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M94 54q11-5 22 0t22 0 22 0 22 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M94 66q11-5 22 0t22 0 22 0 22 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </g>
                </svg>
              </div>

              <div className="ov3__conn">
                <div className="ov3__conn-row" data-marks-avoid>
                  <ul className="socials">
                    <li>
                      <a className="socials__link" href="https://github.com/kihurn" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                        <span className="socials__roll">
                          <span className="socials__move">
                            <svg width="1em" height="1em" className="socials__icon" viewBox="0 0 24 24" aria-hidden="true">
                              <path fill="currentColor" d="M12 1.95c5.525 0 10 4.476 10 10a10.02 10.02 0 0 1-6.812 9.488c-.5.1-.688-.212-.688-.475 0-.337.012-1.412.012-2.75 0-.937-.312-1.537-.675-1.85 2.226-.25 4.563-1.1 4.563-4.937 0-1.1-.387-1.988-1.025-2.688.1-.25.45-1.275-.1-2.65 0 0-.837-.275-2.75 1.025a9.3 9.3 0 0 0-2.5-.337c-.85 0-1.7.112-2.5.337-1.913-1.287-2.75-1.025-2.75-1.025-.55 1.375-.2 2.4-.1 2.65-.638.7-1.025 1.6-1.025 2.688 0 3.825 2.325 4.687 4.55 4.937-.287.25-.55.688-.637 1.338-.575.262-2.013.687-2.913-.825-.187-.3-.75-1.038-1.538-1.025-.837.012-.337.475.013.662.425.238.912 1.125 1.025 1.413.2.562.85 1.637 3.362 1.175 0 .837.013 1.625.013 1.862 0 .263-.187.563-.687.475A9.99 9.99 0 0 1 2 11.951c0-5.525 4.475-10 10-10" />
                            </svg>
                            <svg width="1em" height="1em" className="socials__icon" viewBox="0 0 24 24" aria-hidden="true">
                              <path fill="currentColor" d="M12 1.95c5.525 0 10 4.476 10 10a10.02 10.02 0 0 1-6.812 9.488c-.5.1-.688-.212-.688-.475 0-.337.012-1.412.012-2.75 0-.937-.312-1.537-.675-1.85 2.226-.25 4.563-1.1 4.563-4.937 0-1.1-.387-1.988-1.025-2.688.1-.25.45-1.275-.1-2.65 0 0-.837-.275-2.75 1.025a9.3 9.3 0 0 0-2.5-.337c-.85 0-1.7.112-2.5.337-1.913-1.287-2.75-1.025-2.75-1.025-.55 1.375-.2 2.4-.1 2.65-.638.7-1.025 1.6-1.025 2.688 0 3.825 2.325 4.687 4.55 4.937-.287.25-.55.688-.637 1.338-.575.262-2.013.687-2.913-.825-.187-.3-.75-1.038-1.538-1.025-.837.012-.337.475.013.662.425.238.912 1.125 1.025 1.413.2.562.85 1.637 3.362 1.175 0 .837.013 1.625.013 1.862 0 .263-.187.563-.687.475A9.99 9.99 0 0 1 2 11.951c0-5.525 4.475-10 10-10" />
                            </svg>
                          </span>
                        </span>
                      </a>
                    </li>
                    <li>
                      <a className="socials__link" href="https://linkedin.com/in/wong-ki-hurn" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                        <span className="socials__roll">
                          <span className="socials__move">
                            <svg className="socials__icon" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
                            </svg>
                            <svg className="socials__icon" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
                            </svg>
                          </span>
                        </span>
                      </a>
                    </li>
                    <li>
                      <a className="socials__link" href="mailto:wongkihurn2005@gmail.com" aria-label="Email">
                        <span className="socials__roll">
                          <span className="socials__move">
                            <svg className="socials__icon" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <rect x="3" y="5" width="18" height="14" rx="2" />
                              <path d="m3.5 6.5 8.5 7 8.5-7" />
                            </svg>
                            <svg className="socials__icon" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <rect x="3" y="5" width="18" height="14" rx="2" />
                              <path d="m3.5 6.5 8.5 7 8.5-7" />
                            </svg>
                          </span>
                        </span>
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="ov3__conn-row" data-marks-avoid>
                  <button data-dialog-open="letter" aria-haspopup="dialog" aria-expanded="false" className="btn btn--solid text-tag">
                    <span className="btn__label roll" data-roll>About me</span>
                  </button>
                  <span className="ov3__conn-from text-label">KL → Subang Jaya</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Bottom-left Telemetry::Sync / Commit Matrix Card */}
        <article
          className="ov3__item ov3__tele u-card"
          data-canvas-item
          data-rot="-1.3"
          tabIndex={0}
          style={{ "--fx": "-0.34", "--fy": "0.33" } as React.CSSProperties}
          data-about
          data-state="boot"
          aria-label="Telemetry"
        >
          <div className="ov3__tele-head">
            <span className="ov3__tele-tag text-mono-tag">
              Telemetry::<span className="ov3__roll" data-about-state>Sync</span>
            </span>
            <button className="ov3__scope" type="button" data-about-scope aria-pressed="false" aria-label="Toggle commit matrix color" />
          </div>
          <div className="ov3__commits" aria-hidden="true">
            {HEAT_CELLS.map((c) => (
              <span
                key={c.id}
                style={{ "--heat": c.heat, "--d": `${c.delay}s`, "--gh": `rgba(57, 211, 83, ${c.heat})` } as React.CSSProperties}
              />
            ))}
          </div>
          <div className="ov3__tele-rows text-mono-meta">
            <span>
              <span className="k">LOCAL::</span>
              <span className="v ov3__roll" data-about-time>--:--</span>
            </span>
            <span data-live>
              <span className="k">POS::</span>
              <span className="v">N 03°04′28″ / E 101°35′16″</span>
            </span>
            <span data-live>
              <span className="k">DIST::</span>
              <span className="v">018 KM (KL → SJ)</span>
            </span>
            <span data-online-row>
              <span className="k">ONLINE::</span>
              <span className="v ov3__roll" data-online>SYNC</span>
            </span>
            <span data-commits-row>
              <span className="k">COMMITS::</span>
              <span className="v ov3__roll" data-commits-total>418 / YR</span>
            </span>
          </div>
        </article>

        {/* Bottom-right Music Rotation Turntable Card */}
        <article
          className="ov3__item ov3__radio-card u-card"
          data-canvas-item
          data-rot="1.4"
          tabIndex={0}
          style={{ "--fx": "0.33", "--fy": "0.32" } as React.CSSProperties}
          data-radio-card
          aria-label="Music rotation"
        >
          <div className="con con--deck" data-radio-deck data-on="true" data-state="live">
            <div className="con__zone">
              <div className="con__head">
                <span className="con__tag text-mono-tag">
                  RADIO::<span className="con__roll" data-radio-status>SPIN</span>
                </span>
                <span className="con__meta text-mono-sm">
                  <span className="con__onair" aria-hidden="true" />
                  <span>ROTATION</span>
                </span>
              </div>
              <div className="con__now">
                <div className="con__deck">
                  <button type="button" className="con__track" data-radio-next title="Next track">
                    <span data-radio-title>Nujabes — Feather</span>
                  </button>
                  <span className="con__artist text-mono-sm" data-radio-artist>Modal Soul (2005)</span>
                </div>
                <div className="con__eq" aria-hidden="true">
                  <i /><i /><i /><i /><i />
                </div>
              </div>
              <div className="con__progress text-mono-sm">
                <button type="button" className="radio-toggle text-mono-sm" data-radio-toggle aria-pressed="true">
                  PAUSE
                </button>
                <div className="con__bar">
                  <span data-radio-bar style={{ transform: "scaleX(0.42)" }} />
                </div>
                <span data-radio-elapsed>01:42</span>
              </div>
            </div>
            <div className="con__spec">
              <div className="vinyl-turntable" aria-hidden="true">
                <div className="vinyl-disc" data-vinyl>
                  <span className="vinyl-disc__label" />
                </div>
                <svg className="vinyl-tonearm" viewBox="0 0 48 64" fill="none">
                  <circle cx="38" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" fill="#1c1c1c" />
                  <circle cx="38" cy="10" r="2" fill="currentColor" />
                  <path d="M38 10 L29 40 L20 49" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="16" y="47" width="7" height="4" rx="1" transform="rotate(-40 19.5 49)" fill="#e06a4a" />
                </svg>
              </div>
              <div className="con__read">
                <span className="con__k">BPM::</span>
                <span className="con__v" data-radio-bpm>92</span>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div className="ov3__scrim" data-canvas-scrim hidden aria-hidden="true" />
      <div className="ov3__exit" data-canvas-exit hidden>
        <button type="button" aria-label="Put it back" className="closebox closebox--md closebox--surface" data-canvas-close>
          <svg width="1em" height="1em" aria-hidden="true" data-icon="close">
            <symbol id="ai:local:close" viewBox="0 0 24 24">
              <path fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="m6.25 6.25 11.5 11.5m0-11.5-11.5 11.5" />
            </symbol>
            <use href="#ai:local:close" />
          </svg>
        </button>
      </div>

      <nav className="ov3__drawer" aria-label="Adjacent files">
        <Link className="ov3__drawer-tab text-label" href="/writing">File:: Writing</Link>
        <Link className="ov3__drawer-tab text-label" href="/lab">File:: Lab</Link>
        <Link className="ov3__drawer-tab text-label" href="/gigs">File:: Gigs</Link>
      </nav>
    </div>
  );
}
