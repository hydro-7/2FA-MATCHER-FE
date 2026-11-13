# Travel Together — frontend

React + Vite client for the Group Travel Matcher. All data comes from the backend API. The app reads no data-pack files.

## Start

Requires Node.js 22+ and the backend running on `http://localhost:8000`.

```sh
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` and `/images` to `VITE_BACKEND_ORIGIN` (see `.env.example`).

After dependencies and environment files are configured, start the full app in
two terminals: `pnpm dev` in the backend repository and `npm run dev` here.
No deployment or external hotel API is required. A new database is migrated and
seeded automatically by backend startup. Existing databases are preserved.

For a separate local checkout, set ignored `.env.local` values
`VITE_BACKEND_ORIGIN` and `VITE_PORT` to its backend origin and available frontend port.

## Structure

```
src/
  config/      env.js (reads import.meta.env), endpoints.js (API routes), routes.js (page URLs)
  constants/   data only: app settings, enum labels
  lib/         http.js (fetch client), format.js (money, dates, labels, asset URLs)
  store/       zustand: session (persisted traveller id), search results, toasts
  services/    API clients: meta, traveller, group, match, request, planning, message, friend; external geocoding
  hooks/       useResource (load/error/reload), useMeta (form options from /meta)
  components/  ui primitives, GroupCard, SearchForm, IdentityModal, layout/
  screens/     one file per route; screens/group/ holds the group tabs
```

Business-data screens call services, which use `lib/http.js` with `API_ENDPOINTS`.
That client sends the selected traveller's `X-User-Id` and rejects responses for
an identity that has since changed. The separate geocoding service uses the map
provider configured in `src/config/map.js`. Matching, approval and pricing logic
stay in the backend. The frontend never reads catalogue JSON files.

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
| `/groups/:id/itinerary` | Proposed day plan or text itinerary |
| `/groups/:id/map` | Group destination, stays and itinerary map |
| `/groups/:id/stays` | Hotels, per-person cost, shortlist, compare, confirm booking (M6) |
| `/groups/:id/chat` | Legacy link: redirects to the group page with the chat popup open |
| `/groups/:id/requests` | Approve / decline (M5, owner only) |
| `/travellers/:id` | Member profile; group visibility follows backend permissions |
| `/friends` | Friends, requests and traveller discovery from the account menu |

## Completed flows

- M1: signup and persistent demo identity. One interest is a valid profile input.
- M2: create groups with name, city, destination-local dates, itinerary, positive
  whole-INR budget and 1–4 total members including the creator.
- M3/M4: editable home city, destination, dates, interests, exact numeric budget
  and gender preference. Cards show owner name and current/capacity member count.
- G1: required shared-interest tags and group gender composition. Required tags
  only narrow backend-approved matches and are distinct from your own interests.
- M5: interest requests, owner approval/rejection and persisted memberships.
- M6: group-context hotel search, current per-member price, shortlist, comparison,
  alignment, confirmation popup and one locked mock booking.
- S1: group chat in a side popup, with an expanded view.
- Member profiles, friendship controls, responsive layout and dark mode.

Discovery renders eight cards per list page. The API returns the highest-ranked
50 matches and 50 near misses (revealed six at a time), with full filtered totals. A notice identifies
capped results; text search and display sorting operate within that selection.
Hotel search has its own API pagination.

Changing criteria immediately hides earlier results. A failed request clears
the result set and offers Retry search. Late responses from an older search or
traveller cannot overwrite the current search. A one-interest search is allowed;
the backend still requires two shared interests for an actual match.

## Checks and demo

Run `npm test` for search input/identity checks and `npm run build` for the
production build. Run the backend's `pnpm typecheck` and `pnpm test` there.

For a creator/seeker demo, use a normal window and an Incognito/InPrivate window
so identities are separate. Create a group, request membership from a compatible
traveller, approve, then show hotel comparison, alignment and the final cost split.
The problem statement gives four minutes for the live demo. Use a fresh browser
session for clean signup forms; do not reset the shared database to clear a form.

## Known limitations

- Identity is a demo session with no password, as M1 allows.
- Profiles can't be edited because the API has no update route.
- Chat refreshes by polling every few seconds.
- Profile/group-list visibility follows the backend's current privacy policy;
  it may be stricter than unrestricted optional G2 visibility. See the backend's
  `FRIENDS.md` for the current implementation.
- Maps need external tiles/geocoding and show straight-line distances, not
  road navigation. They are additional to the required M1–M6 features.
- Bookings are mock database records. No payment or real reservation is made.
- Demo identity is not production authentication.

## Source submission

At code freeze, package both repositories and the backend data pack, README and
package/migration/setup files. Exclude `.git`, `node_modules`, `dist`, caches,
private `.env`/`.env.local` files, credentials and local QA screenshots. Keep
`.env.example`. Verify startup against a disposable database before uploading
the archive to HackerEarth. Final archive/upload is a separate submission step.

Hotel photo credits: linked in the footer, served from the data pack's `images/ATTRIBUTIONS.md`.

