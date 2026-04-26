"use client";

import { useEffect, useMemo, useState } from "react";
import { dailyNumbersFromBirth } from "@/lib/astrology";
import { elementFromYear } from "@/lib/fengshui";

const KEY = "lotto-lucky:birthDate";

export default function DailyHoroscope() {
  const [birth, setBirth] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem(KEY);
    if (v) setBirth(v);
    setLoaded(true);
  }, []);

  function save(d: string) {
    setBirth(d);
    if (d) localStorage.setItem(KEY, d);
    else localStorage.removeItem(KEY);
  }

  const result = useMemo(() => (birth ? dailyNumbersFromBirth(birth) : null), [birth]);
  const element = useMemo(
    () => (birth ? elementFromYear(new Date(birth).getFullYear()) : null),
    [birth],
  );

  const today = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-5">
      <div className="card">
        <label className="block">
          <span className="eyebrow mb-2 block">วันเดือนปีเกิดของคุณ</span>
          <input
            type="date"
            className="input md:max-w-xs"
            value={birth}
            onChange={(e) => save(e.target.value)}
          />
        </label>
        <p className="mt-2 text-[12px] text-muted">เก็บไว้ในเครื่องคุณเท่านั้น</p>
        {loaded && !birth && (
          <p className="mt-3 text-[13px] text-ink-2">
            กรอกวันเกิดเพื่อดูเลขมงคลประจำวันของคุณ
          </p>
        )}
      </div>

      {birth && result && (
        <article className="card space-y-5">
          <header className="flex items-center justify-between">
            <div>
              <div className="eyebrow">วันนี้</div>
              <div className="mt-1 text-[15px] font-medium text-ink">{today}</div>
            </div>
            {element && (
              <span className="chip chip-on">ธาตุ {element}</span>
            )}
          </header>

          <div>
            <div className="eyebrow mb-2">เลขท้าย 2 ตัวแนะนำ</div>
            <div className="flex flex-wrap gap-2">
              {result.back2.map((n, i) => (
                <span key={i} className="rounded-lg bg-surface-2 px-3.5 py-2 num-md">
                  {n}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="eyebrow mb-2">เลขท้าย 3 ตัวแนะนำ</div>
            <div className="flex flex-wrap gap-2">
              {result.back3.map((n, i) => (
                <span key={i} className="rounded-lg bg-surface-2 px-3.5 py-2 num-md">
                  {n}
                </span>
              ))}
            </div>
          </div>

          <p className="text-[14px] leading-relaxed text-ink-2">{result.reason}</p>
          <p className="text-[12px] text-muted">อัปเดตอัตโนมัติทุกเที่ยงคืน</p>
        </article>
      )}
    </div>
  );
}
