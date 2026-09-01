import { addDays, format, startOfWeek, subDays } from "date-fns";
import type { WorkoutLog } from "./types";

export const WEEKDAY_OPTIONS = [
  { id: 1, short: "จ", full: "จันทร์" },
  { id: 2, short: "อ", full: "อังคาร" },
  { id: 3, short: "พ", full: "พุธ" },
  { id: 4, short: "พฤ", full: "พฤหัส" },
  { id: 5, short: "ศ", full: "ศุกร์" },
  { id: 6, short: "ส", full: "เสาร์" },
  { id: 0, short: "อา", full: "อาทิตย์" },
] as const;

export const ALL_WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

export function weekdaySet(weekdays: number[]): Set<number> {
  return new Set(weekdays.length > 0 ? weekdays : ALL_WEEKDAYS);
}

export function isScheduledDate(date: Date, weekdays: number[]): boolean {
  return weekdaySet(weekdays).has(date.getDay());
}

export function parseLogDate(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

export function isTrainingLog(log: WorkoutLog): boolean {
  return log.status === "completed" && log.kind !== "recovery";
}

export function trainingDates(logs: WorkoutLog[]): Set<string> {
  return new Set(logs.filter(isTrainingLog).map((log) => log.date));
}

export interface WeekPlanDay {
  date: string;
  weekday: number;
  short: string;
  scheduled: boolean;
  done: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export function thisWeekPlan(logs: WorkoutLog[], weekdays: number[], now = new Date()): WeekPlanDay[] {
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const today = format(now, "yyyy-MM-dd");
  const done = trainingDates(logs);
  const scheduled = weekdaySet(weekdays);

  return WEEKDAY_OPTIONS.map((opt, index) => {
    const date = format(addDays(start, index), "yyyy-MM-dd");
    return {
      date,
      weekday: opt.id,
      short: opt.short,
      scheduled: scheduled.has(opt.id),
      done: done.has(date),
      isToday: date === today,
      isFuture: date > today,
    };
  });
}

export function scheduledLabel(weekdays: number[]): string {
  const set = weekdaySet(weekdays);
  return WEEKDAY_OPTIONS.filter((d) => set.has(d.id))
    .map((d) => d.full)
    .join(" · ");
}

export function previousDay(date: Date): Date {
  return subDays(date, 1);
}
