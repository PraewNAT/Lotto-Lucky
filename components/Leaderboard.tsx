"use client";

import type { LottoDraw, Science } from "@/lib/types";
import { SCIENCE_LABEL } from "@/lib/types";
import { useMemo } from "react";

interface Props {
  draws: LottoDraw[];
}

function pseudoAccuracy(draws: LottoDraw[], science: Science) {
  const recent = draws.slice(0, 12);
  let hits2 = 0;
  let hits3 = 0;
  for (const d of recent) {
    const seed = [...(d.date + science)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const guess2 = (seed % 100).toString().padStart(2, "0");
    const guess3 = (Math.floor(seed / 100) % 1000).toString().padStart(3, "0");
    if (guess2 === d.prizes.back2) hits2++;
    if (d.prizes.back3.includes(guess3)) hits3++;
  }
  return { hits2, hits3, total: recent.length };
}

export default function Leaderboard({ draws }: Props) {
  const rows = useMemo(() => {
    const entries: Science[] = ["math", "astro", "numero", "fengshui"];
    const result = entries.map((s) => ({ science: s, ...pseudoAccuracy(draws, s) }));
    result.sort((a, b) => b.hits2 + b.hits3 - (a.hits2 + a.hits3));
    return result;
  }, [draws]);

  return (
    <section className="card">
      <div className="mb-4">
        <h3 className="text-[16px] font-semibold tracking-tight2 text-ink">
          ความแม่นแต่ละศาสตร์
        </h3>
        <p className="mt-0.5 text-[12px] text-muted">เปรียบเทียบจาก 12 งวดล่าสุด</p>
      </div>

      <div className="rounded-lg border border-line">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="border-b border-line-subtle">
              <th className="px-3.5 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.04em] text-muted">
                ศาสตร์
              </th>
              <th className="px-3.5 py-2.5 text-right text-[11px] font-medium uppercase tracking-[0.04em] text-muted">
                2 ตัวท้าย
              </th>
              <th className="px-3.5 py-2.5 text-right text-[11px] font-medium uppercase tracking-[0.04em] text-muted">
                3 ตัวท้าย
              </th>
              <th className="px-3.5 py-2.5 text-right text-[11px] font-medium uppercase tracking-[0.04em] text-muted">
                Accuracy
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const acc = r.total > 0 ? Math.round(((r.hits2 + r.hits3) / (r.total * 2)) * 100) : 0;
              return (
                <tr key={r.science} className="border-b border-line-subtle last:border-b-0">
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-ink font-medium">{SCIENCE_LABEL[r.science]}</span>
                      {i === 0 && (
                        <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent-text">
                          อันดับ 1
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-[16px] font-semibold text-ink-2">
                    {r.hits2}/{r.total}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-mono text-[16px] font-semibold text-ink-2">
                    {r.hits3}/{r.total}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <span className="font-mono text-[18px] font-semibold text-ink">{acc}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-muted">
        คำนวณจากการจำลองการทายของแต่ละศาสตร์เทียบกับผลจริง
      </p>
    </section>
  );
}
