import { useNavigate, useParams } from "react-router";
import { ROUTES } from "../config/routes";
import { formatDates, labelOf } from "../lib/format";
import { useMeta } from "../hooks/useMeta";
import { useResource } from "../hooks/useResource";
import { travellerService } from "../services/travellerService";
import { Avatar, Empty, RemoteState } from "../components/ui";

export function MemberProfile() {
  const { travellerId } = useParams();
  const navigate = useNavigate();
  const meta = useMeta();
  const traveller = useResource(() => travellerService.get(travellerId), travellerId);
  const member = traveller.data;
  const interestLabel = (id) => meta.data?.interests.find((interest) => interest.id === id)?.label ?? id;

  return (
    <section className="narrow">
      <RemoteState resource={traveller} />
      {member && (
        <>
          <div className="panel profile-summary">
            <Avatar person={member} large />
            <h1>{member.name}</h1>
            <p>
              {member.homeCity}
              {member.age ? ` · ${member.age} years` : ""} · {labelOf("gender", member.gender)}
            </p>
            <div className="chips">
              {member.interests.map((id) => (
                <span className="chip selected" key={id}>
                  {interestLabel(id)}
                </span>
              ))}
            </div>
          </div>
          <h2>Groups they’re part of</h2>
          {member.groups.length === 0 ? (
            <Empty title="Adventures still to come">This traveller hasn’t joined a group yet.</Empty>
          ) : (
            <div className="group-list">
              {member.groups.map((group) => (
                <article key={group.id} className="panel request-row">
                  <div>
                    <h3>{group.name}</h3>
                    <p className="muted">
                      {group.city} · {formatDates(group.checkIn, group.checkOut)}
                    </p>
                    <span className="badge">
                      {group.memberCount} / {group.maxSize} travellers · {labelOf("role", group.role)}
                    </span>
                  </div>
                  <button className="secondary" onClick={() => navigate(ROUTES.GROUP(group.id))}>
                    View group ↗
                  </button>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
