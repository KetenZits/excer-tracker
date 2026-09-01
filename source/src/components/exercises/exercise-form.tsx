"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { Exercise, MuscleGroupDef } from "@/lib/types";

export function ExerciseForm({
  open,
  exercise,
  groups,
  onClose,
  onSave,
}: {
  open: boolean;
  exercise: Exercise | null;
  groups: MuscleGroupDef[];
  onClose: () => void;
  onSave: (values: { name: string; muscleGroup: string; notes?: string }) => Promise<void>;
}) {
  return (
    <Modal open={open} title={exercise ? "แก้ไขท่า" : "เพิ่มท่าใหม่"} onClose={onClose}>
      {open ? (
        <ExerciseFormFields
          key={exercise?.id ?? "new"}
          exercise={exercise}
          groups={groups}
          onClose={onClose}
          onSave={onSave}
        />
      ) : null}
    </Modal>
  );
}

function ExerciseFormFields({
  exercise,
  groups,
  onClose,
  onSave,
}: {
  exercise: Exercise | null;
  groups: MuscleGroupDef[];
  onClose: () => void;
  onSave: (values: { name: string; muscleGroup: string; notes?: string }) => Promise<void>;
}) {
  const [name, setName] = useState(exercise?.name ?? "");
  const [muscleGroup, setMuscleGroup] = useState(exercise?.muscleGroup ?? groups[0]?.id ?? "chest");
  const [notes, setNotes] = useState(exercise?.notes ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        try {
          await onSave({ name, muscleGroup, notes });
        } finally {
          setSaving(false);
        }
      }}
    >
      <Field label="ชื่อท่า">
        <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="เช่น Bench Press" />
      </Field>
      <Field label="กลุ่มกล้ามเนื้อ">
        <Select value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)}>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="โน้ต / วิธีทำ">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ท่าย่อ, คิว, หรือวิธีทำ" />
      </Field>
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button type="submit" disabled={saving}>
          {exercise ? "บันทึก" : "เพิ่มท่า"}
        </Button>
      </div>
    </form>
  );
}
