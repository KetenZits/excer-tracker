import { format } from "date-fns";
import { db } from "./db";
import { nid } from "./id";
import { lastPerformance } from "./stats";
import type {
  Exercise,
  ExercisePlan,
  ExportPayload,
  LogEntry,
  MuscleGroupDef,
  SessionKind,
  SetLog,
  WorkoutDay,
  WorkoutLog,
} from "./types";
import { DEFAULT_MUSCLE_GROUPS } from "./types";

export async function createExercise(input: {
  name: string;
  muscleGroup: string;
  notes?: string;
}): Promise<string> {
  const id = nid();
  await db.exercises.add({
    id,
    name: input.name.trim(),
    muscleGroup: input.muscleGroup,
    notes: input.notes?.trim() || undefined,
    createdAt: Date.now(),
  });
  return id;
}

export async function updateExercise(id: string, patch: Partial<Omit<Exercise, "id" | "createdAt">>) {
  await db.exercises.update(id, patch);
}

export async function deleteExercise(id: string) {
  await db.exercises.delete(id);
}

export async function createMuscleGroup(input: {
  label: string;
  color: string;
  durationMode?: boolean;
}): Promise<string> {
  const label = input.label.trim();
  if (!label) throw new Error("กรอกชื่อกลุ่มกล้ามเนื้อ");
  const existing = await db.muscleGroups.toArray();
  const taken = [...DEFAULT_MUSCLE_GROUPS, ...existing].some(
    (g) => g.label.toLowerCase() === label.toLowerCase(),
  );
  if (taken) throw new Error("มีกลุ่มชื่อนี้อยู่แล้ว");
  const id = `mg-${nid()}`;
  await db.muscleGroups.add({
    id,
    label,
    color: input.color,
    durationMode: input.durationMode,
    createdAt: Date.now(),
  });
  return id;
}

export async function updateMuscleGroup(
  id: string,
  patch: Partial<Pick<MuscleGroupDef, "label" | "color" | "durationMode">>,
) {
  if (DEFAULT_MUSCLE_GROUPS.some((g) => g.id === id)) {
    throw new Error("แก้กลุ่มตั้งต้นไม่ได้");
  }
  await db.muscleGroups.update(id, patch);
}

export async function deleteMuscleGroup(id: string) {
  if (DEFAULT_MUSCLE_GROUPS.some((g) => g.id === id)) {
    throw new Error("ลบกลุ่มตั้งต้นไม่ได้");
  }
  const used = await db.exercises.where("muscleGroup").equals(id).toArray();
  await db.transaction("rw", db.exercises, db.muscleGroups, async () => {
    for (const ex of used) {
      await db.exercises.update(ex.id, { muscleGroup: "full-body" });
    }
    await db.muscleGroups.delete(id);
  });
}

export async function createWorkoutDay(name = "วันฝึกใหม่", kind: SessionKind = "training"): Promise<string> {
  const id = nid();
  await db.workoutDays.add({
    id,
    name,
    kind,
    exercises: [],
    createdAt: Date.now(),
  });
  return id;
}

export async function updateWorkoutDay(id: string, patch: Partial<Omit<WorkoutDay, "id" | "createdAt">>) {
  await db.workoutDays.update(id, patch);
}

export async function deleteWorkoutDay(id: string) {
  await db.workoutDays.delete(id);
}

export function emptySets(count: number, reps: number, weight: number): SetLog[] {
  return Array.from({ length: Math.max(1, count) }, () => ({
    reps,
    weight,
    completed: false,
  }));
}

export async function startWorkout(options: {
  workoutDay?: WorkoutDay | null;
  date?: string;
  kind?: SessionKind;
}): Promise<string> {
  const logs = await db.logs.toArray();
  const exercises = options.workoutDay?.exercises ?? [];
  const kind = options.kind ?? options.workoutDay?.kind ?? "training";
  const recovery = kind === "recovery";

  const entries: LogEntry[] = exercises.map((plan) => {
    const last = lastPerformance(logs, plan.exerciseId);
    const weight = recovery ? 0 : (last?.weight ?? plan.targetWeight ?? 0);
    const reps = plan.targetReps || last?.reps || (recovery ? 60 : 8);
    return {
      exerciseId: plan.exerciseId,
      sets: emptySets(plan.targetSets || (recovery ? 1 : 3), reps, weight),
    };
  });

  const id = nid();
  const log: WorkoutLog = {
    id,
    date: options.date ?? format(new Date(), "yyyy-MM-dd"),
    workoutDayId: options.workoutDay?.id ?? null,
    title: options.workoutDay?.name ?? (recovery ? "โฟมโรล / คูลดาวน์" : "Freeform"),
    kind,
    entries,
    status: "in-progress",
    createdAt: Date.now(),
  };
  await db.logs.add(log);
  return id;
}

export async function saveLog(id: string, patch: Partial<WorkoutLog>) {
  await db.logs.update(id, patch);
}

export async function finishWorkout(id: string) {
  await db.logs.update(id, {
    status: "completed",
    completedAt: Date.now(),
  });
}

export async function deleteLog(id: string) {
  await db.logs.delete(id);
}

export async function addExerciseToDay(day: WorkoutDay, plan: ExercisePlan) {
  if (day.exercises.some((item) => item.exerciseId === plan.exerciseId)) return;
  await updateWorkoutDay(day.id, { exercises: [...day.exercises, plan] });
}

export async function exportAll(): Promise<ExportPayload> {
  const [exercises, workoutDays, logs, muscleGroups] = await Promise.all([
    db.exercises.toArray(),
    db.workoutDays.toArray(),
    db.logs.toArray(),
    db.muscleGroups.toArray(),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises,
    workoutDays,
    logs,
    muscleGroups,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseExport(raw: unknown): ExportPayload {
  if (!isRecord(raw) || raw.version !== 1) {
    throw new Error("ไฟล์สำรองไม่ถูกต้อง (ต้องการ version 1)");
  }
  if (!Array.isArray(raw.exercises) || !Array.isArray(raw.workoutDays) || !Array.isArray(raw.logs)) {
    throw new Error("ไฟล์สำรองไม่ครบ (exercises / workoutDays / logs)");
  }
  return {
    version: 1,
    exportedAt: typeof raw.exportedAt === "string" ? raw.exportedAt : new Date().toISOString(),
    exercises: raw.exercises as Exercise[],
    workoutDays: raw.workoutDays as WorkoutDay[],
    logs: raw.logs as WorkoutLog[],
    muscleGroups: Array.isArray(raw.muscleGroups) ? (raw.muscleGroups as MuscleGroupDef[]) : [],
  };
}

export async function importAll(payload: ExportPayload, mode: "replace" | "merge") {
  await db.transaction("rw", db.exercises, db.workoutDays, db.logs, db.muscleGroups, db.meta, async () => {
    if (mode === "replace") {
      await Promise.all([
        db.exercises.clear(),
        db.workoutDays.clear(),
        db.logs.clear(),
        db.muscleGroups.clear(),
      ]);
    }
    await db.exercises.bulkPut(payload.exercises);
    await db.workoutDays.bulkPut(payload.workoutDays);
    await db.logs.bulkPut(payload.logs);
    if (payload.muscleGroups?.length) {
      await db.muscleGroups.bulkPut(payload.muscleGroups);
    }
    await db.meta.put({ key: "seeded", value: true });
  });
}
