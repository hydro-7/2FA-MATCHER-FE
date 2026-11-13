# Travel Together — frontend

React + Vite client for the Group Travel Matcher. All data comes from the backend API. The app reads no data-pack files.

## Start

Requires Node.js 22+ and the backend running on `http://localhost:8000`.

```sh
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` and `/images` to `VITE_BACKEND_ORIGIN` (see `.env.example`).

## Structure

```
src/
  config/      env.js (reads import.meta.env), endpoints.js (API routes), routes.js (page URLs)
  constants/   data only: app settings, enum labels
  lib/         http.js (fetch client), format.js (money, dates, labels, asset URLs)
  store/       zustand: session (persisted traveller id), search results, toasts
  services/    one per backend domain: meta, traveller, group, match, request, planning, message
  hooks/       useResource (load/error/reload), useMeta (form options from /meta)
  components/  ui primitives, GroupCard, SearchForm, IdentityModal, layout/
  screens/     one file per route; screens/group/ holds the group tabs
```

Screens call services only, services call `http` with `API_ENDPOINTS`, and only `lib/http.js` uses `fetch`.

## Routes

| Path | Screen |
|---|---|
| `/` | Home |
| `/profile` | Sign up / your profile (M1) |
| `/groups/new` | Create a group (M2) |
| `/discover` | Search, matches, filters, near misses (M3, M4, G1) |
| `/trips` | Your groups (pending badge) and sent requests |
| `/groups/:id` | Overview and "I'm interested" (M5) |
| `/groups/:id/members` | Members |
| `/groups/:id/stays` | Hotels, per-person cost, shortlist, compare, confirm booking (M6) |
| `/groups/:id/chat` | Group chat (S1) |
| `/groups/:id/requests` | Approve / decline (M5, owner only) |
| `/travellers/:id` | Member profile and their groups (G2) |

## Known limitations

- Identity is a demo session with no password, as M1 allows.
- Profiles can't be edited because the API has no update route.
- Chat refreshes by polling every few seconds.

Hotel photo credits: linked in the footer, served from the data pack's `images/ATTRIBUTIONS.md`.
