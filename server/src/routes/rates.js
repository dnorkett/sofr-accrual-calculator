const express = require("express");
const { eachDayInclusive, toISODate } = require("../utils/dates");
const { importLatestSofrRates } = require("../services/sofrImportService");

function ratesRouter(db) {
  const router = express.Router();

  // Prepare once (minor perf + cleaner)
  const getRateByDateStmt = db.prepare(
    `SELECT date, rate FROM base_rates WHERE date = ?`
  );

  // GET /api/rates?start=YYYY-MM-DD&end=YYYY-MM-DD
  router.get("/", (req, res) => {
    try {
      const { start, end } = req.query;

      if (!start || !end) {
        return res.status(400).json({ message: "start and end are required" });
      }

      const days = eachDayInclusive(start, end).map(toISODate);
      const rates = days.map((date) => getRateByDateStmt.get(date) || { date, rate: null });

      res.json({ start, end, rates });
    } catch (e) {
      res.status(400).json({ message: e.message || "Invalid date range" });
    }
  });

  // POST /api/rates/import-latest
  router.post("/import-latest", async (req, res) => {
    try {
      const result = await importLatestSofrRates(db);
      res.json(result);
    } catch (e) {
      res.status(500).json({
        message: e.message || "Import failed",
        hint: "Check server logs and confirm NY Fed endpoint is reachable from this machine.",
      });
    }
  });

  return router;
}

module.exports = { ratesRouter };
