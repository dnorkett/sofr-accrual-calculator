const {
  toISODate,
  eachDayInclusive,
  daysAct360Fraction,
} = require("../utils/dates");

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

function getDayCountFraction(isoDate, dayCount) {
  if (dayCount === "ACT_360") {
    // ACT/360: fixed 1/360 for each accrual day
    return daysAct360Fraction(1); // 1 day ACT/360
  }

  if (dayCount === "ACT_ACT") {
    // ACT/ACT: 1 / 365 or 1 / 366 based on calendar year
    const denom = daysInYearForISO(isoDate);
    return 1 / denom;
  }

  throw new Error(`Unsupported dayCount: ${dayCount}`);
}

/**
 * Helper: shift an ISO date string (YYYY-MM-DD) by a number of days.
 * Negative days = go backwards.
 */
function shiftISODate(isoDate, days) {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Daily Simple SOFR accrual engine with lookback.
 *
 * - Uses daily SOFR base rates (already carry-forwarded in baseRatesByDate)
 * - For each accrual date D, uses the rate from observation date O = D - lookbackDays
 * - Adds spread (bps) to form all-in rate
 * - Applies day-count convention (ACT/ACT or ACT/360)
 */
function calcDailySimpleSofr({
  principal,
  spreadBps,
  startDate,
  endDate,
  dayCount,
  baseRatesByDate,
  rateIndex,     // e.g. "SOFR_DAILY_SIMPLE"
  lookbackDays,  // integer, 0–99
}) {
  const p = Number(principal);
  if (!Number.isFinite(p) || p <= 0) {
    throw new Error("Invalid principal. Must be a positive number.");
  }

  const spreadBpsNum = Number(spreadBps);
  if (!Number.isFinite(spreadBpsNum) || spreadBpsNum < 0) {
    throw new Error("Invalid spreadBps. Must be 0 or greater.");
  }

  const lb = Number(lookbackDays) || 0;

  const spread = bpsToDecimal(spreadBpsNum);
  const days = eachDayInclusive(startDate, endDate);

  let totalInterest = 0;
  const daily = [];

  for (const d of days) {
    const accrualDate = toISODate(d);           // D
    const observationDate = shiftISODate(accrualDate, -lb); // O = D - lb

    const baseRate = baseRatesByDate[observationDate];

    if (baseRate == null) {
      throw new Error(
        `Missing base rate for observation date ${observationDate}. Import SOFR rates or extend rate range.`
      );
    }

    const allInRate = baseRate + spread; // annualized decimal
    const dcf = getDayCountFraction(accrualDate, dayCount);
    const interest = p * allInRate * dcf;

    totalInterest += interest;

    daily.push({
      date: accrualDate,      // accrual date
      observationDate,        // where the rate actually came from
      baseRate,
      spread,
      allInRate,
      dayCountFraction: dcf,
      interest,
      accruedToDate: totalInterest,
    });
  }

  return {
    rateIndex: rateIndex || "SOFR_DAILY_SIMPLE",
    dayCount,
    lookbackDays: lb,
    principal: p,
    spreadBps: spreadBpsNum,
    startDate,
    endDate,
    totalInterest,
    totalAmount: p + totalInterest,
    daily,
  };
}

module.exports = { calcDailySimpleSofr };
