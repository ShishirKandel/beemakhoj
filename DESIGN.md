# BeemaKhoj — design brief v2 "calm & elegant" (all build agents follow this)

Product: **BeemaKhoj** ("insurance search") — a demo comparison site for ordinary people in Nepal,
also shown to sponsors/investors. Audience: families, first-time buyers, bike owners, migrant workers,
farmers' children helping parents; many on phones, many not finance-literate. Primary job: pick what to
protect -> answer 2-3 questions incl. budget -> see matching policies from every licensed insurer ->
compare -> contact.

Stack: static HTML + Tailwind Play CDN (config in index.html) + vanilla JS + Lucide icons
(`UI.icon('name', cls)`, `UI.icons()` is called by the router after each render). No build step, no
frameworks, no new libraries. Views are IIFEs: `window.Views.<name> = { title, render(params, query) -> html, mount(root, params, query) }`.

## Direction
Calm, premium, trustworthy — the feel of a well-run private bank, not a coupon site. Elegance comes from
**whitespace, restraint and typography**, not decoration. Mostly white and mist surfaces, deep navy ink,
one quiet brand red used as a signature, emerald for good news, muted gold for awards. Nothing shouts.
v1 problems we are fixing: heavy/quirky display type, borders around everything, crimson on every
button, rainbow insurer initials, busy hero with 16 tiles, cramped vertical rhythm.

## Tokens (Tailwind names from index.html; CSS vars in app.css)
- `ink` #0F1B2D (headings, primary buttons, dark bands) · `ink-soft` #4A566B (body copy) · `ink-mute` #7A8599 (meta, captions)
- `white` main surface · `mist` / `paper` #F5F7FA alternate section background · `sky` #EEF2F7 quiet fills (icon wells, hover) · `sky-deep` #DCE3EC
- `line` #E6EAF0 hairlines (1px only) · `line-strong` #D3DAE3 input borders
- `crimson` #C8102E — BRAND SIGNATURE ONLY: the logo mark, a 2px active indicator, the progress bar fill, error text. **Never** a button fill.
- `pine` #0E7A5F / `pine-tint` — within budget, verified, savings, "Best" markers.
- `marigold-ink` #7A5512 text on `marigold-tint` #FBF5E9 — award badges ("Lowest premium", "Best claim record").
- Shadows: `shadow-float` only for floating things (hero search bar, sticky premium card, popovers, mega menu); `shadow-overlay` for modal/tray. Ordinary cards have NO shadow — hairline border or just a mist background.

## Typography
One family: **Instrument Sans** (Latin) with **Mukta** as the automatic Devanagari fallback
(`font-sans` and `font-display` both resolve to it). Never use `font-extrabold`/`font-black`.
Scale (desktop / mobile):
- Display H1 (home only): 56/40px, `font-semibold`, `tracking-tightest` (-0.035em), `leading-[1.04]`
- Page H1: 40/32px, `font-semibold`, `tracking-tight`
- Section H2: 30/26px, `font-semibold`, `tracking-tight`
- H3 / card title: 18-20px `font-semibold`
- Body 16-17px `text-ink-soft` leading-relaxed; long-form 18px.
- Meta 13-14px `text-ink-mute`. Nepali labels small, `text-ink-mute`, after the English.
- Money: `font-semibold tabular-nums tracking-tight`; the monthly figure is the hero number (28-32px in result rows), the yearly figure small beneath.
Line length ≤ 70ch for paragraphs.

## Layout & rhythm
- Container `max-w-page mx-auto px-5 sm:px-8`. Left-aligned. Section padding `py-20 sm:py-28` on marketing pages, `py-10 sm:py-14` on app pages (results/compare/policy).
- Spacing steps 4/8/12/16/24/32/48/64/96. Prefer more space over more lines.
- Radius hierarchy: controls (buttons, inputs, seg) `rounded-[10px]`; cards/panels `rounded-2xl` (16px); hero search bar `rounded-2xl`; pills/chips `rounded-full`. Never mix arbitrary radii.
- Separation order of preference: whitespace → background change (white ↔ mist) → single hairline. Avoid boxes inside boxes.
- Icons: Lucide at `w-5 h-5` (stroke 1.75 via CSS), ink-soft colour, sitting in a 40px `bg-sky rounded-xl` well only where an icon labels a category.

## Components (defined in css/app.css — use them, do not redefine in views)
- `.btn` (44-48px tall, 10px radius, 15-16px semibold). Variants: `.btn-primary` = ink filled (the main action), `.btn-dark` = same as primary (kept for compatibility), `.btn-ghost` = white with `line-strong` hairline, `.btn-quiet` = text button, `.btn-sm` 40px. `.is-on` pressed state (ink outline + sky fill). `.btn-light` = white filled (for use on ink bands).
- `.chip` small pill, 12-13px medium. `.badge-award` (marigold-ink on marigold-tint with a small award icon), `.badge-good` (pine on pine-tint).
- `.field` label wrapper: label 13-14px medium ink-soft; inputs 48px, `line-strong` border, 10px radius, focus = ink border + 4px sky ring.
- `.seg` segmented control: mist track, selected = white pill with `shadow-float`-lite and ink text.
- `.co-mark` insurer initials — MONOCHROME: `sky` background, ink text, semibold, rounded-xl. (`UI.avatar` no longer uses rainbow colours.)
- `.panel` white, `line` hairline, rounded-2xl, no shadow. `.panel-float` adds `shadow-float`.
- `.prose-nk` long-form (18px, 1.75 line-height, h2 26px semibold, generous margins, quiet tables with hairlines).
- `.eyebrow-pill` an optional small quiet pill above a hero headline (sentence case, never ALL CAPS).
- `.callout` mist note block (16px radius) for notes, "In short" summaries and empty states. `.link-inline` the one inline-link style (ink, thin underline; works on dark bands too).
- `.skip-link`, `.toast`, `.modal`, `.tray`, header/footer chrome — ui.js.

## Rules (still binding)
- Avoid: ALL-CAPS labels, "→" glued to button text, gradient washes, glassmorphism, rainbow colour coding, emoji, stock-photo placeholders, numbered 01/02/03 markers unless it is a real sequence (quote steps and "how it works" are).
- Sentence case. Plain words ("cover", "what you pay"). Buttons say what happens: "Compare plans", "See my options", "Compare", "Get a call back".
- Money via `Engine.npr` / `Engine.nprShort`. Premiums are estimates: say "est." and link `#/about` once per results/policy page.
- Accessibility: real buttons/links, labels on inputs, visible `:focus-visible` ring, aria-live for changing counts, `prefers-reduced-motion` respected, touch targets ≥ 44px, no horizontal page scroll at 360px.
- Motion: one orchestrated moment (home hero fade/rise on load). Otherwise only responsive motion (popover, accordion, tray, toast) at 150-250ms ease-out.
- Never print "undefined"/"null"/"NaN"; guard optional data. All data strings through `UI.esc`.

## Page concepts
**Header**: white at 85% opacity with backdrop blur, 72px tall, hairline bottom. Logo = small crimson mark + "BeemaKhoj" wordmark (semibold, tight) with "बीमा खोज" tiny beneath. Nav links 15px medium ink-soft, active = ink + 2px crimson underline. Right: Shortlist (quiet, heart icon + count) and "Get a call back" (`.btn-primary`, ink). Mega menu: floating panel, 3 columns of groups.

**Home**:
```
HERO (white)                                                       
 [quiet pill: Comparing 35 licensed insurers in Nepal]              [ Live preview card (panel-float) ]
 H1 56px: Insurance in Nepal, finally easy to compare.             [ Term life · Rs 25 lakh · age 30  ]
 sub 18px ink-soft (1-2 lines)                                     [ row: mark  policy / insurer  Rs x/mo ]
 ┌─ search bar (panel-float, rounded-2xl) ───────────────────────┐ [ row …  (Lowest premium badge)       ]
 │ What to protect [select w/ optgroups] │ Budget Rs [____] [/month|/year] │ (Compare plans) │ [ row …                              ]
 └───────────────────────────────────────────────────────────────┘ [ caption: live estimate from our data ]
 popular chips: Term life  Health  Bike  Car  Travel  Foreign employment
STATS strip (hairlines top/bottom): 35 insurers | 216 policies | 16 types of cover | Rs 0 to use
COVER TYPES (mist bg): H2 + 6 group cards (white, hairline) each: icon well, group name, categories as links
HOW IT WORKS (white): 3 columns, small numbered marks, short copy
INSURERS: monochrome wall of short names in a hairline grid → "See all insurers"
FAQ (mist): 2 columns — heading left, accordion right
CTA band (ink): "Prefer to talk to someone?" + `.btn-light` Get a call back; trust notes beneath in white/70
```
The live preview uses real `Engine.match('term-life', {age:30,sumAssured:2500000,term:20})` top 3 rows.

**Quote flow**: single centered column (max-w-xl). Top: back link, category icon + name, thin crimson progress bar with "Step 2 of 4". Question 32px semibold, one helper line, answers as large selectable option cards/pills (white, line-strong, selected = ink border + sky fill + check), Continue as `.btn-primary`. Generous whitespace; feels like a calm conversation.

**Results**: page header on mist: H1 + one-line summary of answers + "Edit answers" quiet button + est. note. Body on white: left filter rail (no outer box; sections separated by spacing and small headings), right list of result cards (white, hairline, rounded-2xl, hover = line-strong). Card: monochrome mark, insurer name small above policy name 18px; 2-3 features as quiet inline list; badges; right column premium 28px semibold + "/month est." and yearly small; actions: View details (`.btn-primary btn-sm`), Compare (`.btn-ghost btn-sm` toggle), save (icon button). Fit shown as a small dot + text (pine within, gold stretch, ink-mute over).

**Policy detail**: header on mist with breadcrumb, mark, H1 40px, insurer, chips. Two columns on white: content left (sections with H2 22px, checklists with pine check icons, definition-list eligibility), sticky premium card right (`panel-float`): big monthly figure, recalculator fields, primary "Get a call back", compare/save. Similar policies as 3 quiet cards.

**Compare**: H1 + actions row. Clean table: sticky header cards per policy, row group labels in small medium ink-mute on mist, hairline rows only, no zebra. Best value = pine dot + "Best". First column sticky on mobile with table-scoped horizontal scroll.

**Insurers directory**: H1 + intro; toolbar (search, seg filter with count pills, sort). Clean hairline table (desktop) / stacked list (mobile); monochrome marks; claim ratio as number + slim pine bar. **Insurer detail**: mist header with large mark, name, chips, about; facts as a 3-4 column definition grid with hairline separators; contact block; products grouped by category as hairline lists.

**Learn**: editorial. Hub: H1 + intro, one featured guide (ink band card) + list of guides with one-line descriptions, hairline separated. Article: max 68ch, 18px body, "In short" summary in a mist panel, CTA panel at end, related guides list.

**About / 404**: same editorial treatment as Learn.

**Footer**: ink background, generous padding, 4 columns (Compare, Learn, Company, Regulator), small white/60 text, a hairline (white/10) then disclaimer + "Data updated …".

## Shared APIs (do not change signatures)
- `Engine` (js/engine.js): `DATA {companies, policies, context, builtAt}`, `CATEGORIES`, `GROUPS`, `category(id)`,
  `company(id)`, `policy(id)`, `policiesFor(cat)`, `policiesOfCompany(id)`, `npr`, `num`, `words`,
  `nprShort`, `estimate(policy, profile)` -> `{annual, monthly, perTrip, eligible, notes[], basis}`,
  `match(cat, profile, {budget:{amount,period}, sort})` -> `[{policy, company, est, fit}]` where fit ∈
  within|ok|stretch|over|ineligible, `sortResults(list, sort)` sort ∈ recommended|price|claims|bonus|name,
  `badges(list)` -> `{policyId: [labels]}`, `motorKind(policy)` -> third-party|comprehensive,
  `Store` (compare tray max 3 same-category, saved shortlist, per-category profile memory).
- `UI` (js/ui.js): `esc`, `icon(name, cls)`, `icons()`, `avatar(company, sizeCls)`, `confidence(level)`,
  `chip(text, cls)`, `toast(msg, kind)`, `modal(html,{label})`, `bindCompare(scope)`
  (wires `[data-compare=policyId]` and `[data-save=policyId]` buttons), `openCallback(policyId)`,
  `breadcrumb(trail, current)` (Home › … › current), `notFoundPage({title, body, actions, eyebrow, note, icon})` (the one not-found layout),
  `CHIP_ON_MIST` (chip class for chips on mist headers), `confDot(level)`.
- `Router` (js/router.js): `Router.go('#/results/health?age=30')`, `Router.qs(obj)`.

## Routes and the profile query string
`#/quote/:cat` collects answers, then navigates to `#/results/:cat?<Router.qs(profile)>` with keys:
`age, sumAssured, term, coverAmount, vehicleValue, cc, coverType (any|third-party|comprehensive),
tripDays, propertyValue, budget (number), period (monthly|yearly), sort`. Results page reads the same
keys, so a results URL is shareable. Missing keys fall back to `Engine.category(cat).defaults`.
Home search bar navigates to `#/quote/<cat>?budget=..&period=..` (budget optional).

## Data facts
`DATA.context` holds: regulator, taxBenefits, motorThirdPartyTariff, motorComprehensiveRate,
governmentHealthInsurance, foreignEmploymentInsurance, agricultureInsurance, marketStats,
claimProcess {life, health, motor}, glossary [{term, termNe, meaning}], faqs [{q,a}], tips, sources.
Any field may be missing. Company optional fields may be missing — omit the row. Only the 14 life
insurers have `claimSettlementRatio` (+ `claimSettlementNote`); claim UI must stay data-conditional.
Reinsurers have no retail policies: directory only, never in results.
