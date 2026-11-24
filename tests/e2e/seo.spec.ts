import { expect, test } from "@playwright/test";
import { projects } from "../../src/content/projects";

const BASE = "https://kihurn.vercel.app";
const PAGES = ["/", "/lab", "/about", "/gigs", "/contact"];
const caseStudies = projects.filter((p) => p.caseStudy).map((p) => `/lab/${p.slug}`);

test("sitemap lists every page and case study", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml = await res.text();
  for (const path of [...PAGES, ...caseStudies]) {
    const loc = path === "/" ? BASE : `${BASE}${path}`;
    const found = xml.includes(`<loc>${loc}</loc>`) || xml.includes(`<loc>${loc}/</loc>`);
    expect(found, path).toBe(true);
  }
});

test("robots allows everything and points to the sitemap", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const txt = await res.text();
  expect(txt.toLowerCase()).toContain("user-agent: *");
  expect(txt.toLowerCase()).toContain("allow: /");
  expect(txt.toLowerCase()).not.toContain("disallow: /\n");
  expect(txt).toContain(`Sitemap: ${BASE}/sitemap.xml`);
});

test("every page has a unique title, a description and an og:image", async ({ page }) => {
  const titles: string[] = [];
  for (const path of [...PAGES, ...caseStudies]) {
    await page.goto(path);
    const title = await page.title();
    expect(title, path).not.toBe("");
    titles.push(title);
    const og = await page.locator('meta[property="og:image"]').first().getAttribute("content");
    expect(og, `${path} og:image`).toBeTruthy();
    const desc = await page.locator('meta[name="description"]').first().getAttribute("content");
    expect(desc, `${path} description`).toBeTruthy();
  }
  expect(new Set(titles).size).toBe(titles.length);
});

test("the Open Graph image renders as a PNG", async ({ page, request }) => {
  await page.goto("/");
  const og = await page.locator('meta[property="og:image"]').first().getAttribute("content");
  const res = await request.get(new URL(og!).pathname);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
});
