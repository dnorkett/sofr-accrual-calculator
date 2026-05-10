# SOFR Accrual Backend

Express + SQLite backend for the SOFR Interest Accrual Calculator.

The backend imports SOFR rates, stores them locally, applies carry-forward behavior for missing dates, and calculates Daily Simple SOFR interest accruals server-side.

## Tech Stack

- Node.js
- Express
- SQLite via `better-sqlite3`
- `dotenv` for environment configuration
- `nodemon` for local development

## Commands

Run these from `server/`:

```bash
npm install
npm run dev
npm start
```

## Local Development

The API defaults to:

```text
http://localhost:3001
```

Health check:

```bash
curl http://localhost:3001/health
```

## Environment Variables

Configured in `server/.env`:

```env
PORT=3001
CORS_ORIGIN=http://localhost:5173
DB_PATH=./data/app.db
```

## Source Layout

```text
server/
  src/
    db/
      database.js           Opens SQLite database
      init.js               Creates required tables
    routes/
      calc.js               POST /api/calc
      rates.js              GET /api/rates, POST /api/rates/import-latest
    services/
      accrualService.js     Daily Simple SOFR accrual engine
      calculationService.js Selects calculation engine
      rateService.js        Rate lookup and carry-forward behavior
      sofrImportService.js  NY Fed SOFR import logic
    utils/
      dates.js              Date helpers and day-count utilities
    server.js               Express bootstrap
  data/
    app.db                  Local SQLite database when using default DB_PATH
```

## API

### `GET /health`

Returns API health:

```json
{
  "status": "ok"
}
```

### `GET /api/rates?start=YYYY-MM-DD&end=YYYY-MM-DD`

Returns stored base rates for each day in the requested range.

### `POST /api/rates/import-latest`

Imports recent SOFR rates from the New York Fed and upserts them into SQLite.

### `POST /api/calc`

Calculates interest accrual.

Example body:

```json
{
  "principal": 1000000,
  "spreadBps": 250,
  "startDate": "2026-01-01",
  "endDate": "2026-01-10",
  "rateIndex": "SOFR_DAILY_SIMPLE",
  "dayCount": "ACT_ACT",
  "lookbackDays": 5
}
```

## Calculation Responsibilities

The backend owns:

- Authoritative validation for calculation requests.
- SOFR rate import.
- SQLite persistence.
- Base-rate carry-forward behavior.
- Daily Simple SOFR accrual logic.
- Day-count convention handling.
- Lookback observation date handling.

## Notes

- Base rates are stored as decimals, such as `0.0364` for `3.64%`.
- Daily accrual currently happens for every calendar day in the requested date range.
- Missing observation dates use the most recent prior published rate.
- Update this README when endpoint behavior, environment variables, database shape, or calculation assumptions change.
