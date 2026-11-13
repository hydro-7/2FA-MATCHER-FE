import { useNavigate } from "react-router";
import { ROUTES } from "../config/routes";
import { labelOf } from "../lib/format";
import { useResource } from "../hooks/useResource";
import { groupService } from "../services/groupService";
import { requestService } from "../services/requestService";
import { GroupCard } from "../components/GroupCard";
import { Empty, RemoteState } from "../components/ui";

function roleBadge(group) {
  const role = labelOf("role", group.role);
  return group.pendingRequestCount ? `${role} · ${group.pendingRequestCount} pending` : role;
}

export function MyTrips() {
  const navigate = useNavigate();
  const groups = useResource(groupService.mine, "my-groups");
  const requests = useResource(requestService.mine, "my-requests");

  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">YOUR ADVENTURES, IN ONE PLACE</span>
        <h1>My trips</h1>
        <p className="lede">Your groups and the connections you’re making along the way.</p>
      </div>
      <RemoteState resource={groups} />
      {groups.data &&
        (groups.data.length ? (
          <div className="trip-grid">
            {groups.data.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                to={ROUTES.GROUP(group.id)}
                subtitle={`${group.memberCount} / ${group.maxSize} travellers`}
                badge={roleBadge(group)}
              />
            ))}
          </div>
        ) : (
          <Empty title="Your next trip starts here">Create a group or find your people in Discover.</Empty>
        ))}
      <div className="section-heading">
        <h2>Your join requests</h2>
        <button
          className="secondary"
          onClick={() => {
            requests.reload();
            groups.reload();
          }}
        >
          Refresh status
        </button>
      </div>
      <RemoteState resource={requests} />
      {requests.data &&
        (requests.data.length ? (
          <div className="panel">
            {requests.data.map((request) => (
              <div key={request.id} className="request-row">
                <div>
                  <h3>{request.group.name}</h3>
                  <span className="badge">{labelOf("requestStatus", request.status)}</span>
                </div>
                <button className="secondary" onClick={() => navigate(ROUTES.GROUP(request.groupId))}>
                  {request.status === "APPROVED" ? "Open group" : "View group"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">Your requests will appear here once you express interest.</p>
        ))}
      <div className="bottom-callout">
        <div>
          <strong>There’s more to explore.</strong>
          <p>You can join multiple groups. Joined memberships are permanent.</p>
        </div>
        <button onClick={() => navigate(ROUTES.DISCOVER)}>Explore more groups ↗</button>
      </div>
    </>
  );
}
