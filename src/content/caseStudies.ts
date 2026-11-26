
export interface CaseStudy {
  problem: string;
  how: string[];
  flow: string[];
  diagramTodo?: string;
  result: string;
}

export const caseStudies: Record<string, CaseStudy> = {
  elysium: {
    problem:
      "Taylor's University Orientation Party 2026 needed registration, physical ticket collection and gate check-in for freshmen, with a hard capacity, only real freshmen allowed in, and no duplicate or passed-back tickets.",
    how: [
      "A student registers with their student ID, which is checked against a whitelist of freshmen, then picks a ticket-collection timeslot. A row-level lock in PostgreSQL stops a slot being overbooked. Once the main passes are full, registration locks and a waitlist opens with sequential ranks.",
      "At collection, an Orientation Leader binds a unique ticket ID to the student's ID. On the night, gate ushers look a student up by either ID and mark attendance. Scanning the same ticket twice shows an Already Attended warning with the first entry time.",
      "Access control sits in the database: Row Level Security and SECURITY DEFINER functions, so the rules hold whatever the frontend does.",
    ],
    flow: [
      "Register: ID checked against the freshmen whitelist",
      "Pick a collection timeslot: row lock prevents overbooking",
      "Collect: ticket ID bound to student ID by an Orientation Leader",
      "Gate: look up by ID or ticket, stamp attendance once",
    ],
    result:
      "The platform served an intake of 4,000–5,000 freshmen, handled 1,800 registrations and a 300-person waitlist, and checked in about 1,200 attendees. I load-tested it with Grafana k6 before launch.",
  },
  securefin: {
    problem:
      "Logging in once is not enough for a finance portal: the person at the keyboard can change, or walk away. SecureFin keeps checking who is there while they work. It was built as a group assignment for the Software Secure Systems course.",
    how: [
      "Everything biometric runs in the browser. face-api.js, with pretrained models, finds the face in webcam frames and turns it into a 128-number descriptor. That is compared with the descriptor enrolled earlier using Euclidean distance; below 0.6 counts as a match. A check takes under 1.5 seconds.",
      "The session locks if the user leaves, the face does not match, or a second face appears. Only descriptors are stored, never images, so a database leak cannot be turned back into a face.",
      "The rest of the portal, built by the team, adds JWT authentication, role-based access control, rate limiting and a hash-chained ledger.",
    ],
    flow: [
      "Webcam frames, on the device",
      "face-api.js finds the face and makes a 128-number descriptor",
      "Distance to the enrolled descriptor: match if below 0.6",
      "Match: carry on. No face, no match or a second face: lock",
    ],
    result:
      "A working zero-trust prototype. Checks finish in under 1.5 seconds, and the demo in the Lab runs the same idea in your own browser.",
  },
  "campus-network": {
    problem:
      "A university campus network has to keep running while it grows: new switches, access points and firewalls to deploy, and problems to find and fix quickly.",
    how: [
      "At Ideabase Technologies, on site at Sunway University, Ki Hurn deploys and configures switches, access points and firewalls, monitors the network, troubleshoots faults and writes the documentation.",
      "In his earlier Sunway internship he worked on Cisco, Huawei and Dell switches, access points and firewalls, ran Apache, DHCP and TFTP servers on Linux, and did diagnostics and pen testing with Wireshark, Nmap and Ettercap.",
      "It is internal work, so there is no repo or public screenshot. A walkthrough is available on request.",
    ],
    flow: [],
    diagramTodo: "TODO: topology diagram (redacted)",
    result: "Ongoing: Ki Hurn has held the role since April 2025.",
  },
};
