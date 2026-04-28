"use client";

import { useEffect, useState } from "react";
import type { LottoDraw } from "@/lib/types";
import {
  loadHistory,
  findNextDraw,
  type HistEntry,
  type PredictKind,
} from "@/lib/predictHistory";

const KINDS: PredictKind[] = ["back2", "front3", "back3"];
const KIND_LABEL: Record<PredictKind, string> = {
  back2:  "2 ตัวท้าย",
  front3: "3 ตัวหน้า",
  back3:  "3 ตัวหลัง",
};

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function formatThaiDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function actualsForKind(draw: LottoDraw, kind: PredictKind): string[] {
  if (kind === "back2")  return [draw.prizes.back2];
  if (kind === "front3") return [...draw.prizes.front3];
  return [...draw.prizes.back3];
}

interface Props {
  draws: LottoDraw[];
}

export default function PredictHistory({ draws }: Props) {
  const [history, setHistory] = useState<HistEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  if (history.length === 0) return null;

  return (
    <section className="space-y-3">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div>
          <div className="eyebrow">ย้อนหลัง</div>
          <h3 className="text-[16px] font-semibold tracking-tight2 text-ink group-hover:text-accent transition">
            ประวัติการทาย
            <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">
              {history.length} งวด
            </span>
          </h3>
        </div>
        <span className={`text-muted text-[12px] transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      {open && (
        <div className="space-y-2">
          {history.map((entry) => {
            const resultDraw = findNextDraw(draws, entry.latestDrawDate);
            const isExpanded = expanded === entry.latestDrawDate;
            const hasResult = !!resultDraw;

            // Count total hits across all kinds
            const totalHits = hasResult
              ? KINDS.reduce((acc, k) => {
                  const actuals = actualsForKind(resultDraw!, k);
                  return acc + entry.predictions[k].filter((p) => actuals.includes(p.number)).length;
                }, 0)
              : 0;

            return (
              <div key={entry.latestDrawDate} className="rounded-xl border border-line bg-surface overflow-hidden">
                {/* Entry header */}
                <button
                  type="button"
                  onClick={() => setExpanded(isExpanded ? null : entry.latestDrawDate)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-surface-2 transition"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-[12px] text-muted">ทายไว้ตอนงวด</p>
                      <p className="text-[14px] font-semibold text-ink">{formatThaiDate(entry.latestDrawDate)}</p>
                    </div>
                    {hasResult ? (
                      totalHits > 0 ? (
                        <span className="rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-success">
                          ถูก {totalHits} ชุด
                        </span>
                      ) : (
                        <span className="rounded-full bg-surface-3 px-2.5 py-1 text-[11px] font-medium text-muted">
                          ไม่ตรง
                        </span>
                      )
                    ) : (
                      <span className="rounded-full border border-dashed border-line-strong px-2.5 py-1 text-[11px] text-subtle">
                        รอผล
                      </span>
                    )}
                  </div>
                  <span className={`text-subtle text-[11px] transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-line-subtle px-4 py-3 space-y-3 bg-surface-2">
                    {hasResult && (
                      <p className="text-[11.5px] text-muted">
                        ผลจริงงวด <strong className="text-ink-2">{formatThaiDate(resultDraw!.date)}</strong>
                      </p>
                    )}
                    {KINDS.map((kind) => {
                      const preds = entry.predictions[kind];
                      const actuals = hasResult ? actualsForKind(resultDraw!, kind) : [];
                      return (
                        <div key={kind} className="space-y-1.5">
                          <p className="eyebrow">{KIND_LABEL[kind]}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {preds.map((p) => {
                              const isHit = hasResult && actuals.includes(p.number);
                              const isMiss = hasResult && !isHit;
                              return (
                                <span
                                  key={p.number}
                                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-[13px] font-semibold border transition ${
                                    isHit
                                      ? "bg-success-soft border-success text-success"
                                      : isMiss
                                      ? "bg-surface border-line-strong text-muted line-through"
                                      : "bg-surface border-line text-ink"
                                  }`}
                                >
                                  {p.number}
                                  {isHit && <span className="text-[10px]">✓</span>}
                                </span>
                              );
                            })}
                            {hasResult && (
                              <span className="inline-flex items-center gap-1 rounded-lg border border-dashed border-accent px-2.5 py-1 font-mono text-[13px] font-semibold text-accent-text bg-accent-soft">
                                {actuals.join(" · ")}
                                <span className="text-[9px] font-normal text-muted ml-1">ออกจริง</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
