import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const alt = `${site.name}: ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#1e1e1e",
          color: "#f7f7f7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: 2 }}>{site.wordmark}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 108, lineHeight: 1 }}>{site.name}</div>
          <div style={{ display: "flex", fontSize: 36, opacity: 0.75 }}>Backend, systems &amp; networking</div>
        </div>
        <div style={{ display: "flex", fontSize: 28, opacity: 0.6 }}>{site.statusLine} · kihurn.vercel.app</div>
      </div>
    ),
    size,
  );
}
