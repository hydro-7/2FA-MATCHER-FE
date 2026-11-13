import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BedDouble, CalendarDays, Clock, LocateFixed, MapPin, Route } from "lucide-react";
import { MAP_CONFIG } from "../../config/map";
import { formatClock } from "../../lib/format";
import { distanceKm } from "../../lib/geo";
import { parseItinerary } from "../../lib/itinerary";
import { useResource } from "../../hooks/useResource";
import { geocodeCity, geocodePlace } from "../../services/geocodeService";
import { planningService } from "../../services/planningService";

const BED_SVG =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/></svg>';
const hotelIcon = L.divIcon({ className: "", html: `<span class="map-pin hotel">${BED_SVG}</span>`, iconSize: [40, 48], iconAnchor: [20, 46] });
const placeIcon = (number) => L.divIcon({ className: "", html: `<span class="map-pin place">${number}</span>`, iconSize: [32, 40], iconAnchor: [16, 38] });

function FitBounds({ points, fallback }) {
  const map = useMap();
  const key = points.map((point) => `${point.lat},${point.lng}`).join("|");
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points.map((point) => [point.lat, point.lng]), { padding: [60, 60], maxZoom: 15 });
    else if (points.length === 1) map.setView([points[0].lat, points[0].lng], 14);
    else if (fallback) map.setView([fallback.lat, fallback.lng], 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, fallback?.lat, fallback?.lng]);
  return null;
}

function LocateButton({ points, fallback }) {
  const map = useMap();
  return (
    <button
      type="button"
      className="map-locate"
      aria-label="Fit map to trip"
      onClick={() => (points.length ? map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [60, 60], maxZoom: 15 }) : fallback && map.setView([fallback.lat, fallback.lng], 12))}
    >
      <LocateFixed size={20} />
    </button>
  );
}

function useCoordinates(days, city, near) {
  const [coords, setCoords] = useState({});
  const [pending, setPending] = useState(0);
  useEffect(() => {
    let active = true;
    const texts = [...new Set(days.flatMap((day) => day.items.map((item) => item.text)))];
    setPending(texts.length);
    (async () => {
      for (const text of texts) {
        const found = await geocodePlace(text, city, near);
        if (!active) return;
        setCoords((current) => ({ ...current, [text]: found }));
        setPending((value) => value - 1);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.length, city, near?.lat]);
  return { coords, pending };
}

export function TripMap() {
  const { group } = useOutletContext();
  const plan = useMemo(() => parseItinerary(group.itinerary), [group.itinerary]);
  const saved = useResource(() => planningService.saved(group.id), `saved-${group.id}`);
  const [cityCenter, setCityCenter] = useState(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [layers, setLayers] = useState({ hotels: true, places: true, route: true });

  useEffect(() => {
    let active = true;
    geocodeCity(group.city).then((found) => active && setCityCenter(found));
    return () => {
      active = false;
    };
  }, [group.city]);

  const hotels = useMemo(() => {
    if (group.booking?.lat != null) return [{ id: "booked", name: group.booking.hotelName, area: group.booking.area, lat: group.booking.lat, lng: group.booking.lng, booked: true }];
    const unique = new Map();
    for (const option of saved.data ?? []) {
      if (option.lat != null && !unique.has(option.hotelId)) unique.set(option.hotelId, { id: option.hotelId, name: option.hotelName, area: option.area, lat: option.lat, lng: option.lng });
    }
    return [...unique.values()];
  }, [group.booking, saved.data]);

  const near = cityCenter ?? hotels[0] ?? null;
  const { coords, pending } = useCoordinates(plan.days, group.city, near);
  const day = plan.days[dayIndex];
  const base = hotels[0];

  const stops = (day?.items ?? []).map((item, index) => ({ ...item, number: index + 1, point: coords[item.text] }));
  const located = stops.filter((stop) => stop.point);
  const legs = located.map((stop, index) => {
    const from = index === 0 ? base : located[index - 1].point;
    return { ...stop, km: from ? distanceKm(from, stop.point) : null };
  });
  const route = [base, ...located.map((stop) => stop.point)].filter(Boolean);
  const visible = [...(layers.hotels ? hotels : []), ...(layers.places ? located.map((stop) => stop.point) : [])];
  const placeCount = plan.days.reduce((sum, item) => sum + item.items.length, 0);
  const toggle = (key) => setLayers({ ...layers, [key]: !layers[key] });

  return (
    <div className="trip-map">
      <aside className="ws-card map-panel">
        <div>
          <h3>Trip Map</h3>
          <p className="muted-line">Your stays and planned places in one view.</p>
        </div>
        <ul className="layer-list">
          <li>
            <span className="layer-icon hotel">
              <BedDouble size={18} />
            </span>
            {group.booking ? "Booked stay" : "Saved hotels"} ({hotels.length})
            <input type="checkbox" aria-label="Show hotels" checked={layers.hotels} onChange={() => toggle("hotels")} />
          </li>
          <li>
            <span className="layer-icon place">
              <MapPin size={18} />
            </span>
            Planned places ({placeCount})
            <input type="checkbox" aria-label="Show places" checked={layers.places} onChange={() => toggle("places")} />
          </li>
          <li>
            <span className="layer-icon route">
              <Route size={18} />
            </span>
            Route
            <input type="checkbox" aria-label="Show route" checked={layers.route} onChange={() => toggle("route")} />
          </li>
        </ul>
        {plan.days.length > 0 && (
          <>
            <h4>View by day</h4>
            <div className="day-select">
              {plan.days.map((item, index) => (
                <button key={item.number} type="button" className={index === dayIndex ? "active" : ""} onClick={() => setDayIndex(index)}>
                  <CalendarDays size={17} /> <strong>Day {item.number}</strong> <small>{item.date}</small>
                </button>
              ))}
            </div>
          </>
        )}
        {pending > 0 && <p className="muted-line">Finding {pending} place{pending === 1 ? "" : "s"} on the map…</p>}
      </aside>

      <section className="ws-card map-main">
        <div className="map-frame">
          <MapContainer center={near ? [near.lat, near.lng] : [0, 0]} zoom={near ? 12 : 2} scrollWheelZoom className="map-canvas">
            <TileLayer url={MAP_CONFIG.TILE_URL} attribution={MAP_CONFIG.TILE_ATTRIBUTION} />
            <FitBounds points={visible} fallback={near} />
            {layers.hotels &&
              hotels.map((hotel) => (
                <Marker key={hotel.id} position={[hotel.lat, hotel.lng]} icon={hotelIcon}>
                  <Tooltip direction="top" offset={[0, -44]} className="map-label">
                    {hotel.name}
                    {hotel.booked ? " · booked" : ""}
                  </Tooltip>
                </Marker>
              ))}
            {layers.places &&
              located.map((stop) => (
                <Marker key={stop.number} position={[stop.point.lat, stop.point.lng]} icon={placeIcon(stop.number)}>
                  <Tooltip direction="right" offset={[14, -22]} permanent className="map-label">
                    {stop.text}
                  </Tooltip>
                </Marker>
              ))}
            {layers.route && route.length > 1 && (
              <Polyline positions={route.map((point) => [point.lat, point.lng])} pathOptions={{ color: "#0057ff", weight: 3, dashArray: "6 8" }} />
            )}
            <LocateButton points={visible} fallback={near} />
          </MapContainer>
        </div>

        {day ? (
          <div className="stop-strip">
            {stops.length === 0 && <p className="muted-line">Nothing planned for Day {day.number} yet. Add activities when you create the trip.</p>}
            {stops.map((stop) => {
              const leg = legs.find((item) => item.number === stop.number);
              return (
                <article key={stop.number} className={`stop-card ${stop.point ? "" : "off-map"}`}>
                  <div>
                    <strong>
                      <span className="stop-num">{stop.number}</span> {stop.text}
                    </strong>
                    <small>
                      {stop.time && (
                        <>
                          <Clock size={14} /> {formatClock(stop.time)}
                        </>
                      )}
                      {leg?.km != null && <> · ≈ {leg.km.toFixed(1)} km</>}
                      {stop.point === null && " · not found on map"}
                    </small>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="muted-line">No day plan in this trip’s itinerary, so the map shows your stays.</p>
        )}
      </section>
    </div>
  );
}
