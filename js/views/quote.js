/* Quote view: a calm, one-question-per-step conversation. Route #/quote/:cat
 * Layout (DESIGN.md v2): one centred column, back link, category well, thin crimson progress bar,
 * 32px question, one helper line, selectable answers, ink Continue button. */
(function () {
  const E = window.Engine, UI = window.UI;
  const esc = UI.esc;

  const CHIPS = {
    age: [25, 30, 35, 45],
    sumAssured: [500000, 1000000, 2500000, 5000000, 10000000],
    coverAmount: [300000, 500000, 1000000, 2000000],
    tripDays: [7, 15, 30, 90],
  };
  const CC = {
    'motor-bike': [
      { label: 'Up to 150cc', value: 150 },
      { label: '150–250cc', value: 200 },
      { label: '250cc and above', value: 350 },
    ],
    'motor-car': [
      { label: 'Up to 1000cc', value: 800 },
      { label: '1000–1500cc', value: 1200 },
      { label: '1500cc and above', value: 1800 },
    ],
  };
  const COVER_TYPES = [
    { value: 'any', label: 'Show me both', hint: 'We will list third-party and comprehensive policies together.' },
    { value: 'third-party', label: 'Third-party only', hint: 'Required by law. Pays for harm to other people and their property, not for your own vehicle.' },
    { value: 'comprehensive', label: 'Comprehensive', hint: 'Third-party plus damage to your own vehicle from accidents, theft, fire and natural disasters.' },
  ];

  // Answer styling. `base` is always on; `on` / `off` are swapped by paintChip. They share no classes.
  const OPT = {
    base: 'inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-full border text-[15px] font-medium text-ink transition-colors duration-150',
    on: 'bg-sky border-ink',
    off: 'bg-white border-line-strong hover:border-ink-mute',
  };

  const num = (v) => { if (v === undefined || v === null || v === '') return undefined; const n = Number(String(v).replace(/,/g, '')); return isFinite(n) ? n : undefined; };

  function isLife(cat) { return E.LIFE_CATS && E.LIFE_CATS.has(cat.id); }

  function propertyCopy(cat) {
    if (cat.id === 'livestock') return { title: 'What is the total value of your animals?', why: 'Premium is a small percentage of the value you insure. Add up the market price of the cattle, buffalo, goats or poultry you want covered.', label: 'Total value of animals (Rs)' };
    if (cat.id === 'crop') return { title: 'What is the expected value of your crop?', why: 'Crop cover is priced on what you expect to earn from the harvest. Use last season as a guide.', label: 'Expected crop value (Rs)' };
    return { title: 'What is your property worth?', why: 'We use the value of the house and belongings you want covered to estimate the premium. Land is not insured, so leave it out.', label: 'Property value (Rs)' };
  }

  function stepsFor(cat) {
    const steps = [];
    cat.fields.forEach((f) => {
      if (f === 'age') {
        steps.push({ key: 'age', title: cat.id === 'child-plan' ? 'How old is the parent buying the plan?' : (cat.id === 'travel' ? 'How old is the traveller?' : 'How old are you?'),
          why: 'Age is the biggest factor in price. Younger people usually pay less, and every plan has a minimum and maximum entry age.' });
      } else if (f === 'sumAssured') {
        steps.push({ key: 'sumAssured', title: 'How much cover do you want for your family?',
          why: 'This is the amount paid out if the worst happens (plus bonus on savings plans). A common rule of thumb is 10 times your yearly income.' });
      } else if (f === 'term') {
        steps.push({ key: 'term', title: cat.id === 'foreign-employment' ? 'How many years will you work abroad?' : 'For how many years do you want to pay?',
          why: cat.id === 'foreign-employment' ? 'The policy must last as long as your work contract, usually 2 or 3 years.' : 'A longer term means a lower yearly premium but more years of payments. Most people pick a term that ends around retirement or when the children finish studies.' });
      } else if (f === 'coverAmount') {
        steps.push({ key: 'coverAmount', title: cat.id === 'critical-illness' ? 'How big a lump sum do you want?' : (cat.id === 'personal-accident' ? 'How much accident cover do you want?' : 'How much hospital cover do you want each year?'),
          why: 'Higher cover costs more. A private hospital stay in Kathmandu can run past Rs 2 lakh, so many families pick Rs 5 lakh or more.' });
      } else if (f === 'vehicleValue') {
        steps.push({ key: 'vehicleValue', title: cat.id === 'motor-car' ? 'What is your car worth today?' : 'What is your bike worth today?',
          why: 'Comprehensive premium is a percentage of the vehicle value. Use the current market price, not what you paid new. Third-party cover is a fixed rate and ignores this.' });
      } else if (f === 'cc') {
        steps.push({ key: 'cc', title: 'What is the engine size?', why: 'Third-party premiums are set by the Insurance Authority in bands of engine size (cc). You will find it in the Blue Book.' });
      } else if (f === 'coverType') {
        steps.push({ key: 'coverType', title: 'What kind of cover do you want?', why: 'Third-party is the legal minimum. Comprehensive costs more but also repairs your own vehicle.' });
      } else if (f === 'tripDays') {
        steps.push({ key: 'tripDays', title: 'How many days will you be away?', why: 'Travel insurance is priced per day of the trip. Count from the day you leave Nepal to the day you return.' });
      } else if (f === 'propertyValue') {
        const c = propertyCopy(cat);
        steps.push({ key: 'propertyValue', title: c.title, why: c.why });
      }
    });
    steps.push({ key: 'budget', title: 'What can you comfortably pay?', why: 'We use this to mark each policy as within, near or over your budget. It never hides anything unless you ask it to.' });
    return steps;
  }

  // ---------- Answer controls ----------
  const chipBtn = (value, label, on) =>
    `<button type="button" class="${OPT.base} ${on ? OPT.on : OPT.off}" data-chip="${esc(value)}" aria-pressed="${on ? 'true' : 'false'}"><span data-check class="${on ? 'inline-flex' : 'hidden'}">${UI.icon('check', 'w-4 h-4')}</span>${esc(label)}</button>`;

  function paintChip(b, on) {
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    OPT.on.split(' ').forEach((c) => b.classList.toggle(c, on));
    OPT.off.split(' ').forEach((c) => b.classList.toggle(c, !on));
    const ck = b.querySelector('[data-check]');
    if (ck) { ck.classList.toggle('hidden', !on); ck.classList.toggle('inline-flex', on); }
  }

  const chipRow = (label, html) => `<div class="flex flex-wrap gap-2.5 mb-6" role="group" aria-label="${esc(label)}">${html}</div>`;

  // Large selectable cards for pick-one questions. The radio stays real (sr-only) so keyboard and screen readers work.
  function optionCards(name, opts, sel, label) {
    return `<div class="grid gap-3" role="radiogroup" aria-label="${esc(label)}">${opts.map((o) => `
      <label class="relative block cursor-pointer">
        <input type="radio" name="${name}" value="${esc(o.value)}" class="peer sr-only" ${o.value === sel ? 'checked' : ''}>
        <span class="block rounded-2xl border border-line-strong bg-white px-5 py-4 pr-12 transition-colors duration-150 hover:border-ink-mute peer-checked:border-ink peer-checked:bg-sky peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">
          <span class="block text-base font-medium text-ink">${esc(o.label)}</span>
          ${o.hint ? `<span class="mt-1 block text-sm leading-snug text-ink-soft">${esc(o.hint)}</span>` : ''}
        </span>
        <span class="pointer-events-none absolute right-5 top-1/2 hidden -translate-y-1/2 text-ink peer-checked:block">${UI.icon('check', 'w-5 h-5')}</span>
      </label>`).join('')}</div>`;
  }

  function numberInput(id, label, value, opts) {
    opts = opts || {};
    return `<label class="field"><span>${esc(label)}</span>
      <input id="${id}" name="${id}" type="text" inputmode="numeric" autocomplete="off" value="${value !== undefined ? esc(String(value)) : ''}" ${opts.placeholder ? `placeholder="${esc(opts.placeholder)}"` : ''} aria-describedby="${opts.words === false ? '' : 'q-words '}q-err" /></label>`;
  }
  const wordsLine = (text) => `<p id="q-words" class="mt-2.5 min-h-[1.5rem] text-[15px] tabular-nums text-ink-soft" aria-live="polite">${esc(text || '')}</p>`;
  const amountWords = (v) => (v ? `${E.npr(v)} = ${E.words(v)}` : '');

  function stepBody(cat, step, st) {
    const k = step.key;
    const v = st.profile[k];
    if (k === 'age') {
      return `${chipRow('Common ages', CHIPS.age.map((a) => chipBtn(a, a + ' years', v === a)).join(''))}
        ${numberInput('q-input', 'Or type an exact age', v, { words: false })}`;
    }
    if (k === 'sumAssured' || k === 'coverAmount') {
      return `${chipRow('Common amounts', CHIPS[k].map((a) => chipBtn(a, E.nprShort(a), v === a)).join(''))}
        ${numberInput('q-input', 'Or type an amount in rupees', v, { placeholder: 'e.g. 2500000' })}
        ${wordsLine(amountWords(v))}`;
    }
    if (k === 'term') {
      const fe = cat.id === 'foreign-employment';
      const min = fe ? 1 : 5, max = fe ? 5 : 40;
      const val = Math.min(max, Math.max(min, v || (cat.defaults.term || 20)));
      return `<p class="text-[32px] font-semibold leading-none tracking-tight tabular-nums text-ink" id="q-words" aria-live="polite"><span id="q-term-val">${val}</span> <span id="q-term-unit" class="text-lg font-normal tracking-normal text-ink-soft">${val === 1 ? 'year' : 'years'}</span></p>
        <label class="field mt-6"><span class="sr-only">Number of years</span>
          <input id="q-input" name="q-input" type="range" min="${min}" max="${max}" step="1" value="${val}" class="h-11 w-full cursor-pointer" aria-describedby="q-words q-err" /></label>
        <div class="mt-1 flex justify-between text-[13px] text-ink-mute" aria-hidden="true"><span>${min} ${min === 1 ? 'year' : 'years'}</span><span>${max} years</span></div>`;
    }
    if (k === 'vehicleValue') {
      return `${numberInput('q-input', 'Vehicle value in rupees', v, { placeholder: cat.id === 'motor-car' ? 'e.g. 3500000' : 'e.g. 250000' })}
        ${wordsLine(amountWords(v))}`;
    }
    if (k === 'propertyValue') {
      const c = propertyCopy(cat);
      return `${numberInput('q-input', c.label, v)}
        ${wordsLine(amountWords(v))}`;
    }
    if (k === 'tripDays') {
      return `${chipRow('Common trip lengths', CHIPS.tripDays.map((a) => chipBtn(a, a + ' days', v === a)).join(''))}
        ${numberInput('q-input', 'Or type the number of days', v, { words: false })}`;
    }
    if (k === 'cc') {
      const opts = CC[cat.id] || CC['motor-bike'];
      let sel = opts[0].value;
      if (v) sel = opts.reduce((b, o) => Math.abs(o.value - v) < Math.abs(b.value - v) ? o : b, opts[0]).value;
      return optionCards('cc', opts, sel, 'Engine size');
    }
    if (k === 'coverType') {
      return optionCards('coverType', COVER_TYPES, v || 'any', 'Cover type');
    }
    if (k === 'budget') {
      const b = st.budget || {};
      const per = b.period || 'monthly';
      const trip = cat.id === 'travel';
      return `${numberInput('q-input', trip ? 'Most you want to pay for this trip (Rs)' : 'Amount in rupees', b.amount, { placeholder: per === 'yearly' ? 'e.g. 15000' : 'e.g. 1500' })}
        ${wordsLine(b.amount ? E.npr(b.amount) : '')}
        ${trip ? '' : `<fieldset class="mt-5"><legend class="mb-2 text-sm font-medium text-ink-soft">Is that per month or per year?</legend>
          <div class="seg" role="radiogroup"><label><input type="radio" name="period" value="monthly" ${per === 'monthly' ? 'checked' : ''}><span>Per month</span></label><label><input type="radio" name="period" value="yearly" ${per === 'yearly' ? 'checked' : ''}><span>Per year</span></label></div></fieldset>`}
        <p class="mt-6"><button type="button" class="btn btn-quiet" data-skip>Skip, show everything</button></p>`;
    }
    return '';
  }

  // ---------- Reading and checking an answer ----------
  function readStep(cat, step, root) {
    const k = step.key;
    if (k === 'cc' || k === 'coverType') {
      const r = root.querySelector(`input[name="${k}"]:checked`);
      return r ? (k === 'cc' ? Number(r.value) : r.value) : undefined;
    }
    const inp = root.querySelector('#q-input');
    return inp ? num(inp.value) : undefined;
  }

  const EXAMPLE = { age: '30', sumAssured: '2500000', coverAmount: '500000', vehicleValue: '250000', tripDays: '15', propertyValue: '5000000', budget: '1500' };
  const WHAT = { age: 'your age in years', sumAssured: 'the cover amount in rupees', coverAmount: 'the cover amount in rupees', vehicleValue: 'what the vehicle is worth today, in rupees', tripDays: 'the number of days you will be away', propertyValue: 'the value in rupees', budget: 'an amount, or choose "Skip, show everything"' };

  function validate(cat, step, val, root) {
    const k = step.key;
    if (k === 'cc' || k === 'coverType') return val === undefined ? 'Please choose one option to continue.' : '';
    if (val === undefined) {
      const inp = root.querySelector('#q-input');
      const raw = inp ? String(inp.value || '').trim() : '';
      if (raw) return `Please use digits only, for example ${EXAMPLE[k] || '1000'}.`;
      return k === 'term' ? 'Please choose a number of years.' : `Please enter ${WHAT[k] || 'a number'}.`;
    }
    if (k === 'budget') return val <= 0 ? 'Please enter an amount greater than zero, or skip this step.' : '';
    if (k === 'age') {
      const lo = isLife(cat) ? 16 : 0, hi = isLife(cat) ? 75 : 90;
      if (!Number.isInteger(val) || val < lo || val > hi) return isLife(cat) ? `Life plans are for ages ${lo} to ${hi}. Please enter a whole number in that range.` : `Please enter a whole-number age between ${lo} and ${hi}.`;
    } else if (k === 'sumAssured') {
      if (val < 50000 || val > 100000000) return 'Please enter a cover amount between Rs 50,000 and Rs 10 crore.';
    } else if (k === 'coverAmount') {
      if (val < 25000 || val > 100000000) return 'Please enter a cover amount between Rs 25,000 and Rs 10 crore.';
    } else if (k === 'term') {
      if (val < 1 || val > 50) return 'Please choose a term between 1 and 50 years.';
    } else if (k === 'vehicleValue') {
      if (val < 20000 || val > 200000000) return 'Please enter a value between Rs 20,000 and Rs 20 crore.';
    } else if (k === 'tripDays') {
      if (!Number.isInteger(val) || val < 1 || val > 365) return 'Please enter a whole number of days between 1 and 365.';
    } else if (k === 'propertyValue') {
      if (val < 5000 || val > 5000000000) return 'Please enter a value of at least Rs 5,000.';
    }
    return '';
  }

  function seedState(cat, query) {
    const saved = E.Store.profile(cat.id) || {};
    const def = cat.defaults || {};
    const profile = {};
    cat.fields.forEach((f) => {
      let v = num(query[f]);
      if (f === 'coverType') v = ['any', 'third-party', 'comprehensive'].includes(query.coverType) ? query.coverType : (saved.coverType || def.coverType);
      else {
        if (v === undefined) v = num(saved[f]);
        if (v === undefined) v = num(def[f]);
      }
      if (v !== undefined) profile[f] = v;
    });
    const amount = num(query.budget) !== undefined ? num(query.budget) : num(saved.budget);
    const periodQ = query.period || saved.period;
    return { profile, budget: { amount: amount > 0 ? amount : undefined, period: periodQ === 'yearly' ? 'yearly' : 'monthly' } };
  }

  function notFound() {
    return UI.notFoundPage({
      title: 'We could not find that type of insurance',
      body: 'The link may be old or mistyped. Pick what you want to protect from the home page and we will take you through the questions.',
      actions: [['#/', 'Choose insurance type', 'primary']],
    });
  }

  window.Views.quote = {
    title(params) { const c = E.category(params.cat); return c ? `${c.label} insurance quote` : 'Get a quote'; },

    render(params) {
      const cat = E.category(params.cat);
      if (!cat) return notFound();
      return `<section class="max-w-xl mx-auto px-5 sm:px-8 pt-6 pb-16 sm:pt-10 sm:pb-24">
        <a href="#/" class="-ml-1 inline-flex min-h-[44px] items-center gap-1 text-sm text-ink-mute transition-colors hover:text-ink">${UI.icon('chevron-left', 'w-4 h-4')}All insurance types</a>
        <div class="mt-3 flex items-center gap-3">
          <span class="grid h-10 w-10 flex-none place-items-center rounded-xl bg-sky text-ink-soft">${UI.icon(cat.icon || 'shield', 'w-5 h-5')}</span>
          <div class="leading-tight"><p class="text-[15px] font-semibold text-ink">${esc(cat.label)}</p>${cat.labelNe ? `<p lang="ne" class="mt-0.5 text-[13px] text-ink-mute">${esc(cat.labelNe)}</p>` : ''}</div>
        </div>
        <div class="mt-9">
          <div class="flex items-baseline justify-between gap-4">
            <p id="q-count" class="text-sm font-medium text-ink" aria-live="polite"></p>
            <p class="text-[13px] text-ink-mute">About a minute</p>
          </div>
          <div id="q-bar" class="mt-2.5 h-1 overflow-hidden rounded-full bg-sky" role="progressbar" aria-label="Quote progress" aria-valuemin="0" aria-valuemax="100"><div id="q-bar-fill" class="h-full rounded-full" style="width:0%;background:var(--crimson);transition:width .3s cubic-bezier(.2,.7,.2,1)"></div></div>
        </div>
        <form id="q-form" class="mt-10 sm:mt-12" novalidate>
          <h1 id="q-title" tabindex="-1" class="text-[28px] sm:text-[32px] font-semibold tracking-tight leading-[1.15] text-ink focus:outline-none"></h1>
          <p id="q-why" class="mt-3 text-base leading-relaxed text-ink-soft"></p>
          <div id="q-body" class="mt-8"></div>
          <p id="q-err" class="mt-3 min-h-[1.5rem] text-sm leading-snug text-crimson" role="alert"></p>
          <div class="mt-5 flex items-center justify-between gap-3">
            <button type="button" id="q-back" class="btn btn-quiet" hidden>Back</button>
            <button type="submit" id="q-next" class="btn btn-primary flex-1 sm:ml-auto sm:min-w-[176px] sm:flex-none"></button>
          </div>
          <p class="mt-10 flex items-start gap-2 text-[13px] leading-snug text-ink-mute">${UI.icon('lock', 'mt-px h-4 w-4')}<span>Your answers stay in this browser. Nothing is sent anywhere.</span></p>
        </form></section>`;
    },

    mount(root, params, query) {
      const cat = E.category(params.cat);
      if (!cat) return;
      const steps = stepsFor(cat);
      const st = seedState(cat, query || {});
      let idx = 0;
      const $ = (s) => root.querySelector(s);
      const form = $('#q-form'), body = $('#q-body'), err = $('#q-err');

      function showErr(m) { err.textContent = m || ''; const i = $('#q-input'); if (i) i.setAttribute('aria-invalid', m ? 'true' : 'false'); }

      function show(first) {
        const step = steps[idx];
        const n = idx + 1, total = steps.length;
        const pct = Math.round((n / total) * 100);
        $('#q-count').textContent = `Step ${n} of ${total}`;
        const bar = $('#q-bar');
        bar.setAttribute('aria-valuenow', pct);
        bar.setAttribute('aria-valuetext', `Step ${n} of ${total}`);
        $('#q-bar-fill').style.width = pct + '%';
        $('#q-title').textContent = step.title;
        $('#q-why').textContent = step.why;
        body.innerHTML = stepBody(cat, step, st);
        $('#q-back').hidden = idx === 0;
        $('#q-next').textContent = idx === total - 1 ? 'See my options' : 'Continue';
        showErr('');
        UI.icons();
        wire(step);
        if (!first) { const f = body.querySelector('input:not([type=radio]), input[type=radio]:checked'); (f || $('#q-title')).focus(); }
      }

      function wire(step) {
        const k = step.key;
        const inp = $('#q-input');
        const words = $('#q-words');
        body.querySelectorAll('[data-chip]').forEach((b) => b.addEventListener('click', () => {
          inp.value = b.dataset.chip; inp.dispatchEvent(new Event('input')); showErr(''); inp.focus();
        }));
        if (inp && inp.type !== 'range') {
          inp.addEventListener('input', () => {
            const n = num(inp.value);
            body.querySelectorAll('[data-chip]').forEach((b) => paintChip(b, n !== undefined && Number(b.dataset.chip) === n));
            if (words && ['sumAssured', 'coverAmount', 'vehicleValue', 'propertyValue', 'budget'].includes(k)) {
              words.textContent = n && n > 0 ? (k === 'budget' ? E.npr(n) : amountWords(n)) : '';
            }
            if (err.textContent) showErr('');
          });
        }
        if (inp && inp.type === 'range') {
          inp.addEventListener('input', () => {
            $('#q-term-val').textContent = inp.value;
            $('#q-term-unit').textContent = Number(inp.value) === 1 ? 'year' : 'years';
          });
        }
        body.querySelectorAll('input[type=radio]').forEach((r) => r.addEventListener('change', () => { if (err.textContent) showErr(''); }));
        const skip = body.querySelector('[data-skip]');
        if (skip) skip.addEventListener('click', () => finish(null));
      }

      function finish(budgetAmount) {
        const profile = Object.assign({}, st.profile);
        const per = st.budget.period;
        const saved = Object.assign({}, profile);
        if (budgetAmount) { saved.budget = budgetAmount; saved.period = per; }
        E.Store.setProfile(cat.id, saved);
        const q = Object.assign({}, profile);
        if (budgetAmount) { q.budget = budgetAmount; q.period = per; }
        Router.go('#/results/' + cat.id + '?' + Router.qs(q));
      }

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const step = steps[idx];
        const val = readStep(cat, step, root);
        const msg = validate(cat, step, val, root);
        if (msg) { showErr(msg); const i = $('#q-input'); if (i) i.focus(); return; }
        if (step.key === 'budget') {
          const p = root.querySelector('input[name=period]:checked');
          if (p) st.budget.period = p.value;
          st.budget.amount = val;
          finish(val);
          return;
        }
        st.profile[step.key] = val;
        idx++;
        show(false);
      });
      $('#q-back').addEventListener('click', () => {
        // keep what the person has typed on this step
        const step = steps[idx];
        const val = readStep(cat, step, root);
        if (val !== undefined && step.key !== 'budget') st.profile[step.key] = val;
        if (step.key === 'budget') { const pp = root.querySelector('input[name=period]:checked'); if (pp) st.budget.period = pp.value; if (val > 0) st.budget.amount = val; }
        if (idx > 0) { idx--; show(false); }
      });
      show(true);
    },
  };
})();
