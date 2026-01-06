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
  getDailyBaseRatesList,
};
