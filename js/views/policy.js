/* Policy detail view: #/policy/:id  (profile keys may be in the query string) */
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

  function list(items, icon, tone) {
    return `<ul class="mt-3 grid gap-2">${items.map((t) => `<li class="flex gap-2.5 text-ink-soft">${UI.icon(icon || 'check', 'w-5 h-5 shrink-0 mt-0.5 ' + (tone || 'text-pine'))}<span>${esc(t)}</span></li>`).join('')}</ul>`;
  }
  function section(title, body, id) {
    return `<section class="py-6 border-t border-line first:border-t-0 first:pt-0"${id ? ` id="${id}"` : ''}><h2 class="font-display text-xl font-bold">${esc(title)}</h2>${body}</section>`;
  }

  function premiumInner(p, profile) {
    const est = E.estimate(p, profile);
    let main;
    if (est.annual == null) {
      main = `<p class="font-display text-2xl font-bold">Price on request</p><p class="mt-1 text-sm text-ink-soft">The insurer has not published a price we can estimate. Ask for a quote.</p>`;
    } else if (est.perTrip) {
      main = `<p class="text-sm text-ink-mute">Est. for this trip</p><p class="font-display text-4xl font-extrabold leading-tight">${E.npr(est.annual)}</p><p class="text-sm text-ink-soft">one-off, not per year</p>`;
    } else {
      main = `<p class="text-sm text-ink-mute">Est. what you pay</p><p class="font-display text-4xl font-extrabold leading-tight">${E.npr(est.monthly)}<span class="text-base font-semibold text-ink-mute">/month</span></p><p class="text-ink-soft">${E.npr(est.annual)}<span class="text-sm text-ink-mute">/year</span></p>`;
    }
    const warn = !est.eligible ? `<p class="mt-3 rounded-lg bg-marigold-tint text-[#7C4A03] px-3 py-2 text-sm" role="alert">With these details you may not be able to buy this policy. See the notes below.</p>` : '';
    const notes = est.notes.length ? `<ul class="mt-3 grid gap-1.5 text-sm text-ink-soft">${est.notes.map((n) => `<li class="flex gap-2">${UI.icon('info', 'w-4 h-4 shrink-0 mt-0.5 text-ink-mute')}<span>${esc(n)}</span></li>`).join('')}</ul>` : '';
    const basis = est.basis ? `<p class="mt-3 text-xs text-ink-mute">Based on ${esc(est.basis)}.</p>` : '';
    return `${main}${warn}${notes}${basis}`;
  }

  function recalcForm(p, profile) {
    const cat = E.category(p.category) || { fields: [], group: '' };
    const f = fullProfile(p, profile);
    const fields = cat.fields || [];
    const am = AMOUNT[cat.group];
    const input = (key, label, val, o) => `<label class="field"><span>${esc(label)}</span><input type="number" inputmode="numeric" name="${key}" value="${esc(val)}" min="${o.min}" ${o.max ? `max="${o.max}"` : ''} step="${o.step}" /></label>`;
    let h = '';
    if (fields.includes('age')) h += input('age', 'Your age', f.age, { min: 0, max: 80, step: 1 });
    if (am && fields.includes(am.key)) h += input(am.key, am.label, f[am.key], am);
    if (fields.includes('cc')) h += input('cc', 'Engine size (cc)', f.cc, { min: 50, max: 6000, step: 25 });
    if (fields.includes('term')) h += input('term', cat.id === 'foreign-employment' ? 'Contract length (years)' : 'Policy term (years)', f.term, { min: 1, max: 60, step: 1 });
    return h;
  }

  function breadcrumb(p, cat, co) {
    const sep = `<span aria-hidden="true" class="mx-1.5 text-ink-mute">/</span>`;
    const a = (href, t) => `<a class="hover:text-ink underline-offset-2 hover:underline" href="${href}">${esc(t)}</a>`;
    return `<nav aria-label="Breadcrumb" class="text-sm text-ink-mute">${a('#/', 'Home')}${sep}${cat ? a('#/results/' + cat.id, cat.label) + sep : ''}${co ? a('#/company/' + co.id, co.shortName || co.name) + sep : ''}<span aria-current="page" class="text-ink-soft">${esc(p.name)}</span></nav>`;
  }

  function notFound() {
    return `<div class="max-w-page mx-auto px-4 sm:px-6 py-16"><h1 class="font-display text-3xl font-bold">We could not find that policy</h1><p class="mt-3 max-w-xl text-ink-soft">The link may be old, or the policy may have been renamed. Start from what you want to protect and we will show you the policies that match.</p><div class="mt-6 flex flex-wrap gap-3"><a class="btn btn-primary" href="#/">Find a policy</a><a class="btn btn-ghost" href="#/companies">Browse insurers</a></div></div>`;
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
    const tel = (n) => `<a class="text-ink font-medium underline underline-offset-2" href="tel:${esc(String(n).replace(/[^\d+]/g, ''))}">${esc(n)}</a>`;
    if (has(co.claimSettlementRatio)) rows.push(['Claims paid', `<span${has(co.claimSettlementNote) ? ` title="${esc(co.claimSettlementNote)}"` : ''}>${esc(co.claimSettlementRatio)}% of claims settled</span>`]);
    if (has(co.established)) rows.push(['Started', esc(co.established)]);
    if (has(co.branches)) rows.push(['Branches', esc(co.branches)]);
    if (has(co.paidUpCapitalNPR)) rows.push(['Paid-up capital', esc(E.nprShort(co.paidUpCapitalNPR))]);
    if (co.creditRating) rows.push(['Credit rating', esc(co.creditRating)]);
    if (co.phone) rows.push(['Phone', tel(co.phone)]);
    if (co.tollFree) rows.push(['Toll free', tel(co.tollFree)]);
    if (isUrl(co.website)) rows.push(['Website', `<a class="text-ink font-medium underline underline-offset-2 break-all" href="${esc(co.website)}" target="_blank" rel="noopener noreferrer">${esc(co.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>`]);
    const csrNote = has(co.claimSettlementRatio) ? '' : `<p class="mt-3 text-sm text-ink-mute">This insurer has not published a claim settlement ratio we could verify.</p>`;
    return section('About the insurer', `<div class="mt-3 flex items-center gap-3">${UI.avatar(co)}<div><a class="font-semibold hover:underline" href="#/company/${esc(co.id)}">${esc(co.name)}</a>${co.nameNe ? `<div class="text-sm text-ink-mute">${esc(co.nameNe)}</div>` : ''}</div></div>
      ${co.about ? `<p class="mt-3 text-ink-soft">${esc(co.about)}</p>` : ''}
      <dl class="mt-4 grid sm:grid-cols-2 gap-x-8">${rows.map((r) => `<div class="flex justify-between gap-4 py-2 border-b border-line text-sm"><dt class="text-ink-mute">${esc(r[0])}</dt><dd class="text-right font-medium">${r[1]}</dd></div>`).join('')}</dl>${csrNote}`);
  }

  function claimBlock(cat) {
    const ctx = (E.DATA.context || {}).claimProcess || {};
    const steps = arr(ctx[CLAIM_GROUP[cat && cat.group]]);
    if (!steps.length) {
      return section('How to claim', `<p class="mt-3 text-ink-soft">Call the insurer as soon as something happens, keep every bill and document, and ask for a claim number in writing. If a claim is delayed or refused unfairly, you can complain to the Nepal Insurance Authority.</p>`);
    }
    return section('How to claim', `<ol class="mt-3 grid gap-3">${steps.map((s, i) => `<li class="flex gap-3 text-ink-soft"><span class="font-display font-bold text-ink w-6 shrink-0">${i + 1}.</span><span>${esc(s)}</span></li>`).join('')}</ol>`);
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
    if (p.taxBenefit === true) return section('Tax benefit', `<p class="mt-3 text-ink-soft">Premiums on this policy may be deducted from your taxable income, which lowers your income tax if you are a salaried or business taxpayer.${esc(cap)}</p>`);
    if (p.taxBenefit === false) return section('Tax benefit', `<p class="mt-3 text-ink-soft">We found no income-tax deduction for this policy.</p>`);
    return '';
  }

  function similar(p, profile) {
    const qs = window.Router ? window.Router.qs(profile || {}) : '';
    const rows = E.policiesFor(p.category).filter((x) => x.id !== p.id).map((x) => ({ x, est: E.estimate(x, profile) }));
    rows.sort((a, b) => (a.est.eligible === b.est.eligible ? 0 : a.est.eligible ? -1 : 1) || (a.est.annual ?? Infinity) - (b.est.annual ?? Infinity));
    const top = rows.slice(0, 3);
    if (!top.length) return '';
    return `<section class="mt-10"><h2 class="font-display text-xl font-bold">Similar policies</h2><p class="text-sm text-ink-mute mt-1">Other ${esc(((E.category(p.category) || {}).label || '').toLowerCase())} policies, cheapest first for the same details.</p>
      <div class="mt-4 grid gap-3 md:grid-cols-3">${top.map(({ x, est }) => {
        const co = E.company(x.companyId);
        const price = est.annual == null ? 'Price on request' : est.perTrip ? `${E.npr(est.annual)} per trip` : `${E.npr(est.monthly)}/month`;
        return `<a class="panel p-4 block hover:border-ink-mute" href="#/policy/${esc(x.id)}${qs ? '?' + qs : ''}"><div class="flex items-center gap-3">${UI.avatar(co)}<div class="min-w-0"><div class="font-semibold leading-tight">${esc(x.name)}</div><div class="text-sm text-ink-mute">${esc(co ? co.shortName : '')}</div></div></div><p class="mt-3 font-display font-bold text-lg">${esc(price)} <span class="text-xs font-sans font-normal text-ink-mute">est.</span></p>${est.eligible ? '' : '<p class="text-xs text-[#7C4A03] mt-1">May not suit these details</p>'}</a>`;
      }).join('')}</div></section>`;
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

    const body = [
      benefits.length ? section('What you get', list(benefits, 'check')) : '',
      features.length ? section('Features', list(features, 'sparkles')) : '',
      riders.length ? section('Optional add-ons (riders)', `<p class="mt-1 text-sm text-ink-mute">Riders cost extra. Ask the insurer for the exact price before you add one.</p>${list(riders, 'plus')}`) : '',
      excl.length ? section('Not covered', `<p class="mt-1 text-sm text-ink-mute">Read these before you buy. A claim for any of these can be refused.</p>${list(excl, 'x', 'text-ink-mute')}`) : '',
      elig.length ? section('Who can buy', `<dl class="mt-3">${elig.map((r) => `<div class="flex justify-between gap-4 py-2.5 border-b border-line"><dt class="text-ink-mute">${esc(r[0])}</dt><dd class="text-right font-medium">${esc(r[1])}</dd></div>`).join('')}</dl>`) : '',
      modes.length ? section('Payment options', `<div class="mt-3 flex flex-wrap gap-2">${modes.map((m) => UI.chip(MODE_LABEL[m] || m)).join('')}</div><p class="mt-3 text-sm text-ink-mute">Paying yearly is usually a little cheaper overall than paying monthly. Ask your insurer.</p>`) : '',
      bonus != null ? section('Bonus', `<p class="mt-3 text-ink-soft"><strong class="text-ink">Rs ${esc(E.num(bonus))} bonus for every Rs 1,000 of cover, each year.</strong> The insurer adds this to your cover and pays it with the final amount. On Rs 10 lakh cover that is about ${esc(E.npr(bonus * 1000))} a year.</p><p class="mt-2 text-sm text-ink-mute">Bonus is declared every year by the insurer and is not guaranteed. The rate shown is the latest we found.</p>`) : '',
      best.length ? section('Good for', list(best, 'user-check')) : '',
      taxBlock(p),
      insurerBlock(co),
      claimBlock(cat),
      section('Where this information comes from', `<p class="mt-3 text-ink-soft">${esc(conf)} Always read the policy document before you pay.</p><p class="mt-2 flex flex-wrap items-center gap-2">${UI.confidence(p.dataConfidence)}${isUrl(p.sourceUrl) ? `<a class="text-ink font-medium underline underline-offset-2 break-all" href="${esc(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">View the insurer's page</a>` : ''}</p>${fmtDate(E.DATA.builtAt) ? `<p class="mt-2 text-sm text-ink-mute">Data last updated ${esc(fmtDate(E.DATA.builtAt))}.</p>` : ''}`),
    ].join('');

    return `<div class="max-w-page mx-auto px-4 sm:px-6 pt-5 pb-16">
      ${breadcrumb(p, cat, co)}
      <header class="mt-5 flex gap-4 items-start">
        ${UI.avatar(co, 'w-14 h-14 text-base')}
        <div class="min-w-0">
          <h1 class="font-display text-3xl sm:text-4xl font-extrabold leading-tight">${esc(p.name)}</h1>
          ${p.nameNe ? `<p class="text-ink-mute">${esc(p.nameNe)}</p>` : ''}
          ${co ? `<p class="mt-1"><a class="font-semibold text-ink-soft hover:underline" href="#/company/${esc(co.id)}">${esc(co.name)}</a></p>` : ''}
          <div class="mt-2 flex flex-wrap gap-2">${cat ? UI.chip(cat.label) : ''}${UI.confidence(p.dataConfidence)}</div>
        </div>
      </header>
      ${p.summary ? `<p class="mt-4 max-w-3xl text-lg text-ink-soft">${esc(p.summary)}</p>` : ''}
      <div class="mt-8 grid lg:grid-cols-[minmax(0,1fr)_380px] gap-8 items-start">
        <div class="order-2 lg:order-1 min-w-0">${body}</div>
        <aside class="order-1 lg:order-2 lg:sticky lg:top-24" aria-label="Estimated premium">
          <div class="panel p-5">
            <div id="pol-premium" aria-live="polite">${premiumInner(p, profile)}</div>
            <form id="pol-recalc" class="mt-5 grid gap-3 pt-5 border-t border-line" novalidate>
              <p class="font-semibold">Change your details</p>
              ${recalcForm(p, profile)}
            </form>
            <p class="mt-4 text-xs text-ink-mute">This is an estimate, not a quote. <a class="underline" href="#/about">How we estimate</a></p>
            <div class="mt-5 grid gap-2.5">
              <button type="button" class="btn btn-primary w-full" data-callback="${esc(p.id)}">Get a call back</button>
              <div class="grid grid-cols-2 gap-2.5">
                <button type="button" class="btn btn-ghost" data-compare="${esc(p.id)}" aria-pressed="false">${UI.icon('scale', 'w-4 h-4')}<span data-label>Compare</span></button>
                <button type="button" class="btn btn-ghost" data-save="${esc(p.id)}" aria-pressed="false">${UI.icon('bookmark', 'w-4 h-4')}<span>Save</span></button>
              </div>
            </div>
          </div>
        </aside>
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
