"use client";

import { useMemo, useState } from "react";
import { type Exercise } from "@/lib/types";
import { Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useMuscleGroups } from "@/hooks/use-muscle-groups";

export function ExercisePicker({
  open,
  exercises,
  excludeIds,
  initialGroup = "all",
  title = "เลือกท่า",
  onClose,
  onPick,
}: {
  open: boolean;
  exercises: Exercise[];
  excludeIds?: string[];
  initialGroup?: string;
  title?: string;
  onClose: () => void;
  onPick: (exercise: Exercise) => void;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState(initialGroup);
  const excluded = useMemo(() => new Set(excludeIds ?? []), [excludeIds]);
  const { groups, label, color } = useMuscleGroups();

  const filtered = exercises.filter((ex) => {
    if (excluded.has(ex.id)) return false;
    if (group !== "all" && ex.muscleGroup !== group) return false;
    if (query && !ex.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <Modal
      open={open}
      title={title}
      onClose={() => {
        setQuery("");
        setGroup(initialGroup);
        onClose();
      }}
      wide
    >
      <Input
        autoFocus
        placeholder="ค้นหาท่า..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="chip-scroll mt-3 flex gap-2">
        <Chip active={group === "all"} onClick={() => setGroup("all")}>
          ทั้งหมด
        </Chip>
        {groups.map((item) => (
          <Chip key={item.id} active={group === item.id} onClick={() => setGroup(item.id)}>
            {item.label}
          </Chip>
        ))}
      </div>
      <ul className="mt-3 max-h-[50dvh] space-y-2 overflow-y-auto">
        {filtered.length === 0 ? (
          <li className="py-8 text-center text-sm text-muted">ไม่พบท่าที่ตรงกัน</li>
        ) : (
          filtered.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(ex);
                  onClose();
                  setQuery("");
                }}
                className="flex w-full items-center justify-between rounded-2xl bg-surface-2 px-4 py-3 text-left"
              >
                <span className="font-medium">{ex.name}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs"
                  style={{ background: `${color(ex.muscleGroup)}22`, color: color(ex.muscleGroup) }}
                >
                  {label(ex.muscleGroup)}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </Modal>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
        active ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted"
      }`}
    >
      {children}
    </button>
  );
}
