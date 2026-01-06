const express = require("express");
const { getDailyBaseRatesList } = require("../services/rateService");

function ratesRouter(db) {
  const router = express.Router();

  // GET /api/rates?start=YYYY-MM-DD&end=YYYY-MM-DD
  router.get("/", (req, res) => {
    try {
      const { start, end } = req.query;

      if (!start || !end) {
        return res.status(400).json({ message: "start and end are required" });
      }

      const rates = getDailyBaseRatesList(db, start, end);
      res.json({ start, end, rates });
    } catch (e) {
      res.status(400).json({ message: e.message || "Invalid date range" });
    }
  });

  return router;
}

module.exports = { ratesRouter };
