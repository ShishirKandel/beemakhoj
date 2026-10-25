/* Insurer directory (#/companies) and insurer detail (#/company/:id). */
(function () {
  const E = window.Engine;
  const U = window.UI;
  const esc = U.esc;

  const TYPE_LABEL = {
    life: 'Life insurer', nonlife: 'Non-life insurer', 'micro-life': 'Micro life insurer',
    'micro-nonlife': 'Micro non-life insurer', reinsurance: 'Reinsurer',
  };
  const TYPE_CLS = {
    life: 'bg-sky-deep text-ink', nonlife: 'bg-sky text-ink-soft', 'micro-life': 'bg-marigold-tint text-[#7C4A03]',
    'micro-nonlife': 'bg-marigold-tint text-[#7C4A03]', reinsurance: 'bg-ink text-white',
  };
  const FILTERS = [
    ['all', 'All'], ['life', 'Life'], ['nonlife', 'Non-life'], ['micro', 'Micro'], ['reinsurance', 'Reinsurance'],
  ];
  const inFilter = (co, f) => f === 'all' || (f === 'micro' ? /^micro/.test(co.type) : co.type === f);
  const typeChip = (co) => U.chip(TYPE_LABEL[co.type] || 'Insurer', TYPE_CLS[co.type] || 'bg-sky text-ink-soft');
  const has = (v) => v !== undefined && v !== null && v !== '' && !(typeof v === 'number' && isNaN(v));
  const companies = () => (E.DATA.companies || []).slice();
  const retailCount = (co) => E.policiesOfCompany(co.id).length;
  const csr = (co) => (has(co.claimSettlementRatio) && !isNaN(Number(co.claimSettlementRatio)) ? Number(co.claimSettlementRatio) : null);
  const noteOf = (co) => (has(co.claimSettlementNote) ? String(co.claimSettlementNote) : '');
  const anyCsr = (list) => list.some((c) => csr(c) != null);
  const share = (co) => (has(co.marketSharePercent) ? co.marketSharePercent : has(co.marketShare) ? co.marketShare : null);
  const pct = (n) => (Math.round(n * 10) / 10) + '%';
  const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : null);
  const host = (u) => String(u).replace(/^https?:\/\//i, '').replace(/^www\./, '').replace(/\/.*$/, '');
  const telHref = (p) => 'tel:' + String(p).replace(/[^\d+]/g, '');
  const nm = (co) => co.shortName || co.name || '';

  /* ---------------- Directory ---------------- */
  const state = { q: '', filter: 'all', sort: 'name' };
  const COLS = 'md:grid-cols-[minmax(0,2.6fr)_1.2fr_.6fr_1.5fr_1.3fr_.9fr_76px]';

  function sorter(sort) {
    const nullLast = (get, dir) => (a, b) => {
      const x = get(a), y = get(b);
      if (x == null && y == null) return nm(a).localeCompare(nm(b));
      if (x == null) return 1;
      if (y == null) return -1;
      return (x - y) * dir || nm(a).localeCompare(nm(b));
    };
    return {
      name: (a, b) => nm(a).localeCompare(nm(b)),
      claims: nullLast(csr, -1),
      established: nullLast((c) => (has(c.established) ? c.established : null), 1),
      policies: (a, b) => retailCount(b) - retailCount(a) || nm(a).localeCompare(nm(b)),
    }[sort] || (() => 0);
  }

  function visible() {
    const q = state.q.trim().toLowerCase();
    return companies()
      .filter((c) => inFilter(c, state.filter))
      .filter((c) => !q || [c.name, c.shortName, c.nameNe].some((s) => s && String(s).toLowerCase().includes(q)))
      .sort(sorter(state.sort));
  }

  function row(co, showCsr) {
    const r = csr(co);
    const n = retailCount(co);
    const note = noteOf(co);
    const claim = !showCsr
      ? (has(co.branches) ? `<span class="tabular-nums">${esc(E.num(co.branches))}</span>` : '<span class="text-ink-mute" title="Not published">—</span>')
      : r != null
      ? `<div class="flex items-center gap-2"${note ? ` title="${esc(note)}"` : ''}><span class="font-semibold tabular-nums">${esc(pct(r))}</span><span class="block h-1.5 w-16 rounded-full bg-sky overflow-hidden" aria-hidden="true"><span class="block h-full bg-pine" style="width:${Math.max(0, Math.min(100, r))}%"></span></span></div>`
      : '<span class="text-ink-mute" title="Not published">—</span>';
    const products = co.type === 'reinsurance' ? '<span class="text-ink-mute">None (reinsurer)</span>' : `${n} ${n === 1 ? 'plan' : 'plans'}`;
    return `<li class="border-t border-line first:border-t-0">
      <div class="grid gap-x-4 gap-y-2 px-4 py-4 ${COLS} md:items-center">
        <div class="flex items-center gap-3 min-w-0">
          ${U.avatar(co)}
          <div class="min-w-0">
            <a href="#/company/${esc(co.id)}" class="font-semibold leading-tight hover:underline focus-visible:underline">${esc(nm(co))}</a>
            <div class="text-xs text-ink-mute truncate">${esc(co.name)}</div>
            ${co.nameNe ? `<div class="text-xs text-ink-mute truncate" lang="ne">${esc(co.nameNe)}</div>` : ''}
          </div>
        </div>
        <div class="text-sm">${typeChip(co)}</div>
        <div class="text-sm"><span class="md:hidden text-ink-mute">Established </span>${has(co.established) ? esc(co.established) : '<span class="text-ink-mute">—</span>'}</div>
        <div class="text-sm text-ink-soft"><span class="md:hidden text-ink-mute">Head office: </span>${has(co.headquarters) ? esc(co.headquarters) : '—'}</div>
        <div class="text-sm"><span class="md:hidden text-ink-mute block text-xs">${showCsr ? 'Claim settlement ratio' : 'Branches'}</span>${claim}</div>
        <div class="text-sm">${products}</div>
        <div><a href="#/company/${esc(co.id)}" class="btn btn-ghost btn-sm" aria-label="View ${esc(nm(co))}">View</a></div>
      </div></li>`;
  }

  function listHtml(list) {
    if (!list.length) {
      return '<div class="px-4 py-10 text-center"><p class="font-semibold">No insurer matches that.</p><p class="mt-1 text-sm text-ink-soft">Try a shorter name, or choose "All" above.</p></div>';
    }
    const showCsr = anyCsr(list);
    return `<div class="hidden md:grid ${COLS} gap-x-4 px-4 py-2 bg-sky text-xs font-semibold text-ink-soft" aria-hidden="true">
        <span>Insurer</span><span>Type</span><span>Since</span><span>Head office</span><span>${showCsr ? 'Claims settled' : 'Branches'}</span><span>Retail plans</span><span></span></div>
      <ul>${list.map((co) => row(co, showCsr)).join('')}</ul>`;
  }

  function countLine(list) {
    const all = companies().length;
    const f = FILTERS.find((x) => x[0] === state.filter)[1];
    return `Showing ${list.length} of ${all} insurers${state.filter !== 'all' ? ` (${f.toLowerCase()})` : ''}${state.q.trim() ? ` matching "${state.q.trim()}"` : ''}.`;
  }

  const companiesView = {
    title: 'Insurers in Nepal',
    render() {
      const all = companies();
      const cnt = (f) => all.filter((c) => inFilter(c, f)).length;
      const list = visible();
      return `
      <div class="max-w-page mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav aria-label="Breadcrumb" class="text-sm text-ink-mute"><a class="hover:underline" href="#/">Home</a> / Insurers</nav>
        <h1 class="mt-3 font-display text-3xl sm:text-4xl font-bold">Insurers in Nepal <span class="text-lg font-sans font-medium text-ink-mute" lang="ne">बीमा कम्पनीहरू</span></h1>
        <p class="mt-3 max-w-3xl text-ink-soft">${all.length} insurers hold a licence from Nepal's insurance regulator: ${cnt('life')} life, ${cnt('nonlife')} non-life, ${cnt('micro')} micro and ${cnt('reinsurance')} reinsurance. Look up who they are, how long they have been around, and what they sell. Then compare their plans side by side.</p>

        <div class="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
          <label class="field"><span>Search by name</span><input id="co-q" type="search" value="${esc(state.q)}" placeholder="e.g. Nepal Life, सिटिजन" autocomplete="off" /></label>
          <div>
            <div class="text-sm font-medium mb-1" id="co-f-label">Type of insurer</div>
            <div class="seg" role="radiogroup" aria-labelledby="co-f-label">
              ${FILTERS.map(([v, l]) => `<label><input type="radio" name="co-f" value="${v}" ${state.filter === v ? 'checked' : ''}/><span class="gap-2">${l}<span class="rounded-full bg-sky-deep/60 px-1.5 text-xs font-medium tabular-nums text-ink-mute">${cnt(v)}</span></span></label>`).join('')}
            </div>
          </div>
          <label class="field"><span>Sort by</span>
            <select id="co-s">
              ${[['name', 'Name (A to Z)'], anyCsr(all) && ['claims', 'Claim settlement ratio'], ['established', 'Oldest first'], ['policies', 'Number of plans']].filter(Boolean).map(([v, l]) => `<option value="${v}" ${state.sort === v ? 'selected' : ''}>${l}</option>`).join('')}
            </select></label>
        </div>

        <p id="co-count" class="mt-5 text-sm text-ink-soft" aria-live="polite" role="status">${esc(countLine(list))}</p>
        <div id="co-list" class="mt-2 rounded-xl border border-line bg-white overflow-hidden">${listHtml(list)}</div>
        ${anyCsr(all) ? '<p class="mt-2 text-xs text-ink-mute">Claim settlement ratio is the share of claims an insurer paid, as reported by the insurer or the regulator. Where it is not published we show a dash rather than guess.</p>' : ''}

        <section class="mt-12 max-w-3xl" aria-labelledby="co-explain">
          <h2 id="co-explain" class="font-display text-2xl font-bold">Life, non-life and micro insurers: what is the difference?</h2>
          <dl class="mt-4 grid gap-4 text-ink-soft">
            <div><dt class="font-semibold text-ink">Life insurers <span class="font-normal text-ink-mute" lang="ne">(जीवन बीमा)</span></dt><dd>Sell policies that last years: term life, savings, money-back, child education and pension plans. They pay your family if you die, or pay you a lump sum with bonus when the policy matures.</dd></div>
            <div><dt class="font-semibold text-ink">Non-life insurers <span class="font-normal text-ink-mute" lang="ne">(निर्जीवन बीमा)</span></dt><dd>Sell yearly policies for things that can go wrong: health, motorbike and car, travel, home, crops and livestock. You renew each year and claims pay for the loss that happened.</dd></div>
            <div><dt class="font-semibold text-ink">Micro insurers <span class="font-normal text-ink-mute" lang="ne">(लघुबीमा)</span></dt><dd>Sell small, low-cost life or non-life cover to lower-income households, often through cooperatives and microfinance lenders. Cover amounts are smaller and premiums are very low.</dd></div>
            <div><dt class="font-semibold text-ink">Reinsurers <span class="font-normal text-ink-mute" lang="ne">(पुनर्बीमा)</span></dt><dd>Insure the insurers themselves by taking on part of their big risks. They do not sell anything to the public, so you will not find plans to buy from them.</dd></div>
          </dl>
          <p class="mt-4 text-sm"><a class="text-ink underline font-semibold" href="#/learn">Read our plain-language guides</a></p>
        </section>
      </div>`;
    },
    mount(root) {
      const listEl = root.querySelector('#co-list');
      const countEl = root.querySelector('#co-count');
      const update = () => { const l = visible(); listEl.innerHTML = listHtml(l); countEl.textContent = countLine(l); U.icons(); };
      root.querySelector('#co-q').addEventListener('input', (e) => { state.q = e.target.value; update(); });
      root.querySelectorAll('input[name="co-f"]').forEach((r) => r.addEventListener('change', () => { state.filter = r.value; update(); }));
      root.querySelector('#co-s').addEventListener('change', (e) => { state.sort = e.target.value; update(); });
    },
  };

  /* ---------------- Detail ---------------- */
  function fact(label, value) {
    return has(value) ? `<div class="py-3"><dt class="text-sm text-ink-mute">${esc(label)}</dt><dd class="mt-0.5 font-semibold">${value}</dd></div>` : '';
  }

  function productRow(p) {
    const est = E.estimate(p, {});
    let price = '<span class="text-ink-mute">Price on request</span>';
    if (est && est.annual != null) {
      price = est.perTrip
        ? `<span class="font-semibold">${esc(E.npr(est.annual))}</span> <span class="text-xs text-ink-mute">est. for a 15-day trip</span>`
        : `<span class="font-semibold">${esc(E.npr(est.monthly))}</span><span class="text-xs text-ink-mute">/month est.</span> <span class="text-xs text-ink-mute">(${esc(E.npr(est.annual))}/year)</span>`;
    }
    return `<li class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-t border-line first:border-t-0">
      <div class="min-w-0 flex-1 basis-56">
        <a href="#/policy/${esc(p.id)}" class="font-semibold hover:underline focus-visible:underline">${esc(p.name)}</a>
        ${p.summary ? `<p class="text-sm text-ink-soft">${esc(p.summary)}</p>` : ''}
      </div>
      <div class="text-sm">${price}</div>
      <button type="button" class="btn btn-ghost btn-sm" data-compare="${esc(p.id)}" aria-pressed="false" aria-label="Compare ${esc(p.name)}"><span data-label>Compare</span></button>
    </li>`;
  }

  function productsHtml(co) {
    if (co.type === 'reinsurance') {
      return `<div class="rounded-xl border border-line bg-white p-5"><h2 class="font-display text-xl font-bold">What can I buy from ${esc(nm(co))}?</h2>
        <p class="mt-2 text-ink-soft">Nothing. A reinsurer insures other insurance companies: when an insurer sells many policies, it passes part of the risk to a reinsurer so a big disaster, such as an earthquake, does not sink it. Reinsurers sell nothing to the public, so there are no plans to compare here. If you want cover, pick a life or non-life insurer.</p>
        <a class="btn btn-ghost btn-sm mt-4" href="#/companies">See insurers that sell to you</a></div>`;
    }
    const pols = E.policiesOfCompany(co.id);
    if (!pols.length) {
      return `<div class="rounded-xl border border-line bg-white p-5"><h2 class="font-display text-xl font-bold">Plans</h2>
        <p class="mt-2 text-ink-soft">We have not listed any retail plans for this insurer yet. Check its website or nearest branch for what it sells today.</p></div>`;
    }
    const byCat = {};
    pols.forEach((p) => { (byCat[p.category] = byCat[p.category] || []).push(p); });
    const order = E.CATEGORIES.map((c) => c.id);
    const cats = Object.keys(byCat).sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
    return `<h2 class="font-display text-2xl font-bold">Plans from ${esc(nm(co))} <span class="text-base font-sans font-medium text-ink-mute">(${pols.length})</span></h2>
      <p class="mt-1 text-sm text-ink-soft">Prices are <a class="underline" href="#/about">estimates</a> for a typical customer (age 30, standard cover). Your own price depends on age, cover and health.</p>
      <div class="mt-4 grid gap-5">${cats.map((id) => {
        const c = E.category(id);
        return `<section aria-labelledby="pc-${esc(id)}"><h3 id="pc-${esc(id)}" class="font-semibold mb-2">${esc(c ? c.label : id)}${c && c.labelNe ? ` <span class="text-sm font-normal text-ink-mute" lang="ne">${esc(c.labelNe)}</span>` : ''}</h3>
          <ul class="rounded-xl border border-line bg-white overflow-hidden">${byCat[id].map(productRow).join('')}</ul></section>`;
      }).join('')}</div>`;
  }

  function contactHtml(co) {
    const site = safeUrl(co.website);
    const items = [
      has(co.phone) ? `<li class="flex items-center gap-2">${U.icon('phone', 'w-4 h-4 text-ink-mute')}<a class="underline" href="${esc(telHref(co.phone))}">${esc(co.phone)}</a></li>` : '',
      has(co.tollFree) ? `<li class="flex items-center gap-2">${U.icon('phone-call', 'w-4 h-4 text-ink-mute')}<a class="underline" href="${esc(telHref(co.tollFree))}">${esc(co.tollFree)}</a> <span class="text-xs text-ink-mute">toll-free</span></li>` : '',
      has(co.email) ? `<li class="flex items-center gap-2 break-all">${U.icon('mail', 'w-4 h-4 text-ink-mute shrink-0')}<a class="underline" href="mailto:${esc(co.email)}">${esc(co.email)}</a></li>` : '',
      site ? `<li class="flex items-center gap-2 break-all">${U.icon('external-link', 'w-4 h-4 text-ink-mute shrink-0')}<a class="underline" href="${esc(site)}" target="_blank" rel="noopener noreferrer">${esc(host(site))}<span class="sr-only"> (opens in a new tab)</span></a></li>` : '',
      has(co.headquarters) ? `<li class="flex items-start gap-2">${U.icon('map-pin', 'w-4 h-4 text-ink-mute mt-1 shrink-0')}<span>${esc(co.headquarters)}</span></li>` : '',
    ].filter(Boolean);
    if (!items.length) return '';
    return `<section class="rounded-xl border border-line bg-white p-5" aria-labelledby="co-contact"><h2 id="co-contact" class="font-display text-xl font-bold">Contact</h2>
      <ul class="mt-3 grid gap-2 text-sm">${items.join('')}</ul>
      <p class="mt-3 text-xs text-ink-mute">Details come from the insurer's public pages and may have changed. Confirm before you visit.</p></section>`;
  }

  function notFound() {
    return `<div class="max-w-page mx-auto px-4 sm:px-6 py-16"><h1 class="font-display text-3xl font-bold">We could not find that insurer</h1>
      <p class="mt-3 max-w-xl text-ink-soft">The link may be old or mistyped. Browse every licensed insurer in Nepal instead.</p>
      <a class="btn btn-primary mt-6" href="#/companies">See all insurers</a></div>`;
  }

  const companyView = {
    title(params) { const co = E.company(params.id); return co ? nm(co) : 'Insurer not found'; },
    render(params) {
      const co = E.company(params.id);
      if (!co) return notFound();
      const cr = csr(co), ms = share(co);
      const facts = [
        fact('Established', has(co.established) ? esc(co.established) : null),
        fact('Head office', has(co.headquarters) ? esc(co.headquarters) : null),
        fact('Branches', has(co.branches) ? esc(E.num(co.branches)) : null),
        fact('Paid-up capital', has(co.paidUpCapitalNPR) ? esc(E.nprShort(co.paidUpCapitalNPR)) : null),
        fact('Claim settlement ratio', cr != null ? `<span${noteOf(co) ? ` title="${esc(noteOf(co))}"` : ''}>${esc(pct(cr))}</span>` : null),
        fact('Market share', ms != null ? esc(typeof ms === 'number' ? pct(ms) : ms) : null),
        fact('NEPSE symbol', has(co.nepseSymbol) ? esc(co.nepseSymbol) : null),
        fact('Credit rating', has(co.creditRating) ? esc(co.creditRating) : null),
        fact('Merger history', has(co.mergerHistory) ? esc(co.mergerHistory) : null),
      ].filter(Boolean);
      const hl = Array.isArray(co.highlights) ? co.highlights.filter(has) : [];
      const sources = (Array.isArray(co.sources) ? co.sources : []).filter(has);
      return `
      <div class="max-w-page mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <nav aria-label="Breadcrumb" class="text-sm text-ink-mute"><a class="hover:underline" href="#/companies">Insurers</a> / ${esc(nm(co))}</nav>
        <header class="mt-4 flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
          ${U.avatar(co, 'w-20 h-20 text-2xl')}
          <div class="min-w-0">
            <h1 class="font-display text-3xl sm:text-4xl font-bold leading-tight">${esc(co.name)}</h1>
            ${co.nameNe ? `<p class="mt-1 text-ink-mute" lang="ne">${esc(co.nameNe)}</p>` : ''}
            <div class="mt-3 flex flex-wrap gap-2">${typeChip(co)}${U.confidence(co.dataConfidence)}</div>
          </div>
        </header>

        <div class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div class="grid gap-8 min-w-0">
            ${has(co.about) || hl.length ? `<section aria-labelledby="co-about"><h2 id="co-about" class="font-display text-xl font-bold">About</h2>${has(co.about) ? `<p class="mt-2 text-ink-soft max-w-3xl">${esc(co.about)}</p>` : ''}
              ${hl.length ? `<ul class="mt-4 grid gap-2 max-w-3xl">${hl.map((h) => `<li class="flex gap-2 text-ink-soft">${U.icon('check', 'w-5 h-5 text-pine shrink-0 mt-0.5')}<span>${esc(h)}</span></li>`).join('')}</ul>` : ''}</section>` : ''}
            ${facts.length ? `<section aria-labelledby="co-facts"><h2 id="co-facts" class="font-display text-xl font-bold">Key facts</h2>
              <dl class="mt-2 grid sm:grid-cols-2 sm:gap-x-8 divide-y divide-line border-y border-line">${facts.join('')}</dl></section>` : ''}
            <section aria-label="Plans">${productsHtml(co)}</section>
            ${sources.length ? `<section aria-labelledby="co-sources"><h2 id="co-sources" class="font-display text-lg font-bold">Where this information comes from</h2>
              <ul class="mt-2 grid gap-1 text-sm">${sources.map((s) => { const u = safeUrl(s); return `<li class="break-all">${u ? `<a class="text-ink-soft underline" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(host(u))}<span class="sr-only"> (opens in a new tab)</span></a>` : esc(s)}</li>`; }).join('')}</ul>
              <p class="mt-2 text-xs text-ink-mute">This is a demo. Figures are collected from public pages and may be out of date. Always confirm with the insurer.</p></section>` : ''}
          </div>
          <aside class="grid gap-4 content-start">
            ${contactHtml(co)}
            <div class="rounded-xl bg-sky p-5"><h2 class="font-semibold">Compare with other insurers</h2>
              <p class="mt-1 text-sm text-ink-soft">See how ${esc(nm(co))} stacks up against every other licensed insurer in Nepal.</p>
              <a class="btn btn-dark btn-sm mt-3" href="#/companies">Compare with other insurers</a></div>
          </aside>
        </div>
      </div>`;
    },
    mount(root) { U.bindCompare(root); },
  };

  window.Views = window.Views || {};
  window.Views.companies = companiesView;
  window.Views.company = companyView;
})();
