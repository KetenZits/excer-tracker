"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { format, subDays } from "date-fns";
import { Flame, Play } from "lucide-react";
import { useMemo, useState } from "react";
import { Heatmap } from "@/components/dashboard/heatmap";
import { WeekPlanCard } from "@/components/dashboard/week-plan";
import { MuscleChart, OverloadChart, VolumeChart } from "@/components/dashboard/charts";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { db } from "@/lib/db";
import {
  currentStreak,
  heatmapData,
  longestStreak,
  muscleShare,
  progressiveOverload,
  thisWeekStats,
  volumeByPeriod,
} from "@/lib/stats";
import { formatWeight } from "@/lib/units";
import type { Exercise, WorkoutLog } from "@/lib/types";
import { useMuscleGroups } from "@/hooks/use-muscle-groups";
import { useSession } from "@/store/session";
import { useSettings } from "@/store/settings";

type VolumeRange = "12w" | "6m" | "1y";
type MuscleRange = "7d" | "30d" | "90d" | "all";

const EMPTY_LOGS: WorkoutLog[] = [];
const EMPTY_EXERCISES: Exercise[] = [];

export function Dashboard() {
  const unit = useSettings((s) => s.unit);
  const { custom, isDuration } = useMuscleGroups();
  const trainingWeekdays = useSettings((s) => s.trainingWeekdays);
  const activeLogId = useSession((s) => s.activeLogId);
  const logs = useLiveQuery(() => db.logs.toArray()) ?? EMPTY_LOGS;
  const exercises = useLiveQuery(() => db.exercises.orderBy("name").toArray()) ?? EMPTY_EXERCISES;
  const active = useLiveQuery(
    () => (activeLogId ? db.logs.get(activeLogId) : undefined),
    [activeLogId],
  );

  const [period, setPeriod] = useState<"week" | "month">("week");
  const [range, setRange] = useState<VolumeRange>("12w");
  const [muscleRange, setMuscleRange] = useState<MuscleRange>("30d");
  const [exerciseId, setExerciseId] = useState<string>("");

  const completed = logs.filter((l) => l.status === "completed");
  const streak = currentStreak(logs, trainingWeekdays);
  const longest = longestStreak(logs, trainingWeekdays);
  const week = thisWeekStats(logs);
  const heat = useMemo(() => heatmapData(logs, 26), [logs]);
  const volume = useMemo(() => volumeByPeriod(logs, period, range), [logs, period, range]);
  const since = muscleSince(muscleRange);
  const muscles = useMemo(
    () => muscleShare(logs, exercises, since, custom),
    [logs, exercises, since, custom],
  );
  const strengthExercises = exercises.filter((ex) => !isDuration(ex.muscleGroup));
  const overloadExercise = exerciseId || strengthExercises[0]?.id || "";
  const overload = overloadExercise ? progressiveOverload(logs, overloadExercise) : [];

  return (
    <div className="space-y-4">
      <PageHeader title="แดชบอร์ด" subtitle="สรุป volume, streak และ progressive overload" />

      {active?.status === "in-progress" ? (
        <Link href="/log">
          <Card className="flex items-center justify-between border-accent/50 p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-accent">กำลังฝึกอยู่</p>
              <p className="text-lg font-semibold">{active.title}</p>
            </div>
            <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-fg">
              <Play className="size-5" />
            </span>
          </Card>
        </Link>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="สัปดาห์นี้" value={String(week.sessions)} hint="ครั้ง" />
        <Stat label="Volume สัปดาห์นี้" value={formatWeight(week.volume, unit)} />
        <Stat
          label="Streak"
          value={String(streak)}
          hint="วันฝึก"
          icon={<Flame className="size-4 text-orange-400" />}
        />
        <Stat label="ยาวสุด" value={String(longest)} hint="วันฝึกติด" />
      </div>

      <Card>
        <WeekPlanCard logs={logs} weekdays={trainingWeekdays} />
      </Card>

      <Card>
        <Heatmap days={heat} unit={unit} streak={streak} />
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Volume รวม</h2>
          <div className="flex gap-2">
            <Segment
              value={period}
              onChange={setPeriod}
              options={[
                { id: "week", label: "รายสัปดาห์" },
                { id: "month", label: "รายเดือน" },
              ]}
            />
            <Select value={range} onChange={(e) => setRange(e.target.value as VolumeRange)} className="w-auto py-2 text-sm">
              <option value="12w">12 สัปดาห์</option>
              <option value="6m">6 เดือน</option>
              <option value="1y">1 ปี</option>
            </Select>
          </div>
        </div>
        {completed.length === 0 ? (
          <EmptyHint />
        ) : (
          <VolumeChart data={volume} />
        )}
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">สัดส่วนกลุ่มกล้ามเนื้อ</h2>
          <Select
            value={muscleRange}
            onChange={(e) => setMuscleRange(e.target.value as MuscleRange)}
            className="w-auto py-2 text-sm"
          >
            <option value="7d">7 วัน</option>
            <option value="30d">30 วัน</option>
            <option value="90d">90 วัน</option>
            <option value="all">ทั้งหมด</option>
          </Select>
        </div>
        <MuscleChart data={muscles} />
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Progressive overload</h2>
          <Select
            value={overloadExercise}
            onChange={(e) => setExerciseId(e.target.value)}
            className="max-w-48 py-2 text-sm"
          >
            {strengthExercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </Select>
        </div>
        <p className="mb-2 text-xs text-muted">เส้นทึบ = น้ำหนักสูงสุดต่อเซสชัน · เส้นประ = e1RM</p>
        <OverloadChart data={overload} />
      </Card>

      {completed.length === 0 ? (
        <Link href="/log" className="block">
          <Button size="xl" className="w-full">
            เริ่มล็อกครั้งแรก
          </Button>
        </Link>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="p-3">
      <p className="flex items-center gap-1 text-xs text-muted">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular leading-tight">
        {value} {hint ? <span className="text-xs font-medium text-muted">{hint}</span> : null}
      </p>
    </Card>
  );
}

function Segment<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="flex rounded-xl bg-surface-2 p-1 text-xs">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`rounded-lg px-3 py-1.5 font-medium ${value === opt.id ? "bg-surface text-foreground" : "text-muted"}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function EmptyHint() {
  return (
    <p className="py-10 text-center text-sm text-muted">
      ยังไม่มีประวัติ — ล็อกครั้งแรกแล้วกราฟจะโชว์ที่นี่
    </p>
  );
}

function muscleSince(range: MuscleRange): string {
  if (range === "all") return "0000-01-01";
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return format(subDays(new Date(), days - 1), "yyyy-MM-dd");
}
