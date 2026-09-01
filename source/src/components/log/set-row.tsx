"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SetLog, Unit } from "@/lib/types";
import { weightStep } from "@/lib/units";
import { NumberStepper } from "./number-stepper";

export function SetRow({
  index,
  set,
  unit,
  targetLabel,
  onChange,
  onRemove,
  durationMode,
}: {
  index: number;
  set: SetLog;
  unit: Unit;
  targetLabel?: string;
  durationMode?: boolean;
  onChange: (set: SetLog) => void;
  onRemove: () => void;
}) {
  function toggle() {
    const next = { ...set, completed: !set.completed };
    onChange(next);
    if (next.completed && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(12);
    }
  }

  return (
    <div
      className={cn(
        "rounded-2xl border p-3 transition",
        set.completed ? "border-accent/50 bg-accent/10" : "border-border bg-surface",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">เซต {index + 1}</p>
          {targetLabel ? <p className="text-xs text-muted">เป้า {targetLabel}</p> : null}
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={set.completed ? "ยกเลิกเซต" : "เซตเสร็จ"}
          className={cn(
            "flex size-16 items-center justify-center rounded-2xl transition active:scale-95",
            set.completed ? "bg-accent text-accent-fg shadow-md" : "bg-surface-2 text-muted",
          )}
        >
          <Check className="size-8" strokeWidth={3} />
        </button>
      </div>
      <div className="space-y-2">
        {durationMode ? (
          <NumberStepper
            label="วินาที"
            value={set.reps}
            step={15}
            min={0}
            onChange={(reps) => onChange({ ...set, reps, weight: 0 })}
          />
        ) : (
          <>
            <NumberStepper
              label={`น้ำหนัก (${unit})`}
              value={set.weight}
              step={weightStep(unit)}
              min={0}
              unit={unit}
              storedInKg
              onChange={(weight) => onChange({ ...set, weight })}
            />
            <NumberStepper
              label="จำนวนครั้ง"
              value={set.reps}
              step={1}
              min={0}
              onChange={(reps) => onChange({ ...set, reps })}
            />
          </>
        )}
      </div>
      <button type="button" onClick={onRemove} className="mt-2 text-xs text-muted">
        ลบเซตนี้
      </button>
    </div>
  );
}
