"use client";

import type { NumberSet } from "@/lib/types";
import ScoreBar from "./ScoreBar";

interface Props {
  sets: NumberSet[];
  loadingReason?: boolean;
}

function chunk(num: string) {
  return num.replace(/(\d{2})(\d{2})(\d{2})/, "$1 $2 $3");
}

export default function NumberSets({ sets, loadingReason }: Props) {
  if (sets.length === 0) return null;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sets.map((s, i) => (
        <article key={i} className="card-interactive space-y-5">
          <header className="flex items-center justify-between">
            <span className="eyebrow">ชุดที่ {i + 1}</span>
            <span className="text-[11px] font-mono text-subtle">
              {Object.entries(s.breakdown)
                .map(([k, v]) => `${k}·${Math.round(v)}`)
                .join("  ")}
            </span>
          </header>

          <div className="rounded-lg border border-line bg-surface py-6 text-center">
            <div className="num-hero">{chunk(s.number)}</div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "3 ตัวหน้า", value: s.front3 },
              { label: "3 ตัวหลัง", value: s.back3 },
              { label: "2 ตัวท้าย", value: s.back2 },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-lg bg-surface-2 py-3 text-center"
              >
                <div className="text-[10px] text-muted mb-1">{c.label}</div>
                <div className="num-md">{c.value}</div>
              </div>
            ))}
          </div>

          <ScoreBar score={s.score} />

          <p className="text-[13.5px] leading-relaxed text-ink-2">
            {loadingReason && !s.reason ? (
              <span className="inline-block animate-pulse text-subtle">
                กำลังเขียนคำอธิบาย…
              </span>
            ) : (
              s.reason || "ชุดนี้มีโครงเลขที่สมดุลและน่าจับตามอง"
            )}
          </p>
        </article>
      ))}
    </div>
  );
}
