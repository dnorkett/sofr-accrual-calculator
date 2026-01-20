const express = require("express");
const { getDailyBaseRatesMapCarryForward } = require("../services/rateService");
const { calculateAccrual } = require("../services/calculationService");

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

    try {
      const { baseRatesByDate } = getDailyBaseRatesMapCarryForward(
        db,
        startDate,
        endDate
      );

      const result = calculateAccrual({
        principal,
        spreadBps,
        startDate,
        endDate,
        rateIndex,
        dayCount,
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
