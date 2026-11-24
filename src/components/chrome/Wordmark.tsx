import { site } from "@/content/site";

/** Text logo. `short` renders "KH." for tight spots (stubs, letterheads). */
export function Wordmark({ short = false }: { short?: boolean }) {
  return (
    <span className="logo logo--wordmark wordmark" aria-hidden="true">
      {short ? "KH." : site.wordmark}
    </span>
  );
}
