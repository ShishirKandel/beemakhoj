/* Shared UI helpers and site chrome (header, footer, compare tray, toast, modal).
 * Views build HTML strings with these helpers; event wiring happens in each view's mount(). */
(function () {
  const E = window.Engine;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (name, cls = 'w-5 h-5') => `<i data-lucide="${name}" class="${cls}" aria-hidden="true"></i>`;
  const icons = () => window.lucide && window.lucide.createIcons();

  // Deterministic colour per company for its initials mark.
  const PALETTE = ['#14213D', '#0F766E', '#9E0B23', '#7C4A03', '#3B3F9F', '#1E6091', '#6B2D5C', '#2F5D3A'];
  function avatar(co, size = 'w-11 h-11 text-sm') {
    const name = (co && (co.shortName || co.name)) || '?';
    const initials = name.replace(/\b(Ltd|Limited|Company|Insurance|Co|The)\b\.?/gi, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    let h = 0; for (const ch of (co && co.id) || name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return `<span class="co-mark ${size}" style="--co:${PALETTE[h % PALETTE.length]}" aria-hidden="true">${esc(initials)}</span>`;
  }

  const CONF = {
    verified: ['Verified', 'bg-pine-tint text-pine'],
    partial: ['Partly verified', 'bg-marigold-tint text-[#7C4A03]'],
    estimated: ['Indicative', 'bg-sky text-ink-soft'],
  };
  const confidence = (c) => { const [l, cls] = CONF[c] || CONF.estimated; return `<span class="chip ${cls}" title="How sure we are about this data">${l}</span>`; };
  const chip = (text, cls = 'bg-sky text-ink-soft') => `<span class="chip ${cls}">${esc(text)}</span>`;

  // ---------- Toast & modal ----------
  function toast(msg, kind = 'info') {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = `toast toast-${kind}`;
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(() => el.classList.add('out'), 3200);
    setTimeout(() => el.remove(), 3700);
  }
  function modal(html, { label = 'Dialog' } = {}) {
    const root = document.getElementById('modal-root');
    const prev = document.activeElement;
    root.innerHTML = `<div class="modal-backdrop" data-close></div><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(label)}"><button class="modal-x" data-close aria-label="Close">${icon('x')}</button>${html}</div>`;
    icons();
    const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey); prev && prev.focus && prev.focus(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    root.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
    const f = root.querySelector('input,select,textarea,button:not(.modal-x)'); f && f.focus();
    return { root: root.querySelector('.modal'), close };
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
    const m = modal(`
      <h2 class="font-display text-2xl font-bold">Get a call back</h2>
      <p class="mt-1 text-ink-soft">${p ? `About <strong>${esc(p.name)}</strong> from ${esc(co ? co.shortName : '')}.` : 'An advisor will help you choose.'} We will call within one working day.</p>
      <form class="mt-5 grid gap-4" novalidate>
        <label class="field"><span>Full name</span><input name="name" required autocomplete="name" /></label>
        <label class="field"><span>Mobile number</span><input name="phone" required inputmode="numeric" pattern="9[78][0-9]{8}" placeholder="98XXXXXXXX" autocomplete="tel" /></label>
        <label class="field"><span>Best time to call</span><select name="time"><option>Morning (9–12)</option><option>Afternoon (12–4)</option><option>Evening (4–7)</option></select></label>
        <p class="form-error hidden text-crimson text-sm" role="alert"></p>
        <button class="btn btn-primary w-full" type="submit">Request call back</button>
        <p class="text-xs text-ink-mute">Demo site: your details stay in this browser and are not sent anywhere.</p>
      </form>`, { label: 'Get a call back' });
    const form = m.root.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      const err = form.querySelector('.form-error');
      if (!d.name.trim()) { err.textContent = 'Enter your name.'; err.classList.remove('hidden'); return; }
      if (!/^9[78]\d{8}$/.test(d.phone.trim())) { err.textContent = 'Enter a 10-digit Nepali mobile number starting with 97 or 98.'; err.classList.remove('hidden'); return; }
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
  const LOGO_SVG = '<svg viewBox="0 0 32 32" class="w-9 h-9 flex-none" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#14213D"/><path d="M16 5l9 3.4v6.6c0 5.2-3.6 9.2-9 11.4C10.6 24.2 7 20.2 7 15V8.4L16 5z" fill="#fff"/><path d="M16 5l9 3.4v6.6c0 5.2-3.6 9.2-9 11.4V5z" fill="#C8102E"/><circle cx="15.2" cy="14.4" r="3.4" fill="none" stroke="#E0A526" stroke-width="1.8"/><path d="M17.7 16.9l3.3 3.3" stroke="#E0A526" stroke-width="2" stroke-linecap="round"/></svg>';
  const savedCount = () => ((E.Store.get().saved) || []).filter((id) => E.policy(id)).length;
  const currentRoute = (route) => route || (window.Router && window.Router.parse ? window.Router.parse() : { name: '' });

  function groupCats(g) { return E.CATEGORIES.filter((c) => c.group === g.id); }

  function megaHtml() {
    return E.GROUPS.map((g) => `
      <div>
        <p class="font-display font-bold text-ink">${esc(g.label)} <span class="font-sans font-normal text-xs text-ink-mute ml-1">${esc(g.labelNe)}</span></p>
        <ul class="mt-2">${groupCats(g).map((c) => `<li><a class="mega-link" href="#/quote/${esc(c.id)}"><span class="text-ink-soft">${icon(c.icon || 'shield', 'w-5 h-5')}</span><span>${esc(c.label)}<span class="block text-xs text-ink-mute leading-tight">${esc(c.labelNe)}</span></span></a></li>`).join('')}</ul>
      </div>`).join('');
  }
  function mobileCatsHtml() {
    return E.GROUPS.map((g) => `
      <details class="border-b border-line">
        <summary class="flex items-center justify-between min-h-[48px] font-semibold cursor-pointer list-none">${esc(g.label)} <span class="text-xs font-normal text-ink-mute">${esc(g.labelNe)}</span></summary>
        <ul class="pb-2">${groupCats(g).map((c) => `<li><a class="mega-link" href="#/quote/${esc(c.id)}"><span class="text-ink-soft">${icon(c.icon || 'shield', 'w-5 h-5')}</span><span>${esc(c.label)} <span class="text-xs text-ink-mute">${esc(c.labelNe)}</span></span></a></li>`).join('')}</ul>
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
      if (!items.length) return `<p class="mt-3 text-ink-soft">You have not saved any policies yet.</p><p class="mt-2 text-ink-soft">While comparing, tap the heart on a policy to keep it here. Your shortlist stays on this device so you can come back to it later.</p><a class="btn btn-dark mt-5" href="#/quote/health" data-close>Start with health insurance</a>`;
      return `<ul class="mt-4 divide-y divide-line border-y border-line">${items.map((p) => {
        const co = E.company(p.companyId);
        return `<li class="flex items-center gap-3 py-3">${avatar(co, 'w-10 h-10 text-xs')}<a class="min-w-0 flex-1 group" href="#/policy/${esc(p.id)}" data-close><span class="block font-semibold leading-snug group-hover:underline">${esc(p.name)}</span><span class="block text-sm text-ink-mute">${esc(co ? (co.shortName || co.name) : '')}</span></a><button type="button" class="tray-x !text-ink-soft hover:!bg-sky" data-unsave="${esc(p.id)}" aria-label="Remove ${esc(p.name)} from shortlist">${icon('trash-2', 'w-5 h-5')}</button></li>`;
      }).join('')}</ul><div class="mt-5 flex flex-wrap gap-3"><button type="button" class="btn btn-primary" data-callback>Get a call back</button></div>`;
    };
    const m = modal(`<h2 class="font-display text-2xl font-bold pr-10">Your shortlist</h2><div data-sl-body>${body()}</div>`, { label: 'Your shortlist' });
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
    const n = savedCount();
    const slBtn = `<button type="button" class="btn btn-ghost btn-sm js-sl-btn" data-action="shortlist" aria-label="${n ? `Shortlist, ${n} saved` : 'Shortlist, empty'}">${icon('heart', 'w-5 h-5')}<span class="hidden sm:inline">Shortlist</span><span class="sl-count js-sl-count"${n ? '' : ' hidden'}>${n}</span></button>`;
    host.innerHTML = `
      <div class="max-w-page mx-auto px-4 sm:px-6 h-16 flex items-center gap-2">
        <a href="#/" class="flex items-center gap-2.5 mr-2 sm:mr-6 min-h-[44px]" aria-label="BeemaKhoj home">
          ${LOGO_SVG}
          <span class="leading-none"><span class="block font-display font-extrabold text-xl tracking-tight">BeemaKhoj</span><span class="block text-[11px] text-ink-mute mt-0.5">बीमा खोज</span></span>
        </a>
        <nav class="hidden lg:flex items-center gap-1 flex-1" aria-label="Main">
          <button type="button" id="mega-toggle" class="nav-link${cur('compare')}" aria-expanded="false" aria-controls="mega-menu">Compare insurance ${icon('chevron-down', 'w-4 h-4')}</button>
          <a class="nav-link${cur('insurers')}" href="#/companies">Insurers</a>
          <a class="nav-link${cur('learn')}" href="#/learn">Learn</a>
          <a class="nav-link${cur('about')}" href="#/about">About</a>
        </nav>
        <div class="ml-auto flex items-center gap-2">
          ${slBtn}
          <button type="button" class="btn btn-primary btn-sm hidden sm:inline-flex" data-action="callback">Get a call back</button>
          <button type="button" id="menu-toggle" class="btn btn-ghost btn-sm lg:hidden !px-0 w-11" aria-expanded="false" aria-controls="mobile-panel" aria-label="Open menu">${icon('menu')}</button>
        </div>
      </div>
      <div id="mega-menu" class="mega" hidden>
        <div class="max-w-page mx-auto px-4 sm:px-6 py-6">
          <p class="text-sm text-ink-mute mb-4">Pick what you want to protect. We ask 2 or 3 questions, then show matching policies from every licensed insurer.</p>
          <div class="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">${megaHtml()}</div>
          <p class="mt-6 pt-4 border-t border-line text-sm text-ink-soft">Not sure what you need? <a class="font-semibold text-ink underline underline-offset-2" href="#/learn/how-insurance-works">Read how insurance works</a> or <button type="button" class="font-semibold text-ink underline underline-offset-2" data-action="callback">ask for a call back</button>.</p>
        </div>
      </div>
      <div id="mobile-panel" class="lg:hidden border-t border-line bg-white max-h-[calc(100vh-90px)] overflow-y-auto" hidden>
        <nav class="max-w-page mx-auto px-4 sm:px-6 py-2" aria-label="Mobile">
          <p class="pt-2 text-sm font-semibold text-ink-mute">Compare insurance</p>
          ${mobileCatsHtml()}
          <a class="flex items-center min-h-[48px] font-semibold border-b border-line" href="#/companies">Insurers</a>
          <a class="flex items-center min-h-[48px] font-semibold border-b border-line" href="#/learn">Learn</a>
          <a class="flex items-center min-h-[48px] font-semibold border-b border-line" href="#/about">About</a>
          <div class="py-4"><button type="button" class="btn btn-primary w-full" data-action="callback">Get a call back</button></div>
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
    if (e.target.closest && !e.target.closest('#site-header')) { setMega(false); setMobile(false); }
  });
  document.addEventListener('store:change', updateShortlistCount);

  function renderFooter() {
    const host = document.getElementById('site-footer');
    if (!host) return;
    const D = E.DATA || {};
    const reg = (D.context && D.context.regulator) || {};
    const safeUrl = typeof reg.website === 'string' && /^https?:\/\//.test(reg.website) ? reg.website : '';
    const hotline = typeof reg.complaintHotline === 'string' ? reg.complaintHotline.split(' (')[0].trim() : '';
    const asOf = D.builtAt ? esc(D.builtAt) : 'the latest build';
    const col = (title, body) => `<div><h2 class="font-display font-bold text-base text-white">${title}</h2>${body}</div>`;
    const lk = 'inline-flex items-center min-h-[36px] text-white/80 hover:text-white hover:underline underline-offset-2';
    host.innerHTML = `
      <div class="bg-ink text-white/85 mt-16 on-dark">
        <div class="max-w-page mx-auto px-4 sm:px-6 pt-12 pb-8">
          <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
            <div class="lg:col-span-3">
              <a href="#/" class="inline-flex items-center gap-2.5" aria-label="BeemaKhoj home">${LOGO_SVG}<span class="leading-none"><span class="block font-display font-extrabold text-xl text-white">BeemaKhoj</span><span class="block text-[11px] text-white/60 mt-0.5">बीमा खोज</span></span></a>
              <p class="mt-4 text-sm leading-relaxed text-white/75">Plain-language insurance comparison for people in Nepal. Choose what to protect, set your budget, and see policies from every licensed insurer side by side.</p>
            </div>
            <div class="lg:col-span-4">${col('Compare insurance', `<ul class="mt-3 grid grid-cols-1 min-[420px]:grid-cols-2 gap-x-6 text-sm">${E.CATEGORIES.map((c) => `<li><a class="${lk}" href="#/quote/${esc(c.id)}">${esc(c.label)}</a></li>`).join('')}</ul>`)}</div>
            <div class="lg:col-span-2">${col('Learn', `<ul class="mt-3 text-sm">${LEARN_TOPICS.map(([id, l]) => `<li><a class="${lk}" href="#/learn/${id}">${esc(l)}</a></li>`).join('')}</ul>`)}</div>
            <div class="lg:col-span-3">
              ${col('Insurers and regulator', `<ul class="mt-3 text-sm"><li><a class="${lk}" href="#/companies">All licensed insurers</a></li><li><a class="${lk}" href="#/about">How we estimate premiums</a></li></ul>
                <div class="mt-4 text-sm leading-relaxed text-white/80">
                  ${reg.name ? `<p class="font-semibold text-white">${esc(reg.name)}</p>` : ''}
                  ${reg.nameNe ? `<p class="text-white/60 text-xs">${esc(reg.nameNe)}</p>` : ''}
                  ${safeUrl ? `<p class="mt-1"><a class="underline underline-offset-2 hover:text-white" href="${esc(safeUrl)}" target="_blank" rel="noopener noreferrer">${esc(safeUrl.replace(/^https?:\/\//, ''))}</a></p>` : ''}
                  ${hotline ? `<p class="mt-1">Complaints: <span class="tabular-nums">${esc(hotline)}</span>${reg.complaintHotlineEstimate ? ' <span class="text-white/60">(please confirm on the NIA website)</span>' : ''}</p>` : ''}
                  <p class="mt-2 text-white/60 text-xs">Unhappy with an insurer? You can complain to the regulator.</p>
                </div>`)}
            </div>
          </div>
          <div class="mt-10 pt-6 border-t border-white/15 text-xs leading-relaxed text-white/70 max-w-3xl">
            <p><strong class="text-white">This is a demo site.</strong> Premiums shown are indicative estimates worked out from published rates and may differ from the quote an insurer gives you. BeemaKhoj is not an insurer, and is not an insurance agent or broker licensed by the Nepal Insurance Authority. Nothing here is financial advice or an offer of cover. Always read the policy document and confirm details with the insurer before you buy.</p>
            <p class="mt-2">Data last updated: ${asOf}. Details you enter stay in your browser and are not sent anywhere.</p>
          </div>
          <p class="mt-6 text-xs text-white/60">&copy; 2026 BeemaKhoj (demo). Made for people in Nepal.</p>
        </div>
      </div>`;
  }

  function renderTray(route) {
    const host = document.getElementById('compare-tray');
    if (!host) return;
    const r = currentRoute(route);
    const items = (E.Store.get().compare || []).map((id) => E.policy(id)).filter(Boolean);
    const show = items.length >= 1 && r.name !== 'compare';
    document.body.classList.toggle('has-tray', show);
    if (!show) { host.innerHTML = ''; host.onclick = null; return; }
    const ready = items.length >= 2;
    const max = E.MAX_COMPARE || 3;
    host.innerHTML = `
      <section class="tray" aria-label="Policies selected to compare">
        <div class="max-w-page mx-auto flex flex-wrap items-center gap-x-3 gap-y-2">
          <ul class="flex flex-wrap items-center gap-2 min-w-0 flex-1 basis-full sm:basis-auto">
            ${items.map((p) => {
              const co = E.company(p.companyId);
              const nm = (co && (co.shortName || co.name)) || '';
              return `<li class="tray-item min-w-0 sm:max-w-[240px]">${avatar(co, 'w-9 h-9 text-xs')}<span class="min-w-0 hidden sm:block text-sm leading-tight"><span class="block truncate font-semibold">${esc(nm)}</span><span class="block truncate text-white/70 text-xs">${esc(p.name)}</span></span><button type="button" class="tray-x" data-remove="${esc(p.id)}" aria-label="Remove ${esc(p.name)} from comparison">${icon('x', 'w-4 h-4')}</button></li>`;
            }).join('')}
            <li class="text-xs text-white/70 pl-1" id="tray-hint">${ready ? `${items.length} of ${max} selected` : 'Add one more policy to compare'}</li>
          </ul>
          <div class="flex items-center gap-2 ml-auto">
            <button type="button" class="btn btn-quiet btn-sm !text-white hover:!bg-white/15" data-clear>Clear</button>
            ${ready
              ? `<a class="btn btn-primary btn-sm" href="#/compare">Compare now</a>`
              : `<button type="button" class="btn btn-primary btn-sm" disabled aria-describedby="tray-hint">Compare now</button>`}
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

  const UI = { esc, icon, icons, avatar, confidence, chip, toast, modal, bindCompare, openCallback, renderHeader, renderFooter, renderTray, renderChrome };
  window.UI = UI;
  window.Views = window.Views || {};
})();
