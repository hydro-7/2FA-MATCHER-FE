# MVP integration verification — 13 November 2026

## Implemented

Actual API adapter, X-User-Id identity selection/restoration, traveller signup, group creation, backend-ranked search, saved searchId join requests, approvals/rejection, request/membership refresh, member profiles, hotel quotes/sorting/pagination, shared saved preferences/comparison/removal, group mock booking and locked state.

Saved profiles are read-only because no profile-update endpoint exists. Updated G1 filters and G2 member group lists are connected. Multiple groups are allowed, without exit actions. No backend implementation was changed. Chat (S1) remains outside the MVP scope.

## Verified evidence

- Production frontend build and syntax checks pass.
- Live API agent created QA-only travellers/groups and tested signup, creation, search, request, approval, hotel pricing, saving/removing options, alignment, booking, persisted booked state, duplicate-booking409, save-after-book409 and nonmember403. Seeded groups untouched.
- Independent browser tests with isolated, accurate contract fixtures pass catalog/session/group/request/hotel/booking normalization, DELETE without data, pending badges, null member group lists, correct searchId/header, identity races and join/search race.
- Live two-browser UI acceptance passed: separate creator/seeker signup, group creation, backend matching, actual pointer right-swipe request, owner approval, membership refresh, member-profile rendering, hotel quotes, saving two options, comparing, removing one, finalizing, reloading persisted booking, locked controls and phone layout. No browser errors.
- Test group `G-56464f2226e1`, owner `T-512b455f9d6c`, seeker `T-a2d2735910d3`, booking `BK-d485031729af`: Gion Corner Hotel, 5 nights, 2 travellers, total INR23,800 and INR11,900 each. These are QA records, not seeded demo travellers.
- Independent live browser/API edge checks passed rejection persistence, two separate memberships, full-group exclusion and rejected join, nonowner request denial, invalid dates, zero matches, identity restoration across two reloads, booked controls, G1 female/male/mixed filters verified against member genders, and G2 actual member group lists.
- Screenshot agent reviewed live desktop1440/mobile390 identity/profile/My trips/discovery/group/member/stays/filter/booking views, using the real backend. Fixed the saved-option filter exception label and member-row padding. No blocking rendering issues, overflow or browser errors found.

## Result

MVP acceptance passed against `https://prepared-promoting-affordable-cables.trycloudflare.com`. The former tunnel outage was resolved with this new URL. A temporary tunnel must remain running for the real app; update VITE_BACKEND_ORIGIN if its URL changes.

All live mutations used QA-labelled users/groups. The read-only seeded memberships and bookings were not changed. Test records are retained because the API has no delete-user/group endpoint. Preview and fixture tests are recorded separately from the live acceptance above.
