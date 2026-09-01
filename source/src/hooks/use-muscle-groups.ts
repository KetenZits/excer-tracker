"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  mergeMuscleGroups,
  resolveMuscleGroup,
  type MuscleGroupDef,
} from "@/lib/types";

const EMPTY: MuscleGroupDef[] = [];

export function useMuscleGroups() {
  const custom = useLiveQuery(() => db.muscleGroups.toArray()) ?? EMPTY;
  const groups = useMemo(() => mergeMuscleGroups(custom), [custom]);

  return {
    groups,
    custom,
    label: (id: string) => resolveMuscleGroup(id, custom).label,
    color: (id: string) => resolveMuscleGroup(id, custom).color,
    isDuration: (id: string) => Boolean(resolveMuscleGroup(id, custom).durationMode),
    isCustom: (id: string) => custom.some((g) => g.id === id),
  };
}
