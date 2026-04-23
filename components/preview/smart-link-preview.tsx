'use client';

import * as React from 'react';
import { ExternalLink, Eye, Link as LinkIcon, Loader2 } from 'lucide-react';

import type { PreviewResult } from '@/lib/preview/types';
import { Button } from '@/components/ui/button';

function getThumbnailUrl(url: string) {
  const encoded = encodeURIComponent(url);
  return `https://image.thum.io/get/width/1200/${encoded}`;
}

function OpenRow({ url, badge }: { url: string; badge: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
      <span className="rounded-full border border-border/60 bg-background/50 px-2.5 py-1">{badge}</span>
      <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
        <ExternalLink className="h-3.5 w-3.5" />
        Open
      </a>
    </div>
  );
}

export function SmartLinkPreview({
  url,
  title,
  thumbnailUrl,
}: {
  url: string;
  title: string;
  thumbnailUrl?: string | null;
}) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<PreviewResult | null>(null);
  const [iframeLoaded, setIframeLoaded] = React.useState(false);
  const [forceFallback, setForceFallback] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    setResult(null);
    setIframeLoaded(false);
    setForceFallback(false);
    (async () => {
      const absoluteForFetch =
        url.startsWith('http://') || url.startsWith('https://')
          ? url
          : `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;
      try {
        const res = await fetch('/api/preview/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: absoluteForFetch }),
        });
        const data = (await res.json()) as PreviewResult;
        if (typeof (data as any).ok === 'boolean' && !(data as any).ok) {
          setError((data as any).error || 'Preview mislukt');
          return;
        }
        if (!res.ok) {
          setError('Serverfout');
          return;
        }
        setResult(data);
      } catch (e: any) {
        setError(e?.message || 'Preview mislukt');
      } finally {
        setLoading(false);
      }
    })();
  }, [url]);

  React.useEffect(() => {
    setIframeLoaded(false);
    setForceFallback(false);
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Link analyseren en best passende weergave kiezen…
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!result || typeof (result as any).ok !== 'boolean' || !(result as any).ok) {
    return <p className="text-sm text-muted-foreground">Geen preview.</p>;
  }

  const r = result as Extract<PreviewResult, { ok: true }>;

  if (r.kind === 'web') {
    const canWebIframe = !forceFallback;
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <LinkIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{url}</span>
            <span className="shrink-0 rounded-full border border-border/60 bg-background/50 px-2 py-0.5 text-[10px]">Website / webapp</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={url} target="_blank" rel="noreferrer">
                Open
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setForceFallback((v) => !v)}>
              <Eye className="h-4 w-4" />
              {canWebIframe ? 'Thumbnail' : 'IFrame'}
            </Button>
          </div>
        </div>
        {canWebIframe ? (
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/50">
            {!iframeLoaded && (
              <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 text-xs text-muted-foreground">
                <span>Preview laden… (sommige sites blokkeren iframes)</span>
                <Button variant="outline" size="sm" onClick={() => setForceFallback(true)}>
                  Thumbnail
                </Button>
              </div>
            )}
            <iframe src={url} title={title} className="h-[60vh] w-full" onLoad={() => setIframeLoaded(true)} />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/50">
            <img
              src={thumbnailUrl || getThumbnailUrl(url)}
              alt={title}
              className="h-[60vh] w-full object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>
    );
  }

  if (r.kind === 'pdf') {
    return (
      <div className="space-y-3">
        <OpenRow url={url} badge="PDF" />
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/50">
          <iframe src={url} title={title} className="h-[60vh] w-full" />
        </div>
      </div>
    );
  }

  if (r.kind === 'image') {
    return (
      <div className="space-y-3">
        <OpenRow url={url} badge="Afbeelding" />
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/50">
          <img src={url} alt={title} className="h-[60vh] w-full object-contain" />
        </div>
      </div>
    );
  }

  if (r.kind === 'video') {
    return (
      <div className="space-y-3">
        <OpenRow url={url} badge="Video" />
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/50">
          <video src={url} className="h-[60vh] w-full" controls />
        </div>
      </div>
    );
  }

  if (r.kind === 'docx_html') {
    return (
      <div className="space-y-3">
        <OpenRow url={url} badge={r.label} />
        <div
          className="docx-preview max-h-[60vh] overflow-y-auto rounded-2xl border border-border/60 bg-background/80 p-4 text-sm leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-semibold [&_p]:mb-2 [&_ul]:ml-4 [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: r.html }}
        />
      </div>
    );
  }

  if (r.kind === 'xlsx_table' || r.kind === 'csv_table') {
    const { headers, rows, truncated } = r;
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {r.kind === 'xlsx_table' ? `Spreadsheet — ${r.sheetName}` : 'CSV tabel'}
            {truncated ? ' (ingekort)' : ''}
          </span>
          <a href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            Open / download
          </a>
        </div>
        {truncated ? <p className="text-xs text-amber-600">Eerste ~200 rijen in preview. Download het bestand voor alles.</p> : null}
        <div className="max-h-[60vh] overflow-auto rounded-2xl border border-border/60">
          <table className="w-full min-w-[500px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-background/90 backdrop-blur">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="whitespace-nowrap border-b border-border/60 p-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-muted/30">
                  {row.map((c, ci) => (
                    <td key={ci} className="max-w-xs border-b border-border/40 p-2 text-muted-foreground">
                      <span className="line-clamp-2">{c}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (r.kind === 'ipynb') {
    return (
      <div className="space-y-3">
        <OpenRow url={url} badge="Jupyter (.ipynb)" />
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {r.cells.map((c, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-background/50 p-3">
              {c.cellType === 'markdown' ? (
                <div className="whitespace-pre-wrap text-sm text-muted-foreground">{c.source}</div>
              ) : (
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">{c.language || 'code'}</p>
                  <pre className="max-h-56 overflow-auto rounded-lg bg-slate-950/85 p-3 text-xs text-slate-100">{c.source}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (r.kind === 'code') {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Code <span className="text-foreground/80">· {r.language}</span>
            {r.truncated ? ' (ingekort)' : ''}
          </span>
          <a href={url} className="text-primary hover:underline" target="_blank" rel="noreferrer">
            Open bron
          </a>
        </div>
        <pre className="max-h-[60vh] overflow-auto rounded-2xl border border-border/60 bg-slate-950/85 p-4 text-xs text-slate-100">{r.text}</pre>
      </div>
    );
  }

  if (r.kind === 'unsupported') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{r.message}</p>
        <p className="text-xs text-muted-foreground">
          Gedetecteerd: {r.mime} · {r.ext}
        </p>
        <Button asChild variant="outline" className="gap-2">
          <a href={url} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" />
            Open in nieuw tabblad
          </a>
        </Button>
        {thumbnailUrl ? (
          <div className="overflow-hidden rounded-2xl border border-border/60 opacity-80">
            <img src={thumbnailUrl} alt="" className="h-40 w-full object-cover" loading="lazy" />
          </div>
        ) : null}
      </div>
    );
  }

  return null;
}
