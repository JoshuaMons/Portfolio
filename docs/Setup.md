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

## 2) Database schema + RLS
Open je Supabase dashboard → **SQL Editor** → run:
- [`supabase/schema.sql`](../supabase/schema.sql)

### Fix: `column profiles.contact_email does not exist`
Als je deze error ziet, run dan opnieuw `supabase/schema.sql`.
Het schema bevat nu een **idempotente** patch:
- `alter table public.profiles add column if not exists contact_email text;`

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

