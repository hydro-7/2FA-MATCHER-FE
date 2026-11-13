// Live backend contract adapter. Screens use the small, consistent UI shapes below.
export const backendOrigin =
  import.meta.env.VITE_BACKEND_ORIGIN ||
  "https://paperbacks-nuts-automation-provincial.trycloudflare.com";
const baseUrl = import.meta.env.VITE_API_URL || "/api";
export const isPreview =
  new URLSearchParams(location.search).get("preview") === "1";
const identityKey = "travel-matcher-user-id";
const searchKey = (userId = getUserId()) => `travel-searches:${userId}`;
let people = new Map();
let metaCache;
const matchedGroups = new Map();

export function getUserId() {
  return localStorage.getItem(identityKey) || "";
}
export function setUserId(id) {
  if (id) localStorage.setItem(identityKey, id);
  else localStorage.removeItem(identityKey);
  matchedGroups.clear();
}

async function preview(path, method = "GET", body) {
  const { previewRequest } = await import("./preview");
  return previewRequest(path, method, body);
}

async function request(path, method = "GET", body) {
  const identity = getUserId();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const headers = {};
    if (body) headers["Content-Type"] = "application/json";
    if (getUserId()) headers["X-User-Id"] = getUserId();
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      credentials: "omit",
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const json = await response.json().catch(() => null);
    if (identity !== getUserId())
      throw new Error(
        "The selected traveller changed. Please retry with the current profile.",
      );
    if (!response.ok || json?.success === false) {
      const error = new Error(
        json?.message ||
          (response.status >= 500
            ? "The backend connection is temporarily unavailable. Please retry when the server is online."
            : `Server request failed (${response.status}). Please retry.`),
      );
      error.status = response.status;
      error.code = json?.error?.code;
      error.details = json?.error?.details;
      throw error;
    }
    if (json?.success && method === "DELETE") return json.data || null;
    if (!json || !Object.hasOwn(json, "data"))
      throw new Error("The API returned an unexpected response.");
    return json.data;
  } catch (error) {
    if (error.name === "AbortError")
      throw new Error("The server took too long to respond. Please retry.");
    if (error instanceof TypeError)
      throw new Error(
        "Cannot reach the backend. Check the tunnel connection and retry.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function person(id) {
  if (!people.has(id))
    people.set(id, await request(`/travellers/${encodeURIComponent(id)}`));
  return people.get(id);
}

function reasons(raw) {
  if (raw.rules?.length)
    return raw.rules.filter((rule) => rule.pass).map((rule) => rule.detail);
  return [];
}

async function groupShape(raw, userId = getUserId()) {
  const id = raw.id || raw.groupId;
  const ownerId = raw.ownerId || raw.owner?.id;
  const owner = ownerId ? await person(ownerId) : raw.owner;
  const members = raw.members || [];
  const isOwner = ownerId === userId;
  const isMember =
    isOwner ||
    Boolean(raw.role) ||
    members.some((member) => member.id === userId);
  const requestStatus = raw.myRequestStatus?.toLowerCase() || null;
  const cached = matchedGroups.get(id);
  const savedSearches = JSON.parse(
    sessionStorage.getItem(searchKey(userId)) || "{}",
  );
  const searchId = cached?.searchId || savedSearches[id];
  const full = raw.seatsLeft === 0 || raw.memberCount >= raw.maxSize;
  const booked = raw.status === "BOOKED" || Boolean(raw.booking);
  let pendingRequestCount = raw.pendingRequestCount || 0;
  if (isOwner && raw.pendingRequestCount === undefined) {
    pendingRequestCount = (
      await request(`/groups/${encodeURIComponent(id)}/requests?status=PENDING`)
    ).length;
  }
  return {
    ...raw,
    id,
    owner,
    members,
    capacity: raw.maxSize,
    budget: raw.budgetInr,
    destinationName: raw.city,
    genderPreferenceLabel:
      owner?.genderPreference === "SAME_GENDER"
        ? `${owner.gender === "FEMALE" ? "Female" : "Male"} only`
        : "Any gender",
    isOwner,
    isMember,
    requestStatus,
    searchId,
    pendingRequestCount,
    canRequest:
      !isMember && !full && !booked && !requestStatus && Boolean(searchId),
    unavailableReason: booked
      ? "Group stay confirmed"
      : full
        ? "Group full"
        : requestStatus === "rejected"
          ? "Request declined"
          : !searchId
            ? "Search to check compatibility"
            : undefined,
    matchReasons: raw.rules ? reasons(raw) : cached?.matchReasons || [],
  };
}

function bookingShape(raw, group) {
  if (!raw) return null;
  return {
    ...raw,
    reference: raw.id || raw.bookingId,
    hotelName: raw.hotel?.name || raw.hotelName,
    checkIn: raw.checkIn || group.checkIn,
    checkOut: raw.checkOut || group.checkOut,
    memberCount:
      raw.membersUsed || raw.memberCount || raw.members || group.memberCount,
    totalCost: raw.totalInr,
    perPersonCost: raw.perMemberInr,
  };
}

export const api = {
  async catalog() {
    if (isPreview) return preview("/catalog");
    const raw = await request("/meta");
    metaCache = raw;
    return {
      destinations: raw.cities.map((city) => ({ id: city.name, ...city })),
      interests: raw.interests,
      homeCities: raw.homeCities.map((city) => ({
        id: city.city,
        label: `${city.city} (${city.airport})`,
      })),
      genders: raw.genders.map((id) => ({
        id,
        label: id === "MALE" ? "Male" : "Female",
      })),
      genderPreferences: raw.genderPreferences.map((id) => ({
        id,
        label: id === "ANY" ? "Any gender" : "Same gender only",
      })),
      genderCompositions: [],
      constraints: {
        minDate: raw.dateWindow.FIRST_CHECK_IN,
        maxDate: raw.dateWindow.LAST_CHECK_OUT,
        minCapacity: raw.groupSize.MIN,
        maxCapacity: raw.groupSize.MAX,
      },
    };
  },
  async session() {
    if (isPreview) return preview("/session");
    if (!getUserId()) return { profile: null };
    try {
      const profile = await request("/me");
      people.set(profile.id, profile);
      return { profile };
    } catch (error) {
      if (error.status === 401) {
        setUserId("");
        return { profile: null };
      }
      throw error;
    }
  },
  async travellers() {
    const profiles = await request("/travellers");
    profiles.forEach((profile) => people.set(profile.id, profile));
    return profiles;
  },
  async saveProfile(form) {
    if (isPreview) return preview("/profile", "PUT", form);
    const body = {
      name: form.name.trim(),
      homeCity: form.homeCity.trim(),
      gender: form.gender,
      genderPreference: form.genderPreference,
      interests: form.interests,
    };
    if (form.age) body.age = Number(form.age);
    const home = metaCache?.homeCities.find(
      (city) => city.city === body.homeCity,
    );
    if (home) body.homeAirport = home.airport;
    const profile = await request("/travellers", "POST", body);
    setUserId(profile.id);
    people.set(profile.id, profile);
    return { profile };
  },
  async member(id) {
    if (isPreview) return preview(`/travellers/${id}`);
    const traveller = await person(id);
    const meta = metaCache || (await request("/meta"));
    // /groups/mine is tied to the selected identity; it cannot list someone else's groups.
    const groups = id === getUserId() ? (await api.myGroups()).groups : null;
    return {
      traveller: {
        ...traveller,
        interestLabels: traveller.interests.map(
          (id) => meta.interests.find((item) => item.id === id)?.label || id,
        ),
        groups,
      },
    };
  },
  async myGroups() {
    if (isPreview) return preview("/me/groups");
    return {
      groups: await Promise.all(
        (await request("/groups/mine")).map((group) => groupShape(group)),
      ),
    };
  },
  async myRequests() {
    if (isPreview) return preview("/me/requests");
    const requests = await request("/requests/mine");
    return {
      requests: requests.map((item) => ({
        ...item,
        groupId: item.groupId || item.group?.id,
        groupName: item.groupName || item.group?.name,
        status: item.status.toLowerCase(),
      })),
    };
  },
  async createGroup(form) {
    if (isPreview) return preview("/groups", "POST", form);
    const raw = await request("/groups", "POST", {
      name: form.name.trim(),
      city: form.destinationId,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      maxSize: Number(form.capacity),
      budgetInr: Number(form.budget),
      itinerary: form.itinerary.trim(),
    });
    return { group: await groupShape({ ...raw, pendingRequestCount: 0 }) };
  },
  async searchGroups(form) {
    if (isPreview) return preview("/groups/search", "POST", form);
    const identity = getUserId();
    const raw = await request("/matches/search", "POST", {
      city: form.destinationId,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      budgetInr: Number(form.budget),
      interests: form.interests,
      genderPreference: form.genderPreference,
    });
    const searches = JSON.parse(
      sessionStorage.getItem(searchKey(identity)) || "{}",
    );
    const groups = await Promise.all(
      raw.matches.map(async (match) => {
        const cached = { searchId: raw.searchId, matchReasons: reasons(match) };
        matchedGroups.set(match.groupId, cached);
        searches[match.groupId] = raw.searchId;
        return groupShape(match, identity);
      }),
    );
    if (identity !== getUserId())
      throw new Error(
        "The selected traveller changed. Search again with the current profile.",
      );
    sessionStorage.setItem(searchKey(identity), JSON.stringify(searches));
    const interestIds = form.sharedInterestIds || [];
    return {
      groups: groups.filter((group) =>
        interestIds.every((id) => group.sharedInterests?.includes(id)),
      ),
      nearMisses: raw.nearMisses || [],
      searchId: raw.searchId,
    };
  },
  async group(id) {
    if (isPreview) return preview(`/groups/${id}`);
    return {
      group: await groupShape(
        await request(`/groups/${encodeURIComponent(id)}`),
      ),
    };
  },
  async join(id) {
    if (isPreview) return preview(`/groups/${id}/requests`, "POST", {});
    const searches = JSON.parse(sessionStorage.getItem(searchKey()) || "{}");
    const searchId = matchedGroups.get(id)?.searchId || searches[id];
    if (!searchId)
      throw new Error(
        "Search for compatible groups before sending a join request.",
      );
    return {
      request: await request(
        `/groups/${encodeURIComponent(id)}/requests`,
        "POST",
        { searchId },
      ),
    };
  },
  async requests(id) {
    if (isPreview) return preview(`/groups/${id}/requests`);
    const requests = await request(
      `/groups/${encodeURIComponent(id)}/requests?status=ALL`,
    );
    return {
      requests: requests.map((item) => ({
        ...item,
        status: item.status.toLowerCase(),
        traveller: item.seeker || item.traveller,
        matchReasons: reasons(item),
      })),
    };
  },
  async decide(id, requestId, status) {
    if (isPreview)
      return preview(`/groups/${id}/requests/${requestId}`, "PATCH", {
        status,
      });
    return {
      request: await request(
        `/requests/${encodeURIComponent(requestId)}`,
        "PATCH",
        { action: status === "approved" ? "APPROVE" : "REJECT" },
      ),
    };
  },
  async hotels(id, filters = {}) {
    if (isPreview) return preview(`/groups/${id}/hotels`);
    const query = new URLSearchParams({
      limit: "50",
      page: String(filters.page || 1),
      sort: filters.sort || "price",
    });
    if (filters.minStars) query.set("minStars", filters.minStars);
    const [raw, saved, group] = await Promise.all([
      request(`/groups/${id}/hotels?${query}`),
      request(`/groups/${id}/saved`),
      request(`/groups/${id}`),
    ]);
    let booking = group.booking;
    if (group.status === "BOOKED")
      booking = await request(`/groups/${id}/booking`);
    const missingSaved = saved.filter(
      (item) => !raw.options.some((option) => option.roomId === item.roomId),
    );
    const options = [...raw.options, ...missingSaved].map((option) => {
      const savedOption = saved.find((item) => item.roomId === option.roomId);
      const savedBy = savedOption?.savedBy || [];
      const mine = savedBy.some(
        (member) =>
          (typeof member === "string"
            ? member
            : member.id || member.travellerId) === getUserId(),
      );
      return {
        ...option,
        id: option.roomId,
        location: [raw.city, option.area].filter(Boolean).join(" · "),
        imageUrl: option.image
          ? new URL(option.image, `${backendOrigin}/`).href
          : undefined,
        roomDescription: `${option.rooms} × ${option.roomName} · ${raw.membersUsed} travellers`,
        amenities: [
          option.stars ? `${option.stars} stars` : null,
          typeof option.refundable === "boolean"
            ? option.refundable
              ? "Free cancellation"
              : "Non-refundable"
            : null,
        ].filter(Boolean),
        memberCount: raw.membersUsed,
        totalCost: option.totalInr,
        perPersonCost: option.perMemberInr,
        shortlisted: mine,
        isPreferred: mine,
        preferredBy: savedBy.map((member) =>
          typeof member === "string"
            ? { id: member, name: people.get(member)?.name || member }
            : { id: member.id || member.travellerId, name: member.name },
        ),
      };
    });
    return {
      options,
      savedCount: saved.length,
      booking: bookingShape(booking, group),
      total: raw.total,
      page: raw.page,
      limit: raw.limit,
    };
  },
  shortlist: (id, optionId) =>
    isPreview
      ? preview(`/groups/${id}/shortlist`, "POST", { optionId })
      : request(`/groups/${id}/saved`, "POST", { roomId: optionId }),
  removeShortlist: (id, optionId) =>
    isPreview
      ? preview(`/groups/${id}/shortlist/${optionId}`, "DELETE")
      : request(
          `/groups/${id}/saved/${encodeURIComponent(optionId)}`,
          "DELETE",
        ),
  prefer: (id, optionId) =>
    isPreview
      ? preview(`/groups/${id}/preference`, "PUT", { optionId })
      : request(`/groups/${id}/saved`, "POST", { roomId: optionId }),
  async finalize(id, optionId, context) {
    if (isPreview)
      return preview(`/groups/${id}/booking`, "POST", { optionId });
    let raw;
    try {
      raw = await request(`/groups/${id}/booking`, "POST", {
        roomId: optionId,
      });
    } catch (error) {
      // A tunnel timeout may arrive after the server commits. Read before retrying.
      let existing;
      try {
        existing = await request(`/groups/${id}/booking`);
      } catch {
        throw error;
      }
      if (existing.roomId !== optionId) throw error;
      raw = existing;
    }
    const group = context || (await request(`/groups/${id}`));
    return { booking: bookingShape(raw, group) };
  },
};
