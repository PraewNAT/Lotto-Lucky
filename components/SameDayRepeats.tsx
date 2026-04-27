"use client";

import { useMemo, useState } from "react";
import type { LottoDraw } from "@/lib/types";
import {
  analyzeSameDayRepeats,
  type RepeatField,
} from "@/lib/sameDayRepeats";

interface Props {
  draws: LottoDraw[];
}

const TABS: { id: RepeatField; label: string; minDigits: number }[] = [
  { id: "back2", label: "เลข 2 ตัวท้าย", minDigits: 2 },
  { id: "back3", label: "3 ตัวหลัง", minDigits: 3 },
  { id: "front3", label: "3 ตัวหน้า", minDigits: 3 },
  { id: "first", label: "รางวัลที่ 1", minDigits: 6 },
];

const THAI_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

function formatThai(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
}

type DayFilter = "all" | 1 | 16;

export default function SameDayRepeats({ draws }: Props) {
  const [tab, setTab] = useState<RepeatField>("back2");
  const [dayFilter, setDayFilter] = useState<DayFilter>("all");
  const [showAll, setShowAll] = useState(false);

  const tabConfig = TABS.find((t) => t.id === tab)!;
  const allEntries = useMemo(
    () => analyzeSameDayRepeats(draws, tab, tabConfig.minDigits),
    [draws, tab, tabConfig.minDigits],
  );

  const filtered = useMemo(() => {
    if (dayFilter === "all") return allEntries;
    return allEntries.filter((e) => e.day === dayFilter);
  }, [allEntries, dayFilter]);

  const visible = showAll ? filtered : filtered.slice(0, 10);

  const totalForTab = allEntries.length;
  const top = filtered[0];

  return (
    <section className="card space-y-5">
      <header className="space-y-1">
        <div className="eyebrow">เลขที่ออกซ้ำในวันที่เดียวกันของเดือน</div>
        <h2 className="text-[18px] font-semibold tracking-tight2 text-ink">
          เลขที่ออกซ้ำในวันที่เดียวกันของเดือน
        </h2>
        <p className="text-[13px] text-muted">
          เลขเดิมเคยออกในวัน{tab === "back2" ? "ที่" : "ที่"}เดียวกัน (เช่น
          ทุกวันที่ 1 หรือทุกวันที่ 16) ของเดือนต่าง ๆ
          จากประวัติย้อนหลังทั้งหมด {draws.length} งวด
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setShowAll(false);
            }}
            className={`rounded-md border px-3 py-1.5 text-[12.5px] font-medium transition ${
              tab === t.id
                ? "border-accent bg-accent text-white"
                : "border-line bg-surface text-ink-2 hover:bg-surface-2"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-muted">วันที่ของเดือน:</span>
        {(
          [
            { id: "all" as const, label: "ทั้งหมด" },
            { id: 1 as const, label: "เฉพาะวันที่ 1" },
            { id: 16 as const, label: "เฉพาะวันที่ 16" },
          ] as const
        ).map((opt) => (
          <button
            key={String(opt.id)}
            onClick={() => {
              setDayFilter(opt.id);
              setShowAll(false);
            }}
            className={`rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium ${
              dayFilter === opt.id
                ? "border-accent bg-accent-soft text-accent-text"
                : "border-line bg-surface text-ink-2 hover:bg-surface-2"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg bg-surface-2 px-4 py-8 text-center text-[13px] text-muted">
          {totalForTab === 0
            ? `ไม่พบเลข${tabConfig.label}ใดออกซ้ำในวันที่เดียวกัน`
            : `ไม่พบเลขที่ออกซ้ำในวันที่ ${dayFilter} ของเดือน — ลองเลือก "ทั้งหมด" หรือประเภทเลขอื่น`}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <div className="grid grid-cols-[60px_1fr_auto] items-center gap-3 border-b border-line-subtle pb-2 text-[11px] text-muted">
              <span>วันที่</span>
              <span>เลข & จำนวนครั้ง</span>
              <span>วันที่ออก</span>
            </div>
            {visible.map((e, idx) => (
              <article
                key={`${e.day}-${e.number}-${idx}`}
                className="grid grid-cols-[60px_1fr_auto] items-center gap-3 rounded-md border border-line-subtle bg-surface-2 px-3 py-2"
              >
                <span className="text-[13px] font-medium text-ink-2">
                  วันที่ {e.day}
                </span>
                <div className="flex items-center gap-3">
                  <span className="num-md font-mono">{e.number}</span>
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-text">
                    {e.dates.length} ครั้ง
                  </span>
                </div>
                <div className="text-right text-[11.5px] text-muted">
                  {e.dates.map((dt) => (
                    <div key={dt} className="font-mono">
                      {formatThai(dt)}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          {filtered.length > 10 && (
            <div className="flex items-center justify-between border-t border-line-subtle pt-3">
              <span className="text-[12px] text-muted">
                แสดง {visible.length} จาก {filtered.length} เคส
                {dayFilter !== "all" &&
                  totalForTab > filtered.length &&
                  ` (จาก ${totalForTab} เคสเมื่อดูทุกวันที่)`}
              </span>
              <button
                onClick={() => setShowAll((v) => !v)}
                className="rounded-md border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-ink-2 hover:bg-surface-2"
              >
                {showAll ? "ย่อ" : "ดูทั้งหมด"}
              </button>
            </div>
          )}
        </>
      )}

      {top && (
        <p className="text-[12px] text-subtle">
          ⭐ เลขเด่น: <strong className="font-mono">{top.number}</strong> ออกใน
          วันที่ {top.day} ของเดือน รวม {top.dates.length} ครั้ง
          {tab === "first" && " — รางวัลที่ 1 มี 1 ล้าน combination จึงไม่ค่อยซ้ำ"}
        </p>
      )}

      <p className="rounded-md border border-line-subtle bg-surface-2 p-3 text-[11.5px] leading-relaxed text-muted">
        ⚠️ <strong>หมายเหตุเชิงสถิติ</strong>: การที่เลขออกซ้ำในวันที่เดียวกันของเดือน
        เป็นเหตุการณ์ที่คาดหวังได้ตามทฤษฎีความน่าจะเป็น (ไม่ใช่ pattern พิเศษ) —
        เช่น เลขท้าย 2 ตัว มี 100 ค่า กับงวดวันที่ 16 ราว 200+ งวด
        แต่ละค่าจะออกเฉลี่ย 2 ครั้งโดยธรรมชาติ ไม่ควรนำไปใช้ตัดสินใจซื้อจริง
      </p>
    </section>
  );
}
