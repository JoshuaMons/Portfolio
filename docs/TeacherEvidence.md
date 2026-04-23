# Projectdocumentatie (docenten) — Joshua’s Portfolio

Deze pagina is bedoeld als **bewijs/onderbouwing** voor docenten.  
Opzet: **samenvatting van de prompt** → **wat er gebouwd/gewijzigd is** → **waar je dit terugziet in de code/app**.

## 1) Projectdoel
Een modern portfolio-dashboard (Next.js App Router) dat je kunt hosten op Vercel, met:
- Publieke portfolio-pagina’s (projects, timeline, about, contact, etc.)
- Beveiligd admin-portal (alleen de eigenaar) om content te beheren
- Docenten-view (zelfde portfolio + extra docent-opdrachten tab)
- Supabase als backend (Auth + Postgres + Storage)

## 2) Belangrijkste features (bewijs)

### A) Admin uploads (Supabase Storage + DB metadata)
- **Prompt-samenvatting**: “Maak admin file uploads (Word/Excel/PPT/foto/video/db/csv/etc.), sla bestanden op in Supabase Storage en metadata in DB, en toon public files op de site met cards + modal previews.”
- **Wat is gebouwd**:
  - Admin kan bestanden uploaden via `/admin/uploads` naar **Supabase Storage bucket `uploads`**.
  - Er is een `files` metadata tabel in Postgres met o.a. titel, tags, mime-type, size en `visibility` (public/private).
  - Publieke pagina `/files` toont public uploads als cards en kan previews tonen (image/video/pdf) + download.
- **Waar in de code**:
  - Schema + RLS: `supabase/schema.sql` (tabel `public.files`)
  - Admin UI: `app/admin/uploads/page.tsx`
  - Public UI: `app/files/page.tsx`, `app/files/files-client.tsx`
  - Signed URLs API (server): `app/api/files/public/route.ts`

### B) Docenten login + docenten portfolio (extra tab)
- **Prompt-samenvatting**: “Docenten moeten vanaf de homepage kunnen inloggen en een teacher-variant van het portfolio zien met een extra tab ‘Docent opdrachten’.”
- **Wat is gebouwd**:
  - Docenten login route: `/teacher/login`
  - Docenten portfolio route: `/teacher` met tabs:
    - Projecten (publiek gepubliceerde projecten)
    - Docent opdrachten (teacher assignments vanuit DB)
- **Waar in de code**:
  - Teacher UI: `app/teacher/teacher-portfolio-client.tsx`
  - Middleware bescherming: `middleware.ts` (gated via `TEACHER_USER_ID`)

### C) Auth UX: naam tonen in topbalk + docenten knop
- **Prompt-samenvatting**: “Als je ingelogd bent en teruggaat naar `/`, blijf je ingelogd en moet de topbalk je naam tonen i.p.v. ‘Admin’. Voeg ‘Docenten login’ toe in de topbalk.”
- **Wat is gebouwd**:
  - Navbar is “auth-aware”: toont **naam** (uit `profiles.full_name`, fallback email) als ingelogd.
  - Laat altijd ook een duidelijke “Docenten” login entry zien wanneer niet ingelogd.
- **Waar in de code**:
  - Navbar: `components/site/site-navbar.tsx`
  - Auth state: `components/site/auth-status.tsx`

### D) Admin overzicht: laatste updates + stats
- **Prompt-samenvatting**: “Maak `/admin` overzicht met audit logs (laatste updates) en snelle statistieken.”
- **Wat is gebouwd**:
  - `/admin` toont counts (projects, teacher assignments, files) + laatste 10 audit log regels.
- **Waar in de code**:
  - `app/admin/page.tsx`
  - Logging helper: `lib/audit-log.ts`

### E) Database fix: `profiles.contact_email` mismatch
- **Prompt-samenvatting**: “Fix error: `column profiles.contact_email does not exist`, ook als schema opnieuw runnen niet lijkt te helpen.”
- **Wat is gebouwd**:
  - Schema bevat nu een **idempotente patch** zodat re-run veilig is:
    - `alter table public.profiles add column if not exists contact_email text;`
- **Waar in de code**:
  - `supabase/schema.sql`
  - Extra uitleg: `docs/Setup.md`

## 3) Testplan (hoog niveau)
- Upload in `/admin/uploads` → item verschijnt in admin lijst.
- Zet `visibility = public` → item verschijnt op `/files` + preview werkt.
- Login als docent → `/teacher` werkt + extra tab “Docent opdrachten”.
- Login als admin → navbar toont naam op `/`.
- Run `supabase/schema.sql` → contact_email error is weg.

## 4) Laatste updates (bijhouden)
- Houd `docs/Changelog.md` bij met korte bullets.
- Werk daarna dit doc bij met 3–8 regels per feature (prompt-samenvatting → wat gebouwd).

