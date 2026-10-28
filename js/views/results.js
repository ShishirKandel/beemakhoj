/* Results view: matched policies as quiet cards with live filters. Route #/results/:cat?...
 * Layout (DESIGN.md v2): mist page header (H1, one-line summary, Edit answers, estimate note), then a white body
 * with an unboxed filter rail on the left and hairline result cards on the right. */
(function () {
  const E = window.Engine, UI = window.UI;
  const esc = UI.esc;
  const SORTS = [
    ['recommended', 'Recommended'], ['price', 'Lowest premium'], ['claims', 'Best claim settlement'],
    ['bonus', 'Highest bonus'], ['name', 'Insurer A–Z'],
  ];

  const num = (v) => { if (v === undefined || v === null || v === '') return undefined; const n = Number(String(v).replace(/,/g, '')); return isFinite(n) ? n : undefined; };
  const isMotor = (cat) => cat.id === 'motor-bike' || cat.id === 'motor-car';
  const isLife = (cat) => !!(E.LIFE_CATS && E.LIFE_CATS.has(cat.id));

  const csrNum = (co) => { let v = co && co.claimSettlementRatio; v = typeof v === 'string' ? Number(v) : v; return typeof v === 'number' && isFinite(v) ? v : null; };
  const catCompanies = (cat) => [...new Set(E.policiesFor(cat.id).map((p) => p.companyId))].map((id) => E.company(id)).filter(Boolean);
  // The "verified only" filter is offered only where it can return something.
  const hasVerified = (cat) => E.policiesFor(cat.id).some((p) => p.dataConfidence === 'verified');
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
      verified: q.verified === '1' && hasVerified(cat),
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

  // Engine size is stored as a representative value of its band; describe it as the band the person picked.
  function ccBand(cat, v) {
    if (cat.id === 'motor-car') return v <= 1000 ? 'up to 1000cc' : v <= 1500 ? '1000–1500cc' : '1500cc and above';
    return v <= 150 ? 'up to 150cc' : v <= 250 ? '150–250cc' : '250cc and above';
  }

  // One plain-text line describing the answers behind the list (set with textContent).
  function summary(cat, st) {
    const p = effProfile(cat, st);
    const parts = [];
    cat.fields.forEach((f) => {
      const v = p[f];
      if (v === undefined) return;
      if (f === 'age') parts.push(cat.id === 'travel' ? `a ${v}-year-old traveller` : `a ${v}-year-old`);
      else if (f === 'sumAssured') parts.push(`${E.nprShort(v)} cover`);
      else if (f === 'coverAmount') parts.push(`${E.nprShort(v)} cover`);
      else if (f === 'term') parts.push(cat.id === 'foreign-employment' ? `${v} ${v === 1 ? 'year' : 'years'} abroad` : `a ${v}-year term`);
      else if (f === 'vehicleValue') parts.push(`a ${cat.id === 'motor-car' ? 'car' : 'bike'} worth ${E.nprShort(v)}`);
      else if (f === 'cc') parts.push(`an engine ${ccBand(cat, v)}`);
      else if (f === 'coverType' && v !== 'any') parts.push(`${v} cover`);
      else if (f === 'tripDays') parts.push(`a ${v}-day trip`);
      else if (f === 'propertyValue') parts.push(`value ${E.nprShort(v)}`);
    });
    if (st.budget) parts.push(cat.id === 'travel' ? `budget ${E.npr(st.budget)} per trip` : `budget ${E.npr(st.budget)}/${st.period === 'monthly' ? 'month' : 'year'}`);
    return parts.length ? `For ${parts.join(', ')}` : 'Based on typical answers for this type of cover';
  }

  function csrText(co) {
    let r = csrNum(co);
    if (r == null) return '';
    if (r <= 1) r *= 100;
    return `Claims settled ${Math.round(r * 10) / 10}%`;
  }

  // ---------- Result card pieces ----------
  const dot = (cls) => `<span class="inline-block h-2 w-2 flex-none rounded-full ${cls}" aria-hidden="true"></span>`;

  function fitHtml(r, st) {
    if (r.fit === 'ineligible') return `<p class="inline-flex items-start gap-2 text-sm text-ink-mute">${UI.icon('ban', 'mt-0.5 h-4 w-4 shrink-0')}<span>Not available: ${esc((r.est.notes && r.est.notes[0]) || 'does not match your answers')}</span></p>`;
    if (!st.budget || r.est.annual == null) return '';
    const budgetAnnual = st.period === 'monthly' ? st.budget * 12 : st.budget;
    const diffAnnual = r.est.annual - budgetAnnual;
    const diff = st.period === 'monthly' ? Math.round(diffAnnual / 12) : diffAnnual;
    const unit = r.est.perTrip ? '' : (st.period === 'monthly' ? '/month' : '/year');
    const line = (d, t) => `<p class="inline-flex items-center gap-2 text-sm text-ink-soft">${dot(d)}<span>${t}</span></p>`;
    if (r.fit === 'within') return line('bg-pine', 'Within your budget');
    if (r.fit === 'stretch') return line('bg-marigold', `A little above budget, ${esc(E.npr(diff))}${unit} more`);
    return line('bg-ink-mute', `Over budget by ${esc(E.npr(diff))}${unit}`);
  }

  function premiumHtml(r) {
    const e = r.est;
    if (e.annual == null) return `<p class="text-xl font-semibold tracking-tight text-ink">Ask insurer</p><p class="mt-1 text-[13px] text-ink-mute">No estimate available</p>`;
    if (e.perTrip) return `<p class="text-[28px] font-semibold leading-none tracking-tight tabular-nums text-ink">${esc(E.npr(e.annual))}</p><p class="mt-2 text-[13px] text-ink-mute">per trip, est.</p>`;
    return `<p class="text-[28px] font-semibold leading-none tracking-tight tabular-nums text-ink">${esc(E.npr(e.monthly))}<span class="ml-1.5 text-[13px] font-normal tracking-normal text-ink-mute">/month est.</span></p>
      <p class="mt-2 text-[13px] tabular-nums text-ink-mute">${esc(E.npr(e.annual))} a year</p>`;
  }

  function featuresHtml(feats) {
    if (!feats.length) return '';
    const stacked = feats.some((f) => String(f).length > 48);
    return `<ul class="mt-3 ${stacked ? 'grid gap-1.5' : 'flex flex-wrap gap-x-5 gap-y-1.5'} text-sm text-ink-soft">${feats.map((f) =>
      `<li class="flex items-start gap-1.5">${UI.icon('check', 'mt-[3px] h-3.5 w-3.5 shrink-0 text-pine')}<span>${esc(f)}</span></li>`).join('')}</ul>`;
  }

  function rowHtml(r, st, badgeMap, qs, dim) {
    const p = r.policy, co = r.company || {};
    const coName = co.shortName || co.name || '';
    const feats = (p.features || []).slice(0, 3);
    const awards = (badgeMap[p.id] || []).map((b) => `<span class="badge-award">${esc(b)}</span>`).join('');
    const verified = p.dataConfidence === 'verified';
    const conf = verified
      ? UI.confidence('verified')
      : `<span class="inline-flex items-center gap-1.5 text-[13px] text-ink-mute" title="How sure we are about this data">${dot(UI.confDot(p.dataConfidence))}${p.dataConfidence === 'partial' ? 'Partly verified' : 'Indicative'}</span>`;
    const badges = awards + (verified ? conf : '');
    const csr = csrText(co);
    const csrHtml = csr ? `<span class="text-[13px] text-ink-mute"${co.claimSettlementNote ? ` title="${esc(co.claimSettlementNote)}"` : ''}>${esc(csr)}</span>` : '';
    const fit = fitHtml(r, st);
    const meta = [fit, verified ? '' : conf, csrHtml].filter(Boolean).join('');
    const note = r.fit !== 'ineligible' && r.est.notes && r.est.notes[0] ? `<p class="mt-2 text-[13px] text-ink-mute">${esc(r.est.notes[0])}</p>` : '';
    const eligible = r.fit !== 'ineligible';
    return `<article class="panel p-5 transition-colors duration-150 hover:border-line-strong sm:p-6${dim ? ' !bg-mist' : ''}" aria-label="${esc(p.name)} by ${esc(coName)}">
      <div class="grid gap-5 md:grid-cols-[minmax(0,1fr)_240px] md:gap-8">
        <div class="flex min-w-0 gap-4">
          ${UI.avatar(co, 'w-12 h-12 text-sm')}
          <div class="min-w-0">
            <p class="text-sm text-ink-mute">${esc(coName)}</p>
            <h3 class="mt-0.5 text-lg font-semibold leading-snug tracking-tight text-ink">${esc(p.name)}</h3>
            ${p.nameNe ? `<p class="text-[13px] text-ink-mute">${esc(p.nameNe)}</p>` : ''}
            ${badges ? `<div class="mt-3 flex flex-wrap items-center gap-2">${badges}</div>` : ''}
            ${featuresHtml(feats)}
            ${meta ? `<div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">${meta}</div>` : ''}
            ${note}
          </div>
        </div>
        <div class="border-t border-line pt-5 md:border-0 md:pt-0 md:text-right">
          ${eligible ? premiumHtml(r) : ''}
          ${eligible && r.est.basis ? `<p class="mt-1.5 text-[13px] leading-snug text-ink-mute">${esc(r.est.basis)}</p>` : ''}
          <div class="${eligible ? 'mt-5' : ''} grid grid-cols-[1fr_auto] gap-2">
            <a class="btn btn-primary btn-sm col-span-2" href="#/policy/${esc(p.id)}?${esc(qs)}">View details</a>
            <button type="button" data-compare="${esc(p.id)}" class="btn btn-ghost btn-sm whitespace-nowrap" aria-pressed="false">${UI.icon('scale', 'h-4 w-4')}<span data-label>Compare</span></button>
            <button type="button" data-save="${esc(p.id)}" class="btn btn-ghost btn-sm w-11 !px-0 md:w-10" aria-pressed="false" aria-label="Save ${esc(p.name)} to shortlist">${UI.icon('heart', 'h-4 w-4')}</button>
          </div>
        </div>
      </div></article>`;
  }

  // ---------- Quiet notes ----------
  const noteBox = (iconHtml, body) => `<div class="callout flex gap-3 px-5 py-4 text-sm leading-relaxed text-ink-soft">${iconHtml}<p>${body}</p></div>`;

  function taxNote() {
    const ctx = (E.DATA && E.DATA.context) || {};
    const t = (ctx.taxBenefits || []).find((x) => /life/i.test(x.type || ''));
    const limit = t && t.limitNPR ? E.npr(t.limitNPR) : null;
    return noteBox(UI.icon('piggy-bank', 'mt-0.5 h-5 w-5 shrink-0 text-pine'), `<strong class="font-semibold text-ink">Tax saving.</strong> Life insurance premium can be deducted from your taxable income${limit ? `, up to ${esc(limit)} a year` : ' up to the limit set by law'}. Limits change, so confirm with the Inland Revenue Department or your accountant.`);
  }

  function motorNote() {
    return noteBox(UI.icon('info', 'mt-0.5 h-5 w-5 shrink-0 text-ink-soft'), `<strong class="font-semibold text-ink">Third-party premiums are fixed.</strong> The Nepal Insurance Authority sets the rate for third-party cover, so it is the same at every insurer. Compare insurers on claim settlement, branch reach and service. Comprehensive premiums do differ, so those you can shop around.`);
  }

  function notFound() {
    return UI.notFoundPage({
      title: 'We could not find that type of insurance',
      body: 'The link may be old or mistyped. Start again from the home page.',
      actions: [['#/', 'Choose insurance type', 'primary']],
    });
  }

  // ---------- Filter rail ----------
  const railLegend = (text) => `<legend class="mb-1.5 text-sm font-medium text-ink-soft">${text}</legend>`;
  const checkRow = (inner) => `<label class="flex cursor-pointer items-start gap-3 py-3 text-[15px] leading-snug text-ink-soft lg:py-2">${inner}</label>`;

  window.Views.results = {
    title(params) { const c = E.category(params.cat); return c ? `${c.label} insurance options` : 'Results'; },

    render(params, query) {
      const cat = E.category(params.cat);
      if (!cat) return notFound();
      const st = parseState(cat, query || {});
      const cos = [...new Set(E.policiesFor(cat.id).map((p) => p.companyId))].map((id) => E.company(id) || { id, shortName: id }).sort((a, b) => (a.shortName || '').localeCompare(b.shortName || ''));
      const sortOpts = SORTS.filter((s) => sortAvailable(cat, s[0]));
      const trip = cat.id === 'travel';
      const notes = (isMotor(cat) ? motorNote() : '') + (isLife(cat) ? taxNote() : '');
      return `<section class="bg-mist">
        <div class="max-w-page mx-auto px-5 sm:px-8 pt-6 pb-10 sm:pt-8 sm:pb-14">
          ${UI.breadcrumb([['#/', 'Home']], cat.label)}
          <div class="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div class="min-w-0 max-w-2xl">
              <h1 class="text-[32px] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[40px]">${esc(cat.label)} insurance</h1>
              ${cat.labelNe ? `<p lang="ne" class="mt-2 text-base text-ink-mute">${esc(cat.labelNe)}</p>` : ''}
              <p id="r-summary" class="mt-4 text-[17px] leading-relaxed text-ink-soft sm:text-lg"></p>
              <p class="mt-2 text-[13px] text-ink-mute">Premiums are estimates, not quotes. <a class="link-inline" href="#/about">How we calculate</a></p>
            </div>
            <a data-edit class="btn btn-ghost btn-sm self-start md:self-auto" href="#/quote/${esc(cat.id)}">${UI.icon('pencil', 'h-4 w-4')}Edit answers</a>
          </div>
        </div>
      </section>
      <section class="max-w-page mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div class="mb-6 lg:hidden">
          <button type="button" id="r-filter-toggle" class="btn btn-ghost w-full" aria-expanded="false" aria-controls="r-filters">${UI.icon('sliders-horizontal', 'h-4 w-4')}<span>Filters and sort</span><span id="r-filter-count" class="sl-count" hidden>0</span></button>
        </div>
        <div class="grid items-start gap-8 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-10 xl:gap-14">
          <aside id="r-filters" class="hidden rounded-2xl bg-mist p-5 lg:sticky lg:top-24 lg:-m-2 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:rounded-none lg:bg-transparent lg:p-2" aria-label="Filters">
            <div class="grid gap-8">
              <div>
                <label class="field"><span>${trip ? 'Budget for this trip (Rs)' : 'Your budget (Rs)'}</span>
                  <input id="f-budget" type="text" inputmode="numeric" autocomplete="off" value="${st.budget ? esc(String(st.budget)) : ''}" placeholder="No budget set" /></label>
                ${trip ? '' : `<div class="seg mt-3 w-full [&>label]:flex-1" role="radiogroup" aria-label="Budget period">
                  <label><input type="radio" name="f-period" value="monthly" ${st.period === 'monthly' ? 'checked' : ''}><span>Per month</span></label>
                  <label><input type="radio" name="f-period" value="yearly" ${st.period === 'yearly' ? 'checked' : ''}><span>Per year</span></label></div>`}
              </div>
              <label class="field"><span>Sort by</span>
                <select id="f-sort">${sortOpts.map(([v, l]) => `<option value="${v}" ${st.sort === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
              ${isMotor(cat) ? `<fieldset>${railLegend('Cover type')}
                <div class="grid">${[['any', 'Show both'], ['third-party', 'Third-party only'], ['comprehensive', 'Comprehensive']].map(([v, l]) => checkRow(`<input type="radio" name="f-ct" value="${v}" class="mt-[2px] h-4 w-4" ${(st.profile.coverType || 'any') === v ? 'checked' : ''}><span>${l}</span>`)).join('')}</div></fieldset>` : ''}
              <fieldset>${railLegend('Refine')}
                <div class="grid">
                  ${checkRow(`<input type="checkbox" id="f-over" class="mt-[2px] h-4 w-4" ${st.hideOver ? 'checked' : ''}><span>Hide policies over my budget</span>`)}
                  ${hasVerified(cat) ? checkRow(`<input type="checkbox" id="f-ver" class="mt-[2px] h-4 w-4" ${st.verified ? 'checked' : ''}><span>Show only verified data</span>`) : ''}
                </div>
              </fieldset>
              <fieldset>${railLegend('Insurer')}
                <div class="grid max-h-56 overflow-y-auto pr-1">${cos.map((c) => checkRow(`<input type="checkbox" class="mt-[2px] h-4 w-4" name="f-ins" value="${esc(c.id)}" ${st.ins.includes(c.id) ? 'checked' : ''}><span>${esc(c.shortName || c.name || c.id)}</span>`)).join('')}</div>
                <button type="button" id="f-ins-clear" class="mt-1 inline-flex min-h-[44px] items-center text-sm font-medium text-ink-soft underline underline-offset-2 transition-colors hover:text-ink lg:min-h-[36px]">Show all insurers</button>
              </fieldset>
              <button type="button" id="r-apply" class="btn btn-primary w-full lg:hidden">Show results</button>
            </div>
          </aside>
          <div class="min-w-0">
            ${notes ? `<div class="mb-6 grid gap-3">${notes}</div>` : ''}
            <h2 class="sr-only">Matching policies</h2>
            <p id="r-count" class="mb-4 text-sm text-ink-mute" aria-live="polite" role="status"></p>
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

      // Number of filters currently changing the list, shown on the mobile "Filters and sort" button.
      function activeFilters() {
        return (st.budget ? 1 : 0) + (st.hideOver ? 1 : 0) + (st.verified ? 1 : 0) + (st.ins.length ? 1 : 0)
          + (st.profile.coverType && st.profile.coverType !== 'any' ? 1 : 0) + (st.sort !== 'recommended' ? 1 : 0);
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

        $('#r-summary').textContent = summary(cat, st);
        $('#r-count').textContent = `${ok.length} ${ok.length === 1 ? 'policy matches' : 'policies match'} your answers.`;
        $('#r-apply').textContent = ok.length ? `Show ${ok.length} ${ok.length === 1 ? 'policy' : 'policies'}` : 'Show results';
        const nf = activeFilters(), fc = $('#r-filter-count');
        fc.textContent = nf; fc.hidden = nf === 0;

        let html = '';
        if (!ok.length) {
          const tips = [];
          if (st.hideOver && st.budget) tips.push('turn off "Hide policies over my budget" or raise your budget');
          else if (st.budget) tips.push('raise your budget');
          if (st.verified) tips.push('turn off "Show only verified data"');
          if (st.ins.length) tips.push('show all insurers');
          if (cat.fields.includes('age')) tips.push('check the age you entered');
          html += `<div class="callout px-6 py-12 text-center">
            <span class="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white text-ink-soft">${UI.icon('search', 'h-5 w-5')}</span>
            <h2 class="mt-4 text-lg font-semibold tracking-tight text-ink">No policies match right now</h2>
            <p class="mx-auto mt-2 max-w-md leading-relaxed text-ink-soft">${tips.length ? 'Try to ' + esc(tips.join(', or ')) + '.' : 'Change your answers and try again.'}</p>
            <div class="mt-6 flex flex-wrap justify-center gap-2"><button type="button" class="btn btn-primary" data-reset>Remove all filters</button><a class="btn btn-ghost" href="#/quote/${esc(cat.id)}?${esc(qs)}">Edit answers</a></div></div>`;
        } else {
          html += ok.map((r) => rowHtml(r, st, badgeMap, qs, false)).join('');
        }
        if (out.length) {
          html += `<details class="group mt-2"><summary class="panel flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-[15px] font-medium text-ink transition-colors hover:border-line-strong [&::-webkit-details-marker]:hidden">
              <span>Not available for your answers <span class="font-normal text-ink-mute">(${out.length})</span></span>${UI.icon('chevron-down', 'h-4 w-4 text-ink-mute transition-transform group-open:rotate-180')}</summary>
            <div class="mt-4 grid gap-3">${out.map((r) => rowHtml(r, st, {}, qs, true)).join('')}</div></details>`;
        }
        listEl.innerHTML = html;
        UI.bindCompare(listEl);
        UI.icons();
        const reset = listEl.querySelector('[data-reset]');
        if (reset) reset.addEventListener('click', () => {
          st.ins = []; st.hideOver = false; st.verified = false; delete st.profile.coverType;
          root.querySelectorAll('input[name=f-ins]').forEach((c) => { c.checked = false; });
          $('#f-over').checked = false; if ($('#f-ver')) $('#f-ver').checked = false;
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
      if ($('#f-ver')) $('#f-ver').addEventListener('change', (e) => { st.verified = e.target.checked; update(); });
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
