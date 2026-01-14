function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffDaysInclusive(startISO, endISO) {
  const start = new Date(`${startISO}T00:00:00Z`);
  const end = new Date(`${endISO}T00:00:00Z`);
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
}

async function fetchSofrLastN(n) {
  const url = `https://markets.newyorkfed.org/api/rates/secured/sofr/last/${n}.json`;
  const fetchFn = global.fetch || require("node-fetch"); // Node < 18 needs node-fetch
  const res = await fetchFn(url);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`NY Fed request failed (${res.status}). ${text}`.trim());
  }

  const data = await res.json();
  const refRates = Array.isArray(data?.refRates) ? data.refRates : [];

  // Only care about effectiveDate + percentRate
  // percentRate is in percent (e.g. 3.64) -> decimal (0.0364)
  const rows = refRates
    .filter((r) => r?.type === "SOFR" && r?.effectiveDate && r?.percentRate != null)
    .map((r) => ({
      date: r.effectiveDate,
      rateDecimal: Number(r.percentRate) / 100,
    }))
    // sort ascending to make reporting deterministic
    .sort((a, b) => a.date.localeCompare(b.date));

  return rows;
}

function getMaxDateInDb(db) {
  const row = db.prepare(`SELECT MAX(date) AS maxDate FROM base_rates`).get();
  return row?.maxDate || null;
}

function upsertRates(db, rates) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO base_rates (date, rate)
    VALUES (?, ?)
  `);

  let written = 0;
  const tx = db.transaction((rows) => {
    for (const r of rows) {
      insert.run(r.date, r.rateDecimal);
      written += 1;
    }
  });

  tx(rates);
  return written;
}

/**
 * Import latest SOFR rates from NY Fed.
 * Strategy:
 * - Look at MAX(date) in our DB
 * - Fetch "last N days" from NY Fed (N <= 999)
 * - Upsert anything newer than lastInDb
 *
 * Note: last/{n} caps at 999 days. If the DB is behind by >999 calendar days,
 * import may be partial (we note that in the response).
 */
async function importLatestSofrRates(db) {
  const today = isoToday();
  const lastInDb = getMaxDateInDb(db);

  let lookbackDays = 999;

  if (lastInDb) {
    const startWanted = addDaysISO(lastInDb, 1);
    const needed = diffDaysInclusive(startWanted, today);

    // If nothing is needed, still do a tiny call (or early return).
    if (needed <= 0) {
      return {
        ok: true,
        today,
        lastInDb,
        lookbackDaysRequested: 0,
        fetchedCount: 0,
        upsertedCount: 0,
        importedFrom: null,
        importedTo: null,
        note: "No new dates to import.",
      };
    }

    lookbackDays = Math.min(999, needed);
  }

  const fetched = await fetchSofrLastN(lookbackDays);

  const newOnly =
    lastInDb == null ? fetched : fetched.filter((r) => r.date > lastInDb);

  const written = upsertRates(db, newOnly);

  // newOnly is sorted ascending
  const importedFrom = newOnly.length ? newOnly[0].date : null;
  const importedTo = newOnly.length ? newOnly[newOnly.length - 1].date : null;

  return {
    ok: true,
    today,
    lastInDb,
    lookbackDaysRequested: lookbackDays,
    fetchedCount: fetched.length,
    upsertedCount: written,
    importedFrom,
    importedTo,
    note:
      lastInDb && diffDaysInclusive(addDaysISO(lastInDb, 1), today) > 999
        ? "DB gap exceeds 999 calendar days; NY Fed last/{n} caps at 999. Import may be partial."
        : null,
  };
}

module.exports = { importLatestSofrRates };
