import { ROUTES } from "../config/routes";

export const STORAGE_KEYS = {
  SESSION: "travel-matcher-session",
};

export const REQUEST_TIMEOUT_MS = 30000;
export const CHAT_POLL_MS = 4000;
export const TOAST_MS = 3500;

export const HOTEL_PAGE_SIZE = 10;
export const HOTEL_STAR_OPTIONS = [1, 2, 3, 4, 5];

export const LOCALE = "en-IN";
export const CURRENCY = "INR";

export const PHOTO_CREDITS_PATH = "images/ATTRIBUTIONS.md";

export const LIMITS = {
  NAME: 100,
  HOME_CITY: 100,
  ITINERARY: 2000,
  MESSAGE: 1000,
  MIN_AGE: 18,
  MAX_AGE: 100,
};

export const NAV_ITEMS = [
  { to: ROUTES.DISCOVER, label: "◎ Discover groups" },
  { to: ROUTES.TRIPS, label: "▧ My trips" },
  { to: ROUTES.NEW_GROUP, label: "＋ Create a group" },
];

export const GROUP_TABS = [
  { path: "", label: "overview" },
  { path: "stays", label: "stays", membersOnly: true },
  { path: "chat", label: "chat", membersOnly: true },
  { path: "members", label: "members" },
  { path: "requests", label: "requests", ownerOnly: true },
];
