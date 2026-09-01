"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { th } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { db } from "@/lib/db";
import { logVolume } from "@/lib/stats";
import { formatWeight } from "@/lib/units";
import { cn } from "@/lib/cn";
import { useSettings } from "@/store/settings";

export function HistoryList() {
  const unit = useSettings((s) => s.unit);
  const logs = useLiveQuery(() => db.logs.orderBy("date").reverse().toArray()) ?? [];
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<string | null>(null);

  const completed = logs.filter((log) => log.status === "completed");
  const byDate = useMemo(() => {
    const map = new Map<string, typeof completed>();
    for (const log of completed) {
      const list = map.get(log.date) ?? [];
      list.push(log);
      map.set(log.date, list);
    }
    return map;
  }, [completed]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfMonth(cursor);
    const last = startOfWeek(end, { weekStartsOn: 1 });
    const gridEnd = new Date(last.getTime() + 6 * 86_400_000);
    return eachDayOfInterval({ start, end: gridEnd });
  }, [cursor]);

  const filtered = selected
    ? completed.filter((log) => log.date === selected)
    : completed.filter((log) => log.date.startsWith(format(cursor, "yyyy-MM")));

  return (
    <div>
      <PageHeader title="ประวัติ" subtitle="ดูวันที่เคยฝึกย้อนหลัง" />

      <Card className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-xl bg-surface-2"
            onClick={() => setCursor((d) => addMonths(d, -1))}
            aria-label="เดือนก่อน"
          >
            <ChevronLeft className="size-5" />
          </button>
          <p className="font-semibold">{format(cursor, "MMMM yyyy", { locale: th })}</p>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-xl bg-surface-2"
            onClick={() => setCursor((d) => addMonths(d, 1))}
            aria-label="เดือนถัดไป"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
          {["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"].map((d) => (
            <span key={d} className="py-1">
              {d}
            </span>
          ))}
          {monthDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const has = byDate.has(key);
            const inMonth = isSameMonth(day, cursor);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected((prev) => (prev === key ? null : key))}
                className={cn(
                  "flex h-10 flex-col items-center justify-center rounded-xl text-sm tabular",
                  !inMonth && "opacity-30",
                  selected === key && "ring-2 ring-accent",
                  has ? "bg-accent/20 font-semibold text-accent" : "hover:bg-surface-2",
                )}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
        {selected ? (
          <button type="button" className="mt-3 text-xs text-muted" onClick={() => setSelected(null)}>
            แสดงทั้งเดือน
          </button>
        ) : null}
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title="ยังไม่มีประวัติในช่วงนี้"
          hint="ล็อกเซสชันแล้วรายการจะมาโชว์ที่นี่"
          action={
            <Link href="/log">
              <Button>ไปล็อก</Button>
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((log) => (
            <li key={log.id}>
              <Link href={`/history/${log.id}`}>
                <Card className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{log.title}</p>
                    {log.kind === "recovery" ? (
                      <p className="text-xs text-accent">คูลดาวน์</p>
                    ) : null}
                    <p className="text-sm text-muted">
                      {format(parseISO(log.date), "EEEE d MMM yyyy", { locale: th })}
                    </p>
                  </div>
                  <p className="tabular text-sm text-muted">{formatWeight(logVolume(log), unit)}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
