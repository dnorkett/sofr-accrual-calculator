function initDb(db) {
  // Daily base rates table (store as decimal, e.g. 0.0532 = 5.32%)
  db.exec(`
    CREATE TABLE IF NOT EXISTS base_rates (
      date TEXT PRIMARY KEY,
      rate REAL NOT NULL
    );
  `);
}

module.exports = { initDb };
