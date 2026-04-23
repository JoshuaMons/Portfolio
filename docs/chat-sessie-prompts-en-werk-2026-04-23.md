# Chat-sessie — prompts en uitgevoerd werk  
**Datum:** 23 april 2026  
**Let op:** De onderstaande prompts zijn een **inhoudelijke reconstructie** van wat in deze (en aansluitende) Cursor-sessies aan de orde kwam. Exacte letterlijke citaten zijn niet uit een volledig transcript overgenomen.

---

## 1. Samenvatting van jouw vragen / opdrachten (vandaag)

### A. Plan implementeren — mini-uploads, cache, docent
- Implementeer het plan **“Mini-uploads in lijst, home refresh, docent-koppelingen”** (zoals in het planbestand beschreven).
- Bewerk het planbestand zelf niet.
- Gebruik de bestaande to-do’s: markeer ze onderweg, begin bij de eerste, werk alles af.

### B. Git: commit & push
- Vraag of er niet gecommit en gepusht moest worden na de wijzigingen.

### C. Docent-navigatie & docentenportaal
- Pas de **navigatiebalk** aan: **Docent rechtsboven**, met **uitlogknop**.
- Zorg dat **uploads** en **projecten** op de docentpagina **dezelfde soort presentatie** hebben (één overzicht).
- **Pushen** wanneer klaar.

### D. Publieke site — projecten & uploads
- Alle **uploads zichtbaar op de website onder alle projecten**.
- **Homepage:** laatste projecten up-to-date met alle projecten, **maximaal 5** tegelijk, met **paginering** die **dynamisch** meer laadt als dat nodig is.

### E. Mobiel & projecten met bestanden
- Maak de **app/website mobielvriendelijk** en laat de UI **mee schalen** met schermgrootte.
- Bij **nieuw project**: kunnen **kiezen uit een geüpload bestand**; als **URL leeg** is, moet dat bestand de **preview-URL vervangen**.
- **Projecten moeten altijd worden aangemaakt** bij een **upload** in dat formulier.
- **Pushen** wanneer klaar.

### F. Dit document
- Maak een **downloadbaar document** met:
  - een samenvatting van **alle prompts die je vandaag hebt gegeven**, en  
  - een samenvatting van **wat er als antwoord is gedaan**.

---

## 2. Samenvatting van het uitgevoerde werk (responses / code)

### 2.1 Mini-uploads, revalidatie, docent-koppelingen (plan)
- Gedeelde **`revalidatePortfolioContent`** (o.a. `/`, `/projects`, `/files`, `/teacher`, admin-routes).
- **`files`-rij bij mini-ZIP-import** + schema **`files.mini_project_id`**, delete-pad voor mini+bundle.
- Admin **uploads**: highlight via query, Suspense rond `useSearchParams`, mini-badge.
- **Docent-opdrachten**: sectie gedeelde bestanden, optioneel **`attached_file_id`**, formulier + refresh.
- **`docs/Setup.md`**: migratie-uitleg.
- Imports/typefixes, **`npm run build`** groen; commits/pushes naar `main`.

### 2.2 Navbar & docentenportaal
- **“Docent view”** van links in de topbalk **gehaald**; docent-acties **rechts** (met **Uitloggen** + e-mailpill waar relevant).
- **Mobiel**: thema + auth in aparte rij; dubbele thema-knop in de bovenste balk vermeden (`md:flex` voor desktop-cluster).
- **Docentenportaal (`/teacher`)**: projecten en **API `/api/teacher/files`** in **één kaart-grid**, gesorteerd op datum; bestanden met **mini-token** uit join voor preview waar van toepassing.

### 2.3 Publieke projecten & uploads op de site
- **`GET /api/projects/public`**: offset/limit met **limit+1** voor “meer laden”.
- **Home**: eerste **5** projecten + knop **“Meer projecten laden”** (client).
- **Projectenpagina**: sectie **“Bestanden & uploads”** onder de projecten, zelfde bron als **`/api/files/public`**; gedeelde **`PublicFilesGallery`** met o.a. mini-tabs waar nodig.
- **Files public API**: o.a. **`mini_projects(token, show_on_website)`** voor veilige mini-token in de response.

### 2.4 Mobiel, viewport, dialogen, admin-project + bestand
- **`viewport`** in root layout + **`overflow-x-hidden`** op `body`.
- **Dialog**: scrollbaar, bijna volle breedte op kleine schermen.
- **Admin-shell** / **navbar**: `min-w-0`, responsive padding, minder overlap op smalle schermen.
- **Admin projecten**:
  - dropdown **bestaande uploads**;
  - **nieuwe file-upload** in het formulier → **storage + `files`**, daarna **altijd project-upsert**;
  - lege URL → **`/api/files/stream/{id}`**;
  - **`GET /api/files/stream/[id]`** → 302 naar signed URL voor **publiek zichtbare** bestanden;
  - **rollback** (storage + file) als het project daarna faalt;
  - titel mag afgeleid worden van bestand/mini/gekozen rij waar passend.

### 2.5 Versiebeheer
- Wijzigingen zijn **gecommit en naar `origin/main` gepusht** (meerdere commits over de sessie heen).

---

## 3. Downloaden

- **Lokaal:** bestand staat in de repo als  
  `docs/chat-sessie-prompts-en-werk-2026-04-23.md`  
  → open in VS Code / Cursor en gebruik *Save As…*, of kopieer naar PDF via print.
- **Na push op GitHub:** raw download via de repository-URL naar dit pad.

---

*Gegenereerd als onderdeel van de chat-sessie; inhoud van prompts is samengevat, niet woordelijk gearchiveerd.*
