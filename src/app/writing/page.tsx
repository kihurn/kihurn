import type { Metadata } from "next";
import "../../styles/pages.css";
import { WritingShelf } from "@/components/writing/WritingShelf";
import { articles } from "@/content/writing";

export const metadata: Metadata = {
  title: "Writing",
  description: "Notes and essays on backend systems, networking, motion, and creative tooling.",
};

export default function WritingPage() {
  const sorted = [...articles].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return (
    <main id="main" className="page">
      <header className="page__head">
        <p className="text-mono-meta u-muted">SHELF::EDITORIAL</p>
        <h1 className="text-display">Writing</h1>
        <p className="page__intro text-body">
          Engineering notes on Rust gateways, PostgreSQL concurrency, WebGL shaders, and monochrome interface craft.
        </p>
      </header>
      <WritingShelf items={sorted} />
    </main>
  );
}
