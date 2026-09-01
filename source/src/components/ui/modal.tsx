"use client";

import { cn } from "@/lib/cn";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function Modal({
  open,
  title,
  children,
  onClose,
  wide,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="ปิด"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border border-border bg-surface p-5 shadow-2xl sm:rounded-3xl",
          wide ? "sm:max-w-lg" : "sm:max-w-md",
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-muted"
            aria-label="ปิด"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "ยืนยัน",
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm text-muted">{message}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-2xl bg-surface-2 font-medium"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={cn(
            "h-12 rounded-2xl font-medium",
            danger ? "bg-danger text-white" : "bg-accent text-accent-fg",
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
