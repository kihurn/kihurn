const klTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kuala_Lumpur",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatKLTime(d: Date): string {
  return `KL ${klTime.format(d)}`;
}
