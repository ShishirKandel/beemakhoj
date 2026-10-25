/* Home view: the hero is the tool. Pick what to protect, set a budget, go to the quote flow. */
(function () {
  const E = window.Engine;
  const UI = window.UI;
  const esc = UI.esc;

  const D = () => E.DATA || { companies: [], policies: [], context: {} };

  function counts() {
    const d = D();
    const cos = (d.companies || []).filter((c) => c.type !== 'reinsurance');
    return { companies: cos.length, policies: (d.policies || []).length };
  }

  // Companies that actually sell retail policies, largest branch network first.
  function strip() {
    const d = D();
    const has = new Set((d.policies || []).map((p) => p.companyId));
    return (d.companies || [])
      .filter((c) => c.type !== 'reinsurance' && has.has(c.id))
      .sort((a, b) => (b.branches || 0) - (a.branches || 0))
      .slice(0, 12);
  }

  function faqs() {
    const all = ((D().context || {}).faqs || []).filter((f) => f && f.q && f.a);
    const want = [/compulsory/i, /tax/i, /miss/i, /cancel/i];
    const out = [];
    want.forEach((re) => { const f = all.find((x) => re.test(x.q) && !out.includes(x)); if (f) out.push(f); });
    all.forEach((f) => { if (out.length < 4 && !out.includes(f)) out.push(f); });
    return out.slice(0, 4);
  }

  const POPULAR = [
    { icon: 'shield-check', title: 'Term cover for a 30-year-old', sub: 'Rs 50 lakh for 20 years, with a budget of Rs 2,500 a month', cat: 'term-life',
      q: { age: 30, sumAssured: 5000000, term: 20, budget: 2500, period: 'monthly' } },
    { icon: 'heart-pulse', title: 'Health cover for a family', sub: 'Rs 10 lakh a year, aged 35, with a budget of Rs 30,000 a year', cat: 'health',
      q: { age: 35, coverAmount: 1000000, budget: 30000, period: 'yearly' } },
    { icon: 'bike', title: 'Bike third-party', sub: 'The legal minimum for a 150cc bike. You need it to renew your bluebook.', cat: 'motor-bike',
      q: { vehicleValue: 250000, cc: 150, coverType: 'third-party', budget: 3000, period: 'yearly' } },
  ];

  const STEPS = [
    { t: 'Choose what to protect', d: 'Life, health, bike, car, travel, home or farm. Not sure what a type means? Each one comes with a plain-words explanation.' },
    { t: 'Tell us your budget', d: 'Answer two or three short questions. Your age and how much you can spend are usually enough.' },
    { t: 'Compare and contact', d: 'See matching policies from every licensed insurer, side by side. Shortlist the ones you like and ask for a call back.' },
  ];

  function tile(c) {
    return `<button type="button" class="hv-tile text-left rounded-lg border border-line bg-white px-3 py-3 min-h-[64px] flex items-start gap-3 hover:border-ink-mute"
        data-cat="${esc(c.id)}" aria-pressed="false">
        <span class="hv-tile-ic shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-sky text-ink flex items-center justify-center">${UI.icon(c.icon || 'shield', 'w-5 h-5')}</span>
        <span class="min-w-0"><span class="block font-semibold leading-snug">${esc(c.label)}</span>${c.labelNe ? `<span class="block text-xs text-ink-mute leading-snug">${esc(c.labelNe)}</span>` : ''}</span>
      </button>`;
  }

  function groups() {
    return (E.GROUPS || []).map((g, i) => {
      const cats = (E.CATEGORIES || []).filter((c) => c.group === g.id);
      if (!cats.length) return '';
      return `<div class="hv-rise" style="--i:${Math.min(i + 2, 8)}">
        <h3 class="text-sm font-semibold text-ink-soft">${esc(g.label)}${g.labelNe ? ` <span class="font-normal text-ink-mute">${esc(g.labelNe)}</span>` : ''}</h3>
        <div class="mt-2 grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">${cats.map(tile).join('')}</div>
      </div>`;
    }).join('');
  }

  function render() {
    const n = counts();
    const insurers = strip();
    const fq = faqs();
    return `
<style>
  .hv-tile[aria-pressed="true"]{border-color:#14213D;box-shadow:inset 0 0 0 1px #14213D;background:#F6F8FB}
  .hv-tile[aria-pressed="true"] .hv-tile-ic{background:#14213D;color:#fff}
  @keyframes hv-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  .hv-rise{animation:hv-rise .5s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i,0)*70ms + 80ms)}
  .hv-faq summary{list-style:none;cursor:pointer}
  .hv-faq summary::-webkit-details-marker{display:none}
  .hv-faq[open] .hv-chev{transform:rotate(180deg)}
  .hv-chev{transition:transform .2s}
  @media (prefers-reduced-motion:reduce){.hv-rise{animation:none}.hv-chev{transition:none}}
</style>

<section aria-labelledby="hv-h1" class="bg-white border-b border-line">
  <div class="max-w-page mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8">
    <div class="max-w-2xl hv-rise" style="--i:0">
      <h1 id="hv-h1" class="font-display font-extrabold text-4xl sm:text-5xl leading-[1.05] tracking-tight">Find insurance that fits your budget, not the agent's target.</h1>
      <p class="mt-4 text-lg text-ink-soft">We compare ${n.policies ? `<strong>${esc(E.num(n.policies))} policies</strong> from ` : ''}${n.companies ? `all <strong>${esc(String(n.companies))} licensed insurers</strong> that sell to the public` : 'every licensed insurer'} in Nepal. Say what you want to protect and how much you can spend, and see what fits.</p>
    </div>

    <div class="mt-8 rounded-xl border border-line bg-paper p-4 sm:p-6" id="hv-tool">
      <div class="hv-rise" style="--i:1">
        <h2 class="font-display font-bold text-xl sm:text-2xl">What do you want to protect? <span class="text-base font-normal text-ink-mute">तपाईं के बीमा गर्न चाहनुहुन्छ?</span></h2>
        <p class="mt-1 text-sm text-ink-mute">Pick one. You can change it any time.</p>
      </div>
      <div class="mt-5 grid gap-5 lg:grid-cols-2" id="hv-groups">${groups()}</div>

      <form id="hv-budget" class="hidden mt-6 pt-5 border-t border-line" novalidate aria-labelledby="hv-bud-h">
        <h3 id="hv-bud-h" class="font-display font-bold text-lg">How much can you spend? <span class="text-sm font-normal text-ink-mute">तपाईंको बजेट</span></h3>
        <p class="mt-1 text-sm text-ink-soft" id="hv-picked" aria-live="polite"></p>
        <div class="mt-4 flex flex-col sm:flex-row sm:items-end gap-4">
          <label class="field sm:w-56"><span>Amount (Rs)</span>
            <input id="hv-amt" name="budget" inputmode="numeric" autocomplete="off" placeholder="e.g. 2,000" aria-describedby="hv-hint" /></label>
          <div>
            <span class="block text-sm font-semibold mb-1" id="hv-per-l">Paid</span>
            <div class="seg" role="radiogroup" aria-labelledby="hv-per-l">
              <label><input type="radio" name="period" value="monthly" checked /><span>Monthly</span></label>
              <label><input type="radio" name="period" value="yearly" /><span>Yearly</span></label>
            </div>
          </div>
          <button class="btn btn-primary sm:ml-auto" type="submit">See my options</button>
        </div>
        <p class="mt-2 text-xs text-ink-mute" id="hv-hint">Not sure? Leave it empty and we will show everything, cheapest first.</p>
        <p class="mt-2 text-sm text-crimson hidden" id="hv-err" role="alert"></p>
      </form>
    </div>
  </div>
</section>

<section class="max-w-page mx-auto px-4 sm:px-6 py-14" aria-labelledby="hv-how">
  <div class="grid lg:grid-cols-[1fr_2fr] gap-8">
    <div>
      <h2 id="hv-how" class="font-display font-bold text-3xl">How it works</h2>
      <p class="mt-3 text-ink-soft">Three steps, usually under two minutes. No account, and no phone number until you want a call.</p>
    </div>
    <ol class="grid border-l-2 border-ink ml-3.5 lg:ml-0">
      ${STEPS.map((s, i) => `<li class="relative pl-7 pb-7 last:pb-0">
        <span class="absolute -left-[15px] top-0 w-7 h-7 rounded-full bg-ink text-white text-sm font-bold flex items-center justify-center" aria-hidden="true">${i + 1}</span>
        <h3 class="font-semibold text-lg"><span class="sr-only">Step ${i + 1}: </span>${esc(s.t)}</h3>
        <p class="mt-1 text-ink-soft max-w-prose">${esc(s.d)}</p></li>`).join('')}
    </ol>
  </div>
</section>

<section class="bg-sky" aria-labelledby="hv-pop">
  <div class="max-w-page mx-auto px-4 sm:px-6 py-14">
    <h2 id="hv-pop" class="font-display font-bold text-3xl">Popular right now</h2>
    <p class="mt-2 text-ink-soft">Start from a common situation. You can change every detail on the results page.</p>
    <div class="mt-6 grid md:grid-cols-3 bg-white rounded-xl border border-line divide-y md:divide-y-0 md:divide-x divide-line overflow-hidden">
      ${POPULAR.map((p, i) => {
        const href = '#/results/' + p.cat + '?' + (window.Router ? window.Router.qs(p.q) : new URLSearchParams(p.q).toString());
        return `<a href="${esc(href)}" class="group p-5 flex flex-col gap-3 hover:bg-paper" data-pop="${i}">
          <span class="w-10 h-10 rounded-lg bg-sky flex items-center justify-center">${UI.icon(p.icon, 'w-5 h-5')}</span>
          <span class="font-display font-bold text-xl leading-snug">${esc(p.title)}</span>
          <span class="text-sm text-ink-soft">${esc(p.sub)}</span>
          <span class="mt-auto pt-2 inline-flex items-center gap-1.5 font-semibold text-sm underline underline-offset-4 decoration-line group-hover:decoration-ink">See matching policies ${UI.icon('arrow-right', 'w-4 h-4')}</span>
        </a>`;
      }).join('')}
    </div>
  </div>
</section>

${insurers.length ? `<section class="max-w-page mx-auto px-4 sm:px-6 py-14" aria-labelledby="hv-ins">
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div><h2 id="hv-ins" class="font-display font-bold text-3xl">Insurers on BeemaKhoj</h2>
    <p class="mt-2 text-ink-soft">Every company here is licensed by the Nepal Insurance Authority (Beema Samiti).</p></div>
    <a href="#/companies" class="btn btn-ghost">See all insurers</a>
  </div>
  <ul class="mt-6 flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
    ${insurers.map((c) => `<li class="shrink-0"><a href="#/company/${esc(c.id)}" class="flex items-center gap-3 rounded-full border border-line bg-white pl-1.5 pr-4 py-1.5 min-h-[44px] hover:border-ink-mute">
      ${UI.avatar(c, 'w-9 h-9 text-xs')}<span class="font-semibold text-sm whitespace-nowrap">${esc(c.shortName || c.name)}</span></a></li>`).join('')}
  </ul>
</section>` : ''}

${fq.length ? `<section class="bg-white border-y border-line" aria-labelledby="hv-faq">
  <div class="max-w-page mx-auto px-4 sm:px-6 py-14 grid lg:grid-cols-[1fr_2fr] gap-8">
    <div>
      <h2 id="hv-faq" class="font-display font-bold text-3xl">Things people in Nepal ask</h2>
      <p class="mt-3 text-ink-soft">Short answers to the questions we hear most.</p>
      <a href="#/learn/faq" class="btn btn-ghost mt-5">Read all questions</a>
    </div>
    <div class="divide-y divide-line border-y border-line self-start">
      ${fq.map((f) => `<details class="hv-faq">
        <summary class="flex items-center justify-between gap-4 py-3 min-h-[44px] font-semibold"><span>${esc(f.q)}</span>${UI.icon('chevron-down', 'hv-chev w-5 h-5 shrink-0 text-ink-mute')}</summary>
        <p class="pb-4 pr-8 text-ink-soft">${esc(f.a)}</p></details>`).join('')}
    </div>
  </div>
</section>` : ''}

<section class="max-w-page mx-auto px-4 sm:px-6 py-14" aria-labelledby="hv-trust">
  <div class="grid lg:grid-cols-[1fr_2fr] gap-8">
    <h2 id="hv-trust" class="font-display font-bold text-3xl">What you should know about us</h2>
    <ul class="grid gap-4 max-w-prose text-ink-soft">
      <li class="flex gap-3">${UI.icon('database', 'w-5 h-5 mt-1 shrink-0 text-pine')}<span><strong class="text-ink">Where the data comes from.</strong> Policy details come from insurer websites and the Nepal Insurance Authority (nia.gov.np). Each policy shows how well we could verify it.</span></li>
      <li class="flex gap-3">${UI.icon('calculator', 'w-5 h-5 mt-1 shrink-0 text-pine')}<span><strong class="text-ink">Premiums are estimates.</strong> We work them out from published rates. The insurer's own quote can be higher or lower. <a class="underline" href="#/about">See how we estimate</a>.</span></li>
      <li class="flex gap-3">${UI.icon('info', 'w-5 h-5 mt-1 shrink-0 text-pine')}<span><strong class="text-ink">This is a demo, not a broker.</strong> We do not sell insurance or earn commission, and we cannot issue a policy. Always confirm details with the insurer before you pay.</span></li>
    </ul>
  </div>
</section>

<section class="bg-ink text-white" aria-labelledby="hv-cta">
  <div class="max-w-page mx-auto px-4 sm:px-6 py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div>
      <h2 id="hv-cta" class="font-display font-bold text-3xl">Prefer to talk to someone?</h2>
      <p class="mt-2 text-white/80 max-w-xl">Leave your name and mobile number and an advisor will call you within one working day to help you choose. No pressure.</p>
    </div>
    <button type="button" class="btn btn-primary shrink-0" id="hv-call">Get a call back</button>
  </div>
</section>`;
  }

  function mount(root) {
    const form = root.querySelector('#hv-budget');
    const tiles = root.querySelectorAll('.hv-tile');
    if (!form) return;
    const amt = root.querySelector('#hv-amt');
    const err = root.querySelector('#hv-err');
    const picked = root.querySelector('#hv-picked');
    let cat = null;
    const reduce = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function select(id, btn) {
      cat = id;
      tiles.forEach((t) => t.setAttribute('aria-pressed', String(t === btn)));
      const c = E.category(id) || {};
      picked.textContent = c.label ? c.label + (c.blurb ? ': ' + c.blurb : '') : '';
      form.classList.remove('hidden');
      err.classList.add('hidden');
      form.scrollIntoView({ block: 'nearest', behavior: reduce() ? 'auto' : 'smooth' });
      amt.focus({ preventScroll: true });
    }
    tiles.forEach((t) => t.addEventListener('click', () => select(t.dataset.cat, t)));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!cat) { err.textContent = 'Pick what you want to protect first.'; err.classList.remove('hidden'); return; }
      const raw = amt.value.replace(/[,\s]/g, '').replace(/^rs\.?/i, '');
      if (raw && !/^\d+$/.test(raw)) { err.textContent = 'Enter the amount in numbers only, for example 2000.'; err.classList.remove('hidden'); amt.focus(); return; }
      const budget = raw ? parseInt(raw, 10) : 0;
      if (raw && budget <= 0) { err.textContent = 'Enter an amount above zero, or leave it empty.'; err.classList.remove('hidden'); amt.focus(); return; }
      const sel = form.querySelector('input[name=period]:checked');
      const period = sel ? sel.value : 'monthly';
      err.classList.add('hidden');
      const qs = window.Router.qs(budget ? { budget, period } : {});
      window.Router.go('#/quote/' + cat + (qs ? '?' + qs : ''));
    });

    const call = root.querySelector('#hv-call');
    if (call) call.addEventListener('click', () => UI.openCallback());
  }

  window.Views = window.Views || {};
  window.Views.home = { render, mount };
})();
