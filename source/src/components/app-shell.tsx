"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarDays,
  Dumbbell,
  LayoutGrid,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/", label: "แดชบอร์ด", icon: LayoutGrid },
  { href: "/plans", label: "แผนฝึก", icon: Dumbbell },
  { href: "/log", label: "ล็อก", icon: Activity, primary: true },
  { href: "/history", label: "ประวัติ", icon: CalendarDays },
  { href: "/settings", label: "ตั้งค่า", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
        <Link href="/" className="mb-8 px-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Workout</p>
          <p className="text-xl font-semibold tracking-tight">Tracker</p>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-fg"
                    : "text-muted hover:bg-surface-2 hover:text-foreground",
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/exercises"
          className="rounded-xl px-3 py-3 text-sm text-muted hover:bg-surface-2 hover:text-foreground"
        >
          คลังท่าฝึก
        </Link>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">Workout</p>
            <p className="text-base font-semibold leading-tight">Tracker</p>
          </Link>
          <Link
            href="/exercises"
            className="rounded-full bg-surface px-3 py-2 text-xs font-medium text-muted"
          >
            คลังท่า
          </Link>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-5 pb-28 lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="grid grid-cols-5 items-end">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            if (item.primary) {
              return (
                <li key={item.href} className="flex justify-center">
                  <Link
                    href={item.href}
                    className={cn(
                      "-mt-5 flex size-16 flex-col items-center justify-center rounded-full border-4 border-background shadow-lg",
                      active ? "bg-accent text-accent-fg" : "bg-accent text-accent-fg",
                    )}
                    aria-label={item.label}
                  >
                    <Icon className="size-7" strokeWidth={2.4} />
                  </Link>
                </li>
              );
            }
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                    active ? "text-accent" : "text-muted",
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
