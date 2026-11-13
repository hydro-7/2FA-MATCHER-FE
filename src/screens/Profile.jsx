import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Check, MapPin, Plus, Search, Users, UserRound } from "lucide-react";
import { BUDGET_SLIDER, HERO_PHOTO, LIMITS, SIGN_UP_REASONS } from "../constants/app";
import { FALLBACK_ICON, GENDER_GLYPHS, INTEREST_ICONS } from "../constants/icons";
import { ROUTES } from "../config/routes";
import { formatMoney, labelOf } from "../lib/format";
import { useMeta } from "../hooks/useMeta";
import { travellerService } from "../services/travellerService";
import { EMPTY_PROFILE_DRAFT, useDrafts } from "../store/drafts";
import { useSession } from "../store/session";
import { toast } from "../store/toast";
import { Stepper } from "../components/Stepper";
import { Swoosh } from "../components/Swoosh";
import { Dropdown } from "../components/Dropdown";
import { Notice, RemoteState } from "../components/ui";

const STEPS = [
  { label: "Profile", note: "Set up your traveller profile to find the right travel buddies." },
  { label: "Interests", note: "Pick your travel interests to find like-minded travellers." },
  { label: "Preferences", note: "Set your travel preferences for better matches." },
];

export function Profile() {
  const meta = useMeta();
  const profile = useSession((state) => state.profile);
  const step = useDrafts((state) => state.profile?.step) ?? 0;
  return (
    <div className="wizard">
      <aside className="wizard-photo" style={{ backgroundImage: `url("${HERO_PHOTO.SRC}")` }}>
        <p className="handwritten">
          {profile ? "Your profile travels with you." : STEPS[step].note}
          <Swoosh className="white" />
        </p>
      </aside>
      <section className="wizard-main">
        <RemoteState resource={meta} />
        {meta.data && (profile ? <SavedProfile meta={meta.data} profile={profile} /> : <SignUpWizard meta={meta.data} />)}
      </section>
    </div>
  );
}

function SavedProfile({ meta, profile }) {
  const interestLabel = (id) => meta.interests.find((interest) => interest.id === id)?.label ?? id;
  return (
    <>
      <h1 className="wizard-title">
        Hi, <span className="accent">{profile.name.split(" ")[0]}<Swoosh className="orange" /></span>
      </h1>
      <p className="wizard-sub">Your profile is saved. Use Switch traveller in the menu to change who you are.</p>
      <div className="field-row">
        <div className="field-card">
          <span className="field-label">Home city</span>
          <span className="field-value">
            <MapPin size={18} /> {profile.homeCity}
          </span>
        </div>
        <div className="field-card">
          <span className="field-label">Gender</span>
          <span className="field-value">{labelOf("gender", profile.gender)}</span>
        </div>
        <div className="field-card">
          <span className="field-label">Travels with</span>
          <span className="field-value">{labelOf("genderPreference", profile.genderPreference)}</span>
        </div>
      </div>
      <div className="tile-chips">
        {profile.interests.map((id) => {
          const Icon = INTEREST_ICONS[id] ?? FALLBACK_ICON;
          return (
            <span key={id} className="tile-chip">
              <Icon size={16} /> {interestLabel(id)}
            </span>
          );
        })}
      </div>
      <div className="wizard-actions">
        <Link className="ghost-btn" to={ROUTES.FRIENDS}>
          <Users size={18} /> My friends
        </Link>
        <Link className="ghost-btn" to={ROUTES.NEW_GROUP}>
          <Plus size={18} /> Create a trip
        </Link>
        <Link className="next-btn" to={ROUTES.DISCOVER}>
          <Search size={18} /> Find a group
        </Link>
      </div>
    </>
  );
}

function SignUpWizard({ meta }) {
  const draft = useDrafts((state) => state.profile) ?? EMPTY_PROFILE_DRAFT;
  const setProfileDraft = useDrafts((state) => state.setProfileDraft);
  const clearProfileDraft = useDrafts((state) => state.clearProfileDraft);
  const { step, form } = draft;
  const setStep = (value) => setProfileDraft({ step: value });
  const setForm = (value) => setProfileDraft({ form: value });
  const signIn = useSession((state) => state.signIn);
  const setBudget = useSession((state) => state.setBudget);
  const navigate = useNavigate();
  const from = useLocation().state?.from;
  const reason = from && (SIGN_UP_REASONS[from.split("?")[0]] ?? "continue");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const minInterests = meta.matchRules.MIN_SHARED_INTERESTS;
  const change = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  const toggleInterest = (id) =>
    setForm({ ...form, interests: form.interests.includes(id) ? form.interests.filter((value) => value !== id) : [...form.interests, id] });

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (step === 0 && !form.gender) return setError("Choose your gender.");
    if (step === 1 && form.interests.length < minInterests) return setError(`Pick at least ${minInterests} interests.`);
    if (step === 2 && !form.genderPreference) return setError("Choose who you want to travel with.");
    if (step < STEPS.length - 1) return setStep(step + 1);
    setBusy(true);
    try {
      const home = meta.homeCities.find((city) => city.city === form.homeCity.trim());
      const profile = await travellerService.signUp({
        name: form.name.trim(),
        homeCity: form.homeCity.trim(),
        homeAirport: home?.airport,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender,
        genderPreference: form.genderPreference,
        interests: form.interests,
      });
      clearProfileDraft();
      signIn(profile);
      setBudget(form.budget);
      toast(`Welcome, ${profile.name}!`);
      navigate(from ?? ROUTES.START, { replace: true });
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Stepper steps={STEPS.map((item) => item.label)} current={step} />
      {reason && step === 0 && <Notice>Create your profile to {reason}. You’ll go straight there after.</Notice>}

      {step === 0 && (
        <>
          <h1 className="wizard-title">
            Tell us about{" "}
            <span className="accent">
              yourself
              <Swoosh className="orange" />
            </span>
          </h1>
          <p className="wizard-sub">This helps us match you with the right travel groups.</p>
          <div className="field-row">
            <label className="field-card grow">
              <span className="field-label">
                Full name <i>*</i>
              </span>
              <input required autoFocus maxLength={LIMITS.NAME} autoComplete="name" placeholder="e.g. Priya Shah" value={form.name} onChange={change("name")} />
            </label>
            <div className="field-card">
              <span className="field-label">
                Gender <i>*</i>
              </span>
              <div className="pill-options">
                {meta.genderOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={form.gender === option.id ? "selected" : ""}
                    aria-pressed={form.gender === option.id}
                    onClick={() => setForm({ ...form, gender: option.id })}
                  >
                    <span className="glyph">{GENDER_GLYPHS[option.id] ?? <UserRound size={16} />}</span> {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="field-row">
            <label className="field-card grow">
              <span className="field-label">
                Home city <i>*</i>
              </span>
              <span className="input-with-icon">
                <MapPin size={20} />
                <Dropdown
                  freeText
                  required
                  maxLength={LIMITS.HOME_CITY}
                  options={meta.homeCityOptions}
                  placeholder="e.g. Mumbai"
                  value={form.homeCity}
                  onChange={change("homeCity")}
                />
              </span>
            </label>
            <label className="field-card narrow-card">
              <span className="field-label">
                Age <small>(optional)</small>
              </span>
              <input type="number" min={LIMITS.MIN_AGE} max={LIMITS.MAX_AGE} placeholder="22" value={form.age} onChange={change("age")} />
            </label>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <h1 className="wizard-title">
            What do you{" "}
            <span className="accent">
              love
              <Swoosh className="orange" />
            </span>{" "}
            while travelling?
          </h1>
          <p className="wizard-sub">Select at least {minInterests} interests. This helps us match you with the right groups.</p>
          <div className="interest-grid">
            {meta.interests.map((interest) => {
              const Icon = INTEREST_ICONS[interest.id] ?? FALLBACK_ICON;
              const selected = form.interests.includes(interest.id);
              return (
                <button
                  key={interest.id}
                  type="button"
                  className={`interest-tile ${selected ? "selected" : ""}`}
                  aria-pressed={selected}
                  onClick={() => toggleInterest(interest.id)}
                >
                  {selected && (
                    <span className="tick">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                  <Icon size={30} strokeWidth={1.6} />
                  <span>{interest.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="wizard-title">
            Your travel{" "}
            <span className="accent">
              preferences
              <Swoosh className="orange" />
            </span>
          </h1>
          <p className="wizard-sub">Help us find groups that match your budget and comfort.</p>
          <div className="field-row">
            <div className="field-card">
              <span className="field-label">
                Travel budget <small>(per person)</small>
              </span>
              <div className="budget-input">
                <span className="input-with-icon">
                  ₹
                  <input
                    type="number"
                    min={BUDGET_SLIDER.MIN}
                    step={BUDGET_SLIDER.STEP}
                    placeholder="60000"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  />
                </span>
                {form.budget && <span className="budget-badge">Up to {formatMoney(Number(form.budget))}</span>}
              </div>
              <input
                type="range"
                className="range"
                aria-label="Budget slider"
                min={BUDGET_SLIDER.MIN}
                max={BUDGET_SLIDER.MAX}
                step={BUDGET_SLIDER.STEP}
                value={form.budget || BUDGET_SLIDER.MIN}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />
              <small className="field-hint">Used as your default when you search. Groups within {meta.matchRules.MAX_BUDGET_DIFF_PERCENT}% match.</small>
            </div>
            <div className="field-card">
              <span className="field-label">
                Gender preference <small>(for group)</small> <i>*</i>
              </span>
              <div className="pill-options">
                {meta.genderPreferenceOptions.map((option) => {
                  const same = option.id === "SAME_GENDER";
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={form.genderPreference === option.id ? "selected" : ""}
                      aria-pressed={form.genderPreference === option.id}
                      onClick={() => setForm({ ...form, genderPreference: option.id })}
                    >
                      {same ? <span className="glyph">{GENDER_GLYPHS[form.gender]}</span> : <Users size={18} />}
                      {same ? `${labelOf("gender", form.gender)} only` : "Any"}
                    </button>
                  );
                })}
              </div>
              <small className="field-hint">Groups match only when your preference and the creator’s both allow it.</small>
            </div>
          </div>
          <div className="field-card review-card">
            <span className="field-label">Your profile at a glance</span>
            <div className="review-line">
              <strong>{form.name}</strong>
              <span>
                <MapPin size={16} /> {form.homeCity}
              </span>
              <span>{labelOf("gender", form.gender)}</span>
              {form.age && <span>{form.age} years</span>}
            </div>
            <div className="tile-chips">
              {form.interests.map((id) => {
                const Icon = INTEREST_ICONS[id] ?? FALLBACK_ICON;
                return (
                  <span key={id} className="tile-chip">
                    <Icon size={16} /> {meta.interests.find((interest) => interest.id === id)?.label ?? id}
                  </span>
                );
              })}
            </div>
          </div>
        </>
      )}

      <Notice error>{error}</Notice>
      <div className="wizard-actions">
        {step > 0 ? (
          <button type="button" className="ghost-btn" onClick={() => setStep(step - 1)}>
            <ArrowLeft size={18} /> Back
          </button>
        ) : (
          <span />
        )}
        {step === 1 && (
          <span className="selected-count">
            <b>{form.interests.length}</b> interests selected
          </span>
        )}
        <button className="next-btn" disabled={busy}>
          {busy ? "Saving…" : step < STEPS.length - 1 ? "Next" : "Complete setup"}
          {step < STEPS.length - 1 ? <ArrowRight size={18} /> : <Check size={18} />}
        </button>
      </div>
    </form>
  );
}
