"use client";

import { useEffect, useState } from "react";
import { SCIENCE_LABEL } from "@/lib/types";
import {
  loadLogs,
  clearLogs,
  deleteLog,
  type PredictionLogEntry,
} from "@/lib/predictionLog";

interface Props {
  /** เพิ่มค่านี้เพื่อ trigger reload หลังบันทึก log ใหม่ */
  refreshKey?: number;
}

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const months = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear() + 543;
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${day} ${month} ${year} • ${hh}:${mm}`;
}

function chunk(num: string) {
  return num.replace(/(\d{2})(\d{2})(\d{2})/, "$1 $2 $3");
}

export default function PredictionLog({ refreshKey }: Props) {
  const [logs, setLogs] = useState<PredictionLogEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLogs(loadLogs());
  }, [refreshKey]);

  if (!mounted) return null;
  if (logs.length === 0) return null;

  const visible = open ? logs : logs.slice(0, 5);

  return (
    <section className="card space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <div className="eyebrow">ประวัติการสุ่ม</div>
          <p className="mt-0.5 text-[13px] text-muted">
            เก็บไว้ในเครื่องของคุณ {logs.length} รายการล่าสุด
          </p>
        </div>
        <div className="flex gap-2">
          {logs.length > 5 && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded-md border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-ink-2 hover:bg-surface-2"
            >
              {open ? "ย่อ" : `ดูทั้งหมด (${logs.length})`}
            </button>
          )}
          <button
            onClick={() => {
              if (confirm("ลบประวัติทั้งหมด?")) {
                clearLogs();
                setLogs([]);
              }
            }}
            className="rounded-md border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-muted hover:bg-surface-2 hover:text-warning"
          >
            ล้างทั้งหมด
          </button>
        </div>
      </header>

      <ul className="divide-y divide-line-subtle">
        {visible.map((log) => (
          <li key={log.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-mono text-subtle">
                  {formatDateTime(log.timestamp)}
                </span>
                {log.sciences.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-2"
                  >
                    {SCIENCE_LABEL[s]}
                  </span>
                ))}
                {log.refDate && (
                  <span className="text-[11px] text-muted">
                    อ้างอิงงวด {log.refDate}
                  </span>
                )}
              </div>
              <button
                onClick={() => setLogs(deleteLog(log.id))}
                className="text-[11px] text-subtle hover:text-warning"
                aria-label="ลบรายการนี้"
              >
                ลบ
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {log.sets.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2"
                  title={s.highlight || ""}
                >
                  <span className="num-sm font-mono">{chunk(s.number)}</span>
                  <span className="text-[10px] font-mono text-muted">
                    {Math.round(s.score)}
                  </span>
                  {s.highlight && (
                    <span className="text-[10px] text-accent-text">★</span>
                  )}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
