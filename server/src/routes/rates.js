const express = require("express");
const { eachDayInclusive, toISODate } = require("../utils/dates");

function ratesRouter(db) {
  const router = express.Router();

  // GET /api/rates?start=YYYY-MM-DD&end=YYYY-MM-DD
  router.get("/", (req, res) => {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ message: "start and end are required" });

    const days = eachDayInclusive(start, end).map(toISODate);

    const stmt = db.prepare(`SELECT date, rate FROM base_rates WHERE date = ?`);
    const rates = days.map((date) => stmt.get(date) || { date, rate: null });

    res.json({ start, end, rates });
  });

  return router;
}

module.exports = { ratesRouter };
