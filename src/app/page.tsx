import Link from "next/link";
import "../styles/home.css";
import { ChatBox } from "@/components/home/ChatBox";
import { FeaturedCarousel } from "@/components/home/FeaturedCarousel";
import { ActivityFeed, BuildingList, NowList, RecentlyDone } from "@/components/home/Sections";
import { faq } from "@/content/faq";
import { now } from "@/content/now";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import { getActivityRepos, getBuilding, getFeatured, getRecentlyDone } from "@/lib/projects";
import { getActivity } from "@/lib/server/github";

export const revalidate = 3600;

const CHIP_IDS = ["what-has-he-built", "networking-experience", "availability"];

export default async function Home() {
  const chips = CHIP_IDS.map((id) => faq.find((e) => e.id === id)!);
  const activity = await getActivity(getActivityRepos(projects));

  return (
    <main id="main" className="home">
      <section className="hero" aria-labelledby="hero-h">
        <h1 id="hero-h" className="hero__name text-display">
          {site.name}
        </h1>
        <p className="hero__tag text-body">{site.tagline}</p>
        <ChatBox chips={chips} />
      </section>

      <NowList lines={now} />
      <BuildingList items={getBuilding(projects)} />
      <FeaturedCarousel items={getFeatured(projects)} />
      <RecentlyDone items={getRecentlyDone(projects)} />
      <ActivityFeed items={activity} />

      <section className="cta" aria-label="Next steps">
        <Link className="cta__link text-nav" href="/lab">
          See all work <span aria-hidden="true">→</span>
        </Link>
        <Link className="cta__link text-nav" href="/contact">
          Send me a ticket <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}
