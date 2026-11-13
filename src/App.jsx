import { useEffect, useState } from "react";
import { api, isPreview, setUserId } from "./api";
import Identity from "./Identity";
import { Avatar, Notice, useResource } from "./components";
import {
  Profile,
  TripForm,
  Discover,
  MyTrips,
  GroupDetail,
  MemberProfile,
} from "./screens";

export default function App() {
  const catalog = useResource(api.catalog, "catalog");
  const [identityVersion, setIdentityVersion] = useState(0);
  const session = useResource(api.session, `session-${identityVersion}`);
  const [switching, setSwitching] = useState(false);
  const [page, setPage] = useState({
    name: isPreview
      ? new URLSearchParams(location.search).get("screen") || "home"
      : "home",
    id: isPreview
      ? new URLSearchParams(location.search).get("group") || "preview-tokyo"
      : undefined,
  });
  const [profileOverride, setProfileOverride] = useState(null);
  const profile = profileOverride || session.data?.profile;
  useEffect(() => {
    function identityChanged(event) {
      if (!isPreview && event.key === "travel-matcher-user-id") {
        setProfileOverride(null);
        setIdentityVersion((value) => value + 1);
        setSwitching(false);
        setPage({ name: "home" });
      }
    }
    window.addEventListener("storage", identityChanged);
    return () => window.removeEventListener("storage", identityChanged);
  }, []);

  function navigate(name, id) {
    setPage({ name, id });
    window.scrollTo({ top: 0 });
  }

  function requireProfile(name) {
    navigate(profile ? name : "profile");
  }

  return (
    <>
      {isPreview && (
        <div className="preview-bar">
          <div>
            <strong>DESIGN PREVIEW</strong>
            <span>
              Example content · no real requests or bookings · matching is not
              evaluated
            </span>
          </div>
          <div className="preview-controls">
            <button
              onClick={() => {
                sessionStorage.setItem("preview-role", "seeker");
                location.reload();
              }}
            >
              Seeker view
            </button>
            <button
              onClick={() => {
                sessionStorage.setItem("preview-role", "creator");
                location.reload();
              }}
            >
              Creator view
            </button>
            <a href="/">Exit preview ↗</a>
          </div>
        </div>
      )}
      <header className="site-header">
        <div className="header-inner">
          <button
            className="brand"
            onClick={() => navigate("home")}
            aria-label="Travel Together home"
          >
            <span className="brand-symbol">b.</span>
            <span>
              Travel Together
              <small>A little company. A bigger adventure.</small>
            </span>
          </button>
          <span className="header-note">Find your people. Go together.</span>
          {!isPreview && (
            <a className="preview-link" href="?preview=1">
              Explore design preview ↗
            </a>
          )}
          <button
            className="profile-button"
            aria-label={
              profile ? `${profile.name}, view profile` : "Your profile"
            }
            onClick={() => navigate("profile")}
          >
            <Avatar person={profile} />
            <span>{profile?.name || "Your profile"}</span>
          </button>
          {!isPreview && (
            <button
              className="switch-button"
              onClick={() => setSwitching(true)}
            >
              Switch traveller
            </button>
          )}
        </div>
      </header>
      {switching && (
        <Identity
          current={profile}
          onClose={() => setSwitching(false)}
          onSelect={(id) => {
            setUserId(id);
            setProfileOverride(null);
            setIdentityVersion((value) => value + 1);
            setSwitching(false);
            navigate(id ? "trips" : "profile");
          }}
        />
      )}
      <nav className="main-nav" aria-label="Main navigation">
        <div>
          <button
            className={page.name === "discover" ? "active" : ""}
            onClick={() => requireProfile("discover")}
          >
            ◎ Discover groups
          </button>
          <button
            className={page.name === "trips" ? "active" : ""}
            onClick={() => requireProfile("trips")}
          >
            ▧ My trips
          </button>
          <button
            className={page.name === "create" ? "active" : ""}
            onClick={() => requireProfile("create")}
          >
            ＋ Create a group
          </button>
        </div>
      </nav>
      <main key={identityVersion}>
        {isPreview && (
          <nav className="preview-screens" aria-label="Preview screens">
            {[
              ["home", "Welcome"],
              ["profile", "Profile"],
              ["choose", "Choose a path"],
              ["create", "Create group"],
              ["discover", "Swipe discovery"],
              ["trips", "My trips"],
              ["group", "Shared group"],
            ].map(([name, label]) => (
              <button
                key={name}
                className={page.name === name ? "chosen" : ""}
                onClick={() =>
                  navigate(name, name === "group" ? "preview-tokyo" : undefined)
                }
              >
                {label}
              </button>
            ))}
          </nav>
        )}
        {page.name === "home" && (
          <>
            <section className="hero">
              <div>
                <span className="eyebrow">
                  GOOD TRIPS START WITH GOOD COMPANY
                </span>
                <h1>
                  Your next adventure.
                  <br />
                  <span>Your kind of people.</span>
                </h1>
                <p>
                  Meet travellers who share your interests, plan a trip
                  together, and make room for new stories.
                </p>
                <div className="actions">
                  <button onClick={() => requireProfile("discover")}>
                    Find my travel people ↗
                  </button>
                  <button
                    className="secondary"
                    onClick={() => requireProfile("create")}
                  >
                    Create a group
                  </button>
                </div>
                <div className="hero-foot">
                  <span>✓ Shared interests</span>
                  <span>✓ Clear costs</span>
                  <span>✓ You choose your group</span>
                </div>
              </div>
              <div className="travel-art" aria-hidden="true">
                <div className="art-sun" />
                <div className="art-mountain back" />
                <div className="art-mountain" />
                <div className="art-path" />
                <span className="art-label">More than a destination.</span>
                <div className="art-ticket">
                  <span>THE BEST PART OF THE TRIP?</span>
                  <strong>The people you meet.</strong>
                  <span>✦ &nbsp; TRAVEL TOGETHER &nbsp; ✦</span>
                </div>
              </div>
            </section>
            <section className="intro-grid">
              <article>
                <span>01</span>
                <h3>Find your kind of trip</h3>
                <p>Explore groups that fit your dates, budget and interests.</p>
              </article>
              <article>
                <span>02</span>
                <h3>Make a connection</h3>
                <p>Send a request. Your trip creator welcomes you aboard.</p>
              </article>
              <article>
                <span>03</span>
                <h3>Plan the stay together</h3>
                <p>Compare hotels and see exactly what each person pays.</p>
              </article>
            </section>
            {session.loading && (
              <p className="muted" role="status">
                Checking your saved profile…
              </p>
            )}
            {session.error && (
              <Notice error>
                Profile service: {session.error}{" "}
                <button className="text-button" onClick={session.reload}>
                  Retry
                </button>
              </Notice>
            )}
          </>
        )}
        {page.name === "profile" && (
          <Profile
            key={profile?.id || "new-profile"}
            catalog={catalog}
            profile={profile}
            onSaved={(saved) => {
              setProfileOverride(saved);
              navigate("choose");
            }}
          />
        )}
        {page.name === "choose" && (
          <section className="narrow">
            <span className="eyebrow">YOU’RE READY TO GO</span>
            <h1>
              Where do we start{profile?.name ? `, ${profile.name}` : ""}?
            </h1>
            <p className="lede">
              Lead an adventure or find a group that feels like you.
            </p>
            <div className="choice-grid">
              <button className="choice" onClick={() => navigate("create")}>
                <span>＋</span>
                <h2>Plan a trip</h2>
                <p>Create a group and welcome your travel companions.</p>
                <strong>Create a group →</strong>
              </button>
              <button className="choice" onClick={() => navigate("discover")}>
                <span>◎</span>
                <h2>Find your people</h2>
                <p>Discover trips that fit your interests, dates and budget.</p>
                <strong>Explore groups →</strong>
              </button>
            </div>
          </section>
        )}
        {page.name === "create" && (
          <TripForm
            key={profile?.id || "new-trip"}
            catalog={catalog}
            mode="create"
            profile={profile}
            onCreated={(group) => navigate("group", group.id)}
          />
        )}
        {page.name === "discover" && (
          <Discover
            catalog={catalog}
            profile={profile}
            onOpen={(id) => navigate("group", id)}
          />
        )}
        {page.name === "trips" && (
          <MyTrips
            onOpen={(id) => navigate("group", id)}
            onExplore={() => navigate("discover")}
          />
        )}
        {page.name === "group" && (
          <GroupDetail
            key={page.id}
            id={page.id}
            onMember={(id) => navigate("member", id)}
            onBack={() => navigate("discover")}
          />
        )}
        {page.name === "member" && (
          <MemberProfile id={page.id} onOpen={(id) => navigate("group", id)} />
        )}
      </main>
      <footer>
        Travel Together{" "}
        <span>
          Made for shared adventures.{" "}
          <a href="/visuals/credits.txt" target="_blank" rel="noreferrer">
            Photo credits
          </a>
        </span>
      </footer>
    </>
  );
}
