/* Quote view: guided one-question-per-step form. Route #/quote/:cat */
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

  const chipBtn = (value, label, on) =>
    `<button type="button" class="chip px-4 py-2 min-h-[44px] border border-line bg-white text-ink hover:border-ink-mute ${on ? 'ring-2 ring-ink' : ''}" data-chip="${value}" aria-pressed="${on ? 'true' : 'false'}">${esc(label)}</button>`;

  function numberInput(id, label, value, opts) {
    opts = opts || {};
    return `<label class="field"><span>${esc(label)}</span>
      <input id="${id}" name="${id}" type="text" inputmode="numeric" autocomplete="off" value="${value !== undefined ? esc(String(value)) : ''}" ${opts.placeholder ? `placeholder="${esc(opts.placeholder)}"` : ''} aria-describedby="q-words q-err" /></label>`;
  }

  function stepBody(cat, step, st) {
    const k = step.key;
    const v = st.profile[k];
    if (k === 'age') {
      return `<div class="flex flex-wrap gap-2 mb-4" role="group" aria-label="Common ages">${CHIPS.age.map((a) => chipBtn(a, a + ' years', v === a)).join('')}</div>
        ${numberInput('q-input', 'Age in years', v)}`;
    }
    if (k === 'sumAssured' || k === 'coverAmount') {
      return `<div class="flex flex-wrap gap-2 mb-4" role="group" aria-label="Common amounts">${CHIPS[k].map((a) => chipBtn(a, E.nprShort(a), v === a)).join('')}</div>
        ${numberInput('q-input', 'Or type an amount in rupees', v, { placeholder: 'e.g. 2500000' })}
        <p id="q-words" class="mt-2 text-ink-soft" aria-live="polite">${v ? esc(E.npr(v)) + ' = ' + esc(E.words(v)) : ''}</p>`;
    }
    if (k === 'term') {
      const fe = cat.id === 'foreign-employment';
      const min = fe ? 1 : 5, max = fe ? 5 : 40;
      const val = Math.min(max, Math.max(min, v || (cat.defaults.term || 20)));
      return `<label class="field"><span>Number of years</span>
        <input id="q-input" name="q-input" type="range" min="${min}" max="${max}" step="1" value="${val}" aria-describedby="q-words" /></label>
        <p class="mt-2 font-display text-3xl font-bold" id="q-words" aria-live="polite"><span id="q-term-val">${val}</span> years</p>
        <p class="text-ink-mute text-sm">Slide between ${min} and ${max} years.</p>`;
    }
    if (k === 'vehicleValue') {
      return `${numberInput('q-input', 'Vehicle value in rupees', v, { placeholder: cat.id === 'motor-car' ? 'e.g. 3500000' : 'e.g. 250000' })}
        <p id="q-words" class="mt-2 text-ink-soft" aria-live="polite">${v ? esc(E.npr(v)) + ' = ' + esc(E.words(v)) : ''}</p>`;
    }
    if (k === 'propertyValue') {
      const c = propertyCopy(cat);
      return `${numberInput('q-input', c.label, v)}
        <p id="q-words" class="mt-2 text-ink-soft" aria-live="polite">${v ? esc(E.npr(v)) + ' = ' + esc(E.words(v)) : ''}</p>`;
    }
    if (k === 'tripDays') {
      return `<div class="flex flex-wrap gap-2 mb-4" role="group" aria-label="Common trip lengths">${CHIPS.tripDays.map((a) => chipBtn(a, a + ' days', v === a)).join('')}</div>
        ${numberInput('q-input', 'Or type the number of days', v)}`;
    }
    if (k === 'cc') {
      const opts = CC[cat.id] || CC['motor-bike'];
      let sel = opts[0].value;
      if (v) sel = opts.reduce((b, o) => Math.abs(o.value - v) < Math.abs(b.value - v) ? o : b, opts[0]).value;
      return `<div class="seg flex-wrap" role="radiogroup" aria-label="Engine size">${opts.map((o) =>
        `<label><input type="radio" name="cc" value="${o.value}" ${o.value === sel ? 'checked' : ''}><span>${esc(o.label)}</span></label>`).join('')}</div>`;
    }
    if (k === 'coverType') {
      const sel = v || 'any';
      return `<div class="seg flex-wrap" role="radiogroup" aria-label="Cover type">${COVER_TYPES.map((o) =>
        `<label><input type="radio" name="coverType" value="${o.value}" ${o.value === sel ? 'checked' : ''}><span>${esc(o.label)}</span></label>`).join('')}</div>
        <p id="q-words" class="mt-3 text-ink-soft" aria-live="polite">${esc(COVER_TYPES.find((o) => o.value === sel).hint)}</p>`;
    }
    if (k === 'budget') {
      const b = st.budget || {};
      const per = b.period || 'monthly';
      const trip = cat.id === 'travel';
      return `${numberInput('q-input', trip ? 'Most you want to pay for this trip (Rs)' : 'Amount in rupees', b.amount, { placeholder: per === 'yearly' ? 'e.g. 15000' : 'e.g. 1500' })}
        <p id="q-words" class="mt-2 text-ink-soft" aria-live="polite">${b.amount ? esc(E.npr(b.amount)) : ''}</p>
        ${trip ? '' : `<fieldset class="mt-4"><legend class="text-sm font-semibold mb-2">I want to count this</legend>
          <div class="seg" role="radiogroup"><label><input type="radio" name="period" value="monthly" ${per === 'monthly' ? 'checked' : ''}><span>Per month</span></label><label><input type="radio" name="period" value="yearly" ${per === 'yearly' ? 'checked' : ''}><span>Per year</span></label></div></fieldset>`}
        <p class="mt-4"><button type="button" class="btn btn-quiet" data-skip>Skip, show everything</button></p>`;
    }
    return '';
  }

  function readStep(cat, step, root) {
    const k = step.key;
    if (k === 'cc' || k === 'coverType') {
      const r = root.querySelector(`input[name="${k}"]:checked`);
      return r ? (k === 'cc' ? Number(r.value) : r.value) : undefined;
    }
    const inp = root.querySelector('#q-input');
    return inp ? num(inp.value) : undefined;
  }

  function validate(cat, step, val, root) {
    const k = step.key;
    const need = (m) => m;
    if (k === 'cc' || k === 'coverType') return val === undefined ? 'Pick one option to continue.' : '';
    if (k === 'budget') {
      if (val === undefined) return 'Enter an amount, or choose "Skip, show everything".';
      if (val <= 0) return 'Enter an amount greater than zero.';
      return '';
    }
    if (val === undefined) return need('Please enter a number to continue.');
    if (k === 'age') {
      const lo = isLife(cat) ? 16 : 0, hi = isLife(cat) ? 75 : 90;
      if (!Number.isInteger(val) || val < lo || val > hi) return `Enter an age between ${lo} and ${hi}.`;
    } else if (k === 'sumAssured') {
      if (val < 50000 || val > 100000000) return 'Enter a cover between Rs 50,000 and Rs 10 crore.';
    } else if (k === 'coverAmount') {
      if (val < 25000 || val > 100000000) return 'Enter a cover between Rs 25,000 and Rs 10 crore.';
    } else if (k === 'term') {
      if (val < 1 || val > 50) return 'Choose a term between 1 and 50 years.';
    } else if (k === 'vehicleValue') {
      if (val < 20000 || val > 200000000) return 'Enter a value between Rs 20,000 and Rs 20 crore.';
    } else if (k === 'tripDays') {
      if (!Number.isInteger(val) || val < 1 || val > 365) return 'Enter a trip length between 1 and 365 days.';
    } else if (k === 'propertyValue') {
      if (val < 5000 || val > 5000000000) return 'Enter a value of at least Rs 5,000.';
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
    return `<section class="max-w-page mx-auto px-4 sm:px-6 py-16"><h1 class="font-display text-3xl font-bold">We could not find that type of insurance</h1>
      <p class="mt-3 text-ink-soft max-w-prose">The link may be old or mistyped. Pick what you want to protect from the home page and we will take you through the questions.</p>
      <a class="btn btn-primary mt-6" href="#/">Choose insurance type</a></section>`;
  }

  window.Views.quote = {
    title(params) { const c = E.category(params.cat); return c ? `${c.label} insurance quote` : 'Get a quote'; },

    render(params) {
      const cat = E.category(params.cat);
      if (!cat) return notFound();
      return `<section class="max-w-page mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <div class="grid gap-8 lg:grid-cols-[320px_1fr] lg:gap-14">
          <aside>
            <a href="#/" class="text-sm text-ink-mute hover:text-ink inline-flex items-center gap-1">${UI.icon('chevron-left', 'w-4 h-4')}All insurance types</a>
            <div class="mt-4 flex items-center gap-3"><span class="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-sky text-ink">${UI.icon(cat.icon || 'shield', 'w-6 h-6')}</span>
              <div><h1 class="font-display text-2xl font-bold leading-tight">${esc(cat.label)}</h1><p class="text-ink-mute text-sm">${esc(cat.labelNe || '')}</p></div></div>
            <p class="mt-4 text-ink-soft">${esc(cat.blurb || '')}</p>
            <ol id="q-steps" class="mt-6 hidden lg:grid gap-2 text-sm"></ol>
          </aside>
          <div>
            <div class="flex items-center justify-between gap-4">
              <p id="q-count" class="font-semibold" aria-live="polite"></p>
              <p class="text-sm text-ink-mute">About a minute</p>
            </div>
            <div class="mt-2 h-2 rounded-full bg-sky-deep/50 overflow-hidden" role="progressbar" aria-label="Quote progress" aria-valuemin="0" aria-valuemax="100" id="q-bar"><div id="q-bar-fill" class="h-full bg-crimson" style="width:0%"></div></div>
            <form id="q-form" class="mt-8 max-w-xl" novalidate>
              <h2 id="q-title" tabindex="-1" class="font-display text-2xl sm:text-3xl font-bold leading-tight"></h2>
              <p id="q-why" class="mt-2 text-ink-soft"></p>
              <div id="q-body" class="mt-6"></div>
              <p id="q-err" class="mt-3 text-crimson font-semibold min-h-[1.5rem]" role="alert"></p>
              <div class="mt-4 flex items-center gap-3">
                <button type="button" id="q-back" class="btn btn-ghost">Back</button>
                <button type="submit" id="q-next" class="btn btn-primary"></button>
              </div>
            </form>
          </div>
        </div></section>`;
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

      function paintSteps() {
        $('#q-steps').innerHTML = steps.map((s, i) => {
          const cur = i === idx, done = i < idx;
          return `<li class="flex items-center gap-2 ${cur ? 'font-bold text-ink' : done ? 'text-pine' : 'text-ink-mute'}"${cur ? ' aria-current="step"' : ''}>
            <span class="inline-flex w-6 h-6 rounded-full items-center justify-center text-xs ${cur ? 'bg-crimson text-white' : done ? 'bg-pine text-white' : 'bg-sky text-ink-mute'}">${done ? '&#10003;' : i + 1}</span>
            ${esc(shortName(s.key))}</li>`;
        }).join('');
      }
      function shortName(k) {
        return { age: 'Your age', sumAssured: 'Cover amount', term: 'Term', coverAmount: 'Cover amount', vehicleValue: 'Vehicle value', cc: 'Engine size', coverType: 'Cover type', tripDays: 'Trip length', propertyValue: 'Value', budget: 'Budget' }[k] || k;
      }

      function show(first) {
        const step = steps[idx];
        $('#q-count').textContent = `Step ${idx + 1} of ${steps.length}`;
        const pct = Math.round(((idx + 1) / steps.length) * 100);
        $('#q-bar').setAttribute('aria-valuenow', pct);
        $('#q-bar-fill').style.width = pct + '%';
        $('#q-title').textContent = step.title;
        $('#q-why').textContent = step.why;
        body.innerHTML = stepBody(cat, step, st);
        $('#q-back').style.visibility = idx === 0 ? 'hidden' : 'visible';
        $('#q-next').textContent = idx === steps.length - 1 ? 'See my options' : 'Continue';
        showErr('');
        paintSteps();
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
            body.querySelectorAll('[data-chip]').forEach((b) => { const on = n !== undefined && Number(b.dataset.chip) === n; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.classList.toggle('ring-2', on); b.classList.toggle('ring-ink', on); });
            if (words && ['sumAssured', 'coverAmount', 'vehicleValue', 'propertyValue', 'budget'].includes(k)) {
              words.textContent = n && n > 0 ? (k === 'budget' ? E.npr(n) : `${E.npr(n)} = ${E.words(n)}`) : '';
            }
            if (err.textContent) showErr('');
          });
        }
        if (inp && inp.type === 'range') {
          inp.addEventListener('input', () => { $('#q-term-val').textContent = inp.value; });
        }
        if (k === 'coverType') {
          body.querySelectorAll('input[name=coverType]').forEach((r) => r.addEventListener('change', () => {
            words.textContent = COVER_TYPES.find((o) => o.value === r.value).hint;
          }));
        }
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
