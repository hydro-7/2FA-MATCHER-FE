import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "../constants/app";

export const useSession = create(
  persist(
    (set) => ({
      userId: "",
      profile: null,
      ready: false,
      signIn: (profile) => set({ userId: profile.id, profile, ready: true }),
      switchTo: (userId) => set({ userId, profile: null, ready: !userId }),
      setProfile: (profile) => set({ profile, ready: true }),
      signOut: () => set({ userId: "", profile: null, ready: true }),
    }),
    { name: STORAGE_KEYS.SESSION, partialize: (state) => ({ userId: state.userId }) },
  ),
);
