# Live backend integration

The UI now targets the teammate's Group Travel Matcher API v1, backed by Neon. See `openapi.json` for supplied endpoint definitions. The local prototype server and MongoDB are not used by the frontend's live mode.

## Start and configure

Standalone frontend checkout: `npm ci`, then `npm run dev`. In the original combined workspace: `npm run dev -w client`.

The Vite proxy forwards `/api` to `VITE_BACKEND_ORIGIN`. Copy `.env.example` to `.env` and update the origin if cloudflared gives a new URL; restart Vite. Default origin is the supplied `https://paperbacks-nuts-automation-provincial.trycloudflare.com`. Optional `VITE_API_URL` can point directly to an API base; requests omit cookies because the server permits CORS with `*` and uses `X-User-Id`. There are no database passwords in this frontend.

## Actual contract

All success responses wrap data as `{success:true,message,data}`. DELETE saved may omit data. Failure responses expose message and an error code/details. `src/api.js` translates backend names to the existing readable UI fields.

| UI function | Actual route |
|---|---|
| Form catalogs | GET /api/meta |
| Sign up | POST /api/travellers |
| Restore identity | GET /api/me with X-User-Id |
| Switch traveller | GET /api/travellers; select ID locally |
| View member | GET /api/travellers/:id |
| Create group | POST /api/groups |
| My groups | GET /api/groups/mine |
| Group details | GET /api/groups/:id |
| Ranked matches | POST /api/matches/search |
| Express interest | POST /api/groups/:id/requests with saved searchId |
| Owner requests | GET /api/groups/:id/requests?status=ALL |
| Approve/reject | PATCH /api/requests/:requestId with action APPROVE/REJECT |
| My requests | GET /api/requests/mine |
| Hotel options | GET /api/groups/:id/hotels with sort/minStars/page/limit |
| Shared saved options | GET /api/groups/:id/saved |
| Save/prefer | POST /api/groups/:id/saved with roomId |
| Remove own saved choice | DELETE /api/groups/:id/saved/:roomId |
| Finalize group booking | POST /api/groups/:id/booking with roomId |
| Reload locked booking | GET /api/groups/:id/booking |

## Important semantics

- Identity is the permitted basic hackathon identity, not production authentication. Selected ID persists in localStorage. No hardcoded identity is selected in live mode. Browser contexts can run creator and seeker independently.
- No profile-update route exists. Saved profiles are read-only. Switch traveller can select an existing user or start new signup.
- Home city is profile/display information, not a matching gate. Owner gender preference comes from the saved profile rather than a group-specific field the backend cannot accept.
- Form fields use official IDs and backend bounds: age18–100 if supplied, name100, itinerary2000, whole positive INR budgets, capacity1–4 and supplied date window.
- Matching and ranking run on the backend. Search IDs are kept per identity and group in sessionStorage for join requests. Near misses are explained separately and never shown as compatible matches. Group size and eligibility are rechecked by the API.
- Multiple memberships are allowed with no leave action. Request status is pending/approved/rejected. Owner pending counts are fetched when missing from group detail. My trips refresh reloads both memberships and requests.
- Hotel quotes, room counts and availability come from the backend. The UI merges shared saved options, shows savedBy/alignment, supports price/rating/star sorting and pagination, and disables unavailable saved options.
- Saving a hotel is the backend's preference action; there is no invented separate preference endpoint.
- Booking IDs, totals, split and member snapshots come from the booking API; dates come from group context. Locked bookings replace editing controls. A timeout/conflict is reconciled through GET booking before any retry, to avoid duplicate booking attempts.
- Shared-interest refinement filters the server's already-compatible matches. The backend has no gender-composition search parameter, so that optional filter is hidden in live mode. Another traveller's group list is not exposed by the contract; member profile displays that limitation without inventing membership data.
- Requests have timeouts and reject stale results after identity changes. No fake sample fallback is used on a tunnel error.

## Preview and verification

`?preview=1` remains an isolated, labelled design preview with temporary illustrative data. It is not evidence of a live API test. Live and fixture-based checks must be reported separately.

The API contract agent tested signup, creation, match/search, joining, approval, hotel quotes, save/remove/alignment, finalize, persistent booked state, duplicate-finalize409, locked-save409 and nonmember403 using only new QA records. A temporary Cloudflare1033 outage interrupted the subsequent live browser pass. The final integration status and remaining live checks must be updated after a working tunnel is restored.
