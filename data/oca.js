// Registry that every data file feeds. Loaded first; app.js reads OCA.records.
window.OCA = {
  records: [],
  sources: {},
  byKey: new Map(),
  // curated entries: OCA.add(cat, [{code, title, summary, body, tags, src, rel, template?}])
  add(cat, entries) {
    for (const e of entries) {
      const r = Object.assign({ cat, tags: [], src: [], rel: [], body: "", summary: "" }, e, { onc: 1, curated: true });
      this.records.push(r);
      this.byKey.set(`${cat}:${r.code}`, r);
    }
  },
  // generated code sets: OCA.load(cat, {source, cols, rows}). A generated row whose code already
  // has a curated entry is attached to it (r.raw/r.ix) instead of becoming a second record.
  load(cat, payload) {
    this.sources[cat] = this.sources[cat] || payload.source;
    const ix = Object.fromEntries(payload.cols.map((c, i) => [c, i]));
    for (const row of payload.rows) {
      const key = `${cat}:${row[ix.code]}`;
      const existing = this.byKey.get(key);
      if (existing) { existing.x12 = { raw: row, ix, source: payload.source }; continue; }
      const r = { cat, raw: row, ix, code: row[ix.code], title: ix.title != null ? row[ix.title] : "" };
      if (ix.topics != null) r.x12 = { raw: row, ix, source: payload.source };
      this.records.push(r);
      this.byKey.set(key, r);
    }
  },
};
