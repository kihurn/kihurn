import { parseGitHubCalendar } from "@/lib/contributions";

export async function GET() {
  try {
    const response = await fetch("https://github.com/users/kihurn/contributions", {
      headers: { "Accept-Language": "en-US" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4500),
    });
    if (response.ok) {
      const days = parseGitHubCalendar(await response.text());
      if (days.length >= 350) return Response.json(days);
    }
  } catch {}
  return Response.json([]);
}
