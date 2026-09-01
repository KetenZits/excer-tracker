"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { ExercisePicker } from "@/components/exercises/exercise-picker";
import { SetRow } from "@/components/log/set-row";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/modal";
import { db } from "@/lib/db";
import { emptySets, finishWorkout, saveLog, startWorkout } from "@/lib/queries";
import { lastPerformance, logVolume } from "@/lib/stats";
import { type Exercise } from "@/lib/types";
import { formatWeight } from "@/lib/units";
import { useMuscleGroups } from "@/hooks/use-muscle-groups";
import { useSession } from "@/store/session";
import { useSettings } from "@/store/settings";

const EMPTY_EXERCISES: Exercise[] = [];

export function LogWorkout() {
  const router = useRouter();
  const unit = useSettings((s) => s.unit);
  const { label, isDuration } = useMuscleGroups();
  const activeLogId = useSession((s) => s.activeLogId);
  const setActiveLogId = useSession((s) => s.setActiveLogId);

  const days = useLiveQuery(() => db.workoutDays.orderBy("createdAt").toArray()) ?? [];
  const exercises = useLiveQuery(() => db.exercises.toArray()) ?? EMPTY_EXERCISES;
  const logs = useLiveQuery(() => db.logs.toArray()) ?? [];
  const active = useLiveQuery(
    () => (activeLogId ? db.logs.get(activeLogId) : undefined),
    [activeLogId],
  );

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerGroup, setPickerGroup] = useState("all");
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const exerciseMap = useMemo(() => new Map(exercises.map((ex) => [ex.id, ex])), [exercises]);
  const inProgress = active?.status === "in-progress" ? active : undefined;

  async function begin(dayId?: string, kind?: "training" | "recovery") {
    const day = dayId ? days.find((item) => item.id === dayId) : null;
    const id = await startWorkout({ workoutDay: day, kind: kind ?? day?.kind });
    setActiveLogId(id);
  }

  if (inProgress) {
    const doneSets = inProgress.entries.reduce(
      (sum, entry) => sum + entry.sets.filter((s) => s.completed).length,
      0,
    );
    const totalSets = inProgress.entries.reduce((sum, entry) => sum + entry.sets.length, 0);
    const volume = logVolume(inProgress);

    return (
      <div>
        <PageHeader
          title={inProgress.title}
          subtitle={`${doneSets}/${totalSets} เซต · ${formatWeight(volume, unit)} volume`}
        />

        {inProgress.entries.length === 0 ? (
          <EmptyState
            title="ยังไม่มีท่าในเซสชันนี้"
            hint="เพิ่มท่าจากคลัง แล้วล็อกเซตได้เลย"
            action={<Button onClick={() => {
              setPickerGroup("all");
              setPickerOpen(true);
            }}>เพิ่มท่า</Button>}
          />
        ) : (
          <ul className="space-y-5">
            {inProgress.entries.map((entry, entryIndex) => {
              const ex = exerciseMap.get(entry.exerciseId);
              const plan = days
                .find((d) => d.id === inProgress.workoutDayId)
                ?.exercises.find((p) => p.exerciseId === entry.exerciseId);
              return (
                <li key={`${entry.exerciseId}-${entryIndex}`}>
                  <Card>
                    <div className="mb-3">
                      <p className="text-lg font-semibold">{ex?.name ?? "ท่าที่ถูกลบ"}</p>
                      <p className="text-xs text-muted">
                        {ex ? label(ex.muscleGroup) : ""}
                        {ex?.notes ? ` · ${ex.notes}` : ""}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {entry.sets.map((set, setIndex) => (
                        <SetRow
                          key={setIndex}
                          index={setIndex}
                          set={set}
                          unit={unit}
                          targetLabel={
                            plan
                              ? `${plan.targetSets}×${plan.targetReps}${
                                  plan.targetWeight ? ` @ ${formatWeight(plan.targetWeight, unit)}` : ""
                                }`
                              : undefined
                          }
                          durationMode={ex ? isDuration(ex.muscleGroup) : false}
                          onChange={async (nextSet) => {
                            const entries = inProgress.entries.map((item, i) =>
                              i === entryIndex
                                ? { ...item, sets: item.sets.map((s, si) => (si === setIndex ? nextSet : s)) }
                                : item,
                            );
                            await saveLog(inProgress.id, { entries });
                          }}
                          onRemove={async () => {
                            const nextSets = entry.sets.filter((_, i) => i !== setIndex);
                            const entries = inProgress.entries.map((item, i) =>
                              i === entryIndex ? { ...item, sets: nextSets.length ? nextSets : emptySets(1, 8, 0) } : item,
                            );
                            await saveLog(inProgress.id, { entries });
                          }}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-sm font-medium text-muted"
                      onClick={async () => {
                        const last = entry.sets.at(-1);
                        const entries = inProgress.entries.map((item, i) =>
                          i === entryIndex
                            ? {
                                ...item,
                                sets: [
                                  ...item.sets,
                                  { reps: last?.reps ?? 8, weight: last?.weight ?? 0, completed: false },
                                ],
                              }
                            : item,
                        );
                        await saveLog(inProgress.id, { entries });
                      }}
                    >
                      <Plus className="size-4" />
                      เพิ่มเซต
                    </button>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}

        <Button className="mt-4 w-full" variant="outline" onClick={() => {
          setPickerGroup("all");
          setPickerOpen(true);
        }}>
          <Plus className="size-4" />
          เพิ่มท่า
        </Button>
        {inProgress.kind !== "recovery" ? (
          <Button
            className="mt-2 w-full"
            variant="secondary"
            onClick={() => {
              setPickerGroup("recovery");
              setPickerOpen(true);
            }}
          >
            <Plus className="size-4" />
            เพิ่มคูลดาวน์ / โฟมโรล
          </Button>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" size="xl" onClick={() => setConfirmDiscard(true)}>
            ทิ้ง
          </Button>
          <Button size="xl" onClick={() => setConfirmFinish(true)} disabled={doneSets === 0}>
            เสร็จสิ้น
          </Button>
        </div>

        <ExercisePicker
          key={`${pickerGroup}-${pickerOpen ? "open" : "closed"}`}
          open={pickerOpen}
          exercises={exercises}
          excludeIds={inProgress.entries.map((e) => e.exerciseId)}
          initialGroup={pickerGroup}
          title={pickerGroup === "recovery" ? "เพิ่มคูลดาวน์" : "เลือกท่า"}
          onClose={() => setPickerOpen(false)}
          onPick={async (ex) => {
            const last = lastPerformance(logs, ex.id);
            const recovery = isDuration(ex.muscleGroup);
            const entries = [
              ...inProgress.entries,
              {
                exerciseId: ex.id,
                sets: emptySets(
                  recovery ? 1 : 3,
                  last?.reps ?? (recovery ? 60 : 8),
                  recovery ? 0 : (last?.weight ?? 0),
                ),
              },
            ];
            await saveLog(inProgress.id, { entries });
          }}
        />

        <ConfirmDialog
          open={confirmFinish}
          title="จบเซสชันนี้?"
          message="เซตที่ติ๊กแล้วจะถูกบันทึกลงประวัติ"
          confirmLabel="บันทึก"
          onClose={() => setConfirmFinish(false)}
          onConfirm={async () => {
            await finishWorkout(inProgress.id);
            setActiveLogId(null);
            router.push(`/history/${inProgress.id}`);
          }}
        />
        <ConfirmDialog
          open={confirmDiscard}
          title="ทิ้งเซสชันนี้?"
          message="ข้อมูลที่ล็อกไว้จะถูกลบ และกู้คืนไม่ได้"
          confirmLabel="ทิ้ง"
          danger
          onClose={() => setConfirmDiscard(false)}
          onConfirm={async () => {
            await db.logs.delete(inProgress.id);
            setActiveLogId(null);
          }}
        />
      </div>
    );
  }

  const trainingDays = days.filter((day) => day.kind !== "recovery");
  const recoveryDays = days.filter((day) => day.kind === "recovery");

  return (
    <div>
      <PageHeader title="ล็อกวันนี้" subtitle="เลือกวันฝึก คูลดาวน์ หรือเริ่มแบบอิสระ" />

      <button type="button" onClick={() => begin(undefined, "training")} className="mb-3 w-full text-left">
        <Card className="flex items-center gap-3 border-accent/40 p-4">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-fg">
            <Sparkles className="size-5" />
          </span>
          <span>
            <span className="block font-semibold">เริ่มแบบอิสระ</span>
            <span className="text-sm text-muted">ไม่ยึดแผน เลือกท่าไปเรื่อย ๆ</span>
          </span>
        </Card>
      </button>

      <button type="button" onClick={() => begin(recoveryDays[0]?.id, "recovery")} className="mb-4 w-full text-left">
        <Card className="flex items-center gap-3 p-4">
          <span className="block">
            <span className="block font-semibold">โฟมโรล / คูลดาวน์</span>
            <span className="text-sm text-muted">หลังเล่นเสร็จ หรือวันพัก — ไม่ตัด streak</span>
          </span>
        </Card>
      </button>

      {trainingDays.length === 0 ? (
        <EmptyState
          title="ยังไม่มีแผนฝึก"
          hint="สร้างวันฝึกก่อน จะได้เริ่มล็อกได้เร็วขึ้น"
          action={
            <Link href="/plans">
              <Button>ไปสร้างแผน</Button>
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {trainingDays.map((day) => (
            <li key={day.id}>
              <button type="button" onClick={() => begin(day.id)} className="w-full text-left">
                <Card className="p-4 transition hover:border-accent">
                  <p className="text-lg font-semibold">{day.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {day.exercises.length} ท่า · กดเพื่อเริ่ม และติ๊กเซตทีละเซต
                  </p>
                </Card>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
