import { PageStub } from "@/components/chrome/PageStub";
import { site } from "@/content/site";

export default function Home() {
  return (
    <PageStub title={site.name}>
      <p className="text-body">{site.tagline}</p>
    </PageStub>
  );
}
