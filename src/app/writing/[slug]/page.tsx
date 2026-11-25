import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../../../styles/pages.css";
import { ArticleToc } from "@/components/writing/ArticleToc";
import { articles } from "@/content/writing";

export const dynamicParams = false;

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  return article ? { title: article.title, description: article.summary } : {};
}

export default async function WritingArticlePage({ params }: Params) {
  const { slug } = await params;
  const sorted = [...articles].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  const idx = sorted.findIndex((a) => a.slug === slug);
  if (idx < 0) notFound();
  const article = sorted[idx];
  const prev = idx > 0 ? sorted[idx - 1] : null;
  const next = idx < sorted.length - 1 ? sorted[idx + 1] : null;

  return (
    <main id="main" className="page">
      <Link href="/writing" className="case__back text-mono-meta">
        ← WRITING::INDEX
      </Link>

      <header className="article__head">
        <div className="article__meta text-mono-meta u-muted">
          <span>DATE::{article.date}</span>
          <span>READ::{article.readTime}</span>
          <span className="article__tags">
            {article.tags.map((t) => (
              <span key={t} className="chip text-meta chip--pill">
                {t}
              </span>
            ))}
          </span>
        </div>
        <h1 className="text-h1">{article.title}</h1>
        <p className="page__intro text-lead">{article.summary}</p>
      </header>

      <div className="article__grid">
        <ArticleToc items={article.sections.map((s) => ({ id: s.id, heading: s.heading }))} />

        <article className="article__body">
          {article.sections.map((sec) => (
            <section key={sec.id} id={sec.id} className="article__section">
              <h2 className="text-h4">{sec.heading}</h2>
              {sec.paragraphs.map((p) => (
                <p key={p} className="text-body">
                  {p}
                </p>
              ))}
              {sec.code ? (
                <figure className="article__code">
                  <figcaption className="text-mono-sm u-muted">{sec.code.label}</figcaption>
                  <pre>
                    <code className="text-mono-meta">{sec.code.snippet}</code>
                  </pre>
                </figure>
              ) : null}
            </section>
          ))}

          <nav className="article__pager" aria-label="Adjacent essays">
            {prev ? (
              <Link href={`/writing/${prev.slug}`} className="article__pager-link">
                <span className="text-mono-sm u-muted">← NEWER</span>
                <span className="text-tag">{prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/writing/${next.slug}`} className="article__pager-link article__pager-link--next">
                <span className="text-mono-sm u-muted">OLDER →</span>
                <span className="text-tag">{next.title}</span>
              </Link>
            ) : null}
          </nav>
        </article>
      </div>
    </main>
  );
}
