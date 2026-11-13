# Travel Together — frontend

Booking.com-inspired group travel matcher, built with React, JavaScript and Vite. This repository contains the frontend only.

## Start

Requires Node.js 22.16+ (or a newer supported Node.js release).

```sh
npm install
npm run dev
```

Open http://localhost:5173/?preview=1 for the complete, labelled design preview. Preview works without a backend, makes no API requests and resets its sample interactions on refresh. It is for visual review, not a real matching or booking demo. Use the toolbar to inspect creator/seeker journeys and all screens.

Open http://localhost:5173/ for real API mode. Vite proxies `/api` to http://localhost:3001. Configure `VITE_API_URL` in `.env` for a different backend; see `.env.example`. Never put secrets in frontend environment variables.

```sh
npm run build
```

## Included

- Profile setup, group creation, swipe/card/list discovery and filters.
- Join requests and creator approvals, multiple group memberships with no exit action.
- Shared group workspace, member profiles, hotel shortlisting, preference and comparison.
- Booking review and confirmation UI, responsive desktop/mobile styling.
- Explicit loading, empty and API-connection states.

API mode needs the agreed backend endpoints. The separate local starter currently implements onboarding/catalog only; group matching and hotel integration remain pending. No real matching, availability or pricing is calculated in this frontend.

## Easy-to-edit files

- `src/App.jsx` — shell and navigation
- `src/screens.jsx` — profile, discovery, group and request screens
- `src/stays.jsx` — hotel workspace
- `src/api.js` — live API adapter
- `src/components.jsx` — shared controls
- `src/style.css` — styling
- `src/preview.js` and `src/preview-data/` — isolated visual examples

See `docs/FRONTEND_API.md` for proposed request/response shapes and `docs/UI-DESIGN.md` for UI behaviour. Those handoff notes describe paths in the original combined workspace; in this standalone repository, omit the `client/` prefix. Backend paths in those notes refer to the separate local starter, not files included here.

Photo attribution is in `public/visuals/credits.txt`. Preview reference catalogs are unchanged copies of the supplied hackathon data files.

## Commit and push

When working in a standalone clone of this GitHub repository:

```sh
git add .
git commit -m "Describe your frontend changes"
git push origin main
```

When working in the original `C:\_Project_Files\Booking` workspace, use `scripts/push-frontend.ps1` from that workspace to publish only its `client/` directory while preserving frontend Git history.
