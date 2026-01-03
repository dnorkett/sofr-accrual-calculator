const { toISODate, eachDayInclusive, daysAct360Fraction } = require("../utils/dates");

// spread can be provided as percent (e.g. 2.50) or bps (e.g. 250)
// we’ll accept bps in API for clarity and convert to decimal
function bpsToDecimal(bps) {
  return Number(bps) / 10000; // 250 bps => 0.025
}

function calcTermSofrAct360({ principal, spreadBps, startDate, endDate, baseRatesByDate }) {
  const p = Number(principal);
  const spread = bpsToDecimal(spreadBps);

  const days = eachDayInclusive(startDate, endDate);

  let totalInterest = 0;
  const daily = [];

  for (const d of days) {
    const iso = toISODate(d);
    const baseRate = baseRatesByDate[iso];

    if (baseRate == null) {
      // You can choose: error, or skip, or nearest previous
      // For portfolio simplicity: throw a clear error
      throw new Error(`Missing base rate for ${iso}. Seed DB or extend rate range.`);
    }

    const allInRate = baseRate + spread; // annualized decimal
    const dcf = daysAct360Fraction(1); // 1 day ACT/360

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
    spreadBps: Number(spreadBps),
    startDate,
    endDate,
    totalInterest,
    totalAmount: p + totalInterest,
    daily,
  };
}

module.exports = { calcTermSofrAct360 };
