# AGENTS.md

## Scope

These instructions apply to the React frontend in `client/`.

## Commands

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Preview production build: `npm run preview`

## Frontend Guidelines

- Keep financial calculation logic out of the frontend.
- Use the frontend for form state, inline validation, display formatting, and API calls.
- Preserve the existing React functional component style.
- Keep UI changes consistent with the current CSS files before adding new styling patterns.
- Avoid adding a component library unless the project explicitly needs it.
- Keep API request and response fields aligned with the backend.
- Do not edit `node_modules/` or generated build output.

## Important Files

- `src/App.jsx`: main app, form state, validation, API calls, and CSV export.
- `src/index.css`: global visual styling and layout.
- `src/App.css`: app-level styling.
- `src/main.jsx`: React entrypoint.

## Verification

After meaningful frontend changes:

- Run `npm run lint`.
- Run `npm run build`.
- If behavior changed, start the frontend and backend and verify the main calculation workflow in the browser.
