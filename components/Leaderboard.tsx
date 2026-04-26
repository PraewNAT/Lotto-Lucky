"use client";

import type { LottoDraw, Science } from "@/lib/types";
import { SCIENCE_LABEL } from "@/lib/types";
import { useMemo, useState } from "react";

interface Props {
  draws: LottoDraw[];
}

type YearFilter = "all" | number;

function pseudoAccuracy(draws: LottoDraw[], science: Science) {
  let hits2 = 0;
  let hits3 = 0;
  for (const d of draws) {
    const seed = [...(d.date + science)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const guess2 = (seed % 100).toString().padStart(2, "0");
    const guess3 = (Math.floor(seed / 100) % 1000).toString().padStart(3, "0");
    if (guess2 === d.prizes.back2) hits2++;
    if (d.prizes.back3.includes(guess3)) hits3++;
  }
  return { hits2, hits3, total: draws.length };
}

export default function Leaderboard({ draws }: Props) {
  // ปีที่มีข้อมูลจริง (พ.ศ.) เรียงจากใหม่ไปเก่า
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    for (const d of draws) {
      const dt = new Date(d.date);
      if (!isNaN(dt.getTime())) set.add(dt.getFullYear() + 543);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [draws]);

  const [year, setYear] = useState<YearFilter>("all");

  const filteredDraws = useMemo(() => {
    if (year === "all") return draws.slice(0, 12);
    const targetYearCE = year - 543;
    return draws.filter((d) => {
      const dt = new Date(d.date);
      return !isNaN(dt.getTime()) && dt.getFullYear() === targetYearCE;
    });
  }, [draws, year]);

  const rows = useMemo(() => {
    const entries: Science[] = ["math", "astro", "numero", "fengshui"];
    const result = entries.map((s) => ({ science: s, ...pseudoAccuracy(filteredDraws, s) }));
    result.sort((a, b) => b.hits2 + b.hits3 - (a.hits2 + a.hits3));
    return result;
  }, [filteredDraws]);

  const subText =
    year === "all"
      ? `เปรียบเทียบจาก ${filteredDraws.length} งวดล่าสุด`
      : `เปรียบเทียบจาก ${filteredDraws.length} งวดในปี ${year}`;

  return (
    <section className="card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-semibold tracking-tight2 text-ink">
            ความแม่นแต่ละศาสตร์
          </h3>
          <p className="mt-0.5 text-[12px] text-muted">{subText}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[12px] text-muted" htmlFor="leaderboard-year">
            ปี
          </label>
          <select
            id="leaderboard-year"
            value={year}
            onChange={(e) =>
              setYear(e.target.value === "all" ? "all" : Number(e.target.value))
            }
            className="h-8 rounded-md border border-line bg-surface px-2 text-[13px] text-ink focus:border-accent focus:outline-none focus:shadow-focus"
          >
            <option value="all">ทั้งหมด (12 ล่าสุด)</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
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
