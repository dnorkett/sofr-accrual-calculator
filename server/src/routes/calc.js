const express = require("express");
const { getDailyBaseRatesMap } = require("../services/rateService");
const { calculateAccrual } = require("../services/calculationService");

function calcRouter(db) {
  const router = express.Router();

  // POST /api/calc
  router.post("/", (req, res) => {
    const { principal, spreadBps, startDate, endDate, method } = req.body;

    // NOTE: use == null so 0 is allowed (spreadBps can be 0)
    if (principal == null || spreadBps == null || !startDate || !endDate) {
      return res.status(400).json({
        message: "principal, spreadBps, startDate, endDate required",
      });
    }

    try {
      const { baseRatesByDate } = getDailyBaseRatesMap(db, startDate, endDate);

      const result = calculateAccrual({
        principal,
        spreadBps,
        startDate,
        endDate,
        method,
        baseRatesByDate,
      });

      res.json(result);
    } catch (e) {
      const msg = e.message || "Calculation failed";
      const hint = msg.startsWith("Missing base rate")
        ? "Try a date range within the seeded demo window, or extend seed data in server/src/db/init.js."
        : undefined;

      res.status(400).json({ message: msg, hint });
    }
  });

  return router;
}

module.exports = { calcRouter };
