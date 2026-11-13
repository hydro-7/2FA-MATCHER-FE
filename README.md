# Travel Together: frontend

React client for the Group Travel Matcher. Every screen reads from the backend API. Nothing is mocked.

React 19, Vite, React Router, zustand, Leaflet.

## Run

Needs Node 22 or newer, pnpm, and the backend running on `http://localhost:8000`. Start the backend first and wait for its `Server running` line.

    pnpm install
    pnpm dev

Open http://localhost:5173. Sign in and sign up share one popup, opened from the header or by any page that needs an account. Sign up, or sign in as a seeded traveller: `t-001@demo.travel` with the backend's `DEMO_PASSWORD` (default `demo1234`).

No `.env` is needed for local work. To change the defaults, copy `.env.example` to `.env`:

| Variable | Meaning |
| --- | --- |
| `VITE_BACKEND_ORIGIN` | Where the dev server proxies `/api` and `/images`. Default `http://localhost:8000`. |
| `VITE_API_URL` | Call the API directly instead of through the proxy. |
| `VITE_PORT` | Dev server port. Default `5173`. |

## Commands

| Command | Does |
| --- | --- |
| `pnpm dev` | Dev server with hot reload. |
| `pnpm build` | Production build into `dist/`. |
| `pnpm preview` | Serve `dist/` locally. |

## Layout

    src/config      env, API endpoints, page URLs
    src/constants   settings and labels
    src/lib         http client, formatting
    src/store       zustand: session (token), search, drafts, theme, toasts
    src/services    one per backend domain
    src/hooks       useResource, useMeta
    src/components  shared UI
    src/screens     one per route, group tabs in screens/group

Screens call services. Services call `lib/http.js`. Only `lib/http.js` uses `fetch`, and it adds the `Authorization: Bearer` header.

## Routes

| Path | Screen |
| --- | --- |
| `/` | Home |
| `/profile` | Your profile |
| `/discover` | Search, matches, near misses |
| `/groups/new` | Create a trip |
| `/trips` | Your groups and sent requests |
| `/groups/:id` | Trip overview and join request |
| `/groups/:id/members` | Members |
| `/groups/:id/stays` | Hotels, cost per person, booking |
| `/groups/:id/chat` | Group chat |
| `/groups/:id/requests` | Approve or decline, owner only |
| `/travellers/:id` | A traveller's profile |

## Problems

- `http proxy error ... ECONNREFUSED 127.0.0.1:8000`: the backend is not running. Start it, then reload.
- Signed out on every request: the token expired (7 days) or the backend's `AUTH_SECRET` changed. Sign in again.
- A `companion.bundle.js` error in the console comes from a browser extension, not this app.

## Limits

- Profiles cannot be edited. The API has no update route.
- No password reset.
- Chat polls every few seconds.
