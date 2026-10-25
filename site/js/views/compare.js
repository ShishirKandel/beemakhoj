/* Compare view: #/compare  (reads Store.get().compare) */
(function () {
  const E = window.Engine, UI = window.UI;
  const esc = UI.esc;
  const has = (v) => v !== undefined && v !== null && v !== '';
  const arr = (a) => (Array.isArray(a) ? a.filter((x) => x != null && String(x).trim() !== '') : []);
  const CONF_LABEL = { verified: 'Verified', partial: 'Partly verified', estimated: 'Indicative' };
  const MODE_LABEL = { yearly: 'Yearly', 'half-yearly': 'Half-yearly', quarterly: 'Quarterly', monthly: 'Monthly', single: 'Single premium' };

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

  const dash = '<span class="text-ink-mute" aria-label="not listed">Not listed</span>';
  const txt = (s) => (has(s) && s !== '' ? esc(s) : dash);
  function bullets(a, n) {
    const l = arr(a);
    if (!l.length) return dash;
    const shown = l.slice(0, n || 5);
    return `<ul class="grid gap-1.5 list-disc pl-4 marker:text-ink-mute">${shown.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>${l.length > shown.length ? `<p class="mt-1.5 text-xs text-ink-mute">+ ${l.length - shown.length} more on the policy page</p>` : ''}`;
  }
  const rng = (lo, hi, unit) => (has(lo) && has(hi) ? (lo === hi ? `${lo} ${unit}` : `${lo} to ${hi} ${unit}`) : has(lo) ? `${lo}+ ${unit}` : has(hi) ? `Up to ${hi} ${unit}` : '');
  const sumRange = (el) => (has(el.minSumAssured) && has(el.maxSumAssured) ? `${E.nprShort(el.minSumAssured)} to ${E.nprShort(el.maxSumAssured)}` : has(el.minSumAssured) ? `${E.nprShort(el.minSumAssured)} and above` : has(el.maxSumAssured) ? `Up to ${E.nprShort(el.maxSumAssured)}` : '');

  // Each row: label, key(item) -> comparable value (string|number|null), cell(item) -> html,
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
    return `<div class="max-w-page mx-auto px-4 sm:px-6 py-14">
      <h1 class="font-display text-3xl sm:text-4xl font-extrabold">Compare policies</h1>
      <div class="panel mt-6 p-6 max-w-2xl">
        <p class="font-semibold text-lg">You have not added any policies yet</p>
        <p class="mt-2 text-ink-soft">To compare, find policies for what you want to protect, then press <strong>Compare</strong> on two or three of them. You can compare up to ${E.MAX_COMPARE} policies of the same type, side by side: price, claims record, cover, add-ons and what is not covered.</p>
        <div class="mt-5 flex flex-wrap gap-3"><a class="btn btn-primary" href="#/">Find policies</a><a class="btn btn-ghost" href="#/companies">Browse insurers</a></div>
      </div></div>`;
  }

  function render() {
    const list = items();
    if (!list.length) return empty();
    const cat = E.category(list[0].p.category);
    const rows = buildRows(cat, list);
    const ev = rows.map((r) => (r.g ? r : Object.assign({ ev: evalRow(r, list) }, r)));

    // Group sections: drop rows that are identical when "only differences" is on, and empty groups.
    let body = '', pendingGroup = null, shown = 0;
    ev.forEach((r) => {
      if (r.g) { pendingGroup = r.g; return; }
      if (onlyDiff && r.ev.same && !r.ev.bestIdx.length && list.length > 1) return;
      if (pendingGroup) { body += `<tr><th scope="colgroup" colspan="${list.length + 1}" class="sticky left-0 bg-sky text-left font-display font-bold px-3 sm:px-4 py-2 text-base">${esc(pendingGroup)}</th></tr>`; pendingGroup = null; }
      shown++;
      body += `<tr class="border-t border-line align-top"><th scope="row" class="sticky left-0 z-10 bg-white text-left font-medium text-ink-soft px-3 sm:px-4 py-3 w-28 sm:w-44 min-w-[7rem] border-r border-line">${esc(r.l)}</th>${r.ev.cells.map((c, idx) => {
        const best = r.ev.bestIdx.includes(idx);
        return `<td class="px-3 sm:px-4 py-3 min-w-[11.5rem] ${best ? 'bg-pine-tint' : 'bg-white'} text-sm">${best ? `<span class="inline-flex items-center gap-1 mb-1 text-xs font-bold text-pine">${UI.icon('badge-check', 'w-4 h-4')}Best</span><br>` : ''}<span class="${best ? 'font-semibold text-ink' : ''}">${c}</span></td>`;
      }).join('')}</tr>`;
    });
    if (!shown) body = `<tr><td colspan="${list.length + 1}" class="px-4 py-6 text-ink-soft bg-white">These policies have no differences in the details we hold. Turn off "Show only differences" to see everything.</td></tr>`;

    const head = list.map((i) => {
      const e = i.est;
      const price = e.annual == null ? 'Price on request' : e.perTrip ? `${E.npr(e.annual)} <span class="text-xs font-normal text-ink-mute">per trip, est.</span>` : `${E.npr(e.monthly)}<span class="text-xs font-normal text-ink-mute">/month est.</span>`;
      return `<th scope="col" class="bg-white px-3 sm:px-4 py-4 text-left align-top min-w-[11.5rem] font-normal border-b border-line">
        <div class="flex items-start gap-2.5">${UI.avatar(i.co, 'w-10 h-10 text-sm')}<div class="min-w-0"><a class="font-semibold leading-tight hover:underline block" href="#/policy/${esc(i.p.id)}">${esc(i.p.name)}</a><span class="text-sm text-ink-mute">${esc(i.co.shortName || i.co.name || '')}</span></div></div>
        <p class="mt-2 font-display font-bold text-lg">${price}</p>
        <div class="mt-3 grid gap-2">
          <a class="btn btn-ghost btn-sm" href="#/policy/${esc(i.p.id)}">View details</a>
          <button type="button" class="btn btn-primary btn-sm" data-callback="${esc(i.p.id)}">Get a call back</button>
          <button type="button" class="btn btn-quiet btn-sm" data-remove="${esc(i.p.id)}" aria-label="Remove ${esc(i.p.name)} from comparison">${UI.icon('x', 'w-4 h-4')}Remove</button>
        </div></th>`;
    }).join('');

    const hint = list.length < 2 ? `<p class="mt-4 rounded-lg bg-marigold-tint px-4 py-3 text-sm text-[#7C4A03]">Add at least one more ${esc(cat ? cat.label.toLowerCase() : '')} policy to see which is better value. Go back to the results and press <strong>Compare</strong> on another.</p>` : '';

    return `<style>@media print{#site-header,#site-footer,#compare-tray,#toast-root,.no-print{display:none!important}.cmp-scroll{max-height:none!important;overflow:visible!important}body{background:#fff!important}}</style>
    <div class="max-w-page mx-auto px-4 sm:px-6 pt-6 pb-16">
      <nav aria-label="Breadcrumb" class="text-sm text-ink-mute no-print"><a class="hover:underline" href="#/">Home</a><span aria-hidden="true" class="mx-1.5">/</span><span aria-current="page" class="text-ink-soft">Compare</span></nav>
      <div class="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="font-display text-3xl sm:text-4xl font-extrabold">Compare ${esc(cat ? cat.label.toLowerCase() : '')} policies</h1>
          <p class="mt-1 text-ink-soft">${list.length} ${list.length === 1 ? 'policy' : 'policies'} side by side. Prices are estimates for the details you entered, or typical defaults. <a class="underline" href="#/about">How we estimate</a></p>
        </div>
        <div class="flex flex-wrap items-center gap-3 no-print">
          <label class="inline-flex items-center gap-2 min-h-[44px] cursor-pointer"><input type="checkbox" id="cmp-diff" class="w-5 h-5 accent-[#0F766E]" ${onlyDiff ? 'checked' : ''} /><span>Show only differences</span></label>
          <button type="button" class="btn btn-ghost btn-sm" id="cmp-print">${UI.icon('printer', 'w-4 h-4')}Print</button>
          <button type="button" class="btn btn-quiet btn-sm" id="cmp-clear">Clear all</button>
        </div>
      </div>
      ${hint}
      <p class="sr-only" id="cmp-live" aria-live="polite" role="status"></p>
      <div class="cmp-scroll mt-6 overflow-auto sm:max-h-[85vh] rounded-xl border border-line bg-white" tabindex="0" role="region" aria-label="Policy comparison table. Scroll sideways on small screens.">
        <table class="border-collapse w-full" style="min-width:${Math.min(list.length, 3) * 184 + 112}px">
          <caption class="sr-only">Side-by-side comparison of ${list.length} policies. The best value in each numeric row is marked Best.</caption>
          <thead class="sticky top-0 z-20"><tr><th scope="col" class="sticky left-0 z-30 bg-white border-b border-r border-line px-3 sm:px-4 py-4 text-left align-bottom text-sm font-medium text-ink-mute w-28 sm:w-44 min-w-[7rem]">Compare</th>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
      <p class="mt-4 text-sm text-ink-mute">"Best" marks the lowest price, the highest claim ratio, or the highest bonus in a row. The cheapest policy is not always the best: check what is not covered.</p>
    </div>`;
  }

  function mount(root) {
    const list = items();
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
    if (cl) cl.addEventListener('click', () => { E.Store.clearCompare(); rerender(); });
  }

  window.Views = window.Views || {};
  window.Views.compare = { title: 'Compare policies', render, mount };
})();
