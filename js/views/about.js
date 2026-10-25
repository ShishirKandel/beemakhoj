/* About / methodology / disclaimer (#/about) and the 404 view. */
(function () {
  const E = window.Engine;
  const UI = window.UI;
  const esc = UI.esc;
  const ctx = () => (E.DATA && E.DATA.context) || {};
  const arr = (x) => (Array.isArray(x) ? x : []);

  function builtDate() {
    const b = E.DATA && E.DATA.builtAt;
    if (!b) return null;
    const d = new Date(b);
    return isNaN(d) ? String(b) : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  const section = (id, title, inner) => `<section id="${id}" class="py-8 border-t border-line first:border-t-0" aria-labelledby="${id}-h"><h2 id="${id}-h" class="font-display text-2xl font-bold">${title}</h2><div class="mt-3 space-y-3 text-ink-soft text-[17px] leading-relaxed">${inner}</div></section>`;
  const safeUrl = (u) => (/^https?:\/\//i.test(String(u)) ? String(u) : '#');
  const srcLabel = (u) => String(u).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

  window.Views = window.Views || {};

  window.Views.about = {
    title: 'About BeemaKhoj and how we estimate',
    render() {
      const c = ctx(); const ms = c.marketStats || {}; const reg = c.regulator || {};
      const D = E.DATA || {};
      const nCo = arr(D.companies).filter((x) => x.type !== 'reinsurance').length;
      const nPol = arr(D.policies).length;
      const conf = { verified: 0, partial: 0, estimated: 0 };
      arr(D.policies).forEach((p) => { if (conf[p.dataConfidence] != null) conf[p.dataConfidence]++; else conf.estimated++; });
      const built = builtDate();
      const stat = (v, l) => (v == null ? '' : `<div class="py-3"><dt class="text-sm text-ink-mute">${esc(l)}</dt><dd class="font-display text-3xl font-bold text-ink">${esc(v)}</dd></div>`);
      return `
<div class="max-w-page mx-auto px-4 sm:px-6 py-10 sm:py-14">
  <div class="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-14">
    <nav aria-label="On this page" class="hidden lg:block">
      <ul class="sticky top-6 space-y-1 text-[15px]">
        ${[['what', 'What this is'], ['data', 'Where the data comes from'], ['estimates', 'How estimates work'], ['confidence', 'Confidence labels'], ['market', 'The market in numbers'], ['regulator', 'Regulator and complaints'], ['disclaimer', 'Disclaimer'], ['sources', 'Sources']].map(([i, l]) => `<li><button type="button" class="text-left py-1.5 text-ink-soft hover:text-ink underline-offset-4 hover:underline" data-scroll="${i}">${l}</button></li>`).join('')}
      </ul>
    </nav>
    <div class="max-w-3xl">
      <h1 class="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">About BeemaKhoj</h1>
      <p class="mt-3 text-lg text-ink-soft">BeemaKhoj means "insurance search". It helps ordinary people in Nepal see what is on offer, in plain words, before they talk to an agent.</p>

      ${section('what', 'What this is', `
        <p><strong>BeemaKhoj is a demonstration website.</strong> It shows how a fair, easy comparison of Nepali insurance could work. It does not sell insurance, take payments or send your details to anyone. When you ask for a call back, the details stay in your own browser.</p>
        <p><strong>Who it is for:</strong> families buying their first policy, bike and car owners renewing third-party cover, workers heading abroad, farmers, and the sons and daughters who help parents understand a policy. If you have never read a policy document, start with the <a class="underline text-crimson" href="#/learn">Learn guides</a>.</p>
        ${nCo ? `<p>Right now the site covers <strong>${nCo} insurers</strong> and <strong>${nPol} policies</strong>.</p>` : ''}`)}

      ${section('data', 'Where our data comes from', `
        <p>We gather information from the insurers' own websites and brochures, from the Nepal Insurance Authority (NIA), and from news and industry reports such as Beema Post, Sharesansar and the Kathmandu Post. Where the sources disagree, we say so rather than pick a favourite.</p>
        <p>${built ? `The data on this site was last built on <strong>${esc(built)}</strong>. ` : ''}Insurers change rates, riders and rules without notice, so a figure here may already be out of date. The insurer's current policy document always wins.</p>`)}

      ${section('estimates', 'How we estimate your premium', `
        <p>No insurer publishes a price for you personally. So we work out an <strong>indicative estimate</strong> from the rate information we hold. We use five pricing models, depending on the kind of policy:</p>
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Rate per Rs 1,000 of cover (life plans).</strong> Each plan has a base price for every Rs 1,000 of sum assured at age 30. We multiply by your cover amount, then adjust for your <em>age</em> (older means pricier, steeply for term insurance) and your <em>term</em> (for savings plans, a longer term spreads the cost, so the yearly figure falls; for term insurance, a longer term costs slightly more).</li>
          <li><strong>Bands by cover and age (health).</strong> Insurers publish prices for a few cover sizes, such as Rs 3 lakh and Rs 5 lakh. We find where your chosen cover sits between those bands, then scale for your age group, from about 15% cheaper under 25 to over three times dearer above 65.</li>
          <li><strong>Percent of value (motor, home, crops, livestock).</strong> The premium is a percentage of what the vehicle, house or crop is worth, with a minimum. A Rs 2.5 lakh bike at 2.5% comes to about Rs 6,250 before VAT.</li>
          <li><strong>Fixed tariff.</strong> Some products, such as third-party motor and many accident plans, have one set price. We show it as is (for accident cover we scale it if you pick a different cover amount).</li>
          <li><strong>Per day (travel).</strong> A daily rate multiplied by the length of your trip. This is a price per trip, not per year.</li>
        </ul>
        <p>We also check <strong>eligibility</strong>: minimum and maximum entry age, longest term, and maturity age. If you do not qualify, the policy is marked rather than hidden.</p>
        <div class="rounded-xl border-l-4 border-marigold bg-marigold-tint p-4 text-ink"><strong>Your real premium can be higher or lower.</strong> Insurers decide after looking at your medical history and test results, smoking, occupation and hobbies, existing policies, income, vehicle age and make, and add-ons. Non-life premiums also carry 13% VAT and stamp duty. Treat our numbers as a starting point for a conversation with the insurer, never as a quote.</div>`)}

      ${section('confidence', 'What the confidence labels mean', `
        <p>Every policy shows how sure we are about its data:</p>
        <dl class="divide-y divide-line rounded-xl border border-line bg-white not-prose">
          <div class="flex flex-wrap items-start gap-3 p-4"><dt class="w-36 shrink-0">${UI.confidence('verified')}</dt><dd class="flex-1 min-w-[200px]">We matched the figures to the insurer's own published document or rate sheet.${conf.verified ? ` (${conf.verified} policies)` : ''}</dd></div>
          <div class="flex flex-wrap items-start gap-3 p-4"><dt class="w-36 shrink-0">${UI.confidence('partial')}</dt><dd class="flex-1 min-w-[200px]">Some details come from the insurer, others from news or aggregator sites, or are inferred.${conf.partial ? ` (${conf.partial} policies)` : ''}</dd></div>
          <div class="flex flex-wrap items-start gap-3 p-4"><dt class="w-36 shrink-0">${UI.confidence('estimated')}</dt><dd class="flex-1 min-w-[200px]">We built the price from typical market rates because the insurer does not publish one. Good for comparing, not for budgeting down to the rupee.${conf.estimated ? ` (${conf.estimated} policies)` : ''}</dd></div>
        </dl>`)}

      ${section('market', 'The Nepal insurance market in numbers', `
        ${(ms.lifeInsurers != null || ms.nonLifeInsurers != null || ms.microInsurers != null || ms.insurancePenetrationPercent != null) ? `<dl class="grid grid-cols-2 sm:grid-cols-4 gap-x-6 divide-line">
          ${stat(ms.lifeInsurers, 'Life insurers')}${stat(ms.nonLifeInsurers, 'Non-life insurers')}${stat(ms.microInsurers, 'Micro insurers')}${stat(ms.insurancePenetrationPercent != null ? ms.insurancePenetrationPercent + '%' : null, 'Insurance penetration (premium as share of GDP)')}
        </dl>
        <p class="text-sm text-ink-mute">${esc(ms.year ? 'Estimates for ' + ms.year + '. ' : '')}${esc(ms.note || '')}</p>` : '<p>Market statistics are not available right now.</p>'}
        <p>In plain terms: insurance still reaches few people in Nepal compared with neighbouring countries, which is why a clear comparison tool is worth building.</p>`)}

      ${section('regulator', 'Regulator and complaints', `
        <p><strong>${esc(reg.name || 'Nepal Insurance Authority')}</strong>${reg.nameNe ? ` <span class="text-ink-mute">(${esc(reg.nameNe)})</span>` : ''}${reg.about ? ` ${esc(reg.about)}` : ' licenses and supervises insurers and agents in Nepal.'}</p>
        <ul class="list-disc pl-5 space-y-1">
          ${reg.website ? `<li>Website: <a class="underline text-crimson" href="${esc(safeUrl(reg.website))}" target="_blank" rel="noopener noreferrer">${esc(srcLabel(reg.website))}</a></li>` : ''}
          ${reg.complaintHotline ? `<li>Complaint line: ${esc(reg.complaintHotline)}</li>` : ''}
        </ul>
        <p>Always try the insurer's grievance officer first. Our <a class="underline text-crimson" href="#/learn/claims">claims guide</a> shows how to escalate. Note: BeemaKhoj cannot handle complaints about insurers, and has no power over claims.</p>`)}

      ${section('disclaimer', 'Disclaimer', `
        <ul class="list-disc pl-5 space-y-2">
          <li>BeemaKhoj is <strong>not a licensed insurer, broker or agent</strong>, and is not registered with the Nepal Insurance Authority as an intermediary.</li>
          <li>Nothing here is <strong>financial, legal or tax advice</strong>. The guides are general information to help you ask better questions.</li>
          <li>Premiums, benefits and rules shown are <strong>estimates and may be wrong or out of date</strong>. Always check the current policy document, premium and terms with the insurer before you buy.</li>
          <li>Listing a policy is not a recommendation or endorsement. We do not accept payment for placement.</li>
          <li>Tax and subsidy limits change with every budget. Confirm with the Inland Revenue Department and the relevant ministry.</li>
          <li>Use of this demo is at your own risk. We accept no liability for decisions made using it.</li>
        </ul>`)}

      ${section('sources', 'Sources', arr(c.sources).length ? `<p>These are the public pages our research drew on. Some were reached only through search summaries, so verify important figures at the original.</p>
        <ul class="space-y-1 text-[15px] not-prose">${arr(c.sources).map((u) => `<li><a class="underline text-crimson break-all inline-block py-1" href="${esc(safeUrl(u))}" target="_blank" rel="noopener noreferrer">${esc(srcLabel(u))}</a></li>`).join('')}</ul>${c.researchNote ? `<p class="text-sm text-ink-mute">${esc(c.researchNote)}</p>` : ''}` : '<p>The source list is not available right now.</p>')}
    </div>
  </div>
</div>`;
    },
    mount(root) {
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      root.querySelectorAll('[data-scroll]').forEach((b) => b.addEventListener('click', () => {
        const el = root.querySelector('#' + b.dataset.scroll);
        if (el) { el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
      }));
    },
  };

  window.Views.notFound = {
    title: 'Page not found',
    render() {
      return `
<div class="max-w-page mx-auto px-4 sm:px-6 py-16 sm:py-24">
  <div class="max-w-xl">
    <p class="font-display text-6xl font-extrabold text-sky-deep" aria-hidden="true">404</p>
    <h1 class="mt-2 font-display text-3xl font-bold">We could not find that page</h1>
    <p class="mt-3 text-lg text-ink-soft">The link may be old, or the address may have a typo. Nothing is wrong on your side. पेज भेटिएन।</p>
    <div class="mt-6 flex flex-wrap gap-3">
      <a class="btn btn-primary" href="#/">Go to the home page</a>
      <a class="btn btn-ghost" href="#/learn">Read the guides</a>
      <a class="btn btn-ghost" href="#/companies">See all insurers</a>
    </div>
  </div>
</div>`;
    },
  };
})();
