// Isolated, explicitly labelled visual examples. Never used by live API mode.
// State lasts only for this page load; this is not a backend or matching engine.
import interests from "../../data-pack/hackathon-problem-3-group-travel-matcher/data/problem-3/interests.json";
import destinations from "../../data-pack/hackathon-problem-3-group-travel-matcher/data/catalog/destinations.json";

const sarah = {
  id: "preview-sarah",
  name: "Sarah Thomas",
  homeCity: "Bengaluru",
  age: 27,
  gender: "FEMALE",
  genderPreference: "SAME_GENDER",
  interests: ["TEMPLES", "STREET_FOOD", "PHOTOGRAPHY"],
};
const priya = {
  id: "preview-priya",
  name: "Priya Shah",
  homeCity: "Mumbai",
  age: 26,
  gender: "FEMALE",
  genderPreference: "SAME_GENDER",
  interests: ["TEMPLES", "STREET_FOOD", "ADVENTURE"],
};
const creator = sessionStorage.getItem("preview-role") === "creator";
let profile = creator ? { ...sarah } : { ...priya };
const groups = [
  {
    id: "preview-kyoto",
    name: "Kyoto, slowly & together",
    destinationName: "Kyoto",
    destinationId: "Kyoto",
    checkIn: "2027-04-10",
    checkOut: "2027-04-15",
    budget: 60000,
    capacity: 3,
    memberCount: 1,
    owner: sarah,
    itinerary:
      "A few unhurried days in Kyoto.\n\nDay 1 · Arrive, settle in, and explore Gion.\nDay 2 · Temples at sunrise, street food at Nishiki Market.\nDay 3 · A photo walk through Arashiyama.\nDay 4 · Gardens, little cafés, and room to wander.\nDay 5 · One last breakfast before heading home.",
    matchReasons: ["5 shared nights", "2 shared interests", "Budget fits"],
    members: [sarah],
    genderPreferenceLabel: "Same gender only",
    pendingRequestCount: 1,
  },
  {
    id: "preview-tokyo",
    name: "Tokyo after the postcards",
    destinationName: "Tokyo",
    destinationId: "Tokyo",
    checkIn: "2027-04-12",
    checkOut: "2027-04-17",
    budget: 65000,
    capacity: 4,
    memberCount: 2,
    owner: sarah,
    itinerary:
      "Neighbourhood walks, small museums, and a good meal at the end of every day.",
    matchReasons: ["Photography", "Street food"],
    members: [sarah, priya],
    genderPreferenceLabel: "Any gender",
    pendingRequestCount: 0,
  },
  {
    id: "preview-osaka",
    name: "Good food. Better company.",
    destinationName: "Osaka",
    destinationId: "Osaka",
    checkIn: "2027-04-15",
    checkOut: "2027-04-19",
    budget: 55000,
    capacity: 3,
    memberCount: 2,
    owner: priya,
    itinerary:
      "Discover the city one neighbourhood and one street-food stop at a time.",
    matchReasons: ["Street food", "Room for you"],
    members: [sarah, priya],
    genderPreferenceLabel: "Any gender",
    pendingRequestCount: 0,
  },
];
let requests = creator
  ? [
      {
        id: "preview-request",
        groupId: groups[0].id,
        groupName: groups[0].name,
        status: "pending",
        traveller: priya,
        matchReasons: ["5 shared nights", "2 shared interests", "Budget fits"],
      },
    ]
  : [];
const options = [
  {
    id: "preview-stay-1",
    hotelName: "Arashiyama River Ryokan",
    location: "Kyoto · Arashiyama",
    imageUrl: "/visuals/ryokan.jpg",
    rating: 8.8,
    roomDescription: "1 twin room · 2 adults · 5 nights",
    amenities: ["Traditional stay", "Free cancellation"],
    nights: 5,
    memberCount: 2,
    totalCost: 30000,
    perPersonCost: 15000,
    shortlisted: true,
    preferredBy: [sarah],
  },
  {
    id: "preview-stay-2",
    hotelName: "Kyoto Hills Hotel",
    location: "Kyoto · Higashiyama",
    imageUrl: "/visuals/twin.jpg",
    rating: 8.4,
    roomDescription: "1 twin room · 2 adults · 5 nights",
    amenities: ["Wi-Fi", "Central location"],
    nights: 5,
    memberCount: 2,
    totalCost: 26000,
    perPersonCost: 13000,
    shortlisted: false,
    preferredBy: [],
  },
];
const bookings = {};
const groupOptions = {};
function exampleOptions(group) {
  if (!groupOptions[group.id]) {
    // Only illustrative quotes. Live prices always come from the backend.
    groupOptions[group.id] = options.map((option, index) => ({
      ...option,
      preferredBy: [...option.preferredBy],
      memberCount: group.memberCount,
      perPersonCost: option.totalCost / group.memberCount,
      hotelName:
        group.destinationName === "Kyoto"
          ? option.hotelName
          : index === 0
            ? `${group.destinationName} Garden Stay`
            : `${group.destinationName} City Hotel`,
      location: group.destinationName,
    }));
  }
  return groupOptions[group.id];
}
function decorate(group) {
  const isOwner = group.owner.id === profile.id;
  // A sample joined group is available to inspect the entire shared workspace.
  const isMember =
    isOwner ||
    group.id === "preview-tokyo" ||
    group.members.some((member) => member.id === profile.id);
  return {
    ...group,
    isOwner,
    isMember,
    canRequest:
      !isMember &&
      !requests.some(
        (r) => r.groupId === group.id && r.traveller.id === profile.id,
      ),
    requestStatus:
      requests.find(
        (r) => r.groupId === group.id && r.traveller.id === profile.id,
      )?.status || null,
  };
}

export async function previewRequest(path, method, body) {
  if (path === "/catalog")
    return {
      interests: interests.map((item) => ({
        id: item.interest,
        label: item.label,
      })),
      destinations: destinations.countries.flatMap((country) =>
        country.cities.map((city) => ({ id: city.name, name: city.name })),
      ),
      homeCities: destinations.departure_cities.map((city) => ({
        id: city.city,
        label: city.city,
      })),
      genders: [
        { id: "MALE", label: "Male" },
        { id: "FEMALE", label: "Female" },
      ],
      genderPreferences: [
        { id: "ANY", label: "Any gender" },
        { id: "SAME_GENDER", label: "Same gender only" },
      ],
      genderCompositions: [
        { id: "FEMALE_ONLY", label: "Female only" },
        { id: "MALE_ONLY", label: "Male only" },
        { id: "MIXED", label: "Mixed" },
      ],
      constraints: {
        minDate: "2027-04-01",
        maxDate: "2027-04-20",
        minCapacity: 1,
        maxCapacity: 4,
      },
    };
  if (path === "/session") return { profile };
  if (path === "/profile") {
    profile = { ...profile, ...body };
    return { profile };
  }
  if (path === "/me/groups")
    return { groups: groups.map(decorate).filter((group) => group.isMember) };
  if (path === "/me/requests")
    return { requests: requests.filter((r) => r.traveller.id === profile.id) };
  if (path === "/groups/search") return { groups: groups.map(decorate) };
  if (path === "/groups" && method === "POST") {
    const group = {
      ...groups[0],
      ...body,
      id: `preview-new-${groups.length}`,
      destinationName: body.destinationId,
      owner: profile,
      members: [profile],
      memberCount: 1,
      pendingRequestCount: 0,
    };
    groups.push(group);
    return { group: decorate(group) };
  }
  if (path.startsWith("/travellers/")) {
    const member = path.endsWith(sarah.id) ? sarah : priya;
    return {
      traveller: {
        ...member,
        interestLabels: interests
          .filter((item) => member.interests.includes(item.interest))
          .map((item) => item.label),
        groups: groups
          .filter((group) =>
            group.members.some((person) => person.id === member.id),
          )
          .map(decorate),
      },
    };
  }
  const [, , groupId, section, optionId] = path.split("/");
  const group = groups.find((item) => item.id === groupId);
  if (!group)
    throw new Error("This example is not part of the design preview.");
  if (!section) return { group: decorate(group) };
  if (section === "requests") {
    if (method === "POST") {
      const request = {
        id: `preview-request-${requests.length}`,
        groupId,
        groupName: group.name,
        status: "pending",
        traveller: profile,
      };
      requests.push(request);
      return { request };
    }
    if (method === "PATCH") {
      const request = requests.find((item) => item.id === optionId);
      request.status = body.status;
      if (
        body.status === "approved" &&
        !group.members.some((person) => person.id === request.traveller.id)
      ) {
        group.members.push(request.traveller);
        group.memberCount = group.members.length;
        group.pendingRequestCount = 0;
      }
      return { request };
    }
    return { requests: requests.filter((item) => item.groupId === groupId) };
  }
  if (section === "hotels")
    return {
      options: exampleOptions(group),
      booking: bookings[group.id] || null,
    };
  if (section === "shortlist") {
    const option = exampleOptions(group).find(
      (item) => item.id === (body?.optionId || optionId),
    );
    option.shortlisted = method !== "DELETE";
    return {};
  }
  if (section === "preference") {
    exampleOptions(group).forEach((option) => {
      option.isPreferred = option.id === body.optionId;
      option.preferredBy = option.preferredBy.filter(
        (person) => person.id !== profile.id,
      );
      if (option.isPreferred) option.preferredBy.push(profile);
    });
    return {};
  }
  if (section === "booking") {
    const option = exampleOptions(group).find(
      (item) => item.id === body.optionId,
    );
    const booking = {
      ...option,
      reference: "DESIGN-PREVIEW",
      checkIn: group.checkIn,
      checkOut: group.checkOut,
    };
    bookings[group.id] = booking;
    return { booking };
  }
  throw new Error("This action is not included in the design preview.");
}
