/* Results view: matched policies as rows with live filters. Route #/results/:cat?... */
(function () {
  const E = window.Engine, UI = window.UI;
  const esc = UI.esc;
  const MARIGOLD = 'bg-marigold-tint text-[#7C4A03]';
  const SORTS = [
    ['recommended', 'Recommended'], ['price', 'Lowest premium'], ['claims', 'Best claim settlement'],
    ['bonus', 'Highest bonus'], ['name', 'Insurer A–Z'],
  ];

  const num = (v) => { if (v === undefined || v === null || v === '') return undefined; const n = Number(String(v).replace(/,/g, '')); return isFinite(n) ? n : undefined; };
  const isMotor = (cat) => cat.id === 'motor-bike' || cat.id === 'motor-car';
  const isLife = (cat) => !!(E.LIFE_CATS && E.LIFE_CATS.has(cat.id));

  const csrNum = (co) => { let v = co && co.claimSettlementRatio; v = typeof v === 'string' ? Number(v) : v; return typeof v === 'number' && isFinite(v) ? v : null; };
  const catCompanies = (cat) => [...new Set(E.policiesFor(cat.id).map((p) => p.companyId))].map((id) => E.company(id)).filter(Boolean);
  const sortAvailable = (cat, key) => (key === 'bonus' ? isLife(cat) : key === 'claims' ? catCompanies(cat).some((c) => csrNum(c) != null) : true);

  function parseState(cat, q) {
    const profile = {};
    cat.fields.forEach((f) => {
      if (f === 'coverType') { if (['any', 'third-party', 'comprehensive'].includes(q.coverType)) profile.coverType = q.coverType; return; }
      const v = num(q[f]);
      if (v !== undefined) profile[f] = v;
    });
    const amount = num(q.budget);
    return {
      profile,
      budget: amount > 0 ? amount : undefined,
      period: cat.id === 'travel' ? 'yearly' : (q.period === 'yearly' ? 'yearly' : 'monthly'),
      sort: SORTS.some((s) => s[0] === q.sort) && sortAvailable(cat, q.sort) ? q.sort : 'recommended',
      ins: q.ins ? q.ins.split(',').filter(Boolean) : [],
      hideOver: q.hideOver === '1',
      verified: q.verified === '1',
    };
  }

  function effProfile(cat, st) { return Object.assign({}, cat.defaults || {}, st.profile); }

  function profileQuery(st) {
    const o = Object.assign({}, st.profile);
    if (st.budget) { o.budget = st.budget; o.period = st.period; }
    return o;
  }
  function fullQuery(st) {
    const o = profileQuery(st);
    if (st.sort !== 'recommended') o.sort = st.sort;
    if (st.ins.length) o.ins = st.ins.join(',');
    if (st.hideOver) o.hideOver = '1';
    if (st.verified) o.verified = '1';
    return Router.qs(o);
  }

  function summary(cat, st, n) {
    const p = effProfile(cat, st);
    const parts = [];
    cat.fields.forEach((f) => {
      const v = p[f];
      if (v === undefined) return;
      if (f === 'age') parts.push(cat.id === 'travel' ? `a ${v}-year-old traveller` : `a ${v}-year-old`);
      else if (f === 'sumAssured') parts.push(`${E.nprShort(v)} cover`);
      else if (f === 'coverAmount') parts.push(`${E.nprShort(v)} cover`);
      else if (f === 'term') parts.push(`${v} ${v === 1 ? 'year' : 'years'}`);
      else if (f === 'vehicleValue') parts.push(`a ${cat.id === 'motor-car' ? 'car' : 'bike'} worth ${E.nprShort(v)}`);
      else if (f === 'cc') parts.push(`${v}cc engine`);
      else if (f === 'coverType' && v !== 'any') parts.push(`${v} cover`);
      else if (f === 'tripDays') parts.push(`a ${v}-day trip`);
      else if (f === 'propertyValue') parts.push(`value ${E.nprShort(v)}`);
    });
    let b = '';
    if (st.budget) b = cat.id === 'travel' ? `, budget ${E.npr(st.budget)} per trip` : `, budget ${E.npr(st.budget)}/${st.period === 'monthly' ? 'month' : 'year'}`;
    const what = `${cat.label.toLowerCase()} ${n === 1 ? 'plan' : 'plans'}`;
    return `Showing ${n} ${esc(what)}${parts.length ? ' for ' + esc(parts.join(', ')) : ''}${esc(b)}`;
  }

  function csrText(co) {
    let r = csrNum(co);
    if (r == null) return '';
    if (r <= 1) r *= 100;
    return `Claims settled ${Math.round(r * 10) / 10}%`;
  }

  function fitHtml(r, st) {
    if (r.fit === 'ineligible') return `<p class="text-sm text-ink-mute inline-flex items-start gap-1.5">${UI.icon('ban', 'w-4 h-4 mt-0.5 shrink-0')}<span>Not available: ${esc((r.est.notes && r.est.notes[0]) || 'does not match your answers')}</span></p>`;
    if (!st.budget || r.est.annual == null) return '';
    const budgetAnnual = st.period === 'monthly' ? st.budget * 12 : st.budget;
    const diffAnnual = r.est.annual - budgetAnnual;
    const diff = st.period === 'monthly' ? Math.round(diffAnnual / 12) : diffAnnual;
    const unit = r.est.perTrip ? '' : (st.period === 'monthly' ? '/month' : '/year');
    if (r.fit === 'within') return `<span class="chip bg-pine-tint text-pine">${UI.icon('check', 'w-3.5 h-3.5')} Within your budget</span>`;
    if (r.fit === 'stretch') return `<span class="chip ${MARIGOLD}">Slightly above budget (${esc(E.npr(diff))}${unit} more)</span>`;
    return `<span class="chip bg-sky-deep text-ink">Over budget by ${esc(E.npr(diff))}${unit}</span>`;
  }

  function premiumHtml(r) {
    const e = r.est;
    if (e.annual == null) return `<p class="font-display text-xl font-bold">Ask insurer</p><p class="text-xs text-ink-mute">No estimate available</p>`;
    if (e.perTrip) return `<p class="font-display text-3xl font-extrabold leading-none">${esc(E.npr(e.annual))}</p><p class="text-sm text-ink-soft mt-1">per trip, est.</p>`;
    return `<p class="font-display text-3xl font-extrabold leading-none">${esc(E.npr(e.monthly))}<span class="text-base font-bold text-ink-soft">/month</span></p>
      <p class="text-sm text-ink-soft mt-1">${esc(E.npr(e.annual))}/year, est.</p>`;
  }

  function rowHtml(r, st, badgeMap, qs, dim) {
    const p = r.policy, co = r.company || {};
    const feats = (p.features || []).slice(0, 3);
    const badges = (badgeMap[p.id] || []).map((b) => UI.chip(b, MARIGOLD)).join('');
    const csr = csrText(co);
    const notes = r.fit !== 'ineligible' && r.est.notes && r.est.notes[0] ? `<p class="text-xs text-ink-mute mt-2">${esc(r.est.notes[0])}</p>` : '';
    return `<article class="panel p-4 sm:p-5 ${dim ? 'bg-sky/40' : ''}" aria-label="${esc(p.name)} by ${esc(co.shortName || co.name || '')}">
      <div class="grid gap-4 md:grid-cols-[1fr_auto] md:gap-6">
        <div class="flex gap-3 min-w-0">
          ${UI.avatar(co)}
          <div class="min-w-0">
            <p class="text-sm text-ink-mute">${esc(co.shortName || co.name || '')}</p>
            <h3 class="font-display text-lg font-bold leading-snug">${esc(p.name)}</h3>
            ${p.nameNe ? `<p class="text-sm text-ink-mute">${esc(p.nameNe)}</p>` : ''}
            ${feats.length ? `<ul class="mt-2 grid gap-1 text-sm text-ink-soft">${feats.map((f) => `<li class="flex gap-2">${UI.icon('check', 'w-4 h-4 mt-0.5 text-pine shrink-0')}<span>${esc(f)}</span></li>`).join('')}</ul>` : ''}
            <div class="mt-3 flex flex-wrap items-center gap-2">${badges}${UI.confidence(p.dataConfidence)}${csr ? (co.claimSettlementNote ? `<span title="${esc(co.claimSettlementNote)}">${UI.chip(csr, 'bg-sky text-ink-soft')}</span>` : UI.chip(csr, 'bg-sky text-ink-soft')) : ''}</div>
            <div class="mt-3">${fitHtml(r, st)}</div>
            ${notes}
          </div>
        </div>
        <div class="md:text-right md:min-w-[210px] border-t border-line pt-4 md:border-0 md:pt-0">
          ${r.fit === 'ineligible' ? '' : premiumHtml(r)}
          ${r.fit !== 'ineligible' && r.est.basis ? `<p class="text-xs text-ink-mute mt-1">${esc(r.est.basis)}</p>` : ''}
          <div class="mt-4 flex flex-wrap gap-2 md:justify-end">
            <a class="btn btn-dark btn-sm" href="#/policy/${esc(p.id)}?${esc(qs)}">View details</a>
            <button type="button" data-compare="${esc(p.id)}" class="btn btn-ghost btn-sm" aria-pressed="false">${UI.icon('scale', 'w-4 h-4')}<span data-label>Compare</span></button>
            <button type="button" data-save="${esc(p.id)}" class="btn btn-ghost btn-sm" aria-pressed="false" aria-label="Save ${esc(p.name)} to shortlist">${UI.icon('bookmark', 'w-4 h-4')}</button>
          </div>
        </div>
      </div></article>`;
  }

  function taxNote() {
    const ctx = (E.DATA && E.DATA.context) || {};
    const t = (ctx.taxBenefits || []).find((x) => /life/i.test(x.type || ''));
    const limit = t && t.limitNPR ? E.npr(t.limitNPR) : null;
    return `<p class="mt-3 text-sm text-ink-soft flex gap-2">${UI.icon('piggy-bank', 'w-4 h-4 mt-0.5 text-pine shrink-0')}<span><strong>Tax saving:</strong> life insurance premium can be deducted from your taxable income${limit ? `, up to ${esc(limit)} a year` : ' up to the limit set by law'}. Limits change, so confirm with the Inland Revenue Department or your accountant.</span></p>`;
  }

  function motorNote() {
    return `<div class="mt-4 rounded-xl border border-line bg-white p-4 text-sm text-ink-soft flex gap-3">${UI.icon('info', 'w-5 h-5 text-ink-mute shrink-0')}<p><strong>Third-party premiums are fixed.</strong> The Nepal Insurance Authority sets the rate for third-party cover, so it is the same at every insurer. Compare insurers on claim settlement, branch reach and service. Comprehensive premiums do differ, so those you can shop around.</p></div>`;
  }

  function notFound() {
    return `<section class="max-w-page mx-auto px-4 sm:px-6 py-16"><h1 class="font-display text-3xl font-bold">We could not find that type of insurance</h1>
      <p class="mt-3 text-ink-soft max-w-prose">The link may be old or mistyped. Start again from the home page.</p>
      <a class="btn btn-primary mt-6" href="#/">Choose insurance type</a></section>`;
  }

  window.Views.results = {
    title(params) { const c = E.category(params.cat); return c ? `${c.label} insurance options` : 'Results'; },

    render(params, query) {
      const cat = E.category(params.cat);
      if (!cat) return notFound();
      const st = parseState(cat, query || {});
      const cos = [...new Set(E.policiesFor(cat.id).map((p) => p.companyId))].map((id) => E.company(id) || { id, shortName: id }).sort((a, b) => (a.shortName || '').localeCompare(b.shortName || ''));
      const sortOpts = SORTS.filter((s) => sortAvailable(cat, s[0]));
      const trip = cat.id === 'travel';
      return `<section class="max-w-page mx-auto px-4 sm:px-6 py-6 lg:py-10">
        <nav class="text-sm text-ink-mute" aria-label="Breadcrumb"><a class="hover:text-ink" href="#/">Home</a> / <span>${esc(cat.label)}</span></nav>
        <h1 class="font-display text-2xl sm:text-3xl font-bold mt-2">${esc(cat.label)} insurance <span class="text-base font-normal text-ink-mute">${esc(cat.labelNe || '')}</span></h1>
        <p id="r-summary" class="mt-2 text-lg text-ink-soft"></p>
        <p class="mt-1 lg:hidden"><a data-edit class="underline text-ink-soft hover:text-ink" href="#/quote/${esc(cat.id)}">Edit answers</a></p>
        <p class="mt-1 text-sm text-ink-mute"><span id="r-count" aria-live="polite" role="status"></span> Premiums are estimates. <a class="underline text-ink-soft hover:text-ink" href="#/about">How we calculate</a></p>
        ${isMotor(cat) ? motorNote() : ''}
        ${isLife(cat) ? taxNote() : ''}
        <div class="mt-6 lg:hidden">
          <button type="button" id="r-filter-toggle" class="btn btn-ghost w-full" aria-expanded="false" aria-controls="r-filters">${UI.icon('sliders-horizontal', 'w-4 h-4')} Filters and sort</button>
        </div>
        <div class="mt-4 grid gap-6 lg:grid-cols-[290px_1fr] lg:gap-8 items-start">
          <aside id="r-filters" class="hidden lg:block lg:sticky lg:top-4 panel p-4 max-h-none lg:max-h-[calc(100vh-2rem)] overflow-y-auto" aria-label="Filters">
            <div class="grid gap-5">
              <div>
                <label class="field"><span>${trip ? 'Budget for this trip (Rs)' : 'Your budget (Rs)'}</span>
                  <input id="f-budget" type="text" inputmode="numeric" autocomplete="off" value="${st.budget ? esc(String(st.budget)) : ''}" placeholder="No budget set" /></label>
                ${trip ? '' : `<div class="seg mt-2" role="radiogroup" aria-label="Budget period">
                  <label><input type="radio" name="f-period" value="monthly" ${st.period === 'monthly' ? 'checked' : ''}><span>Per month</span></label>
                  <label><input type="radio" name="f-period" value="yearly" ${st.period === 'yearly' ? 'checked' : ''}><span>Per year</span></label></div>`}
              </div>
              <label class="field"><span>Sort by</span>
                <select id="f-sort">${sortOpts.map(([v, l]) => `<option value="${v}" ${st.sort === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
              ${isMotor(cat) ? `<div><p class="text-sm font-semibold mb-2" id="f-ct-l">Cover type</p><div class="seg flex-wrap" role="radiogroup" aria-labelledby="f-ct-l">
                ${[['any', 'Both'], ['third-party', 'Third-party'], ['comprehensive', 'Comprehensive']].map(([v, l]) => `<label><input type="radio" name="f-ct" value="${v}" ${(st.profile.coverType || 'any') === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>` : ''}
              <div class="grid gap-3">
                <label class="flex items-start gap-2 cursor-pointer"><input type="checkbox" id="f-over" class="mt-1 w-4 h-4" ${st.hideOver ? 'checked' : ''}><span>Hide policies over my budget</span></label>
                <label class="flex items-start gap-2 cursor-pointer"><input type="checkbox" id="f-ver" class="mt-1 w-4 h-4" ${st.verified ? 'checked' : ''}><span>Show only verified data</span></label>
              </div>
              <fieldset><legend class="text-sm font-semibold mb-2">Insurer</legend>
                <div class="grid gap-2 max-h-56 overflow-y-auto pr-1">${cos.map((c) => `<label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" class="w-4 h-4" name="f-ins" value="${esc(c.id)}" ${st.ins.includes(c.id) ? 'checked' : ''}><span>${esc(c.shortName || c.name || c.id)}</span></label>`).join('')}</div>
                <button type="button" id="f-ins-clear" class="btn btn-quiet btn-sm mt-2">Show all insurers</button>
              </fieldset>
              <div class="grid gap-2">
                <a data-edit class="btn btn-ghost" href="#/quote/${esc(cat.id)}">${UI.icon('pencil', 'w-4 h-4')} Edit answers</a>
                <button type="button" id="r-apply" class="btn btn-primary lg:hidden">Show results</button>
              </div>
            </div>
          </aside>
          <div>
            <div id="r-list" class="grid gap-4"></div>
          </div>
        </div></section>`;
    },

    mount(root, params, query) {
      const cat = E.category(params.cat);
      if (!cat) return;
      const st = parseState(cat, query || {});
      const $ = (s) => root.querySelector(s);
      const listEl = $('#r-list');

      function syncUrl() {
        try { history.replaceState(null, '', `#/results/${cat.id}?${fullQuery(st)}`); } catch (e) {}
        root.querySelectorAll('[data-edit]').forEach((a) => a.setAttribute('href', `#/quote/${cat.id}?${Router.qs(profileQuery(st))}`));
      }

      function update() {
        if (!listEl.isConnected) return; // view was replaced while a debounced update was pending
        const budget = st.budget ? { amount: st.budget, period: st.period } : null;
        let all = E.match(cat.id, st.profile, { budget, sort: st.sort });
        const afterInsurer = st.ins.length ? all.filter((r) => st.ins.includes(r.policy.companyId)) : all;
        let shown = afterInsurer;
        if (st.verified) shown = shown.filter((r) => r.policy.dataConfidence === 'verified');
        if (st.hideOver && st.budget) shown = shown.filter((r) => r.fit !== 'over');
        const ok = shown.filter((r) => r.fit !== 'ineligible');
        const out = shown.filter((r) => r.fit === 'ineligible');
        const badgeMap = E.badges(ok);
        const qs = Router.qs(profileQuery(st));

        $('#r-summary').innerHTML = summary(cat, st, ok.length);
        $('#r-count').textContent = `${ok.length} ${ok.length === 1 ? 'policy matches' : 'policies match'} your answers.`;

        let html = '';
        if (!ok.length) {
          const tips = [];
          if (st.hideOver && st.budget) tips.push('turn off "Hide policies over my budget" or raise your budget');
          else if (st.budget) tips.push('raise your budget');
          if (st.verified) tips.push('turn off "Show only verified data"');
          if (st.ins.length) tips.push('show all insurers');
          if (cat.fields.includes('age')) tips.push('check the age you entered');
          html += `<div class="panel p-6"><h2 class="font-display text-xl font-bold">No policies match right now</h2>
            <p class="mt-2 text-ink-soft">${tips.length ? 'Try to ' + esc(tips.join(', or ')) + '.' : 'Change your answers and try again.'}</p>
            <div class="mt-4 flex flex-wrap gap-2"><button type="button" class="btn btn-primary" data-reset>Remove all filters</button><a class="btn btn-ghost" href="#/quote/${esc(cat.id)}?${esc(qs)}">Edit answers</a></div></div>`;
        } else {
          html += ok.map((r) => rowHtml(r, st, badgeMap, qs, false)).join('');
        }
        if (out.length) {
          html += `<details class="panel p-4"><summary class="cursor-pointer font-semibold">Not available for your answers (${out.length})</summary>
            <div class="mt-4 grid gap-3">${out.map((r) => rowHtml(r, st, {}, qs, true)).join('')}</div></details>`;
        }
        listEl.innerHTML = html;
        UI.bindCompare(listEl);
        UI.icons();
        const reset = listEl.querySelector('[data-reset]');
        if (reset) reset.addEventListener('click', () => {
          st.ins = []; st.hideOver = false; st.verified = false; delete st.profile.coverType;
          root.querySelectorAll('input[name=f-ins]').forEach((c) => { c.checked = false; });
          $('#f-over').checked = false; $('#f-ver').checked = false;
          const any = root.querySelector('input[name=f-ct][value=any]'); if (any) any.checked = true;
          syncUrl(); update();
        });
        syncUrl();
      }

      let t;
      $('#f-budget').addEventListener('input', (e) => {
        clearTimeout(t);
        t = setTimeout(() => { if (!listEl.isConnected) return; const n = num(e.target.value); st.budget = n > 0 ? n : undefined; update(); }, 250);
      });
      root.querySelectorAll('input[name=f-period]').forEach((r) => r.addEventListener('change', () => { st.period = r.value; update(); }));
      $('#f-sort').addEventListener('change', (e) => { st.sort = e.target.value; update(); });
      $('#f-over').addEventListener('change', (e) => { st.hideOver = e.target.checked; update(); });
      $('#f-ver').addEventListener('change', (e) => { st.verified = e.target.checked; update(); });
      root.querySelectorAll('input[name=f-ct]').forEach((r) => r.addEventListener('change', () => { st.profile.coverType = r.value; update(); }));
      root.querySelectorAll('input[name=f-ins]').forEach((c) => c.addEventListener('change', () => {
        st.ins = [...root.querySelectorAll('input[name=f-ins]:checked')].map((x) => x.value); update();
      }));
      $('#f-ins-clear').addEventListener('click', () => {
        st.ins = []; root.querySelectorAll('input[name=f-ins]').forEach((c) => { c.checked = false; }); update();
      });
      const side = $('#r-filters'), tog = $('#r-filter-toggle');
      tog.addEventListener('click', () => {
        const open = side.classList.toggle('hidden') === false;
        tog.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      $('#r-apply').addEventListener('click', () => {
        side.classList.add('hidden'); tog.setAttribute('aria-expanded', 'false'); window.scrollTo({ top: 0 });
      });
      update();
    },
  };
})();
