"use client";

import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/cn";
import { formatWeight } from "@/lib/units";
import type { Unit } from "@/lib/types";
import type { HeatDay } from "@/lib/stats";

const WEEKDAYS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

export function Heatmap({ days, unit, streak }: { days: HeatDay[]; unit: Unit; streak: number }) {
  const weeks: HeatDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  const maxVolume = Math.max(0, ...days.map((d) => d.volume));

  return (
    <div>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-sm text-muted">ความถี่การฝึก</p>
          <p className="text-2xl font-semibold tabular">
            {streak} <span className="text-base font-medium text-muted">วันฝึกติด</span>
          </p>
          <p className="mt-1 text-[11px] text-muted">วันพักตามตารางไม่ตัด streak</p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted">
          น้อย
          {[0, 1, 2, 3, 4].map((level) => (
            <span key={level} className={cn("size-3 rounded-sm", heatClass(level))} />
          ))}
          มาก
        </div>
      </div>
      <div className="chip-scroll flex gap-1">
        <div className="flex flex-col justify-between py-0.5 pr-1 text-[10px] text-muted">
          {WEEKDAYS.map((d) => (
            <span key={d} className="h-3.5 leading-none">
              {d}
            </span>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={week[0]?.date ?? wi} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, di) => {
              const day = week[di];
              if (!day) return <span key={di} className="size-3.5" />;
              const level = heatLevel(day, maxVolume);
              const label = `${format(parseISO(day.date), "d MMM yyyy", { locale: th })}${
                day.count ? ` · ${day.count} ครั้ง · ${formatWeight(day.volume, unit)}` : " · พัก"
              }`;
              return (
                <span
                  key={day.date}
                  title={label}
                  className={cn("size-3.5 rounded-sm", heatClass(level))}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function heatLevel(day: HeatDay, maxVolume: number): number {
  if (day.count === 0) return 0;
  if (maxVolume <= 0) return 2;
  const ratio = day.volume / maxVolume;
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.75) return 3;
  return 4;
}

function heatClass(level: number): string {
  return ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"][level] ?? "bg-heat-0";
}
