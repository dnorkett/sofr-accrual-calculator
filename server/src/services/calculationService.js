const { calcTermSofrAct360 } = require("./accrualService");

/**
 * Minimal orchestration layer:
 * - chooses method
 * - calls the appropriate calculator
 * - keeps a consistent error surface for routes
 */
function calculateAccrual({ principal, spreadBps, startDate, endDate, method, baseRatesByDate }) {
  const selected = method || "TERM_SOFR_ACT360";

  if (selected !== "TERM_SOFR_ACT360") {
    throw new Error("Only TERM_SOFR_ACT360 supported for now");
  }

  return calcTermSofrAct360({
    principal,
    spreadBps,
    startDate,
    endDate,
    baseRatesByDate,
  });
}

module.exports = { calculateAccrual };
