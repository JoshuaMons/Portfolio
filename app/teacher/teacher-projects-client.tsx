'use client';

import * as React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import type { Project } from '@/types/portfolio';
import { Button } from '@/components/ui/button';
import { SmartLinkPreview } from '@/components/preview/smart-link-preview';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Item = {
  kind: 'evidence' | 'project';
  title: string;
  description: string;
  url: string | null;
  tags: string[];
  thumbnail_url: string | null;
  mini_project_token: string | null;
};

function toItem(p: Project): Item {
  return {
    kind: 'project',
    title: p.title,
    description: p.description,
    url: p.url,
    tags: p.tags ?? [],
    thumbnail_url: p.thumbnail_url,
    mini_project_token: p.mini_project_token ?? null,
  };
}

export function TeacherProjectsClient({ projects }: { projects: Project[] }) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<Item | null>(null);

  function openItem(item: Item) {
    setActive(item);
    setOpen(true);
  }

  const evidenceItem: Item = {
    kind: 'evidence',
    title: 'Projectdocumentatie (bewijs)',
    description:
      'Samenvatting van prompts → wat er gebouwd is, met verwijzingen naar code en testplan. Print / Save as PDF.',
    url: '/teacher/evidence',
    tags: ['bewijs', 'documentatie', 'samenvatting'],
    thumbnail_url: null,
    mini_project_token: null,
  };

  const projectItems = projects.map(toItem);

  const miniSrc =
    active?.mini_project_token != null
      ? `/api/mini-project/${active.mini_project_token}/index.html`
      : null;

  return (
    <>
      <div className="glass-surface rounded-3xl p-6 shadow-card">
        <h1 className="text-2xl font-semibold">Docentenportaal — projecten</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alleen gepubliceerde portfolio-projecten. Voor een samenvatting van alle technische wijzigingen (logboek + export), ga naar{' '}
          <Link href="/teacher/logbook" className="font-medium text-primary underline-offset-4 hover:underline">
            Logboek
          </Link>
          .
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[evidenceItem, ...projectItems].map((it) => (
          <button
            key={`${it.kind}:${it.title}`}
            type="button"
            onClick={() => openItem(it)}
            className="glass-surface group rounded-3xl p-5 text-left shadow-card transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold">{it.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{it.description}</p>
              </div>
              {it.url || it.mini_project_token ? (
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-70 group-hover:opacity-100" />
              ) : null}
            </div>
            {it.tags?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {it.tags.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
            {it.mini_project_token ? (
              <p className="mt-3 text-[10px] text-muted-foreground">Bevat ingepakte mini-site (HTML/CSS/JS).</p>
            ) : null}
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{active?.title ?? 'Project'}</DialogTitle>
            <DialogDescription>Bekijk een externe link, een meegeleverde mini-site, of beide.</DialogDescription>
          </DialogHeader>

          {active && (
            <>
              {active.mini_project_token && active.url ? (
                <Tabs defaultValue="extern">
                  <TabsList>
                    <TabsTrigger value="extern">Externe preview</TabsTrigger>
                    <TabsTrigger value="mini">Mini-site (lokaal)</TabsTrigger>
                  </TabsList>
                  <TabsContent value="extern" className="mt-4">
                    <SmartLinkPreview url={active.url} title={active.title} thumbnailUrl={active.thumbnail_url} />
                  </TabsContent>
                  <TabsContent value="mini" className="mt-4">
                    <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
                      <iframe title="Mini-project" src={miniSrc!} className="h-[72vh] w-full bg-white" />
                    </div>
                  </TabsContent>
                </Tabs>
              ) : active.mini_project_token ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-background">
                  <iframe title="Mini-project" src={miniSrc!} className="h-[72vh] w-full bg-white" />
                </div>
              ) : active.url ? (
                <div className="mt-4 space-y-3">
                  {active.kind === 'evidence' ? (
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => window.open(active.url!, '_blank', 'noopener,noreferrer')}>
                        Print / Save as PDF
                      </Button>
                    </div>
                  ) : null}
                  <SmartLinkPreview url={active.url} title={active.title} thumbnailUrl={active.thumbnail_url} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Geen preview beschikbaar.</p>
              )}

              <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">{active.description}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
