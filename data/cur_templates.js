// Original letter/script templates. {{Field name}} placeholders are shown as [bracketed blanks] - read-only, no inputs.
// Educational starting points only - adapt to the payer's instructions and the patient's record.

const HEAD = `{{Practice or facility name}}
{{Practice address}}
Phone: {{Practice phone}} | Fax: {{Practice fax}}

{{Date}}

{{Payer name}}
Attn: {{Payer department (Appeals / Utilization Management)}}
{{Payer address or fax}}
`;
const PT = `Patient: {{Patient name}}
Date of birth: {{Patient DOB}}
Member ID: {{Member ID}}
Group / plan: {{Group or plan number}}`;
const SIG = `Sincerely,

{{Physician name, credentials}}
{{Specialty}} | NPI {{Physician NPI}}
{{Contact for questions (name, phone, email)}}`;

function tpl(code, title, summary, tags, text, notes, rel = []) {
  return { code, title, summary, tags: ["template"].concat(tags), template: text.trim(),
    body: notes ? `<h4>How to use it</h4><p>${notes}</p>` : "", src: [], rel };
}

OCA.add("template", [
  tpl("lmn", "Letter of medical necessity – anticancer drug or regimen", "Core letter for prior auth requests and medical-necessity appeals.", ["medical necessity", "drug", "prior auth"],
`${HEAD}
RE: Letter of medical necessity
${PT}
Requested treatment: {{Drug / regimen}} ({{HCPCS code(s)}}), {{Dose and schedule}}, {{Number of cycles or duration}}
Diagnosis: {{Diagnosis in words}} ({{ICD-10-CM code(s)}})
Site of care: {{Site of care (office / hospital outpatient / home)}}
Authorization / claim reference: {{Reference number}}

I am writing on behalf of my patient, {{Patient name}}, to document the medical necessity of {{Drug / regimen}}.

Clinical summary
{{Patient name}} was diagnosed with {{Diagnosis in words}}, stage {{Stage}}, on {{Date of diagnosis}}. Pathology showed {{Histology}}. Biomarker / molecular results: {{Biomarker results (e.g. HER2, PD-L1, EGFR, MSI) with test name and date}}. Current performance status: ECOG {{ECOG score}}.

Treatment history
{{Prior therapies with dates, best response and reason stopped}}

Why this treatment
{{Clinical rationale: why this agent, why now, why alternatives are inappropriate}}

Supporting evidence
- FDA labeling: {{FDA-approved indication, or 'off-label' with explanation}}
- Guideline / compendia support: {{e.g. NCCN Guidelines for ___, category ___; compendium listing}}
- Published evidence: {{Key trial(s) / citation(s)}}

Your policy {{Policy name / number}} lists the following criteria; each is met as documented in the enclosed records:
{{Criterion 1 – where documented}}
{{Criterion 2 – where documented}}

Delaying or denying this treatment would {{Expected harm from delay}}. I request approval of {{Drug / regimen}} as prescribed. Enclosed: {{Enclosures (pathology, biomarker report, notes, imaging)}}.

${SIG}`,
  "Fill the criteria lines from the payer's own policy text. Attach the pathology and biomarker reports – most oncology denials turn on missing biomarker documentation.",
  ["carc:50", "response:medical-necessity", "template:appeal-internal"]),

  tpl("prior-auth-request", "Prior authorization request cover letter", "Cover page for a portal, fax or 278 authorization request.", ["prior auth"],
`${HEAD}
RE: Prior authorization request – {{Urgency (standard / expedited)}}
${PT}
Ordering physician: {{Physician name, credentials}}, NPI {{Physician NPI}}, TIN {{Tax ID}}
Servicing provider / site: {{Servicing facility name}}, NPI {{Facility NPI}}, place of service {{POS code}}

Service(s) requested:
{{HCPCS/CPT code}} – {{Description}} – {{Units per administration}} units – {{Frequency}} – from {{Start date}} to {{End date}}
Diagnosis: {{ICD-10-CM code(s)}}
Planned start date: {{Planned start date}}

{{If expedited: 'The standard timeframe could seriously jeopardize the patient's life, health or ability to regain maximum function because ___.'}}

Enclosed: letter of medical necessity, recent progress note, pathology, biomarker results, treatment plan, and {{Other enclosures}}.

Please send the determination to fax {{Practice fax}} and call {{Contact for questions (name, phone, email)}} if additional information is needed.

${SIG}`,
  "Request one authorization per drug/code with the exact site, NPI and date range you will bill – mismatches cause CARC 284 later.",
  ["claim:278", "carc:197", "carc:284"]),

  tpl("retro-auth", "Retroactive authorization request", "When treatment was given without an auth on file.", ["prior auth", "retro"],
`${HEAD}
RE: Request for retroactive authorization
${PT}
Date(s) of service: {{Date(s) of service}}
Service(s): {{HCPCS/CPT code(s) and description}}
Claim number (if denied): {{Claim number}}

We request retroactive authorization for the services above. Authorization was not obtained before the date of service because {{Reason (urgent start, inpatient discharge, eligibility not available, payer system error, coverage change)}}.

The services met your clinical criteria on the date of service, as shown in the enclosed records: {{Brief statement of criteria met}}. Treatment could not safely be delayed because {{Clinical urgency}}.

{{Reference to the plan's retro-authorization or continuity-of-care provision, if known}}

Please authorize the services for the dates above and reprocess claim {{Claim number}}.

${SIG}`,
  "Check the plan's provider manual first: many plans allow retro requests only within a short window after the date of service.",
  ["carc:197", "response:prior-auth-missing"]),

  tpl("appeal-internal", "Level 1 internal appeal – commercial plan", "General first-level appeal for a denied claim or authorization.", ["appeal", "commercial"],
`${HEAD}
RE: Request for appeal (first level)
${PT}
Claim / authorization number: {{Claim or authorization number}}
Date(s) of service: {{Date(s) of service}}
Denied service(s): {{HCPCS/CPT code(s) and description}}
Denial date and reason: {{Denial date}} – {{Denial reason as stated (incl. CARC/RARC)}}
Billed amount: {{Billed amount}}

{{Patient name}} and I, as {{Patient name}}'s treating physician and authorized representative, appeal the denial above and request that you overturn it.

Why the denial is wrong
{{Point 1: e.g. the service meets policy criterion ___, documented on page ___}}
{{Point 2}}
{{Point 3}}

Clinical background
{{Short clinical summary: diagnosis, stage, biomarkers, treatment history}}

Requests
1. Reverse the denial and process the claim for payment.
2. If the denial is upheld, provide the name and credentials of the reviewer, the specific criteria relied upon, and a copy of the claim file, free of charge.
3. Have this appeal reviewed by a board-certified {{Specialty}} physician who was not involved in the initial decision.

Enclosures: {{Enclosures}}

${SIG}

Patient authorization (if required by the plan): ______________________ Date: ________`,
  "Lead with the payer's own criteria, not general arguments. Keep it to two pages and put detail in the enclosures. Include an authorized-representative form if the plan requires one.",
  ["appeal:commercial-internal", "template:authorized-rep", "response:medical-necessity"]),

  tpl("expedited-appeal", "Expedited (urgent) appeal request", "72-hour review when waiting could seriously harm the patient.", ["appeal", "urgent", "pre-service"],
`URGENT – EXPEDITED APPEAL REQUESTED
${HEAD}
RE: Expedited appeal of pre-service denial
${PT}
Authorization / reference number: {{Reference number}}
Requested service: {{Drug / regimen or service}}
Planned treatment date: {{Planned start date}}

I certify, as the treating physician, that applying the standard appeal timeframe could seriously jeopardize {{Patient name}}'s life, health, or ability to regain maximum function, because {{Specific clinical reason (e.g. rapidly progressive disease, symptomatic metastases, cord compression risk, cycle delay)}}.

I request an expedited decision within 72 hours. {{If applicable: 'I also request expedited external review concurrently.'}}

Clinical summary and reasons the denial should be reversed:
{{Brief clinical argument}}

Please call me directly at {{Physician direct phone}} for a peer-to-peer discussion.

${SIG}`,
  "Phone the payer as well as faxing; ask for the expedited queue and write down the reference number and time.",
  ["appeal:commercial-internal", "appeal:external-review", "response:prior-auth-denied"]),

  tpl("p2p-prep", "Peer-to-peer preparation worksheet", "One-page script for the treating physician before a payer medical director call.", ["peer-to-peer", "prior auth"],
`PEER-TO-PEER PREP – {{Patient name}} – {{Member ID}}
Payer / reference #: {{Payer name}} / {{Reference number}}
Call scheduled: {{Date and time}} | Reviewer: {{Reviewer name and specialty}}

1. Request (one sentence): {{Drug / regimen}} for {{Diagnosis in words}}, {{Dose and schedule}}.
2. Denial reason given: {{Denial reason as stated}}
3. Policy criteria and how they're met:
   - {{Criterion}} → {{Evidence in chart}}
   - {{Criterion}} → {{Evidence in chart}}
4. Key facts to say first: stage {{Stage}}; biomarkers {{Biomarker results}}; ECOG {{ECOG score}}; prior lines {{Prior therapies}}.
5. Guideline support: {{NCCN / compendia citation and category}}
6. Why alternatives won't work: {{Contraindications / failures / intolerances}}
7. Consequence of delay: {{Expected harm from delay}}
8. Acceptable fallback (only if clinically OK): {{e.g. preferred biosimilar, different site of care}}
9. Ask before hanging up: decision, reference number, written confirmation, and appeal rights if upheld.

Outcome: ______________________ Reference #: __________ Time: ______`,
  "Ask for a same-specialty reviewer (oncologist). Many plans require the P2P within a few business days of the denial.",
  ["term:peer-to-peer", "response:prior-auth-denied"]),

  tpl("off-label", "Off-label use support letter (compendia-based)", "For drugs used outside the FDA label but supported by compendia/guidelines.", ["off-label", "compendia", "medical necessity"],
`${HEAD}
RE: Coverage of a medically accepted off-label anticancer use
${PT}
Drug: {{Drug name}} ({{HCPCS code}}), {{Dose and schedule}}
Diagnosis: {{Diagnosis in words}} ({{ICD-10-CM code(s)}})

{{Drug name}} is not FDA-labeled for {{Diagnosis in words}}, but this use is medically accepted:
- Compendium listing: {{Compendium name}}, {{Listing / recommendation level}}
- NCCN Guidelines: {{Guideline name, version, page, category}}
- Peer-reviewed evidence: {{Citations}}

{{For Medicare: 'Social Security Act §1861(t)(2)(B) and Medicare Benefit Policy Manual Chapter 15 §50.4.5 provide coverage for medically accepted off-label uses of anticancer drugs supported by CMS-recognized compendia or peer-reviewed literature.'}}
{{For state-regulated commercial plans: cite the state's off-label cancer drug coverage law, if any: ___}}

Clinical reasons this drug is appropriate for {{Patient name}}: {{Clinical rationale}}

${SIG}`,
  "Copy the compendium's exact recommendation level into the letter and attach the page. Check which compendia the payer's policy recognises.",
  ["topic:off-label", "carc:50"]),

  tpl("experimental-appeal", "Appeal of experimental/investigational denial", "Challenges an E/I determination on FDA status, evidence and the plan's own definition.", ["appeal", "experimental"],
`${HEAD}
RE: Appeal – service is not experimental or investigational
${PT}
Claim / authorization number: {{Claim or authorization number}}
Service: {{Drug / procedure}} ({{Code(s)}})

You denied {{Drug / procedure}} as experimental/investigational. Under your plan's definition ({{Quote the plan's E/I definition and page}}), this service does not qualify as experimental because:
1. FDA status: {{FDA approval / clearance and date, indication}}
2. Standard of care: {{NCCN / ASCO / ASTRO guideline citation and category}}
3. Evidence: {{Phase III trial(s) or meta-analyses and outcomes}}
4. Use by peers: {{Adoption at NCI-designated centers / other payers covering it}}

{{Patient name}}'s clinical circumstances: {{Clinical summary}}

Please reverse the denial. If upheld, I request external review by an independent review organization, which is available for experimental/investigational determinations.

${SIG}`,
  "Get the plan document (SPD/EOC) and quote its E/I definition – the argument is often that the definition isn't met.",
  ["carc:55", "carc:56", "appeal:external-review"]),

  tpl("trial-appeal", "Clinical trial routine-cost appeal", "For denials of routine care for patients in an approved clinical trial.", ["appeal", "clinical trial"],
`${HEAD}
RE: Appeal – routine patient costs in an approved clinical trial
${PT}
Trial: {{Trial title}} (NCT{{NCT number}}), phase {{Phase}}, sponsor {{Sponsor}}
Claim number(s): {{Claim number(s)}}
Denied routine services: {{Codes and descriptions}}

{{Patient name}} is enrolled in the approved clinical trial above for treatment of {{Diagnosis in words}}, a life-threatening condition. The denied services are routine patient costs – items and services that would be covered for a patient not enrolled in a trial – not the investigational item itself, which is {{provided by the sponsor / billed separately with modifier Q0}}.

Coverage is required under:
{{Commercial non-grandfathered plan: Public Health Service Act §2709 (42 U.S.C. 300gg-8), which prohibits denying or limiting coverage of routine patient costs for qualified individuals in approved clinical trials.}}
{{Medicare: NCD 310.1, Routine Costs in Clinical Trials.}}
{{Medicaid: Social Security Act §1905(a)(30) and §1905(gg).}}

Enclosed: trial registration page, consent date, coverage analysis excerpt, and claim(s). Please reprocess these claims.

${SIG}`,
  "Keep only the legal paragraph that applies to this payer. Make sure research-only services paid by the sponsor were not billed.",
  ["topic:clinical-trials", "response:clinical-trial"]),

  tpl("medicare-redetermination", "Medicare redetermination request (cover letter for CMS-20027)", "Level 1 Original Medicare appeal to the MAC.", ["appeal", "medicare"],
`{{Date}}

{{MAC name}} – Redeterminations
{{MAC appeals address or portal reference}}

RE: Request for redetermination
Beneficiary: {{Patient name}}
Medicare number (MBI): {{MBI}}
Claim number (ICN): {{ICN}}
Date(s) of service: {{Date(s) of service}}
Item(s)/service(s) appealed: {{HCPCS/CPT code(s), units}}
Date of initial determination notice: {{Notice date}}

I disagree with the initial determination because {{Reason (e.g. the service meets NCD/LCD ___ criteria; the diagnosis code ___ is covered under billing article ___; units reflect a weight-based dose)}}.

Supporting documentation enclosed: {{Enclosures}}

Requester: {{Practice or facility name}}, NPI {{Billing NPI}}, PTAN {{PTAN}}
{{Contact for questions (name, phone, email)}}

Signature: ______________________`,
  "File within 120 days of receiving the initial determination. Use the CMS-20027 form or a letter with the same elements; clerical errors should go through a reopening instead.",
  ["appeal:medicare-l1", "topic:reopening"]),

  tpl("ma-reconsideration", "Medicare Advantage reconsideration request", "Appeal to an MA plan of a denied service or payment.", ["appeal", "medicare advantage"],
`${HEAD}
RE: Request for reconsideration – {{Pre-service (standard/expedited) or payment}}
Enrollee: {{Patient name}} | Member ID: {{Member ID}}
Organization determination / claim number: {{Reference number}}
Service(s): {{Codes and description}} | Date(s): {{Date(s) of service}}

We request reconsideration of the denial dated {{Denial date}}. Original Medicare covers this service under {{NCD / LCD / Medicare manual citation}}, and Medicare Advantage plans must cover all items and services covered under Original Medicare using criteria no more restrictive than Original Medicare's coverage rules where those exist (42 CFR 422.101(b)).

Clinical basis: {{Clinical summary and criteria met}}

If the plan upholds its decision, please forward the case to the Independent Review Entity as required.

${SIG}`,
  "File within 65 days of the denial notice. For a contracted provider's payment dispute, check whether the plan treats it as a provider dispute instead of an enrollee appeal.",
  ["appeal:ma-reconsideration", "payer:medicare-advantage"]),

  tpl("external-review", "External review request", "After the final internal denial on a commercial plan.", ["appeal", "external review"],
`{{Date}}

{{State insurance department / HHS federal external review / IRO named in the denial}}

RE: Request for {{Standard / expedited}} external review
Patient: {{Patient name}} | Plan: {{Payer name}} | Member ID: {{Member ID}}
Final internal denial date: {{Final denial date}} | Reference: {{Reference number}}
Service denied: {{Drug / service and codes}}

The plan denied this service as {{Not medically necessary / experimental / wrong setting}}. I request an independent external review. The treatment is medically necessary and supported by {{Guidelines / compendia / evidence}}.

{{If expedited: the treating physician certifies that the standard timeframe would seriously jeopardize the patient's life or health.}}

Enclosed: final denial letter, internal appeal, medical records, physician letter, supporting literature.

Patient or authorized representative: {{Name}}  Signature: ____________  Phone: {{Phone}}`,
  "Must be filed within 4 months of the final internal denial for most plans. Use the form named in the denial letter if there is one.",
  ["appeal:external-review"]),

  tpl("corrected-claim", "Corrected claim cover letter", "Accompanies a frequency-7 replacement claim (or paper resubmission).", ["claim", "corrected"],
`${HEAD}
RE: Corrected claim
${PT}
Original claim number: {{Original claim number}}
Date(s) of service: {{Date(s) of service}}

Enclosed is a corrected (replacement) claim, frequency code 7, for the original claim above. Correction made: {{What changed (units, NDC, modifier, diagnosis, POS)}}. Reason: {{Why}}.

This replaces the original claim in full. Please reprocess and adjust payment accordingly.

{{Contact for questions (name, phone, email)}}`,
  "Electronic corrected claims don't need a letter – put the original claim number in REF*F8. Use this for paper or portal submissions.",
  ["claim:freq-7"]),

  tpl("timely-filing", "Timely filing reconsideration (proof of timely submission)", "For CO-29 denials when the claim was in fact sent on time.", ["timely filing", "appeal"],
`${HEAD}
RE: Timely filing reconsideration
${PT}
Claim number: {{Claim number}} | Date(s) of service: {{Date(s) of service}}

This claim was denied for timely filing. It was originally submitted on {{Original submission date}}, within your {{Filing limit (days)}}-day limit, as shown by the enclosed {{Proof (clearinghouse acceptance report / 277CA / payer acknowledgment / prior payer EOB dated ___)}}.

{{Optional: the delay resulted from ___ (retroactive eligibility, payer error, COB determination by another payer on ___).}}

Please reverse the timely filing denial and process the claim.

{{Contact for questions (name, phone, email)}}`,
  "A clearinghouse 'sent' log is weak; a payer-level acceptance (277CA) is strong.",
  ["carc:29", "response:timely-filing"]),

  tpl("records-cover", "Medical records / ADR response cover letter", "Cover page for documentation requests.", ["records"],
`${HEAD}
RE: Response to request for additional documentation
${PT}
Request / ADR reference: {{Request reference}} dated {{Request date}}
Claim number: {{Claim number}} | Date(s) of service: {{Date(s) of service}}

Enclosed are the records requested ({{Number of pages}} pages):
[ ] Physician order and signed treatment plan
[ ] Progress note(s) for date(s) of service
[ ] Pathology report
[ ] Biomarker / molecular results
[ ] Drug administration record (doses, start/stop times, waste)
[ ] Imaging reports
[ ] Clinical trial documentation (if applicable)
[ ] {{Other}}

Summary: {{One-paragraph summary of why the service was reasonable and necessary}}

{{Contact for questions (name, phone, email)}}`,
  "Put the payer's request letter on top of the packet and paginate everything.",
  ["carc:252", "carc:226", "response:records"]),

  tpl("site-of-care", "Site-of-care exception request", "Keep an infusion in the hospital outpatient setting.", ["site of care", "infusion"],
`${HEAD}
RE: Site-of-care exception request
${PT}
Drug: {{Drug}} ({{HCPCS code}}) | Requested site: {{Facility name}} (POS {{POS code}})

Your site-of-care policy {{Policy name / number}} directs this drug to {{Payer preferred site}}. I request an exception because:
[ ] Patient is receiving the first {{Number}} doses / re-initiating after a gap
[ ] History of infusion reaction: {{Details}}
[ ] Clinical condition requires hospital-level monitoring: {{Details}}
[ ] No alternative site within reasonable distance: {{Details}}
[ ] Patient is mid-regimen and continuity of care is needed until {{Date}}
[ ] {{Other}}

Requested exception period: {{Start date}} to {{End date}}.

${SIG}`,
  "Most site-of-care policies list their own exception criteria – mirror their wording.",
  ["response:site-of-care", "carc:58"]),

  tpl("step-therapy", "Step therapy exception request", "When the plan requires a preferred drug first.", ["step therapy", "prior auth"],
`${HEAD}
RE: Step therapy exception request
${PT}
Requested drug: {{Requested drug}} | Required step drug(s): {{Preferred drug(s)}}

I request an exception to the step therapy requirement because:
[ ] The patient previously tried {{Preferred drug}} from {{Dates}} and it was ineffective / not tolerated: {{Details}}
[ ] The required drug is contraindicated or likely to cause harm: {{Details}}
[ ] The required drug is expected to be ineffective based on {{Biomarker / clinical characteristics}}
[ ] The patient is stable on {{Requested drug}} and switching is not in the patient's best interest
{{State step therapy exception law, if applicable: ___}}

${SIG}`,
  "Many states set deadlines for step therapy exception decisions for state-regulated plans.",
  ["response:step-therapy"]),

  tpl("formulary-exception", "Part D / pharmacy formulary exception (prescriber statement)", "For non-formulary oral oncolytics or quantity/tier exceptions.", ["part d", "pharmacy", "oral chemo"],
`PRESCRIBER SUPPORTING STATEMENT – {{Standard / expedited}} coverage determination
Plan: {{Payer name}} | Enrollee: {{Patient name}} | Member ID: {{Member ID}} | DOB: {{Patient DOB}}
Drug requested: {{Drug, strength, quantity, days supply}}
Exception type: [ ] Formulary  [ ] Tiering  [ ] Quantity limit  [ ] Prior authorization  [ ] Step therapy
Diagnosis: {{Diagnosis in words}} ({{ICD-10-CM code(s)}})

Formulary alternatives tried or not appropriate:
{{Alternative 1 – outcome / reason not appropriate}}
{{Alternative 2 – outcome / reason not appropriate}}

Medical reason: {{Why the requested drug is necessary and the alternatives would be less effective or cause adverse effects}}

{{If expedited: applying the standard timeframe may seriously jeopardize the enrollee's life, health or ability to regain maximum function.}}

Prescriber: {{Physician name, credentials}} | NPI {{Physician NPI}} | Phone {{Physician direct phone}} | Fax {{Practice fax}}
Signature: ____________  Date: {{Date}}`,
  "Part D plans must decide within 72 hours (24 hours expedited) after receiving the prescriber's statement.",
  ["appeal:partd", "payer:medicare-d"]),

  tpl("network-gap", "Network gap exception / single case agreement request", "Out-of-network specialised cancer care.", ["network", "out-of-network"],
`${HEAD}
RE: Request for in-network benefit level (network gap exception)
${PT}
Requested provider: {{Out-of-network provider / center}}, NPI {{NPI}}
Service: {{Service / trial / transplant / proton therapy}}

We request in-network coverage because no participating provider can deliver this care with comparable expertise, timeliness or access:
{{Reason (e.g. rare tumor expertise, trial only available at this center, transplant program, distance/wait time)}}
In-network options considered: {{In-network providers checked and why unsuitable}}

Requested dates: {{Start date}} to {{End date}}.

${SIG}`,
  "Ask the payer whether they want a network exception, a single case agreement, or both – and get the rate terms in writing.",
  ["carc:242", "response:network"]),

  tpl("cob-update", "Patient letter – update your other insurance", "Ask a patient to update coordination of benefits with their plans.", ["cob", "patient letter"],
`{{Date}}

Dear {{Patient name}},

Your health plan, {{Payer name}}, has paused payment for your care on {{Date(s) of service}} because it needs to confirm whether you have other insurance. This is called coordination of benefits.

Please call {{Payer name}} at the member services number on your card ({{Member services phone}}) and tell them about all health coverage you have – including Medicare, Medicaid, coverage through a spouse or employer, or VA benefits. If you have no other coverage, tell them that too. It usually takes about five minutes.

When you're done, please call us at {{Practice phone}} so we can resubmit your claims. You don't owe anything for these services while we sort this out.

Thank you,
{{Billing contact name}}
{{Practice or facility name}}`,
  "Plain language for patients; adjust the last sentence to your financial policy.",
  ["carc:22", "carc:227", "response:cob"]),

  tpl("authorized-rep", "Authorized representative designation", "Patient designates the practice to appeal on their behalf.", ["appeal", "authorization"],
`AUTHORIZED REPRESENTATIVE DESIGNATION

I, {{Patient name}} (DOB {{Patient DOB}}, Member ID {{Member ID}}), appoint {{Representative name / practice}} to act as my authorized representative for the claim(s) or service(s) below with {{Payer name}}, including filing appeals and grievances, receiving copies of my claim file and medical information related to the appeal, and requesting external review.

Claim / service: {{Claim number or service and dates}}
This designation is valid until: {{End date or 'the appeal is resolved'}}

Patient signature: ______________________ Date: ________
Representative signature: ______________________ Date: ________
Representative address and phone: {{Representative address and phone}}`,
  "Medicare uses form CMS-1696 for appointment of representative; many commercial plans have their own form – use it if they do.",
  ["term:authorized-rep", "appeal:commercial-internal"]),

  tpl("status-call-log", "Payer call log / claim status script", "Script and log for follow-up calls.", ["claim status", "follow-up"],
`PAYER CALL LOG
Date/time: {{Date and time}} | Payer: {{Payer name}} | Phone: {{Payer phone}} | Rep name: {{Rep name}} | Call ref #: {{Call reference}}
Patient: {{Patient name}} | Member ID: {{Member ID}} | Claim #: {{Claim number}} | DOS: {{Date(s) of service}} | Billed: {{Billed amount}}

Script:
1. "I'm calling from {{Practice or facility name}}, NPI {{Billing NPI}}, about claim {{Claim number}}."
2. Status? (received / pended / paid / denied) → {{Status}}
3. If denied: exact reason and codes → {{Denial reason as stated (incl. CARC/RARC)}}
4. Can it be fixed by phone reopening or corrected claim? → {{Answer}}
5. Appeal deadline, address/fax/portal, and required form → {{Appeal details}}
6. If paid: amount, date, check/EFT number → {{Payment details}}
7. Anything else needed from us? → {{Answer}}

Next action: {{Next action}} | Due by: {{Due date}} | Owner: {{Owner}}`,
  "Check 276/277 or the portal first. Always record the call reference number.",
  ["claim:276/277"]),
]);
