export const MUSCLE_GROUP_COLORS = [
  "#f97316",
  "#3b82f6",
  "#eab308",
  "#ec4899",
  "#a855f7",
  "#22c55e",
  "#14b8a6",
  "#84cc16",
  "#06b6d4",
  "#f43f5e",
  "#6366f1",
  "#fb923c",
  "#38bdf8",
  "#a3e635",
  "#94a3b8",
] as const;

export interface MuscleGroupDef {
  id: string;
  label: string;
  color: string;
  durationMode?: boolean;
  builtIn?: boolean;
  createdAt?: number;
}

export const DEFAULT_MUSCLE_GROUPS: MuscleGroupDef[] = [
  { id: "chest", label: "อก", color: "#f97316", builtIn: true },
  { id: "back", label: "หลัง", color: "#3b82f6", builtIn: true },
  { id: "shoulders", label: "ไหล่", color: "#eab308", builtIn: true },
  { id: "biceps", label: "ไบเซปส์", color: "#ec4899", builtIn: true },
  { id: "triceps", label: "ไตรเซปส์", color: "#a855f7", builtIn: true },
  { id: "quads", label: "ต้นขาหน้า", color: "#22c55e", builtIn: true },
  { id: "hamstrings", label: "ต้นขาหลัง", color: "#14b8a6", builtIn: true },
  { id: "glutes", label: "สะโพก", color: "#84cc16", builtIn: true },
  { id: "calves", label: "น่อง", color: "#06b6d4", builtIn: true },
  { id: "core", label: "แกนกลาง", color: "#f43f5e", builtIn: true },
  { id: "full-body", label: "ทั้งตัว", color: "#6366f1", builtIn: true },
  { id: "cardio", label: "คาร์ดิโอ", color: "#64748b", builtIn: true },
  { id: "recovery", label: "คูลดาวน์", color: "#94a3b8", builtIn: true, durationMode: true },
];

/** @deprecated ใช้ DEFAULT_MUSCLE_GROUPS */
export const MUSCLE_GROUPS = DEFAULT_MUSCLE_GROUPS;

export type MuscleGroupId = string;
export type Unit = "kg" | "lb";
export type Theme = "dark" | "light";
export type SessionKind = "training" | "recovery";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  notes?: string;
  createdAt: number;
}

export interface ExercisePlan {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  targetWeight?: number;
}

export interface WorkoutDay {
  id: string;
  name: string;
  kind?: SessionKind;
  exercises: ExercisePlan[];
  createdAt: number;
}

export interface SetLog {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface LogEntry {
  exerciseId: string;
  sets: SetLog[];
}

export interface WorkoutLog {
  id: string;
  date: string;
  workoutDayId: string | null;
  title: string;
  kind?: SessionKind;
  entries: LogEntry[];
  status: "in-progress" | "completed";
  notes?: string;
  createdAt: number;
  completedAt?: number;
}

export interface ExportPayload {
  version: 1;
  exportedAt: string;
  exercises: Exercise[];
  workoutDays: WorkoutDay[];
  logs: WorkoutLog[];
  muscleGroups?: MuscleGroupDef[];
}

export function isMuscleGroupId(value: string): boolean {
  return DEFAULT_MUSCLE_GROUPS.some((g) => g.id === value);
}

export function muscleLabel(id: string, extras: MuscleGroupDef[] = []): string {
  return resolveMuscleGroup(id, extras).label;
}

export function muscleColor(id: string, extras: MuscleGroupDef[] = []): string {
  return resolveMuscleGroup(id, extras).color;
}

export function mergeMuscleGroups(custom: MuscleGroupDef[] = []): MuscleGroupDef[] {
  const customIds = new Set(custom.map((g) => g.id));
  return [...DEFAULT_MUSCLE_GROUPS.filter((g) => !customIds.has(g.id)), ...custom];
}

export function resolveMuscleGroup(id: string, extras: MuscleGroupDef[] = []): MuscleGroupDef {
  return mergeMuscleGroups(extras).find((g) => g.id === id) ?? {
    id,
    label: id,
    color: "#64748b",
  };
}

export function isDurationGroup(id: string, extras: MuscleGroupDef[] = []): boolean {
  return Boolean(resolveMuscleGroup(id, extras).durationMode || id === "recovery");
}
