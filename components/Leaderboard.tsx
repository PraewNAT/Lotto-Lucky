"use client";

import { SCIENCE_LABEL, type Science } from "@/lib/types";
import { useEffect, useState } from "react";

interface ScienceStat {
  checked: number;
  hitBack2: number;
  hitBack3: number;
}

type GlobalStats = Record<Science, ScienceStat>;

const SCIENCES: Science[] = ["math", "astro", "numero", "fengshui"];

export default function Leaderboard() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accuracy")
      .then((r) => r.json())
      .then((data) => setStats(data as GlobalStats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalChecked = stats
    ? SCIENCES.reduce((s, sci) => s + (stats[sci]?.checked ?? 0), 0)
    : 0;
  const hasData = totalChecked >= 5;

  const rows = stats
    ? [...SCIENCES]
        .map((sci) => ({ science: sci, ...(stats[sci] ?? { checked: 0, hitBack2: 0, hitBack3: 0 }) }))
        .sort((a, b) => b.hitBack2 + b.hitBack3 - (a.hitBack2 + a.hitBack3))
    : [];

  return (
    <section className="card">
      <div className="mb-4">
        <h3 className="text-[16px] font-semibold tracking-tight2 text-ink">
          ความแม่นแต่ละศาสตร์
        </h3>
        <p className="mt-0.5 text-[12px] text-muted">
          {loading
            ? "กำลังโหลด…"
            : hasData
            ? `รวมทุกผู้ใช้ — ตรวจแล้ว ${totalChecked} ครั้ง`
            : "ยังไม่มีข้อมูลเพียงพอ — ต้องสุ่มแล้วรอผลจริงอย่างน้อย 5 ครั้ง"}
        </p>
      </div>

      {loading ? (
        <div className="h-24 animate-pulse rounded-lg bg-surface-2" />
      ) : !hasData ? (
        <div className="rounded-lg border border-dashed border-line py-8 text-center space-y-2">
          <p className="text-[14px] text-ink-2">ข้อมูลยังน้อยอยู่</p>
          <p className="text-[12px] text-muted max-w-sm mx-auto">
            ระบบจะเริ่มคำนวณหลังจากผู้ใช้สุ่มเลข ผ่านงวด และตรวจผลจริงสะสม 5 ครั้งขึ้นไป
          </p>
          {totalChecked > 0 && (
            <p className="text-[11px] text-muted">
              มีข้อมูลแล้ว {totalChecked} ครั้ง (ต้องการอีก {5 - totalChecked} ครั้ง)
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-line">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-line-subtle">
                  <th className="px-3.5 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.04em] text-muted">
                    ศาสตร์
                  </th>
                  <th className="px-3.5 py-2.5 text-right text-[11px] font-medium uppercase tracking-[0.04em] text-muted">
                    ถูก 2 ตัว
                  </th>
                  <th className="px-3.5 py-2.5 text-right text-[11px] font-medium uppercase tracking-[0.04em] text-muted">
                    ถูก 3 ตัว
                  </th>
                  <th className="px-3.5 py-2.5 text-right text-[11px] font-medium uppercase tracking-[0.04em] text-muted">
                    จาก
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.science} className="border-b border-line-subtle last:border-b-0">
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">{SCIENCE_LABEL[r.science]}</span>
                        {i === 0 && r.hitBack2 + r.hitBack3 > 0 && (
                          <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent-text">
                            อันดับ 1
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-[15px] font-semibold text-ink-2">
                      {r.hitBack2}/{r.checked}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-[15px] font-semibold text-ink-2">
                      {r.hitBack3}/{r.checked}
                    </td>
                    <td className="px-3.5 py-2.5 text-right text-[12px] text-muted">
                      {r.checked} งวด
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-muted">
            รวมข้อมูลจากทุกผู้ใช้ — นับเฉพาะงวดที่สุ่มจริงและตรวจผลแล้ว
          </p>
        </>
      )}
    </section>
  );
}
