const express = require("express");
const { eachDayInclusive, toISODate } = require("../utils/dates");
const { calcTermSofrAct360 } = require("../services/accrualService");


function calcRouter(db) {
  const router = express.Router();

  // POST /api/calc
  router.post("/", (req, res) => {
    const { principal, spreadBps, startDate, endDate, method } = req.body;

    if (!principal || !spreadBps || !startDate || !endDate) {
      return res.status(400).json({ message: "principal, spreadBps, startDate, endDate required" });
    }

    const selected = method || "TERM_SOFR_ACT360";
    if (selected !== "TERM_SOFR_ACT360") {
      return res.status(400).json({ message: "Only TERM_SOFR_ACT360 supported for now" });
    }

    // Pull needed base rates from DB into a map
    const days = eachDayInclusive(startDate, endDate).map(toISODate);
    const stmt = db.prepare(`SELECT rate FROM base_rates WHERE date = ?`);
    const baseRatesByDate = {};
    for (const date of days) {
      const row = stmt.get(date);
      baseRatesByDate[date] = row ? row.rate : null;
    }

    try {
      const result = calcTermSofrAct360({
        principal,
        spreadBps,
        startDate,
        endDate,
        baseRatesByDate,
      });
      res.json(result);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  });

  return router;
}

module.exports = { calcRouter };
