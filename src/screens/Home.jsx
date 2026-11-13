import { useNavigate } from "react-router";
import { ROUTES } from "../config/routes";
import { useSession } from "../store/session";

const STEPS = [
  { title: "Find your kind of trip", text: "Explore groups that fit your dates, budget and interests." },
  { title: "Make a connection", text: "Send a request. Your trip creator welcomes you aboard." },
  { title: "Plan the stay together", text: "Compare hotels and see exactly what each person pays." },
];

export function Home() {
  const navigate = useNavigate();
  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">GOOD TRIPS START WITH GOOD COMPANY</span>
          <h1>
            Your next adventure.
            <br />
            <span>Your kind of people.</span>
          </h1>
          <p>Meet travellers who share your interests, plan a trip together, and make room for new stories.</p>
          <div className="actions">
            <button onClick={() => navigate(ROUTES.DISCOVER)}>Find my travel people ↗</button>
            <button className="secondary" onClick={() => navigate(ROUTES.NEW_GROUP)}>
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
        {STEPS.map((step, index) => (
          <article key={step.title}>
            <span>0{index + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </section>
    </>
  );
}

export function Start() {
  const navigate = useNavigate();
  const profile = useSession((state) => state.profile);
  return (
    <section className="narrow">
      <span className="eyebrow">YOU’RE READY TO GO</span>
      <h1>Where do we start, {profile.name}?</h1>
      <p className="lede">Lead an adventure or find a group that feels like you.</p>
      <div className="choice-grid">
        <button className="choice" onClick={() => navigate(ROUTES.NEW_GROUP)}>
          <span>＋</span>
          <h2>Plan a trip</h2>
          <p>Create a group and welcome your travel companions.</p>
          <strong>Create a group →</strong>
        </button>
        <button className="choice" onClick={() => navigate(ROUTES.DISCOVER)}>
          <span>◎</span>
          <h2>Find your people</h2>
          <p>Discover trips that fit your interests, dates and budget.</p>
          <strong>Explore groups →</strong>
        </button>
      </div>
    </section>
  );
}
