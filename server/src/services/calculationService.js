const { calcTermSofrAct360, calcActAct } = require("./accrualService");

function calculateAccrual({ principal, spreadBps, startDate, endDate, method, baseRatesByDate }) {
  const selected = method || "SOFR_ACT_ACT"; // NEW DEFAULT

  if (selected === "SOFR_ACT_ACT") {
    return calcActAct({ principal, spreadBps, startDate, endDate, baseRatesByDate });
  }

  if (selected === "SOFR_ACT360") {
    return calcTermSofrAct360({ principal, spreadBps, startDate, endDate, baseRatesByDate });
  }

  throw new Error("Unsupported method");
}

module.exports = { calculateAccrual };

