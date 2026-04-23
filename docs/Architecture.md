# Architectuur

## Stack
- Next.js (App Router) + Tailwind + shadcn/ui patterns
- Supabase (Auth + Postgres + RLS)
- Hosting: Vercel

## Routing (high level)
- Public:
  - `/` home
  - `/projects` projectenoverzicht + modal previews
  - `/blog` logboek
  - `/timeline` voortgang
  - `/about`, `/contact`
- Privé:
  - `/login`
  - `/admin/*` (alleen jouw account)

## Auth & toegang
- Route bescherming via [`middleware.ts`](../middleware.ts) voor `/admin/*`
- Database security via RLS policies (zie [`supabase/schema.sql`](../supabase/schema.sql))

## Data flow (project preview)
```mermaid
flowchart TD
  Admin[AdminUI] -->|upsert project| DB[SupabaseDB]
  Public[ProjectsPage] -->|select published| DB
  Public --> Modal[ProjectModal]
  Modal -->|try iframe| Iframe[iframe preview]
  Modal -->|fallback| Thumb[thumbnail preview]
  Thumb --> Provider[thum.io]
```

