"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSettings } from "@/store/settings";
import { formatWeight } from "@/lib/units";
import type { MuscleShare, OverloadPoint, VolumePoint } from "@/lib/stats";

function useChartTheme() {
  const theme = useSettings((s) => s.theme);
  const dark = theme === "dark";
  return {
    tick: dark ? "#8b93a7" : "#667085",
    grid: dark ? "#2a3140" : "#d8dce3",
    tooltipBg: dark ? "#1c222c" : "#ffffff",
    tooltipBorder: dark ? "#2a3140" : "#d8dce3",
    accent: dark ? "#34d399" : "#059669",
    accent2: dark ? "#6ee7b7" : "#34d399",
  };
}

function ChartTooltipBox({
  label,
  rows,
}: {
  label?: string;
  rows: { name: string; value: string }[];
}) {
  const theme = useChartTheme();
  return (
    <div
      className="rounded-xl border px-3 py-2 text-xs shadow-lg"
      style={{ background: theme.tooltipBg, borderColor: theme.tooltipBorder }}
    >
      {label ? <p className="mb-1 font-medium">{label}</p> : null}
      {rows.map((row) => (
        <p key={row.name} className="text-muted">
          {row.name}: <span className="text-foreground">{row.value}</span>
        </p>
      ))}
    </div>
  );
}

export function VolumeChart({ data }: { data: VolumePoint[] }) {
  const theme = useChartTheme();
  const unit = useSettings((s) => s.unit);
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke={theme.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: theme.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: theme.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.[0]) return null;
              const point = payload[0].payload as VolumePoint;
              return (
                <ChartTooltipBox
                  label={String(label)}
                  rows={[
                    { name: "Volume", value: formatWeight(point.volume, unit) },
                    { name: "เซสชัน", value: String(point.sessions) },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="volume" fill={theme.accent} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MuscleChart({ data }: { data: MuscleShare[] }) {
  const unit = useSettings((s) => s.unit);
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">ยังไม่มีข้อมูลในช่วงนี้</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-[200px_1fr] sm:items-center">
      <div className="mx-auto h-48 w-48">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="volume" nameKey="label" innerRadius={48} outerRadius={80} paddingAngle={2}>
              {data.map((row) => (
                <Cell key={row.id} fill={row.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const row = payload[0].payload as MuscleShare;
                return (
                  <ChartTooltipBox
                    rows={[{ name: row.label, value: formatWeight(row.volume, unit) }]}
                  />
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2">
        {data.map((row) => {
          const total = data.reduce((s, r) => s + r.volume, 0) || 1;
          const pct = Math.round((row.volume / total) * 100);
          return (
            <li key={row.id} className="flex items-center gap-2 text-sm">
              <span className="size-2.5 rounded-full" style={{ background: row.color }} />
              <span className="flex-1">{row.label}</span>
              <span className="tabular text-muted">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function OverloadChart({ data }: { data: OverloadPoint[] }) {
  const theme = useChartTheme();
  const unit = useSettings((s) => s.unit);
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">ยังไม่เคยล็อกท่านี้</p>;
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke={theme.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: theme.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: theme.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.[0]) return null;
              const point = payload[0].payload as OverloadPoint;
              return (
                <ChartTooltipBox
                  label={String(label)}
                  rows={[
                    { name: "น้ำหนักสูงสุด", value: formatWeight(point.maxWeight, unit) },
                    { name: "e1RM", value: formatWeight(point.estimated1rm, unit) },
                  ]}
                />
              );
            }}
          />
          <Line type="monotone" dataKey="maxWeight" stroke={theme.accent} strokeWidth={2.4} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="estimated1rm" stroke={theme.accent2} strokeWidth={1.6} strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
