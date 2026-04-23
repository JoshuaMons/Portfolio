'use client';

import * as React from 'react';
import { Download, FileText, Film, Image as ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type PublicFile = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  original_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  signed_url: string | null;
  updated_at: string;
};

function kind(mime: string | null, name: string) {
  const m = (mime ?? '').toLowerCase();
  const n = name.toLowerCase();
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('video/')) return 'video';
  if (m === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
  return 'file';
}

export function FilesClient({ initial }: { initial: PublicFile[] }) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<PublicFile | null>(null);

  function openItem(it: PublicFile) {
    setActive(it);
    setOpen(true);
  }

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initial.map((it) => {
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
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{it.description}</p>
                </div>
                <Icon className="h-4 w-4 text-muted-foreground opacity-70 group-hover:opacity-100" />
              </div>
              <p className="mt-4 truncate text-xs text-muted-foreground">{it.original_name}</p>
            </button>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{active?.title ?? 'Bestand'}</DialogTitle>
            <DialogDescription>Preview + download.</DialogDescription>
          </DialogHeader>

          {active && (
            <Tabs defaultValue="preview">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="preview">
                {!active.signed_url ? (
                  <p className="text-sm text-muted-foreground">Preview niet beschikbaar (signed URL ontbreekt).</p>
                ) : (
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

                    {(() => {
                      const k = kind(active.mime_type, active.original_name);
                      if (k === 'image') {
                        return (
                          <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/50">
                            <img src={active.signed_url} alt={active.title} className="h-[60vh] w-full object-contain" />
                          </div>
                        );
                      }
                      if (k === 'video') {
                        return (
                          <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/50">
                            <video src={active.signed_url} className="h-[60vh] w-full" controls />
                          </div>
                        );
                      }
                      if (k === 'pdf') {
                        return (
                          <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/50">
                            <iframe src={active.signed_url} title={active.title} className="h-[60vh] w-full" />
                          </div>
                        );
                      }
                      return (
                        <p className="text-sm text-muted-foreground">
                          Geen inline preview voor dit bestandstype. Gebruik Download.
                        </p>
                      );
                    })()}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{active.description}</p>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

