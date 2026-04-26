"use client";

import { useState } from "react";
import ScienceSelector from "@/components/ScienceSelector";
import NumberSets from "@/components/NumberSets";
import { Science, NumberSet, UserInput, StatsSummary } from "@/lib/types";
import { generateAndRank } from "@/lib/lottery";

export default function HomePage() {
  const [sciences, setSciences] = useState<Science[]>(["math"]);
  const [user, setUser] = useState<UserInput>({});
  const [count, setCount] = useState(4);
  const [sets, setSets] = useState<NumberSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [reasoning, setReasoning] = useState(false);

  async function fetchStats(): Promise<StatsSummary | undefined> {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 6000);
      const r = await fetch("/api/lotto?mode=history&limit=24", {
        cache: "no-store",
        signal: ctl.signal,
      });
      clearTimeout(timer);
      if (!r.ok) return undefined;
      const j = await r.json();
      return j.stats;
    } catch {
      return undefined;
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
    const stats = await fetchStats();
    const picked = generateAndRank(count, sciences, user, stats);
    setSets(picked);
    setLoading(false);
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

      <NumberSets sets={sets} loadingReason={reasoning} />
    </div>
  );
}
