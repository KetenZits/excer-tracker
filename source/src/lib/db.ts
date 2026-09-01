import Dexie, { type EntityTable } from "dexie";
import type { Exercise, MuscleGroupDef, WorkoutDay, WorkoutLog } from "./types";

export type MetaRow = { key: string; value: unknown };

export class WorkoutDatabase extends Dexie {
  exercises!: EntityTable<Exercise, "id">;
  workoutDays!: EntityTable<WorkoutDay, "id">;
  logs!: EntityTable<WorkoutLog, "id">;
  meta!: EntityTable<MetaRow, "key">;
  muscleGroups!: EntityTable<MuscleGroupDef, "id">;

  constructor() {
    super("workout-tracker");
    this.version(1).stores({
      exercises: "id, name, muscleGroup, createdAt",
      workoutDays: "id, name, createdAt",
      logs: "id, date, workoutDayId, status, createdAt",
      meta: "key",
    });
    this.version(2).stores({
      exercises: "id, name, muscleGroup, createdAt",
      workoutDays: "id, name, createdAt",
      logs: "id, date, workoutDayId, status, createdAt",
      meta: "key",
      muscleGroups: "id, label, createdAt",
    });
  }
}

export const db = new WorkoutDatabase();
