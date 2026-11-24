import type { Metadata, Viewport } from "next";
import "../styles/site.css";
import "../styles/chrome.css";
import { site } from "@/content/site";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { Overlays } from "@/components/chrome/Overlays";
import { ChromeBehaviors } from "@/components/chrome/ChromeBehaviors";
import { projects } from "@/content/projects";
import { getBuilding } from "@/lib/projects";

export const metadata: Metadata = {
  metadataBase: new URL("https://kihurn.vercel.app"),
  title: { default: `${site.name} — ${site.wordmark}`, template: `%s — ${site.name}` },
  description: site.tagline,
  icons: { icon: "/favicon-dark.svg", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#1e1e1e" };

// set the saved theme before first paint so there is no flash
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: light)").matches))document.documentElement.dataset.theme=t==="system"?"light":t}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/geist-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/geist-mono-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <a className="skip-link text-meta" href="#main">
          Skip to content
        </a>
        {/* chat status is wired in Phase 4 */}
        <Header chatOnline={null} building={getBuilding(projects)[0]?.name ?? null} />
        {children}
        <Footer />
        <Overlays projects={projects.map(({ slug, name, caseStudy }) => ({ slug, name, caseStudy }))} />
        <ChromeBehaviors />
      </body>
    </html>
  );
}
