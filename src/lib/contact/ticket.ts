const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** "KH-YYMMDD-XXXX", the date in Kuala Lumpur time. */
export function makeTicketNumber(now: Date, rand: () => number = Math.random): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  let tail = "";
  for (let i = 0; i < 4; i++) tail += ALPHABET[Math.min(ALPHABET.length - 1, Math.floor(rand() * ALPHABET.length))];
  return `KH-${get("year")}${get("month")}${get("day")}-${tail}`;
}
