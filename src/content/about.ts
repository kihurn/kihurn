
export interface TimelineEntry {
  kind: "Education" | "Work" | "Training" | "Community";
  title: string;
  org: string;
  when: string;
  detail?: string;
}

export const timeline: TimelineEntry[] = [
  {
    kind: "Work",
    title: "System Engineer (part-time)",
    org: "Ideabase Technologies Sdn. Bhd., on site at Sunway University",
    when: "Apr 2025 to present",
    detail: "Campus network infrastructure, monitoring, deploying switches, access points and firewalls, troubleshooting and documentation.",
  },
  {
    kind: "Community",
    title: "Director of Strategic Communications",
    org: "Agents of Tech, Taylor's University",
    when: "Sep 2025 to present",
    detail: "Lead the club's communications, manage the PR and media marketing teams, and hosted and promoted ImagineHack 2026 for 250+ participants.",
  },
  {
    kind: "Community",
    title: "Senior Member",
    org: "Taylor's Orientation Leaders",
    when: "Jul 2025 to present",
    detail: "Co-built Elysium for Orientation Party 2026 and supported ticket pickup, wristband binding and gate check-in.",
  },
  {
    kind: "Training",
    title: "Palo Alto Networks Firewall Essentials: Configuration and Management (EDU-210)",
    org: "Palo Alto Networks",
    when: "Sep 2026",
  },
  {
    kind: "Education",
    title: "Bachelor of Computer Science (Honours)",
    org: "Taylor's University",
    when: "Apr 2025 to Sep 2027 (expected)",
    detail: "Specialising in Artificial Intelligence with an extension in Cybersecurity.",
  },
  {
    kind: "Work",
    title: "Network Infrastructure Intern",
    org: "Sunway University",
    when: "Jan to Mar 2025",
    detail:
      "Deployed Cisco, Huawei and Dell switches, access points and firewalls; Apache, DHCP and TFTP servers on Linux; diagnostics and pen testing with Wireshark, Nmap and Ettercap.",
  },
  {
    kind: "Education",
    title: "Diploma in IT",
    org: "Taylor's College",
    when: "Apr 2023 to Mar 2025",
    detail: "CGPA 3.92. Dean's List.",
  },
];

export interface SkillGroup {
  heading: "Languages" | "Web" | "Data" | "Systems & Networking" | "Security";
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  { heading: "Languages", items: ["TypeScript", "Python", "Rust", "Java", "Swift", "PHP"] },
  { heading: "Web", items: ["React", "React Native", "Node.js", "Vite", "Tailwind CSS", "Vercel"] },
  { heading: "Data", items: ["PostgreSQL", "Supabase", "PocketBase", "MySQL"] },
  {
    heading: "Systems & Networking",
    items: [
      "Cisco, Huawei and Dell switches",
      "Access points",
      "Firewalls",
      "Linux servers: Apache, DHCP, TFTP",
      "Wireshark",
      "Nmap",
      "Tailscale",
    ],
  },
  {
    heading: "Security",
    items: [
      "Pen testing: Wireshark, Nmap, Ettercap",
      "Row Level Security",
      "Face verification on face-api.js",
      "Palo Alto firewall configuration (training)",
    ],
  },
];

export const spokenLanguages = ["English", "Mandarin", "Malay", "Japanese (elementary)"];
