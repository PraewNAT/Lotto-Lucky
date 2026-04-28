"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { LottoDraw } from "@/lib/types";
import { predictNext, type PredictKind, type Prediction } from "@/lib/stats";
import { appendHistory } from "@/lib/predictHistory";

const KINDS: PredictKind[] = ["back2", "front3", "back3"];

const TABS: { kind: PredictKind | "all"; label: string }[] = [
  { kind: "all",    label: "ทั้งหมด" },
  { kind: "back2",  label: "2 ตัวท้าย" },
  { kind: "front3", label: "3 ตัวหน้า" },
  { kind: "back3",  label: "3 ตัวหลัง" },
];

interface Grade {
  letter: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
}

function toGrade(pct: number): Grade {
  if (pct >= 88) return { letter: "A+", textColor: "text-success", borderColor: "border-success", bgColor: "bg-success-soft" };
  if (pct >= 78) return { letter: "A",  textColor: "text-success", borderColor: "border-success", bgColor: "bg-success-soft" };
  if (pct >= 68) return { letter: "B+", textColor: "text-warning", borderColor: "border-warning", bgColor: "bg-warning-soft" };
  if (pct >= 58) return { letter: "B",  textColor: "text-warning", borderColor: "border-warning", bgColor: "bg-warning-soft" };
  return              { letter: "C",  textColor: "text-muted",   borderColor: "border-line-strong", bgColor: "bg-surface-2" };
}

function labelForKind(k: PredictKind): string {
  return TABS.find((t) => t.kind === k)?.label ?? k;
}

function computeAll(draws: LottoDraw[]): Record<PredictKind, Prediction[]> {
  const d = Array.isArray(draws) ? draws : [];
  return {
    back2:  predictNext(d, 5, "back2"),
    front3: predictNext(d, 5, "front3"),
    back3:  predictNext(d, 5, "back3"),
  };
}

interface Props {
  draws: LottoDraw[] | undefined;
  latestDrawDate?: string;
  drawCount: number;
}

type TabKind = PredictKind | "all";

export default function PredictorDeck({ draws, latestDrawDate, drawCount }: Props) {
  const [activeTab, setActiveTab] = useState<TabKind>("all");
  const [clientReady, setClientReady] = useState(false);

  useLayoutEffect(() => { setClientReady(true); }, []);

  const safeDraws = useMemo(() => (Array.isArray(draws) ? draws : []), [draws]);

  const all = useMemo(() => {
    if (!clientReady) return { back2: [] as Prediction[], front3: [] as Prediction[], back3: [] as Prediction[] };
    return computeAll(safeDraws);
  }, [clientReady, safeDraws]);

  // Auto-save เมื่อ GA คำนวณเสร็จครั้งแรกของงวดนี้ (skip ถ้าบันทึกไปแล้ว)
  useEffect(() => {
    if (!clientReady || !latestDrawDate || all.back2.length === 0) return;
    appendHistory(latestDrawDate, all);
  }, [clientReady, latestDrawDate, all]);

  const isLoading = !clientReady;
  const activeKind = activeTab === "all" ? null : activeTab;

  function renderCard(p: Prediction, i: number, kind: PredictKind) {
    const grade = toGrade(p.confidence);
    const isFirst = i === 0;
    return (
      <article
        key={`${kind}-${i}`}
        className={`flex-none w-[148px] rounded-xl border flex flex-col items-center gap-2.5 px-3 py-4 transition snap-start ${
          isFirst
            ? "border-accent bg-accent-soft shadow-raised"
            : "border-line bg-surface hover:border-line-strong hover:-translate-y-0.5"
        }`}
      >
        <div className="w-full flex items-center justify-between gap-1">
          <span className={`text-[11px] font-bold ${isFirst ? "text-accent" : "text-muted"}`}>
            {isFirst ? "★ #1" : `#${i + 1}`}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-mono font-semibold tabular-nums border ${grade.borderColor} ${grade.bgColor} ${grade.textColor}`}>
            {p.confidence}%
          </span>
        </div>

        <div className={`font-mono font-semibold leading-none tracking-widest ${
          kind === "back2" ? "text-[44px]" : "text-[34px]"
        } ${isFirst ? "text-accent" : "text-ink"}`}>
          {p.number}
        </div>

        <div className={`h-9 w-9 rounded-full flex items-center justify-center text-[12px] font-bold border-2 ${grade.textColor} ${grade.borderColor} ${grade.bgColor}`}>
          {grade.letter}
        </div>
      </article>
    );
  }

  function renderCardRow(kind: PredictKind) {
    const preds = all[kind];
    return (
      <div key={kind} className="space-y-2">
        <div>
          <p className="eyebrow">Top 5</p>
          <h3 className="text-[16px] font-semibold tracking-tight2 text-ink">เลข{labelForKind(kind)}</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-none w-[148px] h-[180px] rounded-xl border border-line bg-surface-2 animate-pulse snap-start" />
              ))
            : preds.map((p, i) => renderCard(p, i, kind))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Tab pills */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={String(t.kind)}
            type="button"
            onClick={() => setActiveTab(t.kind)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
              activeTab === t.kind
                ? "bg-ink text-surface shadow-sm"
                : "bg-surface-2 text-ink-2 hover:bg-surface-3"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "all" ? (
        <div className="space-y-8">
          <p className="text-[12px] text-muted">
            GA วิเคราะห์จาก {drawCount} งวด • ตำแหน่งหลัก + ผลรวม + สมดุล + ความใหม่
          </p>
          {KINDS.map((k) => renderCardRow(k))}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="eyebrow">Top 5</p>
            <h3 className="text-[18px] font-semibold tracking-tight2 text-ink">เลข{TABS.find(t => t.kind === activeKind)!.label}</h3>
            <p className="mt-0.5 text-[12px] text-muted">GA วิเคราะห์จาก {drawCount} งวด • ตำแหน่งหลัก + ผลรวม + สมดุล + ความใหม่</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex-none w-[148px] h-[180px] rounded-xl border border-line bg-surface-2 animate-pulse snap-start" />
                ))
              : all[activeKind!].map((p, i) => renderCard(p, i, activeKind!))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-subtle">
        * การทำนายนี้เป็นการคำนวณทางสถิติเพื่อความบันเทิงเท่านั้น ไม่การันตีผลรางวัล
        — บันทึกอัตโนมัติทุกงวดเพื่อใช้เทียบย้อนหลังใน "ประวัติการทาย"
      </p>
    </div>
  );
}
