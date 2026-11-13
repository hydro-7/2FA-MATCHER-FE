import { useOutletContext } from "react-router";
import { parseItinerary } from "../../lib/itinerary";
import { ItineraryView } from "../../components/ItineraryView";

export function Itinerary() {
  const { group } = useOutletContext();
  const plan = parseItinerary(group.itinerary);
  return (
    <section className="overview">
      <h2>Trip itinerary</h2>
      {plan.days.length > 0 && <p>{plan.summary}</p>}
      <ItineraryView plan={plan} />
      {(plan.style || plan.rules.length > 0) && (
        <div className="trip-notes">
          {plan.style && (
            <span>
              Travel style: <b>{plan.style}</b>
            </span>
          )}
          {plan.rules.map((rule) => (
            <span key={rule} className="rule-chip">
              {rule}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
