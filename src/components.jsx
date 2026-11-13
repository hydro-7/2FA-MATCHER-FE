import { useEffect, useState } from "react";

// Every remote screen handles loading, failure and retry in the same small hook.
export function useResource(load, key) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setData(null);
    load()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // The explicit key identifies the resource; reload also changes version.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);
  return {
    data,
    loading,
    error,
    reload: () => setVersion((value) => value + 1),
  };
}

export function Notice({ children, error = false }) {
  if (!children) return null;
  const awaitingApi =
    typeof children === "string" && children.includes("API connection");
  return (
    <div
      className={`notice ${error && !awaitingApi ? "error" : ""}`}
      role={error && !awaitingApi ? "alert" : "status"}
    >
      {children}
      {awaitingApi && (
        <a className="inline-link" href="?preview=1">
          Explore design preview →
        </a>
      )}
    </div>
  );
}

export function RemoteState({ resource }) {
  if (resource.loading)
    return (
      <div className="empty" role="status">
        <span className="status-dot" /> Loading your travel plans…
      </div>
    );
  if (resource.error)
    return (
      <div className="empty">
        <div className="empty-icon" aria-hidden="true">
          ◎
        </div>
        <h3>
          {resource.error.includes("API connection")
            ? "Your next adventure is taking shape"
            : "We couldn’t load this yet"}
        </h3>
        <Notice error>{resource.error}</Notice>
        <button className="secondary" onClick={resource.reload}>
          Try again
        </button>
      </div>
    );
  return null;
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden="true">
        ↗
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Chips({ options = [], selected = [], onChange }) {
  return (
    <div className="chips">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`chip ${selected.includes(option.id) ? "selected" : ""}`}
          aria-pressed={selected.includes(option.id)}
          onClick={() =>
            onChange(
              selected.includes(option.id)
                ? selected.filter((id) => id !== option.id)
                : [...selected, option.id],
            )
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Avatar({ person, large = false }) {
  return (
    <span className={`avatar ${large ? "large" : ""}`}>
      {person?.name?.slice(0, 1).toUpperCase() || "?"}
    </span>
  );
}

export function Money({ value }) {
  return (
    <>
      {typeof value === "number"
        ? new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(value)
        : "Price unavailable"}
    </>
  );
}

export function dates(start, end) {
  function format(value) {
    if (!value) return "Date unavailable";
    return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  return `${format(start)} – ${format(end)}`;
}

export function GroupCard({ group, onOpen }) {
  return (
    <article className="group-card">
      <div
        className="group-cover"
        style={
          group.imageUrl
            ? {
                backgroundImage: `linear-gradient(0deg,rgba(0,27,69,.75),transparent), url("${group.imageUrl}")`,
              }
            : undefined
        }
      >
        <span className="cover-label">{group.destinationName}</span>
        <h2>{group.name}</h2>
      </div>
      <div className="card-body">
        <div className="person">
          <Avatar person={group.owner} />
          <span>
            <strong>{group.owner?.name}</strong>
            <small>Trip creator</small>
          </span>
          <span className="badge">
            {group.memberCount} / {group.capacity} travellers
          </span>
        </div>
        <p className="muted">{dates(group.checkIn, group.checkOut)}</p>
        <div className="chips">
          {group.matchReasons?.map((reason) => (
            <span key={reason} className="chip selected">
              ✓ {reason}
            </span>
          ))}
        </div>
        <div className="card-footer">
          <div>
            <strong>
              <Money value={group.budget} />
            </strong>
            <small>Approx. trip budget / person</small>
          </div>
          <button onClick={() => onOpen(group.id)}>View group ↗</button>
        </div>
      </div>
    </article>
  );
}

export function Modal({ title, children, onClose }) {
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = document.querySelector("dialog");
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="dialog-title"
    >
      <div className="dialog-header">
        <h2 id="dialog-title">{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
