
export interface ProfileEntry {
  title: string;
  org: string;
  when: string;
  detail: string;
}

export const experience: ProfileEntry[] = [
  {
    title: "System Engineer (part-time)",
    org: "Ideabase Technologies Sdn. Bhd.",
    when: "Apr 2025 to present",
    detail: "Maintain campus network infrastructure on site at Sunway University. Monitor network health, deploy switches, access points and firewalls, and troubleshoot and document network changes.",
  },
  {
    title: "Director of Strategic Communications",
    org: "Taylor's University Agents of Tech Club",
    when: "Sep 2025 to present",
    detail: "Lead the club's PR and media marketing teams and plan communications across social media and campus channels. Promoted Prehack Roadmap for first-time hackathon participants and helped host and market ImagineHack 2026 for 250+ participants.",
  },
  {
    title: "Senior Member",
    org: "Taylor's Orientation Leaders",
    when: "Jul 2025 to present",
    detail: "Co-built Elysium in a team of three for Orientation Party 2026. It served an intake of 4,000–5,000 freshmen, handled 1,800 registrations and a 300-person waitlist, and checked in about 1,200 attendees. Supported ticket pickup, wristband binding and gate admission.",
  },
  {
    title: "Network Infrastructure Intern",
    org: "Sunway Education",
    when: "Jan 2025 to Mar 2025",
    detail: "Deployed Cisco, Huawei and Dell switches, access points and firewalls. Resolved faults across campus buildings, set up Apache, DHCP, TFTP and network monitoring on Linux, and ran diagnostics and penetration tests with Wireshark, Nmap and Ettercap.",
  },
  {
    title: "Student Representative for Re-Imagining SLC",
    org: "Taylor's College",
    when: "Dec 2023 to Apr 2024",
    detail: "Gathered student feedback and presented it to management while working with other student representatives on the relocation and redesign of the Student Life Centre.",
  },
  {
    title: "Assistant Director of Public Relations, Marketing and Communications",
    org: "Taylor's College Student Council",
    when: "Sep 2023 to Apr 2024",
    detail: "Led a team of 11 across 15+ campaigns, improving project efficiency by 30% and social media engagement by 45%. Helped organise 8+ events with 1,200+ participants and worked with five or more student bodies on four joint projects.",
  },
  {
    title: "Public Relations Member",
    org: "Taylor's College Student Council",
    when: "Jun 2023 to Sep 2023",
    detail: "Designed posters and Instagram content, edited promotional videos, drafted communications, and helped coordinate with student organisations.",
  },
];

export const education: ProfileEntry[] = [
  {
    title: "Bachelor of Computer Science (Honours)",
    org: "Taylor's University",
    when: "Apr 2025 to Sep 2027 (expected)",
    detail: "Specialising in Artificial Intelligence with an extension in Cybersecurity.",
  },
  {
    title: "Diploma in Information Technology",
    org: "Taylor's College",
    when: "Apr 2023 to Mar 2025",
    detail: "CGPA 3.92. Dean's List. Active in the Taylor's College Student Council, Google Developer Student Club and Agents of Tech.",
  },
  {
    title: "SPM",
    org: "Beaconhouse Sri Lethia Private National School",
    when: "2018 to 2023",
    detail: "7 A, 1 A− and 2 B+. CEFR English overall level B2. Honorable Mention in the 2022 Kangaroo Math Competition Malaysia.",
  },
];

export const firewallCertificate = {
  title: "Firewall Essentials: Configuration and Management (EDU-210)",
  issuer: "Palo Alto Networks",
  date: "2026-10-16",
  issued: "16 Oct 2026",
  image: "/images/certifications/edu-210.png",
} as const;

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
