const { calcTermSofrAct360, calcTermSofrActAct } = require("./accrualService");

function calculateAccrual({
  principal,
  spreadBps,
  startDate,
  endDate,
  method,
  baseRatesByDate,
}) {
  const selected = method || "TERM_SOFR_ACT_ACT"; // DEFAULT

  if (selected === "TERM_SOFR_ACT_ACT") {
    return calcTermSofrActAct({
      principal,
      spreadBps,
      startDate,
      endDate,
      baseRatesByDate,
    });
  }

  if (selected === "TERM_SOFR_ACT_360") {
    return calcTermSofrAct360({
      principal,
      spreadBps,
      startDate,
      endDate,
      baseRatesByDate,
    });
  }

  throw new Error(
    `Unsupported method: ${selected}. Supported: TERM_SOFR_ACT_ACT, TERM_SOFR_ACT_360`
  );
}

module.exports = { calculateAccrual };
