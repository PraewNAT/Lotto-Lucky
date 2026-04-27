"use client";

import { useEffect, useState } from "react";
import type { LottoDraw } from "@/lib/types";
import { predictNext } from "@/lib/stats";

interface Prediction {
  number: string;
  confidence: number;
  reason: string;
}

const KEY = "lotto-lucky:lastPrediction";

interface SavedPrediction {
  predictions: Prediction[];
  forDrawDate: string;
  savedAt: string;
}

interface Props {
  draws: LottoDraw[];
  latestDrawDate?: string;
}

export default function Predictor({ draws, latestDrawDate }: Props) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [check, setCheck] = useState<{ hits: number[]; latestBack2: string } | null>(null);

  useEffect(() => {
    const next = predictNext(draws, 5);
    setPredictions(next);
    try {
      const raw = localStorage.getItem(KEY);
      if (raw && latestDrawDate && draws.length > 0) {
        const p = JSON.parse(raw) as SavedPrediction;
        const latest = draws[0];
        if (latest.date >= p.forDrawDate) {
          const back2 = latest.prizes.back2;
          const hits = p.predictions
            .map((pp, i) => (pp.number === back2 ? i : -1))
            .filter((i) => i >= 0);
          setCheck({ hits, latestBack2: back2 });
        }
      }
    } catch {}
  }, [draws, latestDrawDate]);

  function savePrediction() {
    const next: SavedPrediction = {
      predictions,
      forDrawDate: latestDrawDate || new Date().toISOString().slice(0, 10),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify(next));
    setCheck(null);
  }

  return (
    <div className="space-y-4">
      <section className="card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-semibold tracking-tight2 text-ink">
                ทำนายเลขท้าย 2 ตัวงวดหน้า
              </h3>
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent-text">
                เฉพาะ 2 ตัวท้าย
              </span>
            </div>
            <p className="mt-0.5 text-[12px] text-muted">
              วิเคราะห์ <strong className="text-ink-2">เฉพาะเลขท้าย 2 ตัวโดยตรง</strong> จาก {draws.length} งวดย้อนหลัง
              โดยดูความถี่, เลขที่หายนาน, สมดุลคู่/คี่ — เหมาะถ้าเล่นเฉพาะ 2 ตัวท้าย
            </p>
          </div>
          <button onClick={savePrediction} className="btn-secondary">
            บันทึกการทาย
          </button>
        </div>
        <ul className="divide-y divide-line-subtle">
          {predictions.map((p, i) => (
            <li key={i} className="flex items-center gap-4 py-3">
              <span className="num-md w-14">{p.number}</span>
              <div className="flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${p.confidence}%` }}
                  />
                </div>
                <p className="mt-1 text-[12px] text-muted">{p.reason}</p>
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
            เลข 2 ตัวท้ายที่ออกคือ <strong className="num-sm">{check.latestBack2}</strong>
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
