"use client";

import { useState } from "react";

interface Result {
  six: string;
  three: string;
  two: string;
  symbols: { symbol: string; numbers: string; meaning: string }[];
  summary: string;
}

export default function DreamAnalyzer() {
  const [dream, setDream] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function analyze() {
    setError("");
    if (dream.trim().length < 5) {
      setError("กรุณาเล่าความฝันให้ละเอียดอีกหน่อย");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/dream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dream }),
      });
      const j = await r.json();
      if (!r.ok) setError(j.error || "วิเคราะห์ไม่สำเร็จ");
      else setResult(j as Result);
    } catch {
      setError("เครือข่ายขัดข้อง ลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="card space-y-3">
        <label className="block">
          <span className="eyebrow mb-2 block">เล่าความฝันของคุณ</span>
          <textarea
            value={dream}
            onChange={(e) => setDream(e.target.value)}
            rows={5}
            placeholder="เช่น ฝันว่าเห็นช้างสีขาวเดินผ่านบ้าน แล้วมีน้ำท่วมไหลมาเต็มถนน..."
            className="input resize-none"
          />
        </label>
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-muted">{dream.length} ตัวอักษร</span>
          <button className="btn-primary" onClick={analyze} disabled={loading}>
            {loading ? "กำลังตีความ..." : "วิเคราะห์ฝัน"}
          </button>
        </div>
        {error && <p className="text-[13px] text-danger">{error}</p>}
      </div>

      {result && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <div className="text-center rounded-lg border border-line py-6">
              <div className="eyebrow mb-1.5">เลข 6 หลัก</div>
              <div className="num-hero">{result.six}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface-2 py-4 text-center">
                <div className="eyebrow mb-1.5">3 หลัก</div>
                <div className="num-md">{result.three}</div>
              </div>
              <div className="rounded-lg bg-surface-2 py-4 text-center">
                <div className="eyebrow mb-1.5">2 หลัก</div>
                <div className="num-md">{result.two}</div>
              </div>
            </div>
          </div>

          {result.summary && (
            <div className="card">
              <h3 className="eyebrow mb-2">สรุปการตีความ</h3>
              <p className="text-[14px] leading-relaxed text-ink-2">{result.summary}</p>
            </div>
          )}

          {result.symbols.length > 0 && (
            <div className="card">
              <h3 className="eyebrow mb-3">สัญลักษณ์ในฝัน</h3>
              <ul className="divide-y divide-line-subtle">
                {result.symbols.map((s, i) => (
                  <li key={i} className="py-3">
                    <div className="flex items-center justify-between">
                      <strong className="text-[14px] font-medium text-ink">{s.symbol}</strong>
                      <span className="num-sm text-accent-text">{s.numbers}</span>
                    </div>
                    <p className="mt-1 text-[13px] text-muted">{s.meaning}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
