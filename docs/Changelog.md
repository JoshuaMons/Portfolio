# Changelog

## 2026-04-23
- Next.js app omgebouwd naar portfolio basis (light gradients + glass surfaces)
- shadcn/ui-style primitives toegevoegd (`Button`, `Dialog`, `Tabs`, inputs)
- Supabase schema + RLS SQL toegevoegd: [`supabase/schema.sql`](../supabase/schema.sql)
- Login + `/admin` route protection via `middleware.ts`
- Admin shell + eerste CRUD: `/admin/projects`
- Public pages: home, projects (met modal preview), about, timeline, blog, contact

## 2026-04-23 (later)
- Publieke pagina’s dynamisch gemaakt (nieuwe content direct zichtbaar)
- Admin profiel toegevoegd: `/admin/profile` + `profiles` table
- Globale navbar toegevoegd met:
  - Gradient shader (interactief)
  - Light/Dark toggle
  - Centered logo “Joshua’s Portfolio” (klikbaar naar Home)
- Handleiding toegevoegd als Word-openbaar RTF: `docs/Handleiding-voor-dummies.rtf`

