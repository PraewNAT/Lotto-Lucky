"use client";

import { useMemo, useState } from "react";
import type { HeatmapMode, LottoDraw } from "@/lib/types";
import { summarize } from "@/lib/stats";

interface Props {
  draws: LottoDraw[];
}

const TABS: { id: HeatmapMode; label: string; pad: number; total: number }[] = [
  { id: "back2", label: "เลข 2 ตัวท้าย", pad: 2, total: 100 },
  { id: "front3", label: "3 ตัวหน้า", pad: 3, total: 1000 },
  { id: "back3", label: "3 ตัวหลัง", pad: 3, total: 1000 },
];

const THAI_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

const COUNT_FILTERS = [
  { value: 0, label: "ทั้งหมด" },
  { value: 1, label: "1 ครั้ง" },
  { value: 2, label: "2 ครั้ง" },
  { value: 3, label: "3 ครั้ง" },
  { value: 4, label: "4 ครั้ง" },
  { value: 5, label: "5+ ครั้ง" },
];

// Discrete color scale ตามจำนวนครั้งที่ออก
const COUNT_COLORS: { count: number; label: string; bg: string; whiteText: boolean }[] = [
  { count: 0, label: "0 ครั้ง", bg: "rgb(244, 246, 250)", whiteText: false },
  { count: 1, label: "1 ครั้ง", bg: "rgb(96, 165, 230)", whiteText: false },   // ฟ้า
  { count: 2, label: "2 ครั้ง", bg: "rgb(86, 190, 130)", whiteText: false },   // เขียว
  { count: 3, label: "3 ครั้ง", bg: "rgb(245, 200, 60)", whiteText: false },   // เหลือง
  { count: 4, label: "4 ครั้ง", bg: "rgb(225, 75, 85)", whiteText: true },     // แดง
  { count: 5, label: "5+ ครั้ง", bg: "rgb(140, 92, 60)", whiteText: true },    // น้ำตาล
];

function colorForCount(count: number) {
  if (count <= 0) return COUNT_COLORS[0];
  if (count >= 5) return COUNT_COLORS[5];
  return COUNT_COLORS[count];
}

function ymKey(year: number, month: number) {
  return year * 12 + month;
}

/** filters: ชุดของค่าที่เลือก (1, 2, 3, 4, 5 = 5+). เซ็ตว่าง = แสดงทุกอัน */
function matchesCountFilter(count: number, filters: Set<number>) {
  if (filters.size === 0) return true;
  if (filters.has(5) && count >= 5) return true;
  return filters.has(count);
}

export default function HeatMap({ draws }: Props) {
  const [mode, setMode] = useState<HeatmapMode>("back2");
  const [active, setActive] = useState<number | null>(null);
  const [countFilters, setCountFilters] = useState<Set<number>>(() => new Set());

  function toggleCountFilter(value: number) {
    setActive(null);
    if (value === 0) {
      setCountFilters(new Set()); // "ทั้งหมด" = clear
      return;
    }
    setCountFilters((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  // ค้นหาขอบเขตของข้อมูล + เดือนที่มีในแต่ละปี
  const { minYM, maxYM, availableYears, monthsByYear } = useMemo(() => {
    let minK = Infinity, maxK = -Infinity;
    const map = new Map<number, Set<number>>(); // year -> set of months (1-12)
    for (const d of draws) {
      const dt = new Date(d.date);
      if (isNaN(dt.getTime())) continue;
      const y = dt.getFullYear();
      const m = dt.getMonth() + 1;
      const k = ymKey(y, m);
      if (k < minK) minK = k;
      if (k > maxK) maxK = k;
      if (!map.has(y)) map.set(y, new Set());
      map.get(y)!.add(m);
    }
    const monthsByYear: Record<number, number[]> = {};
    for (const [y, ms] of map) {
      monthsByYear[y] = [...ms].sort((a, b) => a - b);
    }
    return {
      minYM: minK === Infinity ? null : minK,
      maxYM: maxK === -Infinity ? null : maxK,
      availableYears: [...map.keys()].sort((a, b) => b - a), // ใหม่สุดขึ้นก่อน
      monthsByYear,
    };
  }, [draws]);

  const defaultFromYear = minYM ? Math.floor(minYM / 12) : new Date().getFullYear();
  const defaultFromMonth = minYM ? minYM % 12 : 1;
  const defaultToYear = maxYM ? Math.floor(maxYM / 12) : new Date().getFullYear();
  const defaultToMonth = maxYM ? maxYM % 12 : 12;

  const [fromYear, setFromYear] = useState<number>(defaultFromYear);
  const [fromMonth, setFromMonth] = useState<number>(defaultFromMonth);
  const [toYear, setToYear] = useState<number>(defaultToYear);
  const [toMonth, setToMonth] = useState<number>(defaultToMonth);

  const filteredDraws = useMemo(() => {
    const fromK = ymKey(fromYear, fromMonth);
    const toK = ymKey(toYear, toMonth);
    const [lo, hi] = fromK <= toK ? [fromK, toK] : [toK, fromK];
    return draws.filter((d) => {
      const dt = new Date(d.date);
      if (isNaN(dt.getTime())) return false;
      const k = ymKey(dt.getFullYear(), dt.getMonth() + 1);
      return k >= lo && k <= hi;
    });
  }, [draws, fromYear, fromMonth, toYear, toMonth]);

  const stats = useMemo(() => summarize(filteredDraws), [filteredDraws]);

  const config = TABS.find((t) => t.id === mode)!;
  const freq = mode === "back2" ? stats.back2Freq : mode === "front3" ? stats.front3Freq : stats.back3Freq;
  const lastSeen =
    mode === "back2" ? stats.back2LastSeen : mode === "front3" ? stats.front3LastSeen : stats.back3LastSeen;

  const ranking = useMemo(() => {
    return freq
      .map((count, idx) => ({ idx, count, lastSeen: lastSeen[idx] }))
      .filter((x) => x.count > 0);
  }, [freq, lastSeen]);

  const top = useMemo(() => [...ranking].sort((a, b) => b.count - a.count).slice(0, 10), [ranking]);
  const cold = useMemo(() => {
    return [...ranking]
      .sort((a, b) => {
        const da = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
        const db = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
        return da - db;
      })
      .slice(0, 10);
  }, [ranking]);

  function fmtIdx(i: number) {
    return i.toString().padStart(config.pad, "0");
  }

  function applyPreset(preset: "all" | "thisYear" | number) {
    if (!maxYM) return;
    const toY = Math.floor(maxYM / 12);
    const toM = maxYM % 12;
    setToYear(toY);
    setToMonth(toM);
    if (preset === "all") {
      const fromY = minYM ? Math.floor(minYM / 12) : toY;
      const fromM = minYM ? minYM % 12 : 1;
      setFromYear(fromY);
      setFromMonth(fromM);
    } else if (preset === "thisYear") {
      // ม.ค. ของปีล่าสุด → เดือนล่าสุดของปีนั้น
      setFromYear(toY);
      setFromMonth(1);
    } else {
      // y ปีย้อนหลัง — เลื่อนกลับ years ปี
      let fromMonthIdx = toM - 1;
      let fromYearVal = toY - preset;
      if (fromMonthIdx < 0) { fromMonthIdx += 12; fromYearVal -= 1; }
      setFromYear(fromYearVal);
      setFromMonth(fromMonthIdx + 1);
    }
  }

  const yearList = availableYears.length > 0
    ? availableYears
    : [new Date().getFullYear()];

  return (
    <section className="card space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-semibold tracking-tight2 text-ink">
            Heatmap ความถี่
          </h3>
          <p className="mt-0.5 text-[12px] text-muted">
            {THAI_MONTHS[fromMonth - 1]} {fromYear + 543} – {THAI_MONTHS[toMonth - 1]} {toYear + 543}
            {" • "}{stats.totalDraws} งวด • คลิก cell เพื่อดูรายละเอียด
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-surface-2 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setMode(t.id);
                setActive(null);
              }}
              className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition ${
                mode === t.id
                  ? "bg-surface text-ink shadow-raised"
                  : "text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time range selector */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow">ช่วงเวลา</span>
          <div className="flex flex-wrap gap-1">
            {([
              { key: "all", label: "ทั้งหมด" },
              { key: 3, label: "3 ปี" },
              { key: 1, label: "1 ปี" },
              { key: "thisYear", label: "ปีนี้" },
            ] as { key: "all" | "thisYear" | number; label: string }[]).map((p) => (
              <button
                key={String(p.key)}
                onClick={() => { applyPreset(p.key); setActive(null); }}
                className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-muted hover:bg-surface-2/70 hover:text-ink transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="text-muted">ตั้งแต่</span>
          <MonthYearPicker
            year={fromYear}
            month={fromMonth}
            years={yearList}
            availableMonths={monthsByYear[fromYear]}
            onYearChange={(y) => {
              setFromYear(y);
              const ms = monthsByYear[y];
              if (ms && ms.length > 0 && !ms.includes(fromMonth)) {
                setFromMonth(ms[0]);
              }
              setActive(null);
            }}
            onMonthChange={(m) => { setFromMonth(m); setActive(null); }}
          />
          <span className="text-muted">ถึง</span>
          <MonthYearPicker
            year={toYear}
            month={toMonth}
            years={yearList}
            availableMonths={monthsByYear[toYear]}
            onYearChange={(y) => {
              setToYear(y);
              const ms = monthsByYear[y];
              if (ms && ms.length > 0 && !ms.includes(toMonth)) {
                setToMonth(ms[ms.length - 1]);
              }
              setActive(null);
            }}
            onMonthChange={(m) => { setToMonth(m); setActive(null); }}
          />
        </div>
      </div>

      {/* Count filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow">ความถี่</span>
        <div className="flex flex-wrap gap-1">
          {COUNT_FILTERS.map((cf) => {
            const isAll = cf.value === 0;
            const isSelected = isAll
              ? countFilters.size === 0
              : countFilters.has(cf.value);
            return (
              <button
                key={cf.value}
                onClick={() => toggleCountFilter(cf.value)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition ${
                  isSelected
                    ? "bg-accent text-white"
                    : "bg-surface-2 text-muted hover:text-ink"
                }`}
              >
                {cf.label}
              </button>
            );
          })}
        </div>
      </div>

      {mode === "back2" ? (
        <Grid2D
          freq={freq}
          active={active}
          onSelect={setActive}
          countFilters={countFilters}
        />
      ) : (
        <Grid3D
          freq={freq}
          active={active}
          onSelect={setActive}
          countFilters={countFilters}
        />
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted">
        {COUNT_COLORS.map((c) => (
          <div key={c.count} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm border border-line-subtle"
              style={{ background: c.bg }}
            />
            <span>{c.label}</span>
          </div>
        ))}
        {countFilters.size > 0 && (
          <span className="ml-auto text-accent">
            แสดงเฉพาะ{" "}
            {[...countFilters]
              .sort((a, b) => a - b)
              .map((v) => COUNT_FILTERS.find((c) => c.value === v)?.label)
              .filter(Boolean)
              .join(" / ")}
          </span>
        )}
      </div>

      {active !== null && (
        <div className="rounded-lg border border-line bg-surface-2 p-4 text-[14px]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[28px] font-semibold tracking-[0.1em] text-ink">
              {fmtIdx(active)}
            </span>
            <span className="text-muted">
              ออก{" "}
              <strong className="font-mono text-[20px] font-semibold text-ink">
                {freq[active]}
              </strong>{" "}
              ครั้ง
            </span>
          </div>
          <div className="mt-1.5 text-[13px] text-muted">
            งวดล่าสุดที่ออก: {lastSeen[active] || "ไม่พบในข้อมูล"}
          </div>
        </div>
      )}

      <SummaryTable
        modeLabel={config.label}
        totalDraws={stats.totalDraws}
        ranking={ranking}
        top={top}
        cold={cold}
        pad={config.pad}
        total={config.total}
      />
    </section>
  );
}

function MonthYearPicker({
  year,
  month,
  years,
  availableMonths,
  onYearChange,
  onMonthChange,
}: {
  year: number;
  month: number;
  years: number[];
  availableMonths?: number[];
  onYearChange: (y: number) => void;
  onMonthChange: (m: number) => void;
}) {
  const monthsToShow =
    availableMonths && availableMonths.length > 0
      ? availableMonths
      : Array.from({ length: 12 }, (_, i) => i + 1);
  return (
    <div className="flex gap-1">
      <select
        value={month}
        onChange={(e) => onMonthChange(parseInt(e.target.value))}
        className="rounded-md border border-line bg-surface px-2 py-1 text-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-accent/30"
      >
        {monthsToShow.map((m) => (
          <option key={m} value={m}>{THAI_MONTHS[m - 1]}</option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => onYearChange(parseInt(e.target.value))}
        className="rounded-md border border-line bg-surface px-2 py-1 text-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-accent/30"
      >
        {years.map((y) => (
          <option key={y} value={y}>{y + 543}</option>
        ))}
      </select>
    </div>
  );
}

function Grid2D({
  freq,
  active,
  onSelect,
  countFilters,
}: {
  freq: number[];
  active: number | null;
  onSelect: (i: number) => void;
  countFilters: Set<number>;
}) {
  return (
    <div className="grid grid-cols-10 gap-1">
      {Array.from({ length: 100 }, (_, i) => {
        const matches = matchesCountFilter(freq[i], countFilters);
        const c = colorForCount(freq[i]);
        const bg = matches ? c.bg : "rgba(244, 245, 248, 0.5)";
        const isActive = active === i;
        const dim = !matches;
        const useWhite = c.whiteText && matches;
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            style={{ background: bg, opacity: dim ? 0.25 : 1 }}
            className={`group relative flex aspect-square flex-col items-center justify-center rounded-md transition hover:scale-[1.06] ${
              isActive ? "ring-2 ring-accent ring-offset-1 ring-offset-surface" : ""
            }`}
          >
            <span
              className={`block font-mono text-[18px] font-semibold leading-tight ${
                useWhite ? "text-white" : "text-ink"
              }`}
            >
              {i.toString().padStart(2, "0")}
            </span>
            <span
              className={`block font-mono text-[13px] font-semibold leading-tight ${
                useWhite ? "text-white" : "text-ink-2"
              }`}
            >
              {freq[i]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Grid3D({
  freq,
  active,
  onSelect,
  countFilters,
}: {
  freq: number[];
  active: number | null;
  onSelect: (i: number) => void;
  countFilters: Set<number>;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: 10 }, (_, lead) => (
        <div key={lead}>
          <div className="mb-1 flex items-center gap-2">
            <span className="eyebrow">ขึ้นต้นด้วย {lead}</span>
            <span className="h-px flex-1 bg-line-subtle" />
          </div>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 100 }, (_, j) => {
              const idx = lead * 100 + j;
              const matches = matchesCountFilter(freq[idx], countFilters);
              const c = colorForCount(freq[idx]);
              const bg = matches ? c.bg : "rgba(244, 245, 248, 0.5)";
              const isActive = active === idx;
              const trailing = j.toString().padStart(2, "0");
              const useWhite = c.whiteText && matches;
              return (
                <button
                  key={idx}
                  onClick={() => onSelect(idx)}
                  style={{ background: bg, opacity: matches ? 1 : 0.25 }}
                  title={`${idx.toString().padStart(3, "0")} · ${freq[idx]} ครั้ง`}
                  className={`group relative flex aspect-square flex-col items-center justify-center rounded-md transition hover:scale-[1.06] ${
                    isActive ? "ring-2 ring-accent ring-offset-1 ring-offset-surface" : ""
                  }`}
                  aria-label={`${idx.toString().padStart(3, "0")} ออก ${freq[idx]} ครั้ง`}
                >
                  <span
                    className={`block font-mono text-[15px] font-semibold leading-tight ${
                      useWhite ? "text-white" : "text-ink"
                    }`}
                  >
                    {lead}
                    <span className="opacity-70">{trailing}</span>
                  </span>
                  <span
                    className={`block font-mono text-[11px] font-semibold leading-tight ${
                      useWhite ? "text-white" : "text-ink-2"
                    }`}
                  >
                    {freq[idx]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-[11px] text-muted">
        แต่ละช่องคือเลข 3 หลัก รวม 1,000 ค่า • คลิกเพื่อดูรายละเอียด
      </p>
    </div>
  );
}

function SummaryTable({
  modeLabel,
  totalDraws,
  ranking,
  top,
  cold,
  pad,
  total,
}: {
  modeLabel: string;
  totalDraws: number;
  ranking: { idx: number; count: number; lastSeen: string | null }[];
  top: { idx: number; count: number; lastSeen: string | null }[];
  cold: { idx: number; count: number; lastSeen: string | null }[];
  pad: number;
  total: number;
}) {
  const distinctSeen = ranking.length;
  const neverSeen = total - distinctSeen;
  const totalHits = ranking.reduce((a, r) => a + r.count, 0);
  const avg = distinctSeen > 0 ? totalHits / distinctSeen : 0;

  return (
    <div className="space-y-4 pt-1">
      <div className="border-t border-line-subtle pt-4">
        <h4 className="text-[14px] font-semibold tracking-tight2 text-ink">
          ตารางสรุป — {modeLabel}
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="งวดทั้งหมด" value={totalDraws.toString()} />
        <Stat label="เลขที่เคยออก" value={`${distinctSeen} / ${total}`} />
        <Stat label="เลขที่ยังไม่เคยออก" value={neverSeen.toString()} />
        <Stat label="ค่าเฉลี่ยต่อเลข" value={avg.toFixed(1)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RankTable
          title="เลขที่ออกบ่อยสุด"
          rows={top}
          pad={pad}
          totalDraws={totalDraws}
        />
        <RankTable
          title="ห่างหายนานที่สุด"
          rows={cold}
          pad={pad}
          totalDraws={totalDraws}
          showGap
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3.5">
      <div className="eyebrow">{label}</div>
      <div className="mt-1.5 font-mono text-[26px] font-semibold tracking-tight2 text-ink">{value}</div>
    </div>
  );
}

function RankTable({
  title,
  rows,
  pad,
  totalDraws,
  showGap,
}: {
  title: string;
  rows: { idx: number; count: number; lastSeen: string | null }[];
  pad: number;
  totalDraws: number;
  showGap?: boolean;
}) {
  return (
    <div className="rounded-lg border border-line">
      <div className="flex items-center justify-between border-b border-line-subtle px-3.5 py-2.5">
        <h5 className="text-[13px] font-semibold tracking-tight2 text-ink">{title}</h5>
        <span className="text-[11px] text-muted">{rows.length} อันดับ</span>
      </div>
      <table className="w-full text-[14px]">
        <thead>
          <tr className="border-b border-line-subtle">
            <th className="px-3.5 py-2 text-left font-medium text-muted text-[11px] uppercase tracking-[0.04em]">#</th>
            <th className="px-3.5 py-2 text-left font-medium text-muted text-[11px] uppercase tracking-[0.04em]">เลข</th>
            <th className="px-3.5 py-2 text-right font-medium text-muted text-[11px] uppercase tracking-[0.04em]">ครั้ง</th>
            <th className="px-3.5 py-2 text-right font-medium text-muted text-[11px] uppercase tracking-[0.04em]">
              {showGap ? "ออกล่าสุด" : "%"}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.idx} className="border-b border-line-subtle last:border-b-0">
              <td className="px-3.5 py-2.5 text-muted">{i + 1}</td>
              <td className="px-3.5 py-2.5">
                <span className="font-mono text-[20px] font-semibold tracking-[0.08em] text-ink">
                  {r.idx.toString().padStart(pad, "0")}
                </span>
              </td>
              <td className="px-3.5 py-2.5 text-right font-mono text-[17px] font-semibold text-ink">
                {r.count}
              </td>
              <td className="px-3.5 py-2.5 text-right text-muted">
                {showGap
                  ? r.lastSeen || "—"
                  : totalDraws > 0
                    ? `${((r.count / totalDraws) * 100).toFixed(1)}%`
                    : "—"}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="px-3.5 py-3 text-center text-muted" colSpan={4}>
                ยังไม่มีข้อมูล
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
