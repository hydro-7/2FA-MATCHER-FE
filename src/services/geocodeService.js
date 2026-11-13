import { MAP_CONFIG } from "../config/map";
import { GEOCODE, STORAGE_KEYS } from "../constants/app";

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.GEOCODE)) ?? {};
  } catch {
    return {};
  }
}

const cache = readCache();
let queue = Promise.resolve();

function remember(key, value) {
  cache[key] = value;
  try {
    localStorage.setItem(STORAGE_KEYS.GEOCODE, JSON.stringify(cache));
  } catch {
    // Storage full or blocked: the in-memory cache still works for this session.
  }
}

// Requests run one at a time, spaced to respect the public geocoder's rate limit.
function search(query, near) {
  const params = new URLSearchParams({ q: query, format: "jsonv2", limit: "1" });
  if (near) {
    const d = GEOCODE.VIEWBOX_DEG;
    params.set("viewbox", [near.lng - d, near.lat + d, near.lng + d, near.lat - d].join(","));
    params.set("bounded", "1");
  }
  const run = queue.then(async () => {
    const response = await fetch(`${MAP_CONFIG.GEOCODER_URL}?${params}`, { headers: { Accept: "application/json" } });
    const [hit] = response.ok ? await response.json() : [];
    return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
  });
  queue = run.catch(() => null).then(() => new Promise((resolve) => setTimeout(resolve, GEOCODE.SPACING_MS)));
  return run;
}

// Free-text activities ("Fushimi Inari Shrine visit") often only match once trailing words are dropped.
function candidates(text) {
  const words = text.replace(/[&,()]/g, " ").split(/\s+/).filter(Boolean);
  const lengths = [words.length, 4, 3, GEOCODE.MIN_WORDS].filter((n) => n <= words.length);
  return [...new Set(lengths.map((n) => words.slice(0, n).join(" ")))].filter(Boolean);
}

export async function geocodePlace(text, city, near) {
  const key = `${city}|${text}`.toLowerCase();
  if (key in cache) return cache[key];
  let found = null;
  for (const query of candidates(text)) {
    found = await search(`${query}, ${city}`, near).catch(() => null);
    if (found) break;
  }
  remember(key, found);
  return found;
}

export async function geocodeCity(city) {
  const key = `city|${city}`.toLowerCase();
  if (key in cache) return cache[key];
  const found = await search(city).catch(() => null);
  if (found) remember(key, found);
  return found;
}
