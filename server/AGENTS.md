# AGENTS.md

## Scope

These instructions apply to the Express/SQLite backend in `server/`.

## Commands

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Start production server: `npm start`

## Backend Guidelines

- Preserve the existing CommonJS module style.
- Keep financial calculation behavior in services, not route handlers.
- Keep route handlers focused on request validation, orchestration, and response shaping.
- Keep date handling explicit and deterministic.
- Treat calculation behavior as product-critical; update docs and examples when assumptions change.
- Keep SQLite schema changes clear and backward-compatible when practical.
- Do not edit `node_modules/`.
- Do not commit local database contents unless intentionally requested.

## Important Files

- `src/server.js`: Express setup, middleware, database initialization, and route mounting.
- `src/routes/calc.js`: calculation endpoint and request validation.
- `src/routes/rates.js`: rate lookup and SOFR import endpoints.
- `src/services/accrualService.js`: Daily Simple SOFR accrual engine.
- `src/services/calculationService.js`: calculation selection layer.
- `src/services/rateService.js`: daily rate map and carry-forward logic.
- `src/services/sofrImportService.js`: NY Fed SOFR import.
- `src/db/database.js`: SQLite connection setup.
- `src/db/init.js`: database schema initialization.
- `src/utils/dates.js`: date utilities and day-count helpers.

## Verification

After meaningful backend changes:

- Start the API with `npm run dev` or `npm start`.
- Check `GET /health`.
- Exercise changed endpoints with representative payloads.
- If calculation behavior changed, verify at least one known input/output example and update documentation.
