"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LottoDraw } from "@/lib/types";
import { digitFreqByPosition, filterByMonths } from "@/lib/stats";

interface Props {
  draws: LottoDraw[];
}

const POSITIONS = [
  { id: "front3", label: "3 ตัวหน้า" },
  { id: "back3", label: "3 ตัวหลัง" },
  { id: "back2", label: "2 ตัวท้าย" },
] as const;

const MONTHS = [3, 6, 12, 24] as const;

export default function StatsChart({ draws }: Props) {
  const [pos, setPos] = useState<(typeof POSITIONS)[number]["id"]>("back2");
  const [months, setMonths] = useState<(typeof MONTHS)[number]>(12);

  const data = useMemo(() => {
    const filtered = filterByMonths(draws, months);
    const freq = digitFreqByPosition(filtered, pos);
    return freq.map((v, i) => ({ digit: i.toString(), count: v }));
  }, [draws, pos, months]);

  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-semibold tracking-tight2 text-ink">
            ความถี่ตัวเลข 0–9
          </h3>
          <p className="mt-0.5 text-[12px] text-muted">
            กราฟแท่งของแต่ละหลักตามช่วงเวลา
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-surface-2 p-1">
          {MONTHS.map((m) => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={`rounded-md px-2.5 py-1.5 text-[12px] font-medium transition ${
                months === m ? "bg-surface text-ink shadow-raised" : "text-muted hover:text-ink"
              }`}
            >
              {m} ด.
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {POSITIONS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPos(p.id)}
            className={`chip ${pos === p.id ? "chip-on" : "chip-off"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EFF0F3" />
            <XAxis dataKey="digit" stroke="#6B6F76" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#6B6F76" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(94, 106, 210, 0.06)" }}
              contentStyle={{
                background: "#FFFFFF",
                border: "1px solid #E6E7EB",
                borderRadius: 8,
                color: "#08090A",
                boxShadow: "0 8px 24px rgba(8, 9, 10, 0.08)",
                fontSize: 13,
              }}
            />
            <Bar dataKey="count" fill="#5E6AD2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
