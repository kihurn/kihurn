const klTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kuala_Lumpur",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "KL HH:MM", 24-hour, always Kuala Lumpur time. */
export function formatKLTime(d: Date): string {
  return `KL ${klTime.format(d)}`;
}
