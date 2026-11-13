import { create } from "zustand";

export const NO_FILTERS = { sharedInterests: [], genderMix: "" };

export const useSearch = create((set) => ({
  travellerId: "",
  criteria: null,
  filters: NO_FILTERS,
  result: null,
  setResult: (travellerId, criteria, filters, result) => set({ travellerId, criteria, filters, result }),
  markRequested: (groupId) =>
    set((state) => ({
      result: {
        ...state.result,
        matches: state.result.matches.map((match) => (match.groupId === groupId ? { ...match, myRequestStatus: "PENDING" } : match)),
      },
    })),
}));
