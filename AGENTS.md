# AGENTS.md

## Project

SOFR Interest Accrual Calculator is a React frontend and Express/SQLite backend for calculating Daily Simple SOFR interest accruals with spread, day-count, and lookback settings.

## Repository Layout

- `client/`: React + Vite frontend.
- `server/`: Express API, SQLite setup, SOFR import, and accrual calculation logic.
- `README.md`: Product overview, setup, API notes, and roadmap.

## Commands

Run frontend commands from `client/`:

- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Preview build: `npm run preview`

Run backend commands from `server/`:

- Install: `npm install`
- Dev server: `npm run dev`
- Production start: `npm start`

## Local Runtime

- Backend defaults to `http://localhost:3001`.
- Frontend defaults to `http://localhost:5173`.
- Backend environment lives in `server/.env`.
- SQLite data defaults to `server/data/app.db`.

## Engineering Guidelines

- Keep frontend and backend concerns separate.
- Put user interaction, form validation, and display behavior in `client/`.
- Put interest calculation, rate lookup, import, and persistence behavior in `server/`.
- Avoid changing financial assumptions without updating documentation and examples.
- Keep calculations deterministic and easy to test.
- Preserve existing CommonJS style in `server/`.
- Preserve existing React functional component style in `client/`.
- Do not edit generated folders such as `node_modules/`.

## Important Backend Paths

- `server/src/routes/calc.js`: `POST /api/calc` route and request validation.
- `server/src/routes/rates.js`: rate fetch and SOFR import routes.
- `server/src/services/accrualService.js`: Daily Simple SOFR accrual engine.
- `server/src/services/calculationService.js`: calculation selection layer.
- `server/src/services/rateService.js`: daily rate mapping and carry-forward behavior.
- `server/src/services/sofrImportService.js`: NY Fed SOFR import logic.
- `server/src/utils/dates.js`: date helpers and day-count utilities.

## Important Frontend Paths

- `client/src/App.jsx`: main UI, form state, API calls, and CSV export.
- `client/src/index.css`: theme and layout styling.
- `client/src/main.jsx`: React app entrypoint.

## Documentation Expectations

- Update the root `README.md` when product behavior, setup, API surface, or roadmap changes.
- Update `client/README.md` when frontend commands, structure, or UI assumptions change.
- Update `server/README.md` when backend commands, API behavior, env vars, database behavior, or calculation assumptions change.
