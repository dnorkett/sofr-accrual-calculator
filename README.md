# SOFR Interest Accrual Calculator
**React + Express + SQLite**

A portfolio project that demonstrates a modern frontend communicating with a backend REST API to calculate loan interest using TERM SOFR–style daily accruals. Users enter loan inputs (principal, spread, dates), while SOFR base rates are sourced from the New York Fed, stored locally, and applied server-side using industry-standard day count conventions.

---

## Why this project

This project is intentionally designed to mirror how real financial systems are built:

- Clear separation of concerns:
  - UI collects inputs
  - API owns business logic
  - Database owns market data
- Real market data ingestion (NY Fed SOFR)
- Explicit, testable accrual logic
- Easy local setup with no external database dependencies

It is meant to be readable, extensible, and explainable, not over-engineered.

---

## Tech stack

### Frontend
- React (Vite)
- Fetch API for backend communication
- Simple, maintainable CSS (no framework dependency)

### Backend
- Node.js
- Express
- CORS enabled for local development

### Database
- SQLite (via `better-sqlite3`)
- Stores daily SOFR base rates as decimals (e.g. `0.0364 = 3.64%`)

---

## Features

### Core functionality
- Input:
  - Principal
  - Spread (basis points)
  - Start date
  - End date
- Base rate is not entered by the user
- Interest is calculated server-side
- Results include:
  - Total interest
  - Total amount (principal + interest)
  - Expandable daily accrual breakdown
- Export daily accruals to CSV

### Accrual methods
- TERM SOFR (ACT/ACT, 365/366) — default
- TERM SOFR (ACT/360)

### Rate handling
- Import latest SOFR rates from the New York Fed
- Automatic handling of weekends and holidays (missing dates carry forward the most recent published rate)

---

## Calculation assumptions (important)

This project implements a simplified but realistic daily accrual model.

### General rules
- All-in rate = `baseRate + spread`
- Base rates are stored as decimals (e.g. `0.0364 = 3.64%`)
- Accrual is calculated daily, even on non-business days

### Day count conventions

#### TERM SOFR (ACT/ACT)
- Daily fraction = `1 / 365` or `1 / 366` (leap year aware)

#### TERM SOFR (ACT/360)
- Daily fraction = `1 / 360`

### Missing rate days (weekends / holidays)
- If no SOFR rate exists for a date, the most recent prior business day’s rate is used (carry-forward)
- If no earlier rate exists in the database, the API returns a clear error prompting rate import

> This behavior reflects common real-world loan accrual practices.

---

## Project structure

```
sofr-accrual-app/
  README.md

  server/
    src/
      db/
        database.js         Opens SQLite database
        init.js             Creates tables (no seeded demo data)
      routes/
        rates.js            GET /api/rates
                            POST /api/rates/import-latest
        calc.js             POST /api/calc
      services/
        accrualService.js   ACT/ACT and ACT/360 accrual engines
        calculationService.js Accrual method dispatcher
        rateService.js      Daily rate mapping + carry-forward logic
        sofrImportService.js NY Fed SOFR import logic
      utils/
        dates.js            Date helpers (inclusive ranges, day counts)
      server.js             Express bootstrap
    .env                    Local config (not committed)
    package.json

  client/
    src/
      App.jsx               UI, validation, CSV export, rate import
      index.css             Theme variables + layout
    vite.config.js          Dev server config
    package.json
```

---

## Local setup

### Prerequisites
- Node.js (LTS recommended)
- npm

### 1) Start the backend

```bash
cd server
npm install
npm run dev
```

Backend runs at: `http://localhost:3001`

Health check:

```bash
curl http://localhost:3001/health
```

### 2) Start the frontend

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Environment variables

Backend: `server/.env`

```env
PORT=3001
CORS_ORIGIN=http://localhost:5173
DB_PATH=./data/app.db
```

---

## API

### Import latest SOFR rates

Imports recent SOFR fixings from the New York Fed and upserts them into SQLite.

- `POST /api/rates/import-latest`

Example:

```bash
curl -X POST http://localhost:3001/api/rates/import-latest
```

### Get base rates

- `GET /api/rates?start=YYYY-MM-DD&end=YYYY-MM-DD`

Example:

```bash
curl "http://localhost:3001/api/rates?start=2026-01-01&end=2026-01-10"
```

### Calculate accrual

- `POST /api/calc`

Body:

```json
{
  "principal": 1000000,
  "spreadBps": 250,
  "startDate": "2026-01-09",
  "endDate": "2026-01-12",
  "method": "TERM_SOFR_ACT_ACT"
}
```

Example:

```bash
curl -X POST http://localhost:3001/api/calc \
  -H "Content-Type: application/json" \
  -d '{"principal":1000000,"spreadBps":250,"startDate":"2026-01-09","endDate":"2026-01-12","method":"TERM_SOFR_ACT_ACT"}'
```

---

## Common issues

### “Missing base rate” error
- No SOFR rates exist on or before the requested start date.
- Fix: click **Import latest rates** in the UI or call the import endpoint.

### CORS errors
Ensure:
- backend is running on `3001`
- frontend is running on `5173`
- `CORS_ORIGIN` in `server/.env` matches the frontend URL

---

## Roadmap ideas

- Flag carried-forward days in the daily breakdown
- Data freshness indicator (last SOFR date imported)
- Unit tests for accrual engine
- Rate admin UI (CSV upload)
- Persist calculation history
- Charts (daily accrual curve)

---

## License

MIT
