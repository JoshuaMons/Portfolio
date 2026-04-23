'use client';

import * as React from 'react';
import { Download, FileText, Film, Image as ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SmartLinkPreview } from '@/components/preview/smart-link-preview';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type PublicFile = {
  id: string;
  title: string;
  description: string | null;
  tags?: string[] | null;
  original_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  signed_url: string | null;
  updated_at: string;
  mini_project_token?: string | null;
};

function kind(mime: string | null, name: string) {
  const m = (mime ?? '').toLowerCase();
  const n = name.toLowerCase();
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('video/')) return 'video';
  if (m === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
  return 'file';
}

export function PublicFilesGallery({
  files,
  className,
}: {
  files: PublicFile[];
  /** bv. mt-8 voor /files, mt-0 als parent al marge geeft */
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<PublicFile | null>(null);

  function openItem(it: PublicFile) {
    setActive(it);
    setOpen(true);
  }

  const miniSrc =
    active?.mini_project_token != null
      ? `/api/mini-project/${active.mini_project_token}/index.html`
      : null;

  const isImage = active?.mime_type?.startsWith('image/');
  const isPdf = active?.mime_type === 'application/pdf';

  return (
    <>
      <div className={className ?? 'mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
        {files.map((it) => {
          const k = kind(it.mime_type, it.original_name);
          const Icon = k === 'image' ? ImageIcon : k === 'video' ? Film : FileText;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => openItem(it)}
              className="glass-surface group rounded-3xl p-5 text-left shadow-card transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">{it.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{it.description ?? ''}</p>
                </div>
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground opacity-70 group-hover:opacity-100" />
              </div>
              <p className="mt-4 truncate text-xs text-muted-foreground">{it.original_name}</p>
              {it.mini_project_token ? (
                <p className="mt-2 text-[10px] text-muted-foreground">Bevat interactieve mini-site.</p>
              ) : null}
            </button>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{active?.title ?? 'Bestand'}</DialogTitle>
            <DialogDescription>Preview, mini-site of download.</DialogDescription>
          </DialogHeader>

          {active && (
            <>
              {active.mini_project_token && active.signed_url ? (
                <>
                  <Tabs defaultValue="mini">
                    <TabsList>
                      <TabsTrigger value="mini">Mini-site</TabsTrigger>
                      <TabsTrigger value="preview">Bestand</TabsTrigger>
                    </TabsList>
                    <TabsContent value="mini" className="mt-4">
                      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
                        <iframe title="Mini-project" src={miniSrc!} className="h-[72vh] w-full bg-white" />
                      </div>
                    </TabsContent>
                    <TabsContent value="preview" className="mt-4">
                      {filePreviewBody(active, isImage, isPdf)}
                    </TabsContent>
                  </Tabs>
                  <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">{active.description ?? ''}</p>
                </>
              ) : active.mini_project_token ? (
                <>
                  <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-background">
                    <iframe title="Mini-project" src={miniSrc!} className="h-[72vh] w-full bg-white" />
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">{active.description ?? ''}</p>
                </>
              ) : active.signed_url ? (
                <Tabs defaultValue="preview">
                  <TabsList>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>
                  <TabsContent value="preview" className="mt-4">
                    {filePreviewBody(active, isImage, isPdf)}
                  </TabsContent>
                  <TabsContent value="details">
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{active.description ?? ''}</p>
                  </TabsContent>
                </Tabs>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Geen preview beschikbaar.</p>
                  <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">{active.description ?? ''}</p>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function filePreviewBody(active: PublicFile, isImage: boolean | undefined, isPdf: boolean | undefined) {
  if (!active.signed_url) {
    return <p className="text-sm text-muted-foreground">Signed URL ontbreekt.</p>;
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="truncate text-xs text-muted-foreground">{active.original_name}</p>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <a href={active.signed_url} target="_blank" rel="noreferrer">
            <Download className="h-4 w-4" />
            Download
          </a>
        </Button>
      </div>
      {isImage ? (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-background p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={active.signed_url} alt={active.title} className="mx-auto max-h-[60vh] w-auto max-w-full object-contain" />
        </div>
      ) : null}
      {isPdf ? (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
          <iframe title="PDF" src={active.signed_url} className="h-[72vh] w-full bg-white" />
        </div>
      ) : null}
      {!isImage && !isPdf ? <SmartLinkPreview url={active.signed_url} title={active.title} /> : null}
    </div>
  );
}

export function FilesClient({ initial }: { initial: PublicFile[] }) {
  return <PublicFilesGallery files={initial} />;
}
