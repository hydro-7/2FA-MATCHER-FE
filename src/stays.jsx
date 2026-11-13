import { useState } from "react";
import { api } from "./api";
import {
  dates,
  Empty,
  Modal,
  Field,
  Money,
  Notice,
  RemoteState,
  useResource,
} from "./components";

export function Stays({ group, onChanged }) {
  const [filters, setFilters] = useState({
    sort: "price",
    minStars: "",
    page: 1,
  });
  const resource = useResource(
    () => api.hotels(group.id, filters),
    `${group.id}-${filters.sort}-${filters.minStars}-${filters.page}`,
  );
  const [compare, setCompare] = useState([]);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const data = resource.data;
  const booking = confirmation || data?.booking;

  async function action(operation) {
    setBusy(true);
    setError("");
    try {
      await operation();
      resource.reload();
    } catch (failure) {
      setError(failure.message);
      if (failure.status === 409) resource.reload();
    } finally {
      setBusy(false);
    }
  }

  async function finalize() {
    setBusy(true);
    setError("");
    try {
      const result = await api.finalize(group.id, selected.id, group);
      setConfirmation(result.booking);
      setSelected(null);
      setCompare([]);
      resource.reload();
    } catch (failure) {
      setError(failure.message);
      resource.reload();
      if (failure.status === 409) setSelected(null);
    } finally {
      setBusy(false);
    }
  }

  function price(option) {
    return (
      <div className="price-breakdown">
        <div className="price-row">
          <span>Whole stay · {option.nights} nights</span>
          <strong>
            <Money value={option.totalCost} />
          </strong>
        </div>
        <div className="price-row highlight">
          <span>Per traveller · {option.memberCount} people</span>
          <strong>
            <Money value={option.perPersonCost} />
          </strong>
        </div>
      </div>
    );
  }

  return (
    <section>
      <div className="section-heading">
        <div>
          <span className="eyebrow">FIND YOUR SHARED HOME BASE</span>
          <h2>A stay everyone can agree on.</h2>
          <p className="muted">
            {group.destinationName} · {dates(group.checkIn, group.checkOut)} ·{" "}
            {group.memberCount} travellers
          </p>
        </div>
        <button className="secondary" disabled={busy} onClick={resource.reload}>
          Search / refresh stays
        </button>
      </div>
      <Notice error>{error}</Notice>
      {!booking && (
        <div className="hotel-filters">
          <Field label="Sort stays">
            <select
              value={filters.sort}
              onChange={(event) => {
                setFilters({ ...filters, sort: event.target.value, page: 1 });
                setCompare([]);
              }}
            >
              <option value="price">Lowest total price</option>
              <option value="rating">Highest guest rating</option>
              <option value="stars">Hotel stars</option>
            </select>
          </Field>
          <Field label="Minimum hotel stars">
            <select
              value={filters.minStars}
              onChange={(event) => {
                setFilters({
                  ...filters,
                  minStars: event.target.value,
                  page: 1,
                });
                setCompare([]);
              }}
            >
              <option value="">All hotel classes</option>
              {[1, 2, 3, 4, 5].map((stars) => (
                <option key={stars} value={stars}>
                  {stars}+ stars
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}
      <RemoteState resource={resource} />
      {booking && (
        <div className="booking-success">
          <span className="eyebrow">✓ GROUP STAY CONFIRMED</span>
          <h2>{booking.hotelName}</h2>
          <p>
            Reference: <strong>{booking.reference}</strong> · Demo booking, no
            payment
          </p>
          <p>
            {dates(booking.checkIn, booking.checkOut)} · {booking.memberCount}{" "}
            travellers
          </p>
          <div className="price-row">
            <span>Total accommodation cost</span>
            <strong>
              <Money value={booking.totalCost} />
            </strong>
          </div>
          <div className="price-row">
            <span>Accommodation per person</span>
            <strong>
              <Money value={booking.perPersonCost} />
            </strong>
          </div>
          {typeof booking.tripTotalCost === "number" && (
            <div className="price-row">
              <span>Final group trip total</span>
              <strong>
                <Money value={booking.tripTotalCost} />
              </strong>
            </div>
          )}
          {typeof booking.tripPerPersonCost === "number" && (
            <div className="price-row">
              <span>Final trip cost per person</span>
              <strong>
                <Money value={booking.tripPerPersonCost} />
              </strong>
            </div>
          )}
          <p className="caption">
            This booking is locked. Your group’s confirmed travel dates are
            shown above.
          </p>
        </div>
      )}
      {data && !booking && (
        <>
          <div className="bottom-callout">
            <div>
              <strong>Shortlist. Compare. Decide together.</strong>
              <p>
                Mark your preferred stay, discuss offline, then confirm one
                option for the group.
              </p>
            </div>
            <span className="badge">
              {data.savedCount ??
                data.options.filter((option) => option.shortlisted).length}{" "}
              shortlisted
            </span>
          </div>
          {data.options.length ? (
            <>
              <div className="hotel-list">
                {data.options.map((option) => (
                  <article key={option.id} className="hotel-card">
                    <div
                      className="hotel-image"
                      style={
                        option.imageUrl
                          ? { backgroundImage: `url("${option.imageUrl}")` }
                          : undefined
                      }
                    >
                      {!option.imageUrl && <span aria-hidden="true">⌂</span>}
                    </div>
                    <div className="hotel-content">
                      <div className="section-heading">
                        <div>
                          <h3>{option.hotelName}</h3>
                          <p className="muted">{option.location}</p>
                        </div>
                        {typeof option.rating === "number" && (
                          <span className="rating">{option.rating}</span>
                        )}
                      </div>
                      <p>{option.roomDescription}</p>
                      {option.available === false && (
                        <Notice>
                          This saved option is no longer available for the full
                          group. Choose another stay.
                        </Notice>
                      )}
                      <div className="chips">
                        {option.amenities?.map((amenity) => (
                          <span className="chip" key={amenity}>
                            {amenity}
                          </span>
                        ))}
                      </div>
                      {price(option)}
                      <p className="caption">
                        {option.preferredBy?.length || 0} members prefer this
                        {option.preferredBy?.length
                          ? ` · ${option.preferredBy.map((member) => member.name).join(", ")}`
                          : ""}
                      </p>
                      <div className="actions">
                        <button
                          className="secondary"
                          disabled={busy}
                          aria-label={
                            option.shortlisted
                              ? "Remove from shortlist"
                              : "Add to shortlist"
                          }
                          onClick={() =>
                            action(() =>
                              option.shortlisted
                                ? api.removeShortlist(group.id, option.id)
                                : api.shortlist(group.id, option.id),
                            )
                          }
                        >
                          {option.shortlisted ? "♥ Saved" : "♡ Shortlist"}
                        </button>
                        <button
                          className="secondary"
                          disabled={
                            busy ||
                            option.isPreferred ||
                            option.available === false
                          }
                          onClick={() =>
                            action(() => api.prefer(group.id, option.id))
                          }
                        >
                          {option.isPreferred
                            ? "✓ Your preference"
                            : "Prefer this stay"}
                        </button>
                        <button
                          disabled={busy || option.available === false}
                          onClick={() => setSelected(option)}
                        >
                          Review & book
                        </button>
                      </div>
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={compare.includes(option.id)}
                          onChange={(e) =>
                            setCompare(
                              e.target.checked
                                ? [...compare, option.id]
                                : compare.filter((id) => id !== option.id),
                            )
                          }
                        />{" "}
                        Compare this option
                      </label>
                    </div>
                  </article>
                ))}
              </div>
              {compare.length > 0 && (
                <div className="panel compare-panel">
                  <div className="section-heading">
                    <h2>Compare selected stays</h2>
                    <button
                      className="text-button"
                      onClick={() => setCompare([])}
                    >
                      Clear comparison
                    </button>
                  </div>
                  <div className="compare-grid">
                    {data.options
                      .filter((option) => compare.includes(option.id))
                      .map((option) => (
                        <article key={option.id}>
                          <h3>{option.hotelName}</h3>
                          <p>{option.roomDescription}</p>
                          {price(option)}
                          <p className="muted">
                            {option.amenities?.join(" · ")}
                          </p>
                          <button
                            disabled={busy || option.available === false}
                            onClick={() => setSelected(option)}
                          >
                            Review stay
                          </button>
                        </article>
                      ))}
                  </div>
                </div>
              )}
              {data.total > data.limit && (
                <div className="actions pagination">
                  <button
                    className="secondary"
                    disabled={busy || filters.page === 1}
                    onClick={() => {
                      setFilters({ ...filters, page: filters.page - 1 });
                      setCompare([]);
                    }}
                  >
                    Previous page
                  </button>
                  <span>
                    Page {data.page} of {Math.ceil(data.total / data.limit)}
                  </span>
                  <button
                    className="secondary"
                    disabled={busy || data.page * data.limit >= data.total}
                    onClick={() => {
                      setFilters({ ...filters, page: filters.page + 1 });
                      setCompare([]);
                    }}
                  >
                    Next page
                  </button>
                </div>
              )}
            </>
          ) : (
            <Empty title="No stays available for this group">
              No options fit the group’s dates and size. Refresh to check
              availability again.
            </Empty>
          )}
        </>
      )}
      {selected && (
        <Modal
          title="Confirm your group’s stay"
          onClose={() => {
            if (!busy) setSelected(null);
          }}
        >
          <h3>{selected.hotelName}</h3>
          <p>{dates(group.checkIn, group.checkOut)}</p>
          <p>{selected.roomDescription}</p>
          {price(selected)}
          <Notice>
            Confirm only after your group agrees. This creates one locked demo
            booking for all members. No payment is taken.
          </Notice>
          <Notice error>{error}</Notice>
          <div className="actions">
            <button disabled={busy} onClick={finalize}>
              {busy ? "Confirming…" : "Confirm group booking"}
            </button>
            <button
              className="secondary"
              disabled={busy}
              onClick={() => setSelected(null)}
            >
              Keep comparing
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
