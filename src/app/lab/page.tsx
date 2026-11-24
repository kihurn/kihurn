import type { Metadata } from "next";
import { PageStub } from "@/components/chrome/PageStub";

export const metadata: Metadata = { title: "Lab" };

export default function LabPage() {
  return <PageStub title="Lab" />;
}
