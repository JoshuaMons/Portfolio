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

