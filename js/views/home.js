/* Home view (DESIGN.md v2): a calm hero where the search bar is the tool, a live example comparison,
 * then stats, cover types, how it works, insurers, FAQ and a call-back band. */
(function () {
  const E = window.Engine;
  const UI = window.UI;
  const esc = UI.esc;

  const D = () => E.DATA || { companies: [], policies: [], context: {} };

  // The example in the hero's preview card. Real numbers from Engine.match, not a mock-up.
  const PREVIEW = { cat: 'term-life', profile: { age: 30, sumAssured: 2500000, term: 20 } };

  // Chips under the search bar. Each one preselects the dropdown.
  const POPULAR = [
    ['term-life', 'Term life'], ['health', 'Health'], ['motor-bike', 'Bike & scooter'],
    ['motor-car', 'Car'], ['travel', 'Travel'], ['foreign-employment', 'Foreign employment'],
  ];

  const GROUP_ICON = { life: 'shield-check', health: 'heart-pulse', vehicle: 'car', travel: 'plane', property: 'house', farm: 'wheat' };

  const STEPS = [
    { t: 'Choose what to protect', d: 'Life, health, bike, car, travel, home or farm. Every type comes with a plain-words explanation.' },
    { t: 'Answer two or three questions', d: 'Your age and what you can spend are usually enough. No account, and no phone number until you want a call.' },
    { t: 'Compare and decide', d: 'See matching policies from every licensed insurer, side by side. Shortlist the ones you like and ask for a call back.' },
  ];

  const KIND = { life: 'Life', nonlife: 'Non-life', 'micro-life': 'Micro life', 'micro-nonlife': 'Micro non-life' };

  function counts() {
    const d = D();
    const cos = (d.companies || []).filter((c) => c.type !== 'reinsurance');
    return { companies: cos.length, policies: (d.policies || []).length, categories: (E.CATEGORIES || []).length };
  }

  // A quiet wall of insurers: the six life and six non-life companies with the most policies, listed A to Z.
  function wall(size) {
    const d = D();
    const per = {};
    (d.policies || []).forEach((p) => { per[p.companyId] = (per[p.companyId] || 0) + 1; });
    const pool = (d.companies || []).filter((c) => c.type !== 'reinsurance' && per[c.id])
      .sort((a, b) => (per[b.id] - per[a.id]) || String(a.shortName || a.name).localeCompare(String(b.shortName || b.name)));
    const pick = [];
    const take = (list, n) => list.forEach((c) => { if (n-- > 0 && !pick.includes(c)) pick.push(c); });
    take(pool.filter((c) => c.type === 'life'), size / 2);
    take(pool.filter((c) => c.type === 'nonlife'), size / 2);
    take(pool.filter((c) => !/micro/.test(c.type)), size - pick.length);
    take(pool, size - pick.length);
    return pick.sort((a, b) => String(a.shortName || a.name).localeCompare(String(b.shortName || b.name)))
      .map((c) => ({ c, n: per[c.id] }));
  }

  function faqs() {
    const all = ((D().context || {}).faqs || []).filter((f) => f && f.q && f.a);
    const want = [/compulsory/i, /tax/i, /miss/i, /cancel/i];
    const out = [];
    want.forEach((re) => { const f = all.find((x) => re.test(x.q) && !out.includes(x)); if (f) out.push(f); });
    all.forEach((f) => { if (out.length < 4 && !out.includes(f)) out.push(f); });
    return out.slice(0, 4);
  }

  // Split the cover groups into three runs (in reading order) so the desktop columns come out about level.
  function columns(list) {
    const n = list.length;
    if (n < 3) return list.map((g) => [g]);
    const h = list.map((g) => 170 + 44 * g.cats.length);
    const sum = (a, b) => h.slice(a, b).reduce((s, x) => s + x, 0);
    let best = null;
    for (let i = 1; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const worst = Math.max(sum(0, i), sum(i, j), sum(j, n));
        if (!best || worst < best.worst) best = { worst, i, j };
      }
    }
    return [list.slice(0, best.i), list.slice(best.i, best.j), list.slice(best.j)];
  }

  function coverGroups() {
    return (E.GROUPS || []).map((g) => {
      const cats = (E.CATEGORIES || []).filter((c) => c.group === g.id);
      return cats.length ? { g, cats } : null;
    }).filter(Boolean);
  }

  function groupCard({ g, cats }) {
    return `<div class="panel p-6 sm:p-8">
      <div class="flex items-center gap-3.5">
        <span class="grid place-items-center w-10 h-10 rounded-xl bg-sky text-ink-soft shrink-0">${UI.icon(GROUP_ICON[g.id] || cats[0].icon || 'shield', 'w-5 h-5')}</span>
        <div class="min-w-0">
          <h3 class="text-lg font-semibold leading-tight">${esc(g.label)}</h3>
          ${g.labelNe ? `<p class="mt-1 text-[13px] leading-tight text-ink-mute">${esc(g.labelNe)}</p>` : ''}
        </div>
      </div>
      <ul class="mt-5 -mx-3">
        ${cats.map((c) => `<li><a href="#/quote/${esc(c.id)}" class="group flex items-center justify-between gap-3 min-h-[44px] px-3 rounded-[10px] text-[15px] font-medium text-ink-soft transition-colors hover:bg-mist hover:text-ink">
          <span>${esc(c.label)}</span>${UI.icon('chevron-right', 'w-4 h-4 text-ink-mute transition-transform group-hover:translate-x-0.5')}</a></li>`).join('')}
      </ul>
    </div>`;
  }

  function selectOptions() {
    return '<option value="" disabled selected>Choose a type of cover</option>' + (E.GROUPS || []).map((g) => {
      const cats = (E.CATEGORIES || []).filter((c) => c.group === g.id);
      if (!cats.length) return '';
      return `<optgroup label="${esc(g.label)}${g.labelNe ? ' · ' + esc(g.labelNe) : ''}">${cats.map((c) => `<option value="${esc(c.id)}">${esc(c.label)}${c.labelNe ? ' · ' + esc(c.labelNe) : ''}</option>`).join('')}</optgroup>`;
    }).join('');
  }

  // Right-hand card in the hero: the top three plans for a typical 30-year-old, straight from the engine.
  function preview() {
    const cat = E.category(PREVIEW.cat);
    if (!cat) return '';
    const list = E.match(PREVIEW.cat, PREVIEW.profile).filter((r) => r.fit !== 'ineligible' && r.est && r.est.monthly != null);
    if (!list.length) return '';
    // Term cover pays out only on death, so a maturity-bonus badge would contradict the example. Keep the other two.
    const badges = E.badges(list);
    const badgeFor = (id) => (badges[id] || []).find((b) => !/bonus/i.test(b));
    // Three plans at different prices so the example shows a real spread; placeholder-named plans are left out.
    const rows = [];
    for (const r of list) {
      if (rows.length === 3) break;
      if (/\(indicative\)/i.test(r.policy.name) || rows.some((x) => x.est.monthly === r.est.monthly)) continue;
      rows.push(r);
    }
    const href = '#/results/' + PREVIEW.cat + '?' + new URLSearchParams(PREVIEW.profile).toString();
    const p = PREVIEW.profile;
    return `<aside class="panel-float p-6 sm:p-8" aria-labelledby="hv-pv-h">
      <p class="text-[13px] font-medium text-ink-mute">Example comparison</p>
      <h2 id="hv-pv-h" class="mt-1 text-xl font-semibold tracking-tight">${esc(cat.label)}, ${esc(E.nprShort(p.sumAssured))} cover</h2>
      <p class="mt-1 text-[14px] text-ink-mute">Age ${esc(String(p.age))}, ${esc(String(p.term))} years, estimated monthly premium</p>
      <ol class="mt-4 divide-y divide-line border-t border-line">
        ${rows.map((r) => {
          const b = badgeFor(r.policy.id);
          const nm = r.company.shortName || r.company.name || '';
          return `<li><a href="#/policy/${esc(r.policy.id)}" class="flex items-center gap-3.5 -mx-3 px-3 py-4 rounded-[10px] transition-colors hover:bg-mist">
            ${UI.avatar(r.company, 'w-10 h-10 text-sm')}
            <span class="min-w-0 flex-1">
              <span class="text-[15px] font-semibold leading-snug text-ink line-clamp-2">${esc(r.policy.name)}</span>
              <span class="block mt-0.5 text-[13px] text-ink-mute truncate">${esc(nm)}</span>
              ${b ? `<span class="block mt-1.5"><span class="badge-award">${esc(b)}</span></span>` : ''}
            </span>
            <span class="shrink-0 text-right">
              <span class="block text-[22px] font-semibold tracking-tight tabular-nums text-ink">${esc(E.npr(r.est.monthly))}</span>
              <span class="block text-[13px] text-ink-mute">/month est.</span>
            </span>
          </a></li>`;
        }).join('')}
      </ol>
      <p class="mt-4 text-[13px] leading-relaxed text-ink-mute">A live estimate from our data: three plans at different prices, in our recommended order. Your own age, cover and term will change these figures.</p>
      <a href="${esc(href)}" class="mt-2 -mb-2 inline-flex items-center gap-1.5 min-h-[44px] text-[15px] font-semibold text-ink underline-offset-4 hover:underline">See all ${esc(String(list.length))} plans ${UI.icon('arrow-right', 'w-4 h-4')}</a>
    </aside>`;
  }

  function render() {
    const n = counts();
    const pv = preview();
    const popular = POPULAR.filter(([id]) => E.category(id));
    const ins = wall(12);
    const fq = faqs();
    const cols = columns(coverGroups());
    const stats = [
      [n.companies ? E.num(n.companies) : '', 'Licensed insurers'],
      [n.policies ? E.num(n.policies) : '', 'Policies compared'],
      [n.categories ? E.num(n.categories) : '', 'Types of cover'],
      ['Rs 0', 'To use, no account needed'],
    ].filter(([v]) => v);
    const statCls = ['', 'pl-6 border-l border-line lg:pl-8', 'border-t border-line lg:border-t-0 lg:border-l lg:pl-8', 'pl-6 border-l border-t border-line lg:border-t-0 lg:pl-8'];

    return `
<style>
  @keyframes hv-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  .hv-rise{animation:hv-rise .65s var(--ease) both;animation-delay:calc(var(--i,0)*90ms + 60ms)}
  @keyframes hv-fade{from{opacity:0}to{opacity:1}}
  #hv-cat:invalid{color:var(--ink-meta)}
  #hv-cat option,#hv-cat optgroup{color:var(--ink)}
  .seg.hv-seg>label{flex:1 1 0}
  @media (min-width:640px){.seg.hv-seg>label{flex:none}}
  .hv-faq summary{list-style:none;cursor:pointer}
  .hv-faq summary::-webkit-details-marker{display:none}
  .hv-faq .hv-chev{transition:transform .2s var(--ease)}
  .hv-faq[open] .hv-chev{transform:rotate(180deg)}
  .hv-faq[open] .hv-ans{animation:hv-fade .22s var(--ease)}
  @media (prefers-reduced-motion:reduce){.hv-rise{animation:none}.hv-faq .hv-chev{transition:none}.hv-faq[open] .hv-ans{animation:none}}
</style>

<section aria-labelledby="hv-h1" class="bg-white">
  <div class="max-w-page mx-auto px-5 sm:px-8 pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-24">
    <div class="grid gap-12 lg:grid-cols-12 lg:gap-x-12 lg:items-center">
      <div class="min-w-0 lg:col-span-7">
        <p class="eyebrow-pill hv-rise" style="--i:0"><span class="w-1.5 h-1.5 rounded-full bg-pine" aria-hidden="true"></span>${n.companies ? `Comparing ${esc(E.num(n.companies))} licensed insurers in Nepal` : 'Comparing every licensed insurer in Nepal'}</p>
        <h1 id="hv-h1" class="hv-rise mt-6 text-[40px] sm:text-[56px] font-semibold tracking-tightest leading-[1.04]" style="--i:1">Insurance in Nepal, finally easy to compare.</h1>
        <p class="hv-rise mt-6 max-w-xl text-[17px] sm:text-lg leading-relaxed text-ink-soft" style="--i:2">Say what you want to protect and what you can spend. See matching policies from every licensed insurer, side by side.</p>

        <form id="hv-search" class="hv-rise panel-float mt-8 sm:mt-12 p-4 sm:p-6 grid grid-cols-1 gap-4" style="--i:3" novalidate aria-label="Find insurance">
          <label class="field min-w-0"><span>What to protect <span class="ml-1 font-normal text-ink-mute">के बीमा गर्ने?</span></span>
            <select id="hv-cat" name="cat" required aria-describedby="hv-picked hv-err">${selectOptions()}</select></label>
          <p class="-mt-2 text-[13px] leading-relaxed text-ink-mute" id="hv-picked" aria-live="polite" hidden></p>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_auto_auto] lg:grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-[minmax(0,1fr)_auto_auto] items-end">
            <label class="field min-w-0"><span>Budget <span class="font-normal text-ink-mute">(optional)</span></span>
              <span class="relative block font-normal">
                <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-medium text-ink-soft" aria-hidden="true">Rs</span>
                <input id="hv-amt" name="budget" class="block !pl-10" inputmode="numeric" autocomplete="off" placeholder="e.g. 2,000" aria-describedby="hv-hint hv-err" />
              </span></label>
            <div class="field">
              <span id="hv-per-l">Paid</span>
              <div class="seg hv-seg" role="radiogroup" aria-labelledby="hv-per-l">
                <label><input type="radio" name="period" value="monthly" checked /><span>Monthly</span></label>
                <label><input type="radio" name="period" value="yearly" /><span>Yearly</span></label>
              </div>
            </div>
            <button class="btn btn-primary w-full sm:col-span-2 md:col-span-1 lg:col-span-2 xl:col-span-1" type="submit">Compare plans</button>
          </div>
          <p class="form-error" id="hv-err" role="alert" hidden></p>
          <p class="-mt-1 text-[13px] leading-relaxed text-ink-mute" id="hv-hint">No budget in mind? Leave it empty and we will show every option.</p>
        </form>

        <div class="hv-rise mt-6 flex flex-wrap items-center gap-2" style="--i:4" role="group" aria-labelledby="hv-pop-l">
          <span id="hv-pop-l" class="mr-1 text-[14px] text-ink-mute">Popular</span>
          ${popular.map(([id, label]) => `<button type="button" class="btn btn-ghost btn-sm !rounded-full !font-medium !px-4" data-pick="${esc(id)}" aria-pressed="false">${esc(label)}</button>`).join('')}
        </div>
      </div>
      ${pv ? `<div class="hv-rise hidden lg:block lg:col-span-5" style="--i:3">${pv}</div>` : ''}
    </div>
  </div>
</section>

<section aria-label="BeemaKhoj at a glance" class="border-y border-line">
  <ul class="max-w-page mx-auto px-5 sm:px-8 grid grid-cols-2 lg:grid-cols-4">
    ${stats.map(([v, l], i) => `<li class="py-8 sm:py-10 ${statCls[i] || ''}">
      <p class="text-[34px] sm:text-[44px] font-semibold tracking-tightest leading-none tabular-nums text-ink">${esc(v)}</p>
      <p class="mt-3 text-[14px] text-ink-mute">${esc(l)}</p></li>`).join('')}
  </ul>
</section>

<section class="bg-mist" aria-labelledby="hv-cover">
  <div class="max-w-page mx-auto px-5 sm:px-8 py-20 sm:py-28">
    <div class="max-w-2xl">
      <h2 id="hv-cover" class="text-[26px] sm:text-[30px] font-semibold tracking-tight">Cover for every part of life</h2>
      <p class="mt-4 text-[17px] leading-relaxed text-ink-soft">Pick a type, answer two or three short questions, and see what each insurer offers.</p>
    </div>
    <div class="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:items-start">
      ${cols.map((col) => `<div class="contents lg:grid lg:gap-6 lg:content-start">${col.map(groupCard).join('')}</div>`).join('')}
    </div>
  </div>
</section>

<section class="bg-white" aria-labelledby="hv-how">
  <div class="max-w-page mx-auto px-5 sm:px-8 py-20 sm:py-28">
    <div class="max-w-2xl">
      <h2 id="hv-how" class="text-[26px] sm:text-[30px] font-semibold tracking-tight">How it works</h2>
      <p class="mt-4 text-[17px] leading-relaxed text-ink-soft">Three steps, usually under two minutes.</p>
    </div>
    <ol class="mt-12 sm:mt-16 grid gap-12 md:grid-cols-3">
      ${STEPS.map((s, i) => `<li class="relative">
        <span class="grid place-items-center w-9 h-9 rounded-full bg-sky text-[15px] font-semibold tabular-nums text-ink" aria-hidden="true">${i + 1}</span>
        ${i < STEPS.length - 1 ? '<span class="hidden md:block absolute top-[18px] left-12 -right-9 h-px bg-line" aria-hidden="true"></span>' : ''}
        <h3 class="mt-6 text-xl font-semibold tracking-tight"><span class="sr-only">Step ${i + 1}: </span>${esc(s.t)}</h3>
        <p class="mt-2.5 max-w-[36ch] leading-relaxed text-ink-soft">${esc(s.d)}</p></li>`).join('')}
    </ol>
  </div>
</section>

${ins.length ? `<section class="bg-white border-t border-line" aria-labelledby="hv-ins">
  <div class="max-w-page mx-auto px-5 sm:px-8 py-20 sm:py-28">
    <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div class="max-w-2xl">
        <h2 id="hv-ins" class="text-[26px] sm:text-[30px] font-semibold tracking-tight">Insurers you can compare</h2>
        <p class="mt-4 text-[17px] leading-relaxed text-ink-soft">${n.companies ? `A few of the ${esc(E.num(n.companies))} companies we cover, all` : 'Every company we cover is'} licensed by the Nepal Insurance Authority (Beema Samiti).</p>
      </div>
      <a href="#/companies" class="btn btn-ghost shrink-0 self-start sm:self-auto">See all insurers</a>
    </div>
    <ul class="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-line border border-line rounded-2xl overflow-hidden">
      ${ins.map(({ c, n: k }) => `<li class="bg-white"><a href="#/company/${esc(c.id)}" class="block h-full px-4 py-5 sm:px-6 sm:py-6 transition-colors hover:bg-mist focus-visible:-outline-offset-2">
        <span class="block text-[17px] font-semibold leading-snug tracking-tight text-ink">${esc(c.shortName || c.name)}</span>
        <span class="block mt-1 text-[13px] text-ink-mute">${esc(KIND[c.type] || 'Insurer')} · ${esc(String(k))} ${k === 1 ? 'policy' : 'policies'}</span></a></li>`).join('')}
      ${Array.from({ length: (12 - (ins.length % 12)) % 12 }, () => '<li class="bg-white" aria-hidden="true"></li>').join('')}
    </ul>
  </div>
</section>` : ''}

${fq.length ? `<section class="bg-mist" aria-labelledby="hv-faq">
  <div class="max-w-page mx-auto px-5 sm:px-8 py-20 sm:py-28 grid gap-12 lg:grid-cols-12 lg:gap-16">
    <div class="lg:col-span-4">
      <h2 id="hv-faq" class="text-[26px] sm:text-[30px] font-semibold tracking-tight">Questions people ask</h2>
      <p class="mt-4 text-[17px] leading-relaxed text-ink-soft">Short answers to the questions we hear most.</p>
      <a href="#/learn/faq" class="btn btn-ghost mt-8">Read all questions</a>
    </div>
    <div class="lg:col-span-8 border-t border-line-strong">
      ${fq.map((f) => `<details class="hv-faq border-b border-line-strong">
        <summary class="flex items-center justify-between gap-6 py-5 min-h-[64px] text-[17px] font-medium leading-snug text-ink"><span>${esc(f.q)}</span>${UI.icon('chevron-down', 'hv-chev w-5 h-5 shrink-0 text-ink-mute')}</summary>
        <p class="hv-ans pb-6 pr-10 max-w-[64ch] leading-relaxed text-ink-soft">${esc(f.a)}</p></details>`).join('')}
    </div>
  </div>
</section>` : ''}

<section class="bg-ink" aria-labelledby="hv-cta">
  <div class="max-w-page mx-auto px-5 sm:px-8 py-20 sm:py-28">
    <div class="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
      <div class="max-w-xl">
        <h2 id="hv-cta" class="text-[26px] sm:text-[30px] font-semibold tracking-tight">Prefer to talk to someone?</h2>
        <p class="mt-4 text-[17px] leading-relaxed text-white/70">Leave your name and mobile number and we will arrange a call within one working day to help you choose. No pressure.</p>
      </div>
      <button type="button" class="btn btn-light shrink-0 self-start md:self-auto" id="hv-call">Get a call back</button>
    </div>
    <ul class="mt-12 pt-12 border-t border-white/10 grid gap-8 md:grid-cols-3">
      <li class="flex gap-4">
        <span class="grid place-items-center w-10 h-10 rounded-xl bg-white/10 text-white/80 shrink-0">${UI.icon('database', 'w-5 h-5')}</span>
        <div><h3 class="text-[15px] font-semibold leading-snug text-white">Where the data comes from</h3>
        <p class="mt-1.5 text-[14px] leading-relaxed text-white/65">Insurer websites and the Nepal Insurance Authority. Each policy shows how well we could verify it.</p></div>
      </li>
      <li class="flex gap-4">
        <span class="grid place-items-center w-10 h-10 rounded-xl bg-white/10 text-white/80 shrink-0">${UI.icon('calculator', 'w-5 h-5')}</span>
        <div><h3 class="text-[15px] font-semibold leading-snug text-white">Premiums are estimates</h3>
        <p class="mt-1.5 text-[14px] leading-relaxed text-white/65">Worked out from published rates, so the insurer's own quote can differ. <a href="#/about" class="link-inline font-medium">How we estimate</a></p></div>
      </li>
      <li class="flex gap-4">
        <span class="grid place-items-center w-10 h-10 rounded-xl bg-white/10 text-white/80 shrink-0">${UI.icon('info', 'w-5 h-5')}</span>
        <div><h3 class="text-[15px] font-semibold leading-snug text-white">Not a broker</h3>
        <p class="mt-1.5 text-[14px] leading-relaxed text-white/65">This is a demo. We do not sell insurance, earn commission or issue policies, so please confirm details with the insurer before you pay.</p></div>
      </li>
    </ul>
  </div>
</section>`;
  }

  function mount(root) {
    const form = root.querySelector('#hv-search');
    if (!form) return;
    const sel = form.querySelector('#hv-cat');
    const amt = form.querySelector('#hv-amt');
    const err = form.querySelector('#hv-err');
    const picked = form.querySelector('#hv-picked');
    const chips = root.querySelectorAll('[data-pick]');

    const clearErr = () => {
      err.hidden = true;
      err.textContent = '';
      sel.removeAttribute('aria-invalid');
      amt.removeAttribute('aria-invalid');
    };
    const fail = (msg, field) => {
      err.textContent = msg;
      err.hidden = false;
      field.setAttribute('aria-invalid', 'true');
      field.focus();
    };
    // Keep the pressed chip and the plain-words line under the dropdown in step with the chosen cover type.
    const syncPick = () => {
      chips.forEach((c) => {
        const on = c.dataset.pick === sel.value;
        c.setAttribute('aria-pressed', String(on));
        c.classList.toggle('is-on', on);
      });
      const cat = E.category(sel.value);
      picked.textContent = cat && cat.blurb ? cat.label + ': ' + cat.blurb : '';
      picked.hidden = !picked.textContent;
    };

    sel.addEventListener('change', () => { clearErr(); syncPick(); });
    amt.addEventListener('input', clearErr);
    chips.forEach((c) => c.addEventListener('click', () => {
      sel.value = c.dataset.pick;
      clearErr();
      syncPick();
      amt.focus({ preventScroll: true });
    }));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErr();
      const cat = sel.value;
      if (!cat || !E.category(cat)) return fail('Choose what you want to protect first.', sel);
      const raw = amt.value.replace(/[,\s]/g, '').replace(/^rs\.?/i, '');
      if (raw && !/^\d+$/.test(raw)) return fail('Enter your budget in numbers only, for example 2000.', amt);
      const budget = raw ? parseInt(raw, 10) : 0;
      if (raw && budget <= 0) return fail('Enter a budget above zero, or leave it empty.', amt);
      if (budget > 1e9) return fail('That budget looks too large. Please check the amount.', amt);
      const picked = form.querySelector('input[name=period]:checked');
      const period = picked ? picked.value : 'monthly';
      const qs = window.Router.qs(budget ? { budget, period } : {});
      window.Router.go('#/quote/' + cat + (qs ? '?' + qs : ''));
    });

    syncPick(); // a browser may restore the dropdown on reload; bring chips and caption in line

    const call = root.querySelector('#hv-call');
    if (call) call.addEventListener('click', () => UI.openCallback());
  }

  window.Views = window.Views || {};
  window.Views.home = { render, mount };
})();
