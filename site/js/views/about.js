/* About / methodology / disclaimer (#/about) and the 404 view. Editorial layout, same family as Learn. */
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
  const safeUrl = (u) => (/^https?:\/\//i.test(String(u)) ? String(u) : '#');
  const srcLabel = (u) => String(u).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  const H1 = 'text-[32px] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[40px]';
  // Quiet link: ink text, thin underline that darkens on hover (crimson is never used for links).
  const LINK = 'link-inline';
  const NEW_TAB = '<span class="sr-only"> (opens in a new tab)</span>';

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

      // Sections are collected so the "On this page" list is always in step with the content.
      const sections = [];
      const sec = (id, title, nav, inner) => sections.push({ id, title, nav, inner });

      sec('what', 'What this is', 'What this is', `
        <p><strong class="font-semibold text-ink">BeemaKhoj is a demonstration website.</strong> It shows how a fair, easy comparison of Nepali insurance could work. It does not sell insurance, take payments or send your details to anyone. When you ask for a call back, the details stay in your own browser.</p>
        <p><strong class="font-semibold text-ink">Who it is for:</strong> families buying their first policy, bike and car owners renewing third-party cover, workers heading abroad, farmers, and the sons and daughters who help parents understand a policy. If you have never read a policy document, start with the <a class="${LINK}" href="#/learn">Learn guides</a>.</p>
        ${nCo ? `<p>Right now the site covers <strong class="font-semibold text-ink">${nCo} insurers</strong> and <strong class="font-semibold text-ink">${nPol} policies</strong>.</p>` : ''}`);

      sec('data', 'Where our data comes from', 'Where the data comes from', `
        <p>We gather information from the insurers' own websites and brochures, from the Nepal Insurance Authority (NIA), and from news and industry reports such as Beema Post, Sharesansar and the Kathmandu Post. Where the sources disagree, we say so rather than pick a favourite.</p>
        <p>${built ? `The data on this site was last built on <strong class="font-semibold text-ink">${esc(built)}</strong>. ` : ''}Insurers change rates, riders and rules without notice, so a figure here may already be out of date. The insurer's current policy document always wins.</p>`);

      // Five pricing models: [name, where it applies, how it works]
      const models = [
        ['Rate per Rs 1,000 of cover', 'Life plans', 'Each plan has a base price for every Rs 1,000 of sum assured at age 30. We multiply by your cover amount, then adjust for your <em>age</em> (older means pricier, steeply for term insurance) and your <em>term</em> (for savings plans, a longer term spreads the cost, so the yearly figure falls; for term insurance, a longer term costs slightly more).'],
        ['Bands by cover and age', 'Health plans', 'Insurers publish prices for a few cover sizes, such as Rs 3 lakh and Rs 5 lakh. We find where your chosen cover sits between those bands, then scale for your age group, from about 15% cheaper under 25 to over three times dearer above 65.'],
        ['Percent of value', 'Motor, home, crops, livestock', 'The premium is a percentage of what the vehicle, house or crop is worth, with a minimum. A Rs 2.5 lakh bike at 2.5% comes to about Rs 6,250 before VAT.'],
        ['Fixed tariff', 'Third-party motor, many accident plans', 'Some products have one set price. We show it as is (for accident cover we scale it if you pick a different cover amount).'],
        ['Per day', 'Travel', 'A daily rate multiplied by the length of your trip. This is a price per trip, not per year.'],
      ];
      sec('estimates', 'How we estimate your premium', 'How estimates work', `
        <p>No insurer publishes a price for you personally. So we work out an <strong class="font-semibold text-ink">indicative estimate</strong> from the rate information we hold. We use five pricing models, depending on the kind of policy:</p>
        <div class="divide-y divide-line border-y border-line">${models.map(([name, where, how]) => `
          <div class="py-6">
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5"><h3 class="text-[18px] font-semibold text-ink">${name}</h3><p class="text-[14px] text-ink-mute">${where}</p></div>
            <p class="mt-2 text-[16px] leading-relaxed">${how}</p>
          </div>`).join('')}</div>
        <p>We also check <strong class="font-semibold text-ink">eligibility</strong>: minimum and maximum entry age, longest term, and maturity age. If you do not qualify, the policy is marked rather than hidden.</p>
        <div class="callout">
          <p class="font-semibold text-ink">Your real premium can be higher or lower.</p>
          <p class="mt-2 text-[16px] leading-relaxed">Insurers decide after looking at your medical history and test results, smoking, occupation and hobbies, existing policies, income, vehicle age and make, and add-ons. Non-life premiums also carry 13% VAT and stamp duty. Treat our numbers as a starting point for a conversation with the insurer, never as a quote.</p>
        </div>`);

      const confRow = (level, text, n) => `
          <div class="gap-x-8 gap-y-2 py-5 sm:grid sm:grid-cols-[170px_minmax(0,1fr)] sm:items-start">
            <dt>${UI.confidence(level)}</dt>
            <dd class="mt-2 sm:mt-0"><span class="block text-[16px] leading-relaxed">${text}</span>${n ? `<span class="mt-1 block text-[14px] tabular-nums text-ink-mute">${n} ${n === 1 ? 'policy' : 'policies'}</span>` : ''}</dd>
          </div>`;
      sec('confidence', 'What the confidence labels mean', 'Confidence labels', `
        <p>Every policy shows how sure we are about its data:</p>
        <dl class="divide-y divide-line border-y border-line">
          ${confRow('verified', 'We matched the figures to the insurer\'s own published document or rate sheet.', conf.verified)}
          ${confRow('partial', 'Some details come from the insurer, others from news or aggregator sites, or are inferred.', conf.partial)}
          ${confRow('estimated', 'We built the price from typical market rates because the insurer does not publish one. Good for comparing, not for budgeting down to the rupee.', conf.estimated)}
        </dl>`);

      const stat = (v, l, hint) => (v == null ? '' : `<div><dt class="text-[14px] text-ink-mute">${esc(l)}</dt><dd class="mt-2 text-[32px] font-semibold leading-none tracking-tight tabular-nums text-ink">${esc(v)}</dd>${hint ? `<dd class="mt-2 text-[13px] leading-snug text-ink-mute">${esc(hint)}</dd>` : ''}</div>`);
      const hasStats = ms.lifeInsurers != null || ms.nonLifeInsurers != null || ms.microInsurers != null || ms.insurancePenetrationPercent != null;
      sec('market', 'The Nepal insurance market in numbers', 'The market in numbers', `
        ${hasStats ? `<dl class="grid grid-cols-2 gap-x-6 gap-y-8 border-y border-line py-8 md:grid-cols-4">
          ${stat(ms.lifeInsurers, 'Life insurers')}${stat(ms.nonLifeInsurers, 'Non-life insurers')}${stat(ms.microInsurers, 'Micro insurers')}${stat(ms.insurancePenetrationPercent != null ? ms.insurancePenetrationPercent + '%' : null, 'Insurance penetration', 'Premium as a share of GDP')}
        </dl>
        <p class="text-[14px] leading-relaxed text-ink-mute">${esc(ms.year ? 'Estimates for ' + ms.year + '. ' : '')}${esc(ms.note || '')}</p>` : '<p>Market statistics are not available right now.</p>'}
        <p>In plain terms: insurance still reaches few people in Nepal compared with neighbouring countries, which is why a clear comparison tool is worth building.</p>`);

      const regRows = [
        reg.website ? ['Website', `<a class="${LINK}" href="${esc(safeUrl(reg.website))}" target="_blank" rel="noopener noreferrer">${esc(srcLabel(reg.website))}${NEW_TAB}</a>`] : null,
        reg.complaintHotline ? ['Complaint line', esc(reg.complaintHotline)] : null,
      ].filter(Boolean);
      sec('regulator', 'Regulator and complaints', 'Regulator and complaints', `
        <p><strong class="font-semibold text-ink">${esc(reg.name || 'Nepal Insurance Authority')}</strong>${reg.nameNe ? ` <span class="text-ink-mute">(${esc(reg.nameNe)})</span>` : ''}${reg.about ? ` ${esc(reg.about)}` : ' licenses and supervises insurers and agents in Nepal.'}</p>
        ${regRows.length ? `<dl class="divide-y divide-line border-y border-line">${regRows.map(([k, v]) => `<div class="gap-x-8 gap-y-1 py-3.5 sm:grid sm:grid-cols-[150px_minmax(0,1fr)]"><dt class="text-[14px] text-ink-mute">${k}</dt><dd class="min-w-0 text-[16px]">${v}</dd></div>`).join('')}</dl>` : ''}
        <p>Always try the insurer's grievance officer first. Our <a class="${LINK}" href="#/learn/claims">claims guide</a> shows how to escalate. Note: BeemaKhoj cannot handle complaints about insurers, and has no power over claims.</p>`);

      sec('disclaimer', 'Disclaimer', 'Disclaimer', `
        <ul class="list-disc space-y-3 pl-5 marker:text-ink-mute">
          <li>BeemaKhoj is <strong class="font-semibold text-ink">not a licensed insurer, broker or agent</strong>, and is not registered with the Nepal Insurance Authority as an intermediary.</li>
          <li>Nothing here is <strong class="font-semibold text-ink">financial, legal or tax advice</strong>. The guides are general information to help you ask better questions.</li>
          <li>Premiums, benefits and rules shown are <strong class="font-semibold text-ink">estimates and may be wrong or out of date</strong>. Always check the current policy document, premium and terms with the insurer before you buy.</li>
          <li>Listing a policy is not a recommendation or endorsement. We do not accept payment for placement.</li>
          <li>Tax and subsidy limits change with every budget. Confirm with the Inland Revenue Department and the relevant ministry.</li>
          <li>Use of this demo is at your own risk. We accept no liability for decisions made using it.</li>
        </ul>`);

      sec('sources', 'Sources', 'Sources', arr(c.sources).length ? `
        <p>These are the public pages our research drew on. Some were reached only through search summaries, so verify important figures at the original.</p>
        <ul class="grid border-t border-line sm:grid-cols-2 sm:gap-x-10">${arr(c.sources).map((u) => `<li class="border-b border-line"><a class="group flex min-h-[48px] items-center justify-between gap-4 py-2 text-[15px] text-ink" href="${esc(safeUrl(u))}" target="_blank" rel="noopener noreferrer"><span class="min-w-0 break-all underline-offset-4 group-hover:underline">${esc(srcLabel(u))}${NEW_TAB}</span>${UI.icon('arrow-up-right', 'h-4 w-4 shrink-0 text-ink-mute')}</a></li>`).join('')}</ul>
        ${c.researchNote ? `<p class="text-[14px] leading-relaxed text-ink-mute">${esc(c.researchNote)}</p>` : ''}` : '<p>The source list is not available right now.</p>');

      return `
<div class="mx-auto max-w-page px-5 sm:px-8">
  <header class="max-w-2xl pb-12 pt-12 sm:pb-16 sm:pt-20">
    <h1 class="${H1}">About BeemaKhoj</h1>
    <p class="mt-4 text-[17px] leading-relaxed text-ink-soft sm:text-lg">BeemaKhoj means &ldquo;insurance search&rdquo;. It helps ordinary people in Nepal see what is on offer, in plain words, before they talk to an agent.</p>
  </header>
  <div class="grid gap-10 border-t border-line pb-20 pt-10 sm:pb-28 sm:pt-12 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16">
    <nav aria-label="On this page" class="hidden lg:block">
      <div class="sticky top-24">
        <p class="text-[13px] font-medium text-ink-mute">On this page</p>
        <ul class="mt-2">
          ${sections.map((s) => `<li><button type="button" class="block w-full py-2.5 text-left text-[15px] text-ink-soft transition-colors hover:text-ink" data-scroll="${s.id}">${s.nav}</button></li>`).join('')}
        </ul>
      </div>
    </nav>
    <div class="min-w-0 max-w-[44rem]">
      ${sections.map((s, i) => `<section id="${s.id}" class="${i === 0 ? 'pb-10 sm:pb-12' : 'border-t border-line py-10 sm:py-12'}" aria-labelledby="${s.id}-h">
        <h2 id="${s.id}-h" class="text-[26px] font-semibold tracking-tight">${s.title}</h2>
        <div class="mt-4 space-y-4 text-[17px] leading-relaxed text-ink-soft [&>p]:max-w-[68ch]">${s.inner}</div>
      </section>`).join('')}
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
      return UI.notFoundPage({
        eyebrow: 'Error 404',
        title: 'We could not find that page',
        body: 'The link may be old, or the address may have a typo. Nothing is wrong on your side.',
        note: 'पेज भेटिएन।',
        actions: [['#/', 'Go to the home page', 'primary'], ['#/learn', 'Read the guides', 'ghost']],
      });
    },
  };
})();
