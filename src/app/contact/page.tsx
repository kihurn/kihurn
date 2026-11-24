import type { Metadata } from "next";
import { PageStub } from "@/components/chrome/PageStub";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return <PageStub title="Contact" />;
}
