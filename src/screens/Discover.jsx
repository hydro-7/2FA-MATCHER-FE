import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowRight, CalendarDays, CircleAlert, Filter, Layers, List, MapPin, Sparkles, Wand2, Moon, Search, Users, Zap } from "lucide-react";
import { BUDGET_SLIDER, CITY_PHOTOS, DISCOVER_SORTS, HERO_PHOTO, SEARCH_DEBOUNCE_MS } from "../constants/app";
import { ROUTES } from "../config/routes";
import { formatDates, formatMoney, labelOf, nightsBetween } from "../lib/format";
import { useMeta } from "../hooks/useMeta";
import { matchService } from "../services/matchService";
import { requestService } from "../services/requestService";
import { useSearch } from "../store/search";
import { useSession } from "../store/session";
import { toast } from "../store/toast";
import { Dropdown } from "../components/Dropdown";
import { SwipeDeck } from "../components/SwipeDeck";
import { Notice, RemoteState } from "../components/ui";

const VISIBLE_INTERESTS = 6;

const SORTERS = {
  BEST: () => 0,
  BUDGET: (a, b) => a.budgetInr - b.budgetInr,
  DATES: (a, b) => a.checkIn.localeCompare(b.checkIn),
};

export function Discover() {
  const meta = useMeta();
  return (
    <div className="discover">
      <RemoteState resource={meta} />
      {meta.data && <DiscoverBody meta={meta.data} />}
    </div>
  );
}

function initialFilters(meta, profile, params, saved) {
  // The URL wins for what it carries; everything else comes from the saved search.
  if (saved)
    return {
      ...saved,
      city: params.get("city") ?? saved.city,
      checkIn: params.get("checkIn") ?? saved.checkIn,
      checkOut: params.get("checkOut") ?? saved.checkOut,
      budgetInr: params.get("budget") ?? saved.budgetInr,
    };
  return {
    homeCity: profile.homeCity,
    city: params.get("city") ?? "",
    checkIn: params.get("checkIn") ?? meta.dateWindow.FIRST_CHECK_IN,
    checkOut: params.get("checkOut") ?? meta.dateWindow.LAST_CHECK_OUT,
    budgetInr: params.get("budget") || useSession.getState().budget || "",
    interests: profile.interests,
    genderPreference: profile.genderPreference,
    genderMix: "",
  };
}

function missingCriteria(filters, minInterests) {
  if (!filters.city) return "Pick a destination to see matching groups.";
  if (!filters.checkIn || !filters.checkOut || filters.checkOut <= filters.checkIn) return "Choose travel dates with check-out after check-in.";
  if (!(Number(filters.budgetInr) > 0)) return "Set your budget per person.";
  if (filters.interests.length < minInterests) return `Pick at least ${minInterests} interests.`;
  return "";
}

function DiscoverBody({ meta }) {
  const profile = useSession((state) => state.profile);
  const search = useSearch();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(() =>
    initialFilters(meta, profile, params, search.travellerId === profile.id ? search.criteria : null),
  );
  const [query, setQuery] = useState("");
  const sort = search.view.sort || DISCOVER_SORTS[0].id;
  const setSort = (value) => search.setView({ sort: value });
  const [showAllInterests, setShowAllInterests] = useState(false);
  const [loading, setLoading] = useState(false);
  const view = search.view.mode;
  const setView = (mode) => search.setView({ mode });
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const latest = useRef(0);
  const result = search.travellerId === profile.id ? search.result : null;
  const missing = missingCriteria(filters, meta.matchRules.MIN_SHARED_INTERESTS);
  const { FIRST_CHECK_IN, LAST_CHECK_OUT } = meta.dateWindow;
  const set = (patch) => setFilters((current) => ({ ...current, ...patch }));
  const interestLabel = (id) => meta.interests.find((interest) => interest.id === id)?.label ?? id;

  useEffect(() => {
    if (missing) return;
    const ticket = ++latest.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      setParams({ city: filters.city, checkIn: filters.checkIn, checkOut: filters.checkOut, budget: filters.budgetInr }, { replace: true });
      try {
        const { genderMix, ...criteria } = filters;
        const data = await matchService.search({ ...criteria, budgetInr: Number(criteria.budgetInr), filters: genderMix ? { genderMix } : undefined });
        if (ticket === latest.current) search.setResult(profile.id, filters, search.filters, data);
      } catch (failure) {
        if (ticket === latest.current) setError(failure.message);
      } finally {
        if (ticket === latest.current) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // Re-search only when the criteria change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, missing]);

  async function join(match) {
    if (joining || match.myRequestStatus || match.seatsLeft === 0) return;
    setJoining(true);
    setError("");
    try {
      await requestService.create(match.groupId, result.searchId);
      search.markRequested(match.groupId);
      toast("Request sent. You’ll join once the creator approves.");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setJoining(false);
    }
  }

  function clearAll() {
    setFilters({ ...initialFilters(meta, profile, new URLSearchParams(), null), city: filters.city });
    setQuery("");
  }

  const needle = query.trim().toLowerCase();
  const matches = (result?.matches ?? [])
    .filter((match) => !needle || [match.name, match.city, ...match.interests.map(interestLabel)].some((text) => text.toLowerCase().includes(needle)))
    .sort(SORTERS[sort]);
  const interests = showAllInterests ? meta.interests : meta.interests.slice(0, VISIBLE_INTERESTS);
  const toggleInterest = (id, on) => set({ interests: on ? [...filters.interests, id] : filters.interests.filter((value) => value !== id) });

  return (
    <>
      <header className="discover-head">
        <div>
          <h1>Discover Groups</h1>
          <p>Find travel groups that match your dates, destination and interests.</p>
        </div>
        <label className="discover-search">
          <Search size={20} />
          <input type="search" placeholder="Search groups, destinations or interests…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="sort-box">
          <span>Sort by:</span>
          <Dropdown required options={DISCOVER_SORTS} value={sort} onChange={(e) => setSort(e.target.value)} />
        </div>
      </header>

      <div className="discover-layout">
        <aside className="filter-card">
          <div className="filter-title">
            <h2>
              <Filter size={20} /> Filters
            </h2>
            <button type="button" className="link-btn" onClick={clearAll}>
              Clear all
            </button>
          </div>

          <div className="filter-group">
            <span className="filter-label">Destination</span>
            <div className="boxed with-icon">
              <MapPin size={18} />
              <Dropdown required options={meta.cityOptions} placeholder="Choose a city" value={filters.city} onChange={(e) => set({ city: e.target.value })} />
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">
              Travel dates <small>(overlap)</small>
            </span>
            <div className="date-stack">
              <label className="boxed with-icon dates">
                <CalendarDays size={18} />
                <small>From</small>
                <input type="date" aria-label="Check-in" min={FIRST_CHECK_IN} max={LAST_CHECK_OUT} value={filters.checkIn} onChange={(e) => set({ checkIn: e.target.value })} />
              </label>
              <label className="boxed with-icon dates">
                <CalendarDays size={18} />
                <small>To</small>
                <input
                  type="date"
                  aria-label="Check-out"
                  min={filters.checkIn || FIRST_CHECK_IN}
                  max={LAST_CHECK_OUT}
                  value={filters.checkOut}
                  onChange={(e) => set({ checkOut: e.target.value })}
                />
              </label>
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">
              Budget <small>(per person)</small>
              <b>{filters.budgetInr ? formatMoney(Number(filters.budgetInr)) : "—"}</b>
            </span>
            <input
              type="range"
              className="range"
              aria-label="Budget per person"
              min={BUDGET_SLIDER.MIN}
              max={BUDGET_SLIDER.MAX}
              step={BUDGET_SLIDER.STEP}
              value={filters.budgetInr || BUDGET_SLIDER.MIN}
              onChange={(e) => set({ budgetInr: e.target.value })}
            />
            <div className="range-ends">
              <span>{formatMoney(BUDGET_SLIDER.MIN)}</span>
              <span>{formatMoney(BUDGET_SLIDER.MAX)}</span>
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">Your interests</span>
            {interests.map((interest) => (
              <label key={interest.id} className="check-row">
                <input type="checkbox" checked={filters.interests.includes(interest.id)} onChange={(e) => toggleInterest(interest.id, e.target.checked)} />
                {interest.label}
              </label>
            ))}
            <button type="button" className="link-btn" onClick={() => setShowAllInterests(!showAllInterests)}>
              {showAllInterests ? "Show fewer" : `Show all ${meta.interests.length}`}
            </button>
          </div>

          <div className="filter-group">
            <span className="filter-label">Gender preference</span>
            <div className="boxed">
              <Dropdown required options={meta.genderPreferenceOptions} value={filters.genderPreference} onChange={(e) => set({ genderPreference: e.target.value })} />
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">Group mix</span>
            <div className="boxed">
              <Dropdown options={meta.genderMixOptions} placeholder="Any" value={filters.genderMix} onChange={(e) => set({ genderMix: e.target.value })} />
            </div>
          </div>
        </aside>

        <section className="results">
          <div className="results-head">
            <h2 className="results-count">
              {missing ? "Set your trip" : loading && !result ? "Finding groups…" : `${matches.length} matching ${matches.length === 1 ? "group" : "groups"}`}
            </h2>
            <div className="view-toggle" role="group" aria-label="Result view">
              <button type="button" className={view === "list" ? "active" : ""} aria-pressed={view === "list"} onClick={() => setView("list")}>
                <List size={18} /> List
              </button>
              <button type="button" className={view === "swipe" ? "active" : ""} aria-pressed={view === "swipe"} onClick={() => setView("swipe")}>
                <Layers size={18} /> Swipe
              </button>
            </div>
          </div>
          <Notice error>{error}</Notice>
          {missing ? (
            <div className="results-empty">{missing}</div>
          ) : (
            <div className={`match-list ${loading ? "is-loading" : ""}`}>
              {result && matches.length === 0 && <div className="results-empty">No groups match yet. Try other dates, a wider budget or more interests.</div>}
              {view === "swipe" && matches.length > 0 ? (
                <SwipeDeck
                  key={`${result.searchId}-${sort}-${needle}`}
                  matches={matches}
                  busy={joining}
                  onRequest={join}
                  renderCard={(match) => <MatchCard match={match} searchId={result.searchId} interestLabel={interestLabel} />}
                />
              ) : (
                matches.map((match) => <MatchCard key={match.groupId} match={match} searchId={result.searchId} interestLabel={interestLabel} />)
              )}
              <NearMisses groups={result?.nearMisses ?? []} filters={filters} onFix={set} />
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function MatchCard({ match, searchId, interestLabel }) {
  const to = ROUTES.GROUP(match.groupId);
  const state = { match, searchId };
  return (
    <article className="match-card">
      <Link to={to} state={state} className="match-photo" style={{ backgroundImage: `url("${CITY_PHOTOS[match.city] ?? HERO_PHOTO.SRC}")` }} aria-label={match.name} />
      <div className="match-body">
        <div className="match-tags">
          <span className="tag-green">
            <Zap size={14} fill="currentColor" /> {Math.round(match.score)}% Match
          </span>
          <span className="tag-orange">
            <Users size={14} /> {match.seatsLeft} {match.seatsLeft === 1 ? "spot" : "spots"} left
          </span>
          {match.myRequestStatus && <span className="tag-blue">Request {labelOf("requestStatus", match.myRequestStatus).toLowerCase()}</span>}
        </div>
        <h3>
          <Link to={to} state={state}>
            {match.name}
          </Link>
        </h3>
        <div className="match-meta">
          <span>
            <MapPin size={16} /> {match.city}
          </span>
          <span>
            <CalendarDays size={16} /> {formatDates(match.checkIn, match.checkOut)}
          </span>
          <span>
            <Moon size={16} /> {nightsBetween(match.checkIn, match.checkOut)} nights
          </span>
        </div>
        <p className="match-desc">{match.itinerary}</p>
        <div className="match-interests">
          {match.interests.map((id) => (
            <span key={id}>{interestLabel(id)}</span>
          ))}
        </div>
      </div>
      <div className="match-side">
        <div className="match-price">
          <strong>{formatMoney(match.budgetInr)}</strong>
          <small>per person</small>
        </div>
        <Link className="details-btn" to={to} state={state}>
          View Details <ArrowRight size={18} />
        </Link>
      </div>
    </article>
  );
}

// One-tap fixes for rules the seeker controls; near misses without one are hidden.
function fixFor(rule, group, filters) {
  if (rule === "GENDER" && filters.genderPreference === "SAME_GENDER")
    return { label: "Open to any gender", patch: { genderPreference: "ANY" } };
  if (rule === "DATES_OVERLAP") return { label: "Use their dates", patch: { checkIn: group.checkIn, checkOut: group.checkOut } };
  if (rule === "BUDGET") return { label: `Set budget to ${formatMoney(group.budgetInr)}`, patch: { budgetInr: String(group.budgetInr) } };
  if (rule === "SHARED_INTERESTS" && group.interests)
    return { label: "Add their interests", patch: { interests: [...new Set([...filters.interests, ...group.interests])] } };
  return null;
}

function NearMisses({ groups, filters, onFix }) {
  const fixable = groups.flatMap((group) =>
    group.suggestions.flatMap((item) => {
      const fix = fixFor(item.rule, group, filters);
      return fix ? [{ group, item, fix, rule: group.rules.find((r) => r.id === item.rule) }] : [];
    }),
  );
  if (!fixable.length) return null;
  return (
    <section className="near-miss">
      <header>
        <span className="near-icon">
          <Sparkles size={22} />
        </span>
        <div>
          <h3>
            {fixable.length} more {fixable.length === 1 ? "group is" : "groups are"} one change away
          </h3>
          <p>Each of these fails just one rule. Fix it and they move into your matches.</p>
        </div>
      </header>
      <div className="near-grid">
        {fixable.map(({ group, item, fix, rule }) => (
              <article key={`${group.groupId}-${item.rule}`} className="near-card">
                <div className="near-photo" style={{ backgroundImage: `url("${CITY_PHOTOS[group.city] ?? HERO_PHOTO.SRC}")` }} />
                <div className="near-body">
                  <Link to={ROUTES.GROUP(group.groupId)}>{group.name}</Link>
                  <small>
                    {formatDates(group.checkIn, group.checkOut)} · {formatMoney(group.budgetInr)}
                  </small>
                  <span className="near-reason">
                    <CircleAlert size={15} /> {rule?.label ?? item.rule}: {item.suggestion}
                  </span>
                </div>
                <button type="button" className="fix-btn" onClick={() => onFix(fix.patch)}>
                  <Wand2 size={16} /> {fix.label}
                </button>
              </article>
        ))}
      </div>
    </section>
  );
}
