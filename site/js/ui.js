/* Shared UI helpers and site chrome (header, footer, compare tray, toast, modal).
 * Views build HTML strings with these helpers; event wiring happens in each view's mount().
 * Visual styling lives in css/app.css (DESIGN.md v2); this file owns the chrome markup. */
(function () {
  const E = window.Engine;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (name, cls = 'w-5 h-5') => `<i data-lucide="${name}" class="${cls}" aria-hidden="true"></i>`;
  const icons = () => window.lucide && window.lucide.createIcons();

  // Insurer mark: monochrome initials on a quiet sky tile (colour comes from .co-mark in app.css).
  function avatar(co, size = 'w-11 h-11 text-sm') {
    const name = (co && (co.shortName || co.name)) || '?';
    const initials = name.replace(/\b(Ltd|Limited|Company|Insurance|Co|The)\b\.?/gi, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
      || name.slice(0, 2).toUpperCase();
    return `<span class="co-mark ${size}" aria-hidden="true">${esc(initials)}</span>`;
  }

  // Data-confidence chips. Only "Verified" earns colour (pine); the rest are quiet sky chips whose dot shows how far
  // along they are (gold = partly, grey = indicative). Gold stays reserved for awards and "near budget".
  const CONF = {
    verified: ['Verified', 'bg-pine-tint text-pine', 'bg-current'],
    partial: ['Partly verified', 'bg-sky text-ink-soft', 'bg-marigold'],
    estimated: ['Indicative', 'bg-sky text-ink-soft', 'bg-ink-mute'],
  };
  const confDot = (c) => (CONF[c] || CONF.estimated)[2];
  const confidence = (c, onMist) => {
    if (c === 'verified') return `<span class="badge-good" title="How sure we are about this data">${icon('check', 'h-3 w-3')}Verified</span>`;
    const [l, base, dot] = CONF[c] || CONF.estimated;
    const cls = onMist ? base.replace('bg-sky', 'bg-white') : base;
    return `<span class="chip ${cls}" title="How sure we are about this data"><span class="inline-block w-1.5 h-1.5 rounded-full ${dot}" aria-hidden="true"></span>${l}</span>`;
  };
  const chip = (text, cls = 'bg-sky text-ink-soft') => `<span class="chip ${cls}">${esc(text)}</span>`;
  // Chip that sits on a mist page header (a white pill: sky would vanish into the mist).
  const CHIP_ON_MIST = 'bg-white text-ink-soft';

  // Breadcrumb for pages two levels deep: trail is [[href, label], ...], current is the page name.
  // Links get a 44px tap area without adding height (-my-3 py-3). Top-level pages (Insurers, Learn, About, Compare) have none.
  function breadcrumb(trail, current) {
    const sep = icon('chevron-right', 'w-3.5 h-3.5 shrink-0 text-ink-mute');
    return `<nav aria-label="Breadcrumb" class="text-[14px] text-ink-mute"><ol class="flex flex-wrap items-center gap-x-1.5 gap-y-1">${trail.map(([href, label]) => `<li class="flex items-center gap-1.5"><a class="-my-3 py-3 transition-colors hover:text-ink" href="${esc(href)}">${esc(label)}</a>${sep}</li>`).join('')}<li class="min-w-0 max-w-full truncate text-ink-soft" aria-current="page">${esc(current)}</li></ol></nav>`;
  }

  // One "can't find that" page for every missing route/record. actions: [[href, label, 'primary'|'ghost'], ...]
  function notFoundPage({ title, body, actions = [], eyebrow, note, icon: ic = 'search' } = {}) {
    const btn = ([href, label, kind]) => `<a class="btn ${kind === 'ghost' ? 'btn-ghost' : 'btn-primary'}" href="${esc(href)}">${esc(label)}</a>`;
    return `<div class="max-w-page mx-auto px-5 sm:px-8 py-20 sm:py-28"><div class="max-w-xl">
      <span class="grid h-10 w-10 place-items-center rounded-xl bg-sky text-ink-soft">${icon(ic)}</span>
      ${eyebrow ? `<p class="mt-6 text-sm text-ink-mute">${esc(eyebrow)}</p>` : ''}
      <h1 class="${eyebrow ? 'mt-2' : 'mt-6'} text-[32px] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[40px]">${esc(title)}</h1>
      <p class="mt-4 text-[17px] leading-relaxed text-ink-soft sm:text-lg">${esc(body)}</p>
      ${note ? `<p class="mt-2 text-sm text-ink-mute" lang="ne">${esc(note)}</p>` : ''}
      ${actions.length ? `<div class="mt-8 flex flex-wrap gap-3">${actions.map(btn).join('')}</div>` : ''}
    </div></div>`;
  }

  // ---------- Toast & modal ----------
  function toast(msg, kind = 'info') {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = `toast toast-${kind}`;
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(() => el.classList.add('out'), 3200);
    setTimeout(() => el.remove(), 3700);
  }

  let closeCurrent = null;
  function modal(html, { label = 'Dialog' } = {}) {
    if (closeCurrent) closeCurrent(); // one dialog at a time; restores focus before we capture it below
    const root = document.getElementById('modal-root');
    const prev = document.activeElement;
    root.innerHTML = `<div class="modal-backdrop" data-close></div><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(label)}" tabindex="-1"><button type="button" class="modal-x" data-close aria-label="Close">${icon('x')}</button>${html}</div>`;
    icons();
    const close = () => {
      if (closeCurrent !== close) return; // stale handle: a newer dialog owns the root
      closeCurrent = null;
      root.innerHTML = '';
      document.removeEventListener('keydown', onKey);
      prev && prev.focus && prev.focus();
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    closeCurrent = close;
    document.addEventListener('keydown', onKey);
    root.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
    const box = root.querySelector('.modal');
    const f = root.querySelector('input,select,textarea,button:not(.modal-x),a[href]');
    (f || box).focus();
    return { root: box, close };
  }

  // Compare toggle used by result rows and policy pages: <button data-compare="policyId">
  function bindCompare(scope) {
    scope.querySelectorAll('[data-compare]').forEach((b) => {
      const id = b.dataset.compare;
      const paint = () => { const on = E.Store.inCompare(id); b.setAttribute('aria-pressed', on); b.classList.toggle('is-on', on); const l = b.querySelector('[data-label]'); if (l) l.textContent = on ? 'Added to compare' : 'Compare'; };
      paint();
      b.addEventListener('click', () => { const r = E.Store.toggleCompare(id); if (!r.ok) toast(r.reason, 'warn'); paint(); });
    });
    scope.querySelectorAll('[data-save]').forEach((b) => {
      const id = b.dataset.save;
      const paint = () => { const on = E.Store.isSaved(id); b.setAttribute('aria-pressed', on); b.classList.toggle('is-on', on); b.title = on ? 'Remove from shortlist' : 'Save to shortlist'; };
      paint();
      b.addEventListener('click', () => { E.Store.toggleSaved(id); paint(); toast(E.Store.isSaved(id) ? 'Saved to your shortlist' : 'Removed from your shortlist'); });
    });
  }

  // Callback request form (demo: stored locally, nothing is sent).
  function openCallback(policyId) {
    const p = policyId && E.policy(policyId);
    const co = p && E.company(p.companyId);
    const coName = co && (co.shortName || co.name);
    const m = modal(`
      <h2 class="text-[22px] font-semibold tracking-tight text-ink pr-10">Get a call back</h2>
      <p class="mt-2 leading-relaxed text-ink-soft">${p ? `About <strong class="font-semibold text-ink">${esc(p.name)}</strong>${coName ? ` from ${esc(coName)}` : ''}.` : 'An advisor will help you choose.'} We will call within one working day.</p>
      <form class="mt-6 grid gap-5" novalidate>
        <label class="field"><span>Full name</span><input name="name" required autocomplete="name" /></label>
        <label class="field"><span>Mobile number</span><input name="phone" required inputmode="numeric" pattern="9[78][0-9]{8}" placeholder="98XXXXXXXX" autocomplete="tel" /></label>
        <label class="field"><span>Best time to call</span><select name="time"><option>Morning (9–12)</option><option>Afternoon (12–4)</option><option>Evening (4–7)</option></select></label>
        <p class="form-error hidden text-crimson text-sm" role="alert"></p>
        <button class="btn btn-primary w-full" type="submit">Request call back</button>
        <p class="text-[13px] leading-relaxed text-ink-mute">Demo site: your details stay in this browser and are not sent anywhere.</p>
      </form>`, { label: 'Get a call back' });
    const form = m.root.querySelector('form');
    const err = form.querySelector('.form-error');
    const fail = (field, msg) => {
      err.textContent = msg; err.classList.remove('hidden');
      form.elements[field].setAttribute('aria-invalid', 'true');
      form.elements[field].focus();
    };
    form.addEventListener('input', (e) => { if (e.target.removeAttribute) e.target.removeAttribute('aria-invalid'); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.querySelectorAll('[aria-invalid]').forEach((x) => x.removeAttribute('aria-invalid'));
      err.classList.add('hidden');
      const d = Object.fromEntries(new FormData(form));
      if (!d.name.trim()) return fail('name', 'Enter your name.');
      if (!/^9[78]\d{8}$/.test(d.phone.trim())) return fail('phone', 'Enter a 10-digit Nepali mobile number starting with 97 or 98.');
      try { const k = 'beemakhoj:leads'; const all = JSON.parse(localStorage.getItem(k) || '[]'); all.push({ ...d, policyId, at: new Date().toISOString() }); localStorage.setItem(k, JSON.stringify(all)); } catch (x) {}
      m.close(); toast('Call back requested. We will ring you soon.', 'ok');
    });
  }

  // ---------- Chrome ----------
  const LEARN_TOPICS = [
    ['how-insurance-works', 'How insurance works'],
    ['life-insurance-guide', 'Life insurance guide'],
    ['health-insurance-guide', 'Health insurance guide'],
    ['motor-insurance-guide', 'Motor insurance guide'],
    ['claims', 'Making a claim'],
    ['tax-benefits', 'Tax benefits'],
    ['glossary', 'Glossary'],
    ['faq', 'FAQ'],
  ];
  const NAV_ACTIVE = { quote: 'compare', results: 'compare', compare: 'compare', policy: 'compare', companies: 'insurers', company: 'insurers', learn: 'learn', learnTopic: 'learn', about: 'about' };

  // Brand mark: crimson tile, white shield, a small peak. The one place crimson is used as a fill.
  const logoSvg = (cls = 'w-9 h-9') => `<svg viewBox="0 0 32 32" class="${cls} flex-none" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#C8102E"/><path d="M16 6.2l8 2.9v6.2c0 4.7-3.2 8.3-8 10.5-4.8-2.2-8-5.8-8-10.5V9.1l8-2.9z" fill="#fff"/><path d="M11.7 18.1 16 12.7l4.3 5.4" fill="none" stroke="#C8102E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const wordmark = (dark) => `<span class="leading-none"><span class="block text-[19px] font-semibold tracking-tight ${dark ? 'text-white' : 'text-ink'}">BeemaKhoj</span><span class="block text-[10.5px] mt-1 ${dark ? 'text-white/60' : 'text-ink-mute'}">बीमा खोज</span></span>`;
  const savedCount = () => ((E.Store.get().saved) || []).filter((id) => E.policy(id)).length;
  const currentRoute = (route) => route || (window.Router && window.Router.parse ? window.Router.parse() : { name: '' });

  function groupCats(g) { return E.CATEGORIES.filter((c) => c.group === g.id); }

  function megaHtml() {
    return E.GROUPS.map((g) => `
      <div>
        <p class="px-2.5 text-[15px] font-semibold text-ink">${esc(g.label)}<span class="ml-2 text-xs font-normal text-ink-mute">${esc(g.labelNe)}</span></p>
        <ul class="mt-1.5">${groupCats(g).map((c) => `<li><a class="mega-link" href="#/quote/${esc(c.id)}">${icon(c.icon || 'shield', 'w-5 h-5')}<span>${esc(c.label)}<span class="block text-xs font-normal text-ink-mute leading-tight mt-0.5">${esc(c.labelNe)}</span></span></a></li>`).join('')}</ul>
      </div>`).join('');
  }
  function mobileCatsHtml() {
    return E.GROUPS.map((g) => `
      <details class="m-det">
        <summary class="m-link m-sum"><span>${esc(g.label)}</span><span class="flex items-center gap-2 text-[13px] font-normal text-ink-mute">${esc(g.labelNe)}${icon('chevron-down', 'w-4 h-4 chev')}</span></summary>
        <ul class="pb-3 pt-1">${groupCats(g).map((c) => `<li><a class="mega-link" href="#/quote/${esc(c.id)}">${icon(c.icon || 'shield', 'w-5 h-5')}<span>${esc(c.label)}<span class="ml-2 text-xs font-normal text-ink-mute">${esc(c.labelNe)}</span></span></a></li>`).join('')}</ul>
      </details>`).join('');
  }

  function setMega(open) {
    const btn = document.getElementById('mega-toggle'), panel = document.getElementById('mega-menu');
    if (!btn || !panel) return;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.hidden = !open;
  }
  function setMobile(open) {
    const btn = document.getElementById('menu-toggle'), panel = document.getElementById('mobile-panel');
    if (!btn || !panel) return;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    btn.innerHTML = icon(open ? 'x' : 'menu');
    panel.hidden = !open;
    icons();
  }
  const isOpen = (id) => { const b = document.getElementById(id); return !!b && b.getAttribute('aria-expanded') === 'true'; };

  function updateShortlistCount() {
    const n = savedCount();
    document.querySelectorAll('.js-sl-count').forEach((el) => { el.textContent = n; el.hidden = n === 0; });
    document.querySelectorAll('.js-sl-btn').forEach((el) => el.setAttribute('aria-label', n ? `Shortlist, ${n} saved` : 'Shortlist, empty'));
  }

  function openShortlist() {
    const body = () => {
      const items = (E.Store.get().saved || []).map((id) => E.policy(id)).filter(Boolean);
      if (!items.length) return `
        <div class="mt-6">
          <span class="grid place-items-center w-10 h-10 rounded-xl bg-sky text-ink-soft">${icon('heart')}</span>
          <p class="mt-4 font-medium text-ink">You have not saved any policies yet.</p>
          <p class="mt-1.5 leading-relaxed text-ink-soft">While comparing, tap the heart on a policy to keep it here. Your shortlist stays on this device so you can come back to it later.</p>
          <a class="btn btn-primary mt-6" href="#/quote/health" data-close>Start with health insurance</a>
        </div>`;
      return `<ul class="mt-5 divide-y divide-line border-y border-line">${items.map((p) => {
        const co = E.company(p.companyId);
        return `<li class="flex items-center gap-3 py-3.5">${avatar(co, 'w-11 h-11 text-sm')}<a class="min-w-0 flex-1 group" href="#/policy/${esc(p.id)}" data-close><span class="block font-semibold leading-snug text-ink underline-offset-2 group-hover:underline">${esc(p.name)}</span><span class="block text-sm text-ink-mute">${esc(co ? (co.shortName || co.name) : '')}</span></a><button type="button" class="icon-btn" data-unsave="${esc(p.id)}" aria-label="Remove ${esc(p.name)} from shortlist">${icon('trash-2', 'w-5 h-5')}</button></li>`;
      }).join('')}</ul><div class="mt-6"><button type="button" class="btn btn-primary w-full sm:w-auto" data-callback>Get a call back</button></div>`;
    };
    const m = modal(`<h2 class="text-[22px] font-semibold tracking-tight text-ink pr-10">Your shortlist</h2><div data-sl-body>${body()}</div>`, { label: 'Your shortlist' });
    const wrap = m.root.querySelector('[data-sl-body]');
    const wire = () => {
      wrap.querySelectorAll('[data-close]').forEach((a) => a.addEventListener('click', () => m.close()));
      wrap.querySelectorAll('[data-unsave]').forEach((b) => b.addEventListener('click', () => {
        E.Store.toggleSaved(b.dataset.unsave);
        wrap.innerHTML = body(); icons(); wire();
        const f = wrap.querySelector('button, a'); f && f.focus();
      }));
      const cb = wrap.querySelector('[data-callback]'); cb && cb.addEventListener('click', () => { m.close(); openCallback(); });
    };
    wire(); icons();
  }

  function renderHeader(route) {
    const host = document.getElementById('site-header');
    if (!host) return;
    const r = currentRoute(route);
    const active = NAV_ACTIVE[r.name] || '';
    const cur = (k) => (active === k ? ' is-active" aria-current="page' : '');
    const link = (k, href, label) => `<a class="nav-link${cur(k)}" href="${href}">${label}</a>`;
    const n = savedCount();
    const slBtn = `<button type="button" class="btn btn-quiet btn-sm js-sl-btn" data-action="shortlist" aria-label="${n ? `Shortlist, ${n} saved` : 'Shortlist, empty'}">${icon('heart', 'w-5 h-5')}<span class="hidden sm:inline">Shortlist</span><span class="sl-count js-sl-count"${n ? '' : ' hidden'}>${n}</span></button>`;
    host.innerHTML = `
      <div class="max-w-page mx-auto px-5 sm:px-8 h-[72px] flex items-center gap-2">
        <a href="#/" class="flex items-center gap-3 mr-2 lg:mr-8 min-h-[44px]" aria-label="BeemaKhoj home">
          ${logoSvg()}
          ${wordmark(false)}
        </a>
        <nav class="hidden lg:flex items-center gap-1 flex-1" aria-label="Main">
          <button type="button" id="mega-toggle" class="nav-link${cur('compare')}" aria-expanded="false" aria-controls="mega-menu">Compare insurance ${icon('chevron-down', 'w-4 h-4')}</button>
          ${link('insurers', '#/companies', 'Insurers')}
          ${link('learn', '#/learn', 'Learn')}
          ${link('about', '#/about', 'About')}
        </nav>
        <div class="ml-auto flex items-center gap-1.5 sm:gap-2">
          ${slBtn}
          <button type="button" class="btn btn-primary btn-sm hidden sm:inline-flex" data-action="callback">Get a call back</button>
          <button type="button" id="menu-toggle" class="btn btn-ghost btn-sm lg:hidden !px-0 w-11" aria-expanded="false" aria-controls="mobile-panel" aria-label="Open menu">${icon('menu')}</button>
        </div>
      </div>
      <div id="mega-menu" class="mega" hidden>
        <div class="p-6 sm:p-8">
          <p class="max-w-xl text-[15px] leading-relaxed text-ink-soft">Pick what you want to protect. We ask 2 or 3 questions, then show matching policies from every licensed insurer.</p>
          <div class="mt-7 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">${megaHtml()}</div>
          <p class="mt-8 pt-5 border-t border-line text-sm text-ink-soft">Not sure what you need? <a class="font-medium text-ink underline underline-offset-2" href="#/learn/how-insurance-works">Read how insurance works</a> or <button type="button" class="font-medium text-ink underline underline-offset-2" data-action="callback">ask for a call back</button>.</p>
        </div>
      </div>
      <div id="mobile-panel" class="mobile-panel lg:hidden" hidden>
        <nav class="max-w-page mx-auto px-5 sm:px-8 pt-2 pb-6" aria-label="Mobile">
          <p class="pt-3 pb-1 text-[13px] font-medium text-ink-mute">Compare insurance</p>
          ${mobileCatsHtml()}
          <a class="m-link" href="#/companies">Insurers ${icon('chevron-right', 'w-4 h-4 text-ink-mute')}</a>
          <a class="m-link" href="#/learn">Learn ${icon('chevron-right', 'w-4 h-4 text-ink-mute')}</a>
          <a class="m-link" href="#/about">About ${icon('chevron-right', 'w-4 h-4 text-ink-mute')}</a>
          <div class="pt-6"><button type="button" class="btn btn-primary w-full" data-action="callback">Get a call back</button></div>
        </nav>
      </div>`;

    // Single handler (property, so re-renders never stack listeners).
    host.onclick = (e) => {
      const act = e.target.closest('[data-action]');
      if (act) {
        const a = act.dataset.action;
        setMega(false); setMobile(false);
        if (a === 'shortlist') openShortlist(); else if (a === 'callback') openCallback();
        return;
      }
      if (e.target.closest('#mega-toggle')) { setMega(!isOpen('mega-toggle')); return; }
      if (e.target.closest('#menu-toggle')) { setMobile(!isOpen('menu-toggle')); return; }
      if (e.target.closest('a[href^="#"]')) { setMega(false); setMobile(false); }
    };
    host.onfocusout = (e) => {
      if (!isOpen('mega-toggle')) return;
      const to = e.relatedTarget;
      if (to && (to.closest('#mega-menu') || to.closest('#mega-toggle'))) return;
      if (to) setMega(false);
    };
    icons();
  }

  // Document-level behaviours, registered once.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (document.querySelector('#modal-root .modal')) return;
    if (isOpen('mega-toggle')) { setMega(false); const b = document.getElementById('mega-toggle'); b && b.focus(); }
    else if (isOpen('menu-toggle')) { setMobile(false); const b = document.getElementById('menu-toggle'); b && b.focus(); }
  });
  document.addEventListener('click', (e) => {
    // Click-outside closes the menus. The header handler runs first and may re-render the clicked icon
    // (setMobile swaps the toggle's icon), leaving e.target detached, so judge "inside" by the dispatch-time
    // path rather than e.target.closest, otherwise tapping the hamburger icon would reopen-then-close it.
    const hdr = document.getElementById('site-header');
    const inside = hdr && (e.composedPath ? e.composedPath().includes(hdr) : hdr.contains(e.target));
    if (!inside) { setMega(false); setMobile(false); }
  });
  document.addEventListener('store:change', updateShortlistCount);

  function renderFooter() {
    const host = document.getElementById('site-footer');
    if (!host) return;
    const D = E.DATA || {};
    const reg = (D.context && D.context.regulator) || {};
    const safeUrl = typeof reg.website === 'string' && /^https?:\/\//.test(reg.website) ? reg.website : '';
    const hotline = typeof reg.complaintHotline === 'string' ? reg.complaintHotline.split(' (')[0].trim() : '';
    const built = D.builtAt ? new Date(D.builtAt) : null;
    const asOf = built && !isNaN(built) ? built.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : (D.builtAt ? String(D.builtAt) : 'the latest build');
    const col = (title, body) => `<div><h2 class="text-sm font-semibold text-white">${title}</h2>${body}</div>`;
    const lk = (href, label) => `<li><a class="foot-link" href="${href}">${label}</a></li>`;
    const act = (action, label) => `<li><button type="button" class="foot-link" data-action="${action}">${label}</button></li>`;
    host.innerHTML = `
      <div class="bg-ink text-white/70 on-dark border-t border-white/10">
        <div class="max-w-page mx-auto px-5 sm:px-8 pt-16 sm:pt-20 pb-10">
          <div class="max-w-md">
            <a href="#/" class="inline-flex items-center gap-3 min-h-[44px]" aria-label="BeemaKhoj home">${logoSvg()}${wordmark(true)}</a>
            <p class="mt-5 text-[15px] leading-relaxed text-white/65">Plain-language insurance comparison for people in Nepal. Choose what to protect, set your budget, and see policies from every licensed insurer side by side.</p>
          </div>
          <div class="mt-14 grid gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
            <div class="lg:col-span-5">${col('Compare insurance', `<ul class="mt-3 grid grid-cols-1 min-[420px]:grid-cols-2 gap-x-8">${E.CATEGORIES.map((c) => lk(`#/quote/${esc(c.id)}`, esc(c.label))).join('')}</ul>`)}</div>
            <div class="lg:col-span-2">${col('Learn', `<ul class="mt-3">${LEARN_TOPICS.map(([id, l]) => lk(`#/learn/${id}`, esc(l))).join('')}</ul>`)}</div>
            <div class="lg:col-span-2">${col('Company', `<ul class="mt-3">${lk('#/about', 'About and methodology')}${lk('#/companies', 'All licensed insurers')}${act('shortlist', 'Your shortlist')}${act('callback', 'Get a call back')}</ul>`)}</div>
            <div class="lg:col-span-3">${col('Regulator', `
              <div class="mt-3 text-[15px] leading-relaxed text-white/70">
                <p class="font-medium text-white">${esc(reg.name || 'Nepal Insurance Authority')}</p>
                ${reg.nameNe ? `<p class="text-sm text-white/55">${esc(reg.nameNe)}</p>` : ''}
                ${safeUrl ? `<p class="mt-2"><a class="foot-link !min-h-0 underline underline-offset-2" href="${esc(safeUrl)}" target="_blank" rel="noopener noreferrer">${esc(safeUrl.replace(/^https?:\/\//, ''))}</a></p>` : ''}
                ${hotline ? `<p class="mt-2">Complaints: <span class="tabular-nums text-white">${esc(hotline)}</span>${reg.complaintHotlineEstimate ? ' <span class="text-white/55">(please confirm on the NIA website)</span>' : ''}</p>` : ''}
                <p class="mt-3 text-sm text-white/55">Unhappy with an insurer? You can complain to the regulator.</p>
              </div>`)}</div>
          </div>
          <div class="mt-14 pt-8 border-t border-white/10 grid gap-6 md:grid-cols-12">
            <p class="md:col-span-8 text-[13px] leading-relaxed text-white/60"><strong class="font-semibold text-white/85">This is a demo site.</strong> Premiums shown are indicative estimates worked out from published rates and may differ from the quote an insurer gives you. BeemaKhoj is not an insurer, and is not an insurance agent or broker licensed by the Nepal Insurance Authority. Nothing here is financial advice or an offer of cover. Always read the policy document and confirm details with the insurer before you buy.</p>
            <div class="md:col-span-4 md:text-right text-[13px] leading-relaxed text-white/60">
              <p>Data updated ${esc(asOf)}.</p>
              <p class="mt-1">Details you enter stay in your browser and are not sent anywhere.</p>
              <p class="mt-3 text-white/55">&copy; 2026 BeemaKhoj (demo). Made for people in Nepal.</p>
            </div>
          </div>
        </div>
      </div>`;
    host.onclick = (e) => {
      const a = e.target.closest('[data-action]');
      if (!a) return;
      if (a.dataset.action === 'shortlist') openShortlist(); else if (a.dataset.action === 'callback') openCallback();
    };
  }

  function renderTray(route) {
    const host = document.getElementById('compare-tray');
    if (!host) return;
    const r = currentRoute(route);
    const items = (E.Store.get().compare || []).map((id) => E.policy(id)).filter(Boolean);
    const show = items.length >= 1 && r.name !== 'compare';
    document.body.classList.toggle('has-tray', show);
    if (!show) { host.innerHTML = ''; host.onclick = null; return; }
    const had = !!host.firstElementChild; // already on screen: update in place without replaying the entrance
    const ready = items.length >= 2;
    const max = E.MAX_COMPARE || 3;
    host.innerHTML = `
      <section class="tray${had ? ' no-anim' : ''}" aria-label="Policies selected to compare">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
          <ul class="flex flex-wrap items-center gap-2 min-w-0 basis-full sm:basis-auto">
            ${items.map((p) => {
              const co = E.company(p.companyId);
              const nm = (co && (co.shortName || co.name)) || '';
              return `<li class="tray-item"><span class="flex-none">${avatar(co, 'w-9 h-9 text-xs')}</span><span class="min-w-0 hidden lg:block max-w-[130px] text-sm leading-tight"><span class="block truncate font-medium">${esc(nm)}</span><span class="block truncate text-white/60 text-xs">${esc(p.name)}</span></span><button type="button" class="tray-x" data-remove="${esc(p.id)}" aria-label="Remove ${esc(p.name)} from comparison">${icon('x', 'w-4 h-4')}</button></li>`;
            }).join('')}
          </ul>
          <p class="flex-1 min-w-0 text-[13px] leading-snug text-white/70" id="tray-hint" aria-live="polite">${ready ? `${items.length} of ${max} selected` : 'Add one more policy to compare'}</p>
          <div class="flex items-center gap-2 ml-auto">
            <button type="button" class="btn btn-quiet btn-sm" data-clear>Clear</button>
            ${ready
              ? `<a class="btn btn-light btn-sm" href="#/compare">Compare now</a>`
              : `<button type="button" class="btn btn-light btn-sm" disabled aria-describedby="tray-hint">Compare now</button>`}
          </div>
        </div>
      </section>`;
    host.onclick = (e) => {
      const rm = e.target.closest('[data-remove]');
      if (rm) { E.Store.toggleCompare(rm.dataset.remove); const f = host.querySelector('[data-remove]'); f && f.focus(); return; }
      if (e.target.closest('[data-clear]')) E.Store.clearCompare();
    };
    icons();
  }
  function renderChrome(route) { UI.renderHeader(route); UI.renderFooter(route); UI.renderTray(route); }

  const UI = { esc, icon, icons, avatar, confidence, confDot, chip, CHIP_ON_MIST, breadcrumb, notFoundPage, toast, modal, bindCompare, openCallback, renderHeader, renderFooter, renderTray, renderChrome };
  window.UI = UI;
  window.Views = window.Views || {};
})();
