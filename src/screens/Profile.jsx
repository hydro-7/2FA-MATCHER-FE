import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { LIMITS } from "../constants/app";
import { ROUTES } from "../config/routes";
import { labelOf } from "../lib/format";
import { useMeta } from "../hooks/useMeta";
import { travellerService } from "../services/travellerService";
import { useSession } from "../store/session";
import { toast } from "../store/toast";
import { Chips, Field, Notice, RemoteState, Select } from "../components/ui";

const EMPTY_PROFILE = {
  name: "",
  homeCity: "",
  age: "",
  gender: "",
  genderPreference: "",
  interests: [],
};

export function Profile() {
  const meta = useMeta();
  const profile = useSession((state) => state.profile);
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
        <RemoteState resource={meta} />
        {meta.data &&
          (profile ? (
            <SavedProfile meta={meta.data} profile={profile} />
          ) : (
            <SignUpForm meta={meta.data} />
          ))}
      </div>
    </section>
  );
}

function SavedProfile({ meta, profile }) {
  const navigate = useNavigate();
  const interestLabel = (id) =>
    meta.interests.find((interest) => interest.id === id)?.label ?? id;
  return (
    <>
      <Notice>
        Your profile is saved. Use Switch traveller to create or choose another
        profile.
      </Notice>
      <div className="form-grid">
        <Field label="Your name">
          <input disabled value={profile.name} />
        </Field>
        <Field label="Home city">
          <input disabled value={profile.homeCity} />
        </Field>
        <Field label="Gender">
          <input disabled value={labelOf("gender", profile.gender)} />
        </Field>
        <Field label="Travel group gender preference">
          <input
            disabled
            value={labelOf("genderPreference", profile.genderPreference)}
          />
        </Field>
      </div>
      <div className="chips">
        {profile.interests.map((id) => (
          <span key={id} className="chip selected">
            {interestLabel(id)}
          </span>
        ))}
      </div>
      <button className="full" onClick={() => navigate(ROUTES.START)}>
        Continue with this profile →
      </button>
    </>
  );
}

function SignUpForm({ meta }) {
  const signIn = useSession((state) => state.signIn);
  const navigate = useNavigate();
  const from = useLocation().state?.from ?? ROUTES.START;
  const [form, setForm] = useState(EMPTY_PROFILE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const home = meta.homeCities.find(
        (city) => city.city === form.homeCity.trim(),
      );
      const profile = await travellerService.signUp({
        name: form.name.trim(),
        homeCity: form.homeCity.trim(),
        homeAirport: home?.airport,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender,
        genderPreference: form.genderPreference,
        interests: form.interests,
      });
      signIn(profile);
      toast(`Welcome, ${profile.name}!`);
      navigate(from, { replace: true });
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        <Field label="Your name">
          <input
            required
            maxLength={LIMITS.NAME}
            autoComplete="name"
            value={form.name}
            onChange={change("name")}
          />
        </Field>
        <Field label="Home city">
          <input
            required
            maxLength={LIMITS.HOME_CITY}
            list="home-cities"
            value={form.homeCity}
            onChange={change("homeCity")}
          />
          <datalist id="home-cities">
            {meta.homeCityOptions.map((home) => (
              <option key={home.id} value={home.id}>
                {home.label}
              </option>
            ))}
          </datalist>
        </Field>
        <Field label="Age (optional)">
          <input
            type="number"
            min={LIMITS.MIN_AGE}
            max={LIMITS.MAX_AGE}
            step="1"
            value={form.age}
            onChange={change("age")}
          />
        </Field>
        <Field label="Gender">
          <Select
            required
            options={meta.genderOptions}
            value={form.gender}
            onChange={change("gender")}
          />
        </Field>
      </div>
      <Field
        label="Travel group gender preference"
        hint="Same gender only means female-only for women and male-only for men."
      >
        <Select
          required
          options={meta.genderPreferenceOptions}
          value={form.genderPreference}
          onChange={change("genderPreference")}
        />
      </Field>
      <fieldset>
        <legend>Your interests</legend>
        <p className="muted">
          Choose your interests. Sharing at least{" "}
          {meta.matchRules.MIN_SHARED_INTERESTS} interests with a creator is
          needed to match.
        </p>
        <Chips
          options={meta.interests}
          selected={form.interests}
          onChange={(interests) => setForm({ ...form, interests })}
        />
      </fieldset>
      <Notice error>{error}</Notice>
      <button className="full" disabled={busy || form.interests.length === 0}>
        {busy ? "Saving profile…" : "Save & continue →"}
      </button>
    </form>
  );
}
