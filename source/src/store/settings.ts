"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ALL_WEEKDAYS } from "@/lib/schedule";
import type { Theme, Unit } from "@/lib/types";

interface SettingsState {
  unit: Unit;
  theme: Theme;
  trainingWeekdays: number[];
  setUnit: (unit: Unit) => void;
  setTheme: (theme: Theme) => void;
  toggleTrainingWeekday: (day: number) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      unit: "kg",
      theme: "dark",
      trainingWeekdays: ALL_WEEKDAYS,
      setUnit: (unit) => set({ unit }),
      setTheme: (theme) => {
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", theme === "dark");
          document.documentElement.classList.toggle("light", theme === "light");
        }
        set({ theme });
      },
      toggleTrainingWeekday: (day) => {
        const current = get().trainingWeekdays;
        const next = current.includes(day)
          ? current.filter((item) => item !== day)
          : [...current, day];
        if (next.length === 0) return;
        set({ trainingWeekdays: next });
      },
    }),
    {
      name: "workout-settings",
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<SettingsState>;
        return {
          ...current,
          ...saved,
          trainingWeekdays: saved.trainingWeekdays?.length ? saved.trainingWeekdays : current.trainingWeekdays,
        };
      },
    },
  ),
);
