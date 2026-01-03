require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { openDb } = require("./db/database");
const { initDb } = require("./db/init");
const { ratesRouter } = require("./routes/rates");
const { calcRouter } = require("./routes/calc");

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
  })
);

const db = openDb(process.env.DB_PATH || "./data/app.db");
initDb(db);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/rates", ratesRouter(db));
app.use("/api/calc", calcRouter(db));

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
