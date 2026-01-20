const { calcDailySimpleSofr } = require("./accrualService");

const SUPPORTED_RATE_INDEXES = new Set([
  "SOFR_DAILY_SIMPLE",
  // later: "CME_TERM_SOFR_1M", etc.
]);

const SUPPORTED_DAY_COUNTS = new Set([
  "ACT_ACT",
  "ACT_360",
]);

function calculateAccrual({
  principal,
  spreadBps,
  startDate,
  endDate,
  rateIndex,
  dayCount,
  baseRatesByDate,
}) {
  if (!SUPPORTED_RATE_INDEXES.has(rateIndex)) {
    throw new Error(
      `Unsupported rateIndex: ${rateIndex}. Supported: ${Array.from(
        SUPPORTED_RATE_INDEXES
      ).join(", ")}`
    );
  }

  if (!SUPPORTED_DAY_COUNTS.has(dayCount)) {
    throw new Error(
      `Unsupported dayCount: ${dayCount}. Supported: ${Array.from(
        SUPPORTED_DAY_COUNTS
      ).join(", ")}`
    );
  }

  // For now, all supported rate indexes use the same daily simple SOFR engine.
  // Later you can branch here if TERM SOFR uses different logic.
  if (rateIndex === "SOFR_DAILY_SIMPLE") {
    return calcDailySimpleSofr({
      principal,
      spreadBps,
      startDate,
      endDate,
      dayCount,
      baseRatesByDate,
      rateIndex,
    });
  }

  // Defensive fallback (shouldn't be reached because of the has() check above)
  throw new Error(`No accrual engine implemented for rateIndex: ${rateIndex}`);
}

module.exports = { calculateAccrual };
