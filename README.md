# SOFR Interest Accrual Calculator
**React + Express + SQLite**

A project demonstrating a modern frontend communicating with a backend REST API to calculate loan interest using **Daily Simple SOFR** with selectable **day-count conventions**. Users enter loan inputs (principal, spread, dates), while SOFR base rates are sourced from the New York Fed, stored locally, and applied server-side using realistic daily accrual practices.

---

## Why this project

This project is intentionally designed to mirror real-world financial system design:

- Clear separation of concerns:
  - **UI** collects inputs  
  - **API** owns business logic  
  - **Database** stores market data
- Real market data ingestion (NY Fed SOFR)
- Explicit, testable accrual logic
- Easy local setup (SQLite; no external DB dependencies)
- Clean, readable architecture suitable for demos or portfolio projects

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
- SQLite (`better-sqlite3`)
- Stores daily SOFR base rates as decimals (e.g., `0.0364 = 3.64%`)

---

## Features

### Core functionality
- User inputs:
  - Principal  
  - Spread (basis points)
  - Start date  
  - End date  
  - **Reference rate** (currently: SOFR – Daily Simple)  
  - **Day-count convention** (ACT/ACT or ACT/360)

- Interest is calculated **server-side**
- Results include:
  - Total interest
  - Total amount (principal + interest)
  - Expandable daily breakdown
- Export daily accruals to CSV

### Accrual logic
- Reference rate: **SOFR – Daily Simple**  
- Day-count conventions:
  - **ACT/ACT** (365 or 366)
  - **ACT/360** (fixed 1/360)
- Daily interest accrues for every calendar day in the range
- Spread is applied as an annualized decimal (e.g., 250 bps → 0.025)

### Rate handling
- Import latest SOFR rates from the New York Fed
- Automatic handling of weekends/holidays:
  - Missing dates use a **carry-forward** of the most recent business day’s rate

---

## Calculation assumptions (important)

This project implements a simplified but realistic **Daily Simple SOFR** daily accrual model.

### General rules
- All-in rate = `baseRate + spread`
- Base rates stored as decimals (e.g. 0.0364 = 3.64%)
- Daily accrual happens **every calendar day**, even on weekends & holidays

### Day-count conventions
- **ACT/ACT**  
  - Daily fraction = `1 / 365` or `1 / 366` depending on calendar year  
- **ACT/360**  
  - Daily fraction = `1 / 360`

### Missing rate days
- If no SOFR exists for a date:
  - Use the most recent prior rate (carry-forward)
- If no earlier rate exists at all:
  - The API returns an error prompting the user to import rates first

---

## Project structure

```
sofr-accrual-app/
  README.md

  server/
    src/
      db/
        database.js          Opens SQLite database
        init.js              Creates tables
      routes/
        rates.js             GET /api/rates
                             POST /api/rates/import-latest
        calc.js              POST /api/calc (new: rateIndex + dayCount)
      services/
        accrualService.js    Daily Simple SOFR accrual engine
        calculationService.js Selects engine based on rateIndex + dayCount
        rateService.js       Daily rate mapping + carry-forward logic
        sofrImportService.js NY Fed SOFR import logic
      utils/
        dates.js             Date helpers (ranges, day-count utilities)
      server.js              Express bootstrap
    .env

  client/
    src/
      App.jsx                Updated UI with rateIndex + dayCount
      index.css              Theme variables + layout
    vite.config.js
```

---

## Local setup

### Prerequisites
- Node.js (LTS recommended)
- npm

---

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

---

### 2) Start the frontend

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

`POST /api/rates/import-latest`

Imports recent SOFR fixings from the New York Fed and upserts them into SQLite.

---

### Get base rates

`GET /api/rates?start=YYYY-MM-DD&end=YYYY-MM-DD`

Returns the daily base rates (with carry-forward applied).

---

### Calculate accrual

`POST /api/calc`

Body:

```json
{
  "principal": 1000000,
  "spreadBps": 250,
  "startDate": "2026-01-01",
  "endDate": "2026-01-10",
  "rateIndex": "SOFR_DAILY_SIMPLE",
  "dayCount": "ACT_ACT"
}
```

---

## Common issues

### “Missing base rate” error
- No SOFR rates exist before the requested date range  
- Fix: click **Import latest rates** in the UI  

### CORS errors
Ensure:
- backend is running on `3001`
- frontend is running on `5173`
- `CORS_ORIGIN` matches the frontend URL

---

## Roadmap ideas

- CME Term SOFR support (1M, 3M)
- Flag carried-forward days in the daily breakdown
- Data freshness indicator (last imported SOFR date)
- Unit tests for the accrual engine
- Persist calculation history
- Charts (daily accrual curve)
- Inline “info” tooltips for rates, spreads, and conventions

---

## License

MIT
