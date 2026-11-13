import { useRef, useState } from "react";
import { Empty } from "./ui";

export function SwipeDeck({ matches, renderCard, onRequest, busy }) {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const start = useRef(null);
  const match = matches[index];
  const canRequest = match && !match.myRequestStatus && match.seatsLeft > 0;

  function release(event) {
    if (start.current) {
      const dx = event.clientX - start.current.x;
      const dy = event.clientY - start.current.y;
      if (!busy && Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) setIndex((value) => value + 1);
        else if (canRequest) onRequest(match);
      }
    }
    start.current = null;
    setDrag(0);
  }

  if (!match)
    return (
      <Empty title="You’re all caught up">
        <p>Switch to List or revisit the cards.</p>
        <button className="secondary" onClick={() => setIndex(0)}>
          Revisit cards
        </button>
      </Empty>
    );
  return (
    <div
      className="swipe-area"
      aria-label="Swipe group discovery"
      onPointerDown={(event) => {
        if (
          busy ||
          event.target.closest("button,a,input,select") ||
          event.button !== 0
        )
          return;
        start.current = { x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!start.current) return;
        const dx = event.clientX - start.current.x;
        const dy = event.clientY - start.current.y;
        if (Math.abs(dx) > Math.abs(dy))
          setDrag(Math.max(-150, Math.min(150, dx)));
      }}
      onPointerUp={release}
      onPointerCancel={() => {
        start.current = null;
        setDrag(0);
      }}
    >
      <div
        className="swipe-card"
        style={{ transform: `translateX(${drag}px) rotate(${drag / 25}deg)` }}
      >
        {Math.abs(drag) > 25 && (
          <span className={`swipe-stamp ${drag > 0 ? "yes" : "no"}`}>
            {drag > 0 ? (canRequest ? "LET’S GO" : "REQUEST EXISTS") : "PASS"}
          </span>
        )}
        {renderCard(match)}
      </div>
      <div className="swipe-actions">
        <button
          className="secondary"
          disabled={busy}
          onClick={() => setIndex((value) => value + 1)}
        >
          × Skip
        </button>
        <button disabled={busy || !canRequest} onClick={() => onRequest(match)}>
          {busy
            ? "Sending…"
            : match.myRequestStatus
              ? `${match.myRequestStatus.toLowerCase()} request`
              : "♡ Express interest"}
        </button>
      </div>
      <p className="caption">
        {index + 1} of {matches.length} · Swipe left to skip, right to request.
        Buttons work too.
      </p>
    </div>
  );
}
