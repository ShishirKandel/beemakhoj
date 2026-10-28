/* Compare view: #/compare  (reads Store.get().compare)
 * v2 "calm & elegant": quiet actions row, hairline-only table, compact sticky policy cards, "Best" = pine dot + word. */
(function () {
  const E = window.Engine, UI = window.UI;
  const esc = UI.esc;
  const has = (v) => v !== undefined && v !== null && v !== '';
  const arr = (a) => (Array.isArray(a) ? a.filter((x) => x != null && String(x).trim() !== '') : []);
  const CONF_LABEL = { verified: 'Verified', partial: 'Partly verified', estimated: 'Indicative' };
  const MODE_LABEL = { yearly: 'Yearly', 'half-yearly': 'Half-yearly', quarterly: 'Quarterly', monthly: 'Monthly', single: 'Single premium' };
  const WRAP = 'max-w-page mx-auto px-5 sm:px-8';

  let onlyDiff = false; // view state, survives re-renders while on this page

  function items() {
    return E.Store.get().compare.map((id) => E.policy(id)).filter(Boolean).map((p) => {
      const raw = E.Store.profile(p.category) || {};
      const profile = {};
      ['age', 'sumAssured', 'term', 'coverAmount', 'vehicleValue', 'cc', 'tripDays', 'propertyValue'].forEach((k) => { const v = Number(raw[k]); if (has(raw[k]) && isFinite(v) && v > 0) profile[k] = v; });
      if (/^(any|third-party|comprehensive)$/.test(raw.coverType || '')) profile.coverType = raw.coverType;
      return { p, co: E.company(p.companyId) || {}, est: E.estimate(p, profile) };
    });
  }

  const dash = '<span class="text-ink-mute">Not listed</span>';
  function bullets(a, n) {
    const l = arr(a);
    if (!l.length) return dash;
    const shown = l.slice(0, n || 5);
    return `<ul class="grid gap-2 text-ink-soft">${shown.map((x) => `<li class="flex gap-2.5"><span class="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-mute" aria-hidden="true"></span><span>${esc(x)}</span></li>`).join('')}</ul>${l.length > shown.length ? `<p class="mt-2 text-[13px] text-ink-mute">+ ${l.length - shown.length} more on the policy page</p>` : ''}`;
  }
  const rng = (lo, hi, unit) => (has(lo) && has(hi) ? (lo === hi ? `${lo} ${unit}` : `${lo} to ${hi} ${unit}`) : has(lo) ? `${lo}+ ${unit}` : has(hi) ? `Up to ${hi} ${unit}` : '');
  const sumRange = (el) => (has(el.minSumAssured) && has(el.maxSumAssured) ? `${E.nprShort(el.minSumAssured)} to ${E.nprShort(el.maxSumAssured)}` : has(el.minSumAssured) ? `${E.nprShort(el.minSumAssured)} and above` : has(el.maxSumAssured) ? `Up to ${E.nprShort(el.maxSumAssured)}` : '');

  // Each row: label, key(item) -> comparable value (string|number|null), cell(item) -> text,
  // best: 'min' | 'max' | null for numeric highlighting. life: only for life categories.
  function buildRows(cat, list) {
    const hasCsr = (list || []).some((i) => has(i.co.claimSettlementRatio));
    const life = cat && E.LIFE_CATS.has(cat.id);
    const perTrip = cat && cat.id === 'travel';
    const rows = [
      { g: 'Price' },
      { l: perTrip ? 'Est. price for the trip' : 'Est. per month', best: 'min', num: (i) => (perTrip ? i.est.annual : i.est.monthly), cell: (i) => (perTrip ? (i.est.annual != null ? E.npr(i.est.annual) : null) : (i.est.monthly != null ? `${E.npr(i.est.monthly)}/month` : null)) },
      !perTrip && { l: 'Est. per year', best: 'min', num: (i) => i.est.annual, cell: (i) => (i.est.annual != null ? `${E.npr(i.est.annual)}/year` : null) },
      { l: 'What it is based on', key: (i) => i.est.basis, cell: (i) => i.est.basis || null, wrap: true },
      { l: 'Payment options', key: (i) => arr(i.p.premiumModes).join('|'), html: (i) => (arr(i.p.premiumModes).length ? arr(i.p.premiumModes).map((m) => esc(MODE_LABEL[m] || m)).join(', ') : dash) },
      { g: 'Insurer' },
      hasCsr && { l: 'Claims settled', best: 'max', num: (i) => i.co.claimSettlementRatio, cell: (i) => (has(i.co.claimSettlementRatio) ? `${i.co.claimSettlementRatio}%` : null), html: (i) => (has(i.co.claimSettlementRatio) ? `<span${has(i.co.claimSettlementNote) ? ` title="${esc(i.co.claimSettlementNote)}"` : ''}>${esc(i.co.claimSettlementRatio)}%</span>` : dash) },
      { l: 'Started', key: (i) => i.co.established, cell: (i) => (has(i.co.established) ? String(i.co.established) : null) },
      { l: 'Branches', best: 'max', num: (i) => i.co.branches, cell: (i) => (has(i.co.branches) ? E.num(i.co.branches) : null) },
      { l: 'Paid-up capital', best: 'max', num: (i) => i.co.paidUpCapitalNPR, cell: (i) => (has(i.co.paidUpCapitalNPR) ? E.nprShort(i.co.paidUpCapitalNPR) : null) },
      { g: 'Who can buy' },
      { l: 'Age when you join', key: (i) => rng(i.p.eligibility && i.p.eligibility.minEntryAge, i.p.eligibility && i.p.eligibility.maxEntryAge, 'years'), cell: (i) => rng(...[(i.p.eligibility || {}).minEntryAge, (i.p.eligibility || {}).maxEntryAge, 'years']) || null },
      life && { l: 'Policy term', key: (i) => rng((i.p.eligibility || {}).minTerm, (i.p.eligibility || {}).maxTerm, 'years'), cell: (i) => rng((i.p.eligibility || {}).minTerm, (i.p.eligibility || {}).maxTerm, 'years') || null },
      { l: 'Cover amount', key: (i) => sumRange(i.p.eligibility || {}), cell: (i) => sumRange(i.p.eligibility || {}) || null },
      { g: 'What you get' },
      { l: 'Benefits', key: (i) => arr(i.p.benefits).slice(0, 5).join('|'), html: (i) => bullets(i.p.benefits) },
      { l: 'Features', key: (i) => arr(i.p.features).slice(0, 5).join('|'), html: (i) => bullets(i.p.features) },
      { l: 'Optional add-ons (riders)', key: (i) => arr(i.p.riders).slice(0, 5).join('|'), html: (i) => bullets(i.p.riders) },
      { l: 'Not covered', key: (i) => arr(i.p.exclusions).slice(0, 5).join('|'), html: (i) => bullets(i.p.exclusions) },
      { g: 'Extras' },
      { l: 'Yearly bonus', best: 'max', num: (i) => i.p.bonusRatePer1000, cell: (i) => (has(i.p.bonusRatePer1000) ? `Rs ${E.num(i.p.bonusRatePer1000)} per Rs 1,000 cover` : null) },
      { l: 'Tax benefit', key: (i) => String(i.p.taxBenefit), cell: (i) => (i.p.taxBenefit === true ? 'Premium may be deducted from taxable income' : i.p.taxBenefit === false ? 'No tax deduction found' : null) },
      { l: 'Data confidence', key: (i) => i.p.dataConfidence, cell: (i) => CONF_LABEL[i.p.dataConfidence] || 'Indicative' },
    ];
    return rows.filter(Boolean);
  }

  function evalRow(row, list) {
    const cells = list.map((i) => (row.html ? row.html(i) : (row.cell(i) != null ? esc(row.cell(i)) : dash)));
    let keys, bestIdx = [];
    if (row.num) {
      const nums = list.map((i) => { const v = row.num(i); return has(v) && isFinite(v) ? Number(v) : null; });
      keys = nums.map(String);
      const valid = nums.filter((v) => v !== null);
      if (valid.length >= 2 && new Set(valid).size > 1) {
        const t = row.best === 'min' ? Math.min(...valid) : Math.max(...valid);
        nums.forEach((v, idx) => { if (v === t) bestIdx.push(idx); });
      }
    } else {
      keys = list.map((i) => String(row.key ? row.key(i) : ''));
    }
    return { cells, keys, bestIdx, same: new Set(keys).size <= 1 };
  }

  function empty() {
    const starts = ['term-life', 'health', 'motor-bike', 'motor-car', 'travel'].map((id) => E.category(id)).filter(Boolean);
    const steps = [
      'Find policies for what you want to protect.',
      `Press Compare on up to ${E.MAX_COMPARE} policies of the same type.`,
      'Come back here to see them side by side.',
    ];
    return `<div class="${WRAP} py-20 sm:py-28"><div class="max-w-xl">
      <span class="grid h-10 w-10 place-items-center rounded-xl bg-sky text-ink-soft">${UI.icon('scale', 'w-5 h-5')}</span>
      <h1 class="mt-6 text-[32px] sm:text-[40px] font-semibold tracking-tight leading-[1.1]">Compare policies</h1>
      <p class="mt-4 text-[17px] leading-relaxed text-ink-soft sm:text-lg">Put two or three policies side by side: price, claims record, cover, add-ons and what is not covered. You have not added any yet.</p>
      <ol class="mt-8 divide-y divide-line border-y border-line">${steps.map((s, i) => `<li class="flex items-baseline gap-4 py-4"><span class="w-4 shrink-0 text-[14px] font-semibold tabular-nums text-ink-mute">${i + 1}</span><span class="text-[16px] text-ink-soft">${esc(s)}</span></li>`).join('')}</ol>
      <div class="mt-8 flex flex-wrap gap-3"><a class="btn btn-primary" href="#/">Find policies</a><a class="btn btn-ghost" href="#/companies">Browse insurers</a></div>
      ${starts.length ? `<div class="mt-10"><p class="text-[14px] text-ink-mute">Or start with</p><div class="mt-3 flex flex-wrap gap-2">${starts.map((c) => `<a class="btn btn-ghost btn-sm !rounded-full !font-medium !px-4" href="#/quote/${esc(c.id)}">${esc(c.label)}</a>`).join('')}</div></div>` : ''}
    </div></div>`;
  }

  function render() {
    const list = items();
    if (!list.length) return empty();
    const cat = E.category(list[0].p.category);
    const rows = buildRows(cat, list);
    const ev = rows.map((r) => (r.g ? r : Object.assign({ ev: evalRow(r, list) }, r)));
    const cols = list.length + 1;

    // Group sections: drop rows that are identical when "only differences" is on, and empty groups.
    let body = '', pendingGroup = null, shown = 0;
    ev.forEach((r) => {
      if (r.g) { pendingGroup = r.g; return; }
      if (onlyDiff && r.ev.same && !r.ev.bestIdx.length && list.length > 1) return;
      if (pendingGroup) { body += `<tr><th scope="colgroup" colspan="${cols}" class="bg-mist p-0 text-left"><span class="sticky left-0 block w-max px-5 py-3 text-[13px] font-medium text-ink-mute sm:px-4">${esc(pendingGroup)}</span></th></tr>`; pendingGroup = null; }
      shown++;
      body += `<tr class="border-t border-line align-top"><th scope="row" class="sticky left-0 z-10 w-28 min-w-[7rem] border-r border-line bg-white py-4 pl-5 pr-3 text-left align-top text-[14px] font-medium leading-snug text-ink-soft sm:w-44 sm:pl-4 sm:pr-4 lg:border-r-0">${esc(r.l)}</th>${r.ev.cells.map((c, idx) => {
        const best = r.ev.bestIdx.includes(idx);
        return `<td class="min-w-[11.5rem] bg-white px-4 py-4 text-[15px] leading-snug text-ink">${best ? `<span class="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-pine"><span class="h-1.5 w-1.5 rounded-full bg-pine" aria-hidden="true"></span>Best</span>` : ''}<span class="${best ? 'font-semibold' : ''}">${c}</span></td>`;
      }).join('')}</tr>`;
    });
    if (!shown) body = `<tr class="border-t border-line"><td colspan="${cols}" class="bg-white px-5 py-8 text-[15px] text-ink-soft sm:px-4">These policies have no differences in the details we hold. Turn off "Show only differences" to see everything.</td></tr>`;

    const fig = 'text-[22px] font-semibold tabular-nums tracking-tight text-ink';
    const head = list.map((i) => {
      const e = i.est;
      const price = e.annual == null ? '<span class="text-[16px] font-semibold text-ink">Price on request</span>'
        : e.perTrip ? `<span class="${fig}">${E.npr(e.annual)}</span><span class="text-[13px] text-ink-mute">per trip, est.</span>`
          : `<span class="${fig}">${E.npr(e.monthly)}</span><span class="text-[13px] text-ink-mute">/month est.</span>`;
      return `<th scope="col" class="sticky top-0 z-20 min-w-[11.5rem] bg-white px-4 pb-4 pt-5 text-left align-top font-normal lg:top-[73px]">
        <div class="flex items-center gap-3">${UI.avatar(i.co, 'w-10 h-10 text-sm')}<div class="min-w-0"><a class="block font-semibold leading-snug text-ink hover:underline" href="#/policy/${esc(i.p.id)}">${esc(i.p.name)}</a><span class="block truncate text-[13px] text-ink-mute">${esc(i.co.shortName || i.co.name || '')}</span></div></div>
        <p class="mt-3 flex flex-wrap items-baseline gap-x-1.5">${price}</p></th>`;
    }).join('');

    const actions = list.map((i) => `<td class="bg-white px-4 pb-6 align-top"><div class="grid gap-2">
        <a class="btn btn-ghost btn-sm" href="#/policy/${esc(i.p.id)}">View details</a>
        <button type="button" class="btn btn-primary btn-sm" data-callback="${esc(i.p.id)}">Get a call back</button>
        <button type="button" class="btn btn-quiet btn-sm" data-remove="${esc(i.p.id)}" aria-label="Remove ${esc(i.p.name)} from comparison">${UI.icon('x', 'w-4 h-4')}Remove</button>
      </div></td>`).join('');

    const hint = list.length < 2 ? `<p class="callout mt-8 flex gap-3 px-5 py-4 text-[15px] leading-relaxed text-ink-soft no-print">${UI.icon('info', 'w-5 h-5 shrink-0 mt-0.5 text-ink-soft')}<span>Add at least one more ${esc(cat ? cat.label.toLowerCase() : '')} policy to see which is better value. Go back to the results and press <strong class="font-semibold text-ink">Compare</strong> on another.</span></p>` : '';

    const toggle = `<label class="inline-flex min-h-[44px] cursor-pointer items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium text-ink-soft transition-colors hover:bg-sky hover:text-ink">
        <span class="relative inline-flex h-6 w-10 shrink-0">
          <input type="checkbox" role="switch" id="cmp-diff" class="peer sr-only" ${onlyDiff ? 'checked' : ''} />
          <span class="absolute inset-0 rounded-full bg-line-strong transition-colors peer-checked:bg-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink" aria-hidden="true"></span>
          <span class="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" aria-hidden="true"></span>
        </span>Show only differences</label>`;

    return `<style>@media print{#site-header,#site-footer,#compare-tray,#toast-root,.no-print{display:none!important}.cmp-scroll{max-height:none!important;overflow:visible!important}body{background:#fff!important}}</style>
    <div class="${WRAP} py-10 sm:py-14">
      <div class="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div class="max-w-2xl">
          <h1 class="text-[32px] sm:text-[40px] font-semibold tracking-tight leading-[1.1]">Compare ${esc(cat ? cat.label.toLowerCase() : '')} policies</h1>
          <p class="mt-4 text-[17px] leading-relaxed text-ink-soft sm:text-lg">${list.length} ${list.length === 1 ? 'policy' : 'policies'} side by side. Prices are estimates for the details you entered, or typical defaults. <a class="link-inline" href="#/about">How we estimate</a></p>
        </div>
        <div class="no-print -mx-3 flex flex-wrap items-center gap-x-1 sm:mx-0">
          ${toggle}
          <button type="button" class="btn btn-quiet btn-sm" id="cmp-print">${UI.icon('printer', 'w-4 h-4')}Print</button>
          <button type="button" class="btn btn-quiet btn-sm" id="cmp-clear">Clear all</button>
        </div>
      </div>
      ${hint}
      <p class="sr-only" id="cmp-live" aria-live="polite" role="status"></p>
      <div class="cmp-scroll -mx-5 mt-8 overflow-x-auto border-b border-line sm:mx-0 sm:max-h-[80vh] sm:overflow-auto lg:max-h-none lg:overflow-visible" tabindex="0" role="region" aria-label="Policy comparison table. Scroll sideways on small screens.">
        <table class="w-full border-collapse" style="min-width:${Math.min(list.length, 3) * 184 + 112}px">
          <caption class="sr-only">Side-by-side comparison of ${list.length} policies. The best value in each numeric row is marked Best.</caption>
          <thead>
            <tr><th scope="col" class="sticky left-0 top-0 z-30 w-28 min-w-[7rem] border-r border-line bg-white pb-4 pl-5 pr-3 pt-5 text-left align-top text-[13px] font-normal text-ink-mute sm:w-44 sm:pl-4 sm:pr-4 lg:top-[73px] lg:border-r-0">${list.length} of ${E.MAX_COMPARE} policies</th>${head}</tr>
            <tr class="no-print"><td class="sticky left-0 z-10 border-r border-line bg-white lg:border-r-0"></td>${actions}</tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
      <p class="mt-6 max-w-2xl text-[14px] leading-relaxed text-ink-mute">"Best" marks the lowest price, the highest claim ratio, or the highest bonus in a row. The cheapest policy is not always the best: check what is not covered.</p>
    </div>`;
  }

  function mount(root) {
    const rerender = () => window.Router.render();
    root.querySelectorAll('[data-callback]').forEach((b) => b.addEventListener('click', () => UI.openCallback(b.dataset.callback)));
    root.querySelectorAll('[data-remove]').forEach((b) => b.addEventListener('click', () => {
      E.Store.toggleCompare(b.dataset.remove);
      UI.toast('Removed from comparison');
      rerender();
      const h = document.querySelector('#main h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }));
    const diff = root.querySelector('#cmp-diff');
    if (diff) diff.addEventListener('change', () => {
      onlyDiff = diff.checked; rerender();
      const d = document.getElementById('cmp-diff'); if (d) d.focus();
      const live = document.getElementById('cmp-live'); if (live) live.textContent = onlyDiff ? 'Showing only differences' : 'Showing all rows';
    });
    const pr = root.querySelector('#cmp-print');
    if (pr) pr.addEventListener('click', () => window.print());
    const cl = root.querySelector('#cmp-clear');
    if (cl) cl.addEventListener('click', () => {
      E.Store.clearCompare(); rerender();
      const h = document.querySelector('#main h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    });
  }

  window.Views = window.Views || {};
  window.Views.compare = { title: 'Compare policies', render, mount };
})();
