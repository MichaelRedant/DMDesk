# DMDesk – Agent Notes

## Project shape
- Frontend-only React + TypeScript (Vite).
- Data lives in `/public/books/**`. Monsters are split per-file under `public/books/Monsters` (and `Monsters (Alt)`).
- A manifest `public/monsters-manifest.json` lists all monster files; the app parses these on load.
- No backend; OpenAI calls happen client-side when used.

## Monster Browser
- Opens as an overlay; sidebar ~420px, list groups variants by root name, detail shows statblock/traits/lore in one view.
- Parsing is heuristic: pulls AC/HP/Speed/CR, ability table, traits/actions, images, and raw markdown.
- Variants are grouped by name; alternative sources merge fluff/images by name.

## Dev scripts
- `npm run dev` — Vite dev server.
- `npm run build` — typecheck + build.
- `npm run preview` — serve production build.

## Content paths
- Books: `/public/books/**`
- Monsters: `/public/books/Monsters/*.md` (+ `Monsters (Alt)`), manifest at `/public/monsters-manifest.json`.

## UX goals (current)
- Readable monster detail: show core stats/abilities upfront, markdown tables styled.
- Monster list responsive, variants grouped, quick selection chips in detail.
- Chat remains available; monster browser opens separately.
