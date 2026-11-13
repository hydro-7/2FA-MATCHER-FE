// Proposed API contract: agree these routes with the backend developer.
// Keep integration changes here rather than spreading URLs throughout the UI.
const baseUrl = import.meta.env.VITE_API_URL || "/api";
export const isPreview =
  new URLSearchParams(window.location.search).get("preview") === "1";

async function request(path, method = "GET", body) {
  if (isPreview) {
    const { previewRequest } = await import("./preview");
    return previewRequest(path, method, body);
  }
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      "Cannot reach the server. Check your connection and try again.",
    );
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      data?.message ||
        (response.status === 404
          ? "This part of the experience is waiting for its API connection. Explore the design preview while integration is in progress."
          : [502, 503, 504].includes(response.status)
            ? "The backend is unavailable. Start the API server and retry."
            : `Request failed (${response.status}). Please try again.`),
    );
    error.status = response.status;
    throw error;
  }
  if (data === null)
    throw new Error("The server returned an unexpected response.");
  return data;
}

export const api = {
  catalog: () => request("/catalog"),
  session: () => request("/session"),
  saveProfile: (profile) => request("/profile", "PUT", profile),
  member: (id) => request(`/travellers/${encodeURIComponent(id)}`),
  myGroups: () => request("/me/groups"),
  myRequests: () => request("/me/requests"),
  createGroup: (group) => request("/groups", "POST", group),
  searchGroups: (criteria) => request("/groups/search", "POST", criteria),
  group: (id) => request(`/groups/${encodeURIComponent(id)}`),
  join: (id) =>
    request(`/groups/${encodeURIComponent(id)}/requests`, "POST", {}),
  requests: (id) => request(`/groups/${encodeURIComponent(id)}/requests`),
  decide: (id, requestId, status) =>
    request(
      `/groups/${encodeURIComponent(id)}/requests/${encodeURIComponent(requestId)}`,
      "PATCH",
      { status },
    ),
  hotels: (id) => request(`/groups/${encodeURIComponent(id)}/hotels`),
  shortlist: (id, optionId) =>
    request(`/groups/${encodeURIComponent(id)}/shortlist`, "POST", {
      optionId,
    }),
  removeShortlist: (id, optionId) =>
    request(
      `/groups/${encodeURIComponent(id)}/shortlist/${encodeURIComponent(optionId)}`,
      "DELETE",
    ),
  prefer: (id, optionId) =>
    request(`/groups/${encodeURIComponent(id)}/preference`, "PUT", {
      optionId,
    }),
  finalize: (id, optionId) =>
    request(`/groups/${encodeURIComponent(id)}/booking`, "POST", { optionId }),
};
