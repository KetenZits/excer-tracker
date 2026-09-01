import { db } from "./db";
import type { Exercise, WorkoutDay } from "./types";

const now = 1_720_000_000_000;

const exercises: Exercise[] = [
  { id: "ex-bench-press", name: "Barbell Bench Press", muscleGroup: "chest", notes: "หลังติดม้านั่ง กดบาร์ลงถึงอก แล้วดันขึ้น", createdAt: now },
  { id: "ex-incline-db-press", name: "Incline Dumbbell Press", muscleGroup: "chest", notes: "ม้านั่งเอียง 30–45°", createdAt: now },
  { id: "ex-cable-fly", name: "Cable Fly", muscleGroup: "chest", createdAt: now },
  { id: "ex-ohp", name: "Overhead Press", muscleGroup: "shoulders", notes: "ยืนหรือนั่ง กดบาร์เหนือหัว", createdAt: now },
  { id: "ex-lateral-raise", name: "Lateral Raise", muscleGroup: "shoulders", createdAt: now },
  { id: "ex-face-pull", name: "Face Pull", muscleGroup: "shoulders", createdAt: now },
  { id: "ex-tricep-pushdown", name: "Tricep Pushdown", muscleGroup: "triceps", createdAt: now },
  { id: "ex-skull-crusher", name: "Skull Crusher", muscleGroup: "triceps", createdAt: now },
  { id: "ex-dips", name: "Dips", muscleGroup: "triceps", createdAt: now },
  { id: "ex-pull-up", name: "Pull Up", muscleGroup: "back", createdAt: now },
  { id: "ex-barbell-row", name: "Barbell Row", muscleGroup: "back", createdAt: now },
  { id: "ex-lat-pulldown", name: "Lat Pulldown", muscleGroup: "back", createdAt: now },
  { id: "ex-seated-row", name: "Seated Cable Row", muscleGroup: "back", createdAt: now },
  { id: "ex-barbell-curl", name: "Barbell Curl", muscleGroup: "biceps", createdAt: now },
  { id: "ex-hammer-curl", name: "Hammer Curl", muscleGroup: "biceps", createdAt: now },
  { id: "ex-squat", name: "Barbell Squat", muscleGroup: "quads", notes: "สะโพกลงต่ำกว่าเข่า หลังตรง", createdAt: now },
  { id: "ex-leg-press", name: "Leg Press", muscleGroup: "quads", createdAt: now },
  { id: "ex-leg-extension", name: "Leg Extension", muscleGroup: "quads", createdAt: now },
  { id: "ex-rdl", name: "Romanian Deadlift", muscleGroup: "hamstrings", createdAt: now },
  { id: "ex-leg-curl", name: "Lying Leg Curl", muscleGroup: "hamstrings", createdAt: now },
  { id: "ex-hip-thrust", name: "Hip Thrust", muscleGroup: "glutes", createdAt: now },
  { id: "ex-bulgarian-split", name: "Bulgarian Split Squat", muscleGroup: "quads", createdAt: now },
  { id: "ex-calf-raise", name: "Standing Calf Raise", muscleGroup: "calves", createdAt: now },
  { id: "ex-deadlift", name: "Deadlift", muscleGroup: "full-body", notes: "หลังตรง ดึงบาร์ชิดตัว", createdAt: now },
  { id: "ex-plank", name: "Plank", muscleGroup: "core", notes: "จับเวลาเป็นวินาทีในช่อง reps ได้", createdAt: now },
  { id: "ex-hanging-leg-raise", name: "Hanging Leg Raise", muscleGroup: "core", createdAt: now },
  { id: "ex-foam-quads", name: "Foam Roll — Quads", muscleGroup: "recovery", notes: "กลิ้งช้า ๆ 30–60 วินาที ต่อข้าง", createdAt: now },
  { id: "ex-foam-back", name: "Foam Roll — Back", muscleGroup: "recovery", notes: "หลบกระดูกสันหลัง กดที่กล้ามเนื้อข้างลำตัว", createdAt: now },
  { id: "ex-foam-glutes", name: "Foam Roll — Glutes", muscleGroup: "recovery", createdAt: now },
  { id: "ex-foam-it-band", name: "Foam Roll — IT Band", muscleGroup: "recovery", createdAt: now },
  { id: "ex-foam-calves", name: "Foam Roll — Calves", muscleGroup: "recovery", createdAt: now },
  { id: "ex-stretching", name: "Full Body Stretch", muscleGroup: "recovery", notes: "ยืดค้าง 20–30 วินาที ต่อท่า", createdAt: now },
  { id: "ex-hip-mobility", name: "Hip Mobility", muscleGroup: "recovery", createdAt: now },
];

const days: WorkoutDay[] = [
  {
    id: "day-push",
    name: "Push Day",
    createdAt: now,
    exercises: [
      { exerciseId: "ex-bench-press", targetSets: 4, targetReps: 8, targetWeight: 60 },
      { exerciseId: "ex-ohp", targetSets: 3, targetReps: 8, targetWeight: 40 },
      { exerciseId: "ex-incline-db-press", targetSets: 3, targetReps: 10, targetWeight: 22 },
      { exerciseId: "ex-lateral-raise", targetSets: 3, targetReps: 12, targetWeight: 8 },
      { exerciseId: "ex-tricep-pushdown", targetSets: 3, targetReps: 12, targetWeight: 20 },
    ],
  },
  {
    id: "day-pull",
    name: "Pull Day",
    createdAt: now,
    exercises: [
      { exerciseId: "ex-pull-up", targetSets: 4, targetReps: 6 },
      { exerciseId: "ex-barbell-row", targetSets: 4, targetReps: 8, targetWeight: 50 },
      { exerciseId: "ex-lat-pulldown", targetSets: 3, targetReps: 10, targetWeight: 45 },
      { exerciseId: "ex-face-pull", targetSets: 3, targetReps: 15, targetWeight: 15 },
      { exerciseId: "ex-barbell-curl", targetSets: 3, targetReps: 10, targetWeight: 25 },
    ],
  },
  {
    id: "day-legs",
    name: "Leg Day",
    createdAt: now,
    exercises: [
      { exerciseId: "ex-squat", targetSets: 4, targetReps: 6, targetWeight: 80 },
      { exerciseId: "ex-rdl", targetSets: 3, targetReps: 8, targetWeight: 70 },
      { exerciseId: "ex-leg-press", targetSets: 3, targetReps: 10, targetWeight: 120 },
      { exerciseId: "ex-leg-curl", targetSets: 3, targetReps: 12, targetWeight: 30 },
      { exerciseId: "ex-calf-raise", targetSets: 4, targetReps: 15, targetWeight: 40 },
    ],
  },
  {
    id: "day-recovery",
    name: "โฟมโรล / คูลดาวน์",
    kind: "recovery",
    createdAt: now + 1,
    exercises: [
      { exerciseId: "ex-foam-quads", targetSets: 1, targetReps: 60 },
      { exerciseId: "ex-foam-back", targetSets: 1, targetReps: 60 },
      { exerciseId: "ex-foam-glutes", targetSets: 1, targetReps: 45 },
      { exerciseId: "ex-foam-it-band", targetSets: 1, targetReps: 45 },
      { exerciseId: "ex-stretching", targetSets: 1, targetReps: 30 },
    ],
  },
];

export async function seedIfNeeded(): Promise<void> {
  const seeded = await db.meta.get("seeded");
  if (!seeded) {
    await db.transaction("rw", db.exercises, db.workoutDays, db.meta, async () => {
      const existing = await db.meta.get("seeded");
      if (existing) return;
      const count = await db.exercises.count();
      if (count === 0) {
        await db.exercises.bulkAdd(exercises);
      }
      const dayCount = await db.workoutDays.count();
      if (dayCount === 0) {
        await db.workoutDays.bulkAdd(days);
      }
      await db.meta.put({ key: "seeded", value: true });
    });
  }
  await seedRecoveryContent();
}

const recoveryExercises = exercises.filter((ex) => ex.muscleGroup === "recovery");
const recoveryDay = days.find((day) => day.id === "day-recovery")!;

async function seedRecoveryContent(): Promise<void> {
  const flag = await db.meta.get("seed-v2-recovery");
  if (flag) return;
  await db.transaction("rw", db.exercises, db.workoutDays, db.meta, async () => {
    const again = await db.meta.get("seed-v2-recovery");
    if (again) return;
    await db.exercises.bulkPut(recoveryExercises);
    const existingDay = await db.workoutDays.get("day-recovery");
    if (!existingDay) {
      await db.workoutDays.add(recoveryDay);
    }
    await db.meta.put({ key: "seed-v2-recovery", value: true });
  });
}
