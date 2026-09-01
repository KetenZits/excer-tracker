"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { scheduledLabel, thisWeekPlan } from "@/lib/schedule";
import type { WorkoutLog } from "@/lib/types";

export function WeekPlanCard({
  logs,
  weekdays,
}: {
  logs: WorkoutLog[];
  weekdays: number[];
}) {
  const days = thisWeekPlan(logs, weekdays);
  const planned = days.filter((d) => d.scheduled);
  const done = planned.filter((d) => d.done).length;

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">ตารางสัปดาห์นี้</h2>
          <p className="text-xs text-muted">
            ฝึก {scheduledLabel(weekdays)} · ครบแล้ว {done}/{planned.length} วัน
          </p>
        </div>
        <Link href="/settings" className="text-xs font-medium text-accent">
          แก้ตาราง
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => (
          <div
            key={day.date}
            className={cn(
              "flex flex-col items-center rounded-2xl px-1 py-2 text-center",
              day.isToday && "ring-2 ring-accent",
              day.scheduled ? "bg-surface-2" : "bg-transparent opacity-50",
              day.done && "bg-accent/15",
            )}
          >
            <span className="text-[11px] text-muted">{day.short}</span>
            <span className="mt-1 flex size-7 items-center justify-center">
              {day.done ? (
                <Check className="size-4 text-accent" strokeWidth={3} />
              ) : day.scheduled ? (
                <span className="size-2 rounded-full bg-muted/50" />
              ) : (
                <span className="text-[10px] text-muted">พัก</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
