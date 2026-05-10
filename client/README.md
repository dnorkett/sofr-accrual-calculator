# SOFR Accrual Frontend

React + Vite frontend for the SOFR Interest Accrual Calculator.

The frontend collects user inputs, performs quick inline validation, calls the backend API, displays calculation results, and exports the daily accrual breakdown to CSV.

## Tech Stack

- React
- Vite
- CSS modules by convention through standard CSS files
- Fetch API for backend communication

## Commands

Run these from `client/`:

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

## Local Development

The Vite dev server typically runs at:

```text
http://localhost:5173
```

The frontend currently expects the backend API at:

```text
http://localhost:3001
```

That API base is defined in `src/App.jsx` as `API_BASE`.

## Source Layout

```text
client/
  src/
    App.jsx       Main UI, form state, validation, API calls, CSV export
    App.css       App-level styles
    index.css     Global theme and layout styles
    main.jsx      React entrypoint
    assets/       Static frontend assets
  public/         Static public files
  vite.config.js  Vite configuration
```

## Responsibilities

The frontend should own:

- Input forms and user interaction.
- Inline validation for fast feedback.
- Display formatting for money, percentages, errors, and results.
- Calls to backend endpoints.
- CSV download behavior for displayed accrual rows.

The frontend should not own:

- Authoritative financial calculations.
- SOFR rate import behavior.
- SQLite persistence.
- Backend validation or rate carry-forward rules.

## Backend Endpoints Used

- `POST /api/rates/import-latest`
- `POST /api/calc`

## Notes

- Frontend validation is for user experience only. Backend validation remains authoritative.
- Keep API payload field names aligned with the backend route in `server/src/routes/calc.js`.
- If `API_BASE` becomes configurable, document the environment variable here and in the root README.
