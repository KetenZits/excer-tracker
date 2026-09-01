"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { MUSCLE_GROUP_COLORS, type MuscleGroupDef } from "@/lib/types";

export function MuscleGroupForm({
  open,
  group,
  onClose,
  onSave,
}: {
  open: boolean;
  group: MuscleGroupDef | null;
  onClose: () => void;
  onSave: (values: { label: string; color: string; durationMode?: boolean }) => Promise<void>;
}) {
  return (
    <Modal open={open} title={group ? "แก้ไขกลุ่มกล้ามเนื้อ" : "เพิ่มกลุ่มกล้ามเนื้อ"} onClose={onClose}>
      {open ? (
        <MuscleGroupFields key={group?.id ?? "new"} group={group} onClose={onClose} onSave={onSave} />
      ) : null}
    </Modal>
  );
}

function MuscleGroupFields({
  group,
  onClose,
  onSave,
}: {
  group: MuscleGroupDef | null;
  onClose: () => void;
  onSave: (values: { label: string; color: string; durationMode?: boolean }) => Promise<void>;
}) {
  const [label, setLabel] = useState(group?.label ?? "");
  const [color, setColor] = useState(group?.color ?? MUSCLE_GROUP_COLORS[0]);
  const [durationMode, setDurationMode] = useState(Boolean(group?.durationMode));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!label.trim()) return;
        setSaving(true);
        setError(null);
        try {
          await onSave({ label, color, durationMode });
        } catch (err) {
          setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
        } finally {
          setSaving(false);
        }
      }}
    >
      <Field label="ชื่อกลุ่ม">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} required placeholder="เช่น Neck, Forearms" />
      </Field>
      <div>
        <p className="mb-1.5 text-sm font-medium text-muted">สี</p>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUP_COLORS.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={swatch}
              onClick={() => setColor(swatch)}
              className={`size-8 rounded-full ${color === swatch ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}`}
              style={{ background: swatch }}
            />
          ))}
        </div>
      </div>
      <label className="flex items-center gap-3 rounded-2xl bg-surface-2 px-3 py-3 text-sm">
        <input
          type="checkbox"
          checked={durationMode}
          onChange={(e) => setDurationMode(e.target.checked)}
          className="size-5 accent-emerald-500"
        />
        ล็อกเป็นวินาที (โฟมโรล / ยืด)
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button type="submit" disabled={saving}>
          {group ? "บันทึก" : "เพิ่มกลุ่ม"}
        </Button>
      </div>
    </form>
  );
}
