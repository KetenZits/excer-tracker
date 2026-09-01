"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import {
  createExercise,
  createMuscleGroup,
  deleteExercise,
  deleteMuscleGroup,
  updateExercise,
  updateMuscleGroup,
} from "@/lib/queries";
import type { Exercise, MuscleGroupDef } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/modal";
import { useMuscleGroups } from "@/hooks/use-muscle-groups";
import { ExerciseForm } from "./exercise-form";
import { MuscleGroupForm } from "./muscle-group-form";

const EMPTY_EXERCISES: Exercise[] = [];

export function ExerciseLibrary() {
  const exercises = useLiveQuery(() => db.exercises.orderBy("name").toArray()) ?? EMPTY_EXERCISES;
  const { groups, custom, label, color, isCustom } = useMuscleGroups();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string>("all");
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Exercise | null>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MuscleGroupDef | null>(null);
  const [pendingGroupDelete, setPendingGroupDelete] = useState<MuscleGroupDef | null>(null);

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (group !== "all" && ex.muscleGroup !== group) return false;
      if (query && !ex.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [exercises, group, query]);

  return (
    <div>
      <PageHeader
        title="คลังท่าฝึก"
        subtitle="เพิ่มท่า และสร้างกลุ่มกล้ามเนื้อเองได้"
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            เพิ่มท่า
          </Button>
        }
      />

      <Input
        placeholder="ค้นหาชื่อท่า..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-3"
      />

      <div className="chip-scroll mb-2 flex gap-2">
        <button
          type="button"
          onClick={() => setGroup("all")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
            group === "all" ? "bg-accent text-accent-fg" : "bg-surface text-muted"
          }`}
        >
          ทั้งหมด
        </button>
        {groups.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setGroup(item.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
              group === item.id ? "bg-accent text-accent-fg" : "bg-surface text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCreatingGroup(true)}
          className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted"
        >
          <Plus className="size-3.5" />
          กลุ่มใหม่
        </button>
      </div>

      {isCustom(group) ? (
        <div className="mb-4 flex gap-2">
          <Button
            size="md"
            variant="secondary"
            onClick={() => setEditingGroup(custom.find((g) => g.id === group) ?? null)}
          >
            <Pencil className="size-4" />
            แก้กลุ่มนี้
          </Button>
          <Button size="md" variant="danger" onClick={() => setPendingGroupDelete(custom.find((g) => g.id === group) ?? null)}>
            <Trash2 className="size-4" />
            ลบกลุ่ม
          </Button>
        </div>
      ) : (
        <div className="mb-4" />
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title="ยังไม่มีท่าในคลัง"
          hint="เพิ่มท่าที่ใช้บ่อย เพื่อนำไปใส่ในแผนฝึกและล็อกได้เร็วขึ้น"
          action={<Button onClick={() => setCreating(true)}>เพิ่มท่าแรก</Button>}
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((ex) => (
            <li key={ex.id}>
              <Card className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="font-medium">{ex.name}</p>
                  <p
                    className="mt-1 inline-flex rounded-full px-2 py-0.5 text-xs"
                    style={{ background: `${color(ex.muscleGroup)}22`, color: color(ex.muscleGroup) }}
                  >
                    {label(ex.muscleGroup)}
                  </p>
                  {ex.notes ? <p className="mt-2 text-sm text-muted">{ex.notes}</p> : null}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    className="flex size-11 items-center justify-center rounded-xl bg-surface-2"
                    onClick={() => setEditing(ex)}
                    aria-label="แก้ไข"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="flex size-11 items-center justify-center rounded-xl bg-surface-2 text-danger"
                    onClick={() => setPendingDelete(ex)}
                    aria-label="ลบ"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ExerciseForm
        open={creating || editing !== null}
        exercise={editing}
        groups={groups}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSave={async (values) => {
          if (editing) {
            await updateExercise(editing.id, values);
          } else {
            await createExercise(values);
          }
          setCreating(false);
          setEditing(null);
        }}
      />

      <MuscleGroupForm
        open={creatingGroup || editingGroup !== null}
        group={editingGroup}
        onClose={() => {
          setCreatingGroup(false);
          setEditingGroup(null);
        }}
        onSave={async (values) => {
          if (editingGroup) {
            await updateMuscleGroup(editingGroup.id, values);
          } else {
            const id = await createMuscleGroup(values);
            setGroup(id);
          }
          setCreatingGroup(false);
          setEditingGroup(null);
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="ลบท่านี้?"
        message="ประวัติที่เคยล็อกไว้จะยังอยู่ แต่จะแสดงเป็นท่าที่ถูกลบ"
        confirmLabel="ลบ"
        danger
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete) await deleteExercise(pendingDelete.id);
          setPendingDelete(null);
        }}
      />

      <ConfirmDialog
        open={pendingGroupDelete !== null}
        title="ลบกลุ่มนี้?"
        message="ท่าที่อยู่ในกลุ่มนี้จะย้ายไป “ทั้งตัว”"
        confirmLabel="ลบกลุ่ม"
        danger
        onClose={() => setPendingGroupDelete(null)}
        onConfirm={async () => {
          if (pendingGroupDelete) {
            await deleteMuscleGroup(pendingGroupDelete.id);
            setGroup("all");
          }
          setPendingGroupDelete(null);
        }}
      />
    </div>
  );
}
