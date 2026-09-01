"use client";

import { useEffect, type ReactNode } from "react";
import { db } from "@/lib/db";
import { seedIfNeeded } from "@/lib/seed";
import { useSession } from "@/store/session";
import { useSettings } from "@/store/settings";

function applyTheme(theme: "dark" | "light") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.classList.toggle("light", theme === "light");
}

export function Providers({ children }: { children: ReactNode }) {
  const theme = useSettings((s) => s.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    async function boot() {
      await seedIfNeeded();
      const { activeLogId, setActiveLogId } = useSession.getState();
      if (activeLogId) {
        const current = await db.logs.get(activeLogId);
        if (!current || current.status !== "in-progress") {
          setActiveLogId(null);
        }
        return;
      }
      const open = await db.logs.where("status").equals("in-progress").toArray();
      open.sort((a, b) => b.createdAt - a.createdAt);
      if (open[0]) setActiveLogId(open[0].id);
    }
    void boot();
  }, []);

  return children;
}
