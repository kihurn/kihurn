# TODO (visible gaps and Ki Hurn's hands-on items)

Every gap rendered on the site as `TODO:` is listed here.

## Content gaps (need Ki Hurn)
- Finish dates for Billy, Elysium, SecureFin and the pneumonia project (`finishedOn: "TODO"`).
- Pneumonia detection: model accuracy figure, and the repo link if there is a public one.
- Billy: a live URL, if it has one.
- ImagineHack 2026 date (shown in What's new as `TODO:`).
- Circus Funtasia: your role and details (Gigs).
- Screenshots or GIFs for each project (Lab entries show placeholders).
- Headshot and event photos (About, Gigs).
- Short demo video for the SecureFin panel's no-camera fallback.

## Facts to double-check
- Elysium: the README says design capacity is 1,500 main passes and 200 waitlist spots (and its waitlist ranks run to #500). The site uses your brief's results instead (1,800 registrations, 300 on the waitlist, about 1,200 attendees). Tell me if the capacity wording should change.
- SecureFin: the README says a face match is a Euclidean distance below 0.6. The demo uses 0.6.

## Launch checks
- Lighthouse, mobile, local production build (2026-11-25). Targets: perf >= 90, a11y >= 95, SEO >= 95, LCP < 2.5 s, CLS < 0.1.
  - `/`: perf 100, a11y 100, SEO 100, LCP 0.9 s, CLS 0.003. Passes.
  - `/lab`: perf 91-93, a11y 100, SEO 100, CLS 0, **LCP 3.2-3.3 s (misses 2.5 s)**.
  - `/about`: perf 95-96, a11y 100, SEO 100, CLS 0, **LCP 2.8 s (misses 2.5 s)**.
  - Lab and About paint their main element after hydration. Open item: server-render the first frame of the Lab list and the About stamp.
  - Fixed on the way: swipe hint was client-only (Home LCP 3.2 s -> 0.9 s); HUD label contrast raised; Geist fonts preloaded.
- 768 px and 1920 px: no horizontal overflow on `/`, `/lab`, `/about`, `/gigs`, `/contact`, `/lab/elysium`; no console errors.
- Carter grep: clean.
