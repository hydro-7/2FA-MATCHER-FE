import { useEffect } from "react";
import { LockKeyhole } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { ROUTES } from "../config/routes";
import { formatDates, labelOf } from "../lib/format";
import { useMeta } from "../hooks/useMeta";
import { useResource } from "../hooks/useResource";
import { travellerService } from "../services/travellerService";
import { friendService } from "../services/friendService";
import { useSession } from "../store/session";
import { FriendActions } from "../components/FriendActions";
import { Avatar, Empty, RemoteState } from "../components/ui";

export function MemberProfile() {
  const { travellerId } = useParams();
  const navigate = useNavigate();
  const userId = useSession((state) => state.userId);
  const meta = useMeta();
  const traveller = useResource(
    () => travellerService.get(travellerId),
    `${userId}-${travellerId}`,
  );
  const member = traveller.data;
  const relationship = useResource(
    () => friendService.relationship(travellerId),
    `relationship-${userId}-${travellerId}`,
  );
  const canViewGroups =
    member?.canViewGroups &&
    (userId === member.id ||
      (!relationship.loading && relationship.data?.status === "FRIENDS"));
  function refreshFriendship() {
    traveller.reload();
    relationship.reload();
  }
  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) refreshFriendship();
    };
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 15000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.clearInterval(timer);
    };
  }, [userId, travellerId]);
  const interestLabel = (id) =>
    meta.data?.interests.find((interest) => interest.id === id)?.label ?? id;

  return (
    <section className="narrow member-profile">
      <RemoteState resource={traveller} />
      {member && (
        <>
          <div className="panel profile-summary">
            <Avatar person={member} large />
            <h1>{member.name}</h1>
            <p>
              {member.homeCity}
              {member.age ? ` · ${member.age} years` : ""} ·{" "}
              {labelOf("gender", member.gender)}
            </p>
            <div className="chips">
              {member.interests.map((id) => (
                <span className="chip selected" key={id}>
                  {interestLabel(id)}
                </span>
              ))}
            </div>
            <div className="profile-friend-actions">
              {userId === member.id ? (
                <Link className="friend-button" to={ROUTES.FRIENDS}>
                  My friends
                </Link>
              ) : (
                <>
                  <RemoteState resource={relationship} />
                  {!relationship.error && (
                    <FriendActions
                      key={`${userId}-${member.id}`}
                      person={member}
                      relationship={relationship.data}
                      onChange={refreshFriendship}
                      disabled={relationship.loading}
                    />
                  )}
                </>
              )}
            </div>
          </div>
          {!canViewGroups ? (
            <div className="panel friend-groups-private">
              <LockKeyhole size={26} />
              <h2>Groups are private</h2>
              <p>Become friends to see this traveller’s groups.</p>
            </div>
          ) : (
            <>
              <h2>
                {userId === member.id
                  ? "Your groups"
                  : "Groups they’re part of"}
              </h2>
              {member.groups.length === 0 ? (
                <Empty title="Adventures still to come">
                  This traveller hasn’t joined a group yet.
                </Empty>
              ) : (
                <div className="group-list">
                  {member.groups.map((group) => (
                    <article key={group.id} className="panel request-row">
                      <div>
                        <h3>{group.name}</h3>
                        <p className="muted">
                          {group.city} ·{" "}
                          {formatDates(group.checkIn, group.checkOut)}
                        </p>
                        <span className="badge">
                          {group.memberCount} / {group.maxSize} travellers ·{" "}
                          {labelOf("role", group.role)}
                        </span>
                      </div>
                      <button
                        className="secondary"
                        onClick={() => navigate(ROUTES.GROUP(group.id))}
                      >
                        View group ↗
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
