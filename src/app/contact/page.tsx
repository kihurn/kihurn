import type { Metadata } from "next";
import "../../styles/pages.css";
import "../../styles/contact.css";
import { TicketForm } from "@/components/contact/TicketForm";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Send Wong Ki Hurn a ticket: internships, freelance projects, collaboration or just a hello.",
};

export default function ContactPage() {
  return (
    <main id="main" className="page contact-page">
      <header className="page__head">
        <h1 className="text-display">Contact</h1>
        <p className="page__intro text-body">
          Draft a note below, sign off, and open a ticket—I&apos;ll reply by email. Or write directly to{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>, or find me on{" "}
          <a href={site.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>{" "}
          and{" "}
          <a href={site.github} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          .
        </p>
      </header>
      <TicketForm email={site.email} />
    </main>
  );
}
