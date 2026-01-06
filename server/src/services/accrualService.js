const { toISODate, eachDayInclusive, daysAct360Fraction } = require("../utils/dates");

// accept spread in basis points (bps) and convert to a decimal rate.
// Example: 250 bps => 0.025
function bpsToDecimal(bps) {
  return Number(bps) / 10000;
}

function calcTermSofrAct360({ principal, spreadBps, startDate, endDate, baseRatesByDate }) {
  const p = Number(principal);
  if (!Number.isFinite(p) || p <= 0) {
    throw new Error("Invalid principal. Must be a positive number.");
  }

  const spreadBpsNum = Number(spreadBps);
  if (!Number.isFinite(spreadBpsNum) || spreadBpsNum < 0) {
    throw new Error("Invalid spreadBps. Must be 0 or greater.");
  }

  const spread = bpsToDecimal(spreadBpsNum);
  const days = eachDayInclusive(startDate, endDate);

  const dcf = daysAct360Fraction(1); // 1 day ACT/360

  let totalInterest = 0;
  const daily = [];

  for (const d of days) {
    const iso = toISODate(d);
    const baseRate = baseRatesByDate[iso];

    if (baseRate == null) {
      throw new Error(`Missing base rate for ${iso}. Seed DB or extend rate range.`);
    }

    const allInRate = baseRate + spread; // annualized decimal
    const interest = p * allInRate * dcf;

    totalInterest += interest;

    daily.push({
      date: iso,
      baseRate,
      spread,
      allInRate,
      dayCountFraction: dcf,
      interest,
      accruedToDate: totalInterest,
    });
  }

  return {
    method: "TERM_SOFR_ACT360",
    principal: p,
    spreadBps: spreadBpsNum,
    startDate,
    endDate,
    totalInterest,
    totalAmount: p + totalInterest,
    daily,
  };
}

module.exports = { calcTermSofrAct360 };
