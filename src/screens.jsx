import { useEffect, useRef, useState } from "react";
import { api, isPreview } from "./api";
import {
  Avatar,
  Chips,
  dates,
  Empty,
  Field,
  GroupCard,
  Money,
  Notice,
  RemoteState,
  useResource,
} from "./components";
import { Stays } from "./stays";

function CatalogSelect({ options = [], ...props }) {
  return (
    <select {...props}>
      <option value="">Choose an option</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label || option.name}
        </option>
      ))}
    </select>
  );
}

export function Profile({ catalog, profile, onSaved }) {
  const [form, setForm] = useState({
    name: profile?.name || "",
    homeCity: profile?.homeCity || "",
    age: profile?.age || "",
    gender: profile?.gender || "",
    genderPreference: profile?.genderPreference || "",
    interests: profile?.interests || [],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function change(key, value) {
    setForm({ ...form, [key]: value });
  }
  async function submit(event) {
    event.preventDefault();
    if (profile && !isPreview) {
      onSaved(profile);
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (!form.interests.length)
        throw new Error(
          "Choose your interests so we can find compatible groups.",
        );
      const result = await api.saveProfile({
        ...form,
        age: form.age ? Number(form.age) : null,
      });
      onSaved(result.profile);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="form-layout">
      <aside>
        <span className="eyebrow">LET’S GET TO KNOW YOU</span>
        <h1>
          Great company
          <br />
          starts with you.
        </h1>
        <p className="lede">
          A few details help you find people who travel your way.
        </p>
        <div className="aside-note">
          Your profile stays saved, so you can come back to your plans anytime.
        </div>
      </aside>
      <div className="panel">
        <h2>Your travel profile</h2>
        <p className="muted">
          Tell your future travel companions a little about yourself.
        </p>
        <RemoteState resource={catalog} />
        {profile && !isPreview && (
          <Notice>
            Your profile is saved. Use Switch traveller to create or choose
            another profile.
          </Notice>
        )}
        <form onSubmit={submit}>
          <fieldset
            disabled={Boolean(profile) && !isPreview}
            className="profile-fields"
          >
            <div className="form-grid">
              <Field label="Your name">
                <input
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => change("name", e.target.value)}
                  autoComplete="name"
                />
              </Field>
              <Field label="Home city">
                <input
                  required
                  maxLength={100}
                  value={form.homeCity}
                  list="home-cities"
                  onChange={(e) => change("homeCity", e.target.value)}
                />
                <datalist id="home-cities">
                  {catalog.data?.homeCities?.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.label}
                    </option>
                  ))}
                </datalist>
              </Field>
              <Field label="Age (optional)">
                <input
                  type="number"
                  min="18"
                  max="100"
                  step="1"
                  value={form.age}
                  onChange={(e) => change("age", e.target.value)}
                />
              </Field>
              <Field label="Gender">
                <CatalogSelect
                  required
                  options={catalog.data?.genders}
                  value={form.gender}
                  onChange={(e) => change("gender", e.target.value)}
                />
              </Field>
            </div>
            <Field
              label="Travel group gender preference"
              hint="Same gender only means female-only for women and male-only for men."
            >
              <CatalogSelect
                required
                options={catalog.data?.genderPreferences}
                value={form.genderPreference}
                onChange={(e) => change("genderPreference", e.target.value)}
              />
            </Field>
            <fieldset>
              <legend>Your interests</legend>
              <p className="muted">
                Choose the things you’d love to share on your trip.
              </p>
              <Chips
                options={catalog.data?.interests}
                selected={form.interests}
                onChange={(values) => change("interests", values)}
              />
            </fieldset>
          </fieldset>
          <Notice error>{error}</Notice>
          <button className="full" disabled={busy || !catalog.data}>
            {busy
              ? "Saving profile…"
              : profile && !isPreview
                ? "Continue with this profile →"
                : "Save & continue →"}
          </button>
        </form>
      </div>
    </section>
  );
}

export function TripForm({ catalog, mode, profile, onCreated, onSearch }) {
  const create = mode === "create";
  const [form, setForm] = useState({
    name: "",
    homeCity: profile?.homeCity || "",
    destinationId: "",
    checkIn: "",
    checkOut: "",
    capacity: "",
    budget: "",
    itinerary: "",
    genderPreference: profile?.genderPreference || "",
    interests: profile?.interests || [],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function change(key, value) {
    setForm({ ...form, [key]: value });
  }
  async function submit(event) {
    event.preventDefault();
    setError("");
    if (form.checkOut <= form.checkIn) {
      setError("Check-out must be after check-in.");
      return;
    }
    if (!create && !form.interests.length) {
      setError("Choose at least one trip interest.");
      return;
    }
    setBusy(true);
    try {
      const payload = { ...form, budget: Number(form.budget) };
      if (create) {
        payload.capacity = Number(form.capacity);
        const result = await api.createGroup(payload);
        onCreated(result.group);
      } else {
        await onSearch(payload);
      }
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  const config = catalog.data?.constraints;
  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {create ? "MAKE ROOM FOR COMPANY" : "YOUR NEXT CHAPTER"}
          </span>
          {create ? (
            <h1 className="form-title">Create your group trip</h1>
          ) : (
            <h2>Where are you headed?</h2>
          )}
        </div>
        <span className="badge">
          {create ? "You lead the way" : "Find your fit"}
        </span>
      </div>
      <RemoteState resource={catalog} />
      <form onSubmit={submit}>
        {create && (
          <Field label="Group name">
            <input
              required
              maxLength={100}
              placeholder="Give your adventure a name"
              value={form.name}
              onChange={(e) => change("name", e.target.value)}
            />
          </Field>
        )}
        <div className="form-grid">
          <Field label="Destination">
            <CatalogSelect
              required
              options={catalog.data?.destinations}
              value={form.destinationId}
              onChange={(e) => change("destinationId", e.target.value)}
            />
          </Field>
          <Field
            label="Budget per person (INR)"
            hint="Approximate overall trip budget, not just accommodation."
          >
            <input
              required
              type="number"
              min="1"
              step="1"
              value={form.budget}
              onChange={(e) => change("budget", e.target.value)}
            />
          </Field>
          <Field label="Check-in">
            <input
              required
              type="date"
              min={config?.minDate}
              max={config?.maxDate}
              value={form.checkIn}
              onChange={(e) => change("checkIn", e.target.value)}
            />
          </Field>
          <Field label="Check-out">
            <input
              required
              type="date"
              min={form.checkIn || config?.minDate}
              max={config?.maxDate}
              value={form.checkOut}
              onChange={(e) => change("checkOut", e.target.value)}
            />
          </Field>
          {create && (
            <Field label="Total travellers, including you">
              <input
                required
                type="number"
                min={config?.minCapacity}
                max={config?.maxCapacity}
                value={form.capacity}
                onChange={(e) => change("capacity", e.target.value)}
              />
            </Field>
          )}
          <Field
            label="Group gender preference"
            hint={
              create
                ? "Uses the creator’s saved profile preference."
                : undefined
            }
          >
            <CatalogSelect
              required
              disabled={create}
              options={catalog.data?.genderPreferences}
              value={form.genderPreference}
              onChange={(e) => change("genderPreference", e.target.value)}
            />
          </Field>
        </div>
        {create ? (
          <Field
            label="Proposed itinerary"
            hint="A short description is enough. Your group can discuss the details together."
          >
            <textarea
              required
              rows={4}
              maxLength={2000}
              value={form.itinerary}
              onChange={(e) => change("itinerary", e.target.value)}
            />
          </Field>
        ) : (
          <details className="interest-picker">
            <summary>
              Trip interests <span>{form.interests.length} selected</span>
            </summary>
            <p className="caption">
              Choose what you’d like to share on this trip.
            </p>
            <Chips
              options={catalog.data?.interests}
              selected={form.interests}
              onChange={(values) => change("interests", values)}
            />
          </details>
        )}
        <Notice error>{error}</Notice>
        <button disabled={busy || !catalog.data}>
          {busy
            ? create
              ? "Publishing…"
              : "Finding groups…"
            : create
              ? "Publish group →"
              : isPreview
                ? "Preview discovery cards →"
                : "Find compatible groups →"}
        </button>
      </form>
    </div>
  );
}

export function Discover({ catalog, profile, onOpen }) {
  const [results, setResults] = useState(null);
  const [index, setIndex] = useState(0);
  const [view, setView] = useState("cards");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [interests, setInterests] = useState([]);
  const [composition, setComposition] = useState("");
  const [criteria, setCriteria] = useState(null);
  const [nearMisses, setNearMisses] = useState([]);
  const pointerStart = useRef(null);
  const [dragX, setDragX] = useState(0);
  const [feedback, setFeedback] = useState("");
  useEffect(() => {
    if (isPreview)
      api
        .searchGroups({})
        .then((response) => setResults(response.groups))
        .catch((failure) => setError(failure.message));
  }, []);
  async function search(values) {
    setResults(null);
    setNearMisses([]);
    setFeedback("");
    const response = await api.searchGroups({
      ...values,
      sharedInterestIds: interests,
      genderComposition: composition,
    });
    setResults(response.groups);
    setNearMisses(response.nearMisses || []);
    setCriteria(values);
    setIndex(0);
    setError("");
  }
  async function filter() {
    setSending(true);
    setError("");
    try {
      await search(criteria);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSending(false);
    }
  }
  function skip() {
    if (!sending) {
      setIndex((value) => value + 1);
      setFeedback("Skipped. On to the next adventure.");
    }
  }
  async function join(group) {
    if (sending || !group?.canRequest) return;
    setSending(true);
    setError("");
    try {
      await api.join(group.id);
      setFeedback(
        isPreview
          ? "Preview request sent. Try the creator view to explore approvals."
          : "Request sent. You’ll join once the creator approves.",
      );
      setResults(
        (current) =>
          current?.map((item) =>
            item.id === group.id
              ? { ...item, canRequest: false, requestStatus: "pending" }
              : item,
          ) || null,
      );
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSending(false);
    }
  }
  const current = results?.[index];
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">A SHARED DESTINATION. A NEW CONNECTION.</span>
        <h1>Find your travel people.</h1>
        <p className="lede">
          Discover groups that match the way you want to travel.
        </p>
      </div>
      <div className={`discovery-layout ${results ? "has-results" : ""}`}>
        <aside>
          <TripForm
            key={profile?.id || "search-profile"}
            catalog={catalog}
            mode="search"
            profile={profile}
            onSearch={search}
          />
        </aside>
        <section>
          {results === null ? (
            <div className="discovery-intro">
              <span className="compass" aria-hidden="true">
                ✳
              </span>
              <h2>
                Somewhere new.
                <br />
                Someone like you.
              </h2>
              <p>
                Tell us your plans to discover compatible groups. Every match
                starts with shared interests, dates and a budget that fits.
              </p>
              <div className="chips">
                <span className="chip">Shared interests</span>
                <span className="chip">Compatible dates</span>
                <span className="chip">Room for you</span>
              </div>
            </div>
          ) : (
            <>
              <div className="section-heading">
                <h2>
                  {results.length} {isPreview ? "example" : "compatible"}{" "}
                  {results.length === 1 ? "group" : "groups"}
                </h2>
                <div className="segmented">
                  <button
                    className={view === "cards" ? "chosen" : ""}
                    onClick={() => setView("cards")}
                  >
                    Cards
                  </button>
                  <button
                    className={view === "list" ? "chosen" : ""}
                    onClick={() => setView("list")}
                  >
                    List
                  </button>
                </div>
              </div>
              <details className="panel filters">
                <summary>Refine results</summary>
                <p>Filter your compatible matches.</p>
                <Chips
                  options={catalog.data?.interests}
                  selected={interests}
                  onChange={setInterests}
                />
                {catalog.data?.genderCompositions?.length > 0 && (
                  <Field label="Gender composition">
                    <CatalogSelect
                      options={catalog.data?.genderCompositions}
                      value={composition}
                      onChange={(e) => setComposition(e.target.value)}
                    />
                  </Field>
                )}
                <div className="actions">
                  <button disabled={sending} onClick={filter}>
                    Apply filters
                  </button>
                  <button
                    className="text-button"
                    onClick={async () => {
                      setInterests([]);
                      setComposition("");
                      setSending(true);
                      setError("");
                      try {
                        const response = await api.searchGroups(criteria);
                        setResults(response.groups);
                        setIndex(0);
                      } catch (failure) {
                        setError(failure.message);
                      } finally {
                        setSending(false);
                      }
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              </details>
              <Notice error>{error}</Notice>
              <Notice>{feedback}</Notice>
              {!results.length ? (
                <Empty title="No compatible groups yet">
                  Try different dates, a wider budget or additional interests.
                </Empty>
              ) : view === "list" ? (
                <div className="group-list">
                  {results.map((group) => (
                    <GroupCard key={group.id} group={group} onOpen={onOpen} />
                  ))}
                </div>
              ) : current ? (
                <div
                  className="swipe-area"
                  onPointerDown={(event) => {
                    if (
                      sending ||
                      event.target.closest("button, a, input") ||
                      (event.pointerType === "mouse" && event.button !== 0)
                    )
                      return;
                    pointerStart.current = {
                      x: event.clientX,
                      y: event.clientY,
                    };
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onPointerMove={(event) => {
                    if (pointerStart.current) {
                      const x = event.clientX - pointerStart.current.x;
                      const y = event.clientY - pointerStart.current.y;
                      if (Math.abs(x) > Math.abs(y))
                        setDragX(Math.max(-160, Math.min(160, x)));
                    }
                  }}
                  onPointerUp={(event) => {
                    if (pointerStart.current) {
                      const distance = event.clientX - pointerStart.current.x;
                      const vertical = Math.abs(
                        event.clientY - pointerStart.current.y,
                      );
                      if (
                        Math.abs(distance) > vertical &&
                        Math.abs(distance) > 90
                      ) {
                        if (distance < 0) skip();
                        else if (current.canRequest) join(current);
                        else
                          setFeedback(
                            "This group is already joined or has a pending request. You can still view its details.",
                          );
                      }
                    }
                    pointerStart.current = null;
                    setDragX(0);
                  }}
                  onPointerCancel={() => {
                    pointerStart.current = null;
                    setDragX(0);
                  }}
                >
                  <div
                    className={`swipe-card ${dragX ? "dragging" : ""}`}
                    style={{
                      transform: `translateX(${dragX}px) rotate(${dragX / 25}deg)`,
                    }}
                  >
                    {Math.abs(dragX) > 25 && (
                      <span
                        className={`swipe-stamp ${dragX > 0 ? "yes" : "no"}`}
                      >
                        {dragX > 0
                          ? current.canRequest
                            ? "LET’S GO"
                            : "ALREADY CONNECTED"
                          : "PASS"}
                      </span>
                    )}
                    <GroupCard group={current} onOpen={onOpen} />
                  </div>
                  <div className="swipe-actions">
                    <button
                      className="secondary"
                      onClick={skip}
                      disabled={sending}
                    >
                      × &nbsp; Skip
                    </button>
                    <button
                      onClick={() => join(current)}
                      disabled={sending || !current.canRequest}
                    >
                      {sending
                        ? "Sending…"
                        : current.isMember
                          ? "Already joined"
                          : current.requestStatus === "pending"
                            ? "Request pending"
                            : current.canRequest
                              ? "♡ Express interest"
                              : "Unavailable"}
                    </button>
                  </div>
                  <p className="caption">
                    {index + 1} of {results.length} · Swipe left to skip, right
                    to request. Buttons work too.
                  </p>
                </div>
              ) : (
                <Empty title="You’re all caught up">
                  Switch to List to revisit groups, or change your search.
                </Empty>
              )}
              {nearMisses.length > 0 && (
                <details className="panel near-misses">
                  <summary>
                    Other groups: why they don’t match ({nearMisses.length})
                  </summary>
                  <p className="caption">
                    These are not compatible matches. All six rules must pass
                    before you can request to join.
                  </p>
                  {nearMisses.map((group) => (
                    <article key={group.groupId}>
                      <h3>{group.name}</h3>
                      {group.suggestions?.map((suggestion) => (
                        <p key={suggestion.rule}>{suggestion.suggestion}</p>
                      ))}
                    </article>
                  ))}
                </details>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}

export function MyTrips({ onOpen, onExplore }) {
  const groups = useResource(api.myGroups, "my-groups");
  const requests = useResource(api.myRequests, "my-requests");
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">YOUR ADVENTURES, IN ONE PLACE</span>
        <h1>My trips</h1>
        <p className="lede">
          Your groups and the connections you’re making along the way.
        </p>
      </div>
      <RemoteState resource={groups} />
      {groups.data &&
        (groups.data.groups.length ? (
          <div className="trip-grid">
            {groups.data.groups.map((group) => (
              <GroupCard key={group.id} group={group} onOpen={onOpen} />
            ))}
          </div>
        ) : (
          <Empty title="Your next trip starts here">
            Create a group or find your people in Discover.
          </Empty>
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
      {!(groups.error && requests.error) && <RemoteState resource={requests} />}
      {groups.error && requests.error && (
        <p className="muted">
          Your join requests will appear here when the connection is ready.
        </p>
      )}
      {requests.data &&
        (requests.data.requests.length ? (
          <div className="panel">
            {requests.data.requests.map((request) => (
              <div key={request.id} className="request-row">
                <div>
                  <h3>{request.groupName}</h3>
                  <span className="badge">{request.status}</span>
                </div>
                <button
                  className="secondary"
                  onClick={() => onOpen(request.groupId)}
                >
                  {request.status === "approved" ? "Open group" : "View group"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            Your requests will appear here once you express interest.
          </p>
        ))}
      <div className="bottom-callout">
        <div>
          <strong>There’s more to explore.</strong>
          <p>You can join multiple groups. Joined memberships are permanent.</p>
        </div>
        <button onClick={onExplore}>Explore more groups ↗</button>
      </div>
    </>
  );
}

export function GroupDetail({ id, onMember, onBack }) {
  const resource = useResource(() => api.group(id), id);
  const [tab, setTab] = useState("overview");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const group = resource.data?.group;
  async function join() {
    setBusy(true);
    setError("");
    try {
      await api.join(id);
      setMessage("Request sent. You’ll join once the creator approves.");
      resource.reload();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button className="text-button back" onClick={onBack}>
        ← Discover groups
      </button>
      <RemoteState resource={resource} />
      <Notice>{message}</Notice>
      <Notice error>{error}</Notice>
      {group && (
        <>
          <div
            className="detail-cover"
            style={
              group.imageUrl
                ? {
                    backgroundImage: `linear-gradient(90deg,rgba(0,27,69,.88),rgba(0,27,69,.25)), url("${group.imageUrl}")`,
                  }
                : undefined
            }
          >
            <span className="eyebrow">{group.destinationName}</span>
            <h1>{group.name}</h1>
            <p>{dates(group.checkIn, group.checkOut)}</p>
            <div className="actions">
              <span className="badge">
                {group.memberCount} / {group.capacity} travellers
              </span>
              {group.isOwner && (
                <span className="badge">You’re the creator</span>
              )}
              {group.isMember && <span className="badge">Your group</span>}
              {group.status === "BOOKED" && (
                <span className="badge">Stay confirmed · booking locked</span>
              )}
            </div>
          </div>
          <div className="tabs" role="tablist" aria-label="Group sections">
            {[
              "overview",
              ...(group.isMember ? ["stays"] : []),
              "members",
              ...(group.isOwner ? ["requests"] : []),
            ].map((name) => (
              <button
                key={name}
                role="tab"
                aria-selected={tab === name}
                onClick={() => setTab(name)}
              >
                {name}
                {name === "requests" && group.pendingRequestCount > 0
                  ? ` (${group.pendingRequestCount})`
                  : ""}
              </button>
            ))}
          </div>
          {tab === "overview" && (
            <div className="detail-grid">
              <div className="panel">
                <span className="eyebrow">THE PLAN</span>
                <h2>A little about this adventure</h2>
                <p className="itinerary">{group.itinerary}</p>
                <h3>Your trip creator</h3>
                <button
                  className="person person-button"
                  onClick={() => onMember(group.owner.id)}
                >
                  <Avatar person={group.owner} />
                  <span>
                    {group.owner.name}
                    <small>View profile →</small>
                  </span>
                </button>
                <h3>Why this fits you</h3>
                <div className="chips">
                  {group.matchReasons?.map((reason) => (
                    <span className="chip selected" key={reason}>
                      ✓ {reason}
                    </span>
                  ))}
                </div>
              </div>
              <aside className="panel">
                <h3>The details</h3>
                <div className="price-row">
                  <span>Trip budget / person</span>
                  <strong>
                    <Money value={group.budget} />
                  </strong>
                </div>
                <div className="price-row">
                  <span>Group preference</span>
                  <strong>{group.genderPreferenceLabel}</strong>
                </div>
                <div className="price-row">
                  <span>Travellers</span>
                  <strong>
                    {group.memberCount} of {group.capacity}
                  </strong>
                </div>
                {group.isMember ? (
                  <>
                    <button className="full" onClick={() => setTab("stays")}>
                      Find a stay together →
                    </button>
                    <p className="caption">
                      Your membership is confirmed. You can still explore other
                      groups.
                    </p>
                  </>
                ) : (
                  <>
                    <button
                      className="full"
                      disabled={busy || !group.canRequest}
                      onClick={join}
                    >
                      {busy
                        ? "Sending…"
                        : group.requestStatus === "pending"
                          ? "Request pending"
                          : group.canRequest
                            ? "Express interest ♡"
                            : group.unavailableReason ||
                              "Not available to join"}
                    </button>
                    <p className="caption">
                      Your creator reviews your request before you join.
                    </p>
                  </>
                )}
              </aside>
            </div>
          )}
          {tab === "members" && (
            <div className="panel">
              <h2>Your travel company</h2>
              <div className="member-grid">
                {group.members.map((member) => (
                  <button
                    key={member.id}
                    className="member-card"
                    onClick={() => onMember(member.id)}
                  >
                    <Avatar person={member} large />
                    <strong>{member.name}</strong>
                    <small>{member.homeCity}</small>
                    <span className="text-link">View profile →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {tab === "requests" && group.isOwner && (
            <Requests id={id} onChanged={resource.reload} />
          )}
          {tab === "stays" && group.isMember && (
            <Stays group={group} onChanged={resource.reload} />
          )}
        </>
      )}
    </>
  );
}

function Requests({ id, onChanged }) {
  const resource = useResource(() => api.requests(id), id);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function decide(requestId, status) {
    setBusy(requestId);
    setError("");
    try {
      await api.decide(id, requestId, status);
      onChanged();
    } catch (failure) {
      setError(failure.message);
      resource.reload();
    } finally {
      setBusy("");
    }
  }
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Join requests</h2>
        <button className="secondary" onClick={resource.reload}>
          Refresh
        </button>
      </div>
      <RemoteState resource={resource} />
      <Notice error>{error}</Notice>
      {resource.data &&
        (resource.data.requests.length ? (
          resource.data.requests.map((request) => (
            <article className="request-card" key={request.id}>
              <div className="person">
                <Avatar person={request.traveller} />
                <span>
                  <strong>{request.traveller.name}</strong>
                  <small>{request.traveller.homeCity}</small>
                </span>
                <span className="badge">{request.status}</span>
              </div>
              <div className="chips">
                {request.matchReasons?.map((reason) => (
                  <span className="chip selected" key={reason}>
                    {reason}
                  </span>
                ))}
              </div>
              {request.status === "pending" && (
                <div className="actions">
                  <button
                    disabled={Boolean(busy)}
                    onClick={() => decide(request.id, "approved")}
                  >
                    {busy === request.id ? "Updating…" : "Approve"}
                  </button>
                  <button
                    className="secondary"
                    disabled={Boolean(busy)}
                    onClick={() => decide(request.id, "rejected")}
                  >
                    Decline
                  </button>
                </div>
              )}
            </article>
          ))
        ) : (
          <Empty title="Good company is on its way">
            Pending requests will appear here for you to review.
          </Empty>
        ))}
    </section>
  );
}

export function MemberProfile({ id, onOpen }) {
  const resource = useResource(() => api.member(id), id);
  const member = resource.data?.traveller;
  return (
    <section className="narrow">
      <RemoteState resource={resource} />
      {member && (
        <>
          <div className="panel profile-summary">
            <Avatar person={member} large />
            <h1>{member.name}</h1>
            <p>
              {member.homeCity}
              {member.age ? ` · ${member.age} years` : ""}
            </p>
            <div className="chips">
              {member.interestLabels.map((interest) => (
                <span className="chip selected" key={interest}>
                  {interest}
                </span>
              ))}
            </div>
          </div>
          <h2>Groups they’re part of</h2>
          <div className="group-list">
            {member.groups?.map((group) => (
              <article key={group.id} className="panel request-row">
                <div>
                  <h3>{group.name}</h3>
                  <p className="muted">
                    {group.destinationName} ·{" "}
                    {dates(group.checkIn, group.checkOut)}
                  </p>
                  <span className="badge">
                    {group.memberCount} / {group.capacity} travellers ·{" "}
                    {group.role === "OWNER" ? "Creator" : "Member"}
                  </span>
                </div>
                <button className="secondary" onClick={() => onOpen(group.id)}>
                  View group ↗
                </button>
              </article>
            ))}
          </div>
          {member.groups === null && (
            <p className="muted">
              Group memberships are available to the selected traveller in My
              trips.
            </p>
          )}
          {member.groups?.length === 0 && (
            <Empty title="Adventures still to come">
              This traveller hasn’t joined a group yet.
            </Empty>
          )}
        </>
      )}
    </section>
  );
}
