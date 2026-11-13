import { ASSET_ORIGIN } from "../config/env";
import { CURRENCY, LOCALE } from "../constants/app";
import { LABELS } from "../constants/labels";

const money = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  maximumFractionDigits: 2,
});

export const formatMoney = (value) => (typeof value === "number" ? money.format(value) : "—");

// Trip dates are plain YYYY-MM-DD in the city's local time, so format them in UTC to avoid shifting a day.
function formatDate(value) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const formatDates = (start, end) => `${formatDate(start)} – ${formatDate(end)}`;

export const formatTime = (iso) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const labelOf = (group, code) => LABELS[group][code] ?? code;

export const toOptions = (codes, group) => codes.map((code) => ({ id: code, label: labelOf(group, code) }));

export const assetUrl = (path) => (path ? new URL(path, `${ASSET_ORIGIN}/`).href : undefined);
