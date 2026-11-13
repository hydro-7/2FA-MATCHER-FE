# Travel Together — frontend

Booking.com-inspired group travel matcher, built with React, JavaScript and Vite. This repository contains the frontend only.

## Start

Requires Node.js 22.16+ (or a newer supported Node.js release).

```sh
npm install
npm run dev
```

Open http://localhost:5173/?preview=1 for the complete, labelled design preview. Preview works without a backend, makes no API requests and resets its sample interactions on refresh. It is for visual review, not a real matching or booking demo. Use the toolbar to inspect creator/seeker journeys and all screens.

Open http://localhost:5173/ for real API mode. Vite proxies `/api` to the teammate's backend configured by `VITE_BACKEND_ORIGIN`; copy `.env.example` to `.env` when changing the tunnel. The backend uses Neon; no local database or local API is required. Never put secrets in frontend environment variables.

```sh
npm run build
```

## Included

- Profile setup, group creation, swipe/card/list discovery and filters.
- Join requests and creator approvals, multiple group memberships with no exit action.
- Shared group workspace, member profiles, hotel shortlisting, preference and comparison.
- Booking review and confirmation UI, responsive desktop/mobile styling.
- Explicit loading, empty and API-connection states.

API mode is wired to the supplied Group Travel Matcher API contract. Create a new profile or use Switch traveller to select an existing traveller. Identity is stored locally and sent as `X-User-Id`, then verified through `/me`. The backend owns matching, availability, prices, approval and booking persistence. Saved profiles are read-only because the contract has no update route. A working backend tunnel is required for the real demo; preview is never used as a fallback.

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
