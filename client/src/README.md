# SOFR Interest Accrual Calculator (React + Express + SQLite)

A simple project that demonstrates a modern front end talking to a backend REST API. Users enter loan inputs (principal, spread, start/end dates), while the base rate is stored in a local database and retrieved by the backend. The backend calculates interest using a TERM SOFR-style daily accrual with ACT/360 day count and returns both a total and a day-by-day breakdown.

## Why this project
- Clean separation of concerns (UI collects inputs, API owns business logic and data)
- Easy local setup (SQLite database stored as a single file)
- Built for extension: additional accrual methods, better rate sourcing, persistence, charts, etc.

## Tech stack
Frontend
- React (Vite)

Backend
- Node.js + Express
- CORS enabled for local development

Database
- SQLite (via better-sqlite3) for local base rates (no server required)

## Features
- Input: principal, spread (bps), start date, end date
- Base rate is NOT entered by user (stored in backend database)
- Calculation performed server-side
- Output:
  - Total interest
  - Total amount (principal + interest)
  - Expandable daily accrual table
- Accrual method dropdown (only TERM SOFR ACT/360 for now)

## Calculation assumptions (important)
This project implements a simplified daily accrual:

- Day count: ACT/360
- All-in annual rate: baseRate + spread
- Daily interest: principal * allInRate * (1/360)

Notes:
- The base rate is stored daily in SQLite as a decimal (e.g. 0.0525 = 5.25%).
- If the requested date range includes dates without a stored base rate, the API returns a clear error.
- In real loan documentation, conventions may include business day calendars, lookbacks, compounding, rounding rules, etc. Those can be added later.

## Project structure

sofr-accrual-app/
  README.md

  server/
    src/
      db/
        database.js       opens SQLite file
        init.js           creates tables + seeds demo base rates
      routes/
        rates.js          GET /api/rates
        calc.js           POST /api/calc (main calculation)
      services/
        accrualService.js TERM SOFR ACT/360 calculation
      utils/
        dates.js          date helpers (inclusive day iteration, ACT/360 fraction)
      middleware/
        validateCalc.js   input validation (added next)
      server.js           Express bootstrap
    .env                  local config (not committed)
    package.json

  client/
    src/
      App.jsx             UI + API call
      index.css           theme variables + layout
    package.json

## Local setup

### Prerequisites
- Node.js (LTS recommended)
- npm

### 1) Start the backend
cd server
npm install
npm run dev

Backend runs at: http://localhost:3001

Health check:
curl http://localhost:3001/health

### 2) Start the frontend
Open a second terminal tab:

cd client
npm install
npm run dev

Frontend runs at: http://localhost:5173

## Environment variables

Backend: server/.env
PORT=3001
CORS_ORIGIN=http://localhost:5173
DB_PATH=./data/app.db

## API

### GET base rates
GET /api/rates?start=YYYY-MM-DD&end=YYYY-MM-DD

Example:
curl "http://localhost:3001/api/rates?start=2026-01-01&end=2026-01-10"

### Calculate accrual
POST /api/calc

Body:
{
  "principal": 1000000,
  "spreadBps": 250,
  "startDate": "2026-01-01",
  "endDate": "2026-01-10",
  "method": "TERM_SOFR_ACT360"
}

Example:
curl -X POST http://localhost:3001/api/calc \
  -H "Content-Type: application/json" \
  -d '{"principal":1000000,"spreadBps":250,"startDate":"2026-01-01","endDate":"2026-01-10","method":"TERM_SOFR_ACT360"}'

## Common issues

### Missing base rate for YYYY-MM-DD
The demo database only seeds a small date range. Extend the seeded data in:
server/src/db/init.js


### CORS errors in the browser
Make sure:
- backend is running on 3001
- frontend is running on 5173
- CORS_ORIGIN in server/.env matches the frontend URL

## Roadmap ideas
- Add input validation + better UX messaging (next step)
- Support additional accrual conventions
- Add “rate admin” UI (upload CSV)
- Persist calculations (history)
- Add charts (daily accrual curve)

## License
MIT 