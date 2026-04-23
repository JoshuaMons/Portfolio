# Setup

## Vereisten
- Node.js (LTS)
- Een Supabase project (Database + Auth)

## 1) Env vars
Maak lokaal een `.env.local` in de project root (zie `.env.example`).

Verplicht:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_USER_ID` (jouw Supabase Auth user id)

Docent-login + logboek (server routes lezen admin-auditlogs via service role):
- `TEACHER_USER_ID` (Supabase Auth user id van het docent-account)
- `SUPABASE_SERVICE_ROLE_KEY` (ook nodig voor o.a. signed URLs op `/files`)

Zonder deze keys falen `/api/teacher/*` routes (opdrachten, audit-log, Word-export) met een duidelijke fout.

## 2) Database schema + RLS
Open je Supabase dashboard → **SQL Editor** → run:
- [`supabase/schema.sql`](../supabase/schema.sql)

### Fix: `column profiles.contact_email does not exist`
Als je deze error ziet, run dan opnieuw `supabase/schema.sql`.
Het schema bevat nu een **idempotente** patch:
- `alter table public.profiles add column if not exists contact_email text;`

### Mini-ZIP’s in de admin Uploads-lijst + docent-koppelingen
Na een schema-update moet je opnieuw `supabase/schema.sql` draaien in de SQL Editor. Het schema voegt (idempotent) toe:
- **`files.mini_project_id`** — verwijst naar `mini_projects(id)`; bij import van een mini-ZIP wordt naast `mini_projects` ook een **`files`**-rij aangemaakt zodat mini’s in dezelfde admin-lijst staan als gewone uploads. Verwijderen van zo’n rij ruimt ook de mini + storage op (best effort).
- **`teacher_assignments.attached_file_id`** — optionele FK naar `files(id)` voor een gekoppeld docent-bestand in het admin formulier.

### Storage: bucket `uploads`
Voor file uploads heb je een Supabase Storage bucket nodig:
- Bucket naam: `uploads`
- Visibility: **private**

## 3) Auth user aanmaken
In Supabase → **Authentication**:
- Maak je account aan (email + password)
- Kopieer jouw **User ID** en zet die in `ADMIN_USER_ID`

## 4) Run locally
```bash
npm install
npm run dev
```

Open daarna:
- `/` (home)
- `/projects` (public)
- `/login` → `/admin` (privé)

## 5) Public files pagina
De publieke pagina `/files` gebruikt een server API route om **signed URLs** te maken.
Daarvoor moet je op Vercel ook zetten:
- `SUPABASE_SERVICE_ROLE_KEY`

## 6) Docent logboek (admin audit trail)
Op `/teacher` heeft de tab **Logboek** een read-only weergave van `public.audit_logs` van de **portfolio-eigenaar** (`ADMIN_USER_ID`). De docent zelf kan die rijen niet direct via RLS lezen; de app gebruikt `/api/teacher/audit-logs` en `/api/teacher/audit-logs/export` na controle van de docent-sessie (`TEACHER_USER_ID`) en query met de service role.

Benodigde env vars: `ADMIN_USER_ID`, `TEACHER_USER_ID`, `SUPABASE_SERVICE_ROLE_KEY`, plus de standaard Supabase URL/anon key.

