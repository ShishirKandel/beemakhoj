# BeemaKhoj — design brief (all build agents follow this)

Product: **BeemaKhoj** ("insurance search") — a demo comparison site for ordinary people in Nepal.
Audience: middle-class families, first-time buyers, bike owners, migrant workers going abroad, farmers'
children helping parents. Many are on phones. Many are not finance-literate. Primary job: pick what to
protect -> answer 2-3 questions incl. budget -> see matching policies from every licensed insurer ->
compare -> contact.

Stack: static HTML + Tailwind Play CDN (config in index.html) + vanilla JS + Lucide icons
(`UI.icon('name')`, then `UI.icons()` is called by the router after each render). No build step, no
frameworks, no other libraries. Views are IIFEs that set `window.Views.<name> = { title, render(params, query) -> html string, mount(root, params, query) }`.

## Tokens (Tailwind colour names from index.html)
- `ink` #14213D (text, dark surfaces), `ink-soft` #3A4763, `ink-mute` #6B7590
- `paper` #F6F8FB page background (cool white — never cream), `line` #DDE3EC borders, `sky` #E8EEF7 / `sky-deep` #C9D6EA quiet surfaces
- `crimson` #C8102E — PRIMARY ACTIONS ONLY (main CTA buttons, active step). `crimson-dark` hover, `crimson-tint` bg
- `pine` #0F766E — good news: within budget, verified, savings. `pine-tint`
- `marigold` #E0A526 — badges ("Lowest premium", "Best claim record"). `marigold-tint`
Fonts: `font-display` = Bricolage Grotesque (headings, big numbers), `font-sans` = Mukta (body, Nepali text).
Nepali labels (`labelNe`, `nameNe`) are shown small beside English, in `text-ink-mute`.

## Signature element
No decorative bands or borders (the earlier Dhaka strip was removed at the client's request). Character comes from type, the crimson/pine/marigold accents and the hero tool itself.

## Rules
- Left-aligned layouts. Max width `max-w-page` (1200px), side gutter `px-4 sm:px-6`.
- Avoid: ALL-CAPS eyebrow labels, "→" glued to button text, gradient washes, identical rounded cards
  everywhere with soft grey shadows, colouring a single word in headlines, numbered 01/02/03 markers
  unless it is a real sequence (the quote flow steps are a real sequence).
- Hierarchy through type size/weight and spacing; borders `border-line`; radius: `rounded-xl` for
  panels, `rounded-lg` for inputs/buttons, `rounded-full` only for chips.
- Money: always `Engine.npr(n)` ("Rs 12,34,567") or `Engine.nprShort(n)` ("Rs 25 lakh"). Monthly figure
  shown with "/month", annual with "/year". Every premium is an estimate: label "est." and link to
  `#/about` methodology at least once per results page.
- Plain words: "cover" not "indemnity", "what you pay" not "premium outlay". Sentence case everywhere.
  Buttons say exactly what happens: "See my options", "Compare", "Get a call back".
- Accessibility: real `<button>`/`<a>`, labels on every input, visible focus (`:focus-visible` ring
  defined in app.css), aria-live for changing result counts, respects `prefers-reduced-motion`,
  touch targets ≥ 44px, works at 360px width with no horizontal scroll.
- Motion: one orchestrated moment only (the home hero tool loading in). Elsewhere only responsive
  motion (accordion open, tray slide-in, toast).

## Shared component classes (defined in css/app.css — use them, do not redefine)
- `.btn` base button; `.btn-primary` (crimson filled), `.btn-dark` (ink filled), `.btn-ghost`
  (bordered, ink text), `.btn-quiet` (text-only). `.btn-sm` smaller. `.is-on` pressed state for
  toggle buttons (compare/save).
- `.chip` small pill label (combine with tailwind bg/text colours).
- `.field` label wrapper: `<label class="field"><span>Label</span><input/></label>` — styles inputs/selects inside.
- `.seg` segmented control: `<div class="seg" role="radiogroup">` containing `<label><input type="radio"><span>Text</span></label>`.
- `.co-mark` insurer initials mark (from `UI.avatar(company)`).
- `.panel` white surface with `border-line` border and `rounded-xl` (use sparingly, not for every block).
- `.prose-nk` long-form article text styling for Learn pages.
- `.skip-link`, `.toast`, `.modal` handled by ui.js.

## Shared APIs (do not change signatures)
- `Engine` (js/engine.js): `DATA {companies, policies, context}`, `CATEGORIES`, `GROUPS`, `category(id)`,
  `company(id)`, `policy(id)`, `policiesFor(cat)`, `policiesOfCompany(id)`, `npr`, `num`, `words`,
  `nprShort`, `estimate(policy, profile)` -> `{annual, monthly, perTrip, eligible, notes[], basis}`,
  `match(cat, profile, {budget:{amount,period}, sort})` -> `[{policy, company, est, fit}]` where fit ∈
  within|ok|stretch|over|ineligible, `sortResults(list, sort)` sort ∈ recommended|price|claims|bonus|name,
  `badges(list)` -> `{policyId: [labels]}`, `motorKind(policy)` -> third-party|comprehensive,
  `Store` (compare tray max 3 same-category, saved shortlist, per-category profile memory).
- `UI` (js/ui.js): `esc`, `icon(name, cls)`, `icons()`, `avatar(company, sizeCls)`, `confidence(level)`,
  `chip(text, cls)`, `toast(msg, kind)`, `modal(html,{label})`, `bindCompare(scope)`
  (wires `[data-compare=policyId]` and `[data-save=policyId]` buttons), `openCallback(policyId)`.
- `Router` (js/router.js): `Router.go('#/results/health?age=30')`, `Router.qs(obj)`.

## Routes and the profile query string
`#/quote/:cat` collects answers, then navigates to `#/results/:cat?<Router.qs(profile)>` with keys:
`age, sumAssured, term, coverAmount, vehicleValue, cc, coverType (any|third-party|comprehensive),
tripDays, propertyValue, budget (number), period (monthly|yearly), sort`. Results page reads the same
keys, so a results URL is shareable. Missing keys fall back to `Engine.category(cat).defaults`.

## Data facts
`DATA.context` (market-context.json) holds: regulator, taxBenefits, motorThirdPartyTariff,
motorComprehensiveRate, governmentHealthInsurance, foreignEmploymentInsurance, agricultureInsurance,
marketStats, claimProcess {life, health, motor}, glossary [{term, termNe, meaning}], faqs [{q,a}], tips,
sources. Any field may be missing — code defensively. Company optional fields may be missing — never
print "undefined"; omit the row instead. Reinsurers (type "reinsurance") have no retail policies:
show them in the directory under their own group but never in results.
