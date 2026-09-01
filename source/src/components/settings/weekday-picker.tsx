"use client";

import { WEEKDAY_OPTIONS } from "@/lib/schedule";

export function WeekdayPicker({
  value,
  onToggle,
}: {
  value: number[];
  onToggle: (day: number) => void;
}) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {WEEKDAY_OPTIONS.map((day) => {
        const active = value.includes(day.id);
        return (
          <button
            key={day.id}
            type="button"
            onClick={() => onToggle(day.id)}
            className={`flex h-14 flex-col items-center justify-center rounded-2xl text-xs font-medium ${
              active ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted"
            }`}
          >
            <span>{day.short}</span>
            <span className="mt-0.5 text-[10px] opacity-80">{day.full.slice(0, 3)}</span>
          </button>
        );
      })}
    </div>
  );
}
