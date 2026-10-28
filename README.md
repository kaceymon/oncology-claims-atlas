# Claims Atlas

A static, searchable reference for US health insurance claims with an oncology focus – built for studying.
Plain HTML/CSS/JS, no build step, works on GitHub Pages (and by opening `index.html` locally).

## What's inside (~13,200 entries)

| Section | Count | Source |
|---|---|---|
| Provider types (NUCC taxonomy v26.1) | 883 | NUCC – free to use |
| ICD-10-CM oncology codes (C00–D49 + Z/R/D/T supportive), FY2027 | 2,435 | CDC/NCHS – public domain |
| HCPCS Level II, October 2026 (D-codes excluded) | 7,448 | CMS – public domain |
| HCPCS modifiers | 364 | CMS – public domain |
| Place of service | 53 | CMS – public domain |
| Oncology CPT codes (plain-language labels) | 151 | Code numbers only; descriptors are © AMA and not reproduced |
| Every X12 reason code (CARC) and remark code (RARC) | 408 + 1,216 | Code, status, topic and affected data element; ~120 have hand-written plain-language guides. Official wording © X12, linked |
| Claim forms & types, bill types, revenue codes, payers, care settings, appeals, HIPAA, topics, glossary | ~240 | Hand-written summaries of public CMS/HHS/DOL sources |
| Denial playbooks, fill-in templates, study quiz scenarios | 85 | Original content |
| Either/or rules (same line, same claim/day, same diagnosis list) | 24 | Written from CPT conventions, NCCI policy and ICD-10-CM guidelines |
| ICD-10-CM Excludes1 notes for the oncology codes | 1,842 codes | CDC/NCHS – public domain |

Features: smart search (questions, phrases, synonyms like "DOB"/"PA", drug brand names, CO-16 style codes,
payer numeric codes like 00857, typo suggestions), category facets, detail pages with official-source links,
template filler (copy / download / print), flashcard study mode, NPI Registry lookup, dark/light themes.

## Publish on GitHub Pages

1. Push this folder to a GitHub repository.
2. Repository **Settings → Pages → Build and deployment → Deploy from a branch**, branch `main`, folder `/ (root)`.
3. The site appears at `https://<user>.github.io/<repo>/`.

## Rebuild the generated code sets

```bash
tools/fetch_sources.sh /path/to/empty-download-dir
python -I tools/build_data.py /path/to/empty-download-dir
node tools/check_data.js
```

`check_data.js` loads every data file the way the page does and fails on duplicate ids or broken "related" links.

## Not legal, coding or billing advice

Educational reference only. Payer policies, deadlines and code sets change – always confirm with the payer's
current policy, the plan documents and the official code set. Don't enter real patient information.
