#!/usr/bin/env bash
# Downloads the public-domain / freely licensed source files the site is built from.
# Usage: tools/fetch_sources.sh <empty-download-dir>
# Then:  python -I tools/build_data.py <download-dir>
set -euo pipefail
out="${1:?give an empty download directory}"
mkdir -p "$out" && cd "$out"

# NUCC Health Care Provider Taxonomy 26.1 (free to use, NUCC)
curl -fsSL -o nucc_taxonomy.csv "https://www.nucc.org/images/stories/CSV/nucc_taxonomy_261.csv"

# ICD-10-CM FY2027 (Oct 1 2026 - Sep 30 2027), CDC/NCHS - public domain
curl -fsSL -o icd10cm.zip "https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Publications/ICD10CM/2027/icd10cm-code-descriptions-2027.zip"
mkdir -p icd10cm && unzip -o -q icd10cm.zip -d icd10cm

# HCPCS Level II, October 2026 quarterly file, CMS - public domain (D-codes are ADA CDT and are skipped)
curl -fsSL -A "Mozilla/5.0" -o hcpcs.zip "https://www.cms.gov/files/zip/october-2026-alpha-numeric-hcpcs-file.zip"
mkdir -p hcpcs && unzip -o -q hcpcs.zip -d hcpcs

# CMS Place of Service code set - public domain
curl -fsSL -A "Mozilla/5.0" -o pos.html "https://www.cms.gov/medicare/coding-billing/place-of-service-codes/code-sets"

echo "done -> $out"
