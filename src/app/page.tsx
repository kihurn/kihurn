import Link from "next/link";
import "../styles/home.css";
import { ChatBox } from "@/components/home/ChatBox";
import { ProjectWheels, type WheelItem } from "@/components/home/ProjectWheels";
import { ActivityFeed, BuildingList, NowList, RecentlyDone } from "@/components/home/Sections";
import { faq } from "@/content/faq";
import { now } from "@/content/now";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import type { Project } from "@/content/types";
import {
  LENS_LABEL,
  getActivityRepos,
  getBuilding,
  getRecentlyDone,
  projectHref,
  projectTag,
  wheelOrder,
} from "@/lib/projects";
import { getActivity } from "@/lib/server/github";
import { media } from "@/data/media";
import { availableMedia } from "@/lib/server/media";

export const revalidate = 3600;

const CHIP_IDS = ["what-has-he-built", "networking-experience", "availability"];
function wheelItems(ps: Project[]): WheelItem[] {
  return wheelOrder(ps).map((p) => ({
    slug: p.slug,
    name: p.name,
    tag: projectTag(p),
    lens: LENS_LABEL[p.lenses[0]] ?? "",
    role: p.teamPart ? "LEAD / TEAM" : "SOLO BUILD",
    year: p.finishedOn && /^\d{4}/.test(p.finishedOn) ? p.finishedOn.slice(0, 4) : "2026",
    href: projectHref(p),
    photo: p.status === "internal" ? undefined : availableMedia(media.projects[p.slug]),
    plate: `/placeholder/plate-${p.slug}.svg`,
  }));
}

export default async function Home() {
  const chips = CHIP_IDS.map((id) => faq.find((e) => e.id === id)!);
  const activity = await getActivity(getActivityRepos(projects));

  return (
    <main id="main" className="home">
      <ProjectWheels items={wheelItems(projects)} />

      <div id="home-index" className="home__rest">
        <section className="hero" aria-label="Introduction">
          <p className="hero__name text-display" aria-hidden="true">
            {site.name}
          </p>
          <p className="hero__tag text-body">{site.tagline}</p>
          <ChatBox chips={chips} />
        </section>

        <NowList lines={now} />
        <BuildingList items={getBuilding(projects)} />
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
      </div>
    </main>
  );
}
