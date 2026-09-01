import {
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import { th } from "date-fns/locale";
import { resolveMuscleGroup, type Exercise, type MuscleGroupDef, type WorkoutLog } from "./types";
import { isScheduledDate, parseLogDate, previousDay, trainingDates } from "./schedule";

export function setVolume(reps: number, weight: number, completed: boolean): number {
  if (!completed) return 0;
  return reps * weight;
}

export function logVolume(log: WorkoutLog): number {
  return log.entries.reduce(
    (sum, entry) =>
      sum + entry.sets.reduce((s, set) => s + setVolume(set.reps, set.weight, set.completed), 0),
    0,
  );
}

export function completedLogs(logs: WorkoutLog[]): WorkoutLog[] {
  return logs.filter((log) => log.status === "completed");
}

export function currentStreak(logs: WorkoutLog[], weekdays: number[] = [0, 1, 2, 3, 4, 5, 6]): number {
  const dates = trainingDates(logs);
  if (dates.size === 0) return 0;

  let cursor = new Date();
  const today = format(cursor, "yyyy-MM-dd");
  if (isScheduledDate(cursor, weekdays) && !dates.has(today)) {
    cursor = previousDay(cursor);
  }

  let streak = 0;
  for (let i = 0; i < 800; i += 1) {
    if (!isScheduledDate(cursor, weekdays)) {
      cursor = previousDay(cursor);
      continue;
    }
    if (!dates.has(format(cursor, "yyyy-MM-dd"))) break;
    streak += 1;
    cursor = previousDay(cursor);
  }
  return streak;
}

export function longestStreak(logs: WorkoutLog[], weekdays: number[] = [0, 1, 2, 3, 4, 5, 6]): number {
  const dates = [...trainingDates(logs)].sort();
  if (dates.length === 0) return 0;

  let best = 1;
  let run = 1;
  let prevScheduled = parseLogDate(dates[0]);

  for (let i = 1; i < dates.length; i += 1) {
    const curr = parseLogDate(dates[i]);
    const expected = nextScheduledDay(prevScheduled, weekdays);
    if (format(curr, "yyyy-MM-dd") === format(expected, "yyyy-MM-dd")) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
    prevScheduled = curr;
  }
  return best;
}

function nextScheduledDay(from: Date, weekdays: number[]): Date {
  let cursor = new Date(from.getTime() + 86_400_000);
  for (let i = 0; i < 8; i += 1) {
    if (isScheduledDate(cursor, weekdays)) return cursor;
    cursor = new Date(cursor.getTime() + 86_400_000);
  }
  return cursor;
}

export type VolumePoint = { label: string; key: string; volume: number; sessions: number };

export function volumeByPeriod(
  logs: WorkoutLog[],
  period: "week" | "month",
  range: "12w" | "6m" | "1y",
): VolumePoint[] {
  const done = completedLogs(logs);
  const now = new Date();
  const start =
    range === "12w" ? subDays(now, 7 * 11) : range === "6m" ? subMonths(now, 5) : subMonths(now, 11);

  const buckets = new Map<string, VolumePoint>();

  if (period === "week") {
    let cursor = startOfWeek(start, { weekStartsOn: 1 });
    const end = startOfWeek(now, { weekStartsOn: 1 });
    while (cursor <= end) {
      const key = format(cursor, "yyyy-MM-dd");
      buckets.set(key, {
        key,
        label: format(cursor, "d MMM", { locale: th }),
        volume: 0,
        sessions: 0,
      });
      cursor = new Date(cursor.getTime() + 7 * 86_400_000);
    }
    for (const log of done) {
      const week = format(startOfWeek(new Date(`${log.date}T00:00:00`), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const bucket = buckets.get(week);
      if (!bucket) continue;
      bucket.volume += logVolume(log);
      bucket.sessions += 1;
    }
  } else {
    let cursor = startOfMonth(start);
    const end = startOfMonth(now);
    while (cursor <= end) {
      const key = format(cursor, "yyyy-MM");
      buckets.set(key, {
        key,
        label: format(cursor, "MMM yy", { locale: th }),
        volume: 0,
        sessions: 0,
      });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    for (const log of done) {
      const month = log.date.slice(0, 7);
      const bucket = buckets.get(month);
      if (!bucket) continue;
      bucket.volume += logVolume(log);
      bucket.sessions += 1;
    }
  }

  return [...buckets.values()];
}

export interface HeatDay {
  date: string;
  count: number;
  volume: number;
}

export function heatmapData(logs: WorkoutLog[], weeks = 20): HeatDay[] {
  const end = new Date();
  const start = startOfWeek(subDays(end, weeks * 7 - 1), { weekStartsOn: 1 });
  const byDate = new Map<string, HeatDay>();
  for (const log of completedLogs(logs)) {
    const current = byDate.get(log.date) ?? { date: log.date, count: 0, volume: 0 };
    current.count += 1;
    current.volume += logVolume(log);
    byDate.set(log.date, current);
  }
  return eachDayOfInterval({ start, end }).map((day) => {
    const date = format(day, "yyyy-MM-dd");
    return byDate.get(date) ?? { date, count: 0, volume: 0 };
  });
}

export function thisWeekStats(logs: WorkoutLog[]): { sessions: number; volume: number } {
  const start = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const end = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekLogs = completedLogs(logs).filter((log) => log.date >= start && log.date <= end);
  return {
    sessions: weekLogs.length,
    volume: weekLogs.reduce((sum, log) => sum + logVolume(log), 0),
  };
}

export interface MuscleShare {
  id: string;
  label: string;
  color: string;
  volume: number;
}

export function muscleShare(
  logs: WorkoutLog[],
  exercises: Exercise[],
  since: string,
  groups: MuscleGroupDef[] = [],
): MuscleShare[] {
  const exerciseMap = new Map(exercises.map((ex) => [ex.id, ex]));
  const totals = new Map<string, number>();

  for (const log of completedLogs(logs)) {
    if (log.date < since) continue;
    for (const entry of log.entries) {
      const exercise = exerciseMap.get(entry.exerciseId);
      const group = exercise?.muscleGroup ?? "full-body";
      if (resolveMuscleGroup(group, groups).durationMode) continue;
      const volume = entry.sets.reduce((s, set) => s + setVolume(set.reps, set.weight, set.completed), 0);
      totals.set(group, (totals.get(group) ?? 0) + volume);
    }
  }

  return [...totals.entries()]
    .map(([id, volume]) => {
      const fromLib = resolveMuscleGroup(id, groups);
      return {
        id,
        label: fromLib.label,
        color: fromLib.color,
        volume,
      };
    })
    .filter((row) => row.volume > 0)
    .sort((a, b) => b.volume - a.volume);
}

export interface OverloadPoint {
  date: string;
  label: string;
  maxWeight: number;
  estimated1rm: number;
}

export function progressiveOverload(logs: WorkoutLog[], exerciseId: string): OverloadPoint[] {
  const points: OverloadPoint[] = [];
  const sorted = completedLogs(logs).slice().sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);

  for (const log of sorted) {
    const entry = log.entries.find((item) => item.exerciseId === exerciseId);
    if (!entry) continue;
    const completed = entry.sets.filter((set) => set.completed && set.reps > 0);
    if (completed.length === 0) continue;
    const maxWeight = Math.max(...completed.map((set) => set.weight));
    const best = completed.reduce((acc, set) => {
      const e1rm = set.weight * (1 + set.reps / 30);
      return e1rm > acc ? e1rm : acc;
    }, 0);
    points.push({
      date: log.date,
      label: format(new Date(`${log.date}T00:00:00`), "d MMM", { locale: th }),
      maxWeight,
      estimated1rm: Math.round(best * 10) / 10,
    });
  }
  return points;
}

export function lastPerformance(
  logs: WorkoutLog[],
  exerciseId: string,
): { weight: number; reps: number } | null {
  const sorted = completedLogs(logs)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

  for (const log of sorted) {
    const entry = log.entries.find((item) => item.exerciseId === exerciseId);
    const last = entry?.sets.filter((set) => set.completed).at(-1);
    if (last) return { weight: last.weight, reps: last.reps };
  }
  return null;
}
