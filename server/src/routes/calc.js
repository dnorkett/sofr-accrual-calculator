const express = require("express");
const { getDailyBaseRatesMapCarryForward } = require("../services/rateService");

/**
 * We’ll get the accrual engine from calculationService.
 */
const { calculateAccrual } = require("../services/calculationService");

/**
 * Helper: shift an ISO date string (YYYY-MM-DD) by a number of days.
 * Negative days = go backwards.
 */
function shiftISODate(isoDate, days) {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function calcRouter(db) {
  const router = express.Router();

  // POST /api/calc
  router.post("/", (req, res) => {
    const {
      principal,
      spreadBps,
      startDate,
      endDate,
      rateIndex,
      dayCount,
      lookbackDays,
    } = req.body;

    // NOTE: use == null so 0 is allowed (spreadBps can be 0)
    if (
      principal == null ||
      spreadBps == null ||
      !startDate ||
      !endDate ||
      !rateIndex ||
      !dayCount
    ) {
      return res.status(400).json({
        message:
          "principal, spreadBps, startDate, endDate, rateIndex, dayCount required",
      });
    }

    // Lookback: default 5 if not provided
    let lb = lookbackDays;
    if (lb == null || lb === "") {
      lb = 5;
    }
    lb = Number(lb);

    if (
      !Number.isFinite(lb) ||
      !Number.isInteger(lb) ||
      lb < 0 ||
      lb > 99
    ) {
      return res.status(400).json({
        message: "lookbackDays must be an integer between 0 and 99.",
      });
    }

    try {
      // Observation window starts at startDate - lookbackDays
      const observationStart = shiftISODate(startDate, -lb);

      const { baseRatesByDate } = getDailyBaseRatesMapCarryForward(
        db,
        observationStart,
        endDate
      );

      const result = calculateAccrual({
        principal,
        spreadBps,
        startDate,
        endDate,
        rateIndex,
        dayCount,
        lookbackDays: lb,
        baseRatesByDate,
      });

      res.json(result);
    } catch (e) {
      const msg = e.message || "Calculation failed";
      const hint = msg.startsWith("Missing base rate")
        ? "Try importing SOFR rates or choose a date range where rates exist in your DB."
        : undefined;

      res.status(400).json({ message: msg, hint });
    }
  });

  return router;
}

module.exports = { calcRouter };
