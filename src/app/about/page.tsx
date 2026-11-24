import type { Metadata } from "next";
import { PageStub } from "@/components/chrome/PageStub";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return <PageStub title="About" />;
}
