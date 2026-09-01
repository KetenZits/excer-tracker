"use client";

import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Download, Moon, Sun, Upload } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { db } from "@/lib/db";
import { exportAll, importAll, parseExport } from "@/lib/queries";
import { seedIfNeeded } from "@/lib/seed";
import { WeekdayPicker } from "@/components/settings/weekday-picker";
import { useSettings } from "@/store/settings";
import { useSession } from "@/store/session";

export function SettingsPage() {
  const unit = useSettings((s) => s.unit);
  const theme = useSettings((s) => s.theme);
  const trainingWeekdays = useSettings((s) => s.trainingWeekdays);
  const setUnit = useSettings((s) => s.setUnit);
  const setTheme = useSettings((s) => s.setTheme);
  const toggleTrainingWeekday = useSettings((s) => s.toggleTrainingWeekday);
  const setActiveLogId = useSession((s) => s.setActiveLogId);
  const counts = useLiveQuery(async () => ({
    exercises: await db.exercises.count(),
    days: await db.workoutDays.count(),
    logs: await db.logs.count(),
  }));
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<ExportDraft | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  async function handleExport() {
    const payload = await exportAll();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workout-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("ส่งออกไฟล์สำรองแล้ว");
    setError(null);
  }

  async function applyImport(mode: "replace" | "merge") {
    if (!pendingFile) return;
    await importAll(pendingFile, mode);
    if (mode === "replace") setActiveLogId(null);
    setPendingFile(null);
    setMessage(mode === "replace" ? "นำเข้าและแทนที่ข้อมูลแล้ว" : "นำเข้าและรวมข้อมูลแล้ว");
    setError(null);
  }

  return (
    <div className="space-y-4">
      <PageHeader title="ตั้งค่า" subtitle="ตารางฝึก, หน่วย, ธีม และสำรองข้อมูลในเครื่อง" />

      <Card>
        <h2 className="mb-3 font-semibold">หน่วยน้ำหนัก</h2>
        <div className="grid grid-cols-2 gap-2">
          <Toggle active={unit === "kg"} onClick={() => setUnit("kg")}>
            กิโลกรัม (kg)
          </Toggle>
          <Toggle active={unit === "lb"} onClick={() => setUnit("lb")}>
            ปอนด์ (lb)
          </Toggle>
        </div>
        <p className="mt-2 text-xs text-muted">เก็บในฐานข้อมูลเป็น kg เสมอ แล้วแปลงตอนแสดงผล</p>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">ธีม</h2>
        <div className="grid grid-cols-2 gap-2">
          <Toggle active={theme === "dark"} onClick={() => setTheme("dark")}>
            <Moon className="size-4" />
            มืด
          </Toggle>
          <Toggle active={theme === "light"} onClick={() => setTheme("light")}>
            <Sun className="size-4" />
            สว่าง
          </Toggle>
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold">วันฝึกในสัปดาห์</h2>
        <p className="mb-3 text-sm text-muted">
          เลือกวันที่ตั้งใจเล่น เช่น จันทร์ พุธ ศุกร์ — วันพักไม่ตัด streak พอเล่นครบวันที่เลือก streak จะบวกต่อ
        </p>
        <WeekdayPicker value={trainingWeekdays} onToggle={toggleTrainingWeekday} />
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold">สำรองข้อมูล</h2>
        <p className="mb-3 text-sm text-muted">
          ข้อมูลอยู่ใน IndexedDB ของเบราว์เซอร์นี้เท่านั้น ถ้าล้าง cache แล้วไม่ได้ export ข้อมูลจะหาย
        </p>
        <p className="mb-4 text-xs text-muted">
          ตอนนี้มี {counts?.exercises ?? "—"} ท่า · {counts?.days ?? "—"} วันฝึก · {counts?.logs ?? "—"} เซสชัน
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button onClick={handleExport}>
            <Download className="size-4" />
            Export JSON
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" />
            Import JSON
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              const raw = JSON.parse(await file.text());
              const payload = parseExport(raw);
              setPendingFile(payload);
              setError(null);
            } catch (err) {
              setError(err instanceof Error ? err.message : "อ่านไฟล์ไม่สำเร็จ");
            }
          }}
        />
        {message ? <p className="mt-3 text-sm text-accent">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">คลังท่า</h2>
        <Link href="/exercises">
          <Button variant="secondary" className="w-full">
            เปิดคลังท่าฝึก
          </Button>
        </Link>
      </Card>

      <Card className="border-danger/40">
        <h2 className="mb-2 font-semibold">ล้างข้อมูลทั้งหมด</h2>
        <p className="mb-3 text-sm text-muted">ลบท่า, แผน และประวัติในเบราว์เซอร์นี้</p>
        <Button variant="danger" onClick={() => setConfirmClear(true)}>
          ล้าง IndexedDB
        </Button>
      </Card>

      <Modal
        open={pendingFile !== null}
        title="นำเข้าข้อมูล?"
        onClose={() => setPendingFile(null)}
      >
        <p className="text-sm text-muted">
          พบ {pendingFile?.exercises.length ?? 0} ท่า · {pendingFile?.workoutDays.length ?? 0} วันฝึก ·{" "}
          {pendingFile?.logs.length ?? 0} เซสชัน
        </p>
        <p className="mt-2 text-sm text-muted">แทนที่ = ลบของเดิม · รวม = เขียนทับรายการที่ id ซ้ำ</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="danger" onClick={() => applyImport("replace")}>
            แทนที่ทั้งหมด
          </Button>
          <Button onClick={() => applyImport("merge")}>รวมข้อมูล</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmClear}
        title="ล้างข้อมูลทั้งหมด?"
        message="กู้คืนไม่ได้ถ้ายังไม่ได้ export"
        confirmLabel="ล้างเลย"
        danger
        onClose={() => setConfirmClear(false)}
        onConfirm={async () => {
          await db.transaction("rw", db.exercises, db.workoutDays, db.logs, db.muscleGroups, db.meta, async () => {
            await Promise.all([
              db.exercises.clear(),
              db.workoutDays.clear(),
              db.logs.clear(),
              db.muscleGroups.clear(),
              db.meta.clear(),
            ]);
          });
          setActiveLogId(null);
          await seedIfNeeded();
          setConfirmClear(false);
          setMessage("ล้างแล้ว และโหลดท่าตั้งต้นใหม่");
        }}
      />
    </div>
  );
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-medium ${
        active ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted"
      }`}
    >
      {children}
    </button>
  );
}

type ExportDraft = Awaited<ReturnType<typeof exportAll>>;
