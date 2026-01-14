const { eachDayInclusive, toISODate } = require("../utils/dates");

/**
 * Fetch daily base rates for an inclusive date range.
 * Returns:
 *  - days: ["YYYY-MM-DD", ...]
 *  - baseRatesByDate: { "YYYY-MM-DD": decimalRate | null }
 */
function getDailyBaseRatesMap(db, startDate, endDate) {
  const days = eachDayInclusive(startDate, endDate).map(toISODate);

  const stmt = db.prepare(`SELECT rate FROM base_rates WHERE date = ?`);
  const baseRatesByDate = {};

  for (const date of days) {
    const row = stmt.get(date);
    baseRatesByDate[date] = row ? row.rate : null;
  }

  return { days, baseRatesByDate };
}

/**
 * Fetch daily base rates for an inclusive date range,
 * filling missing days by carrying forward the most recent prior rate.
 *
 * Example: if Sat/Sun are missing, they use Friday's rate.
 *
 * Returns:
 *  - days: ["YYYY-MM-DD", ...]
 *  - baseRatesByDate: { "YYYY-MM-DD": decimalRate }  (never null if we can carry-forward)
 */
function getDailyBaseRatesMapCarryForward(db, startDate, endDate) {
  const days = eachDayInclusive(startDate, endDate).map(toISODate);

  // Find the most recent rate on or before startDate.
  // This allows us to carry forward on day 1 if startDate itself is missing.
  const seedRow = db
    .prepare(
      `
      SELECT date, rate
      FROM base_rates
      WHERE date <= ?
      ORDER BY date DESC
      LIMIT 1
    `
    )
    .get(startDate);

  if (!seedRow) {
    throw new Error(
      `Missing base rate for ${startDate}. No earlier rate exists to carry forward. Import rates first.`
    );
  }

  let lastRate = seedRow.rate;

  // For exact matches within the requested range, we'll use them and update lastRate.
  const stmt = db.prepare(`SELECT rate FROM base_rates WHERE date = ?`);

  const baseRatesByDate = {};
  for (const date of days) {
    const row = stmt.get(date);

    if (row && row.rate != null) {
      lastRate = row.rate;
      baseRatesByDate[date] = row.rate;
    } else {
      // Weekend/holiday/missing day: carry forward the last known rate
      baseRatesByDate[date] = lastRate;
    }
  }

  return { days, baseRatesByDate };
}

/**
 * Fetch daily base rates as a list for the rates endpoint.
 * Returns: [{ date, rate }, ...] (rate can be null)
 */
function getDailyBaseRatesList(db, startDate, endDate) {
  const days = eachDayInclusive(startDate, endDate).map(toISODate);

  const stmt = db.prepare(`SELECT date, rate FROM base_rates WHERE date = ?`);
  return days.map((date) => stmt.get(date) || { date, rate: null });
}

module.exports = {
  getDailyBaseRatesMap,
  getDailyBaseRatesMapCarryForward,
  getDailyBaseRatesList,
};
