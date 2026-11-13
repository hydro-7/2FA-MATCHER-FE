import { useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router";
import { GROUP_TABS } from "../../constants/app";
import { ROUTES } from "../../config/routes";
import { formatDates } from "../../lib/format";
import { useResource } from "../../hooks/useResource";
import { groupService } from "../../services/groupService";
import { useSession } from "../../store/session";
import { RemoteState } from "../../components/ui";

export function GroupLayout() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = useSession((state) => state.userId);
  const [fromSearch] = useState(location.state);
  const resource = useResource(() => groupService.get(groupId), groupId);
  const group = resource.data;
  const back = (
    <button className="text-button back" onClick={() => navigate(-1)}>
      ← Back
    </button>
  );

  if (!group)
    return (
      <>
        {back}
        <RemoteState resource={resource} />
      </>
    );

  const isOwner = group.ownerId === userId;
  const isMember = group.members.some((member) => member.id === userId);
  const tabs = GROUP_TABS.filter((tab) => (!tab.membersOnly || isMember) && (!tab.ownerOnly || isOwner));
  const tabUrl = (tab) => (tab.path ? ROUTES.GROUP_TAB(groupId, tab.path) : ROUTES.GROUP(groupId));

  return (
    <>
      {back}
      <div className="detail-cover">
        <span className="eyebrow">
          {group.city} · {group.timezone}
        </span>
        <h1>{group.name}</h1>
        <p>{formatDates(group.checkIn, group.checkOut)}</p>
        <div className="actions">
          <span className="badge">
            {group.memberCount} / {group.maxSize} travellers
          </span>
          {isOwner && <span className="badge">You’re the creator</span>}
          {isMember && !isOwner && <span className="badge">Your group</span>}
          {group.status === "BOOKED" && <span className="badge">Stay confirmed · booking locked</span>}
        </div>
      </div>
      <div className="tabs" role="tablist" aria-label="Group sections">
        {tabs.map((tab) => (
          <button key={tab.label} role="tab" aria-selected={location.pathname === tabUrl(tab)} onClick={() => navigate(tabUrl(tab), { replace: true })}>
            {tab.label}
            {tab.ownerOnly && group.pendingRequestCount > 0 && <span className="count-badge">{group.pendingRequestCount}</span>}
          </button>
        ))}
      </div>
      <Outlet context={{ group, reload: resource.reload, isOwner, isMember, match: fromSearch?.match, searchId: fromSearch?.searchId }} />
    </>
  );
}
