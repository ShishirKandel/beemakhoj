/* Learn hub, guide articles, glossary and FAQ.  Routes: #/learn and #/learn/:topic */
(function () {
  const E = window.Engine;
  const UI = window.UI;
  const esc = UI.esc;
  const ctx = () => (E.DATA && E.DATA.context) || {};
  const arr = (x) => (Array.isArray(x) ? x : []);

  // ---------- small helpers ----------
  const cheapest = (cat, prof) => {
    try {
      const l = E.match(cat, prof).filter((r) => r.fit !== 'ineligible' && r.est.annual != null).sort((a, b) => a.est.annual - b.est.annual);
      return l[0] || null;
    } catch (e) { return null; }
  };
  const coName = (r) => (r && r.company && (r.company.shortName || r.company.name)) || 'one insurer';
  const note = (html) => `<aside class="my-6 rounded-xl border border-line bg-sky p-4 text-[15px] text-ink-soft not-prose">${html}</aside>`;
  const steps = (list) => `<ol>${arr(list).map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`;
  const table = (head, rows, cap) => `<div class="my-6 overflow-x-auto rounded-xl border border-line bg-white not-prose"><table class="w-full min-w-[480px] text-left text-[15px]">${cap ? `<caption class="sr-only">${esc(cap)}</caption>` : ''}<thead class="bg-sky text-ink-soft"><tr>${head.map((h) => `<th scope="col" class="px-4 py-3 font-semibold">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr class="border-t border-line">${r.map((c, i) => (i === 0 ? `<th scope="row" class="px-4 py-3 font-semibold align-top">${c}</th>` : `<td class="px-4 py-3 align-top">${c}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`;

  // ---------- guide bodies ----------
  const TOPICS = [];
  const add = (t) => TOPICS.push(t);

  add({
    id: 'how-insurance-works', icon: 'umbrella', title: 'How insurance works, in plain words', titleNe: 'बीमा कसरी काम गर्छ',
    desc: 'The basic idea behind every policy, and the five questions to ask before you pay for any of them.',
    short: 'Many people pay a small amount so that the few who suffer a big loss can be paid. You choose what to protect, pay a premium, and claim when the covered event happens.',
    cta: { href: '#/', label: 'Choose what to protect' }, related: ['life-insurance-guide', 'claims', 'glossary'],
    body() {
      const c = ctx(); const ms = c.marketStats || {}; const reg = c.regulator || {};
      return `
<p>Imagine a village of 1,000 families. Every year, about five of them lose a house to fire. Nobody knows which five. If each family puts in Rs 500 a year, there is Rs 5 lakh in the pot, enough to help rebuild one house. That pot, run by a company and supervised by the regulator, is insurance. You swap a small, certain cost (the <strong>premium</strong>) for protection against a large, uncertain loss.</p>
<h2>The four words you will meet everywhere</h2>
<ul>
<li><strong>Premium</strong> is what you pay, monthly, quarterly or yearly.</li>
<li><strong>Sum assured</strong> (life) or <strong>sum insured</strong> (health, vehicle, property) is the most the insurer will pay.</li>
<li><strong>Claim</strong> is your request for payment after something covered happens.</li>
<li><strong>Exclusion</strong> is what the policy does not cover. This is where most surprises hide.</li>
</ul>
<h2>Life and non-life</h2>
<p>Nepal splits insurers into two families. <strong>Life insurers</strong> sell policies that pay on death or at the end of a term: term, endowment, money-back, child and pension plans. <strong>Non-life insurers</strong> sell everything else: health, vehicle, travel, home, crops and livestock. They are separate companies by law, so no single company sells both.${ms.lifeInsurers && ms.nonLifeInsurers ? ` As of ${esc(ms.year || '2026')} there are about ${esc(ms.lifeInsurers)} life and ${esc(ms.nonLifeInsurers)} non-life insurers, plus a few micro insurers for low-income households.` : ''}</p>
<h2>Who is watching them</h2>
<p>${esc(reg.name || 'The Nepal Insurance Authority (NIA)')} licenses insurers, agents and surveyors, and takes complaints when a claim is delayed or refused unfairly. Only buy from a licensed company and a licensed agent, and always pay into the company's own account, never a personal one.</p>
<h2>What insurance is not</h2>
<p>It is not an investment that always beats a bank deposit, and it is not a promise to pay for everything. A health policy will not pay for an illness you hid. A third-party motor policy will not repair your own bike. The cover is exactly what the policy document says, so read it.</p>
<h2>Five questions before you pay</h2>
${steps([
        'What exactly am I protecting, and who gets paid if it goes wrong?',
        'How much cover do I need? For family protection, a common rule is 10 to 15 times your yearly income.',
        'What is excluded, and is there a waiting period?',
        'What is the insurer\'s claim settlement record, and how long do they take?',
        'Can I keep paying this for the whole term? A policy that lapses after two years is worse than none.',
      ])}
${note('<strong>Start with protection, then savings.</strong> Cover for your family\'s income and for hospital bills comes first. Savings plans and extras come after that is in place.')}
<p>${arr(c.tips).length ? `One more tip from our research: ${esc(arr(c.tips)[3] || arr(c.tips)[0])}` : 'Read the policy document before you pay, and use the free-look period if something is unclear.'}</p>`;
    },
  });

  add({
    id: 'life-insurance-guide', icon: 'shield-check', title: 'Term vs endowment vs money-back: which is right for you?', titleNe: 'जीवन बीमा छनोट',
    desc: 'Protection or savings? How the main life plans differ, what they really cost, and a simple way to choose.',
    short: 'Term insurance is cheap protection with no payout if you survive. Endowment and money-back cost much more because they also save for you. If your family relies on your income, buy term first.',
    cta: { href: '#/quote/term-life', label: 'Compare term life plans' }, related: ['tax-benefits', 'claims', 'glossary'],
    body() {
      const t = cheapest('term-life', { age: 30, sumAssured: 2500000, term: 20 });
      const en = cheapest('endowment', { age: 30, sumAssured: 1000000, term: 20 });
      const example = t || en ? `<h2>What it costs, with our numbers</h2>
<p>For a 30-year-old,${t ? ` the lowest estimate we hold for <strong>Rs 25 lakh of term cover over 20 years</strong> is about <strong>${E.npr(t.est.annual)} a year</strong> (about ${E.npr(t.est.monthly)}/month, ${esc(coName(t))}).` : ''}${en ? ` The lowest estimate for an <strong>endowment of Rs 10 lakh over 20 years</strong> is about <strong>${E.npr(en.est.annual)} a year</strong> (${esc(coName(en))}).` : ''} ${t && en ? 'Notice that the savings plan costs far more for far less cover. That is not a trick: part of your premium is being saved for you.' : ''} These are indicative estimates, not quotes. <a class="underline text-crimson" href="#/about">How we estimate</a>.</p>` : '';
      return `
<p>Most Nepali life insurance is bought as a savings habit, usually after an agent visits. That is fine if you know what you are buying. The cleanest way to choose is to ask one question first: <strong>what happens to my family if I am gone next year?</strong></p>
<h2>Term insurance: pure protection</h2>
<p>You pick a cover amount (say Rs 25 lakh) and a period (say 20 years). If you die in that period, your nominee gets the full amount. If you live, the policy ends and nothing comes back. Because the insurer is only promising protection, premiums are low. It is the best value for a young earner with a spouse, children or parents depending on them.</p>
<h2>Endowment: protection plus savings</h2>
<p>An endowment pays the sum assured if you die during the term, or the sum assured <em>plus accumulated bonus</em> if you survive to maturity. It is the most common plan in Nepal. The trade-off is cost and rigidity. Premiums are many times higher than term for the same cover, and if you stop early you receive only the <em>surrender value</em>, which in the first years is often much less than you paid.</p>
<h2>Money-back: savings in instalments</h2>
<p>A money-back plan pays slices of the sum assured at fixed points, for example 20% at years 5, 10 and 15, with the rest and the bonus at maturity. Death cover continues at the full sum assured. It suits people who want cash arriving at predictable moments, such as school fees or a wedding, and who accept a lower final bonus.</p>
<h2>Child, pension and whole life</h2>
<ul>
<li><strong>Child education</strong> plans build a fund for a set year, and usually waive future premiums if the parent dies.</li>
<li><strong>Pension</strong> plans collect while you earn and pay a regular income after retirement.</li>
<li><strong>Whole life</strong> covers you to a very old age (often 99 or 100) and leaves a guaranteed amount to your family.</li>
</ul>
${table(['', 'Term', 'Endowment', 'Money-back'], [
        ['Main purpose', 'Protect family income', 'Cover plus lump sum', 'Cover plus cash at intervals'],
        ['Payout if you survive', 'None', 'Sum assured plus bonus', 'Instalments, then balance plus bonus'],
        ['Cost for the same cover', 'Lowest', 'Much higher', 'Highest'],
        ['If you stop early', 'Cover ends', 'Surrender value only', 'Surrender value only'],
      ], 'Comparison of term, endowment and money-back plans')}
${example}
<h2>A simple way to decide</h2>
${steps([
        'Work out cover: roughly 10 to 15 times your yearly income, minus loans and savings you already have.',
        'Buy that as term insurance first. It is the cheapest way to make sure your family is safe.',
        'If you can afford more, add an endowment or money-back plan for a specific goal, such as a child\'s studies, and only for an amount you can pay every year for the full term.',
        'Check each insurer\'s claim settlement record and bonus history before you choose, not just the premium.',
        'Name a nominee, and tell your family where the policy bond is kept.',
      ])}
${note('<strong>Be honest on the form.</strong> Health, smoking and occupation answers decide your premium. If you hide something and the insurer finds out at claim time, the claim can be rejected. In the first days after the policy arrives you also have a free-look period to read it and cancel for a refund.')}`;
    },
  });

  add({
    id: 'health-insurance-guide', icon: 'heart-pulse', title: 'Health insurance: private plans and the government scheme', titleNe: 'स्वास्थ्य बीमा',
    desc: 'How hospital cover works, what to check before buying, and how the Health Insurance Board scheme fits in.',
    short: 'Health insurance pays hospital bills up to a yearly limit. The government scheme is very cheap but limited to listed hospitals and about Rs 1 lakh per family. Private plans cost more and let you choose bigger cover.',
    cta: { href: '#/quote/health', label: 'Compare health plans' }, related: ['claims', 'tax-benefits', 'faq'],
    body() {
      const g = ctx().governmentHealthInsurance || {};
      const prem = g.premiumPerFamilyNPR, cover = g.coverNPR;
      const y30 = cheapest('health', { age: 30, coverAmount: 500000 });
      const y50 = cheapest('health', { age: 50, coverAmount: 500000 });
      const cost = y30 ? `<p>For a Rs 5 lakh yearly cover, the lowest estimate we hold is about <strong>${E.npr(y30.est.annual)} a year at age 30</strong>${y50 ? ` and about <strong>${E.npr(y50.est.annual)} at age 50</strong>` : ''}. Age is the biggest driver: premiums climb steeply after 45. These are indicative estimates, see <a class="underline text-crimson" href="#/about">how we estimate</a>.</p>` : '';
      return `
<p>A hospital stay can wipe out years of savings. Health insurance is meant to stop that: you pay a premium, and when you are admitted the insurer pays eligible bills up to your <strong>sum insured</strong> for the year.</p>
<h2>The government scheme (Health Insurance Board)</h2>
<p>The ${esc(g.name || 'Social Health Insurance Programme run by the Health Insurance Board (hib.gov.np)')} is open to every family.${prem ? ` A Health Insurance Board report (2018/19) put the premium for a family of up to five at about <strong>${E.npr(prem)} a year</strong>, with a small amount for each extra member. This is an old figure, so treat it as a guide.` : ''}${cover ? ` It covered treatment up to about <strong>${E.npr(cover)} per family per year</strong> in that report, with extra for added members, the elderly and some chronic diseases.` : ''} Poor and ultra-poor families, certain listed diseases and people above 70 are supported by the state. Treatment is at hospitals and health posts that are enrolled with the Board, so check that yours is on the list.</p>
${note(`<strong>Rates may change.</strong> A task force in early 2025 proposed higher, income-linked premiums, and the Board has reported a funding gap. Confirm today's premium and cover at hib.gov.np before enrolling.`)}
<h2>Private health insurance</h2>
<p>Private plans from non-life insurers offer bigger cover (commonly Rs 3 lakh to Rs 10 lakh or more), a wider choice of hospitals, and often cashless treatment at network hospitals. You pay more, and the price depends on your age and the cover you choose.</p>
${cost}
<h2>What to check before you buy</h2>
<ul>
<li><strong>Network hospitals.</strong> Is your family's usual hospital in Kathmandu, Pokhara, Biratnagar or Butwal on the cashless list?</li>
<li><strong>Waiting period.</strong> Many illnesses, and anything you already have, are not payable for the first months or years.</li>
<li><strong>Room-rent limit.</strong> A cap on room rent often shrinks other charges in proportion, so a nicer room can reduce your total payout.</li>
<li><strong>Co-payment.</strong> Some plans make you pay a share of every bill, commonly 10 to 20%.</li>
<li><strong>Exclusions.</strong> Dental, cosmetic, maternity and some chronic conditions are often excluded or limited.</li>
<li><strong>Renewal.</strong> Can you renew into old age, and does the premium jump?</li>
</ul>
<h2>Which one for whom?</h2>
<p>If money is tight, enrolling in the government scheme is much better than having nothing. If you earn a steady income, a private plan can sit on top for bigger or faster care. Parents over 60 should compare carefully, since few plans accept new entrants at that age and premiums are high. Pair health cover with a <a class="underline text-crimson" href="#/learn/tax-benefits">tax deduction</a> by keeping your premium receipts.</p>
<p>Always declare existing conditions honestly. Pre-existing illnesses are usually excluded at first, but hiding them can get a later claim rejected.</p>`;
    },
  });

  add({
    id: 'motor-insurance-guide', icon: 'bike', title: 'Bike and car insurance: what the law requires and what is worth adding', titleNe: 'सवारी साधन बीमा',
    desc: 'Third-party is compulsory. Comprehensive protects your own vehicle. Here are the costs and the claim traps.',
    short: 'Every registered vehicle must have third-party insurance, which covers harm to others, not your own vehicle. Comprehensive costs about 1.5 to 3.5% of vehicle value a year and also covers your own repairs and theft.',
    cta: { href: '#/quote/motor-bike', label: 'Compare bike insurance' }, related: ['claims', 'faq', 'glossary'],
    body() {
      const c = ctx(); const tariff = arr(c.motorThirdPartyTariff); const comp = c.motorComprehensiveRate || {};
      const rate = comp.ratePercentOfValueTypical;
      const bikeEx = rate ? Math.round((250000 * rate) / 100) : null;
      const rows = tariff.map((t) => [esc(t.vehicle || 'Vehicle'), esc(t.ccBand || '—'), (t.annualPremiumNPR != null ? `about ${E.npr(t.annualPremiumNPR)}` : '—'), esc(t.coverNote || '')]);
      return `
<p>In Nepal you cannot renew your bluebook or road permit without valid <strong>third-party insurance</strong>, and it has been compulsory since 2009. But third-party is the minimum, not the whole story.</p>
<h2>Third-party: for other people</h2>
<p>If you injure someone, kill someone or damage their property, third-party cover pays them, within the policy limits. It does <em>not</em> pay to fix your own vehicle, and it does not pay for your own injuries. Premiums are set by the regulator's motor directive, so they are almost the same everywhere; shopping around saves little.</p>
${rows.length ? table(['Vehicle', 'Engine size', 'Third-party premium per year', 'Notes'], rows, 'Approximate third-party motor premiums') : ''}
<p class="text-sm text-ink-mute">${esc(c.motorTariffNote || 'Premiums include VAT and stamp duty. Check the insurer\'s quote for the exact amount.')} Figures marked "about" are estimates as of 2026; the car rows are rough guides only.</p>
<h2>Comprehensive: your vehicle too</h2>
<p>Comprehensive cover includes third-party liability <em>and</em> pays for damage to your own vehicle from accidents, fire, theft and, with add-ons, natural calamities, riots and strikes. Its price is a percentage of the vehicle's insured value${rate ? `, typically about ${esc(rate)}% a year` : ''}.${bikeEx ? ` For a bike valued at Rs 2.5 lakh, that is roughly <strong>${E.npr(bikeEx)} a year</strong> before VAT, against about Rs 2,000 for third-party alone.` : ''} ${esc(comp.note || '')}</p>
<h2>Is comprehensive worth it?</h2>
<ul>
<li><strong>Worth it:</strong> a new or financed vehicle, a car, or any vehicle you could not afford to repair or replace yourself.</li>
<li><strong>Maybe not:</strong> an old bike worth very little, where repairs would cost more than the premium saves.</li>
<li><strong>Useful add-ons:</strong> zero-depreciation (no deduction for parts wear), natural-calamity cover, and personal accident cover for the rider and pillion.</li>
</ul>
<h2>Three traps</h2>
${steps([
        'Deductible (excess). You pay the first part of every own-damage claim. A higher deductible lowers the premium but costs you at claim time.',
        'No-claim discount. Each claim-free year earns a discount on renewal, and a comprehensive claim usually resets it. For tiny dents it can be cheaper to pay yourself.',
        'Gaps in renewal. A lapsed policy means no cover and a lost discount. If you have an accident one day after expiry, you are on your own.',
      ])}
${note('<strong>After an accident</strong>: do not move the vehicle unless needed, take photos, call the insurer and the Traffic Police, and ask for the police report. Our <a class="underline text-crimson" href="#/learn/claims">claims guide</a> has the full steps.')}`;
    },
  });

  add({
    id: 'claims', icon: 'file-check-2', title: 'How to make a claim, step by step', titleNe: 'दावी कसरी गर्ने',
    desc: 'Checklists for life, health and motor claims, and what to do when a claim is delayed or refused.',
    short: 'Tell the insurer quickly, keep every original document, and ask for a claim number in writing. If the insurer stalls or refuses without good reason, escalate to its grievance officer and then to the Nepal Insurance Authority.',
    cta: { href: '#/companies', label: 'See insurers and their claim records' }, related: ['life-insurance-guide', 'health-insurance-guide', 'motor-insurance-guide'],
    body() {
      const c = ctx(); const cp = c.claimProcess || {}; const reg = c.regulator || {};
      const block = (title, list, tip) => arr(list).length ? `<h2>${title}</h2>${steps(list)}${tip ? `<p class="text-[15px] text-ink-soft">${tip}</p>` : ''}` : '';
      return `
<p>A policy is only as good as the day you claim on it. Most claim problems are not fraud; they are missing papers, missed deadlines or a misunderstanding about what was covered. These checklists come from our research into how Nepali insurers process claims. Your policy document is the final word, so read its claims section too.</p>
${block('Life insurance claim (for the nominee)', cp.life, 'Tip: tell your family now which insurer you have, where the bond is, and who the nominee is.')}
${block('Health insurance claim', cp.health, 'Tip: for planned surgery, inform the insurer before admission. For an emergency, inform them within the time your policy states, often 24 to 48 hours.')}
${block('Motor insurance claim', cp.motor, 'Tip: a police report is mandatory for third-party and theft claims, so never leave the scene without noting the police reference.')}
<h2>Habits that make claims easier</h2>
<ul>
<li>Keep originals and make phone-photo copies of every bill, receipt and form you submit.</li>
<li>Get an acknowledgement or claim number each time you hand over papers.</li>
<li>Answer insurer questions in writing and in time. Delays often come from unanswered requests.</li>
<li>Do not sign a settlement you do not understand. Ask how the amount was calculated, including deductions and co-pay.</li>
</ul>
<h2>If your claim is delayed or refused</h2>
${steps([
        'Ask for the reason in writing, with the policy clause the insurer relies on.',
        'Write to the insurer\'s grievance officer, quoting the policy number and claim number.',
        `If you get no fair answer, complain to ${esc(reg.name || 'the Nepal Insurance Authority')}${reg.website ? ` (${esc(reg.website.replace(/^https?:\/\//, ''))})` : ''} using its grievance form, in person at its office in Kupandole, Lalitpur, or by email or post. Attach policy, claim and evidence.`,
      ])}
${reg.complaintHotline ? note(`<strong>Complaint line:</strong> ${esc(reg.complaintHotline)}. This number comes from a third-party listing, so confirm it on the regulator's own site.`) : ''}
<p>You can also check an insurer's published claim settlement record before buying. On BeemaKhoj each insurer page shows it where we have the data.</p>`;
    },
  });

  add({
    id: 'tax-benefits', icon: 'receipt', title: 'Pay less tax with insurance premiums', titleNe: 'बीमाबाट कर छुट',
    desc: 'Which premiums can be deducted from taxable income, the yearly limits, and how to claim them.',
    short: 'Premiums for life insurance, health insurance and your own house can be deducted from taxable income up to yearly limits. The exact caps change with each budget, so check before you file.',
    cta: { href: '#/quote/endowment', label: 'Compare tax-saving life plans' }, related: ['life-insurance-guide', 'health-insurance-guide', 'faq'],
    body() {
      const tb = arr(ctx().taxBenefits);
      const rows = tb.map((t) => [esc(t.type || 'Insurance premium'), t.limitNPR != null ? `up to ${E.npr(t.limitNPR)} a year` : '—', esc(t.note || '')]);
      return `
<p>Nepal's income tax law lets you subtract certain insurance premiums from your income before tax is calculated. Because you are taxed on a smaller income, a bigger share of your salary stays with you. This is a real benefit, but it should be a bonus on a policy you need, not the reason to buy one.</p>
<h2>The deductions we found</h2>
${rows.length ? table(['Premium type', 'Yearly limit', 'What to know'], rows, 'Insurance tax deductions in Nepal') : '<p>We could not load the tax table. Check the Inland Revenue Department site for current limits.</p>'}
${note('<strong>Figures differ by source.</strong> Reports vary on whether life and health share one combined limit (about Rs 40,000) or have separate limits, and the limits have been revised in recent budgets. Treat the numbers above as estimates as of 2026 and confirm with the Inland Revenue Department (ird.gov.np) or your accountant.')}
<h2>What a deduction is worth</h2>
<p>A deduction reduces taxable income, not the tax itself. Suppose you pay a life insurance premium of Rs 40,000 and the deduction is allowed in full. If your top slice of income is taxed at 20%, you save about <strong>Rs 8,000</strong> in tax. If you are taxed at 10%, you save about Rs 4,000. This is an illustration, not tax advice; your actual saving depends on your income and the current tax slabs.</p>
<h2>How to claim it</h2>
${steps([
        'Keep the official premium receipt or the insurer\'s annual premium certificate.',
        'Give it to your employer\'s accounts team before the tax calculation date, or attach it to your own return if you are self-employed.',
        'Claim the lower of what you actually paid and the yearly limit. Paying more than the limit gives no extra deduction.',
        'Keep the papers for several years in case of an audit.',
      ])}
<h2>Sensible ways to use it</h2>
<ul>
<li>Do not buy an expensive savings plan just to save tax. Compare what you will get at maturity with the tax saved each year.</li>
<li>Buy cover you need anyway: term life for the family, a health plan for the household.</li>
<li>Insuring a private building you own can also earn a small deduction, if the insurer is resident in Nepal.</li>
<li>Premiums for others, such as parents, may not count. Ask your accountant.</li>
</ul>`;
    },
  });

  add({
    id: 'foreign-employment', icon: 'plane-takeoff', title: 'Insurance for workers going abroad', titleNe: 'वैदेशिक रोजगार बीमा',
    desc: 'What the mandatory policy covers, what it costs, and how families can use it if something goes wrong.',
    short: 'Foreign employment insurance is compulsory for workers going abroad through formal channels. It pays your family or you if you die or are disabled, and covers some other losses. Keep the policy number with your family.',
    cta: { href: '#/quote/foreign-employment', label: 'Compare foreign employment plans' }, related: ['claims', 'life-insurance-guide', 'faq'],
    body() {
      const f = ctx().foreignEmploymentInsurance || {};
      return `
<p>Every year hundreds of thousands of Nepalis leave for the Gulf, Malaysia, South Korea and beyond. If you go through the legal route, an insurance policy is part of the process. It exists because the risks are real: accidents at work, illness, and in the worst case death far from home.</p>
<h2>Is it mandatory?</h2>
<p>${f.mandatory === false ? 'It is generally recommended' : 'Yes. Insurance is mandatory for workers going abroad through formal channels'}, and your recruitment agency usually arranges it before the labour permit is stamped. You pay for it, so make sure you receive the policy details, not just a receipt.</p>
<h2>What it typically covers</h2>
<ul>
<li>Death, with the sum paid to your nominee, and help bringing the body home.</li>
<li>Permanent disability from an accident or illness.</li>
<li>Medical treatment costs abroad, up to the policy limit.</li>
<li>Some plans add repatriation, and compensation if you are sent home early under certain conditions.</li>
</ul>
<p>Exact benefits differ between insurers, so read the benefit table. The list above is a general guide, not a promise.</p>
<h2>How much does it cost?</h2>
<p>${f.typicalPremiumNPR ? `A typical total is about <strong>${E.npr(f.typicalPremiumNPR)}</strong>` : 'Premiums are modest'}${f.typicalCoverNPR ? ` for cover of around <strong>${E.nprShort(f.typicalCoverNPR)}</strong>` : ''} (estimates as of 2026). Reports from 2019 showed premiums from roughly Rs 3,900 to Rs 9,000 depending on age and contract length, plus a contribution of Rs 1,500 to the welfare fund, with about Rs 5 lakh cover at the time. Rates and cover have been revised since, so verify the current amount with the Foreign Employment Board or the Nepal Insurance Authority.</p>
${note('<strong>Watch the premium period.</strong> Past news reports found workers being charged for a longer period than their contract. Check that the policy period matches your contract, usually two or three years.')}
<h2>Before you fly</h2>
${steps([
        'Ask for the insurer\'s name, the policy number and the claim contact. Photograph the policy.',
        'Send a copy to your family and write down the nominee\'s full name and citizenship number.',
        'Check the nominee is someone who will be reachable. Update it if you marry.',
        'Save the insurer\'s phone number and email in your family\'s phones.',
        'Never pay an agent in cash without an official receipt. Commissions on these policies are no longer allowed.',
      ])}
<h2>If something happens</h2>
<p>Your family should contact the insurer first, then the recruiting agency and the Foreign Employment Board. Use the life claim steps in our <a class="underline text-crimson" href="#/learn/claims">claims guide</a>. If payment is delayed, file a complaint with the Nepal Insurance Authority. Some insurers also sell policies digitally using your passport number, which is handy for renewals.</p>`;
    },
  });

  add({
    id: 'farm-insurance', icon: 'wheat', title: 'Crop and livestock insurance for farmers', titleNe: 'कृषि तथा पशुधन बीमा',
    desc: 'The government pays most of the premium. Here is how the subsidy works and how to enrol.',
    short: 'Crop and livestock insurance is subsidised by the government, around 75 to 80% of the premium. A farmer often pays only a small share. Enrol before the season, and report any loss quickly.',
    cta: { href: '#/quote/livestock', label: 'Compare livestock and crop cover' }, related: ['claims', 'how-insurance-works', 'faq'],
    body() {
      const a = ctx().agricultureInsurance || {};
      const pct = a.subsidyPercent;
      return `
<p>For a farming family, one bad season or one sick buffalo can mean months of debt. Crop and livestock insurance is designed to soften that blow, and in Nepal the state helps you pay for it.</p>
<h2>What can be insured</h2>
<ul>
<li><strong>Livestock:</strong> cattle, buffalo, goats, pigs and poultry, against death from disease or accident.</li>
<li><strong>Crops:</strong> paddy, maize, wheat, vegetables and other listed crops, against drought, flood, hail, fire and, in some plans, pests.</li>
</ul>
<h2>How the subsidy works</h2>
<p>${pct ? `The government pays a large part of the premium: about <strong>${esc(pct)}%</strong> in current notices.` : 'The government pays a large part of the premium.'} A long-standing rate was 75%, and a notice reported from late 2024 describes a tiered subsidy by size of the sum insured:</p>
${table(['Sum insured', 'Subsidy (approx.)'], [['Up to Rs 50 lakh', '80%'], ['Rs 50 lakh to Rs 1 crore', '65%'], ['Above Rs 1 crore', '50%']], 'Agriculture insurance subsidy tiers')}
<p class="text-sm text-ink-mute">${esc(a.note ? 'Source note: subsidy figures are estimates as of 2026 and insurers have reported delays in subsidy payments from government. Verify with the Ministry of Agriculture and Livestock Development.' : 'Verify the current subsidy with the Ministry of Agriculture and Livestock Development.')}</p>
<h2>A worked example</h2>
<p>Say you insure a buffalo valued at Rs 1.5 lakh and the full premium is about 4%, which is Rs 6,000. With an 80% subsidy you would pay about <strong>Rs 1,200</strong> for the year. The numbers are an illustration; actual rates depend on the animal, age and insurer. On our comparison pages, farm policy estimates also note that a subsidy may reduce what you pay.</p>
<h2>How to enrol</h2>
${steps([
        'Ask your local agriculture or livestock office, municipality or cooperative which insurers operate in your area.',
        'Have the animal examined and tagged by a veterinarian, as insurers usually require a health certificate and an ear tag.',
        'For crops, record the area, crop and sowing date. Enrol before the season starts, not after a problem appears.',
        'Pay your share, get the receipt and the policy document, and note the claim contact.',
      ])}
<h2>If you suffer a loss</h2>
${steps([
        'Inform the insurer or the local office at once, within the days stated in the policy.',
        'For an animal death, keep the body and the tag for the technician. Get a veterinarian\'s certificate.',
        'For crop loss, do not harvest or clear the field until the surveyor has visited.',
        'Take dated photos and keep all papers. Follow up in writing.',
      ])}
${note('<strong>If payment is slow:</strong> write to the insurer, then to the Nepal Insurance Authority. Our <a class="underline text-crimson" href="#/learn/claims">claims guide</a> explains how to escalate.')}`;
    },
  });

  // ---------- special pages ----------
  function glossaryBody() {
    const g = arr(ctx().glossary).slice().sort((a, b) => String(a.term).localeCompare(String(b.term)));
    const letters = {};
    g.forEach((x) => { const l = String(x.term || '?').charAt(0).toUpperCase(); (letters[l] = letters[l] || []).push(x); });
    const keys = Object.keys(letters).sort();
    if (!g.length) return '<p>The glossary could not be loaded right now.</p>';
    return `
<div class="not-prose">
<label class="field max-w-md"><span>Search the glossary</span><input id="gl-q" type="search" placeholder="Try premium, nominee, बोनस" autocomplete="off" /></label>
<p id="gl-count" class="mt-2 text-sm text-ink-mute" aria-live="polite">${g.length} terms</p>
<div class="mt-4 flex flex-wrap gap-2" role="group" aria-label="Jump to letter">${keys.map((k) => `<button type="button" class="chip bg-sky text-ink-soft min-h-[44px] min-w-[44px] justify-center" data-jump="${esc(k)}">${esc(k)}</button>`).join('')}</div>
<div id="gl-list" class="mt-6">${keys.map((k) => `<section data-letter="${esc(k)}" class="mb-8" aria-labelledby="gl-${esc(k)}"><h2 id="gl-${esc(k)}" class="font-display text-2xl font-bold border-b border-line pb-2">${esc(k)}</h2><dl class="mt-3 divide-y divide-line">${letters[k].map((x) => `<div class="py-3" data-term="${esc((x.term + ' ' + (x.termNe || '') + ' ' + (x.meaning || '')).toLowerCase())}"><dt class="font-semibold">${esc(x.term)}${x.termNe ? ` <span class="ml-1 text-sm font-normal text-ink-mute">${esc(x.termNe)}</span>` : ''}</dt><dd class="mt-1 text-ink-soft">${esc(x.meaning || '')}</dd></div>`).join('')}</dl></section>`).join('')}</div>
<p id="gl-empty" class="hidden rounded-xl border border-line bg-white p-4 text-ink-soft">No term matches that search. Try a shorter word.</p>
</div>`;
  }
  function mountGlossary(root) {
    const q = root.querySelector('#gl-q'); if (!q) return;
    const total = root.querySelectorAll('[data-term]').length;
    q.addEventListener('input', () => {
      const v = q.value.trim().toLowerCase(); let n = 0;
      root.querySelectorAll('[data-term]').forEach((el) => { const show = !v || el.dataset.term.includes(v); el.classList.toggle('hidden', !show); if (show) n++; });
      root.querySelectorAll('[data-letter]').forEach((s) => s.classList.toggle('hidden', !s.querySelector('[data-term]:not(.hidden)')));
      root.querySelector('#gl-empty').classList.toggle('hidden', n > 0);
      root.querySelector('#gl-count').textContent = v ? `${n} of ${total} terms` : `${total} terms`;
    });
    root.querySelectorAll('[data-jump]').forEach((b) => b.addEventListener('click', () => {
      const s = root.querySelector(`[data-letter="${b.dataset.jump}"]`);
      if (s) { q.value = ''; q.dispatchEvent(new Event('input')); s.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
    }));
  }
  function faqBody() {
    const f = arr(ctx().faqs);
    if (!f.length) return '<p>The questions could not be loaded right now.</p>';
    return `<div class="not-prose divide-y divide-line rounded-xl border border-line bg-white">${f.map((x) => `<details class="group px-4"><summary class="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold"><span>${esc(x.q)}</span><span class="shrink-0 text-ink-mute transition-transform group-open:rotate-45" aria-hidden="true">+</span></summary><p class="pb-4 text-ink-soft">${esc(x.a)}</p></details>`).join('')}</div>`;
  }
  add({
    id: 'glossary', icon: 'book-a', title: 'Insurance words, A to Z', titleNe: 'बीमा शब्दकोश',
    desc: 'Every term you will meet on a policy, in English and Nepali. Searchable.',
    short: 'Insurance papers are full of unfamiliar words. This glossary explains them in plain language, with the Nepali term beside each one.',
    cta: { href: '#/', label: 'Start comparing' }, related: ['how-insurance-works', 'faq', 'claims'], body: glossaryBody, mount: mountGlossary, mins: 4,
  });
  add({
    id: 'faq', icon: 'circle-help', title: 'Frequently asked questions', titleNe: 'सोधिने प्रश्नहरू',
    desc: 'Short answers on tax, lapsing, cancelling, claims and spotting a genuine agent.',
    short: 'Quick answers to what Nepali buyers ask most. For the detail, follow the links to the full guides.',
    cta: { href: '#/', label: 'Start comparing' }, related: ['how-insurance-works', 'claims', 'glossary'], body: faqBody, mins: 5,
  });

  const byId = (id) => TOPICS.find((t) => t.id === id);
  const minutes = (t) => {
    if (t.mins) return t.mins;
    try { return Math.max(3, Math.round(t.body().replace(/<[^>]+>/g, ' ').split(/\s+/).length / 200)); } catch (e) { return 5; }
  };

  // ---------- views ----------
  const crumbs = (cur) => `<nav aria-label="Breadcrumb" class="text-sm text-ink-mute"><a class="underline" href="#/learn">Learn</a>${cur ? ` <span aria-hidden="true">/</span> <span>${esc(cur)}</span>` : ''}</nav>`;

  window.Views = window.Views || {};

  window.Views.learn = {
    title: 'Learn about insurance',
    render() {
      const featured = byId('life-insurance-guide');
      const rest = TOPICS.filter((t) => t !== featured);
      return `
<div class="max-w-page mx-auto px-4 sm:px-6 py-10 sm:py-14">
  ${crumbs()}
  <div class="mt-4 max-w-2xl">
    <h1 class="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">Understand insurance before you buy it</h1>
    <p class="mt-3 text-lg text-ink-soft">Short, honest guides for Nepali families. No jargon without an explanation, and Nepali terms where they help. Read one, then compare real policies.</p>
  </div>
  <div class="mt-10 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-12 items-start">
    <a href="#/learn/${featured.id}" class="group block rounded-xl bg-ink p-6 sm:p-8 text-white focus-visible:outline-offset-4">
      ${UI.icon(featured.icon, 'w-8 h-8 text-marigold')}
      <p class="mt-5 text-sm text-white/70">Start here &middot; ${minutes(featured)} min read</p>
      <h2 class="mt-2 font-display text-2xl sm:text-3xl font-bold leading-tight">${esc(featured.title)}</h2>
      <p class="mt-3 text-white/80">${esc(featured.short)}</p>
      <span class="btn btn-primary mt-6 inline-flex">Read the guide</span>
    </a>
    <div>
      <h2 class="font-display text-xl font-bold">All guides</h2>
      <ul class="mt-3 divide-y divide-line border-y border-line">
        ${rest.map((t) => `<li><a href="#/learn/${t.id}" class="flex gap-4 py-4 min-h-[44px] hover:bg-sky/60 -mx-2 px-2 rounded-lg">
          <span class="mt-0.5 text-ink-soft shrink-0">${UI.icon(t.icon, 'w-5 h-5')}</span>
          <span class="min-w-0"><span class="block font-semibold">${esc(t.title)}</span>
          <span class="block text-sm text-ink-mute">${esc(t.titleNe)} &middot; ${minutes(t)} min</span>
          <span class="mt-1 block text-[15px] text-ink-soft">${esc(t.desc)}</span></span></a></li>`).join('')}
      </ul>
    </div>
  </div>
  <div class="mt-12 rounded-xl border border-line bg-white p-5 sm:p-6 max-w-3xl">
    <h2 class="font-display text-xl font-bold">Ready to see real options?</h2>
    <p class="mt-1 text-ink-soft">Answer two or three questions and compare policies from every licensed insurer, with a price shown as an estimate.</p>
    <a class="btn btn-primary mt-4" href="#/">Compare policies</a>
  </div>
</div>`;
    },
  };

  window.Views.learnTopic = {
    title(params) { const t = byId(params.topic); return t ? t.title : 'Guide not found'; },
    render(params) {
      const t = byId(params.topic);
      if (!t) {
        return `<div class="max-w-page mx-auto px-4 sm:px-6 py-14 max-w-2xl">
  ${crumbs('Not found')}
  <h1 class="mt-4 font-display text-3xl font-bold">We do not have that guide</h1>
  <p class="mt-3 text-ink-soft">The link may be old or mistyped. These guides are available:</p>
  <ul class="mt-4 space-y-1">${TOPICS.map((x) => `<li><a class="underline text-crimson inline-block py-2" href="#/learn/${x.id}">${esc(x.title)}</a></li>`).join('')}</ul>
  <a class="btn btn-ghost mt-4" href="#/learn">Back to all guides</a></div>`;
      }
      const rel = arr(t.related).map(byId).filter(Boolean);
      return `
<article class="max-w-page mx-auto px-4 sm:px-6 py-10 sm:py-14">
  <div class="max-w-3xl">
    ${crumbs(t.title)}
    <h1 class="mt-4 font-display text-3xl sm:text-4xl font-extrabold tracking-tight">${esc(t.title)}</h1>
    <p class="mt-2 text-ink-mute">${esc(t.titleNe)} &middot; ${minutes(t)} min read</p>
    <div class="mt-6 rounded-xl border-l-4 border-ink bg-sky p-4 sm:p-5">
      <p class="font-display font-bold text-ink">In short</p>
      <p class="mt-1 text-ink">${esc(t.short)}</p>
    </div>
    <div class="prose-nk mt-8">${t.body()}</div>
    <div class="mt-10 rounded-xl border border-line bg-white p-5 sm:p-6">
      <h2 class="font-display text-xl font-bold">Compare now</h2>
      <p class="mt-1 text-ink-soft">See matching policies from licensed insurers, sorted by your budget.</p>
      <a class="btn btn-primary mt-4" href="${esc(t.cta.href)}">${esc(t.cta.label)}</a>
    </div>
    <p class="mt-6 text-sm text-ink-mute">This guide is general information, not financial advice. Figures are estimates as of 2026 from public sources; confirm with your insurer or the <a class="underline" href="#/about">regulator</a>. How we work: <a class="underline" href="#/about">About BeemaKhoj</a>.</p>
    ${rel.length ? `<section class="mt-10" aria-labelledby="rel-h"><h2 id="rel-h" class="font-display text-xl font-bold">Related guides</h2>
    <ul class="mt-3 divide-y divide-line border-y border-line">${rel.map((r) => `<li><a href="#/learn/${r.id}" class="flex items-start gap-3 py-3 min-h-[44px] hover:bg-sky/60 -mx-2 px-2 rounded-lg"><span class="mt-0.5 text-ink-soft">${UI.icon(r.icon, 'w-5 h-5')}</span><span><span class="block font-semibold">${esc(r.title)}</span><span class="block text-sm text-ink-soft">${esc(r.desc)}</span></span></a></li>`).join('')}</ul></section>` : ''}
  </div>
</article>`;
    },
    mount(root, params) {
      const t = byId(params.topic);
      if (t && t.mount) t.mount(root);
    },
  };
})();
