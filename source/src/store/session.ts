"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SessionState {
  activeLogId: string | null;
  setActiveLogId: (id: string | null) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      activeLogId: null,
      setActiveLogId: (id) => set({ activeLogId: id }),
    }),
    { name: "workout-session" },
  ),
);
