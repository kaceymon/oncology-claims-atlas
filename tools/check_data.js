// Sanity check: loads every data file the way index.html does and reports
// counts, duplicate ids and "related" links that point at nothing.
// Usage: node tools/check_data.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const files = [...html.matchAll(/<script src="(data\/[^"]+)"/g)].map(m => m[1]);
const ctx = {}; ctx.window = ctx;
vm.createContext(ctx);
for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });

const recs = ctx.window.OCA.records;
const ids = new Map();
let problems = 0;
for (const r of recs) {
  const id = `${r.cat}:${r.code}`;
  if (ids.has(id)) { console.log("duplicate id", id); problems++; }
  ids.set(id, r);
}
for (const r of recs) for (const t of r.rel || []) if (!ids.has(t)) { console.log(`broken rel ${r.cat}:${r.code} -> ${t}`); problems++; }
const counts = {};
for (const r of recs) counts[r.cat] = (counts[r.cat] || 0) + 1;
console.log(counts, "total", recs.length);
const urls = new Set();
for (const r of recs) for (const s of r.src || []) if (s && s[1]) urls.add(s[1]);
fs.writeFileSync(path.join(process.argv[2] || root, "urls.txt"), [...urls].join("\n"));
console.log(urls.size, "source urls ->", path.join(process.argv[2] || root, "urls.txt"));
process.exit(problems ? 1 : 0);
