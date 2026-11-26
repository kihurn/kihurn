import type { FaqEntry } from "./types";
import { site } from "./site";


export const faq: FaqEntry[] = [
  {
    id: "about",
    question: "Who is Ki Hurn?",
    keywords: ["who", "about", "introduce", "introduction", "student", "bio"],
    answer:
      "Wong Ki Hurn is a Computer Science student at Taylor's University and a part-time System Engineer at Ideabase Technologies, based at Sunway University. He builds full-stack apps with React, TypeScript, Node.js and PostgreSQL and focuses on backend systems.",
  },
  {
    id: "skills",
    question: "What are his skills?",
    keywords: ["skills", "skill", "languages", "stack", "tech", "technologies", "good"],
    answer:
      "Across his projects: TypeScript and React, Python, Rust, PostgreSQL and Supabase. On the networking side: Cisco, Huawei and Dell switches, access points and firewalls, Linux servers (Apache, DHCP, TFTP), and Wireshark, Nmap and Ettercap for diagnostics and pen testing. He speaks English, Mandarin and Malay, and a little Japanese.",
  },
  {
    id: "availability",
    question: "Is he available for an internship?",
    keywords: ["available", "availability", "internship", "internships", "intern", "hire", "hiring", "open"],
    answer:
      "He's looking for internships in software engineering, cybersecurity or systems engineering. He expects to finish his degree in September 2027. For dates and details, use the contact page or email " +
      site.email +
      ".",
  },
  {
    id: "contact",
    question: "How can I contact him?",
    keywords: ["contact", "email", "mail", "reach", "linkedin", "github", "message", "phone"],
    answer:
      "Send a ticket from the contact page, or email " +
      site.email +
      ". LinkedIn: linkedin.com/in/wong-ki-hurn. GitHub: github.com/kihurn.",
  },
  {
    id: "networking-experience",
    question: "Does he have networking experience?",
    keywords: ["networking", "network", "networks", "cisco", "switch", "switches", "firewall", "firewalls", "sunway", "ideabase", "infrastructure"],
    answer:
      "Yes. Since April 2025 he's a part-time System Engineer at Ideabase Technologies, on site at Sunway University: campus network infrastructure, monitoring, deploying switches, access points and firewalls, troubleshooting and documentation. Before that he was a Network Infrastructure Intern at Sunway (Jan to Mar 2025): Cisco, Huawei and Dell switches, access points and firewalls, Apache, DHCP and TFTP servers on Linux, and diagnostics and pen testing with Wireshark, Nmap and Ettercap. His Palo Alto Networks Firewall Essentials (EDU-210) certificate is dated 16 October 2026.",
  },
  {
    id: "what-has-he-built",
    question: "What has Ki Hurn built?",
    keywords: ["built", "build", "projects", "project", "made", "portfolio", "work", "shipped"],
    answer:
      "His projects include Elysium (event ticketing), SecureFin (a finance portal with face verification), C0RE (a self-hosted AI gateway), and Moby (an Android desk controller). Otto and V4ULT are in development, and Remy is a baking app concept. The Lab has the full project index.",
  },
  {
    id: "elysium",
    question: "Tell me about Elysium",
    keywords: ["elysium", "ticketing", "orientation", "op-26"],
    answer:
      "Elysium handled registration, ticketing and gate check-in for Taylor's Orientation Party 2026: 1,800 registrations, 300 on the waitlist and about 1,200 attendees. It was a team of 3. Ki Hurn built the backend alone (Supabase and PostgreSQL with row-level locking, Row Level Security and SECURITY DEFINER functions), did most of the frontend-to-backend integration, and load-tested it with Grafana k6.",
  },
  {
    id: "securefin",
    question: "Tell me about SecureFin",
    keywords: ["securefin", "face", "biometric", "zero-trust", "verification"],
    answer:
      "SecureFin is a zero-trust finance portal built by a team of 5. Ki Hurn built the continuous face-verification engine alone, on face-api.js: background webcam checks against a 128-dimension descriptor, with a tuned distance threshold and checks under 1.5 seconds. Only descriptors are stored, never images. The face models are pretrained; he didn't train them. You can try a demo in the Lab.",
  },
  {
    id: "campus-network",
    question: "What is the campus network project?",
    keywords: ["campus", "ideabase", "sunway"],
    answer:
      "It's his day-to-day network work at Sunway University through Ideabase Technologies: switches, access points, firewalls, monitoring and documentation. It's internal, so there's no public repo; a walkthrough is available on request.",
  },
  {
    id: "how-does-this-chat-work",
    question: "How does this chat work?",
    keywords: ["chat", "chatbot", "bot", "how", "works"],
    answer:
      "Suggested questions are answered from a short script. Anything else goes through a Vercel server to C0RE, Ki Hurn's own AI gateway on his PC, which runs a local model. That part switches on when his PC is connected; if it's asleep the status bar shows NAPPING and the suggested questions still work. It only knows public facts about him.",
  },
];
