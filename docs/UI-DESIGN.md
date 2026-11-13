# UI refinement and review

## Modes

Live mode uses real APIs, with no sample-data fallback. Missing routes show a calm connection-pending message. Existing onboarding APIs remain as-is. No backend code was added during this design pass.

Open `/?preview=1` for the explicitly labelled design preview. It works without any backend. Example people, group cards, requests and hotel quotes are illustrative, not real matching results or availability. Actions update only temporary in-memory examples and reset on refresh. Creator/seeker buttons switch the sample identity. The preview is lazy-loaded and does not issue live API requests. Never present it to judges as the working data-driven demo.

Preview screen links: `&screen=profile`, `&screen=choose`, `&screen=create`, `&screen=discover`, `&screen=trips`, `&screen=group&group=preview-tokyo`. Creator requests: switch to Creator view, then open `&screen=group&group=preview-kyoto`.

Home city is profile information only, not a matching criterion. It is removed from the matching form but remains in the submitted profile context if the API needs it for display.

## Twenty design principles applied

| Principle | Concrete application |
|---|---|
| Aesthetic-usability | Shared colour, spacing, type and surface treatments across every screen. |
| Hick's law | One primary action per form; trip interests and extra filters expand on demand. |
| Fitts's law | Large swipe buttons and minimum 44px primary action targets. |
| Jakob's law | Familiar navigation, date controls, hotel cards and confirmation dialog. |
| Miller's law | Chunk profile, travel details and interests; separate overview/stays/members. |
| Doherty threshold | Immediate drag feedback; loading and submitting states; no animation dependency. |
| Proximity | Group dates, owner, capacity and price stay within their card. |
| Similarity | Consistent chip, badge, button and field styles indicate shared meanings. |
| Common region | Panels enclose forms; hotel cards enclose one complete stay option. |
| Visual hierarchy | Heading, context, compatibility reasons, price, then action. |
| Progressive disclosure | Collapsed interests/refine controls and section tabs reduce initial load. |
| Recognition over recall | Selected-interest count, visible dates, member count and clear request status. |
| Von Restorff | Blue primary actions and restrained yellow interest accents. |
| Peak-end rule | Friendly request acknowledgement and clear group-stay confirmation. |
| Goal-gradient | Profile leads into a two-path choice; request and booking stages have visible completion states. |
| Serial position | Important context at top; clear primary action at bottom of each task. |
| Tesler's law | Complex matching, availability and price logic stays behind the live API. |
| Postel's law | Home-city suggestions remain editable; input validation gives specific feedback. |
| Occam's razor | Plain React/CSS, one small preview module, no state or animation framework. |
| Feedback loops | Drag stamps, selected chips, pending requests, shortlist/preference states and booking review. |

## Swipe behaviour

Pointer drag follows the hand/mouse with a slight rotation. Left shows PASS; right shows LET'S GO only for eligible cards. Release beyond 90px triggers the corresponding action; a short drag snaps back. Vertical scroll does not submit a request. Pointer capture handles release outside the card; cancellation resets the card. Existing/pending memberships do not submit again. Explicit buttons provide the same actions for keyboard and touch accessibility. No inertial animation or delayed transition is used.

## Review

Run build/syntax checks and browser checks after interaction changes. A separate screenshot agent reviews desktop and phone layouts, including discovery cards, profile, trips and shared hotel workspace. Screenshots belong to the chat outputs folder, not the application's data or source.
