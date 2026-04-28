"use client";

import { useEffect, useState } from "react";
import type { LottoDraw } from "@/lib/types";
import { predictNext, type PredictKind, type Prediction } from "@/lib/stats";

const KEY_PREFIX = "lotto-lucky:lastPrediction";

interface SavedPrediction {
  predictions: Prediction[];
  forDrawDate: string;
  savedAt: string;
}

interface KindMeta {
  title: string;
  badge: string;
  hint: string;
  numberWidthClass: string;
  /** จำนวน "ช่อง" ที่ออกในแต่ละงวด (back2=1, front3/back3=2) */
  drawSlots: number;
}

const KIND_META: Record<PredictKind, KindMeta> = {
  back2: {
    title: "ทำนายเลขท้าย 2 ตัวงวดหน้า",
    badge: "เลขท้าย 2 ตัว",
    hint: "เหมาะถ้าเล่นเฉพาะ 2 ตัวท้าย — ใช้ GA วิวัฒนาการจากสถิติย้อนหลัง",
    numberWidthClass: "w-14",
    drawSlots: 1,
  },
  front3: {
    title: "ทำนายเลข 3 ตัวหน้างวดหน้า",
    badge: "3 ตัวหน้า",
    hint: "ใช้สถิติของรางวัล 3 ตัวหน้าทั้งสองชุดในแต่ละงวด — ฐานข้อมูลใหญ่กว่า back2",
    numberWidthClass: "w-20",
    drawSlots: 2,
  },
  back3: {
    title: "ทำนายเลข 3 ตัวหลังงวดหน้า",
    badge: "3 ตัวหลัง",
    hint: "ใช้สถิติของรางวัล 3 ตัวหลังทั้งสองชุดในแต่ละงวด",
    numberWidthClass: "w-20",
    drawSlots: 2,
  },
};

interface Props {
  draws: LottoDraw[];
  latestDrawDate?: string;
  kind?: PredictKind;
  count?: number;
}

export default function Predictor({
  draws,
  latestDrawDate,
  kind = "back2",
  count = 5,
}: Props) {
  const meta = KIND_META[kind];
  const storageKey = `${KEY_PREFIX}:${kind}`;

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [check, setCheck] = useState<{ hits: number[]; latestNumbers: string[] } | null>(null);

  useEffect(() => {
    const next = predictNext(draws, count, kind);
    setPredictions(next);
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw && latestDrawDate && draws.length > 0) {
        const p = JSON.parse(raw) as SavedPrediction;
        const latest = draws[0];
        if (latest.date >= p.forDrawDate) {
          // เลขจริงของงวดล่าสุดในตำแหน่งนี้ (1 หรือ 2 ค่า)
          const actuals: string[] =
            kind === "back2"
              ? [latest.prizes.back2]
              : kind === "front3"
                ? [...latest.prizes.front3]
                : [...latest.prizes.back3];

          const hits = p.predictions
            .map((pp, i) => (actuals.includes(pp.number) ? i : -1))
            .filter((i) => i >= 0);
          setCheck({ hits, latestNumbers: actuals });
        }
      }
    } catch {}
  }, [draws, latestDrawDate, kind, count, storageKey]);

  function savePrediction() {
    const next: SavedPrediction = {
      predictions,
      forDrawDate: latestDrawDate || new Date().toISOString().slice(0, 10),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(storageKey, JSON.stringify(next));
    setCheck(null);
  }

  return (
    <div className="space-y-4">
      <section className="card">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-semibold tracking-tight2 text-ink">
                {meta.title}
              </h3>
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent-text">
                {meta.badge}
              </span>
            </div>
            <p className="mt-0.5 text-[12px] text-muted">
              วิเคราะห์จากข้อมูลย้อนหลัง {draws.length} งวด • {meta.hint}
            </p>
          </div>
          <button onClick={savePrediction} className="btn-secondary whitespace-nowrap">
            บันทึกการทาย
          </button>
        </div>
        <ul className="divide-y divide-line-subtle">
          {predictions.map((p, i) => (
            <li key={i} className="flex items-center gap-4 py-3">
              <span className={`num-md ${meta.numberWidthClass}`}>{p.number}</span>
              <div className="flex-1 min-w-0">
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${p.confidence}%` }}
                  />
                </div>
                <p className="mt-1 text-[12px] text-muted truncate">{p.reason}</p>
              </div>
              <span className="font-mono text-[13px] text-ink w-12 text-right">
                {p.confidence}%
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-lg bg-warning-soft p-3 text-[12px] text-ink-2">
          <strong>หมายเหตุ:</strong> การทำนายนี้เป็นการคำนวณทางสถิติเพื่อความบันเทิงเท่านั้น ไม่การันตีผลรางวัล
        </div>
      </section>

      {check && (
        <section className="card">
          <h4 className="text-[14px] font-semibold tracking-tight2 text-ink">เฉลยงวดล่าสุด</h4>
          <p className="mt-1 text-[13.5px] text-ink-2">
            เลข{meta.badge}ที่ออกคือ{" "}
            <strong className="num-sm">{check.latestNumbers.join(" · ")}</strong>
          </p>
          {check.hits.length > 0 ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-success-soft px-2 py-1 text-[13px] text-success">
              ทายถูก! ตรงกับชุดที่ {check.hits.map((h) => h + 1).join(", ")}
            </p>
          ) : (
            <p className="mt-2 text-[13px] text-muted">งวดนี้ยังไม่ตรง ลองดูงวดถัดไป</p>
          )}
        </section>
      )}
    </div>
  );
}
