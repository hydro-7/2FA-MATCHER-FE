# Frontend integration handoff

UI-only review: `?preview=1` opts into labelled illustrative data and bypasses API requests, with temporary in-memory actions. This is separate from live mode, never a fallback on failure. Real matching and bookings still require the backend endpoints below. Home city has been removed from the search form because it does not affect matching; it remains profile context.

The frontend is implemented in plain React/JavaScript. Catalog/session/profile endpoints are now implemented in `server/src/profileRoutes.js` to make onboarding work locally. Remaining travel routes below are a **proposed contract**. Agree them with the backend developer before the live demo.

The original data pack is extracted unchanged under `data-pack/hackathon-problem-3-group-travel-matcher/`. Catalog options are read on the server, never directly by React. Interest IDs, city names, genders (`MALE`/`FEMALE`) and preferences (`ANY`/`SAME_GENDER`) match the official dictionary. The current profile model is `TravellerProfile` in MongoDB collection `travellerprofiles`; coordinate its integration with the teammate's traveller model. It does not automatically import the 24 seed profiles or 12 groups. Browser identity uses an HttpOnly cookie and survives reloads/restarts. This is the permitted basic hackathon identity, not production authentication.

## Run

From the repository root: `npm run dev -w client`. Vite serves port 5173 and proxies `/api` to port 3001. Start the other developer's backend separately. For another server, set `VITE_API_URL` in `client/.env` (see `.env.example`). Never put secrets in Vite variables.

API calls include cookies (`credentials: include`). The proposed backend restores identity through `GET /api/session`. Cross-origin servers need explicit credentialed CORS. Do not trust client flags as authorization; backend must enforce access, capacity and membership rules.

## Response conventions

- IDs are strings named `id` (map MongoDB `_id` in the backend or API adapter).
- JSON success responses use the wrappers below.
- Failure: non-2xx status and `{ "message": "Readable explanation" }`.
- Dates are destination-local calendar strings `YYYY-MM-DD`; do not convert them to browser-local instants.
- Costs are JSON numbers in INR, already calculated by the backend.
- Arrays are always present, even when empty.
- Images are optional API-provided URLs. The UI uses local CSS/initials when absent.

## Catalog and identity

- `GET /catalog` → `{ destinations: [{id,name}], interests: [{id,label}], genders: [{id,label}], genderPreferences: [{id,label}], genderCompositions: [{id,label}], constraints: {minDate,maxDate,minCapacity,maxCapacity} }`
- `GET /session` → `{ profile: Profile | null }`. Use 200 with null for a new visitor.
- `PUT /profile` body: `{name,homeCity,age: number|null,gender,genderPreference,interests: string[]}` → `{profile: Profile}`. Establish/persist identity here for new visitors.
- Profile fields: `id,name,homeCity,age,gender,genderPreference,interests` (interest IDs).
- `GET /travellers/:id` → `{traveller: {id,name,homeCity,age,interestLabels: string[],groups: GroupSummary[]}}`.

## Groups and matching

- `POST /groups` body: `{name,homeCity,destinationId,checkIn,checkOut,capacity,budget,itinerary,genderPreference,interests}` → `{group: GroupSummary}`. Only fields the backend requires need be persisted; profile identity comes from the session.
- `POST /groups/search` body: `{homeCity,destinationId,checkIn,checkOut,budget,genderPreference,interests,sharedInterestIds?,genderComposition?}` → `{groups: GroupSummary[]}`. Backend applies all six matching rules and ranking, then optional filters.
- `GET /me/groups` → `{groups: GroupSummary[]}` (owned and joined, deduplicated).
- `GET /groups/:id` → `{group: GroupDetail}`.

GroupSummary: `id,name,destinationName,checkIn,checkOut,budget,capacity,memberCount,owner:{id,name},imageUrl?,matchReasons:string[],isMember:boolean,canRequest:boolean,requestStatus:string|null`.

GroupDetail adds: `itinerary,genderPreferenceLabel,isOwner,pendingRequestCount,unavailableReason?,members:[{id,name,homeCity}]`.

Backend controls `canRequest`. An existing member, duplicate pending request, full group or incompatible traveller must not be allowed through by a direct request. Recheck eligibility and capacity at approval time. Member-only/owner-only UI tabs are conveniences, not authorization.

## Join requests

- `POST /groups/:id/requests` body `{}` → `{request: {id,status}}`.
- `GET /me/requests` → `{requests:[{id,groupId,groupName,status}]}`.
- `GET /groups/:id/requests` (owner only) → `{requests:[{id,status,traveller:{id,name,homeCity},matchReasons:string[]}]}`.
- `PATCH /groups/:id/requests/:requestId` body `{status:"approved"|"rejected"}` → `{request:{id,status}}`.

Multiple group memberships are allowed. Membership is fixed after approval. There are no leave, kick or membership-delete UI actions. Pending status is refreshed explicitly through the Refresh button; no WebSockets or polling dependency.

## Hotel workspace

- `GET /groups/:id/hotels` (members only) → `{options: HotelOption[], booking: Booking|null}`. Use the group's destination, dates and full member count. Return available room combinations, priced over every night. `id` identifies a complete bookable option, not merely a hotel.
- HotelOption: `id,hotelName,location,imageUrl?,rating?,roomDescription,amenities:string[],nights,memberCount,totalCost,perPersonCost,shortlisted:boolean,isPreferred:boolean,preferredBy:[{id,name}]`.
- `POST /groups/:id/shortlist` body `{optionId}` → JSON response.
- `DELETE /groups/:id/shortlist/:optionId` → 204 or JSON response. Remove a saved option, not a group membership.
- `PUT /groups/:id/preference` body `{optionId}` → JSON response.
- `POST /groups/:id/booking` body `{optionId}` → `{booking: Booking}`.
- Booking: `reference,hotelName,checkIn,checkOut,memberCount,totalCost,perPersonCost,tripTotalCost?,tripPerPersonCost?`.

The UI compares options locally but does not calculate money or availability. Preference counts reflect actual returned members, not implied unanimous approval. Group consensus happens offline. Finalization creates exactly one locked mock booking. Backend must handle repeated/concurrent submissions, reject edits after locking and return existing booking state on refresh. Snapshot booked member count and costs. Group dates originate at creation; confirmation displays those dates, not a second date-picking flow.

## File map

- `client/src/api.js`: fetch calls and API URLs.
- `client/src/components.jsx`: small shared controls and resource-loading hook.
- `client/src/screens.jsx`: profile, trip forms, discovery, requests, groups, members.
- `client/src/stays.jsx`: hotel shortlist, preference, comparison and finalization.
- `client/src/App.jsx`: shell and simple in-memory screen navigation.
- `client/src/style.css`: responsive styling, system fonts, no animation library.

Navigation resets to the welcome screen after refresh; server identity and saved groups restore from APIs. Unsaved form edits and compare-checkbox choices are intentionally local. Returning to a saved group is through My trips.

## Manual integration checklist

1. Create a profile; refresh and verify identity restores.
2. Create group with capacity including creator; verify it appears in My trips.
3. In another independent browser session, create seeker and search with new inputs.
4. Swipe right or press Express interest; verify pending status and no duplicates.
5. Creator approves; seeker refreshes and can access group Stays.
6. Verify full/incompatible/unauthorized requests are rejected by the backend.
7. Join another compatible group; both remain visible; no exit action exists.
8. Shortlist two hotel options, mark preferences, compare totals and per-person quotes.
9. Confirm the mock booking; refresh to verify reference, dates and locked state.
10. Check rejected requests, empty matches, no availability, network failure and mobile layout.

The onboarding flow can run live now. The full group/hotel integration cannot pass until the remaining agreed endpoints are supplied. Do not replace API failures with sample content.
