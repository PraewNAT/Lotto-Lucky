"use client";

import { useEffect, useRef, useState } from "react";
import { SCIENCE_LABEL } from "@/lib/types";
import {
  loadLogs,
  clearLogs,
  deleteLog,
  updateLogResult,
  type PredictionLogEntry,
  type PredictionResult,
} from "@/lib/predictionLog";

interface Props {
  refreshKey?: number;
}

function formatDate(iso: string): string {
  const months = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const months = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543} • ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function chunk(num: string) {
  return num.replace(/(\d{2})(\d{2})(\d{2})/, "$1 $2 $3");
}

async function fetchResult(targetDate: string): Promise<PredictionResult | null> {
  try {
    const r = await fetch("/api/lotto?mode=history&limit=60", { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    const draws: { date: string; prizes: { back2: string; back3: string[]; first: string } }[] =
      j.draws ?? [];
    const draw = draws.find((d) => d.date.slice(0, 10) === targetDate.slice(0, 10));
    if (!draw) return null;
    return {
      checkedAt: Date.now(),
      drawDate: draw.date,
      actualBack2: draw.prizes.back2,
      actualBack3: draw.prizes.back3,
      actualFirst: draw.prizes.first,
      hits: [],
    };
  } catch {
    return null;
  }
}

function computeHits(
  entry: PredictionLogEntry,
  res: Omit<PredictionResult, "hits">
): PredictionResult {
  const hits: PredictionResult["hits"] = [];
  entry.sets.forEach((s, i) => {
    if (s.back2 === res.actualBack2) hits.push({ type: "back2", number: s.back2, setIndex: i });
    if (res.actualBack3.includes(s.back3)) hits.push({ type: "back3", number: s.back3, setIndex: i });
    if (s.number === res.actualFirst) hits.push({ type: "first", number: s.number, setIndex: i });
  });
  return { ...res, hits };
}

function HitBadge({ type }: { type: "back2" | "back3" | "first" }) {
  const cfg = {
    back2: { label: "ถูก 2 ตัว", cls: "bg-success-soft text-success" },
    back3: { label: "ถูก 3 ตัว", cls: "bg-success-soft text-success" },
    first: { label: "ถูกรางวัลที่ 1!", cls: "bg-accent text-white" },
  }[type];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function ResultBadge({ result, targetDate }: { result: PredictionResult | null | undefined; targetDate?: string }) {
  if (!targetDate) return null;
  const isInFuture = new Date(targetDate).getTime() > Date.now();
  if (isInFuture) {
    return (
      <span className="text-[11px] text-muted">
        รอผลงวด {formatDate(targetDate)}
      </span>
    );
  }
  if (result === null || result === undefined) {
    return <span className="text-[11px] text-muted animate-pulse">กำลังตรวจผล…</span>;
  }
  if (result.hits.length === 0) {
    return <span className="text-[11px] text-muted">งวด {formatDate(result.drawDate)} — ไม่ถูก</span>;
  }
  return (
    <span className="text-[11px] text-muted">
      งวด {formatDate(result.drawDate)} •{" "}
      {result.hits.map((h, i) => <HitBadge key={i} type={h.type} />)}
    </span>
  );
}

export default function PredictionLog({ refreshKey }: Props) {
  const [logs, setLogs] = useState<PredictionLogEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const checkingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    setLogs(loadLogs());
  }, [refreshKey]);

  // ตรวจผลอัตโนมัติสำหรับ entry ที่ targetDate ผ่านไปแล้วแต่ยังไม่มี result
  useEffect(() => {
    if (!mounted || checkingRef.current) return;
    const pending = logs.filter(
      (e) => e.targetDate &&
        new Date(e.targetDate).getTime() <= Date.now() &&
        e.result === null
    );
    if (pending.length === 0) return;

    checkingRef.current = true;
    (async () => {
      let updated = loadLogs();
      for (const entry of pending) {
        const raw = await fetchResult(entry.targetDate!);
        if (!raw) continue;
        const result = computeHits(entry, raw);
        updated = updateLogResult(entry.id, result);

        // ส่ง aggregate ไป Supabase (fire-and-forget)
        const hitBack2 = result.hits.some((h) => h.type === "back2");
        const hitBack3 = result.hits.some((h) => h.type === "back3");
        fetch("/api/accuracy", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sciences: entry.sciences, hitBack2, hitBack3 }),
        }).catch(() => {});
      }
      setLogs(updated);
      checkingRef.current = false;
    })();
  }, [mounted, logs]);

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
              </div>
              <button
                onClick={() => setLogs(deleteLog(log.id))}
                className="text-[11px] text-subtle hover:text-warning"
                aria-label="ลบรายการนี้"
              >
                ลบ
              </button>
            </div>

            {/* ผลตรวจ */}
            <ResultBadge result={log.result} targetDate={log.targetDate} />

            <div className="flex flex-wrap gap-2">
              {log.sets.map((s, i) => {
                const setHits = log.result?.hits.filter((h) => h.setIndex === i) ?? [];
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                      setHits.length > 0 ? "bg-success-soft ring-1 ring-success/30" : "bg-surface-2"
                    }`}
                    title={s.highlight || ""}
                  >
                    <span className="num-sm font-mono">{chunk(s.number)}</span>
                    <span className="text-[10px] font-mono text-muted">{Math.round(s.score)}</span>
                    {s.highlight && <span className="text-[10px] text-accent-text">★</span>}
                    {setHits.map((h, hi) => (
                      <HitBadge key={hi} type={h.type} />
                    ))}
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
