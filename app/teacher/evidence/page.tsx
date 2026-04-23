import fs from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function loadEvidenceMarkdown() {
  const filePath = path.join(process.cwd(), 'docs', 'TeacherEvidence.md');
  return await fs.readFile(filePath, 'utf8');
}

export default async function TeacherEvidencePage() {
  const md = await loadEvidenceMarkdown();

  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  const html = marked.parse(md);

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold">Projectdocumentatie (bewijs)</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Printvriendelijk. Gebruik je browser: Print → Save as PDF.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border/60 bg-background/60 px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        >
          Print / Save as PDF
        </button>
      </div>

      <article
        className="markdown max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <style>{`
        .markdown h1 { font-size: 1.8rem; font-weight: 700; margin: 1.25rem 0 0.75rem; }
        .markdown h2 { font-size: 1.35rem; font-weight: 700; margin: 1.25rem 0 0.6rem; }
        .markdown h3 { font-size: 1.1rem; font-weight: 700; margin: 1rem 0 0.4rem; }
        .markdown p { margin: 0.5rem 0; color: hsl(var(--muted-foreground)); }
        .markdown strong { color: hsl(var(--foreground)); }
        .markdown ul { margin: 0.5rem 0 0.75rem 1.25rem; list-style: disc; color: hsl(var(--muted-foreground)); }
        .markdown li { margin: 0.25rem 0; }
        .markdown code { padding: 0.1rem 0.35rem; border-radius: 0.5rem; background: hsl(var(--accent)); color: hsl(var(--foreground)); }
        .markdown a { color: hsl(var(--primary)); text-decoration: underline; word-break: break-word; }
        @media print {
          body { background: white !important; }
          a[href]:after { content: ""; }
        }
      `}</style>
    </div>
  );
}

