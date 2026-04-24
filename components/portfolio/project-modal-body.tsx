'use client';

import * as React from 'react';

import { SmartLinkPreview } from '@/components/preview/smart-link-preview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type ProjectModalFields = {
  title: string;
  description: string;
  url: string | null;
  tags: string[];
  thumbnail_url?: string | null;
  mini_project_token?: string | null;
  /** `page` = alleen preview-blok (geen dubbele samenvatting-tab; gebruik op projectdetailpagina). */
  variant?: 'modal' | 'page';
};

/** Mini-site eerst; bij niet-OK response automatisch externe preview. */
function DualUrlAndMiniPreview({
  url,
  title,
  thumbnail_url,
  miniSrc,
}: {
  url: string;
  title: string;
  thumbnail_url: string | null | undefined;
  miniSrc: string;
}) {
  const [tab, setTab] = React.useState<'mini' | 'extern'>('mini');

  React.useEffect(() => {
    let cancelled = false;
    fetch(miniSrc, { credentials: 'include', cache: 'no-store' })
      .then((r) => {
        if (!cancelled && !r.ok) setTab('extern');
      })
      .catch(() => {
        if (!cancelled) setTab('extern');
      });
    return () => {
      cancelled = true;
    };
  }, [miniSrc]);

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as 'mini' | 'extern')}>
      <TabsList>
        <TabsTrigger value="mini">Mini-site</TabsTrigger>
        <TabsTrigger value="extern">Externe preview</TabsTrigger>
      </TabsList>
      <TabsContent value="mini" className="mt-4">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
          <iframe title="Mini-project" src={miniSrc} className="h-[min(72vh,640px)] w-full bg-white sm:h-[72vh]" />
        </div>
      </TabsContent>
      <TabsContent value="extern" className="mt-4">
        <SmartLinkPreview url={url} title={title} thumbnailUrl={thumbnail_url ?? null} />
      </TabsContent>
    </Tabs>
  );
}

function ProjectPreviewCore(p: Omit<ProjectModalFields, 'variant'>) {
  const miniSrc =
    p.mini_project_token != null ? `/api/mini-project/${p.mini_project_token}/index.html` : null;

  if (p.mini_project_token && p.url) {
    return (
      <DualUrlAndMiniPreview
        url={p.url}
        title={p.title}
        thumbnail_url={p.thumbnail_url}
        miniSrc={miniSrc!}
      />
    );
  }
  if (p.mini_project_token) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
        <iframe title="Mini-project" src={miniSrc!} className="h-[min(72vh,640px)] w-full bg-white sm:h-[72vh]" />
      </div>
    );
  }
  if (p.url) {
    return <SmartLinkPreview url={p.url} title={p.title} thumbnailUrl={p.thumbnail_url ?? null} />;
  }
  return <p className="text-sm text-muted-foreground">Geen URL of mini-site voor preview.</p>;
}

/** Zelfde preview-patroon als docentenportaal / portfolio: externe link + optionele mini-site + samenvatting-tab. */
export function ProjectModalBody(p: ProjectModalFields) {
  const variant = p.variant ?? 'modal';
  if (variant === 'page') {
    return <ProjectPreviewCore {...p} />;
  }

  return (
    <Tabs defaultValue="preview">
      <TabsList>
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="details">Samenvatting</TabsTrigger>
      </TabsList>

      <TabsContent value="preview" className="mt-4">
        <ProjectPreviewCore {...p} />
      </TabsContent>

      <TabsContent value="details" className="mt-4">
        {p.tags?.length ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {p.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{p.description || '—'}</p>
      </TabsContent>
    </Tabs>
  );
}
