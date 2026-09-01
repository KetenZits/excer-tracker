"use client";

import { Minus, Plus } from "lucide-react";
import type { Unit } from "@/lib/types";
import { fromDisplay, toDisplay } from "@/lib/units";

export function NumberStepper({
  label,
  value,
  onChange,
  step,
  min = 0,
  unit,
  storedInKg,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step: number;
  min?: number;
  unit?: Unit;
  storedInKg?: boolean;
}) {
  const display = storedInKg && unit ? toDisplay(value, unit) : value;

  function commitDisplay(nextDisplay: number) {
    const clamped = Math.max(min, nextDisplay);
    if (storedInKg && unit) {
      onChange(fromDisplay(clamped, unit));
    } else {
      onChange(clamped);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`ลด${label}`}
        onClick={() => commitDisplay(round(display - step))}
        className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-2xl font-medium active:scale-95"
      >
        <Minus className="size-6" />
      </button>
      <label className="min-w-0 flex-1 text-center">
        <input
          inputMode="decimal"
          className="w-full bg-transparent text-center text-3xl font-semibold tabular outline-none"
          value={Number.isInteger(display) ? String(display) : display.toFixed(1)}
          onChange={(e) => {
            const parsed = Number(e.target.value);
            if (Number.isFinite(parsed)) commitDisplay(parsed);
          }}
        />
        <span className="block text-xs text-muted">{label}</span>
      </label>
      <button
        type="button"
        aria-label={`เพิ่ม${label}`}
        onClick={() => commitDisplay(round(display + step))}
        className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-2xl font-medium active:scale-95"
      >
        <Plus className="size-6" />
      </button>
    </div>
  );
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
