# UX references for a Nepal insurance comparison demo

Evidence key: **[F]** = observed in a WebFetch/WebSearch result this session (2026-10-25). **[K]** = general knowledge of these sites, not re-verified today. **[R]** = our recommendation.
Fetch gaps: Policybazaar home timed out, Compare the Market returned 403, Canstar returned 406, so those two are mostly **[K]**. No site's results-page badge styling or side-by-side UI was confirmed by fetch; those sections are **[K]/[R]**. Check the live sites before copying specifics.

## 1. Landing hero patterns
- **MoneySuperMarket** [F]: product-specific headline ("Compare car insurance quotes"), one dominant "Get a quote" CTA repeated several times, a quick estimate calculator (region, age, gender, car), "3 steps" strip (fill form, compare, save), Trustpilot score and a price-promise badge beside the CTA. Caveat: its own page contradicts itself (180+ vs 207 insurers), so keep our numbers single-sourced.
- **Policygenius** [F]: warm human headline ("A human approach to buying insurance"), then "What can we help you find?" with 4 icon tiles. A 4-step "how it works" follows.
- **NerdWallet** [F]: outcome headline, "Get quotes" button plus a secondary "work with an agent" link, carrier logo row directly under hero.
- **Ditto** [F]: "Book a free call now" is the hero CTA, with WhatsApp as an equal button. Advice-first, not form-first.
- **Coverfox** [F]: category tiles carry "starts at" prices (Car from Rs 2,094/yr, Bike Rs 457/yr, Health Rs 250/mo). Starting prices make categories feel concrete.
- **Takeaway [R]:** one headline, one primary CTA ("Compare in 2 minutes"), a visible secondary human option (call or WhatsApp), a trust strip, and "from NPR X" on every category tile.

## 2. Category pickers
- Policygenius: 4 large icon tiles each starting its own flow [F]. NerdWallet: tab bar (Auto/Home/Life/More) plus "Learn" chips [F]. Coverfox: tiles with "save up to" and from-price badges; separate Retail vs Business split [F].
- **[R]** Nepal: 8 tiles max on the home page, in plain words, not product jargon. Show a one-line "this is for..." under each. Suggested tiles: Life (term, savings/endowment, child, pension), Health, Motor (bike, car), Travel, Accident, Home/Property, Foreign employment, Livestock/Crop. Add a "Not sure? Help me choose" tile that opens the guided flow with a need-based first question.

## 3. Guided question flow
- Observed [F]: MoneySuperMarket asks 4 quick estimate inputs on the hero, then a full 3-step journey; it lists what to have ready (registration, no-claims bonus, mileage, licence number). Policygenius: choose type, tell us about you, connect with expert, choose plan (4 steps). Policybazaar quotes are generated "from identical inputs" so comparison is like-for-like [F].
- **[K]** Policybazaar term flow: gender, DOB, smoker, income/education, mobile number, then results; the mobile number is asked early, which raises lead capture but annoys users.
- **[R] Our flow:** 1 category, then 3-5 one-question screens, then results. No phone number before results (ask afterwards, optional). Progress bar ("Step 2 of 5"), Back button, every question has a "Why we ask" tooltip, and a "Skip, show me everything" link.
  - Life/term: age; smoker?; monthly savings budget or cover wanted; dependants (yes/no); term preference.
  - Life/savings (endowment, money-back, child): age; goal (child future, retirement, lump sum, tax saving); premium per year budget; term.
  - Health: age; who is covered (self, spouse, children, parents); cover amount (3 presets, e.g. 3 lakh / 5 lakh / 10 lakh); pre-existing conditions (yes/no/not sure).
  - Motor: bike or car; engine cc or vehicle value; vehicle age; comprehensive or third-party.
  - Travel: destination region; days; travellers' ages; purpose (tourism, study, work).
  - Accident / home / livestock: value or cover wanted; location or type; one qualifier.
- Use choice chips and sliders with sensible defaults rather than free-text; format numbers in NPR with lakh/crore grouping.

## 4. Results list cards
- **[K]** Policybazaar card: insurer logo, plan name, cover, premium per month/year (large), claim settlement ratio, 2-3 key benefit chips, "Add to compare" checkbox, "Buy / Call me" button. MoneySuperMarket and GoCompare cards: insurer, monthly and annual price, Defaqto star rating, key extras, voluntary and compulsory excess [F, via secondary review]. Promoted placements must be labelled [F, FCA rule per review].
- **[R] Our card (top to bottom):** company logo and name; policy name; plain one-line summary; big price ("NPR 4,200 / yr, estimated"); 3 fact chips (cover amount, term, claim ratio); 1-2 badges; "Add to compare" checkbox; "View details" and "Request a call" buttons; small "Estimate, confirm with insurer" label.
- **Badges [R]** (each computed from data, each with a tooltip stating the rule): Lowest premium; Highest claim settlement ratio (company field); Best value (rank blend of premium and claim ratio); Most cover for the price; Tax-benefit eligible. Max 2 badges per card; never sell badges, and show the rule so they are not mistaken for ads.
- Show `dataConfidence` visibly (a small "Verified" / "Estimated" tag); our SCHEMA.md already carries it.

## 5. Filters and sorting
- Observed [F]: MoneySuperMarket/GoCompare default sort is cheapest first and filter by price, insurer, rating, features. Policybazaar filters cover, term, payout option, riders, insurer [F].
- **[R]** Sort: Recommended (default, matches our badge logic), Lowest premium, Highest claim ratio, Highest cover. Filters: insurer (multi-select), cover amount, term, premium mode, riders, tax benefit toggle. Desktop: left rail; mobile: "Filter" button opening a bottom sheet with "Show N results". Show active filters as removable chips and a one-click "Clear all". Keep a result count always visible.

## 6. Side-by-side compare
- Policybazaar has pairwise insurer pages (premium start, max cover age, CSR, claim trend side by side) [F]; Ditto has a compare-plans page [F, existence only].
- **[R]** Compare 2-3 policies (cap 3; 2 on mobile). Sticky tray at bottom after first selection ("2 selected, Compare"). Table: rows = price, cover, term, entry age, claim ratio, benefits, exclusions, riders, tax benefit, waiting period; columns = policies; sticky first column and header; "Highlight differences only" toggle; best value per row subtly marked; mobile uses horizontal snap-scroll with a pinned label column. Share/print button (useful for family discussion).

## 7. Trust signals
- Observed [F]: Trustpilot scores and review counts (MSM, Policygenius, NerdWallet); user/household counts (NerdWallet 3M+, Policygenius 30M+, Coverfox 10M households); regulator badge and licence number with validity date (Coverfox, Ditto IRDAI); insurer logo rows (NerdWallet, Coverfox); methodology/editorial links (NerdWallet, Policygenius "peer reviewed articles"); advertiser disclosure and "how we make money" FAQ (NerdWallet, Policygenius, MSM); non-binding quote disclaimers (Policygenius, NerdWallet).
- **[R]** We are a demo with no users or reviews: do NOT fake counts, ratings, testimonials or licence numbers. Honest substitutes: "Data sourced from Beema Samiti (Insurance Board) and company publications, last updated <date>"; per-field source links; confidence tags; a "How we rank" page; a clear "Demo, not a licensed insurance intermediary" banner; list of companies covered.

## 8. Plain-language explainers
- MSM [F]: cover types each explained in two lines, price-driver list, add-ons, cancellation/cooling-off, big FAQ including "how does this site make money". Ditto [F]: "Understand your policy" reads T&Cs in plain English; checklists. NerdWallet [F]: "how it works" 4 steps, calculators, article cards.
- **[R]** Inline glossary tooltips (sum assured, premium, bonus, maturity, rider, exclusion, claim settlement ratio, waiting period) with a one-sentence definition and a Nepali translation; a "What this means for you" line on policy detail; a "Term vs endowment" decision explainer; a "Questions to ask before you buy" checklist; Nepali/English toggle across the site (labels, not just content).

## 9. Mobile patterns
- **[K]** Policybazaar and Coverfox are mobile-first: single-column cards, sticky bottom CTA, bottom-sheet filters, tap-to-call. Ditto leads with WhatsApp [F].
- **[R]** Design at 360px first. One question per screen with large tap targets (min 44px); sticky bottom bar with price and primary CTA; bottom-sheet filters and sort; compare tray docks to the bottom; tap-to-call and WhatsApp deep links; light pages (Nepal mobile data and mid-range devices): no autoplay video, lazy images, under ~200KB per route where possible; numerals and Devanagari fonts tested for legibility.

## 10. Callback and lead capture
- Observed [F]: Coverfox "Reach Out to Us" form (name, email, mobile, reason dropdown, required consent checkbox) with a "we've received your details, an expert will call shortly" confirmation; Ditto free 30-minute call, WhatsApp, "no spam" promise; Policygenius phone line and "Call a licensed expert" in header and footer.
- **[R]** Capture only after value is shown. Fields: name, mobile, preferred time (morning/afternoon/evening), language (Nepali/English), optional policy pre-filled from the card. Consent checkbox with a plain sentence on who will call and that we do not sell the number. Confirmation shows what happens next and expected callback window. In the demo, store nothing real: say so explicitly on the form ("Demo, your details are not sent").

## 11. Accessibility
- **[R]** (not observed on the reference sites): WCAG 2.2 AA contrast (4.5:1 body); visible focus rings; every control keyboard operable, including the compare tray and bottom sheets; form labels always visible (not placeholder-only) with inline, plain-language errors linked via aria-describedby; badges and ranks never rely on colour alone; tables use proper th/scope; language attribute switches (lang="ne" on Nepali text); no auto-advancing carousels; respect prefers-reduced-motion; text resizes to 200% without loss; Devanagari-capable font stack; touch targets 44px.

## 12. Recommended page list and interaction spec

| Route | Page | Purpose |
|---|---|---|
| `/` | Home | Orient, pick category, start flow |
| `/quote` (`/quote/:category`) | Guided quote flow | 3-5 questions |
| `/results` | Results | Ranked, filterable cards |
| `/compare` | Compare | 2-3 policies side by side |
| `/policy/:id` | Policy detail | Full info for one policy |
| `/companies` | Companies directory | Browse insurers |
| `/companies/:id` | Company detail | Profile and its policies |
| `/learn`, `/learn/:slug` | Learn / Guides | Plain-language education |
| `/about` | About / Disclaimer | Method, sources, demo status |

**Global:** header (logo, Categories, Companies, Learn, language toggle EN/ने, "Request a call"); footer (disclaimer, sources, last-updated date); persistent demo banner; compare tray (appears at 1+ selected, state kept in URL/sessionStorage).

**Home:** hero (headline, "Compare in 2 minutes" primary CTA, "Talk to someone" secondary); category tiles with "from NPR X" (computed from data); 3-step "how it works"; "Not sure? Help me choose" card; top picks strip (badge-driven, labelled "Based on our data"); trust strip (sources, coverage counts we truly have, last-updated); 3 featured guides; mini FAQ including "how do you make money" (demo: we don't).

**Guided quote flow:** one question per screen, progress "Step n of N", Back, Skip-to-all, "Why we ask" tooltip, inputs as chips/sliders, answers summarised in a editable chip row on results. Persist answers in URL query so results are shareable and refresh-safe. Validation inline; never block on optional fields. Final screen: "Show my results" (no contact info required).

**Results:** header summary chips ("Age 30, non-smoker, NPR 50 lakh cover") with Edit; sort + filter (rail on desktop, sheet on mobile); cards as in section 4; empty state ("No match; widen cover or term" with one-tap relax suggestions); disclaimer line under list ("Premiums are estimates from published rates; confirm with the insurer"); "Request a call" sticky on mobile. Card checkbox adds to compare (max 3, toast when exceeded).

**Compare:** table spec in section 6; per-column "View details" and "Request a call"; remove-column control; "Differences only" toggle; empty-slot "Add another" returning to results with selection kept.

**Policy detail:** summary sentence; price box (estimate with assumptions listed and an age/cover adjuster that recomputes using the pricing model); tabs or anchored sections: Benefits, Features, Exclusions (visually prominent), Riders, Eligibility, Who it suits (`bestFor`), Tax benefit; "Questions to ask" box; company mini-card with claim ratio; source link and confidence tag; CTAs Add to compare, Request a call; related policies.

**Companies directory:** grid/list; filter by type (life/non-life/micro); sort by claim ratio, market share, name; card = logo, name (EN + Nepali), type, established, claim ratio, branches, policy count; search box.

**Company detail:** about, key facts (established, HQ, capital, branches, rating, NEPSE symbol), claim ratio with year and plain-language meaning, highlights, merger history, policies list (filterable by category), contact (tap-to-call, website), sources and confidence.

**Learn/Guides:** category-filtered article list; 8-10 launch guides (what is insurance, term vs endowment, how premiums are set, how to claim, health insurance basics, motor insurance rules, how to read a policy, claim settlement ratio explained, tax benefits, choosing for foreign employment); each article has reading time, short summary at top, glossary tooltips, "related policies" CTA, EN/NE.

**About/Disclaimer:** what the site is (demo), data sources and last-updated dates, how rankings and badges are computed, confidence levels explained, no-advice and no-licence statement, how to report a data error, privacy statement, contact.

**Cross-cutting rules [R]:** every number shows unit and basis (NPR, per year, estimate); amounts use lakh/crore grouping; no dark patterns (no fake urgency, no pre-ticked consent); every estimate links to its method; analytics-free by default in the demo.
