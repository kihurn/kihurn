export type ContributionDay = { date: string; count: number; level: number };

export function parseGitHubCalendar(html: string): ContributionDay[] {
  const counts = new Map<string, number>();
  for (const tooltip of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>\s*(No|[\d,]+) contributions? on\b/g)) {
    counts.set(tooltip[1], tooltip[2] === "No" ? 0 : Number(tooltip[2].replaceAll(",", "")));
  }
  const days: ContributionDay[] = [];
  for (const [tag] of html.matchAll(/<td\b[^>]*\bdata-date="\d{4}-\d{2}-\d{2}"[^>]*>/g)) {
    const date = tag.match(/\bdata-date="([^"]+)"/)?.[1];
    const id = tag.match(/\bid="([^"]+)"/)?.[1];
    const level = Number(tag.match(/\bdata-level="([0-4])"/)?.[1]);
    const count = id ? counts.get(id) : undefined;
    if (date && count !== undefined && Number.isFinite(level)) days.push({ date, count, level });
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

export function calendarWeeks(days: ContributionDay[], today: string) {
  const end = new Date(`${today}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6 - end.getUTCDay());
  const byDate = new Map(days.map((day) => [day.date, day]));
  return Array.from({ length: 52 * 7 }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(date.getUTCDate() - 363 + index);
    const key = date.toISOString().slice(0, 10);
    if (key > today) return null;
    if (days.length) return byDate.get(key) ?? { date: key, count: 0, level: 0 };
    const week = Math.floor(index / 7);
    const noise = (Math.imul(Math.floor(date.getTime() / 86_400_000), 2654435761) >>> 0) / 2 ** 32;
    const count = noise < 0.6 + Math.sin(week * 0.55) * 0.24 ? 0 : Math.floor(noise * 17) - 4;
    return { date: key, count, level: Math.min(4, Math.ceil(count / 3)) };
  });
}
