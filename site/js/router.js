/* Hash router. Routes map to window.Views[name] = { title?, render(params, query) -> html, mount?(root, params, query) }.
 *   #/                      home
 *   #/quote/:cat            guided questions for a category
 *   #/results/:cat?age=..   matched policies (profile + budget in query string)
 *   #/compare               side-by-side of Store compare tray
 *   #/policy/:id            policy detail
 *   #/companies             insurer directory      #/company/:id  insurer detail
 *   #/learn                 guides hub             #/learn/:topic guide article
 *   #/about                 about, methodology, disclaimer
 */
(function () {
  const ROUTES = [
    [/^\/?$/, 'home', []],
    [/^\/quote\/([\w-]+)$/, 'quote', ['cat']],
    [/^\/results\/([\w-]+)$/, 'results', ['cat']],
    [/^\/compare$/, 'compare', []],
    [/^\/policy\/([\w-]+)$/, 'policy', ['id']],
    [/^\/companies$/, 'companies', []],
    [/^\/company\/([\w-]+)$/, 'company', ['id']],
    [/^\/learn$/, 'learn', []],
    [/^\/learn\/([\w-]+)$/, 'learnTopic', ['topic']],
    [/^\/about$/, 'about', []],
  ];

  function parse() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, qs] = raw.split('?');
    const query = Object.fromEntries(new URLSearchParams(qs || ''));
    for (const [re, name, keys] of ROUTES) {
      const m = path.match(re);
      if (m) return { name, params: Object.fromEntries(keys.map((k, i) => [k, m[i + 1]])), query, path };
    }
    return { name: 'notFound', params: {}, query, path };
  }

  let lastPath = null;
  function render() {
    const r = parse();
    const view = (window.Views || {})[r.name] || (window.Views || {}).notFound;
    const root = document.getElementById('main');
    try {
      root.innerHTML = view ? view.render(r.params, r.query) : '<p class="p-8">Page not found.</p>';
      if (view && view.mount) view.mount(root, r.params, r.query);
    } catch (e) {
      console.error(e);
      root.innerHTML = `<div class="max-w-page mx-auto px-4 py-24"><h1 class="font-display text-3xl font-bold">Something went wrong on this page</h1><p class="mt-3 text-ink-soft">Go back to the <a class="text-crimson underline" href="#/">home page</a> and try again.</p></div>`;
    }
    const t = view && (typeof view.title === 'function' ? view.title(r.params, r.query) : view.title);
    document.title = t ? `${t} — BeemaKhoj` : 'BeemaKhoj — Compare insurance in Nepal';
    window.UI.renderChrome(r);
    window.UI.icons();
    if (r.path !== lastPath) { window.scrollTo(0, 0); root.focus({ preventScroll: true }); }
    lastPath = r.path;
  }

  window.Router = {
    go(hash) { if (location.hash === hash) render(); else location.hash = hash; },
    parse, render,
    qs: (obj) => new URLSearchParams(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString(),
  };
  window.addEventListener('hashchange', render);
  document.addEventListener('store:change', () => window.UI.renderTray());
  document.addEventListener('DOMContentLoaded', render);
})();
