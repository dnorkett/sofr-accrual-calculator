function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function parseISODate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new Error(`Invalid date format (expected YYYY-MM-DD): ${s}`);
  }
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${s}`);
  return d;
}

// Returns an array of Date objects for each day from start to end, inclusive.
function eachDayInclusive(startISO, endISO) {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  if (end < start) throw new Error("endDate must be >= startDate");

  const days = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

// ACT/360: for 1 day -> 1/360
function daysAct360Fraction(days) {
  return Number(days) / 360;
}

module.exports = { toISODate, parseISODate, eachDayInclusive, daysAct360Fraction };
