const { toISODate, eachDayInclusive, daysAct360Fraction } = require("../utils/dates");

// Accept spread in basis points (bps) and convert to a decimal rate.
// Example: 250 bps => 0.025
function bpsToDecimal(bps) {
  return Number(bps) / 10000;
}

function isLeapYear(year) {
  // leap year if divisible by 4, except centuries not divisible by 400
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInYearForISO(isoDate) {
  const year = Number(isoDate.slice(0, 4));
  return isLeapYear(year) ? 366 : 365;
}

function calcTermSofrAct360({
  principal,
  spreadBps,
  startDate,
  endDate,
  baseRatesByDate,
}) {
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
      throw new Error(
        `Missing base rate for ${iso}. Seed DB or extend rate range.`
      );
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
    method: "TERM_SOFR_ACT_360",
    principal: p,
    spreadBps: spreadBpsNum,
    startDate,
    endDate,
    totalInterest,
    totalAmount: p + totalInterest,
    daily,
  };
}

function calcTermSofrActAct({
  principal,
  spreadBps,
  startDate,
  endDate,
  baseRatesByDate,
}) {
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

  let totalInterest = 0;
  const daily = [];

  for (const d of days) {
    const iso = toISODate(d);
    const baseRate = baseRatesByDate[iso];

    if (baseRate == null) {
      throw new Error(
        `Missing base rate for ${iso}. Seed DB or extend rate range.`
      );
    }

    const allInRate = baseRate + spread; // annualized decimal
    const denom = daysInYearForISO(iso); // 365 or 366
    const dcf = 1 / denom;

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
    method: "TERM_SOFR_ACT_ACT",
    principal: p,
    spreadBps: spreadBpsNum,
    startDate,
    endDate,
    totalInterest,
    totalAmount: p + totalInterest,
    daily,
  };
}

module.exports = { calcTermSofrAct360, calcTermSofrActAct };
