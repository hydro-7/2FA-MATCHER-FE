import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { ROUTES } from "../../config/routes";
import { labelOf } from "../../lib/format";
import { requestService } from "../../services/requestService";
import { toast } from "../../store/toast";
import { Avatar, Money, Notice, RuleChips } from "../../components/ui";

function genderPreferenceLabel(owner) {
  if (owner?.genderPreference !== "SAME_GENDER") return labelOf("genderPreference", "ANY");
  return `${labelOf("gender", owner.gender)} only`;
}

export function Overview() {
  const { group, reload, isMember, match, searchId } = useOutletContext();
  const navigate = useNavigate();
  const owner = group.members.find((member) => member.id === group.ownerId);

  return (
    <div className="detail-grid">
      <div className="panel">
        <span className="eyebrow">THE PLAN</span>
        <h2>A little about this adventure</h2>
        <p className="itinerary">{group.itinerary}</p>
        <h3>Your trip creator</h3>
        <button className="person person-button" onClick={() => navigate(ROUTES.TRAVELLER(group.ownerId))}>
          <Avatar person={group.owner} />
          <span>
            {group.owner.name}
            <small>View profile →</small>
          </span>
        </button>
        {match && (
          <>
            <h3>Why this fits you</h3>
            <RuleChips rules={match.rules} />
          </>
        )}
      </div>
      <aside className="panel">
        <h3>The details</h3>
        <div className="price-row">
          <span>Trip budget / person</span>
          <strong>
            <Money value={group.budgetInr} />
          </strong>
        </div>
        <div className="price-row">
          <span>Group preference</span>
          <strong>{genderPreferenceLabel(owner)}</strong>
        </div>
        <div className="price-row">
          <span>Travellers</span>
          <strong>
            {group.memberCount} of {group.maxSize}
          </strong>
        </div>
        {group.booking && (
          <>
            <div className="price-row">
              <span>Booked stay</span>
              <strong>{group.booking.hotelName}</strong>
            </div>
            <div className="price-row highlight">
              <span>Stay per person · {group.booking.members} people</span>
              <strong>
                <Money value={group.booking.perMemberInr} />
              </strong>
            </div>
          </>
        )}
        <JoinAction group={group} isMember={isMember} searchId={searchId} onRequested={reload} />
      </aside>
    </div>
  );
}

function JoinAction({ group, isMember, searchId, onRequested }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function join() {
    setBusy(true);
    setError("");
    try {
      await requestService.create(group.id, searchId);
      toast("Request sent. You’ll join once the creator approves.");
      onRequested();
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }

  if (isMember)
    return (
      <>
        <button className="full" onClick={() => navigate(ROUTES.GROUP_TAB(group.id, "stays"), { replace: true })}>
          {group.status === "BOOKED" ? "View your booking →" : "Find a stay together →"}
        </button>
        <p className="caption">Your membership is confirmed. You can still explore other groups.</p>
      </>
    );

  let label = "Express interest ♡";
  if (group.myRequestStatus) label = `Request ${labelOf("requestStatus", group.myRequestStatus).toLowerCase()}`;
  else if (group.status === "BOOKED") label = "Group stay confirmed";
  else if (group.seatsLeft === 0) label = "Group full";
  else if (!searchId) label = "Search to check compatibility →";
  const canJoin = !group.myRequestStatus && group.status !== "BOOKED" && group.seatsLeft > 0;

  return (
    <>
      <Notice error>{error}</Notice>
      <button
        className="full"
        disabled={busy || !canJoin}
        onClick={() => (searchId ? join() : navigate(ROUTES.DISCOVER))}
      >
        {busy ? "Sending…" : label}
      </button>
      <p className="caption">Your creator reviews your request before you join.</p>
    </>
  );
}
