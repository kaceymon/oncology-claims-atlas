(() => {
  "use strict";

  // ---------- categories ----------
  const CATS = {
    study: { label: "Study scenarios", short: "Study", blurb: "Remit-line scenarios: who owes it, can you bill the patient, fix or appeal, next steps." },
    conflict: { label: "Can't bill together (either/or)", short: "Either/or", blurb: "Same-line, same-day and same-diagnosis conflicts: JW/JZ, 26/TC, one initial infusion, Excludes1…" },
    response: { label: "Denial playbooks", short: "Playbook", blurb: "Step-by-step responses to the denials oncology teams see most." },
    template: { label: "Templates", short: "Template", blurb: "Fill-in letters and scripts: LMNs, appeals, prior auth, P2P prep." },
    carc: { label: "Denial reason codes (CARC)", short: "CARC", blurb: "Claim adjustment reason codes in plain language, with what to do." },
    rarc: { label: "Remark codes (RARC)", short: "RARC", blurb: "Remittance remark codes that explain the CARC." },
    appeal: { label: "Appeal pathways", short: "Appeal", blurb: "Medicare, Medicare Advantage, Part D, Medicaid and commercial levels and deadlines." },
    claim: { label: "Claim forms & types", short: "Claim", blurb: "CMS-1500, UB-04, 837P/I/D, 835, 270/271, 278, NCPDP, corrected/void claims." },
    setting: { label: "Care settings", short: "Setting", blurb: "Where oncology care happens and how each setting bills." },
    payer: { label: "Payer types", short: "Payer", blurb: "Medicare, MA, Part D, Medicaid, commercial/ERISA, TRICARE, VA and more." },
    topic: { label: "Oncology billing topics", short: "Topic", blurb: "ASP, JW/JZ, NDC, 340B, off-label, clinical trials, CAR-T, NCDs." },
    hipaa: { label: "HIPAA standards", short: "HIPAA", blurb: "Transaction, code set, identifier, privacy and security rules – and standard vs payer remark codes." },
    cpt: { label: "CPT codes (oncology)", short: "CPT", blurb: "Drug administration, E/M, radiation, pathology and procedure codes – plain-language labels." },
    provider: { label: "Provider types (NUCC taxonomy)", short: "Provider", blurb: "Every US provider taxonomy code – all 883 of them." },
    icd10: { label: "ICD-10-CM oncology codes", short: "ICD-10", blurb: "The full neoplasm chapter (C00–D49) plus oncology Z/R/D/T codes, FY2027." },
    hcpcs: { label: "HCPCS Level II", short: "HCPCS", blurb: "Every active Level II code (drugs, supplies, temporary codes), Oct 2026." },
    modifier: { label: "HCPCS modifiers", short: "Modifier", blurb: "Level II modifiers: JW, JZ, TB, Q0/Q1, GA/GZ, PO/PN…" },
    pos: { label: "Place of service", short: "POS", blurb: "CMS place-of-service codes for professional claims." },
    tob: { label: "Type of bill", short: "TOB", blurb: "Institutional bill types and how they're built." },
    revenue: { label: "Revenue codes", short: "Revenue", blurb: "Oncology-relevant UB-04 revenue codes (paraphrased)." },
    term: { label: "Glossary", short: "Term", blurb: "Claims jargon decoded." },
  };
  const CAT_ORDER = Object.keys(CATS);
  const ONC_POS = new Set(["02", "10", "11", "12", "19", "21", "22", "23", "24", "31", "34", "49", "81"]);
  const ONC_MODS = new Set(["JW", "JZ", "TB", "PO", "PN", "GA", "GZ", "GX", "GY", "Q0", "Q1", "KX", "JA", "JB", "KD", "XE", "XS", "XP", "XU", "GV", "GW", "TC", "PT", "FQ", "FR", "PD", "ER", "SA", "EY", "KO", "CR"]);
  const FACETS = {
    provider: ["Grouping", "Section"],
    icd10: ["Block", "Billable"],
    hcpcs: ["Series", "Medicare coverage"],
    cpt: ["Group"],
    study: ["Topic", "Billing"],
    conflict: ["Level"],
    carc: ["Topic", "Billing", "Status"],
    rarc: ["Topic", "Billing", "Status"],
  };

  // primary vs secondary billing: X12 codes carry it from the build; these curated entries are tagged by hand
  const BILLING = { Primary: "Primary claim", Secondary: "Secondary / COB claim", Either: "Primary or secondary" };
  const BILLING_CURATED = {
    "study:oa23": "Secondary", "study:secondary-no-eob": "Secondary", "study:crossover-dup": "Secondary", "study:coinsurance": "Secondary",
    "study:cob": "Primary", "study:wrong-payer": "Primary", "claim:secondary": "Secondary", "claim:crossover": "Secondary",
    "payer:medigap": "Secondary", "response:cob": "Primary", "template:cob-update": "Primary",
  };

  // ---------- normalise records ----------
  const R = OCA.records;
  const byId = new Map();
  for (const r of R) {
    if (r.x12) {
      // full X12 index: code, dates, derived topics (official wording lives at x12.org)
      const g = k => r.x12.raw[r.x12.ix[k]];
      const x = r.x12;
      x.topics = g("topics"); x.element = g("element"); x.start = g("start"); x.stop = g("stop"); x.repl = g("replacement"); x.alert = g("alert");
      x.modified = g("modified") || ""; x.billing = g("billing") || "Either";
      x.status = x.stop ? `Retired ${x.stop}${x.repl ? ` – use ${x.repl}` : ""}` : `Active since ${x.start.slice(-4)}`;
      r.billing = x.billing;
      if (!r.curated) {
        const kind = r.cat === "carc" ? "Reason code" : "Remark code";
        r.title = x.element ? `${x.element} – missing, incomplete or invalid` : `${kind} ${r.code} · ${x.topics.join(", ")}`;
        r.summary = `${x.alert ? "Informational alert · " : ""}${x.topics.join(" · ")} · ${x.status}`;
        r.tags = x.topics.concat(x.stop ? ["retired"] : ["active"], x.element ? ["missing info"] : []);
        r.onc = 1;
      } else {
        r.tags = [...new Set(r.tags.concat(x.topics))];
      }
      r.facets = { Topic: x.topics[0], Status: x.stop ? "Retired" : "Active", Billing: BILLING[x.billing] };
    } else if (!r.curated) {
      const g = k => r.raw[r.ix[k]];
      r.facets = {};
      if (r.cat === "provider") {
        r.text = g("text");
        r.summary = r.text;
        r.tags = [g("grouping"), g("classification"), g("specialization"), g("section")].filter(Boolean);
        r.facets = { Grouping: g("grouping"), Section: g("section") };
        r.onc = g("onc");
      } else if (r.cat === "icd10") {
        const bill = g("billable") ? "Billable" : "Header (not billable)";
        r.summary = `${g("block")} · ${bill}`;
        r.tags = [g("block"), bill];
        r.facets = { Block: g("block"), Billable: bill };
        r.onc = 1;
      } else if (r.cat === "hcpcs") {
        r.summary = [g("series"), g("medicare") && "Medicare: " + g("medicare")].filter(Boolean).join(" · ");
        r.tags = [g("series"), g("medicare")].filter(Boolean);
        r.facets = { Series: g("series"), "Medicare coverage": g("medicare") || "Not specified" };
        r.onc = g("onc");
      } else if (r.cat === "modifier") {
        r.summary = "HCPCS Level II modifier";
        r.onc = ONC_MODS.has(r.code) ? 1 : 0;
      } else if (r.cat === "pos") {
        r.text = g("text");
        r.summary = r.text;
        r.onc = ONC_POS.has(r.code) ? 1 : 0;
      }
      r.tags = r.tags || [];
    }
    if (!r.billing && BILLING_CURATED[`${r.cat}:${r.code}`]) r.billing = BILLING_CURATED[`${r.cat}:${r.code}`];
    if (r.billing) {
      if (r.billing !== "Either") r.tags = [...new Set(r.tags.concat([BILLING[r.billing]]))];
      r.hayExtra = r.billing === "Secondary" ? "secondary claim cob" : r.billing === "Primary" ? "primary claim" : "primary secondary";
    }
    if (r.cat === "cpt") r.facets = { Group: r.cptGroup };
    if (r.cat === "conflict") r.facets = { Level: r.level };
    if (r.cat === "study") r.facets = Object.assign({ Topic: r.study.topic }, r.billing ? { Billing: BILLING[r.billing] } : {});
    r.id = `${r.cat}:${r.code}`;
    r.codeNorm = String(r.code).toLowerCase().replace(/[.\s-]/g, "");
    const plain = (r.body || "").replace(/<[^>]+>/g, " ");
    r.hay = [r.code, r.codeNorm, r.title, r.summary, r.tags.join(" "), plain, r.template || "", r.hayExtra || ""].join(" ").toLowerCase();
    r.titleL = String(r.title).toLowerCase();
    byId.set(r.id, r);
  }
  // either/or pairs from the conflict rules, indexed both ways
  const PAIR_TEXT = { never: "Can't be billed together", modifier: "Together only with a modifier + documentation", oneof: "Pick one – not both", requires: "Needs this code on the same claim" };
  const pairsByCode = new Map();
  for (const r of R) if (r.cat === "conflict") for (const [a, b, type] of r.pairs) {
    for (const [x, y] of [[a, b], [b, a]]) {
      if (!pairsByCode.has(x)) pairsByCode.set(x, []);
      pairsByCode.get(x).push({ other: y, type: type === "requires" && x === b ? "required-by" : type, rule: r });
    }
  }
  // ICD codes match pair keys by category prefix (C50 covers C50.911)
  const pairsFor = code => {
    const out = [];
    for (const [k, list] of pairsByCode) if (k === code || (/^[A-Z]\d/.test(code) && code.startsWith(k) && /^[A-Z]\d\d/.test(k))) out.push(...list);
    return out;
  };
  const icdExcl = OCA.icdExcludes || { notes: [], codes: {} };

  // backlinks
  const back = new Map();
  for (const r of R) for (const t of r.rel || []) {
    if (!back.has(t)) back.set(t, []);
    back.get(t).push(r.id);
  }
  const counts = {};
  for (const r of R) counts[r.cat] = (counts[r.cat] || 0) + 1;

  // ---------- helpers ----------
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const app = $("#app");
  const nf = new Intl.NumberFormat("en-US");
  const href = (path, q) => "#/" + path + (q && Object.keys(q).length ? "?" + new URLSearchParams(q).toString() : "");
  const itemHref = r => href(`item/${encodeURIComponent(r.cat)}/${encodeURIComponent(r.code)}`);
  // curated entries use lowercase slugs as ids; only show real codes (CMS-1500, 837P, 197, 0636…)
  const isRealCode = c => /^[A-Z0-9][A-Z0-9./-]*$/.test(String(c));
  const codeTag = (r, cls = "") => isRealCode(r.code) ? `<code class="${cls}">${esc(r.code)}</code> ` : "";
  const badge = cat => `<span class="badge b-${cat}">${esc(CATS[cat]?.short || cat)}</span>`;

  function parseHash() {
    const h = location.hash.replace(/^#\/?/, "");
    const [path, qs] = h.split("?");
    return { parts: path.split("/").filter(Boolean).map(decodeURIComponent), q: Object.fromEntries(new URLSearchParams(qs || "")) };
  }

  // ---------- smart search ----------
  // Questions and phrases work: stopwords are dropped, synonyms/brand names expand, words are
  // stemmed, group+reason codes (CO-16) and payer numeric codes (00857) are recognised, and
  // when not every word matches, results are ranked by how much of the phrase they cover.
  const STOP = new Set("a an the of for to in on at is are was were be been do does did what whats what's how why when where which who can could should would will i im i'm me my we our you your it its it's this that these those with about mean means meaning tell show find from and or if please there their they them get got has have had as by any some just".split(" "));
  const SYN = {
    dob: ["birth date", "date of birth"], birthday: ["birth date"], birthdate: ["birth date"],
    auth: ["authoriz", "precert"], pa: ["prior auth", "authoriz"], preauth: ["authoriz"], precert: ["authoriz", "precert"], authorization: ["authoriz"],
    mod: ["modifier"], mods: ["modifier"], dx: ["diagnos", "icd"], diagnosis: ["diagnos"], px: ["procedure"], rx: ["drug", "pharmac"],
    chemo: ["chemotherap", "antineoplastic"], immuno: ["immunotherap"], io: ["immunotherap"], onc: ["oncolog"], heme: ["hematolog"], rad: ["radiat"], rt: ["radiation therapy", "radiat"],
    lmn: ["medical necessity"], p2p: ["peer-to-peer"], peer: ["peer-to-peer", "peer"], eob: ["eob", "explanation of benefits", "remit"], era: ["835", "remittance"], remit: ["835", "remittance", "remit"],
    cob: ["coordination of benefits", "cob"], tf: ["timely filing"], timely: ["timely filing"], ndc: ["ndc", "national drug code"], mue: ["mue", "medically unlikely"],
    ncci: ["ncci", "bundl"], bundle: ["bundl"], bundled: ["bundl"], bundling: ["bundl"], deny: ["deni"], denied: ["deni"], denial: ["deni"], denials: ["deni"],
    writeoff: ["write off", "writes off", "write-off", "contractual"], bcbs: ["blue cross", "bcbs", "bluecard"], blue: ["blue cross", "bluecard"], anthem: ["anthem", "blue cross"],
    uhc: ["unitedhealthcare", "uhc"], united: ["unitedhealthcare"], ma: ["medicare advantage"], mapd: ["medicare advantage"], phi: ["phi", "protected health"], hippa: ["hipaa"],
    missing: ["missing", "lacks", "incomplete", "absent"], wrong: ["invalid", "incorrect", "wrong", "doesn't match"], invalid: ["invalid", "incorrect"],
    waste: ["waste", "discard"], wasted: ["waste", "discard"], trial: ["trial", "nct"], copay: ["copay", "co-payment", "copayment"], deductible: ["deductible"],
    corrected: ["corrected", "replacement", "frequency 7"], resubmit: ["resubmit", "corrected", "new claim"], rebill: ["resubmit", "corrected", "rebill"],
    hcfa: ["cms-1500"], ub04: ["ub-04"], ub: ["ub-04"], cms1500: ["cms-1500"], biosim: ["biosimilar"], cant: ["cannot", "can't", "not"], refund: ["refund", "reversal", "recoup"],
    eligibility: ["eligib"], eligible: ["eligib"], benefits: ["benefit"], appeal: ["appeal", "reconsideration", "redetermination"], ins: ["insur", "plan"],
    "patient responsibility": ["patient responsibility", "pr-"], loa: ["leave"], cpt: ["cpt"],
  };
  const BRANDS = {
    keytruda: "pembrolizumab", opdivo: "nivolumab", yervoy: "ipilimumab", tecentriq: "atezolizumab", imfinzi: "durvalumab", libtayo: "cemiplimab", jemperli: "dostarlimab",
    herceptin: "trastuzumab", perjeta: "pertuzumab", kadcyla: "ado-trastuzumab", enhertu: "fam-trastuzumab", phesgo: "pertuzumab", avastin: "bevacizumab", mvasi: "bevacizumab",
    rituxan: "rituximab", truxima: "rituximab", darzalex: "daratumumab", kyprolis: "carfilzomib", velcade: "bortezomib", empliciti: "elotuzumab", sarclisa: "isatuximab",
    erbitux: "cetuximab", vectibix: "panitumumab", cyramza: "ramucirumab", adcetris: "brentuximab", padcev: "enfortumab", trodelvy: "sacituzumab", blincyto: "blinatumomab",
    neulasta: "pegfilgrastim", neupogen: "filgrastim", zarxio: "filgrastim", udenyca: "pegfilgrastim", fulphila: "pegfilgrastim", granix: "tbo-filgrastim",
    aranesp: "darbepoetin", procrit: "epoetin", epogen: "epoetin", retacrit: "epoetin", xgeva: "denosumab", prolia: "denosumab", zometa: "zoledronic", reclast: "zoledronic",
    emend: "aprepitant", cinvanti: "aprepitant", aloxi: "palonosetron", zofran: "ondansetron", akynzeo: "fosnetupitant",
    taxol: "paclitaxel", abraxane: "paclitaxel protein", taxotere: "docetaxel", gemzar: "gemcitabine", alimta: "pemetrexed", paraplatin: "carboplatin", platinol: "cisplatin",
    eloxatin: "oxaliplatin", camptosar: "irinotecan", adriamycin: "doxorubicin", doxil: "doxorubicin", cytoxan: "cyclophosphamide", treanda: "bendamustine", bendeka: "bendamustine",
    vidaza: "azacitidine", dacogen: "decitabine", halaven: "eribulin", lupron: "leuprolide", eligard: "leuprolide", zoladex: "goserelin", faslodex: "fulvestrant", firmagon: "degarelix",
    sandostatin: "octreotide", somatuline: "lanreotide", xeloda: "capecitabine", temodar: "temozolomide",
    yescarta: "axicabtagene", kymriah: "tisagenlecleucel", abecma: "idecabtagene", carvykti: "ciltacabtagene", breyanzi: "lisocabtagene", tecartus: "brexucabtagene",
    pluvicto: "lutetium", lutathera: "lutetium", xofigo: "radium",
  };
  function stem(w) {
    if (w.length < 5 || /\d/.test(w)) return w;
    return w.replace(/(ies)$/, "y").replace(/(ing|ed|es|s)$/, "");
  }
  function parseQuery(query) {
    const notes = [];
    let q = " " + query.toLowerCase().replace(/[“”]/g, '"').replace(/[‘’]/g, "'") + " ";
    const terms = [];
    // "quoted phrases" must appear as written
    q = q.replace(/"([^"]+)"/g, (_, p) => { terms.push({ alts: [p.trim()], w: 2, label: `"${p.trim()}"` }); return " "; });
    // group code + reason: CO-16, PR 1, oa18
    q = q.replace(/(?:^|[\s(])(co|pr|oa|pi)[\s-]*([a-z]?\d{1,3})(?=[\s,.;:)?!]|$)/g, (_, g, c) => {
      terms.push({ alts: [`${g}-${c}`, `${g} ${c}`, `carc ${c}`], code: c, codeCat: "carc", w: 3, label: `${g.toUpperCase()}-${c.toUpperCase()}` });
      notes.push(g === "co" || g === "pi"
        ? `<b>${g.toUpperCase()}</b> means the provider is responsible – you can't bill the patient for a ${g.toUpperCase()} adjustment. <a href="${itemHref(byId.get("term:group-codes") || { cat: "term", code: "group-codes" })}">Group codes explained</a>`
        : g === "pr" ? `<b>PR</b> means patient responsibility – the patient (or their secondary insurance) owes it.` : `<b>OA</b> is an "other adjustment" – usually informational, not billable to the patient.`);
      return " ";
    });
    const words = q.split(/[^a-z0-9.\-'/]+/).map(w => w.replace(/^[.\-'/]+|[.\-'/]+$/g, "")).filter(Boolean);
    for (const raw of words) {
      const w = raw.replace(/'/g, "");
      if (STOP.has(raw) || STOP.has(w)) continue;
      // payer-specific numeric remark codes like 00857
      if (/^0\d{3,5}$/.test(w)) {
        const n = String(+w);
        const std = ["n", "m", "ma"].map(p => byId.get("rarc:" + (p + n).toUpperCase())).filter(Boolean);
        terms.push({ alts: [w, ...std.map(s => s.code.toLowerCase())], code: w, w: 3, label: w });
        notes.push(`<b>${esc(w)}</b> isn't an X12 code – 5-digit numbers like this are usually the payer's own EOB/explanation code (common on state Medicaid and some commercial remits). Check that payer's code legend, and use the CARC/RARC on the 835 for the same line.${std.length ? ` Closest standard remark code: ${std.map(s => `<a href="${itemHref(s)}">${esc(s.code)}</a> (${esc(s.title)})`).join(", ")}.` : ""} <a href="${itemHref(byId.get("hipaa:remark-codes") || { cat: "hipaa", code: "remark-codes" })}">Standard vs payer codes</a>`);
        continue;
      }
      const isCode = /\d/.test(w) && /^[a-z]{0,3}\d[\w.]*$/.test(w);
      const alts = new Set([w]);
      if (isCode) alts.add(w.replace(/[.\-]/g, ""));
      // a bare number could be a CARC (255) or the digits of a RARC (N255, M25, MA130)
      if (/^\d{1,4}$/.test(w)) ["n", "m", "ma"].forEach(p => alts.add(p + w));
      if (SYN[w]) SYN[w].forEach(a => alts.add(a));
      if (BRANDS[w]) alts.add(BRANDS[w]);
      if (!isCode) { const s = stem(w); if (s.length >= 3) alts.add(s); }
      // bare numbers match whole numbers in text, not digits inside other codes (255 ≠ 32555)
      const rx = /^\d+$/.test(w) ? new RegExp(`(^|[^0-9a-z.])${w}(?![0-9])`) : null;
      terms.push({ alts: rx ? [w] : [...alts], codeAlts: [...alts], rx, code: isCode ? w.replace(/[.\-]/g, "") : null, w: isCode ? 3 : (w.length <= 2 ? 0.5 : 1), label: w });
    }
    // words like "hipaa code denial" describe what kind of thing you want; when the query has
    // something more specific (a number, a topic), they steer ranking instead of filtering.
    const content = terms.filter(t => !GENERIC[t.label]);
    const ctx = new Set();
    if (content.length) {
      for (const t of terms) if (GENERIC[t.label]) GENERIC[t.label].forEach(c => ctx.add(c));
      terms.splice(0, terms.length, ...content);
    }
    const topicWords = words.map(w => TOPIC_WORDS[w]).filter(Boolean);
    const phrase = words.filter(w => !STOP.has(w) && !GENERIC[w]).join(" ");
    return { terms, notes, ctx, topicWords, phrase: phrase.length > 6 ? phrase : "" };
  }
  const DENIAL = ["carc", "rarc", "response", "study"];
  const GENERIC = {
    code: [], codes: [], number: [], standard: [], meaning: [], claim: ["claim"], claims: ["claim"], insurance: [],
    denial: DENIAL, denials: DENIAL, denied: DENIAL, deny: DENIAL, reason: ["carc"], adjustment: ["carc"], carc: ["carc"],
    remark: ["rarc"], remarks: ["rarc"], rarc: ["rarc"], eob: DENIAL, remit: DENIAL, hipaa: ["carc", "rarc", "hipaa"], x12: ["carc", "rarc"],
  };
  const TOPIC_WORDS = { diagnosis: "Diagnosis", dx: "Diagnosis", icd: "Diagnosis", auth: "Authorization / referral", authorization: "Authorization / referral",
    referral: "Authorization / referral", modifier: "Modifier", mod: "Modifier", ndc: "Drug / NDC", drug: "Drug / NDC", cob: "Coordination of benefits",
    eligibility: "Eligibility / coverage dates", provider: "Provider / credentialing", npi: "Provider / credentialing", taxonomy: "Provider / credentialing",
    timely: "Timely filing", duplicate: "Duplicate", records: "Records / attachments", bundled: "Bundling / NCCI", bundling: "Bundling / NCCI", units: "Units / frequency" };

  let vocab = null;
  function suggest(word) {
    if (!vocab) { vocab = new Set(); for (const r of R) for (const t of r.titleL.split(/[^a-z]+/)) if (t.length >= 4) vocab.add(t); vocab = [...vocab]; }
    let best = null, bestD = 3;
    for (const v of vocab) {
      if (Math.abs(v.length - word.length) > 2 || v[0] !== word[0]) continue;
      const d = lev(word, v, bestD);
      if (d < bestD) { bestD = d; best = v; }
    }
    return best;
  }
  function lev(a, b, max) {
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      let rowMin = i;
      for (let j = 1; j <= b.length; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); rowMin = Math.min(rowMin, cur[j]); }
      if (rowMin >= max) return max;
      prev = cur;
    }
    return prev[b.length];
  }

  function search(query, opts) {
    const { terms, notes, phrase, ctx, topicWords } = parseQuery(query);
    notes.unshift(...pairCheck(query));
    const info = { notes, partial: false, didYouMean: null, terms };
    const exact = terms.map(() => []);
    const totalW = terms.reduce((s, t) => s + t.w, 0);
    const strict = [], loose = [];
    const seen = terms.map(() => false);
    for (const r of R) {
      if (opts.onc && !r.onc) continue;
      if (!terms.length) { strict.push([0, r]); continue; }
      let got = 0, score = 0;
      terms.forEach((t, i) => {
        let hit = false;
        for (const a of t.alts) {
          if (t.rx ? !t.rx.test(r.hay) : !r.hay.includes(a)) continue;
          hit = true;
          if (r.titleL.includes(a)) score += 20 * t.w;
          if (r.titleL.startsWith(a)) score += 8;
          break;
        }
        if (t.codeCat && r.cat !== t.codeCat) { /* group-code terms only match reason codes by code */ }
        else if (t.code && (r.codeNorm === t.code || (t.codeAlts || t.alts).includes(r.codeNorm))) { hit = true; score += 1000; exact[i].push(r); }
        else if (t.code && !t.codeCat && t.code.length > 1 && r.codeNorm.startsWith(t.code)) { hit = true; score += 250 - Math.min(150, r.codeNorm.length * 5); }
        if (hit) { got += t.w; seen[i] = true; }
      });
      if (!got) continue;
      if (phrase) { if (r.titleL.includes(phrase)) score += 150; else if (r.hay.includes(phrase)) score += 60; }
      if (r.curated) score += 15;
      if (r.onc) score += 3;
      if (ctx.has(r.cat)) score += 120;
      if (topicWords.length && r.x12 && topicWords.some(tw => r.x12.topics.includes(tw))) score += 80;
      if (got >= totalW) strict.push([score + 500, r]);
      else loose.push([score + 400 * (got / totalW), r, got / totalW]);
    }
    let out = strict;
    if (strict.length < 12 && terms.length > 1) {
      const extra = loose.filter(x => x[2] >= 0.5);
      if (extra.length) { info.partial = strict.length === 0; out = strict.concat(extra); }
    }
    // explain bare numbers: which code lists they hit, and whether that fits what the user described
    const pairToks = pairCheck.hitTokens || new Set();
    terms.forEach((t, i) => {
      // skip when the number is clearly part of a code-pair question (26 TC, 96413 96360)
      if (!/^\d{1,4}$/.test(t.label) || (pairToks.size > 1 && pairToks.has(t.label.toUpperCase()))) return;
      const hits = exact[i].filter(r => r.cat === "carc" || r.cat === "rarc");
      if (!hits.length && !exact[i].length) {
        notes.push(`No standard code list has <b>${esc(t.label)}</b>. If it's printed on an EOB or portal, it's most likely the payer's own explanation code – check that payer's code legend. <a href="${itemHref(byId.get("hipaa:remark-codes") || { cat: "hipaa", code: "remark-codes" })}">Standard vs payer codes</a>`);
        return;
      }
      if (!hits.length) return;
      const list = hits.map(r => `<a href="${itemHref(r)}">${r.cat === "carc" ? "CARC" : "RARC"} ${esc(r.code)}</a> (${esc(r.x12 ? r.x12.topics.join(", ") : r.title)}${r.x12?.stop ? ", retired" : ""})`).join(" and ");
      const wanted = topicWords.filter(tw => !hits.some(r => r.x12?.topics.includes(tw)));
      if (wanted.length) {
        const tw = wanted[0];
        notes.push(`In the standard HIPAA lists, <b>${esc(t.label)}</b> is ${list} – neither is about ${esc(tw.toLowerCase())}. If your remit calls ${esc(t.label)} a ${esc(tw.toLowerCase())} denial, it's probably the <b>payer's own code</b>; the standard ${esc(tw.toLowerCase())} codes are <a href="${href("search", { cat: "carc", "f.Topic": tw })}">reason codes</a> and <a href="${href("search", { cat: "rarc", "f.Topic": tw })}">remark codes</a> tagged ${esc(tw)}.`);
      } else if (hits.length > 1) {
        notes.push(`<b>${esc(t.label)}</b> appears in more than one list: ${list}. Check whether your remit shows it as a reason code (with CO/PR/OA) or a remark code (starts with N, M or MA).`);
      }
    });
    if (topicWords.length && !terms.some(t => t.code)) {
      const tw = topicWords[0];
      const n = R.filter(r => r.x12 && r.x12.topics.includes(tw)).length;
      if (n && [...ctx].some(c => c === "carc" || c === "rarc")) notes.push(`All standard codes about <b>${esc(tw)}</b> (${n}): <a href="${href("search", { cat: "carc", "f.Topic": tw })}">reason codes (CARC)</a> · <a href="${href("search", { cat: "rarc", "f.Topic": tw })}">remark codes (RARC)</a>`);
    }
    if (!out.length && terms.length) {
      const fixes = terms.map((t, i) => (!seen[i] && !t.code && t.label.length >= 4) ? suggest(t.label) : null);
      if (fixes.some(Boolean)) info.didYouMean = terms.map((t, i) => fixes[i] || t.label).join(" ");
    }
    out.sort((a, b) => b[0] - a[0] || CAT_ORDER.indexOf(a[1].cat) - CAT_ORDER.indexOf(b[1].cat) || String(a[1].code).localeCompare(String(b[1].code), "en", { numeric: true }));
    const res = out.map(x => x[1]);
    res.info = info;
    return res;
  }

  // ---------- views ----------
  function viewHome() {
    document.title = "Claims Atlas";
    const tiles = CAT_ORDER.map(c => `
      <a class="tile b-${c}" href="${href("search", { cat: c })}">
        <div class="tile-top">${badge(c)}<span class="count">${nf.format(counts[c] || 0)}</span></div>
        <div class="tile-title">${esc(CATS[c].label)}</div>
        <div class="tile-blurb">${esc(CATS[c].blurb)}</div>
      </a>`).join("");
    const quick = [
      ["conflict:jw-jz", "JW vs JZ (same line)"], ["conflict:26-tc", "26 vs TC"], ["conflict:one-initial", "One initial infusion per visit"],
      ["study:co16-dob", "CO-16: missing date of birth"], ["study:jz-missing", "Missing modifier (JW/JZ)"], ["term:group-codes", "CO vs PR – who owes it?"],
      ["hipaa:overview", "HIPAA standards"], ["payer:anthem", "Anthem BCBS"],
      ["topic:claim-lifecycle", "The claim lifecycle"], ["response:medical-necessity", "Medical necessity denial"],
      ["response:prior-auth-missing", "No authorization on file"], ["template:lmn", "Letter of medical necessity"],
      ["carc:50", "CARC 50"], ["topic:clinical-trials", "Clinical trial billing"], ["topic:jw-jz", "JW / JZ waste"],
      ["appeal:medicare-l1", "Medicare appeal level 1"],
    ].filter(([id]) => byId.has(id)).map(([id, l]) => `<a class="chip" href="${itemHref(byId.get(id))}">${esc(l)}</a>`).join("");
    app.innerHTML = `
      <section class="hero">
        <span class="eyebrow">US health insurance claims · oncology deep-dive</span>
        <h1>Every claim type, provider type, code and denial – <span class="grad-text">searchable.</span></h1>
        <p class="lede">${nf.format(R.length)} entries built from public federal code sets, with plain-language denial playbooks, appeal pathways and fill-in templates.</p>
        <form class="bigsearch" id="homeSearch" role="search">
          <input id="homeQ" type="search" placeholder="Ask anything: “what does CO 16 mean”, “Keytruda”, “missing modifier”, “00857”…" aria-label="Search" autocomplete="off">
          <button class="btn primary">Search</button>
        </form>
        <div class="chips">${quick}</div>
        <div class="stats">${[["provider", "provider types"], ["icd10", "oncology ICD-10 codes"], ["hcpcs", "HCPCS codes"], ["cpt", "oncology CPT codes"], ["carc", "denial codes explained"], ["rarc", "remark codes"], ["study", "study scenarios"], ["template", "templates"]]
          .map(([c, l]) => `<div class="stat"><b>${nf.format(counts[c] || 0)}</b><span>${l}</span></div>`).join("")}</div>
      </section>
      <h2 class="section-h">Browse</h2>
      <div class="tiles">${tiles}</div>
      <p class="muted small">Educational reference, not legal, coding or billing advice. Payer rules change – verify against the payer's current policy and the linked official source.</p>`;
    $("#homeSearch").onsubmit = e => { e.preventDefault(); location.hash = href("search", { q: $("#homeQ").value.trim() }); };
    $("#homeQ").focus();
  }

  let lastSearchHash = href("search");
  function viewSearch(q) {
    lastSearchHash = location.hash || href("search");
    const query = q.q || "", cat = q.cat || "", onc = q.onc === "1";
    const facets = {};
    for (const [k, v] of Object.entries(q)) if (k.startsWith("f.")) facets[k.slice(2)] = v;
    const all = search(query, { onc, facets: null });
    const catCounts = {};
    for (const r of all) catCounts[r.cat] = (catCounts[r.cat] || 0) + 1;
    const results = all.filter(r => (!cat || r.cat === cat) && Object.entries(facets).every(([k, v]) => r.facets?.[k] === v));
    const limit = Math.max(50, +(q.n || 100));
    document.title = (query ? `“${query}” – ` : "") + (cat ? CATS[cat]?.label + " – " : "") + "Claims Atlas";

    const qWith = patch => { const n = Object.assign({}, q, patch); for (const k in n) if (n[k] === "" || n[k] == null) delete n[k]; delete n.n; return href("search", n); };
    const catLinks = [`<a class="facet ${!cat ? "on" : ""}" href="${qWith({ cat: "", ...clearFacets(q) })}">All <span>${nf.format(all.length)}</span></a>`]
      .concat(CAT_ORDER.filter(c => catCounts[c]).map(c => `<a class="facet ${cat === c ? "on" : ""}" href="${qWith({ cat: cat === c ? "" : c, ...clearFacets(q) })}">${esc(CATS[c].label)} <span>${nf.format(catCounts[c])}</span></a>`)).join("");

    let facetHtml = "";
    if (cat && FACETS[cat]) {
      const base = all.filter(r => r.cat === cat);
      facetHtml = FACETS[cat].map(name => {
        const fc = {};
        for (const r of base) {
          const other = Object.entries(facets).every(([k, v]) => k === name || r.facets?.[k] === v);
          if (other) { const v = r.facets?.[name]; if (v) fc[v] = (fc[v] || 0) + 1; }
        }
        const vals = Object.entries(fc).sort((a, b) => b[1] - a[1]);
        if (!vals.length) return "";
        return `<div class="facet-group"><h4>${esc(name)}</h4>${vals.map(([v, n]) =>
          `<a class="facet ${facets[name] === v ? "on" : ""}" href="${qWith({ ["f." + name]: facets[name] === v ? "" : v })}">${esc(v)} <span>${nf.format(n)}</span></a>`).join("")}</div>`;
      }).join("");
    }

    const rows = results.slice(0, limit).map(r => `
      <a class="row" href="${itemHref(r)}">
        <div class="row-head">${badge(r.cat)}${codeTag(r, "code")}<span class="row-title">${esc(r.title)}</span>${billPill(r)}</div>
        ${r.summary && r.summary !== r.title ? `<div class="row-sum">${esc(clip(r.summary, 220))}</div>` : ""}
      </a>`).join("");

    app.innerHTML = `
      <div class="search-layout">
        <div class="sheet-backdrop" id="sheetBackdrop"></div>
        <aside class="sidebar" id="sidebar" aria-label="Filters">
          <div class="sheet-head"><b>Filters</b><button class="btn ghost small" id="closeFilters" type="button">Done</button></div>
          <label class="toggle"><input type="checkbox" id="oncOnly" ${onc ? "checked" : ""}> Oncology-relevant only</label>
          <div class="facet-group"><h4>Category</h4>${catLinks}</div>
          ${facetHtml}
        </aside>
        <section class="results">
          <form class="bigsearch slim" id="searchForm" role="search">
            <input id="q" type="search" value="${esc(query)}" placeholder="Search codes, names, denials, templates…" aria-label="Search" autocomplete="off">
            <button class="btn primary">Search</button>
          </form>
          <div class="cat-strip scroll-x">${[`<a class="chip ${!cat ? "on" : ""}" href="${qWith({ cat: "", ...clearFacets(q) })}">All ${nf.format(all.length)}</a>`]
            .concat(CAT_ORDER.filter(c => catCounts[c]).map(c => `<a class="chip ${cat === c ? "on" : ""}" href="${qWith({ cat: cat === c ? "" : c, ...clearFacets(q) })}">${esc(CATS[c].short)} ${nf.format(catCounts[c])}</a>`)).join("")}</div>
          <div class="result-meta">
            <span><b>${nf.format(results.length)}</b> result${results.length === 1 ? "" : "s"}${cat ? ` in ${esc(CATS[cat].label)}` : ""}${Object.entries(facets).map(([k, v]) => ` · ${esc(k)}: ${esc(v)}`).join("")}</span>
            <button class="btn ghost small" id="toggleFilters" type="button">Filters${Object.keys(facets).length + (onc ? 1 : 0) ? ` · ${Object.keys(facets).length + (onc ? 1 : 0)}` : ""}</button>
            ${cat ? `<span class="muted small">${esc(CATS[cat].blurb)}</span>` : ""}
          </div>
          ${all.info.notes.map(n => `<div class="note">${n}</div>`).join("")}
          ${all.info.partial && !(pairCheck.hitTokens?.size > 1) ? `<div class="note subtle">No entry matched every word, so these match most of your phrase.</div>` : ""}
          ${all.info.didYouMean ? `<div class="note">Did you mean <a href="${qWith({ q: all.info.didYouMean })}"><b>${esc(all.info.didYouMean)}</b></a>?</div>` : ""}
          <div class="list">${rows || `<p class="empty">No matches. Try fewer words, a code without dots (c50911), or turn off “Oncology-relevant only”.</p>`}</div>
          ${results.length > limit ? `<a class="btn more" href="${(() => { const n = Object.assign({}, q, { n: limit + 200 }); return href("search", n); })()}">Show more (${nf.format(results.length - limit)} remaining)</a>` : ""}
        </section>
      </div>`;
    const input = $("#q");
    let t;
    input.oninput = () => { clearTimeout(t); t = setTimeout(() => { history.replaceState(null, "", qWith({ q: input.value.trim() })); viewSearch(Object.assign({}, q, { q: input.value.trim() })); const i = $("#q"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 180); };
    $("#searchForm").onsubmit = e => { e.preventDefault(); location.hash = qWith({ q: input.value.trim() }); };
    $("#oncOnly").onchange = e => { location.hash = qWith({ onc: e.target.checked ? "1" : "" }); };
    const sheet = open => { $("#sidebar").classList.toggle("open", open); $("#sheetBackdrop").classList.toggle("open", open); document.body.classList.toggle("noscroll", open); };
    document.body.classList.remove("noscroll");
    $("#toggleFilters").onclick = () => sheet(true);
    $("#closeFilters").onclick = () => sheet(false);
    $("#sheetBackdrop").onclick = () => sheet(false);
    if (!query && !window.matchMedia("(max-width: 760px)").matches) input.focus();
  }
  function clearFacets(q) { const o = {}; for (const k in q) if (k.startsWith("f.")) o[k] = ""; return o; }
  function clip(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; }

  function srcList(r) {
    const src = r.curated ? r.src : [[OCA.sources[r.cat]?.name, OCA.sources[r.cat]?.url]];
    const items = (src || []).filter(s => s && s[0]).map(([n, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a></li>`).join("");
    return items ? `<div class="panel"><h3>Official sources</h3><ul class="links">${items}</ul></div>` : "";
  }
  function relList(r) {
    const ids = [...new Set([...(r.rel || []), ...(back.get(r.id) || [])])].filter(id => id !== r.id && byId.has(id));
    if (!ids.length) return "";
    ids.sort((a, b) => CAT_ORDER.indexOf(byId.get(a).cat) - CAT_ORDER.indexOf(byId.get(b).cat));
    return `<div class="panel"><h3>Related</h3><div class="rel">${ids.map(id => { const x = byId.get(id); return `<a class="rel-item" href="${itemHref(x)}">${badge(x.cat)}${codeTag(x)}<span>${esc(clip(x.title, 70))}</span></a>`; }).join("")}</div></div>`;
  }

  // "Can't bill together" panel for a code page: either/or rules + ICD-10 Excludes1
  function codeLink(c) {
    const hit = ["cpt", "hcpcs", "modifier", "icd10"].map(cat => byId.get(`${cat}:${c}`)).find(Boolean);
    return hit ? `<a href="${itemHref(hit)}"><code>${esc(c)}</code></a> <span class="muted">${esc(clip(hit.title, 60))}</span>` : `<a href="${href("search", { q: c })}"><code>${esc(c)}</code></a>`;
  }
  function conflictPanel(r) {
    const pairs = pairsFor(r.code);
    const excl = r.cat === "icd10" ? (icdExcl.codes[r.code] || []).map(i => icdExcl.notes[i]) : [];
    if (!pairs.length && !excl.length) return "";
    let h = `<div class="conflicts"><h3>Can't bill together</h3>`;
    if (pairs.length) {
      const byRule = new Map();
      for (const p of pairs) { if (!byRule.has(p.rule)) byRule.set(p.rule, []); byRule.get(p.rule).push(p); }
      for (const [rule, ps] of byRule) {
        h += `<div class="conflict"><div class="conflict-head"><span class="pill lvl">${esc(rule.level)}</span><a href="${itemHref(rule)}">${esc(rule.title)}</a></div><ul>${ps.map(p =>
          `<li><span class="ptype t-${p.type}">${esc(p.type === "required-by" ? "Add-on that needs this code" : PAIR_TEXT[p.type])}</span> ${codeLink(p.other)}</li>`).join("")}</ul></div>`;
      }
    }
    if (excl.length) {
      h += `<div class="conflict"><div class="conflict-head"><span class="pill lvl">Same diagnosis list</span><a href="${itemHref(byId.get("conflict:excludes1") || r)}">Excludes1 – not coded with ${esc(r.code)}</a></div><ul>${excl.map(([text, refs]) =>
        `<li>${esc(text.replace(/\s*\([^)]*\)\s*$/, ""))} ${refs.map(c => codeLink(c.replace(/-$/, ""))).join(", ")}</li>`).join("")}</ul>
        <p class="muted small">ICD-10-CM FY2027 tabular, including notes inherited from the parent category. If the two conditions are truly unrelated, the guidelines allow both.</p></div>`;
    }
    return h + `<p class="muted small">Rules summarise CPT conventions, CMS NCCI policy and ICD-10-CM notes. For any other code pair, check the <a href="https://www.cms.gov/medicare/coding-billing/national-correct-coding-initiative-ncci-edits" target="_blank" rel="noopener">NCCI edits ↗</a>.</p></div>`;
  }
  // two or more codes in one search: report any either/or rule between them
  function pairCheck(query) {
    const toks = [...new Set(query.toUpperCase().split(/[^A-Z0-9.]+/).filter(t => t && (pairsByCode.has(t) || byId.has(`icd10:${t}`) || byId.has(`cpt:${t}`) || byId.has(`hcpcs:${t}`) || (t.length === 2 && byId.has(`modifier:${t}`)))))];
    pairCheck.hitTokens = new Set();
    if (toks.length < 2) return [];
    const notes = [];
    pairCheck.hitTokens = new Set(toks);
    for (let i = 0; i < toks.length; i++) for (let j = i + 1; j < toks.length; j++) {
      const a = toks[i], b = toks[j];
      const seenRules = new Set();
      for (const hit of pairsFor(a).filter(p => p.other === b || (/^[A-Z]\d/.test(b) && b.startsWith(p.other)))) {
        if (seenRules.has(hit.rule)) continue;
        seenRules.add(hit.rule);
        notes.push(`<b>${esc(a)} + ${esc(b)}</b>: ${esc(hit.type === "required-by" ? `${b} is an add-on that needs ${a}` : PAIR_TEXT[hit.type])} <span class="pill lvl">${esc(hit.rule.level)}</span> – <a href="${itemHref(hit.rule)}">${esc(hit.rule.title)}</a>`);
      }
      // active cancer + personal history of cancer: either/or when it's the same site
      const [c, z] = /^Z85/.test(a) ? [b, a] : /^Z85/.test(b) ? [a, b] : [];
      if (c && /^C\d/.test(c) && byId.get("conflict:history-vs-active"))
        notes.push(`<b>${esc(c)} + ${esc(z)}</b>: Either/or <i>if they're the same site</i> – a cancer still being treated takes the C-code; Z85 is only for a cancer that's gone and no longer treated. <span class="pill lvl">Same diagnosis list</span> – <a href="${itemHref(byId.get("conflict:history-vs-active"))}">Active cancer or personal history</a>`);
      for (const [x, y] of [[a, b], [b, a]]) {
        const ex = (icdExcl.codes[x] || []).map(k => icdExcl.notes[k]).find(([, refs]) => refs.some(rf => y.startsWith(rf.replace(/-$/, ""))));
        if (ex) notes.push(`<b>${esc(x)} + ${esc(y)}</b>: Excludes1 – can't be coded together (${esc(ex[0])}) <span class="pill lvl">Same diagnosis list</span>`);
      }
    }
    if (!notes.length) notes.push(`No either/or rule on file for ${toks.map(esc).join(" + ")}. That doesn't guarantee they're payable together – check the <a href="https://www.cms.gov/medicare/coding-billing/national-correct-coding-initiative-ncci-edits" target="_blank" rel="noopener">NCCI edits ↗</a>.`);
    return notes;
  }

  function billPill(r, always) {
    if (!r.billing || (r.billing === "Either" && !always)) return "";
    return `<span class="pill bill-${r.billing.toLowerCase()}" title="Where this shows up in billing">${esc(BILLING[r.billing])}</span>`;
  }
  // deep link that scrolls X12's list to this code (text fragment: code, then the first words of its row)
  function x12Url(r) {
    const base = OCA.sources[r.cat]?.url || "https://x12.org/codes";
    const anchor = r.x12?.raw[r.x12.ix.anchor];
    const enc = s => encodeURIComponent(s).replace(/-/g, "%2D").replace(/,/g, "%2C");
    return anchor ? `${base}#:~:text=${enc(r.code)}-,${enc(anchor)}` : `${base}#:~:text=${enc(r.code)}`;
  }
  function verifyBox(r) {
    const x = r.x12, src = OCA.sources[r.cat] || {};
    const d = (label, v) => v ? `<div><span>${label}</span><b>${esc(v)}</b></div>` : "";
    return `<div class="verify">
      <div class="verify-head"><b>Check the official wording</b><span class="muted small">X12 owns the exact text, so it isn't copied here – open it side by side to validate.</span></div>
      <div class="vdates">${d("Code", r.code)}${d("Start", x.start)}${d("Last modified", x.modified)}${d("Stopped", x.stop)}${d("Billing", BILLING[x.billing])}</div>
      <div class="verify-actions"><a class="btn primary small" href="${esc(x12Url(r))}" target="_blank" rel="noopener" data-copy-also="${esc(r.code)}">Verify ${esc(r.code)} on X12 ↗</a></div>
      <p class="muted small">Opens X12's list scrolled to ${esc(r.code)} (Chrome, Edge, Safari and recent Firefox) and copies the code so you can Ctrl+F if your browser doesn't jump. Dates and status checked against the X12 list on ${esc(src.checked || "")}.</p>
    </div>`;
  }

  // topic -> [what to do, related ids] for X12 codes that have no hand-written page
  const TOPIC_HELP = {
    "Diagnosis": ["Diagnosis problems: check the code is valid for the date of service, coded to full specificity, pointed to the right line, and on the payer's covered-diagnosis list for that service. Coding errors → corrected claim; coverage disputes → appeal.", ["carc:11", "carc:167", "carc:146", "rarc:M76", "rarc:MA63", "study:dx-specificity", "response:medical-necessity"]],
    "Authorization / referral": ["Find any auth on file and compare drug/code, units, dates, NPI and site. Mismatch → fix the auth or the claim; no auth → retro-auth request, then appeal.", ["carc:197", "carc:284", "rarc:M62", "response:prior-auth-missing", "study:auth-not-on-claim"]],
    "Modifier": ["Add or correct the modifier only when the record supports it, then send a corrected claim.", ["rarc:N822", "rarc:N823", "carc:4", "study:jz-missing"]],
    "Drug / NDC": ["Check HCPCS units vs the descriptor, the 11-digit NDC and its unit qualifier/quantity, and waste modifiers.", ["rarc:M119", "topic:ndc-billing", "study:ndc-missing", "topic:jw-jz"]],
    "Coordination of benefits": ["Confirm who's primary, update COB with the patient and payers, then bill in the right order with the primary's adjudication.", ["carc:22", "rarc:MA04", "response:cob", "study:cob"]],
    "Patient / member data": ["Match the patient's name, DOB and member ID exactly to the payer's eligibility response, then resubmit.", ["rarc:N329", "rarc:N382", "carc:31", "study:co16-dob"]],
    "Eligibility / coverage dates": ["Re-verify eligibility for the date of service and bill whoever covered that date.", ["carc:26", "carc:27", "response:eligibility-coverage"]],
    "Provider / credentialing": ["Check NPI, taxonomy and enrollment/credentialing for the billing, rendering and ordering providers.", ["carc:185", "carc:183", "rarc:N255", "setting:enrollment", "study:not-credentialed"]],
    "Timely filing": ["Find proof of timely submission (277CA) or a filing-limit exception; otherwise it's a write-off.", ["carc:29", "response:timely-filing", "study:tf-proof"]],
    "Duplicate": ["Check claim status before resubmitting; work the original claim.", ["carc:18", "study:duplicate"]],
    "Medical necessity / benefit": ["Read the payer policy and the plan's benefits. Coding issues → correct; clinical disagreement → appeal with records.", ["carc:50", "carc:96", "carc:204", "response:medical-necessity"]],
    "Records / attachments": ["Send exactly what was requested through the payer's attachment channel and track the deadline.", ["carc:252", "carc:226", "response:records"]],
    "Bundling / NCCI": ["Look up the NCCI edit; use 25/59/X modifiers only when documentation supports a separate service.", ["carc:97", "carc:236", "response:bundling"]],
    "Units / frequency": ["Recalculate units from the code descriptor; check MUEs, auth units and frequency limits.", ["carc:151", "rarc:N362", "response:units"]],
    "Place of service / bill type": ["Make the POS or type of bill match where and how the service was provided.", ["carc:5", "rarc:M77", "study:pos-hopd"]],
    "Procedure code": ["Use a code that's valid on the date of service and matches the revenue code/service.", ["carc:181", "carc:189", "rarc:M51"]],
    "Payment / contractual": ["Usually a posting item, not a denial: post the adjustment and bill any PR amount.", ["term:group-codes", "carc:45", "study:co45"]],
  };

  function viewItem(cat, code) {
    const r = byId.get(`${cat}:${code}`);
    if (!r) { app.innerHTML = `<p class="empty">Not found. <a href="#/">Go home</a></p>`; return; }
    document.title = `${isRealCode(r.code) ? r.code + " – " : ""}${r.title} – Claims Atlas`;
    let main = "";
    const x12Link = `<a href="${esc(r.x12 ? x12Url(r) : OCA.sources[r.cat]?.url || "https://x12.org/codes")}" target="_blank" rel="noopener" data-copy-also="${esc(r.code)}">official X12 wording ↗</a>`;
    if (r.curated && r.x12) {
      const x = r.x12;
      main += `<p class="statusline"><span class="pill ${x.stop ? "retired" : "active"}">${esc(x.status)}</span>${billPill(r, true)} ${x.topics.map(t => `<a class="tag" href="${href("search", { cat: r.cat, "f.Topic": t })}">${esc(t)}</a>`).join(" ")}</p>`;
    } else if (r.billing) {
      main += `<p class="statusline">${billPill(r, true)}</p>`;
    }
    if (r.curated) {
      main += r.summary && r.summary !== r.title ? `<p class="lede">${esc(r.summary)}</p>` : "";
      main += r.body || "";
      if (r.template) main += templateTool(r);
      if (r.x12) main += verifyBox(r);
    } else if (r.cat === "provider") {
      const g = k => r.raw[r.ix[k]];
      main += `<dl class="kv"><dt>Taxonomy code</dt><dd><code>${esc(r.code)}</code> ${copyBtn(r.code)}</dd><dt>Grouping</dt><dd>${esc(g("grouping"))}</dd><dt>Classification</dt><dd>${esc(g("classification"))}</dd>${g("specialization") ? `<dt>Specialization</dt><dd>${esc(g("specialization"))}</dd>` : ""}<dt>Section</dt><dd>${esc(g("section"))}</dd></dl>`;
      main += r.text ? `<h4>NUCC definition</h4><p>${esc(r.text)}</p>` : "";
      const siblings = R.filter(x => x.cat === "provider" && x !== r && x.raw[x.ix.classification] === g("classification"));
      if (siblings.length) main += `<h4>Same classification (${siblings.length})</h4><div class="rel">${siblings.slice(0, 40).map(x => `<a class="rel-item" href="${itemHref(x)}"><code>${esc(x.code)}</code> ${esc(x.title)}</a>`).join("")}</div>`;
      main += npiFinder(r);
    } else if (r.cat === "icd10") {
      const g = k => r.raw[r.ix[k]];
      main += `<dl class="kv"><dt>Code</dt><dd><code>${esc(r.code)}</code> ${copyBtn(r.code)}</dd><dt>Billable</dt><dd>${g("billable") ? "Yes – valid for claims" : "No – category header; pick a more specific code below"}</dd><dt>Block</dt><dd>${esc(g("block"))}</dd><dt>Valid</dt><dd>FY2027: Oct 1, 2026 – Sep 30, 2027</dd></dl>`;
      const nc = r.codeNorm;
      const parents = R.filter(x => x.cat === "icd10" && x !== r && nc.startsWith(x.codeNorm)).sort((a, b) => a.codeNorm.length - b.codeNorm.length);
      const kids = R.filter(x => x.cat === "icd10" && x !== r && x.codeNorm.startsWith(nc));
      if (parents.length) main += `<h4>Parent categories</h4><div class="rel">${parents.map(x => `<a class="rel-item" href="${itemHref(x)}"><code>${esc(x.code)}</code> ${esc(x.title)}</a>`).join("")}</div>`;
      if (kids.length) main += `<h4>More specific codes (${kids.length})</h4><div class="rel">${kids.slice(0, 80).map(x => `<a class="rel-item" href="${itemHref(x)}"><code>${esc(x.code)}</code> ${esc(x.title)}</a>`).join("")}${kids.length > 80 ? `<a class="rel-item" href="${href("search", { cat: "icd10", q: r.code })}">See all ${kids.length}…</a>` : ""}</div>`;
      main += `<p class="muted small">Neoplasm coding follows the ICD-10-CM Official Guidelines (Section I.C.2): code the primary site, secondary (metastatic) sites, and Z51.- encounter codes for chemotherapy/radiation encounters as applicable. Check payer covered-diagnosis lists for drugs.</p>`;
    } else if (r.cat === "hcpcs") {
      const g = k => r.raw[r.ix[k]];
      const added = g("added");
      main += `<dl class="kv"><dt>HCPCS code</dt><dd><code>${esc(r.code)}</code> ${copyBtn(r.code)}</dd><dt>Series</dt><dd>${esc(g("series"))}</dd><dt>Medicare coverage code</dt><dd>${esc(g("medicare") || "Not specified")}</dd>${added ? `<dt>Added to HCPCS</dt><dd>${esc(added.slice(0, 4))}-${esc(added.slice(4, 6))}-${esc(added.slice(6, 8))}</dd>` : ""}</dl>`;
      main += `<p>${esc(r.title)}</p>`;
      if (/^J|^Q|^C9|^A9/.test(r.code)) main += `<p class="muted small">Billing units = dose given ÷ the amount in the descriptor. Medicare payment limits per unit are in the quarterly <a href="https://www.cms.gov/medicare/payment/part-b-drugs/asp-pricing-files" target="_blank" rel="noopener">ASP pricing files</a>; single-dose containers need JW or JZ.</p>`;
      main += `<p><a href="https://www.cms.gov/medicare-coverage-database/search-results.aspx?keyword=${encodeURIComponent(r.code)}&areaId=all&docType=NCA,CAL,NCD,MEDCAC,TA,MCD,6,3,5,1,F,P" target="_blank" rel="noopener">Search Medicare coverage policies (NCD/LCD/articles) for ${esc(r.code)} ↗</a></p>`;
    } else if (r.x12) {
      const x = r.x12;
      const kind = r.cat === "carc" ? "Claim Adjustment Reason Code (CARC)" : "Remittance Advice Remark Code (RARC)";
      const replRec = x.repl && (byId.get(`carc:${x.repl}`) || byId.get(`rarc:${x.repl}`));
      main += `<dl class="kv"><dt>Code</dt><dd><code>${esc(r.code)}</code> ${copyBtn(r.code)}</dd><dt>Type</dt><dd>${kind}${x.alert ? " – informational alert" : ""}</dd>
        <dt>Status</dt><dd><span class="pill ${x.stop ? "retired" : "active"}">${x.stop ? "Retired" : "Active"}</span> since ${esc(x.stop || x.start)}${x.repl ? ` · replacement: ${replRec ? `<a href="${itemHref(replRec)}">${esc(x.repl)}</a>` : esc(x.repl)}` : ""}</dd>
        <dt>Topic</dt><dd>${x.topics.map(t => `<a class="tag" href="${href("search", { cat: r.cat, "f.Topic": t })}">${esc(t)}</a>`).join(" ")}</dd>
        ${x.element ? `<dt>Data element</dt><dd>${esc(x.element)}</dd>` : ""}</dl>`;
      if (x.element) main += `<p>The payer says the <b>${esc(x.element.toLowerCase())}</b> on the claim is missing, incomplete or invalid. ${r.cat === "rarc" ? "This remark usually rides with CARC 16 (claim lacks information) under group code CO – the provider fixes the data and resubmits; the patient can't be billed for it." : ""}</p>`;
      else main += `<p>This site doesn't have a hand-written explanation for ${esc(r.code)} yet. Read the ${x12Link} – search the page for <code>${esc(r.code)}</code> – then use the topic guide below.</p>`;
      const help = TOPIC_HELP[x.topics[0]];
      if (help) main += `<h4>Topic guide: ${esc(x.topics[0])}</h4><p>${help[0]}</p><div class="rel">${help[1].map(id => byId.get(id)).filter(Boolean).map(h => `<a class="rel-item" href="${itemHref(h)}">${badge(h.cat)}${codeTag(h)}<span>${esc(h.title)}</span></a>`).join("")}</div>`;
      if (x.stop) main += `<p class="warn">Retired codes can still show up on old remits or from payers that haven't updated. On new claims the payer should be using the replacement.</p>`;
      main += verifyBox(r);
    } else {
      main += `<dl class="kv"><dt>Code</dt><dd><code>${esc(r.code)}</code> ${copyBtn(r.code)}</dd></dl><p>${esc(r.text || r.title)}</p>`;
    }
    app.innerHTML = `
      <nav class="crumbs"><a href="${lastSearchHash}">← Back to results</a> · <a href="${href("search", { cat: r.cat })}">${esc(CATS[r.cat].label)}</a></nav>
      <article class="item">
        <header class="item-head">${badge(r.cat)}<h1>${codeTag(r, "code big")}${esc(r.title)}</h1>
          ${r.tags?.length ? `<div class="tags">${r.tags.filter(Boolean).map(t => `<a class="tag" href="${href("search", { q: t })}">${esc(t)}</a>`).join("")}</div>` : ""}
        </header>
        <div class="item-grid">
          <div class="item-main">${main}${conflictPanel(r)}</div>
          <aside class="item-side">${srcList(r)}${relList(r)}
            <div class="panel"><h3>Share</h3><button class="btn small" data-copy="${esc(location.href)}">Copy link</button></div>
          </aside>
        </div>
      </article>`;
    if (r.template) wireTemplate(r);
    window.scrollTo(0, 0);
  }

  function copyBtn(text) { return `<button class="btn ghost small" data-copy="${esc(text)}" title="Copy">Copy</button>`; }

  // ---------- template filler ----------
  // older versions saved template drafts in the browser – remove them
  try { Object.keys(localStorage).filter(k => k.startsWith("oca-tpl-")).forEach(k => localStorage.removeItem(k)); } catch { /* storage unavailable */ }
  function fieldsOf(t) { return [...new Set([...t.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1]))]; }
  // Allow-list: only fields about the practice, payer, physician, drug/code, policy and published
  // evidence get an input box. Everything else - the patient, their claim and their case, including the
  // clinical argument - stays a [blank] to write by hand outside the site, so there is nowhere to type it.
  const SAFE_FIELDS = [
    /^practice |^practice or facility name$|^facility name$|^servicing facility name$|^billing contact name$|^date$|^date and time$|^due date$|^owner$/i,
    /^payer (name|department|address|phone|preferred site)|^member services phone$|^rep name$|^mac name$|^mac appeals address/i,
    /^physician (name|npi|direct phone)|^specialty$|^contact for questions|^(billing|facility) npi$|^tax id$|^pos code$|^npi$|^out-of-network provider/i,
    /^drug( name| \/ regimen| \/ procedure| \/ service and codes| \/ regimen or service)?$|^requested drug$|^preferred drug|^hcpcs|^code\(s\)$|^codes and description|^service \/ trial/i,
    /^policy name|guideline|^nccn|^e\.g\. nccn|^compendium name$|^listing \/ recommendation|^fda|^key trial|^citations$|^phase iii|^adoption at|^ncd \/ lcd|^quote the plan|^trial title$|^nct number$|^phase$|^sponsor$/i,
    /^standard \/ expedited$|^urgency \(|^pre-service \(|^filing limit|^state insurance department|^state step therapy|^site of care \(|^enclosures|^other enclosures$/i,
    /^for medicare: |^for state-regulated|^commercial non-grandfathered|^medicare: ncd|^medicaid: social security|^if expedited|^if applicable|^provided by the sponsor/i,
  ];
  const PATIENT_ID = { test: f => !SAFE_FIELDS.some(rx => rx.test(f.trim())) };
  // typed text that looks like patient identifiers is refused even in an allowed field
  const LOOKS_PERSONAL = [
    [/\b\d{3}-\d{2}-\d{4}\b/, "a Social Security number"],
    [/\b[1-9][AC-HJKMNP-RT-Y][AC-HJKMNP-RT-Y0-9]\d[AC-HJKMNP-RT-Y][AC-HJKMNP-RT-Y0-9]\d[AC-HJKMNP-RT-Y]{2}\d{2}\b/i, "a Medicare number (MBI)"],
    [/\b(0?[1-9]|1[0-2])[\/-](0?[1-9]|[12]\d|3[01])[\/-](19|20)?\d\d\b/, "a date (dates of birth and service aren't allowed)"],
  ];
  const DATE_FIELDS = /^(date|date and time|due date)$/i;
  function templateTool(r) {
    const fields = fieldsOf(r.template);
    return `
      <div class="tpl" id="tpl" data-tab="fill">
        <div class="tpl-tabs" role="tablist"><button type="button" role="tab" data-tab="fill">Fill in <span id="tplCount"></span></button><button type="button" role="tab" data-tab="preview">Preview letter</button></div>
        <div class="tpl-head"><h3>Fill in the template</h3>
          <div class="tpl-actions"><button class="btn primary small" id="tplCopy">Copy letter</button><button class="btn small" id="tplDownload">Download .txt</button><button class="btn small" id="tplPrint">Print</button><button class="btn ghost small" id="tplClear">Clear fields</button></div></div>
        <div class="tpl-legend">
          <span><mark class="filled">highlighted</mark> = fill in here: practice, payer, physician, drug and codes, policy and published evidence</span>
          <span><mark class="locked">[dashed]</mark> = anything about the patient or their case – write it by hand after you print or paste. This site has nowhere to type patient information.</span>
        </div>
        <p class="tpl-warn" id="tplWarn" role="alert" hidden></p>
        <div class="tpl-grid">
          <form class="tpl-form" id="tplForm">${fields.map((f, i) => {
            if (PATIENT_ID.test(f)) return "";
            // judge the field by its name, not the example text in brackets after it
            const name = f.replace(/\s*\(.*\)\s*$/, "");
            const long = name.length > 48 || /enclosures|citation|guideline|trial|quote|^for |^if |^commercial|^medica/i.test(name);
            return `<label><span>${esc(f)}</span>${long ? `<textarea data-f="${i}" rows="2" autocomplete="off"></textarea>` : `<input data-f="${i}" type="text" autocomplete="off">`}</label>`;
          }).join("")}</form>
          <pre class="tpl-preview" id="tplPreview" aria-live="polite"></pre>
        </div>
        <p class="muted small">Nothing you type is saved or sent anywhere – it disappears when you leave the page. Copy, download or print before you go.</p>
      </div>`;
  }
  function wireTemplate(r) {
    const fields = fieldsOf(r.template);
    const inputs = [...document.querySelectorAll("#tplForm [data-f]")];
    // refuse anything that looks like a patient identifier
    $("#tplForm").addEventListener("input", e => {
      const el = e.target, field = fields[+el.dataset.f] || "";
      const hit = LOOKS_PERSONAL.find(([rx], k) => !(k === 2 && DATE_FIELDS.test(field)) && rx.test(el.value));
      const warn = $("#tplWarn");
      if (hit) {
        el.value = el.value.replace(hit[0], "");
        warn.textContent = `Removed what looked like ${hit[1]}. Patient information can't be entered here – add it by hand after printing.`;
        warn.hidden = false;
      } else warn.hidden = true;
    }, true);
    const render = () => {
      const vals = {};
      inputs.forEach(el => { vals[fields[+el.dataset.f]] = el.value; });
      $("#tplCount").textContent = `${inputs.filter(el => el.value.trim()).length}/${inputs.length}`;
      const pre = $("#tplPreview");
      pre.innerHTML = esc(r.template).replace(/\{\{([^}]+)\}\}/g, (_, f) => {
        const name = f.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        if (PATIENT_ID.test(name)) return `<mark class="locked" title="Fill in by hand">[${f}]</mark>`;
        const v = vals[name];
        return v ? `<mark class="filled">${esc(v)}</mark>` : `<mark class="blank">[${f}]</mark>`;
      });
      return r.template.replace(/\{\{([^}]+)\}\}/g, (_, f) => vals[f] || `[${f}]`);
    };
    let text = render();
    $("#tplForm").oninput = () => { text = render(); };
    document.querySelectorAll(".tpl-tabs [data-tab]").forEach(b => b.onclick = () => { $("#tpl").dataset.tab = b.dataset.tab; $("#tpl").scrollIntoView({ block: "start", behavior: "smooth" }); });
    $("#tplCopy").onclick = () => copyText(render(), $("#tplCopy"));
    $("#tplDownload").onclick = () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([render()], { type: "text/plain" }));
      a.download = r.code + ".txt"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    $("#tplPrint").onclick = () => {
      const w = window.open("", "_blank");
      if (!w) return;
      w.document.write(`<!doctype html><title>${esc(r.title)}</title><pre style="white-space:pre-wrap;font:12pt/1.45 Georgia,serif;margin:1in">${esc(render())}</pre>`);
      w.document.close(); w.focus(); w.print();
    };
    $("#tplClear").onclick = () => { inputs.forEach(el => { el.value = ""; }); text = render(); };
    void text;
  }

  // ---------- NPI lookup (public NPPES registry; opens in a new tab) ----------
  const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA PR RI SC SD TN TX UT VT VA VI WA WV WI WY GU AS MP".split(" ");
  function npiFinder(r) {
    const desc = r ? (r.raw[r.ix.specialization] || r.raw[r.ix.classification]) : "";
    return `
      <div class="panel npi">
        <h3>${r ? "Find real providers with this taxonomy" : "Search the public NPI Registry"}</h3>
        <form class="npi-form" id="npiForm">
          <label><span>Taxonomy / specialty</span><input name="taxonomy_description" value="${esc(desc)}" placeholder="e.g. Medical Oncology"></label>
          <label><span>State</span><select name="state"><option value="">Any</option>${STATES.map(s => `<option>${s}</option>`).join("")}</select></label>
          <label><span>City</span><input name="city" placeholder="optional"></label>
          <label><span>Postal code</span><input name="postal_code" placeholder="optional (5 digits)"></label>
          <label><span>Organization name</span><input name="organization_name" placeholder="optional"></label>
          <label><span>Last name</span><input name="last_name" placeholder="optional"></label>
          <label><span>Type</span><select name="enumeration_type"><option value="">Both</option><option value="NPI-1">Individuals (NPI-1)</option><option value="NPI-2">Organizations (NPI-2)</option></select></label>
          <div class="npi-actions"><button class="btn primary small">Open results (JSON) ↗</button><a class="btn small" href="https://npiregistry.cms.hhs.gov/search" target="_blank" rel="noopener">NPI Registry website ↗</a></div>
        </form>
        <p class="muted small">Opens CMS's public NPPES API in a new tab (up to 200 results; your browser shows the JSON). The registry is public data published by CMS. NPPES doesn't allow other websites to read it directly, so results open on CMS's site.</p>
      </div>`;
  }
  function wireNpi() {
    const f = $("#npiForm");
    if (!f) return;
    f.onsubmit = e => {
      e.preventDefault();
      const p = new URLSearchParams({ version: "2.1", limit: "200" });
      for (const [k, v] of new FormData(f)) if (String(v).trim()) p.set(k, String(v).trim());
      if ([...p.keys()].length <= 2) { alert("Add at least one search field."); return; }
      if (!p.has("state") && !p.has("city") && !p.has("postal_code") && !p.has("last_name") && !p.has("organization_name")) {
        if (!confirm("Taxonomy-only searches are very broad. Search anyway?")) return;
      }
      window.open("https://npiregistry.cms.hhs.gov/api/?" + p.toString(), "_blank", "noopener");
    };
  }

  // ---------- study mode (multiple-choice quiz over the "study" scenarios) ----------
  const studyState = { order: null, idx: 0, revealed: false, topic: "", unknownOnly: false, picks: {}, score: { right: 0, total: 0, streak: 0 } };
  const QUESTIONS = [["owes", "Who owes this amount?"], ["bill", "Can you bill the patient?"], ["route", "What's the right move?"]];
  const loadKnown = () => { try { return new Set(JSON.parse(localStorage.getItem("oca-study-known") || "[]")); } catch { return new Set(); } };
  const saveKnown = s => { try { localStorage.setItem("oca-study-known", JSON.stringify([...s])); } catch { /* storage unavailable */ } };
  function viewStudy(q) {
    document.title = "Study – Claims Atlas";
    const cards = R.filter(r => r.cat === "study");
    const topics = [...new Set(cards.map(c => c.study.topic))];
    const topic = q.topic || "";
    if (studyState.topic !== topic || !studyState.order) {
      studyState.topic = topic; studyState.idx = 0; studyState.revealed = false;
      studyState.order = cards.filter(c => !topic || c.study.topic === topic).map(c => c.id);
    }
    const known = loadKnown();
    let deck = studyState.order.map(id => byId.get(id));
    if (studyState.unknownOnly) deck = deck.filter(c => !known.has(c.id));
    const nKnown = studyState.order.filter(id => known.has(id)).length;
    if (studyState.idx >= deck.length) studyState.idx = 0;
    const c = deck[studyState.idx];
    const s = c?.study;
    const topicHref = t => href("study", t ? { topic: t } : {});
    const CH = OCA.studyChoices;
    const picks = studyState.picks;
    const answered = QUESTIONS.filter(([k]) => picks[k]).length;
    const done = studyState.revealed || answered === QUESTIONS.length;
    const explain = { owes: s?.owes, bill: s?.billPatient, route: s?.route };
    const sc = studyState.score;
    const qHtml = !c ? "" : QUESTIONS.map(([k, label], qi) => {
      const pick = picks[k], right = s.key[k], show = !!pick || studyState.revealed;
      return `<fieldset class="mcq ${show ? (pick === right ? "ok" : pick ? "bad" : "shown") : ""}">
        <legend><span class="qn">${qi + 1}</span>${label}</legend>
        <div class="opts">${Object.entries(CH[k]).map(([v, text]) => {
          const cls = !show ? "" : v === right ? "right" : v === pick ? "wrong" : "dim";
          return `<button type="button" class="opt ${cls}" data-q="${k}" data-v="${v}" ${show ? "disabled" : ""}>${esc(text)}</button>`;
        }).join("")}</div>
        ${show ? `<p class="why">${pick === right ? "✓ Correct – " : pick ? "✗ Answer: " : "Answer: "}${esc(explain[k])}</p>` : ""}
      </fieldset>`;
    }).join("");
    app.innerHTML = `
      <section class="page study">
        <div class="study-top">
          <div><h1>Study mode</h1><p class="lede">Read the remit line and scenario, then answer three questions. Get all three right and the card is marked known.</p></div>
          <div class="study-progress">
            <div class="sp-row"><span><b>${nKnown}</b>/${studyState.order.length} known</span><span>Score <b>${sc.right}</b>/${sc.total}${sc.streak > 1 ? ` · 🔥 ${sc.streak}` : ""}</span></div>
            <div class="bar"><i style="width:${studyState.order.length ? Math.round(100 * nKnown / studyState.order.length) : 0}%"></i></div></div>
        </div>
        <div class="chips scroll-x"><a class="chip ${!topic ? "on" : ""}" href="${topicHref("")}">All topics</a>${topics.map(t => `<a class="chip ${topic === t ? "on" : ""}" href="${topicHref(t)}">${esc(t)}</a>`).join("")}</div>
        <div class="study-tools">
          <button class="btn small" id="stShuffle">Shuffle</button>
          <label class="toggle inline"><input type="checkbox" id="stUnknown" ${studyState.unknownOnly ? "checked" : ""}> Unknown cards only</label>
          <button class="btn ghost small" id="stReset">Reset</button>
          <a class="btn ghost small" href="${href("search", { cat: "study" })}">List view</a>
        </div>
        ${!c ? `<p class="empty">Nothing left in this deck – nice work. Untick “Unknown cards only” or reset.</p>` : `
        <article class="flash">
          <div class="flash-meta"><span class="badge b-study">${esc(s.topic)}</span><span class="muted small">${studyState.idx + 1} / ${deck.length}${known.has(c.id) ? " · known ✓" : ""}</span></div>
          <div class="remit">${esc(s.remit)}</div>
          <h2>${esc(c.title)}</h2>
          <p class="scenario">${esc(s.scenario)}</p>
          ${qHtml}
          ${done ? `<div class="answer">
            <h4>Next steps</h4><ol class="steps">${s.steps.map(x => `<li>${x}</li>`).join("")}</ol>
            <h4>Why</h4><p>${s.why}</p>${s.payer ? `<h4>Payer notes</h4><p>${s.payer}</p>` : ""}
            <p><a href="${itemHref(c)}">Open the full card and related codes →</a></p></div>` : ""}
        </article>
        <div class="study-bar">
          ${done ? `<button class="btn primary" id="stNext">Next card →</button>` : `<button class="btn" id="stReveal">Show answers</button><button class="btn ghost" id="stSkip">Skip →</button>`}
        </div>`}
      </section>`;
    const next = () => { studyState.idx = (studyState.idx + 1) % Math.max(1, deck.length); studyState.revealed = false; studyState.picks = {}; viewStudy(q); window.scrollTo(0, 0); };
    const resetCard = () => { studyState.revealed = false; studyState.picks = {}; };
    $("#stShuffle").onclick = () => { studyState.order.sort(() => Math.random() - .5); studyState.idx = 0; resetCard(); viewStudy(q); };
    $("#stUnknown").onchange = e => { studyState.unknownOnly = e.target.checked; studyState.idx = 0; resetCard(); viewStudy(q); };
    $("#stReset").onclick = () => { saveKnown(new Set()); studyState.score = { right: 0, total: 0, streak: 0 }; resetCard(); viewStudy(q); };
    if (!c) return;
    app.querySelectorAll(".opt:not([disabled])").forEach(b => b.onclick = () => {
      picks[b.dataset.q] = b.dataset.v;
      const ok = b.dataset.v === s.key[b.dataset.q];
      sc.total++; if (ok) { sc.right++; sc.streak++; } else sc.streak = 0;
      if (QUESTIONS.every(([k]) => picks[k])) {
        const all = QUESTIONS.every(([k]) => picks[k] === s.key[k]);
        if (all) known.add(c.id); else known.delete(c.id);
        saveKnown(known);
      }
      const y = window.scrollY; viewStudy(q); window.scrollTo(0, y);
    });
    if (done) $("#stNext").onclick = () => { if (studyState.unknownOnly && known.has(c.id)) { resetCard(); viewStudy(q); window.scrollTo(0, 0); } else next(); };
    else { $("#stReveal").onclick = () => { studyState.revealed = true; const y = window.scrollY; viewStudy(q); window.scrollTo(0, y); }; $("#stSkip").onclick = next; }
  }
  document.addEventListener("keydown", e => {
    if (!location.hash.startsWith("#/study") || /input|textarea|select/i.test(document.activeElement.tagName)) return;
    if (e.key === "ArrowRight" || (e.key === "Enter" && $("#stNext"))) { e.preventDefault(); ($("#stNext") || $("#stSkip"))?.click(); }
  });

  function viewLookup() {
    document.title = "Provider lookup – Claims Atlas";
    const links = [
      ["NPPES NPI Registry", "https://npiregistry.cms.hhs.gov/", "Every individual and organization NPI in the US, with taxonomy, addresses and enumeration dates."],
      ["NPPES downloadable file", "https://download.cms.gov/nppes/NPI_Files.html", "The full monthly NPI dissemination file (several GB) for bulk analysis."],
      ["Medicare Care Compare – Doctors & clinicians", "https://www.medicare.gov/care-compare/", "Medicare-enrolled clinicians and facilities, quality ratings."],
      ["CMS Provider Data Catalog", "https://data.cms.gov/provider-data/", "Downloadable public datasets on clinicians, hospitals, dialysis, hospice, home health."],
      ["Medicare Physician & Other Practitioners (utilization)", "https://data.cms.gov/provider-summary-by-type-of-service/medicare-physician-other-practitioners", "Public Part B services and payments by provider and HCPCS code."],
      ["NCI-Designated Cancer Centers", "https://www.cancer.gov/research/infrastructure/cancer-centers/find", "The NCI's list of designated cancer centers."],
      ["CoC-accredited cancer programs (ACS)", "https://www.facs.org/hospital-and-facilities/", "Commission on Cancer accredited programs."],
      ["HRSA 340B OPAIS", "https://340bopais.hrsa.gov/", "Public 340B covered entity database."],
      ["Medicare Coverage Database", "https://www.cms.gov/medicare-coverage-database/search.aspx", "NCDs, LCDs and billing articles."],
      ["ClinicalTrials.gov", "https://clinicaltrials.gov/", "Trial registry – NCT numbers for claims."],
    ];
    app.innerHTML = `
      <section class="page">
        <h1>Provider lookup</h1>
        <p class="lede">Provider <em>types</em> (all 883 NUCC taxonomy codes) are searchable in this site. Individual providers – over 8 million NPIs – live in CMS's public registry; use the form below to query it.</p>
        ${npiFinder(null)}
        <div class="panel"><h3>Oncology taxonomies to start with</h3><div class="rel">${["207RX0202X", "207RH0003X", "2085R0001X", "207VX0201X", "2086X0206X", "2080P0207X", "261QX0200X", "261QX0203X", "1835X0200X", "163WX0200X", "364SX0200X", "282N00000X"].map(c => byId.get("provider:" + c)).filter(Boolean).map(x => `<a class="rel-item" href="${itemHref(x)}"><code>${esc(x.code)}</code> ${esc(x.title)}</a>`).join("")}</div></div>
        <div class="panel"><h3>Other public provider data</h3><ul class="links big">${links.map(([n, u, d]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(n)} ↗</a><span>${esc(d)}</span></li>`).join("")}</ul></div>
      </section>`;
    wireNpi();
  }

  function viewAbout() {
    document.title = "About & sources – Claims Atlas";
    const gen = ["provider", "icd10", "hcpcs", "modifier", "pos"].map(c => OCA.sources[c] && `<li><b>${esc(CATS[c].label)}</b> (${nf.format(counts[c])}): <a href="${esc(OCA.sources[c].url)}" target="_blank" rel="noopener">${esc(OCA.sources[c].name)}</a></li>`).join("");
    app.innerHTML = `
      <section class="page prose">
        <h1>About this atlas</h1>
        <p>A searchable reference for people learning US health insurance claims, with an oncology focus: who bills (provider types and care settings), what they bill on (claim forms and transactions), what they bill (diagnosis, HCPCS and modifier codes), what comes back (denial reason and remark codes) and what to do next (playbooks, appeal pathways and templates).</p>
        <h2>Only public information</h2>
        <p>Everything here is either a public-domain US government code set, a freely licensed code set, or our own plain-language explanation that links to the official source.</p>
        <ul>${gen}<li><b>ICD-10-CM Excludes1 notes</b> (FY2027 tabular, public domain) – shown on every oncology diagnosis page.</li></ul>
        <p><b>Hand-written content</b>: claim types, care settings, payers, bill types, revenue codes, denial explanations, playbooks, appeal pathways, topics, glossary and templates – summarised from public CMS, HHS, DOL and statutory sources linked on each page.</p>
        <h2>What is deliberately not copied</h2>
        <ul>
          <li><b>CPT®</b> code descriptors (© American Medical Association) – code ranges are named, descriptors are not reproduced.</li>
          <li><b>CDT</b> dental codes (© American Dental Association) – D-codes are excluded from the HCPCS list.</li>
          <li><b>CARC/RARC</b> official text (© X12) – every code is indexed with its status and dates, plus a three-word locator so "Verify on X12" can open X12's own list at that code; explanations are our paraphrases.</li>
          <li><b>NCCI</b> pair files (CMS distributes them under an AMA CPT license) – the either/or rules here are written from CPT conventions and NCCI policy; check NCCI for any other pair.</li>
          <li><b>NUBC</b> UB-04 code values (type of bill, revenue, condition codes) – paraphrased from CMS manuals and linked.</li>
          <li><b>NCCN</b> guidelines and commercial compendia – cited by name only.</li>
          <li>No patient data. Templates never ask for patient identifiers, claim numbers, dates or clinical details, and nothing typed into a template is saved or sent anywhere.</li>
        </ul>
        <h2>Versions</h2>
        <p>NUCC taxonomy v26.1 · ICD-10-CM FY2027 (Oct 1 2026 – Sep 30 2027) · HCPCS Level II October 2026 · CMS Place of Service code set. Rebuild with <code>tools/fetch_sources.sh</code> and <code>tools/build_data.py</code>.</p>
        <h2>Disclaimer</h2>
        <p>Educational use only. Not legal, coding, billing or medical advice. Payer policies, deadlines and code sets change frequently; always confirm with the payer's current policy, the patient's plan documents and the official code set.</p>
      </section>`;
  }

  // ---------- clipboard ----------
  function copyText(text, btn) {
    const done = () => { if (btn) { const o = btn.textContent; btn.textContent = "Copied"; setTimeout(() => { btn.textContent = o; }, 1200); } };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, () => fallback());
    else fallback();
    function fallback() { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch { /* ignore */ } ta.remove(); }
  }
  document.addEventListener("click", e => { const b = e.target.closest("[data-copy]"); if (b) { e.preventDefault(); copyText(b.dataset.copy, b); } });
  // links that also copy a code (e.g. Verify on X12) – copy quietly, let the link open
  document.addEventListener("click", e => { const a = e.target.closest("[data-copy-also]"); if (a) try { navigator.clipboard?.writeText(a.dataset.copyAlso); } catch { /* clipboard unavailable */ } });

  // ---------- router ----------
  function route() {
    const { parts, q } = parseHash();
    document.querySelectorAll(".topnav a, .bottomnav a").forEach(a => { const n = a.dataset.nav, special = q.cat === "template" ? "templates" : q.cat === "response" ? "denials" : null; a.classList.toggle("on", special ? n === special : n === (parts[0] || "home")); });
    if (!parts.length) return viewHome();
    if (parts[0] === "search") return viewSearch(q);
    if (parts[0] === "item") return viewItem(parts[1], parts.slice(2).join("/"));
    if (parts[0] === "lookup") return viewLookup();
    if (parts[0] === "study") return viewStudy(q);
    if (parts[0] === "about") return viewAbout();
    viewHome();
  }
  window.addEventListener("hashchange", route);
  const themeBtn = $("#themeBtn");
  const syncTheme = () => {
    const light = document.documentElement.dataset.theme === "light";
    themeBtn.textContent = light ? "☾" : "☀";
    themeBtn.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
    document.querySelector('meta[name="theme-color"]').content = light ? "#f6f5fa" : "#0b0a10";
  };
  themeBtn.onclick = () => {
    const light = document.documentElement.dataset.theme !== "light";
    if (light) document.documentElement.dataset.theme = "light"; else delete document.documentElement.dataset.theme;
    try { localStorage.setItem("oca-theme", light ? "light" : "dark"); } catch { /* storage unavailable */ }
    syncTheme();
  };
  syncTheme();
  $("#headerSearch").onsubmit = e => { e.preventDefault(); const v = $("#headerQ").value.trim(); $("#headerQ").value = ""; location.hash = href("search", v ? { q: v } : {}); };
  document.addEventListener("keydown", e => {
    if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); ($("#q") || $("#homeQ") || $("#headerQ")).focus(); }
  });
  route();
})();
