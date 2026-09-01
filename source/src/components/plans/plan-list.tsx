"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronRight, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { createWorkoutDay } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { useMuscleGroups } from "@/hooks/use-muscle-groups";

export function PlanList() {
  const router = useRouter();
  const days = useLiveQuery(() => db.workoutDays.orderBy("createdAt").toArray()) ?? [];
  const exercises = useLiveQuery(() => db.exercises.toArray()) ?? [];
  const exerciseMap = new Map(exercises.map((ex) => [ex.id, ex]));
  const { label } = useMuscleGroups();

  async function addDay() {
    const id = await createWorkoutDay();
    router.push(`/plans/${id}`);
  }

  return (
    <div>
      <PageHeader
        title="แผนฝึก"
        subtitle="สร้างวันออกกำลังกายเอง เช่น Push / Pull / Leg"
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                const id = await createWorkoutDay("โฟมโรล / คูลดาวน์", "recovery");
                router.push(`/plans/${id}`);
              }}
            >
              คูลดาวน์
            </Button>
            <Button
              onClick={async () => {
                const id = await createWorkoutDay();
                router.push(`/plans/${id}`);
              }}
            >
              <Plus className="size-4" />
              สร้างวัน
            </Button>
          </div>
        }
      />

      {days.length === 0 ? (
        <EmptyState
          title="ยังไม่มีวันฝึก"
          hint="สร้างวันแรก แล้วเลือกท่าพร้อมเป้า sets / reps / น้ำหนัก"
          action={<Button onClick={addDay}>สร้างวันฝึก</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {days.map((day) => (
            <li key={day.id}>
              <Link href={`/plans/${day.id}`}>
                <Card className="flex items-center justify-between gap-3 p-4 transition hover:border-accent">
                  <div>
                    <p className="text-lg font-semibold">{day.name}</p>
                    {day.kind === "recovery" ? (
                      <p className="mt-1 text-xs font-medium text-accent">คูลดาวน์ / โฟมโรล</p>
                    ) : null}
                    <p className="mt-1 text-sm text-muted">
                      {day.exercises.length === 0
                        ? "ยังไม่มีท่า"
                        : day.exercises
                            .map((plan) => exerciseMap.get(plan.exerciseId)?.name ?? "ท่าที่ถูกลบ")
                            .join(" · ")}
                    </p>
                    {day.exercises.length > 0 ? (
                      <p className="mt-2 text-xs text-muted">
                        {[...new Set(day.exercises.map((p) => exerciseMap.get(p.exerciseId)?.muscleGroup).filter(Boolean))]
                          .map((id) => label(id as string))
                          .join(" / ")}
                      </p>
                    ) : null}
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted" />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
