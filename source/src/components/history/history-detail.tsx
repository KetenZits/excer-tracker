"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { Check, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/modal";
import { db } from "@/lib/db";
import { deleteLog } from "@/lib/queries";
import { logVolume } from "@/lib/stats";
import { formatWeight } from "@/lib/units";
import { cn } from "@/lib/cn";
import { useMuscleGroups } from "@/hooks/use-muscle-groups";
import { useSettings } from "@/store/settings";

export function HistoryDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const unit = useSettings((s) => s.unit);
  const { label } = useMuscleGroups();
  const log = useLiveQuery(() => db.logs.get(params.id), [params.id]);
  const exercises = useLiveQuery(() => db.exercises.toArray()) ?? [];
  const [confirm, setConfirm] = useState(false);
  const exerciseMap = new Map(exercises.map((ex) => [ex.id, ex]));

  if (log === undefined) return <p className="text-sm text-muted">กำลังโหลด...</p>;
  if (!log) {
    return (
      <EmptyState
        title="ไม่พบเซสชันนี้"
        action={
          <Link href="/history">
            <Button variant="secondary">กลับประวัติ</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={log.title}
        subtitle={format(parseISO(log.date), "EEEE d MMMM yyyy", { locale: th })}
        action={
          <Button variant="danger" onClick={() => setConfirm(true)}>
            <Trash2 className="size-4" />
            ลบ
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted">Volume</p>
          <p className="text-lg font-semibold tabular">{formatWeight(logVolume(log), unit)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted">เซตที่เสร็จ</p>
          <p className="text-lg font-semibold tabular">
            {log.entries.reduce((s, e) => s + e.sets.filter((set) => set.completed).length, 0)}
          </p>
        </Card>
      </div>

      <ul className="space-y-3">
        {log.entries.map((entry, i) => {
          const ex = exerciseMap.get(entry.exerciseId);
          return (
            <li key={`${entry.exerciseId}-${i}`}>
              <Card>
                <p className="font-semibold">{ex?.name ?? "ท่าที่ถูกลบ"}</p>
                <p className="mb-3 text-xs text-muted">{ex ? label(ex.muscleGroup) : ""}</p>
                <div className="space-y-1.5">
                  {entry.sets.map((set, si) => (
                    <div
                      key={si}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-sm",
                        set.completed ? "bg-accent/10" : "bg-surface-2 text-muted",
                      )}
                    >
                      <span className="text-muted">เซต {si + 1}</span>
                      <span className="tabular font-medium">
                        {formatWeight(set.weight, unit)} × {set.reps}
                      </span>
                      {set.completed ? <Check className="size-4 text-accent" /> : <span className="w-4" />}
                    </div>
                  ))}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={confirm}
        title="ลบเซสชันนี้?"
        message="กู้คืนไม่ได้ ถ้ายังไม่ได้ export"
        confirmLabel="ลบ"
        danger
        onClose={() => setConfirm(false)}
        onConfirm={async () => {
          await deleteLog(log.id);
          router.push("/history");
        }}
      />
    </div>
  );
}
