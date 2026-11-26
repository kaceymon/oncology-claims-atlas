// HIPAA Administrative Simplification standards, commercial payer notes (public info only),
// and extra remark-code context. Summaries of public HHS/CMS sources; payer details point to
// each payer's own public provider pages - deadlines vary by state, product and contract.

const HHS = {
  admin: ["CMS - Administrative Simplification (HIPAA standards)", "https://www.cms.gov/priorities/key-initiatives/burden-reduction/administrative-simplification/hipaa/adopted-standards-operating-rules"],
  p162: ["45 CFR Part 162 (transactions, code sets, identifiers)", "https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-162"],
  p164: ["45 CFR Part 164 (privacy, security, breach)", "https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164"],
  privacy: ["HHS OCR - HIPAA Privacy Rule", "https://www.hhs.gov/hipaa/for-professionals/privacy/index.html"],
  security: ["HHS OCR - HIPAA Security Rule", "https://www.hhs.gov/hipaa/for-professionals/security/index.html"],
  breach: ["HHS OCR - Breach Notification Rule", "https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html"],
  access: ["HHS OCR - Individuals' right of access", "https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/access/index.html"],
  core: ["CAQH CORE - Operating rules", "https://www.caqh.org/core/operating-rules"],
  npi: ["CMS - NPPES (NPI enumeration)", "https://nppes.cms.hhs.gov/"],
};

OCA.add("hipaa", [
  { code: "overview", title: "HIPAA Administrative Simplification – what it standardises", tags: ["hipaa", "overview"],
    summary: "HIPAA requires health plans, clearinghouses and providers who bill electronically (covered entities) to use the same transactions, code sets and identifiers – and to protect patient information.",
    body: `<ul><li><b>Transactions</b> – the X12 837, 835, 270/271, 276/277, 278, 834, 820 and NCPDP pharmacy standards (45 CFR 162).</li>
<li><b>Code sets</b> – ICD-10-CM, ICD-10-PCS, HCPCS/CPT, CDT, NDC.</li>
<li><b>Identifiers</b> – NPI for providers, EIN for employers.</li>
<li><b>Operating rules</b> – CAQH CORE rules for eligibility, claim status, ERA/EFT.</li>
<li><b>Privacy, Security and Breach Notification</b> – 45 CFR 164.</li></ul>
<p>CARCs and RARCs are the code lists the HIPAA-standard 835 uses to explain payments, which is why every payer must speak the same denial language on the electronic remit.</p>`,
    src: [HHS.admin, HHS.p162, HHS.p164], rel: ["hipaa:transactions", "hipaa:code-sets", "hipaa:privacy-payment", "claim:835"] },
  { code: "transactions", title: "HIPAA transaction standards (X12 5010 and NCPDP)", tags: ["hipaa", "edi", "x12", "5010"],
    summary: "Version 5010 of the X12 transactions has been required since January 2012; NCPDP D.0 for retail pharmacy.",
    body: `<table class="mini"><tr><th>Transaction</th><th>Standard</th></tr>
<tr><td>Claims / encounters</td><td>837P (professional), 837I (institutional), 837D (dental), NCPDP (pharmacy)</td></tr>
<tr><td>Payment and remittance advice</td><td>835</td></tr>
<tr><td>Eligibility inquiry/response</td><td>270/271</td></tr>
<tr><td>Claim status</td><td>276/277</td></tr>
<tr><td>Referral / prior authorization</td><td>278</td></tr>
<tr><td>Enrollment / premium payment</td><td>834 / 820</td></tr>
<tr><td>Coordination of benefits</td><td>837 (COB loops)</td></tr></table>
<p>A payer can't refuse a compliant standard transaction or demand non-standard data in it. Payer "companion guides" explain how they use the standard's optional pieces.</p>`,
    src: [HHS.admin, HHS.p162], rel: ["claim:837P", "claim:837I", "claim:835", "claim:270/271", "claim:276/277", "claim:278", "claim:NCPDP-D.0"] },
  { code: "code-sets", title: "HIPAA code sets", tags: ["hipaa", "codes"],
    summary: "Medical data code sets adopted under 45 CFR 162.1002: ICD-10-CM (diagnoses), ICD-10-PCS (inpatient procedures), HCPCS and CPT (procedures, supplies, drugs), CDT (dental), NDC (retail pharmacy drugs).",
    body: `<p>Use the version valid on the date of service. ICD-10-CM updates each October 1 (sometimes April 1); HCPCS Level II updates quarterly; CPT annually. This site carries ICD-10-CM FY2027 and HCPCS Level II October 2026.</p>`,
    src: [HHS.p162], rel: ["carc:146", "carc:181", "topic:noc-drugs"] },
  { code: "npi", title: "NPI – the HIPAA provider identifier", tags: ["hipaa", "npi", "identifier"],
    summary: "Every covered provider must get an NPI and use it on standard transactions: Type 1 for individuals, Type 2 for organizations.",
    body: `<p>Billing, rendering, referring, ordering, attending and service-facility providers each have their own NPI field on the claim. Taxonomy codes travel with the NPI to say what kind of provider it is.</p>`,
    src: [HHS.npi], rel: ["term:npi", "term:taxonomy", "rarc:N290", "rarc:N265"] },
  { code: "operating-rules", title: "Operating rules (CAQH CORE)", tags: ["hipaa", "era", "eft", "eligibility"],
    summary: "Adopted operating rules govern how fast and how completely payers answer eligibility and claim-status requests, and require ERA/EFT enrollment and reassociation.",
    body: `<p>Practical upshot: payers must return real-time 271 responses with patient financial details, and must let providers enroll in electronic remittance (835) and EFT; the 835 must use the standard CARC/RARC combinations.</p>`,
    src: [HHS.core, HHS.admin], rel: ["claim:270/271", "claim:835"] },
  { code: "privacy-payment", title: "Privacy Rule: sharing PHI for billing and appeals", tags: ["hipaa", "privacy", "phi", "appeals"],
    summary: "Covered entities may use and disclose protected health information for treatment, payment and health care operations without the patient's authorization (45 CFR 164.506).",
    body: `<ul><li>Sending records to a payer for a claim, prior auth or appeal is a <b>payment</b> disclosure – no patient authorization needed (though the payer's appeal process may require a member authorized-representative form).</li>
<li>The <b>minimum necessary</b> standard applies to payment disclosures: send what the request or the appeal needs, not the whole chart.</li>
<li>Billing companies and other vendors handling PHI need a <b>business associate agreement</b>; health care clearinghouses are covered entities themselves.</li>
<li>Patients can request their own records and billing records (right of access, 45 CFR 164.524) – generally within 30 days.</li></ul>
<p class="warn">Don't paste real patient information into public tools or study materials. The templates on this site keep typed text in your own browser only.</p>`,
    src: [HHS.privacy, HHS.access, HHS.p164], rel: ["template:records-cover", "template:authorized-rep", "hipaa:security"] },
  { code: "security", title: "Security Rule and breach notification", tags: ["hipaa", "security", "breach"],
    summary: "Electronic PHI needs administrative, physical and technical safeguards. Breaches of unsecured PHI must be reported to affected individuals without unreasonable delay and within 60 days of discovery.",
    body: `<p>Common billing-office risks: faxing records to the wrong number, emailing unencrypted attachments, shared portal logins, and payer portal access left active after staff leave.</p>`,
    src: [HHS.security, HHS.breach], rel: ["hipaa:privacy-payment"] },
  { code: "remark-codes", title: "Remark codes: standard (CARC/RARC) vs payer-specific", tags: ["hipaa", "remark codes", "rarc", "eob"],
    summary: "On the HIPAA 835, the only reason/remark codes allowed are the X12 CARC and RARC lists. Paper EOBs and portals often also show the payer's own numeric explanation codes.",
    body: `<ul><li><b>CARC</b> – numbers or letter+number (1, 16, 197, B9): the reason, always paired with a group code (CO/PR/OA/PI).</li>
<li><b>RARC</b> – start with M, MA or N (N329, MA130, M119): extra detail; some are "Alert:" informational only.</li>
<li><b>Payer-specific codes</b> – e.g. 5-digit numeric "EOB" or "explanation" codes (like <code>00857</code>) used by many state Medicaid systems and some commercial plans on paper remits and portals. These are not X12 codes; look them up in that payer's EOB code legend or provider manual, and match them to the CARC/RARC on the 835 for the same claim line.</li></ul>`,
    src: [["X12 - CARC list", "https://x12.org/codes/claim-adjustment-reason-codes"], ["X12 - RARC list", "https://x12.org/codes/remittance-advice-remark-codes"], HHS.admin],
    rel: ["term:group-codes", "rarc:N857", "carc:16", "claim:835"] },
]);

OCA.add("rarc", [
  ["N857", "Claim adjusted/reversed – refund any copay collected from the member", "The payer reprocessed or reversed the claim (often after a correction, COB change or audit) and the patient's copay no longer applies.", "Post the reversal, check the new adjudication, and refund the member any copay collected for that line. Note: a 5-digit payer code such as 00857 is a payer-specific EOB code, not this X12 code – check the payer's own code legend.", ["hipaa:remark-codes", "term:group-codes"], ["refund", "reversal"]],
].map(denial("rarc", X12_RARC)));

// ---- commercial payer notes (public provider-site information only) ----
const pay = (code, title, summary, body, src, tags) => ({ code, title, summary, body, src, tags: ["commercial"].concat(tags), rel: ["appeal:commercial-internal", "response:prior-auth-missing", "template:corrected-claim"] });
OCA.add("payer", [
  pay("anthem", "Anthem Blue Cross / Anthem Blue Cross Blue Shield (Elevance Health)", "Blue plan in 14 states. Providers use Availity Essentials for eligibility, claims, status, corrected claims, appeals and authorizations; medical policies and clinical guidelines are public on Anthem's provider site.",
    `<ul><li><b>Claims:</b> electronic 837 via Availity or your clearinghouse; corrected claims use frequency code 7 with the original claim number.</li>
<li><b>Authorizations:</b> many oncology drug, radiation oncology and imaging requests are reviewed through Carelon Medical Benefits Management (formerly AIM Specialty Health) – check the Anthem prior-auth lookup by code and state.</li>
<li><b>Out-of-area Blue members:</b> file with your local Blue plan (BlueCard) – the alpha prefix on the ID card tells you the home plan.</li>
<li><b>Deadlines:</b> timely filing, reconsideration and appeal windows differ by state, product (commercial, Medicaid, Medicare Advantage) and contract – use the provider manual for your state.</li></ul>`,
    [["Anthem - Provider site", "https://www.anthem.com/provider/"], ["Availity Essentials", "https://www.availity.com/"]], ["blue cross", "bcbs", "anthem", "elevance", "availity"]),
  pay("bluecard", "BlueCard (out-of-area Blue Cross Blue Shield members)", "National program that lets a provider file claims for any Blue member with the provider's local Blue plan, which routes them to the member's home plan.",
    `<p>Key rules: always include the member ID's alpha prefix, verify eligibility through your local Blue plan, and follow the <b>home</b> plan's medical policy and prior-auth requirements (your local plan's portal can route you there).</p>`,
    [["BCBSA - Blue Cross Blue Shield companies", "https://www.bcbs.com/about-us/blue-cross-blue-shield-system/state-health-plan-companies"], ["Anthem - Provider site (BlueCard info in the provider manual)", "https://www.anthem.com/provider/"]], ["blue cross", "bcbs", "out-of-area"]),
  pay("bcbs-plans", "Other Blue Cross Blue Shield companies", "There are 30+ independent BCBS companies (e.g. Florida Blue, BCBS of Texas, Highmark, Regence, Premera, CareFirst). Each has its own provider manual, portal, policies and deadlines.",
    `<p>Find the plan by state on the Blue Cross Blue Shield Association site, then use that plan's provider manual and medical policy library.</p>`,
    [["BCBSA - Find a company", "https://www.bcbs.com/about-us/blue-cross-blue-shield-system/state-health-plan-companies"]], ["blue cross", "bcbs"]),
  pay("unitedhealthcare", "UnitedHealthcare", "Uses the UnitedHealthcare Provider Portal for eligibility, claims, appeals and prior authorization; medical and drug policies are public on uhcprovider.com.",
    `<p>Oncology drug and radiation authorizations run through UHC's oncology prior-authorization programs (check the program requirements by product). Medicare Advantage and Community Plan (Medicaid) products have their own rules.</p>`,
    [["UnitedHealthcare - Provider site", "https://www.uhcprovider.com/"]], ["uhc", "optum"]),
  pay("aetna", "Aetna (CVS Health)", "Providers work through Availity for eligibility, claims and appeals; Aetna's Clinical Policy Bulletins (CPBs) are public and are the usual source of medical-necessity criteria.",
    "", [["Aetna - Health care professionals", "https://www.aetna.com/health-care-professionals.html"], ["Aetna - Clinical Policy Bulletins", "https://www.aetna.com/health-care-professionals/clinical-policy-bulletins.html"]], ["aetna", "availity"]),
  pay("cigna", "Cigna Healthcare", "Provider portal and coverage policies are public; eviCore healthcare (owned by Cigna's Evernorth) reviews many radiation oncology and imaging authorizations.",
    "", [["Cigna - Health care providers", "https://www.cigna.com/health-care-providers/"], ["Cigna - Coverage policies", "https://static.cigna.com/assets/chcp/resourceLibrary/coveragePolicies/index.html"]], ["cigna", "evicore"]),
  pay("humana", "Humana", "Mostly Medicare Advantage and Part D, so Medicare Advantage rules (organization determinations, reconsiderations, CMS-0057-F timelines) apply. Providers use Availity for claims and authorizations.",
    "", [["Humana - For providers", "https://www.humana.com/provider"]], ["humana", "medicare advantage", "availity"]),
]);
