import type { Metadata } from "next";
import Image from "next/image";
import "../../styles/lab.css";
import "../../styles/pages.css";
import { CrewPass } from "@/components/gigs/CrewPass";
import { events } from "@/content/gigs";

export const metadata: Metadata = {
  title: "Gigs",
  description: "When Ki Hurn isn't building, he's usually crewing events.",
};

export default function GigsPage() {
  return (
    <main id="main" className="page">
      <header className="page__head">
        <h1 className="text-display">Gigs</h1>
        <p className="text-body page__intro">
          When I&apos;m not building, I&apos;m usually crewing events. This is the secondary side of the site: the IT work
          lives in the Lab.
        </p>
      </header>

      <section className="gigs__pass" aria-label="Crew pass">
        <CrewPass />
      </section>

      <section className="page__sec" aria-labelledby="events-h">
        <h2 id="events-h" className="page__title text-label">
          Events
        </h2>
        <ul className="events">
          {events.map((e) => (
            <li key={e.slug} className="event" data-event>
              <Image
                className="event__photo"
                src="/placeholder/event.svg"
                width={640}
                height={400}
                alt={`TODO: photo from ${e.name}`}
                unoptimized
              />
              <h3 className="event__name text-display">{e.name}</h3>
              <p className="event__role text-body">{e.role}</p>
              {e.detail ? <p className="event__detail text-body">{e.detail}</p> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="page__sec" aria-label="Scrapbook">
        <a className="book" href="https://kihurn-book.vercel.app">
          <span className="book__k text-mono-meta">Scrapbook</span>
          <span className="book__t text-display">Open the scrapbook</span>
          <span className="book__d text-body">My old portfolio, a 3D book you can flip through. Best on desktop.</span>
        </a>
      </section>
    </main>
  );
}
