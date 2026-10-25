# BeemaKhoj — insurance comparison for Nepal (demo)

**Live demo:** https://shishirkandel.github.io/beemakhoj/

A static demo site where ordinary people pick what they want to insure, set a budget, and compare
policies from every licensed insurer in Nepal.

## Run it
```
cd site
npx http-server -p 5178 -c-1      # or any static server, e.g. python -m http.server 5178
```
Open http://localhost:5178. No build step: HTML + Tailwind (CDN) + vanilla JS + Lucide icons.
An internet connection is needed for the Tailwind/Lucide CDNs and Google Fonts.

## What's inside
- `site/` — the website. `js/engine.js` (categories, premium estimates, matching, compare/shortlist state),
  `js/ui.js` (header, footer, compare tray, modals), `js/views/*` (one file per page), `css/app.css`.
  `DESIGN.md` is the design brief and shared component contract.
- `research/companies/*.json` — one file per insurer (company facts + retail policies), shaped per
  `research/SCHEMA.md`. `research/market-context.json` — tariffs, tax limits, claims steps, glossary, FAQs.
- `tools/build-data.mjs` — validates research files and regenerates `site/js/data.js`.
  Run `node tools/build-data.mjs` after editing any research file.

## Pages
Home (category picker + budget) → guided questions → results (filters, sort, budget fit, badges) →
policy detail (live recalculator) → side-by-side compare (up to 3). Plus insurer directory and detail
pages, 10 Learn guides (glossary, FAQ, motor tariff, tax, claims), About/methodology.

## Data honesty
Premiums are **indicative estimates** from a simple model (see About page), not insurer quotes.
Each company/policy carries a confidence label: Verified / Partly verified / Indicative. Before going
live, confirm product lists and premium tables with each insurer and replace estimates.
Call-back requests are stored only in the visitor's browser (no backend).

## Publishing (GitHub Pages)
The `site/` folder is served from the `gh-pages` branch. After changing anything in `site/`:
```
git add -A && git commit -m "..." && git push
git subtree push --prefix site origin gh-pages
```
