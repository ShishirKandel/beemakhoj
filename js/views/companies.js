/* Insurer directory (#/companies) and insurer detail (#/company/:id). Styled to DESIGN.md v2. */
(function () {
  const E = window.Engine;
  const U = window.UI;
  const esc = U.esc;

  const TYPE_LABEL = {
    life: 'Life insurer', nonlife: 'Non-life insurer', 'micro-life': 'Micro life insurer',
    'micro-nonlife': 'Micro non-life insurer', reinsurance: 'Reinsurer',
  };
  const TYPE_SHORT = {
    life: 'Life', nonlife: 'Non-life', 'micro-life': 'Micro life', 'micro-nonlife': 'Micro non-life', reinsurance: 'Reinsurer',
  };
  const FILTERS = [
    ['all', 'All'], ['life', 'Life'], ['nonlife', 'Non-life'], ['micro', 'Micro'], ['reinsurance', 'Reinsurance'],
  ];
  const inFilter = (co, f) => f === 'all' || (f === 'micro' ? /^micro/.test(co.type) : co.type === f);
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
  // Some insurers list several numbers in one string ("01-1, 01-2" or "01-1 / 01-2"); split so each one dials.
  const phonesOf = (s) => String(s).split(/\s*(?:,|\/|;)\s*/).map((x) => x.trim()).filter((x) => x.replace(/\D/g, '').length >= 5);
  const nm = (co) => co.shortName || co.name || '';
  const plansText = (co) => {
    if (co.type === 'reinsurance') return 'No retail plans';
    const n = retailCount(co);
    return `${n} ${n === 1 ? 'plan' : 'plans'}`;
  };

  const DASH = '<span class="text-ink-mute"><span aria-hidden="true">—</span><span class="sr-only">Not published</span></span>';
  // The visual column header row is aria-hidden, so every large-screen cell names itself for screen readers.
  const lbl = (t) => `<span class="sr-only">${t}: </span>`;
  // Slim pine bar on a quiet track: the claim ratio on a true 0-100 scale. Only drawn where the number exists.
  const bar = (r, w = 'w-14') => `<span class="block h-1 ${w} shrink-0 overflow-hidden rounded-full bg-sky-deep" aria-hidden="true"><span class="block h-full rounded-full bg-pine" style="width:${Math.max(0, Math.min(100, r))}%"></span></span>`;

  /* ---------------- Directory ---------------- */
  const state = { q: '', filter: 'all', sort: 'name' };
  const COLS = 'lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1.1fr)_3.5rem_minmax(0,1.7fr)_minmax(0,1.5fr)_4.5rem_3.5rem]';

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

  // One row, two layouts: a stacked summary below 1024px and a hairline table row from there up.
  // The insurer name is a stretched link, so the whole row is one tap target and one tab stop.
  function row(co, showCsr) {
    const r = csr(co);
    const short = nm(co);
    const legal = has(co.name) && co.name !== short ? co.name : '';
    const type = TYPE_SHORT[co.type] || 'Insurer';
    const metaLine = [type, has(co.established) ? `Since ${co.established}` : ''].filter(Boolean).join(' · ');

    const claimCell = !showCsr
      ? (has(co.branches) ? `<span class="tabular-nums text-ink">${esc(E.num(co.branches))}</span>` : DASH)
      : r != null
      ? `<span class="inline-flex items-center gap-3"><span class="font-semibold tabular-nums text-ink">${esc(pct(r))}</span>${bar(r)}</span>`
      : DASH;

    const stats = [];
    if (showCsr && r != null) stats.push(`<span class="inline-flex items-center gap-2"><span class="font-semibold tabular-nums text-ink">${esc(pct(r))}</span><span>claims settled</span>${bar(r, 'w-10')}</span>`);
    else if (!showCsr && has(co.branches)) stats.push(`<span><span class="tabular-nums text-ink">${esc(E.num(co.branches))}</span> branches</span>`);
    stats.push(`<span>${esc(plansText(co))}</span>`);

    return `<li class="group relative border-t border-line first:border-t-0 transition-colors duration-150 hover:bg-mist focus-within:bg-mist">
      <div class="flex items-center gap-4 px-4 py-4 sm:px-5 lg:grid ${COLS} lg:gap-x-4 lg:py-3.5">
        <div class="flex min-w-0 flex-1 items-center gap-3.5">
          ${U.avatar(co)}
          <div class="min-w-0">
            <a href="#/company/${esc(co.id)}" class="text-base font-semibold leading-snug text-ink after:absolute after:inset-0 hover:underline focus-visible:underline">${esc(short)}</a>
            ${legal ? `<p class="hidden truncate text-[13px] text-ink-mute lg:block">${esc(legal)}</p>` : ''}
            ${co.nameNe ? `<p class="truncate text-[13px] text-ink-mute" lang="ne">${esc(co.nameNe)}</p>` : ''}
            <p class="mt-0.5 text-[13px] text-ink-mute lg:hidden">${esc(metaLine)}</p>
            <p class="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px] text-ink-soft lg:hidden">${stats.join('')}</p>
          </div>
        </div>
        <div class="hidden text-sm text-ink-soft lg:block">${lbl('Type')}${esc(type)}</div>
        <div class="hidden text-sm tabular-nums text-ink-soft lg:block">${lbl('Established')}${has(co.established) ? esc(co.established) : DASH}</div>
        <div class="hidden text-sm leading-snug text-ink-soft lg:block">${lbl('Head office')}<span class="line-clamp-2">${has(co.headquarters) ? esc(co.headquarters) : DASH}</span></div>
        <div class="hidden text-sm lg:block">${lbl(showCsr ? 'Claims settled' : 'Branches')}${claimCell}</div>
        <div class="hidden text-sm text-ink-soft lg:block">${lbl('Plans')}${co.type === 'reinsurance' ? '<span class="text-ink-mute">None</span>' : esc(plansText(co))}</div>
        <div class="flex shrink-0 justify-end"><span class="inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition-colors group-hover:text-ink" aria-hidden="true"><span class="hidden lg:inline">View</span>${U.icon('chevron-right', 'w-4 h-4')}</span></div>
      </div></li>`;
  }

  function listHtml(list) {
    if (!list.length) {
      return `<div class="px-6 py-16 text-center">
        <span class="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-sky text-ink-soft">${U.icon('search', 'w-5 h-5')}</span>
        <p class="mt-4 text-lg font-semibold tracking-tight text-ink">No insurer matches that.</p>
        <p class="mt-1 text-sm text-ink-soft">Try a shorter name, or choose "All" above.</p></div>`;
    }
    const showCsr = anyCsr(list);
    return `<div class="hidden border-b border-line bg-mist px-5 py-3 text-[13px] font-medium text-ink-mute lg:grid ${COLS} lg:gap-x-4" aria-hidden="true">
        <span>Insurer</span><span>Type</span><span>Since</span><span>Head office</span><span>${showCsr ? 'Claims settled' : 'Branches'}</span><span>Plans</span><span></span></div>
      <ul>${list.map((co) => row(co, showCsr)).join('')}</ul>`;
  }

  function countLine(list) {
    const all = companies().length;
    const f = FILTERS.find((x) => x[0] === state.filter)[1];
    return `Showing ${list.length} of ${all} insurers${state.filter !== 'all' ? ` (${f.toLowerCase()})` : ''}${state.q.trim() ? ` matching "${state.q.trim()}"` : ''}.`;
  }

  const EXPLAIN = [
    ['Life insurers', 'जीवन बीमा', 'Sell policies that last years: term life, savings, money-back, child education and pension plans. They pay your family if you die, or pay you a lump sum with bonus when the policy matures.'],
    ['Non-life insurers', 'निर्जीवन बीमा', 'Sell yearly policies for things that can go wrong: health, motorbike and car, travel, home, crops and livestock. You renew each year and claims pay for the loss that happened.'],
    ['Micro insurers', 'लघुबीमा', 'Sell small, low-cost life or non-life cover to lower-income households, often through cooperatives and microfinance lenders. Cover amounts are smaller and premiums are very low.'],
    ['Reinsurers', 'पुनर्बीमा', 'Insure the insurers themselves by taking on part of their big risks. They do not sell anything to the public, so you will not find plans to buy from them.'],
  ];

  const companiesView = {
    title: 'Insurers in Nepal',
    render() {
      const all = companies();
      const cnt = (f) => all.filter((c) => inFilter(c, f)).length;
      const list = visible();
      const sorts = [['name', 'Name (A to Z)'], anyCsr(all) && ['claims', 'Claim settlement ratio'], ['established', 'Oldest first'], ['policies', 'Number of plans']].filter(Boolean);
      return `
      <div class="max-w-page mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-16 sm:pb-24">
        <h1 class="text-[32px] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[40px]">Insurers in Nepal</h1>
        <p class="mt-2 text-base text-ink-mute" lang="ne">बीमा कम्पनीहरू</p>
        <p class="mt-4 max-w-[62ch] text-[17px] leading-relaxed text-ink-soft sm:text-lg">${all.length} insurers are licensed in Nepal: ${cnt('life')} life, ${cnt('nonlife')} non-life, ${cnt('micro')} micro and ${cnt('reinsurance')} reinsurance. See who they are, how long they have operated and what they sell, then compare plans side by side.</p>

        <div class="mt-10 flex flex-wrap items-end gap-x-6 gap-y-5">
          <label class="field min-w-0 flex-1 basis-64"><span>Search by name</span>
            <span class="relative block">
              <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute">${U.icon('search', 'w-5 h-5')}</span>
              <input id="co-q" type="search" class="!pl-11" value="${esc(state.q)}" placeholder="e.g. Nepal Life, सिटिजन" autocomplete="off" />
            </span></label>
          <div>
            <div class="mb-[.45rem] text-sm font-medium text-ink-soft" id="co-f-label">Type of insurer</div>
            <div class="seg" role="radiogroup" aria-labelledby="co-f-label">
              ${FILTERS.map(([v, l]) => `<label><input type="radio" name="co-f" value="${v}" ${state.filter === v ? 'checked' : ''}/><span>${l}<span class="min-w-[1.375rem] rounded-full bg-sky-deep/50 px-1.5 text-center text-xs font-medium leading-[1.4] tabular-nums text-ink-soft">${cnt(v)}<span class="sr-only"> insurers</span></span></span></label>`).join('')}
            </div>
          </div>
        </div>

        <div class="mb-4 mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <p id="co-count" class="text-sm text-ink-mute sm:pb-3.5" aria-live="polite" role="status">${esc(countLine(list))}</p>
          <label class="field sm:w-56"><span>Sort by</span>
            <select id="co-s">
              ${sorts.map(([v, l]) => `<option value="${v}" ${state.sort === v ? 'selected' : ''}>${l}</option>`).join('')}
            </select></label>
        </div>
        <div id="co-list" class="panel overflow-hidden">${listHtml(list)}</div>
        ${anyCsr(all) ? '<p class="mt-4 max-w-[70ch] text-[13px] leading-relaxed text-ink-mute">Claims settled is an estimate of the share of claim money an insurer paid out, worked out from public regulator reports. Open an insurer to see how its figure was derived. Where there is no figure we show a dash rather than guess.</p>' : ''}
      </div>

      <section class="bg-mist" aria-labelledby="co-explain">
        <div class="max-w-page mx-auto px-5 sm:px-8 py-20 sm:py-28">
          <h2 id="co-explain" class="max-w-[32ch] text-[26px] font-semibold leading-tight tracking-tight text-ink sm:text-[30px]">Life, non-life and micro insurers: what is the difference?</h2>
          <dl class="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            ${EXPLAIN.map(([t, ne, d]) => `<div class="border-t border-line-strong pt-5"><dt><span class="block text-lg font-semibold text-ink">${esc(t)}</span><span class="block text-sm font-normal text-ink-mute" lang="ne">${esc(ne)}</span></dt><dd class="mt-3 text-[15px] leading-relaxed text-ink-soft">${esc(d)}</dd></div>`).join('')}
          </dl>
          <a class="btn btn-ghost btn-sm mt-10" href="#/learn">Read our plain-language guides</a>
        </div>
      </section>`;
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
  // A key fact: top hairline, small label, value. Long text values (address, rating, merger history) are set
  // smaller and take a full-width row below the short ones, so no row ever has a gap in the middle of it.
  function fact(label, raw, inner) {
    if (!has(raw)) return null;
    const s = String(raw);
    const long = s.length > 24;
    return {
      long,
      html: `<div class="border-t border-line py-5${long ? ' col-span-full' : ''}"><dt class="text-sm text-ink-mute">${esc(label)}</dt><dd class="mt-1.5 text-ink ${long ? 'max-w-[75ch] text-[15px] leading-relaxed' : 'text-xl font-semibold tabular-nums tracking-tight'}">${inner || esc(s)}</dd></div>`,
    };
  }

  function priceHtml(p) {
    const est = E.estimate(p, {});
    if (!est || est.annual == null) return '<span class="text-sm text-ink-mute">Price on request</span>';
    if (est.perTrip) {
      const days = ((E.category(p.category) || {}).defaults || {}).tripDays || 15;
      return `<span class="block text-[22px] font-semibold tabular-nums tracking-tight text-ink">${esc(E.npr(est.annual))}</span><span class="block text-[13px] text-ink-mute">est. for a ${esc(days)}-day trip</span>`;
    }
    return `<span class="block"><span class="whitespace-nowrap text-[22px] font-semibold tabular-nums tracking-tight text-ink">${esc(E.npr(est.monthly))}</span> <span class="whitespace-nowrap text-[13px] text-ink-mute">/month est.</span></span><span class="block text-[13px] tabular-nums text-ink-mute">${esc(E.npr(est.annual))} a year</span>`;
  }

  function productRow(p) {
    // Name and summary take the free width; price and the fixed-width Compare button sit together on the right
    // (under the name on phones). The fixed button width keeps "Compare" / "Added to compare" from shifting the row.
    return `<li class="flex flex-col gap-3 border-b border-line py-4 sm:flex-row sm:items-center sm:gap-6">
      <div class="min-w-0 flex-1">
        <a href="#/policy/${esc(p.id)}" class="font-semibold leading-snug text-ink hover:underline focus-visible:underline">${esc(p.name)}</a>
        ${p.summary ? `<p class="mt-0.5 line-clamp-2 text-sm leading-relaxed text-ink-soft">${esc(p.summary)}</p>` : ''}
      </div>
      <div class="flex items-center justify-between gap-4 sm:justify-end sm:gap-6">
        <div class="min-w-0 sm:text-right">${priceHtml(p)}</div>
        <button type="button" class="btn btn-ghost btn-sm w-44 shrink-0" data-compare="${esc(p.id)}" aria-pressed="false" aria-label="Compare ${esc(p.name)}"><span data-label>Compare</span></button>
      </div>
    </li>`;
  }

  function quietPanel(title, body, link) {
    return `<div class="callout"><h2 class="text-xl font-semibold tracking-tight text-ink">${esc(title)}</h2>
      <p class="mt-3 max-w-[60ch] leading-relaxed text-ink-soft">${esc(body)}</p>${link || ''}</div>`;
  }

  function productsHtml(co) {
    if (co.type === 'reinsurance') {
      return quietPanel(`What can I buy from ${nm(co)}?`,
        'Nothing. A reinsurer insures other insurance companies: when an insurer sells many policies, it passes part of the risk to a reinsurer so a big disaster, such as an earthquake, does not sink it. Reinsurers sell nothing to the public, so there are no plans to compare here. If you want cover, pick a life or non-life insurer.',
        '<a class="btn btn-ghost btn-sm mt-6" href="#/companies">See insurers that sell to you</a>');
    }
    const pols = E.policiesOfCompany(co.id);
    if (!pols.length) {
      return quietPanel('Plans', 'We have not listed any retail plans for this insurer yet. Check its website or nearest branch for what it sells today.');
    }
    const byCat = {};
    pols.forEach((p) => { (byCat[p.category] = byCat[p.category] || []).push(p); });
    const order = E.CATEGORIES.map((c) => c.id);
    const cats = Object.keys(byCat).sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
    return `<h2 class="text-[22px] font-semibold tracking-tight text-ink">Plans from ${esc(nm(co))} <span class="ml-1 text-base font-normal text-ink-mute">(${pols.length})</span></h2>
      <p class="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-ink-soft">Prices are <a class="link-inline" href="#/about">estimates</a> for a typical customer (age 30, standard cover). Your own price depends on age, cover and health.</p>
      <div class="mt-8 grid gap-10">${cats.map((id) => {
        const c = E.category(id);
        return `<section aria-labelledby="pc-${esc(id)}"><h3 id="pc-${esc(id)}" class="text-base font-semibold text-ink">${esc(c ? c.label : id)}${c && c.labelNe ? ` <span class="ml-1.5 text-sm font-normal text-ink-mute" lang="ne">${esc(c.labelNe)}</span>` : ''}</h3>
          <ul class="mt-3 border-t border-line">${byCat[id].map(productRow).join('')}</ul></section>`;
      }).join('')}</div>`;
  }

  function contactHtml(co) {
    const site = safeUrl(co.website);
    const link = (href, ico, label, after, newTab) => `<li><a class="flex min-h-[48px] items-center gap-3 py-2.5 text-[15px] text-ink hover:underline focus-visible:underline" href="${esc(href)}"${newTab ? ' target="_blank" rel="noopener noreferrer"' : ''}>${U.icon(ico, 'w-5 h-5 text-ink-soft')}<span class="min-w-0 break-words">${label}</span>${after || ''}</a></li>`;
    const items = [
      ...(has(co.phone) ? phonesOf(co.phone).map((p) => link(telHref(p), 'phone', `<span class="sr-only">Phone: </span>${esc(p)}`)) : []),
      ...(has(co.tollFree) ? phonesOf(co.tollFree).map((p) => link(telHref(p), 'phone-call', `<span class="sr-only">Toll-free: </span>${esc(p)}`, '<span class="chip ml-auto" aria-hidden="true">Toll-free</span>')) : []),
      has(co.email) ? link('mailto:' + co.email, 'mail', `<span class="sr-only">Email: </span>${esc(co.email)}`) : '',
      site ? link(site, 'globe', `${esc(host(site))}<span class="sr-only"> (opens in a new tab)</span>`, U.icon('external-link', 'ml-auto w-4 h-4 text-ink-mute'), true) : '',
    ].filter(Boolean);
    if (!items.length) return '';
    return `<section class="panel p-6" aria-labelledby="co-contact"><h2 id="co-contact" class="text-xl font-semibold tracking-tight text-ink">Contact</h2>
      <ul class="mt-2 divide-y divide-line">${items.join('')}</ul>
      <p class="mt-4 text-[13px] leading-relaxed text-ink-mute">Details come from the insurer's public pages and may have changed. Confirm before you visit.</p></section>`;
  }

  function sourcesHtml(sources) {
    if (!sources.length) return '';
    const total = {}, seen = {};
    sources.forEach((s) => { const u = safeUrl(s); if (u) total[host(u)] = (total[host(u)] || 0) + 1; });
    const items = sources.map((s) => {
      const u = safeUrl(s);
      if (!u) return `<li class="flex min-h-[44px] items-center break-all text-sm text-ink-soft">${esc(s)}</li>`;
      const h = host(u);
      seen[h] = (seen[h] || 0) + 1;
      const label = total[h] > 1 ? `${h} (${seen[h]})` : h;
      return `<li><a class="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-ink-soft underline decoration-ink-mute underline-offset-4 hover:text-ink" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(label)}${U.icon('external-link', 'w-3.5 h-3.5')}<span class="sr-only"> (opens in a new tab)</span></a></li>`;
    });
    return `<section class="mt-16 border-t border-line pt-8" aria-labelledby="co-sources"><h2 id="co-sources" class="text-[22px] font-semibold tracking-tight text-ink">Where this information comes from</h2>
      <ul class="mt-2 flex flex-wrap gap-x-6">${items.join('')}</ul>
      <p class="mt-2 max-w-[70ch] text-[13px] leading-relaxed text-ink-mute">This is a demo. Figures are collected from public pages and may be out of date. Always confirm with the insurer.</p></section>`;
  }

  function notFound() {
    return U.notFoundPage({
      title: 'We could not find that insurer',
      body: 'The link may be old or mistyped. Browse every licensed insurer in Nepal instead.',
      actions: [['#/companies', 'See all insurers', 'primary']],
    });
  }

  const companyView = {
    title(params) { const co = E.company(params.id); return co ? nm(co) : 'Insurer not found'; },
    render(params) {
      const co = E.company(params.id);
      if (!co) return notFound();
      const cr = csr(co), ms = share(co);
      const facts = [
        fact('Established', co.established),
        fact('Head office', co.headquarters),
        fact('Branches', has(co.branches) ? E.num(co.branches) : null),
        fact('Paid-up capital', has(co.paidUpCapitalNPR) ? E.nprShort(co.paidUpCapitalNPR) : null),
        cr != null
          ? fact('Claim settlement ratio', pct(cr), `<span class="inline-flex items-center gap-3">${esc(pct(cr))}${bar(cr, 'w-16')}</span>`)
          : null,
        fact('Market share', ms != null ? (typeof ms === 'number' ? pct(ms) : ms) : null),
        fact('NEPSE symbol', co.nepseSymbol),
        fact('Credit rating', co.creditRating),
        fact('Merger history', co.mergerHistory),
      ].filter(Boolean);
      // Short values first in a 3- or 4-column grid (whichever leaves fewer empty cells), long ones last, each on its own full-width row.
      const nShort = facts.filter((f) => !f.long).length;
      const factsHtml = facts.filter((f) => !f.long).concat(facts.filter((f) => f.long)).map((f) => f.html).join('');
      const factCols = (4 - (nShort % 4)) % 4 <= (3 - (nShort % 3)) % 3 ? 'lg:grid-cols-4' : 'lg:grid-cols-3';
      // The ratio's source note is a real caveat (a derived estimate), so it is printed, not hidden in a tooltip.
      const claimNote = cr != null && noteOf(co) ? `<p class="mt-4 max-w-[75ch] text-[13px] leading-relaxed text-ink-mute">Claim settlement ratio: ${esc(noteOf(co))}</p>` : '';
      const hl = Array.isArray(co.highlights) ? co.highlights.filter(has) : [];
      const sources = (Array.isArray(co.sources) ? co.sources : []).filter(has);
      const contact = contactHtml(co);
      const hasAbout = has(co.about);
      return `
      <header class="bg-mist">
        <div class="max-w-page mx-auto px-5 sm:px-8 pt-6 pb-10 sm:pt-8 sm:pb-14">
          ${U.breadcrumb([['#/', 'Home'], ['#/companies', 'Insurers']], nm(co))}
          <div class="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-7">
            ${U.avatar(co, 'w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl !rounded-2xl !bg-white')}
            <div class="min-w-0">
              <h1 class="text-[32px] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[40px]">${esc(co.name)}</h1>
              ${co.nameNe ? `<p class="mt-2 text-base text-ink-mute" lang="ne">${esc(co.nameNe)}</p>` : ''}
              <div class="mt-4 flex flex-wrap gap-2">${U.chip(TYPE_LABEL[co.type] || 'Insurer', U.CHIP_ON_MIST)}${U.confidence(co.dataConfidence, true)}</div>
            </div>
          </div>
          ${hasAbout || hl.length ? `<div class="mt-10 grid gap-8 ${hasAbout && hl.length ? 'lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16' : ''}">
            ${hasAbout ? `<section aria-labelledby="co-about"><h2 id="co-about" class="text-[22px] font-semibold tracking-tight text-ink">About</h2><p class="mt-3 max-w-[65ch] text-[17px] leading-relaxed text-ink-soft">${esc(co.about)}</p></section>` : ''}
            ${hl.length ? `<section aria-labelledby="co-hl"><h2 id="co-hl" class="text-[22px] font-semibold tracking-tight text-ink">Highlights</h2><ul class="mt-4 grid gap-3">${hl.map((h) => `<li class="flex gap-3 text-[15px] leading-relaxed text-ink-soft">${U.icon('check', 'w-5 h-5 text-pine mt-0.5')}<span>${esc(h)}</span></li>`).join('')}</ul></section>` : ''}
          </div>` : ''}
        </div>
      </header>

      <div class="max-w-page mx-auto px-5 sm:px-8 py-10 sm:py-14">
        ${facts.length ? `<section aria-labelledby="co-facts"><h2 id="co-facts" class="text-[22px] font-semibold tracking-tight text-ink">Key facts</h2>
          <dl class="mt-5 grid gap-x-8 sm:grid-cols-2 ${factCols}">${factsHtml}</dl>${claimNote}</section>` : ''}

        <div class="${facts.length ? 'mt-14 sm:mt-16' : ''} grid gap-12 ${contact ? 'lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12' : ''}">
          <section aria-label="Plans" class="min-w-0">${productsHtml(co)}</section>
          ${contact ? `<aside class="lg:sticky lg:top-24 self-start">${contact}</aside>` : ''}
        </div>

        ${sourcesHtml(sources)}
        <div class="mt-10"><a class="btn btn-ghost btn-sm" href="#/companies">${U.icon('arrow-left', 'w-4 h-4')}All insurers</a></div>
      </div>`;
    },
    mount(root) { U.bindCompare(root); },
  };

  window.Views = window.Views || {};
  window.Views.companies = companiesView;
  window.Views.company = companyView;
})();
