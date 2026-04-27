"use client";

import { useState } from "react";
import { generateAndRank } from "@/lib/lottery";
import type { LottoDraw, NumberSet, Science, StatsSummary, UserInput } from "@/lib/types";

interface PrizeBlock {
  label: string;
  count: number;
  sets: NumberSet[];
}

const PRIZES = [
  { label: "รางวัลที่ 2", count: 5 },
  { label: "รางวัลที่ 3", count: 10 },
  { label: "รางวัลที่ 4", count: 50 },
  { label: "รางวัลที่ 5", count: 100 },
];

export default function SecondaryPrize() {
  const [sciences] = useState<Science[]>(["math", "numero"]);
  const [user] = useState<UserInput>({});
  const [blocks, setBlocks] = useState<PrizeBlock[] | null>(null);
  const [back3, setBack3] = useState<string[]>([]);
  const [back2, setBack2] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    let stats: StatsSummary | undefined;
    let draws: LottoDraw[] | undefined;
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 30000);
      const r = await fetch("/api/lotto?mode=history&limit=0&minYear=2550", {
        signal: ctl.signal,
      });
      clearTimeout(timer);
      const j = await r.json();
      stats = j.stats;
      draws = j.draws;
    } catch {}
    const next = PRIZES.map((p) => ({
      label: p.label,
      count: p.count,
      sets: generateAndRank(Math.min(p.count, 5), sciences, user, stats, draws),
    }));
    setBlocks(next);
    const front = generateAndRank(2, sciences, user, stats, draws).map((s) => s.front3);
    setBack3(front);
    setBack2(generateAndRank(1, sciences, user, stats, draws)[0].back2);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <button className="btn-primary btn-lg" onClick={generate} disabled={loading}>
        {loading ? "กำลังสุ่ม..." : "สุ่มเลขรางวัลรอง"}
      </button>

      {blocks && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {blocks.map((b) => (
              <article key={b.label} className="card">
                <header className="mb-3 flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold tracking-tight2 text-ink">
                    {b.label}
                  </h3>
                  <span className="text-[11px] text-muted">
                    แนะนำ {b.sets.length} จาก {b.count} ชุด
                  </span>
                </header>
                <ul className="divide-y divide-line-subtle">
                  {b.sets.map((s, i) => (
                    <li key={i} className="flex items-center justify-between py-2.5">
                      <span className="num-sm">{s.number}</span>
                      <span className="text-[12px] font-mono text-muted">
                        {Math.round(s.score)}/100
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="card">
              <div className="eyebrow mb-3">เลขท้าย 3 ตัวพิเศษ</div>
              <div className="flex gap-2">
                {back3.map((n, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-surface-2 px-4 py-2.5 num-md"
                  >
                    {n}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-muted">
                คัดจากเลขผลรวมใกล้กลาง และเลขที่เริ่มห่างหายในงวดที่ผ่านมา
              </p>
            </article>
            <article className="card">
              <div className="eyebrow mb-3">เลขท้าย 2 ตัว</div>
              <span className="inline-block rounded-lg bg-surface-2 px-5 py-3 num-hero">
                {back2}
              </span>
              <p className="mt-3 text-[12px] text-muted">
                ชั่งน้ำหนักความถี่ย้อนหลังและสัญญาณส่วนตัว
              </p>
            </article>
          </div>
        </>
      )}
    </div>
  );
}
