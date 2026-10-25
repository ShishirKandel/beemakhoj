/* BeemaKhoj engine: categories, formatting, premium estimation, matching, shared state.
 * Everything here is pure logic over window.NIDATA — no DOM except Store events. */
(function () {
  const DATA = window.NIDATA || { companies: [], policies: [], context: {} };

  // ---------- Categories ----------
  // fields: which questions the guided quote flow asks for this category.
  const CATEGORIES = [
    { id: 'term-life', group: 'life', label: 'Term life', labelNe: 'आवधिक जीवन बीमा', icon: 'shield-check',
      blurb: 'Large cover for a small premium. Pays your family if you die during the term; nothing back at the end.',
      fields: ['age', 'sumAssured', 'term'], defaults: { sumAssured: 2500000, term: 20 } },
    { id: 'endowment', group: 'life', label: 'Savings (endowment)', labelNe: 'सावधिक जीवन बीमा', icon: 'piggy-bank',
      blurb: 'Life cover plus a lump sum with bonus when the policy matures. The most popular plan in Nepal.',
      fields: ['age', 'sumAssured', 'term'], defaults: { sumAssured: 1000000, term: 20 } },
    { id: 'money-back', group: 'life', label: 'Money-back', labelNe: 'अग्रिम भुक्तानी बीमा', icon: 'coins',
      blurb: 'Pays part of the sum assured back every few years, the rest with bonus at maturity.',
      fields: ['age', 'sumAssured', 'term'], defaults: { sumAssured: 1000000, term: 20 } },
    { id: 'child-plan', group: 'life', label: 'Child education', labelNe: 'बाल शिक्षा बीमा', icon: 'graduation-cap',
      blurb: "Builds a fund for your child's studies. Premiums are usually waived if the parent dies.",
      fields: ['age', 'sumAssured', 'term'], defaults: { sumAssured: 1000000, term: 15 } },
    { id: 'pension', group: 'life', label: 'Pension & retirement', labelNe: 'पेन्सन बीमा', icon: 'armchair',
      blurb: 'Save while you earn and receive a regular income after retirement.',
      fields: ['age', 'sumAssured', 'term'], defaults: { sumAssured: 1500000, term: 25 } },
    { id: 'whole-life', group: 'life', label: 'Whole life', labelNe: 'आजीवन बीमा', icon: 'infinity',
      blurb: 'Covers you for life (often to age 99/100) and leaves a guaranteed amount to your family.',
      fields: ['age', 'sumAssured', 'term'], defaults: { sumAssured: 1000000, term: 25 } },
    { id: 'foreign-employment', group: 'life', label: 'Foreign employment', labelNe: 'वैदेशिक रोजगार बीमा', icon: 'plane-takeoff',
      blurb: 'Mandatory cover for workers going abroad through the Department of Foreign Employment.',
      fields: ['age', 'term'], defaults: { sumAssured: 1500000, term: 3 } },
    { id: 'health', group: 'health', label: 'Health', labelNe: 'स्वास्थ्य बीमा', icon: 'heart-pulse',
      blurb: 'Pays hospital bills for illness and accidents, up to your sum insured each year.',
      fields: ['age', 'coverAmount'], defaults: { coverAmount: 500000 } },
    { id: 'critical-illness', group: 'health', label: 'Critical illness', labelNe: 'कडा रोग बीमा', icon: 'activity',
      blurb: 'A lump sum if you are diagnosed with cancer, heart attack, kidney failure and other listed illnesses.',
      fields: ['age', 'coverAmount'], defaults: { coverAmount: 1000000 } },
    { id: 'personal-accident', group: 'health', label: 'Personal accident', labelNe: 'व्यक्तिगत दुर्घटना बीमा', icon: 'bandage',
      blurb: 'Cash for accidental death, disability and injury treatment. Cheap and useful for riders and workers.',
      fields: ['age', 'coverAmount'], defaults: { coverAmount: 1000000 } },
    { id: 'motor-bike', group: 'vehicle', label: 'Bike & scooter', labelNe: 'मोटरसाइकल बीमा', icon: 'bike',
      blurb: 'Third-party cover is mandatory by law. Comprehensive also pays for damage to your own bike.',
      fields: ['vehicleValue', 'cc', 'coverType'], defaults: { vehicleValue: 250000, cc: 150, coverType: 'any' } },
    { id: 'motor-car', group: 'vehicle', label: 'Car', labelNe: 'कार बीमा', icon: 'car',
      blurb: 'Third-party is mandatory. Comprehensive covers accidents, theft, fire and riots for your own car.',
      fields: ['vehicleValue', 'cc', 'coverType'], defaults: { vehicleValue: 3500000, cc: 1200, coverType: 'any' } },
    { id: 'travel', group: 'travel', label: 'Travel', labelNe: 'यात्रा बीमा', icon: 'luggage',
      blurb: 'Medical emergencies, lost baggage and trip cancellation while abroad. Required for many visas.',
      fields: ['age', 'tripDays'], defaults: { tripDays: 15 } },
    { id: 'home', group: 'property', label: 'Home & property', labelNe: 'घर तथा सम्पत्ति बीमा', icon: 'house',
      blurb: 'Protects your house and belongings from fire, earthquake, flood and landslide.',
      fields: ['propertyValue'], defaults: { propertyValue: 5000000 } },
    { id: 'livestock', group: 'farm', label: 'Livestock', labelNe: 'पशुधन बीमा', icon: 'beef',
      blurb: 'Covers cattle, buffalo, goats and poultry against death. The government pays most of the premium.',
      fields: ['propertyValue'], defaults: { propertyValue: 150000 } },
    { id: 'crop', group: 'farm', label: 'Crop', labelNe: 'बाली बीमा', icon: 'wheat',
      blurb: 'Protects crops against drought, flood, hail and pests, with government premium subsidy.',
      fields: ['propertyValue'], defaults: { propertyValue: 200000 } },
  ];
  const GROUPS = [
    { id: 'life', label: 'Life & savings', labelNe: 'जीवन बीमा' },
    { id: 'health', label: 'Health & accident', labelNe: 'स्वास्थ्य बीमा' },
    { id: 'vehicle', label: 'Vehicle', labelNe: 'सवारी साधन' },
    { id: 'travel', label: 'Travel', labelNe: 'यात्रा' },
    { id: 'property', label: 'Home', labelNe: 'घर' },
    { id: 'farm', label: 'Farm', labelNe: 'कृषि' },
  ];
  const LIFE_CATS = new Set(['term-life', 'endowment', 'money-back', 'child-plan', 'pension', 'whole-life', 'foreign-employment']);
  const SUBSIDISED = new Set(['livestock', 'crop']);

  const category = (id) => CATEGORIES.find((c) => c.id === id);
  const company = (id) => DATA.companies.find((c) => c.id === id);
  const policy = (id) => DATA.policies.find((p) => p.id === id);
  const policiesFor = (catId) => DATA.policies.filter((p) => p.category === catId);
  const policiesOfCompany = (coId) => DATA.policies.filter((p) => p.companyId === coId);

  // ---------- Formatting (South Asian digit grouping) ----------
  const nf = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  const npr = (n) => (n == null || isNaN(n) ? '—' : 'Rs ' + nf.format(Math.round(n)));
  const num = (n) => (n == null || isNaN(n) ? '—' : nf.format(Math.round(n)));
  function words(n) { // 2500000 -> "25 lakh"
    if (n == null || isNaN(n)) return '—';
    if (n >= 1e7) return trim(n / 1e7) + ' crore';
    if (n >= 1e5) return trim(n / 1e5) + ' lakh';
    if (n >= 1e3) return trim(n / 1e3) + ' thousand';
    return String(Math.round(n));
  }
  const trim = (x) => (Math.round(x * 100) / 100).toString();
  const nprShort = (n) => (n == null || isNaN(n) ? '—' : 'Rs ' + words(n));

  // ---------- Premium estimation ----------
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  function healthAgeFactor(age) {
    if (age < 25) return 0.85;
    if (age <= 35) return 1;
    if (age <= 45) return 1.3;
    if (age <= 55) return 1.8;
    if (age <= 65) return 2.5;
    return 3.2;
  }

  function lifeFactors(cat, age, term, refTerm) {
    const a = clamp(age, 16, 70);
    const ageF = cat === 'term-life' ? Math.pow(1.075, a - 30) : Math.max(0.8, 1 + 0.025 * (a - 30));
    const t = clamp(term || refTerm, 1, 50);
    let termF;
    if (cat === 'term-life') termF = Math.pow(t / refTerm, 0.3);
    else if (cat === 'whole-life') termF = Math.pow(refTerm / t, 0.5);
    else if (cat === 'foreign-employment') termF = 1;
    else termF = Math.pow(refTerm / t, 0.9);
    return { ageF, termF };
  }

  // Third-party motor premium is set by the regulator per cc band; pick the band row from market context.
  function tariffFor(cat, cc) {
    const rows = ((DATA.context || {}).motorThirdPartyTariff || []).filter((r) => (cat === 'motor-bike' ? /motor|scooter|bike/i : /car/i).test(r.vehicle || ''));
    if (!rows.length || !cc) return null;
    const bounds = rows.map((r) => {
      const nums = String(r.ccBand || '').match(/\d+/g) || [];
      const n = nums.map(Number);
      if (/up to/i.test(r.ccBand)) return { r, lo: 0, hi: n[0] };
      if (/above|and above|\+/i.test(r.ccBand)) return { r, lo: n[0], hi: Infinity };
      return { r, lo: n[0] || 0, hi: n[1] || Infinity };
    });
    const hit = bounds.find((b) => cc >= b.lo && cc <= b.hi) || bounds.find((b) => cc < b.hi);
    return hit ? hit.r : null;
  }

  // profile: { age, sumAssured, term, coverAmount, vehicleValue, cc, coverType, tripDays, propertyValue }
  // returns { annual, monthly, eligible, notes[], basis }
  function estimate(p, profile) {
    const pr = p.pricing || {};
    const cat = p.category;
    const def = (category(cat) || {}).defaults || {};
    const prof = Object.assign({ age: 30 }, def, profile || {});
    const notes = [];
    let eligible = true;
    const el = p.eligibility || {};
    if (LIFE_CATS.has(cat) || ['health', 'critical-illness', 'personal-accident', 'travel'].includes(cat)) {
      if (el.minEntryAge != null && prof.age < el.minEntryAge) { eligible = false; notes.push(`Minimum entry age is ${el.minEntryAge}`); }
      if (el.maxEntryAge != null && prof.age > el.maxEntryAge) { eligible = false; notes.push(`Maximum entry age is ${el.maxEntryAge}`); }
    }
    let term = prof.term;
    if (LIFE_CATS.has(cat)) {
      if (el.minTerm != null && term < el.minTerm) { notes.push(`Term raised to minimum ${el.minTerm} years`); term = el.minTerm; }
      if (el.maxTerm != null && term > el.maxTerm) { notes.push(`Term capped at ${el.maxTerm} years`); term = el.maxTerm; }
      if (el.maxMaturityAge != null && prof.age + term > el.maxMaturityAge) {
        const t2 = el.maxMaturityAge - prof.age;
        if (t2 < (el.minTerm || 1)) { eligible = false; notes.push(`Maturity age limit is ${el.maxMaturityAge}`); }
        else { notes.push(`Term shortened to ${t2} years (max maturity age ${el.maxMaturityAge})`); term = t2; }
      }
      if (el.minSumAssured != null && prof.sumAssured < el.minSumAssured) notes.push(`Minimum sum assured is ${npr(el.minSumAssured)}`);
      if (el.maxSumAssured != null && prof.sumAssured > el.maxSumAssured) notes.push(`Maximum sum assured is ${npr(el.maxSumAssured)}`);
    }

    let annual = null, basis = '';
    switch (pr.model) {
      case 'rate-per-thousand': {
        const sa = cat === 'foreign-employment' && !profile?.sumAssured ? (el.minSumAssured || def.sumAssured) : prof.sumAssured;
        const { ageF, termF } = lifeFactors(cat, prof.age, term, pr.referenceTerm || 20);
        annual = (sa / 1000) * pr.ratePer1000AtAge30 * ageF * termF;
        basis = `${npr(sa)} cover, age ${prof.age}, ${term || pr.referenceTerm} years`;
        break;
      }
      case 'health-bands': {
        const bands = (pr.bands || []).slice().sort((a, b) => a.sumInsured - b.sumInsured);
        if (!bands.length) break;
        const want = prof.coverAmount;
        let base;
        const exact = bands.find((b) => b.sumInsured >= want);
        if (exact && exact === bands[0]) base = exact.annualPremiumAge30 * (want / exact.sumInsured) ** 0.6;
        else if (exact) {
          const lo = bands[bands.indexOf(exact) - 1];
          const f = (want - lo.sumInsured) / (exact.sumInsured - lo.sumInsured);
          base = lo.annualPremiumAge30 + f * (exact.annualPremiumAge30 - lo.annualPremiumAge30);
        } else {
          const top = bands[bands.length - 1];
          base = top.annualPremiumAge30 * (want / top.sumInsured) ** 0.8;
          notes.push(`Largest listed cover is ${npr(top.sumInsured)}`);
        }
        annual = base * (cat === 'personal-accident' ? 1 : healthAgeFactor(prof.age));
        basis = `${npr(want)} cover, age ${prof.age}`;
        break;
      }
      case 'percent-of-value': {
        const v = cat === 'motor-bike' || cat === 'motor-car' ? prof.vehicleValue : prof.propertyValue;
        annual = Math.max((v * pr.ratePercent) / 100, pr.minPremium || 0);
        if (SUBSIDISED.has(cat)) notes.push('Government subsidy may reduce what you pay');
        basis = `${npr(v)} insured value at ${pr.ratePercent}%`;
        break;
      }
      case 'fixed': {
        annual = pr.annualPremium;
        const tp = (cat === 'motor-bike' || cat === 'motor-car') && tariffFor(cat, prof.cc);
        if (tp) { annual = tp.annualPremiumNPR; basis = `Third-party tariff, ${tp.ccBand}`; break; }
        // Fixed prices quoted for a reference cover scale to the cover the person asked for.
        const want = LIFE_CATS.has(cat) ? prof.sumAssured : SUBSIDISED.has(cat) ? prof.propertyValue : cat === 'personal-accident' ? prof.coverAmount : null;
        if (pr.coverAmount && want && cat !== 'foreign-employment') {
          annual = pr.annualPremium * (want / pr.coverAmount);
          basis = `${npr(want)} cover (priced at ${npr(pr.annualPremium)} per ${npr(pr.coverAmount)})`;
        } else basis = pr.note || (pr.coverAmount ? `${npr(pr.coverAmount)} cover` : 'Fixed premium');
        break;
      }
      case 'per-day': {
        annual = pr.perDayPremium * (prof.tripDays || 15);
        basis = `${prof.tripDays || 15}-day trip, ${npr(pr.coverAmount)} medical cover`;
        break;
      }
    }
    if (annual != null) annual = Math.round(annual);
    const perTrip = pr.model === 'per-day';
    return { annual, monthly: annual != null && !perTrip ? Math.round(annual / 12) : null, perTrip, eligible, notes, basis };
  }

  // Third-party vs comprehensive for motor.
  function motorKind(p) {
    const s = `${p.name} ${p.summary} ${(p.pricing && p.pricing.note) || ''}`.toLowerCase();
    if (p.pricing && p.pricing.model === 'fixed') return 'third-party';
    if (/third[- ]party/.test(s) && !/comprehensive/.test(s)) return 'third-party';
    return 'comprehensive';
  }

  // ---------- Matching ----------
  // budget: { amount, period: 'monthly'|'yearly' } ; returns sorted array of { policy, company, est, fit }
  function match(catId, profile, opts) {
    opts = opts || {};
    const budget = opts.budget && opts.budget.amount ? opts.budget : null;
    const budgetAnnual = budget ? (budget.period === 'monthly' ? budget.amount * 12 : budget.amount) : null;
    let list = policiesFor(catId).map((p) => {
      const est = estimate(p, profile);
      let fit = 'unknown';
      if (!est.eligible) fit = 'ineligible';
      else if (budgetAnnual == null || est.annual == null) fit = 'ok';
      else if (est.annual <= budgetAnnual) fit = 'within';
      else if (est.annual <= budgetAnnual * 1.2) fit = 'stretch';
      else fit = 'over';
      return { policy: p, company: company(p.companyId) || { id: p.companyId, shortName: p.companyId, name: p.companyId }, est, fit };
    });
    if ((catId === 'motor-bike' || catId === 'motor-car') && profile && profile.coverType && profile.coverType !== 'any') {
      list = list.filter((r) => motorKind(r.policy) === profile.coverType);
    }
    return sortResults(list, opts.sort || 'recommended');
  }

  const FIT_RANK = { within: 0, ok: 0, stretch: 1, unknown: 2, over: 3, ineligible: 4 };
  function score(r) { // 0..100 "recommended" score
    const csr = (r.company && r.company.claimSettlementRatio) || 85;
    const conf = { verified: 6, partial: 3, estimated: 0 }[r.policy.dataConfidence] || 0;
    const bonus = r.policy.bonusRatePer1000 ? Math.min(r.policy.bonusRatePer1000 / 10, 8) : 0;
    const feat = Math.min((r.policy.features || []).length + (r.policy.riders || []).length, 10);
    return csr * 0.7 + conf + bonus + feat;
  }
  function sortResults(list, sort) {
    const byPrice = (a, b) => (a.est.annual ?? Infinity) - (b.est.annual ?? Infinity);
    const cmp = {
      recommended: (a, b) => FIT_RANK[a.fit] - FIT_RANK[b.fit] || score(b) - score(a) || byPrice(a, b),
      price: (a, b) => FIT_RANK[a.fit] === 4 ? 1 : FIT_RANK[b.fit] === 4 ? -1 : byPrice(a, b),
      claims: (a, b) => ((b.company.claimSettlementRatio || 0) - (a.company.claimSettlementRatio || 0)) || byPrice(a, b),
      bonus: (a, b) => ((b.policy.bonusRatePer1000 || 0) - (a.policy.bonusRatePer1000 || 0)) || byPrice(a, b),
      name: (a, b) => (a.company.shortName || '').localeCompare(b.company.shortName || ''),
    }[sort] || ((a, b) => 0);
    return list.slice().sort(cmp);
  }

  // Badges for a result set: cheapest eligible, best claim ratio, highest bonus.
  function badges(list) {
    const out = {};
    const ok = list.filter((r) => r.fit !== 'ineligible' && r.est.annual != null);
    const add = (r, b) => { if (r) (out[r.policy.id] = out[r.policy.id] || []).push(b); };
    add(ok.slice().sort((a, b) => a.est.annual - b.est.annual)[0], 'Lowest premium');
    const csr = ok.filter((r) => r.company.claimSettlementRatio).sort((a, b) => b.company.claimSettlementRatio - a.company.claimSettlementRatio)[0];
    add(csr, 'Best claim record');
    const bon = ok.filter((r) => r.policy.bonusRatePer1000).sort((a, b) => b.policy.bonusRatePer1000 - a.policy.bonusRatePer1000)[0];
    add(bon, 'Highest bonus');
    return out;
  }

  // ---------- Shared state (compare tray, shortlist, last profile) ----------
  const KEY = 'beemakhoj:v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  let state = Object.assign({ compare: [], saved: [], profiles: {} }, load());
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
  const emit = () => document.dispatchEvent(new CustomEvent('store:change', { detail: state }));
  const MAX_COMPARE = 3;
  const Store = {
    get: () => state,
    inCompare: (id) => state.compare.includes(id),
    toggleCompare(id) {
      if (state.compare.includes(id)) state.compare = state.compare.filter((x) => x !== id);
      else {
        const p = policy(id);
        const first = policy(state.compare[0]);
        if (first && p && first.category !== p.category) return { ok: false, reason: 'You can only compare policies of the same type. Clear the tray to start a new comparison.' };
        if (state.compare.length >= MAX_COMPARE) return { ok: false, reason: `You can compare up to ${MAX_COMPARE} policies at once.` };
        state.compare.push(id);
      }
      save(); emit(); return { ok: true };
    },
    clearCompare() { state.compare = []; save(); emit(); },
    isSaved: (id) => state.saved.includes(id),
    toggleSaved(id) { state.saved = state.saved.includes(id) ? state.saved.filter((x) => x !== id) : state.saved.concat(id); save(); emit(); },
    profile: (cat) => state.profiles[cat] || null,
    setProfile(cat, prof) { state.profiles[cat] = prof; save(); },
  };

  window.Engine = {
    DATA, CATEGORIES, GROUPS, LIFE_CATS, MAX_COMPARE,
    category, company, policy, policiesFor, policiesOfCompany,
    npr, num, words, nprShort, estimate, match, sortResults, badges, motorKind, score, Store,
  };
})();
