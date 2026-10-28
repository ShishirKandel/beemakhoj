/* Policy detail view: #/policy/:id  (profile keys may be in the query string)
 * v2 "calm & elegant": mist header, white two-column body with a sticky premium card, similar policies on mist. */
(function () {
  const E = window.Engine, UI = window.UI;
  const esc = UI.esc;
  const NUM_KEYS = ['age', 'sumAssured', 'term', 'coverAmount', 'vehicleValue', 'cc', 'tripDays', 'propertyValue'];
  const MODE_LABEL = { yearly: 'Yearly', 'half-yearly': 'Half-yearly', quarterly: 'Quarterly', monthly: 'Monthly', single: 'Single premium (one-off)' };
  const CLAIM_GROUP = { life: 'life', health: 'health', vehicle: 'motor' };

  // The one "main amount" field per category group, besides age and term.
  const AMOUNT = {
    life: { key: 'sumAssured', label: 'Cover amount (sum assured, Rs)', step: 100000, min: 50000 },
    health: { key: 'coverAmount', label: 'Cover amount (Rs)', step: 50000, min: 50000 },
    vehicle: { key: 'vehicleValue', label: 'Vehicle value (Rs)', step: 10000, min: 10000 },
    travel: { key: 'tripDays', label: 'Trip length (days)', step: 1, min: 1 },
    property: { key: 'propertyValue', label: 'Value to insure (Rs)', step: 100000, min: 10000 },
    farm: { key: 'propertyValue', label: 'Value to insure (Rs)', step: 10000, min: 5000 },
  };

  const isUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);
  const arr = (a) => (Array.isArray(a) ? a.filter((x) => x != null && String(x).trim() !== '') : []);
  const has = (v) => v !== undefined && v !== null && v !== '';
  const WRAP = 'max-w-page mx-auto px-5 sm:px-8';
  const LINK = 'link-inline';

  function profileFrom(src) {
    const prof = {};
    NUM_KEYS.forEach((k) => {
      const raw = src && src[k];
      const v = Number(raw);
      if (has(raw) && isFinite(v) && v > 0) prof[k] = v;
    });
    if (src && /^(any|third-party|comprehensive)$/.test(src.coverType || '')) prof.coverType = src.coverType;
    return prof;
  }
  // Query wins; otherwise the last profile the visitor used for this category; otherwise defaults (empty object).
  function profileFor(query, cat) {
    const q = profileFrom(query);
    if (Object.keys(q).length) return q;
    return profileFrom(E.Store.profile(cat));
  }
  function fullProfile(p, profile) {
    const def = (E.category(p.category) || {}).defaults || {};
    return Object.assign({ age: 30 }, def, profile || {});
  }
  function fmtDate(s) {
    const d = new Date(s);
    return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  const range = (lo, hi, unit) => {
    if (has(lo) && has(hi)) return lo === hi ? `${lo} ${unit}` : `${lo} to ${hi} ${unit}`;
    if (has(lo)) return `${lo} ${unit} and above`;
    if (has(hi)) return `Up to ${hi} ${unit}`;
    return '';
  };
  const money = (lo, hi) => {
    if (has(lo) && has(hi)) return `${E.nprShort(lo)} to ${E.nprShort(hi)}`;
    if (has(lo)) return `${E.nprShort(lo)} and above (no upper limit listed)`;
    if (has(hi)) return `Up to ${E.nprShort(hi)}`;
    return '';
  };

  // ---------- building blocks ----------
  function list(items, icon, tone) {
    return `<ul class="mt-5 grid gap-3.5">${items.map((t) => `<li class="flex gap-3 text-[16px] leading-relaxed text-ink-soft">${UI.icon(icon || 'check', 'w-5 h-5 shrink-0 mt-[3px] ' + (tone || 'text-pine'))}<span>${esc(t)}</span></li>`).join('')}</ul>`;
  }
  // note is trusted markup (already escaped / static text).
  function section(title, body, id, note) {
    return `<section class="mt-12 first:mt-0 sm:mt-14"${id ? ` id="${id}"` : ''}><h2 class="text-[22px] font-semibold tracking-tight text-ink">${esc(title)}</h2>${note ? `<p class="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-ink-mute">${note}</p>` : ''}${body}</section>`;
  }

  function premiumInner(p, profile) {
    const est = E.estimate(p, profile);
    const big = 'text-[36px] leading-none font-semibold tabular-nums tracking-tight text-ink';
    let main;
    if (est.annual == null) {
      main = `<p class="text-[28px] leading-tight font-semibold tracking-tight text-ink">Price on request</p><p class="mt-2 text-[15px] leading-relaxed text-ink-soft">The insurer has not published a price we can estimate. Ask for a quote.</p>`;
    } else if (est.perTrip) {
      main = `<p class="flex flex-wrap items-baseline gap-x-2 gap-y-1"><span class="${big}">${E.npr(est.annual)}</span><span class="text-[15px] text-ink-mute">for this trip</span></p><p class="mt-3 text-[14px] text-ink-mute">One-off, not per year</p>`;
    } else {
      main = `<p class="flex flex-wrap items-baseline gap-x-1.5 gap-y-1"><span class="${big}">${E.npr(est.monthly)}</span><span class="text-[15px] text-ink-mute">/month</span></p><p class="mt-3 text-[14px] text-ink-mute tabular-nums">${E.npr(est.annual)} a year</p>`;
    }
    const warn = !est.eligible ? `<p class="mt-4 flex gap-2.5 rounded-xl bg-mist px-3.5 py-3 text-[14px] leading-snug text-ink" role="alert">${UI.icon('alert-circle', 'w-4 h-4 shrink-0 mt-0.5 text-ink-soft')}<span>With these details you may not be able to buy this policy. See the notes below.</span></p>` : '';
    const notes = est.notes.length ? `<ul class="mt-4 grid gap-2 text-[14px] leading-snug text-ink-soft">${est.notes.map((n) => `<li class="flex gap-2.5">${UI.icon('info', 'w-4 h-4 shrink-0 mt-0.5 text-ink-mute')}<span>${esc(n)}</span></li>`).join('')}</ul>` : '';
    const basis = est.basis ? `<p class="mt-4 text-[13px] leading-relaxed text-ink-mute">Based on ${esc(est.basis)}.</p>` : '';
    return `${main}${warn}${notes}${basis}`;
  }

  // Short fields (age, term, trip length) pair up two to a row; the money / engine fields get a full row.
  function recalcForm(p, profile) {
    const cat = E.category(p.category) || { fields: [], group: '' };
    const f = fullProfile(p, profile);
    const fields = cat.fields || [];
    const am = AMOUNT[cat.group];
    const input = (key, label, val, o) => ({ short: !!o.short, html: (span) => `<label class="field ${span}"><span>${esc(label)}</span><input type="number" inputmode="numeric" name="${key}" value="${esc(val)}" min="${o.min}" ${o.max ? `max="${o.max}"` : ''} step="${o.step}" /></label>` });
    const shorts = [], longs = [];
    if (fields.includes('age')) shorts.push(input('age', 'Your age', f.age, { min: 0, max: 80, step: 1, short: true }));
    if (fields.includes('term')) shorts.push(input('term', cat.id === 'foreign-employment' ? 'Contract (years)' : 'Term (years)', f.term, { min: 1, max: 60, step: 1, short: true }));
    if (am && fields.includes(am.key)) (am.key === 'tripDays' ? shorts : longs).push(input(am.key, am.key === 'tripDays' ? 'Trip (days)' : am.label, f[am.key], Object.assign({ short: am.key === 'tripDays' }, am)));
    if (fields.includes('cc')) longs.push(input('cc', 'Engine size (cc)', f.cc, { min: 50, max: 6000, step: 25 }));
    const oddShort = shorts.length % 2 === 1;
    return shorts.map((s, i) => s.html(oddShort && i === shorts.length - 1 ? 'col-span-2' : 'col-span-1')).join('') + longs.map((l) => l.html('col-span-2')).join('');
  }

  function breadcrumb(p, cat, co) {
    const trail = [['#/', 'Home']];
    if (cat) trail.push(['#/results/' + cat.id, cat.label]);
    if (co) trail.push(['#/company/' + co.id, co.shortName || co.name]);
    return UI.breadcrumb(trail, p.name);
  }

  function notFound() {
    return UI.notFoundPage({
      title: 'We could not find that policy',
      body: 'The link may be old, or the policy may have been renamed. Start from what you want to protect and we will show you the policies that match.',
      actions: [['#/', 'Find a policy', 'primary'], ['#/companies', 'Browse insurers', 'ghost']],
    });
  }

  function eligibilityRows(p) {
    const el = p.eligibility || {};
    const rows = [];
    const a = range(el.minEntryAge, el.maxEntryAge, 'years'); if (a) rows.push(['Age when you join', a]);
    if (has(el.maxMaturityAge)) rows.push(['Oldest age at the end of the policy', `${el.maxMaturityAge} years`]);
    if (E.LIFE_CATS.has(p.category)) { const t = range(el.minTerm, el.maxTerm, 'years'); if (t) rows.push(['Policy term', t]); }
    const s = money(el.minSumAssured, el.maxSumAssured); if (s) rows.push([E.LIFE_CATS.has(p.category) ? 'Cover amount (sum assured)' : 'Cover amount', s]);
    return rows;
  }

  function insurerBlock(co) {
    if (!co) return '';
    const rows = [];
    const tel = (n) => `<a class="link-inline" href="tel:${esc(String(n).replace(/[^\d+]/g, ''))}">${esc(n)}</a>`;
    if (has(co.claimSettlementRatio)) rows.push(['Claims paid', `<span${has(co.claimSettlementNote) ? ` title="${esc(co.claimSettlementNote)}"` : ''}>${esc(co.claimSettlementRatio)}% of claims settled</span>`]);
    if (has(co.established)) rows.push(['Started', esc(co.established)]);
    if (has(co.branches)) rows.push(['Branches', esc(co.branches)]);
    if (has(co.paidUpCapitalNPR)) rows.push(['Paid-up capital', esc(E.nprShort(co.paidUpCapitalNPR))]);
    if (co.creditRating) rows.push(['Credit rating', esc(co.creditRating)]);
    if (co.phone) rows.push(['Phone', tel(co.phone)]);
    if (co.tollFree) rows.push(['Toll free', tel(co.tollFree)]);
    if (isUrl(co.website)) rows.push(['Website', `<a class="link-inline break-all" href="${esc(co.website)}" target="_blank" rel="noopener noreferrer">${esc(co.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>`]);
    const csrNote = has(co.claimSettlementRatio) ? '' : `<p class="mt-4 text-[14px] text-ink-mute">This insurer has not published a claim settlement ratio we could verify.</p>`;
    const facts = rows.length ? `<dl class="mt-6 grid sm:grid-cols-2 sm:gap-x-10">${rows.map((r) => `<div class="flex items-baseline justify-between gap-6 border-t border-line py-3.5 text-[15px]"><dt class="text-ink-mute">${esc(r[0])}</dt><dd class="text-right font-medium text-ink">${r[1]}</dd></div>`).join('')}</dl>` : '';
    return section('About the insurer', `<div class="panel mt-5 p-6 sm:p-8">
      <div class="flex items-center gap-4">${UI.avatar(co, 'w-12 h-12 text-base')}<div class="min-w-0"><a class="text-[17px] font-semibold text-ink hover:underline" href="#/company/${esc(co.id)}">${esc(co.name)}</a>${co.nameNe ? `<div class="text-[14px] text-ink-mute">${esc(co.nameNe)}</div>` : ''}</div></div>
      ${co.about ? `<p class="mt-5 max-w-[62ch] text-[16px] leading-relaxed text-ink-soft">${esc(co.about)}</p>` : ''}
      ${facts}${csrNote}</div>`);
  }

  // Claim steps are a real sequence: numbered, joined by a hairline.
  function claimBlock(cat) {
    const ctx = (E.DATA.context || {}).claimProcess || {};
    const steps = arr(ctx[CLAIM_GROUP[cat && cat.group]]);
    if (!steps.length) {
      return section('How to claim', `<p class="mt-5 max-w-[62ch] text-[16px] leading-relaxed text-ink-soft">Call the insurer as soon as something happens, keep every bill and document, and ask for a claim number in writing. If a claim is delayed or refused unfairly, you can complain to the Nepal Insurance Authority.</p>`);
    }
    return section('How to claim', `<ol class="mt-6">${steps.map((s, i) => `<li class="relative flex gap-4 pb-6 last:pb-0">${i < steps.length - 1 ? '<span class="absolute left-[13px] top-9 bottom-1.5 w-px bg-line-strong" aria-hidden="true"></span>' : ''}<span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky text-[13px] font-semibold tabular-nums text-ink">${i + 1}</span><span class="max-w-[62ch] pt-0.5 text-[16px] leading-relaxed text-ink-soft">${esc(s)}</span></li>`).join('')}</ol>`);
  }

  function taxBlock(p) {
    const tb = (E.DATA.context || {}).taxBenefits;
    const cat = E.category(p.category);
    let cap = '';
    if (Array.isArray(tb)) {
      const key = p.category === 'home' ? /residential|building/i : cat && cat.group === 'health' ? /health/i : E.LIFE_CATS.has(p.category) ? /life/i : null;
      const hit = key && tb.find((t) => key.test(t.type || ''));
      if (hit && has(hit.limitNPR)) cap = ` The deduction is limited to the lower of what you pay or ${E.npr(hit.limitNPR)} a year. Limits change with each Finance Act, so confirm with the Inland Revenue Department.`;
    }
    const para = (t) => `<p class="mt-5 max-w-[62ch] text-[16px] leading-relaxed text-ink-soft">${t}</p>`;
    if (p.taxBenefit === true) return section('Tax benefit', para(`Premiums on this policy may be deducted from your taxable income, which lowers your income tax if you are a salaried or business taxpayer.${esc(cap)}`));
    if (p.taxBenefit === false) return section('Tax benefit', para('We found no income-tax deduction for this policy.'));
    return '';
  }

  function similar(p, profile) {
    const qs = window.Router ? window.Router.qs(profile || {}) : '';
    const rows = E.policiesFor(p.category).filter((x) => x.id !== p.id).map((x) => ({ x, est: E.estimate(x, profile) }));
    rows.sort((a, b) => (a.est.eligible === b.est.eligible ? 0 : a.est.eligible ? -1 : 1) || (a.est.annual ?? Infinity) - (b.est.annual ?? Infinity));
    const top = rows.slice(0, 3);
    if (!top.length) return '';
    const fig = 'text-[22px] font-semibold tabular-nums tracking-tight text-ink';
    return `<section class="bg-mist" aria-labelledby="sim-h"><div class="${WRAP} py-10 sm:py-14">
      <h2 id="sim-h" class="text-[22px] font-semibold tracking-tight text-ink">Similar policies</h2>
      <p class="mt-2 text-[15px] text-ink-mute">Other ${esc(((E.category(p.category) || {}).label || '').toLowerCase())} policies, cheapest first for the same details.</p>
      <div class="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">${top.map(({ x, est }) => {
        const co = E.company(x.companyId);
        const price = est.annual == null
          ? `<span class="text-[18px] font-semibold tracking-tight text-ink">Price on request</span>`
          : est.perTrip
            ? `<span class="${fig}">${E.npr(est.annual)}</span><span class="text-[13px] text-ink-mute">per trip, est.</span>`
            : `<span class="${fig}">${E.npr(est.monthly)}</span><span class="text-[13px] text-ink-mute">/month est.</span>`;
        return `<a class="panel block p-5 transition-colors hover:border-line-strong sm:p-6" href="#/policy/${esc(x.id)}${qs ? '?' + qs : ''}">
          <div class="flex items-center gap-3">${UI.avatar(co, 'w-10 h-10 text-sm')}<div class="min-w-0"><div class="truncate text-[13px] text-ink-mute">${esc(co ? (co.shortName || co.name) : '')}</div><div class="text-[16px] font-semibold leading-snug text-ink">${esc(x.name)}</div></div></div>
          <p class="mt-5 flex flex-wrap items-baseline gap-x-1.5">${price}</p>
          ${est.eligible ? '' : '<p class="mt-2 text-[13px] text-ink-mute">May not suit these details</p>'}</a>`;
      }).join('')}</div></div></section>`;
  }

  function render(params, query) {
    const p = E.policy(params.id);
    if (!p) return notFound();
    const cat = E.category(p.category);
    const co = E.company(p.companyId);
    const profile = profileFor(query, p.category);
    const benefits = arr(p.benefits), features = arr(p.features), riders = arr(p.riders), excl = arr(p.exclusions), best = arr(p.bestFor);
    const elig = eligibilityRows(p);
    const modes = arr(p.premiumModes);
    const bonus = has(p.bonusRatePer1000) ? p.bonusRatePer1000 : null;
    const conf = p.dataConfidence === 'verified'
      ? "We checked the main details against the insurer's published documents."
      : p.dataConfidence === 'partial'
        ? "Some details were checked against the insurer's published documents; others are standard for this kind of policy."
        : "Details are indicative. They are based on typical terms for this kind of policy, not a full reading of the insurer's policy document.";
    const date = fmtDate(E.DATA.builtAt);
    const chipCls = UI.CHIP_ON_MIST;
    const formFields = recalcForm(p, profile);

    const body = [
      benefits.length ? section('What you get', list(benefits, 'check')) : '',
      features.length ? section('Features', list(features, 'check')) : '',
      riders.length ? section('Optional add-ons (riders)', list(riders, 'plus', 'text-ink-soft'), null, 'Riders cost extra. Ask the insurer for the exact price before you add one.') : '',
      excl.length ? section('Not covered', list(excl, 'x', 'text-ink-mute'), null, 'Read these before you buy. A claim for any of these can be refused.') : '',
      elig.length ? section('Who can buy', `<dl class="mt-5 divide-y divide-line border-y border-line">${elig.map((r) => `<div class="grid gap-1 py-4 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:gap-6"><dt class="text-[15px] text-ink-mute">${esc(r[0])}</dt><dd class="font-medium text-ink">${esc(r[1])}</dd></div>`).join('')}</dl>`) : '',
      modes.length ? section('Payment options', `<div class="mt-5 flex flex-wrap gap-2">${modes.map((m) => UI.chip(MODE_LABEL[m] || m)).join('')}</div><p class="mt-4 max-w-[62ch] text-[15px] text-ink-mute">Paying yearly is usually a little cheaper overall than paying monthly. Ask your insurer.</p>`) : '',
      bonus != null ? section('Bonus', `<p class="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1"><span class="text-[32px] font-semibold leading-none tabular-nums tracking-tight text-ink">Rs ${esc(E.num(bonus))}</span><span class="text-[16px] text-ink-soft">bonus for every Rs 1,000 of cover, each year</span></p><p class="mt-4 max-w-[62ch] text-[16px] leading-relaxed text-ink-soft">The insurer adds this to your cover and pays it with the final amount. On Rs 10 lakh cover that is about ${esc(E.npr(bonus * 1000))} a year.</p><p class="mt-2 max-w-[62ch] text-[14px] text-ink-mute">Bonus is declared every year by the insurer and is not guaranteed. The rate shown is the latest we found.</p>`) : '',
      best.length ? section('Good for', list(best, 'check')) : '',
      taxBlock(p),
      insurerBlock(co),
      claimBlock(cat),
      section('Where this information comes from', `<div class="callout mt-5"><p class="max-w-[62ch] text-[16px] leading-relaxed text-ink-soft">${esc(conf)} Always read the policy document before you pay.</p><div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">${UI.confidence(p.dataConfidence, true)}${isUrl(p.sourceUrl) ? `<a class="inline-flex items-center gap-1.5 text-[15px] break-all ${LINK}" href="${esc(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">View the insurer's page${UI.icon('arrow-up-right', 'w-4 h-4')}</a>` : ''}</div>${date ? `<p class="mt-4 text-[14px] text-ink-mute">Data last updated ${esc(date)}.</p>` : ''}</div>`),
    ].join('');

    return `<div>
      <header class="bg-mist">
        <div class="${WRAP} pt-6 pb-10 sm:pt-8 sm:pb-14">
          ${breadcrumb(p, cat, co)}
          <div class="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-7">
            ${UI.avatar(co, 'w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl !rounded-2xl !bg-white')}
            <div class="min-w-0">
              <h1 class="text-[32px] sm:text-[40px] font-semibold tracking-tight leading-[1.1] text-ink">${esc(p.name)}</h1>
              ${p.nameNe ? `<p class="mt-2 text-[16px] text-ink-mute">${esc(p.nameNe)}</p>` : ''}
              ${co ? `<p class="mt-3 text-[15px] text-ink-soft">Offered by <a class="${LINK}" href="#/company/${esc(co.id)}">${esc(co.name)}</a></p>` : ''}
              <div class="mt-5 flex flex-wrap gap-2">${cat ? UI.chip(cat.label, chipCls) : ''}${UI.confidence(p.dataConfidence, true)}${p.taxBenefit === true ? UI.chip('Tax benefit', chipCls) : ''}</div>
            </div>
          </div>
          ${p.summary ? `<p class="mt-8 max-w-[62ch] text-[17px] sm:text-lg leading-relaxed text-ink-soft">${esc(p.summary)}</p>` : ''}
        </div>
      </header>
      <div class="${WRAP} py-10 sm:py-14">
        <div class="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
          <div class="order-2 lg:order-1 min-w-0">${body}</div>
          <aside class="order-1 lg:order-2 min-w-0 lg:sticky lg:top-24" aria-label="Estimated premium">
            <div class="panel-float p-6">
              <p class="text-[13px] font-medium text-ink-mute">Estimated cost</p>
              <div id="pol-premium" aria-live="polite" class="mt-3">${premiumInner(p, profile)}</div>
              ${formFields ? `<form id="pol-recalc" class="mt-6 border-t border-line pt-6" aria-labelledby="pol-recalc-h" novalidate>
                <p id="pol-recalc-h" class="text-[15px] font-semibold text-ink">Change your details</p>
                <div class="mt-4 grid grid-cols-2 gap-x-3 gap-y-4">${formFields}</div>
              </form>` : ''}
              <div class="mt-6 grid gap-2.5">
                <button type="button" class="btn btn-primary w-full" data-callback="${esc(p.id)}">Get a call back</button>
                <div class="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5">
                  <button type="button" class="btn btn-ghost btn-sm" data-compare="${esc(p.id)}" aria-pressed="false">${UI.icon('scale', 'w-4 h-4')}<span data-label>Compare</span></button>
                  <button type="button" class="btn btn-ghost btn-sm" data-save="${esc(p.id)}" aria-pressed="false">${UI.icon('heart', 'w-4 h-4')}<span>Save</span></button>
                </div>
              </div>
              <p class="mt-5 text-[13px] leading-relaxed text-ink-mute">This is an estimate, not a quote. <a class="link-inline" href="#/about">How we estimate</a></p>
            </div>
          </aside>
        </div>
      </div>
      ${similar(p, profile)}
    </div>`;
  }

  function mount(root, params, query) {
    const p = E.policy(params.id);
    if (!p) return;
    UI.bindCompare(root);
    const cb = root.querySelector('[data-callback]');
    if (cb) cb.addEventListener('click', () => UI.openCallback(p.id));
    const form = root.querySelector('#pol-recalc');
    const out = root.querySelector('#pol-premium');
    if (!form || !out) return;
    form.addEventListener('submit', (e) => e.preventDefault());
    form.addEventListener('input', () => {
      const prof = profileFor(query, p.category);
      Array.from(form.elements).forEach((el) => {
        if (!el.name) return;
        const v = Number(el.value);
        if (el.value !== '' && isFinite(v) && v > 0) prof[el.name] = v;
      });
      out.innerHTML = premiumInner(p, prof);
      UI.icons();
      try { history.replaceState(null, '', `#/policy/${p.id}?${window.Router.qs(prof)}`); } catch (e) { /* ignore */ }
    });
  }

  window.Views = window.Views || {};
  window.Views.policy = {
    title: (params) => { const p = E.policy(params.id); return p ? p.name : 'Policy not found'; },
    render, mount,
  };
})();
