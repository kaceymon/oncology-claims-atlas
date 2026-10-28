// Registry that every data file feeds. Loaded first; app.js reads OCA.records.
window.OCA = {
  records: [],
  sources: {},
  // curated entries: OCA.add(cat, [{code, title, summary, body, tags, src, rel, template?}])
  add(cat, entries) {
    for (const e of entries) this.records.push(Object.assign({ cat, tags: [], src: [], rel: [], body: "", summary: "" }, e, { onc: 1, curated: true }));
  },
  // generated code sets: OCA.load(cat, {source, cols, rows})
  load(cat, payload) {
    this.sources[cat] = payload.source;
    const ix = Object.fromEntries(payload.cols.map((c, i) => [c, i]));
    for (const r of payload.rows) this.records.push(Object.assign({ cat, raw: r, ix }, { code: r[ix.code], title: r[ix.title] }));
  },
};
