function initDb(db) {
  // Daily base rates table (store as decimal, e.g. 0.0532 = 5.32%)
  db.exec(`
    CREATE TABLE IF NOT EXISTS base_rates (
      date TEXT PRIMARY KEY,
      rate REAL NOT NULL
    );
  `);

  // Seed a small date range if empty (demo data)
  const count = db.prepare(`SELECT COUNT(*) as c FROM base_rates`).get().c;
  if (count === 0) {
    const insert = db.prepare(`INSERT INTO base_rates (date, rate) VALUES (?, ?)`);
    const demoRates = [
      ["2026-01-01", 0.0525],
      ["2026-01-02", 0.0525],
      ["2026-01-03", 0.0526],
      ["2026-01-04", 0.0526],
      ["2026-01-05", 0.0527],
      ["2026-01-06", 0.0527],
      ["2026-01-07", 0.0528],
      ["2026-01-08", 0.0528],
      ["2026-01-09", 0.0529],
      ["2026-01-10", 0.0529],
    ];

    const tx = db.transaction(() => {
      for (const [d, r] of demoRates) insert.run(d, r);
    });
    tx();

    console.log("Seeded demo base rates into SQLite.");
  }
}

module.exports = { initDb };
