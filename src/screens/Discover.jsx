import { useRef, useState } from "react";
import { ROUTES } from "../config/routes";
import { labelOf } from "../lib/format";
import { useMeta } from "../hooks/useMeta";
import { matchService } from "../services/matchService";
import { requestService } from "../services/requestService";
import { NO_FILTERS, useSearch } from "../store/search";
import { useSession } from "../store/session";
import { toast } from "../store/toast";
import { GroupCard } from "../components/GroupCard";
import { SwipeDeck } from "../components/SwipeDeck";
import { SearchForm } from "../components/SearchForm";
import {
  Chips,
  Empty,
  Field,
  Notice,
  RemoteState,
  RuleChips,
  Select,
} from "../components/ui";

function toBody(criteria, filters) {
  if (!filters.sharedInterests.length && !filters.genderMix) return criteria;
  return {
    ...criteria,
    filters: {
      sharedInterests: filters.sharedInterests.length
        ? filters.sharedInterests
        : undefined,
      genderMix: filters.genderMix || undefined,
    },
  };
}

function interestLabel(match) {
  if (match.myRequestStatus)
    return labelOf("requestStatus", match.myRequestStatus);
  return match.seatsLeft > 0 ? "♡ Express interest" : "Group full";
}

export function Discover() {
  const meta = useMeta();
  const profile = useSession((state) => state.profile);
  const search = useSearch();
  const result = search.travellerId === profile.id ? search.result : null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("cards");
  const latestSearch = useRef(0);

  async function runSearch(criteria, filters) {
    const version = ++latestSearch.current;
    const data = await matchService.search(toBody(criteria, filters));
    if (version !== latestSearch.current) return;
    search.setResult(profile.id, criteria, filters, data);
  }

  async function applyFilters(filters) {
    setBusy(true);
    setError("");
    try {
      await runSearch(search.criteria, filters);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function join(match) {
    if (busy || match.myRequestStatus || match.seatsLeft === 0) return;
    setBusy(true);
    setError("");
    try {
      await requestService.create(match.groupId, result.searchId);
      search.markRequested(match.groupId);
      toast("Request sent. You’ll join once the creator approves.");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">A SHARED DESTINATION. A NEW CONNECTION.</span>
        <h1>Find your travel people.</h1>
        <p className="lede">
          Discover groups that match the way you want to travel.
        </p>
      </div>
      <RemoteState resource={meta} />
      {meta.data && (
        <div className={`discovery-layout ${result ? "has-results" : ""}`}>
          <aside>
            <SearchForm
              meta={meta.data}
              profile={profile}
              initial={result && search.criteria}
              disabled={busy}
              onSearch={(criteria) => runSearch(criteria, search.filters)}
            />
          </aside>
          <section>
            {!result ? (
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
                    {result.matches.length} compatible{" "}
                    {result.matches.length === 1 ? "group" : "groups"}
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
                <Filters
                  meta={meta.data}
                  filters={search.filters}
                  busy={busy}
                  onApply={applyFilters}
                />
                <Notice error>{error}</Notice>
                {result.matches.length === 0 ? (
                  <Empty title="No compatible groups yet">
                    Try different dates, a wider budget or additional interests.
                  </Empty>
                ) : view === "cards" ? (
                  <SwipeDeck
                    key={result.searchId}
                    matches={result.matches}
                    busy={busy}
                    onRequest={join}
                    renderCard={(match) => (
                      <GroupCard
                        group={match}
                        to={ROUTES.GROUP(match.groupId)}
                        state={{ match, searchId: result.searchId }}
                        subtitle={`Created by ${match.ownerName} · match score ${match.score}`}
                      >
                        <RuleChips rules={match.rules} />
                      </GroupCard>
                    )}
                  />
                ) : (
                  <div className="group-list">
                    {result.matches.map((match) => (
                      <GroupCard
                        key={match.groupId}
                        group={match}
                        to={ROUTES.GROUP(match.groupId)}
                        state={{ match, searchId: result.searchId }}
                        subtitle={`Created by ${match.ownerName} · match score ${match.score}`}
                        action={
                          <button
                            disabled={
                              busy ||
                              Boolean(match.myRequestStatus) ||
                              match.seatsLeft === 0
                            }
                            onClick={() => join(match)}
                          >
                            {interestLabel(match)}
                          </button>
                        }
                      >
                        <RuleChips rules={match.rules} />
                      </GroupCard>
                    ))}
                  </div>
                )}
                {result.nearMisses.length > 0 && (
                  <details className="panel near-misses">
                    <summary>
                      Other groups: why they don’t match (
                      {result.nearMisses.length})
                    </summary>
                    <p className="caption">
                      These are not compatible matches. All six rules must pass
                      before you can request to join.
                    </p>
                    {result.nearMisses.map((group) => (
                      <article key={group.groupId}>
                        <h3>{group.name}</h3>
                        {group.suggestions.map((item) => (
                          <p key={item.rule}>{item.suggestion}</p>
                        ))}
                      </article>
                    ))}
                  </details>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function Filters({ meta, filters, busy, onApply }) {
  const [draft, setDraft] = useState(filters);
  return (
    <details className="panel filters">
      <summary>Refine results</summary>
      <p>Filter your compatible matches.</p>
      <Chips
        options={meta.interests}
        selected={draft.sharedInterests}
        onChange={(sharedInterests) => setDraft({ ...draft, sharedInterests })}
      />
      <Field label="Gender composition">
        <Select
          options={meta.genderMixOptions}
          placeholder="Any"
          value={draft.genderMix}
          onChange={(e) => setDraft({ ...draft, genderMix: e.target.value })}
        />
      </Field>
      <div className="actions">
        <button disabled={busy} onClick={() => onApply(draft)}>
          Apply filters
        </button>
        <button
          className="text-button"
          disabled={busy}
          onClick={() => {
            setDraft(NO_FILTERS);
            onApply(NO_FILTERS);
          }}
        >
          Clear filters
        </button>
      </div>
    </details>
  );
}
