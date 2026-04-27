"use client";

import { useState } from "react";
import Link from "next/link";
import ScienceSelector from "@/components/ScienceSelector";
import NumberSets from "@/components/NumberSets";
import PredictionLog from "@/components/PredictionLog";
import Leaderboard from "@/components/Leaderboard";
import { Science, NumberSet, UserInput, StatsSummary, LottoDraw } from "@/lib/types";
import { generateAndRank } from "@/lib/lottery";
import { saveLog } from "@/lib/predictionLog";

function formatThaiDate(iso: string): string {
  const months = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

export default function HomePage() {
  const [sciences, setSciences] = useState<Science[]>(["math"]);
  const [user, setUser] = useState<UserInput>({});
  const [count, setCount] = useState(6);
  const [sets, setSets] = useState<NumberSet[]>([]);
  const [latest, setLatest] = useState<LottoDraw | null>(null);
  const [loading, setLoading] = useState(false);
  const [reasoning, setReasoning] = useState(false);
  const [logRefreshKey, setLogRefreshKey] = useState(0);

  async function fetchHistoryAndStats(): Promise<{ stats?: StatsSummary; draws?: LottoDraw[] }> {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 30000);
      const r = await fetch("/api/lotto?mode=history&limit=0&minYear=2550", {
        cache: "no-store",
        signal: ctl.signal,
      });
      clearTimeout(timer);
      if (!r.ok) return {};
      const j = await r.json();
      return { stats: j.stats, draws: j.draws };
    } catch {
      return {};
    }
  }

  async function attachReasons(picked: NumberSet[]) {
    setReasoning(true);
    try {
      const r = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sets: picked, sciences, user }),
      });
      const j = await r.json();
      if (Array.isArray(j.reasons)) {
        setSets(picked.map((s, i) => ({ ...s, reason: j.reasons[i] })));
      }
    } catch {}
    finally {
      setReasoning(false);
    }
  }

  async function handleGenerate() {
    if (sciences.length === 0) {
      alert("กรุณาเลือกอย่างน้อย 1 ศาสตร์");
      return;
    }
    setLoading(true);
    setSets([]);
    const { stats, draws } = await fetchHistoryAndStats();
    const refDraw = draws && draws.length > 0 ? draws[0] : null;
    setLatest(refDraw);
    const picked = generateAndRank(count, sciences, user, stats, draws);
    setSets(picked);
    setLoading(false);
    saveLog({ sciences, count, sets: picked, refDate: refDraw?.date });
    setLogRefreshKey((k) => k + 1);
    void attachReasons(picked);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <div className="eyebrow">หน้าหลัก</div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight3 text-ink">
          สุ่มเลขสลากกินแบ่ง
        </h1>
        <p className="text-[14px] text-muted">
          เลือกศาสตร์ที่คุณเชื่อมั่น แล้วให้ระบบคัดเลขที่เข้ากับคุณที่สุด
        </p>
      </section>

      <div className="rounded-lg border border-line bg-surface-2 px-4 py-3 text-[12.5px] text-ink-2 flex flex-col sm:flex-row sm:items-center gap-1.5">
        <span className="font-medium text-ink">หน้านี้แนะนำอะไร?</span>
        <span className="text-muted">สุ่ม <strong className="text-ink-2">ชุดเลข 6 หลักครบทุกรางวัล</strong> — เลขท้าย 2 ตัวเป็นผลที่ตัดออกมาจาก 6 หลัก ถ้าอยากได้เลขท้าย 2 ตัวโดยเฉพาะ ดูได้ที่</span>
        <Link
          href="/stats#predict-back2"
          className="text-accent hover:underline font-medium whitespace-nowrap"
        >
          หน้าสถิติ →
        </Link>
      </div>

      <ScienceSelector
        selected={sciences}
        onSelectedChange={setSciences}
        user={user}
        onUserChange={setUser}
      />

      <div className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="eyebrow">จำนวนชุด</span>
          <div className="flex gap-1">
            {[3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`h-8 w-9 rounded-md border text-[13px] font-medium transition ${
                  count === n
                    ? "border-accent bg-accent text-white"
                    : "border-line bg-surface text-ink-2 hover:bg-surface-2"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <button
          className="btn-primary btn-lg w-full md:w-auto"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "กำลังสุ่ม..." : `สุ่ม ${count} ชุดเลขมงคล`}
        </button>
      </div>

      {latest && sets.length > 0 && (
        <section className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="eyebrow">งวดล่าสุดที่ใช้อ้างอิง</div>
            <div className="mt-0.5 text-[13.5px] text-ink-2">
              {formatThaiDate(latest.date)}
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <div className="text-[10px] text-muted">รางวัลที่ 1</div>
              <div className="num-md tracking-tight2">{latest.prizes.first || "—"}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted">3 ตัวหน้า</div>
              <div className="num-sm">{latest.prizes.front3.join(" · ") || "—"}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted">3 ตัวหลัง</div>
              <div className="num-sm">{latest.prizes.back3.join(" · ") || "—"}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted">2 ตัวท้าย</div>
              <div className="num-md">{latest.prizes.back2 || "—"}</div>
            </div>
          </div>
        </section>
      )}

      <NumberSets sets={sets} loadingReason={reasoning} />

      <PredictionLog refreshKey={logRefreshKey} />

      <Leaderboard />
    </div>
  );
}
