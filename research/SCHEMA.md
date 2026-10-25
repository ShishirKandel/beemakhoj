# Data contract — Nepal insurance comparison demo

All research output is JSON. One file per company: `research/companies/<company-id>.json`
with shape `{ "company": Company, "policies": Policy[] }`.

Amounts are in NPR (plain numbers, no commas). Ages in years. Terms in years.
Never invent facts silently: every company and policy carries `dataConfidence`
("verified" = seen on an official/regulator source, "partial" = some fields
inferred, "estimated" = indicative values only). Premium numbers are almost
always "estimated" unless an official premium table was found.

## Company
```json
{
  "id": "nepal-life",                      // kebab-case slug, unique
  "name": "Nepal Life Insurance Company Ltd.",
  "nameNe": "नेपाल लाइफ इन्स्योरेन्स कम्पनी लि.",
  "shortName": "Nepal Life",
  "type": "life",                          // life | nonlife | micro-life | micro-nonlife | reinsurance
  "established": 2001,
  "headquarters": "Kamaladi, Kathmandu",
  "website": "https://nepallife.com.np",
  "phone": "01-XXXXXXX",
  "tollFree": "1660-XX-XXXXX",             // optional
  "email": "info@...",
  "branches": 190,                         // approx count, optional
  "paidUpCapitalNPR": 7000000000,          // optional
  "claimSettlementRatio": 97.5,            // percent, optional (latest available year)
  "marketSharePercent": 18.2,              // optional
  "nepseSymbol": "NLIC",                   // optional
  "creditRating": "ICRA NP A",             // optional
  "mergerHistory": "Merged with X in 2023", // optional
  "about": "2-3 sentence plain-language description",
  "highlights": ["Largest life insurer by ...", "..."],
  "sources": ["https://..."],
  "dataConfidence": "verified"
}
```

## Policy
```json
{
  "id": "nepal-life-jeevan-laxmi",          // `<company-id>-<slug>`
  "companyId": "nepal-life",
  "name": "Jeevan Laxmi (Endowment)",
  "nameNe": "जीवन लक्ष्मी",                  // optional
  "category": "endowment",                 // see categories below
  "summary": "One plain-language sentence a normal person understands.",
  "features": ["..."],                     // 3-6 items
  "benefits": ["..."],                     // 2-5 items (death benefit, maturity benefit...)
  "exclusions": ["..."],                   // 1-4 items
  "riders": ["Accidental death benefit", "Premium waiver"],
  "eligibility": {
    "minEntryAge": 16, "maxEntryAge": 60, "maxMaturityAge": 75,
    "minTerm": 5, "maxTerm": 40,
    "minSumAssured": 100000, "maxSumAssured": null
  },
  "premiumModes": ["yearly", "half-yearly", "quarterly", "monthly"],
  "pricing": { ...one of the Pricing shapes below... },
  "bonusRatePer1000": 60,                  // life participating plans: declared annual bonus per 1000 SA, optional
  "taxBenefit": true,                      // life: deductible up to NPR 40,000/yr; health: up to NPR 20,000
  "bestFor": ["Young earners saving for 15-20 years"],
  "sourceUrl": "https://...",
  "dataConfidence": "partial"
}
```

## Pricing shapes (pick exactly one per policy)
- Life plans (term, endowment, money-back, child, pension, whole-life, foreign-employment):
  `{ "model": "rate-per-thousand", "ratePer1000AtAge30": 48, "referenceTerm": 20 }`
  = annual premium per NPR 1,000 sum assured for a 30-year-old on the reference term.
  Typical Nepal ranges: term ~2-6, endowment ~40-60, money-back ~55-75, whole-life ~25-35.
- Health / critical illness:
  `{ "model": "health-bands", "bands": [ { "sumInsured": 300000, "annualPremiumAge30": 6500 }, ... ] }`
  2-4 bands, individual adult aged 30.
- Motor comprehensive / home / property:
  `{ "model": "percent-of-value", "ratePercent": 1.2, "minPremium": 3000 }`
- Fixed-price products (motor third-party, personal accident, livestock, micro):
  `{ "model": "fixed", "annualPremium": 1800, "coverAmount": 500000, "note": "Third-party, 150cc-250cc bike" }`
- Travel:
  `{ "model": "per-day", "perDayPremium": 120, "coverAmount": 5000000 }`

## Categories (`category` field)
Life: `term-life`, `endowment`, `money-back`, `child-plan`, `pension`, `whole-life`, `foreign-employment`
Non-life: `health`, `critical-illness`, `personal-accident`, `motor-bike`, `motor-car`,
`travel`, `home`, `livestock`, `crop`
Micro: use the closest category above.
