"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ExercisePicker } from "@/components/exercises/exercise-picker";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/modal";
import { db } from "@/lib/db";
import { addExerciseToDay, deleteWorkoutDay, startWorkout, updateWorkoutDay } from "@/lib/queries";
import { fromDisplay, toDisplay, weightStep } from "@/lib/units";
import { useMuscleGroups } from "@/hooks/use-muscle-groups";
import { useSession } from "@/store/session";
import { useSettings } from "@/store/settings";

export function PlanEditor() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const unit = useSettings((s) => s.unit);
  const { label, isDuration } = useMuscleGroups();
  const setActiveLogId = useSession((s) => s.setActiveLogId);
  const day = useLiveQuery(() => db.workoutDays.get(params.id), [params.id]);
  const exercises = useLiveQuery(() => db.exercises.toArray()) ?? [];
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (day === undefined) {
    return <p className="text-sm text-muted">กำลังโหลด...</p>;
  }
  if (!day) {
    return (
      <EmptyState
        title="ไม่พบวันฝึกนี้"
        action={
          <Link href="/plans">
            <Button variant="secondary">กลับไปรายการแผน</Button>
          </Link>
        }
      />
    );
  }

  const currentDay = day;
  const exerciseMap = new Map(exercises.map((ex) => [ex.id, ex]));

  async function updatePlan(index: number, patch: Partial<(typeof currentDay.exercises)[number]>) {
    const next = currentDay.exercises.map((item, i) => (i === index ? { ...item, ...patch } : item));
    await updateWorkoutDay(currentDay.id, { exercises: next });
  }

  async function move(index: number, dir: -1 | 1) {
    const next = [...currentDay.exercises];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    await updateWorkoutDay(currentDay.id, { exercises: next });
  }

  async function removeAt(index: number) {
    const next = currentDay.exercises.filter((_, i) => i !== index);
    await updateWorkoutDay(currentDay.id, { exercises: next });
  }

  return (
    <div>
      <PageHeader
        title="แก้ไขวันฝึก"
        action={
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" />
            ลบวัน
          </Button>
        }
      />

      <Field label="ชื่อวัน">
        <Input
          value={day.name}
          onChange={(e) => updateWorkoutDay(day.id, { name: e.target.value })}
          placeholder="เช่น Push Day"
        />
      </Field>

      <div className="mt-4">
        <p className="mb-1.5 text-sm font-medium text-muted">ประเภท</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => updateWorkoutDay(day.id, { kind: "training" })}
            className={`h-12 rounded-2xl text-sm font-medium ${(day.kind ?? "training") === "training" ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted"}`}
          >
            วันฝึก
          </button>
          <button
            type="button"
            onClick={() => updateWorkoutDay(day.id, { kind: "recovery" })}
            className={`h-12 rounded-2xl text-sm font-medium ${day.kind === "recovery" ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted"}`}
          >
            คูลดาวน์ / โฟมโรล
          </button>
        </div>
      </div>

      <div className="mt-6 mb-3 flex items-center justify-between">
        <h2 className="font-semibold">ท่าในวันนี้</h2>
        <Button size="md" onClick={() => setPickerOpen(true)}>
          <Plus className="size-4" />
          เพิ่มท่า
        </Button>
      </div>

      {day.exercises.length === 0 ? (
        <EmptyState title="ยังไม่มีท่า" hint="เลือกท่าจากคลัง แล้วตั้งเป้า sets / reps / น้ำหนัก" />
      ) : (
        <ul className="space-y-3">
          {day.exercises.map((plan, index) => {
            const ex = exerciseMap.get(plan.exerciseId);
            return (
              <li key={`${plan.exerciseId}-${index}`}>
                <Card>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{ex?.name ?? "ท่าที่ถูกลบ"}</p>
                      <p className="text-xs text-muted">{ex ? label(ex.muscleGroup) : ""}</p>
                    </div>
                    <div className="flex gap-1">
                      <IconBtn label="ขึ้น" onClick={() => move(index, -1)}>
                        <ArrowUp className="size-4" />
                      </IconBtn>
                      <IconBtn label="ลง" onClick={() => move(index, 1)}>
                        <ArrowDown className="size-4" />
                      </IconBtn>
                      <IconBtn label="ลบ" onClick={() => removeAt(index)}>
                        <Trash2 className="size-4 text-danger" />
                      </IconBtn>
                    </div>
                  </div>
                  <div className={`grid gap-2 ${(ex && isDuration(ex.muscleGroup)) || day.kind === "recovery" ? "grid-cols-2" : "grid-cols-3"}`}>
                    <MiniNumber
                      label="Sets"
                      value={plan.targetSets}
                      min={1}
                      onChange={(value) => updatePlan(index, { targetSets: value })}
                    />
                    <MiniNumber
                      label={(ex && isDuration(ex.muscleGroup)) || day.kind === "recovery" ? "วินาที" : "Reps"}
                      value={plan.targetReps}
                      min={1}
                      step={(ex && isDuration(ex.muscleGroup)) || day.kind === "recovery" ? 15 : 1}
                      onChange={(value) => updatePlan(index, { targetReps: value })}
                    />
                    {(ex && isDuration(ex.muscleGroup)) || day.kind === "recovery" ? null : (
                      <MiniNumber
                        label={unit.toUpperCase()}
                        value={toDisplay(plan.targetWeight ?? 0, unit)}
                        min={0}
                        step={weightStep(unit)}
                        onChange={(value) =>
                          updatePlan(index, { targetWeight: fromDisplay(value, unit) })
                        }
                      />
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Button
        className="mt-6 w-full"
        size="xl"
        disabled={currentDay.exercises.length === 0}
        onClick={async () => {
          const id = await startWorkout({ workoutDay: currentDay });
          setActiveLogId(id);
          router.push("/log");
        }}
      >
        เริ่มล็อกวันนี้
      </Button>

      <ExercisePicker
        open={pickerOpen}
        exercises={exercises}
        excludeIds={day.exercises.map((p) => p.exerciseId)}
        onClose={() => setPickerOpen(false)}
        onPick={(ex) =>
          addExerciseToDay(day, {
            exerciseId: ex.id,
            targetSets: isDuration(ex.muscleGroup) || day.kind === "recovery" ? 1 : 3,
            targetReps: isDuration(ex.muscleGroup) || day.kind === "recovery" ? 60 : 8,
            targetWeight: 0,
          })
        }
      />

      <ConfirmDialog
        open={confirmDelete}
        title="ลบวันนี้?"
        message="ประวัติที่เคยล็อกด้วยวันนี้จะยังอยู่"
        confirmLabel="ลบ"
        danger
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteWorkoutDay(day.id);
          router.push("/plans");
        }}
      />
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-xl bg-surface-2"
    >
      {children}
    </button>
  );
}

function MiniNumber({
  label,
  value,
  min,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  const shown = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return (
    <div className="rounded-xl bg-surface-2 p-2 text-center">
      <p className="text-[11px] text-muted">{label}</p>
      <div className="mt-1 flex items-center justify-center gap-1">
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-lg bg-surface text-lg"
          onClick={() => onChange(Math.max(min, Math.round((value - step) * 10) / 10))}
        >
          −
        </button>
        <span className="min-w-10 tabular text-sm font-semibold">{shown}</span>
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-lg bg-surface text-lg"
          onClick={() => onChange(Math.round((value + step) * 10) / 10)}
        >
          +
        </button>
      </div>
    </div>
  );
}
