import type { Metadata, Viewport } from "next";
import "./globals.css";
import "../styles/site.css";
import "../styles/chrome.css";
import { site } from "@/content/site";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { Overlays } from "@/components/chrome/Overlays";
import { ChromeBehaviors } from "@/components/chrome/ChromeBehaviors";

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
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <a className="skip-link text-meta" href="#main">
          Skip to content
        </a>
        {/* chat status and the building project are wired in Phase 2 and 4 */}
        <Header chatOnline={null} building={null} />
        {children}
        <Footer />
        <Overlays projects={[]} />
        <ChromeBehaviors />
      </body>
    </html>
  );
}
