import type { LottoDraw, StatsSummary } from "./types";
import { runGA, type HistoryEntry } from "./lotteryGA";

export function summarize(draws: LottoDraw[]): StatsSummary {
  const digitFreq = new Array(10).fill(0);
  const back2Freq = new Array(100).fill(0);
  const back2LastSeen: (string | null)[] = new Array(100).fill(null);
  const front3Freq = new Array(1000).fill(0);
  const front3LastSeen: (string | null)[] = new Array(1000).fill(null);
  const back3Freq = new Array(1000).fill(0);
  const back3LastSeen: (string | null)[] = new Array(1000).fill(null);

  const bumpLastSeen = (arr: (string | null)[], idx: number, date: string) => {
    const prev = arr[idx];
    if (!prev || new Date(date) > new Date(prev)) arr[idx] = date;
  };

  const isDigits = (s: string | undefined, len: number) =>
    typeof s === "string" && new RegExp(`^\\d{${len}}$`).test(s);

  for (const d of draws) {
    const numbers: string[] = [
      d.prizes.first,
      ...d.prizes.front3,
      ...d.prizes.back3,
      d.prizes.back2,
    ].filter((s) => typeof s === "string" && /^\d+$/.test(s));
    for (const n of numbers) {
      for (const ch of n) {
        const v = Number(ch);
        if (!isNaN(v)) digitFreq[v]++;
      }
    }
    if (isDigits(d.prizes.back2, 2)) {
      const b2 = parseInt(d.prizes.back2);
      back2Freq[b2]++;
      bumpLastSeen(back2LastSeen, b2, d.date);
    }
    for (const f of d.prizes.front3) {
      if (isDigits(f, 3)) {
        const idx = parseInt(f);
        front3Freq[idx]++;
        bumpLastSeen(front3LastSeen, idx, d.date);
      }
    }
    for (const b of d.prizes.back3) {
      if (isDigits(b, 3)) {
        const idx = parseInt(b);
        back3Freq[idx]++;
        bumpLastSeen(back3LastSeen, idx, d.date);
      }
    }
  }
  return {
    digitFreq,
    back2Freq,
    back2LastSeen,
    front3Freq,
    front3LastSeen,
    back3Freq,
    back3LastSeen,
    totalDraws: draws.length,
  };
}

export function filterByMonths(draws: LottoDraw[], months: number): LottoDraw[] {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return draws.filter((d) => new Date(d.date) >= cutoff);
}

export function digitFreqByPosition(
  draws: LottoDraw[],
  position: "front3" | "back3" | "back2",
): number[] {
  const freq = new Array(10).fill(0);
  for (const d of draws) {
    const arr =
      position === "back2"
        ? [d.prizes.back2]
        : position === "front3"
          ? d.prizes.front3
          : d.prizes.back3;
    for (const n of arr) {
      for (const ch of n || "") {
        const v = Number(ch);
        if (!isNaN(v)) freq[v]++;
      }
    }
  }
  return freq;
}

export type PredictKind = "back2" | "front3" | "back3";

export interface Prediction {
  number: string;
  confidence: number;
  reason: string;
}

/**
 * ทำนายเลขงวดหน้าสำหรับตำแหน่งใดตำแหน่งหนึ่ง:
 *   - back2  — เลขท้าย 2 ตัว (1 ค่าต่องวด)
 *   - front3 — 3 ตัวหน้า (2 ค่าต่องวด)
 *   - back3  — 3 ตัวหลัง (2 ค่าต่องวด)
 *
 * ใช้ GA วิวัฒนาการเป็นหลัก, fallback เป็น gap+rarity เมื่อข้อมูลน้อยกว่า 5 entries
 */
export function predictNext(
  draws: LottoDraw[],
  count = 5,
  kind: PredictKind = "back2",
): Prediction[] {
  const digitCount = kind === "back2" ? 2 : 3;
  const history: HistoryEntry[] = [];
  for (const d of draws) {
    if (kind === "back2") {
      if (!/^\d{2}$/.test(d.prizes.back2)) continue;
      history.push({ digits: d.prizes.back2.split("").map(Number), date: d.date });
    } else {
      const arr = kind === "front3" ? d.prizes.front3 : d.prizes.back3;
      for (const n of arr) {
        if (!/^\d{3}$/.test(n)) continue;
        history.push({ digits: n.split("").map(Number), date: d.date });
      }
    }
  }

  // history น้อยเกินไป — fallback เป็น gap-based
  if (history.length < 5) {
    const summary = summarize(draws);
    const freqArr =
      kind === "back2" ? summary.back2Freq
      : kind === "front3" ? summary.front3Freq
      : summary.back3Freq;
    const lastSeenArr =
      kind === "back2" ? summary.back2LastSeen
      : kind === "front3" ? summary.front3LastSeen
      : summary.back3LastSeen;

    const total = freqArr.reduce((a, b) => a + b, 0) || 1;
    const scored = freqArr.map((freq, idx) => {
      const lastSeen = lastSeenArr[idx];
      const days = lastSeen ? (Date.now() - new Date(lastSeen).getTime()) / 86_400_000 : 9999;
      const gap = Math.min(1, days / 365);
      const rarity = 1 - (freq / total) * (kind === "back2" ? 100 : 1000);
      const score = (rarity * 0.4 + gap * 0.6) * 100;
      return { idx, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, count).map((s) => ({
      number: s.idx.toString().padStart(digitCount, "0"),
      confidence: Math.round(Math.min(95, 35 + s.score * 0.5)),
      reason: `ข้อมูลย้อนหลังยังน้อย — เลือกจากความห่างและความถี่`,
    }));
  }

  const ga = runGA({
    digitCount,
    history,
    config: {
      populationSize: kind === "back2" ? 80 : 120,
      generations: kind === "back2" ? 50 : 60,
      topResults: count,
    },
  });

  const positionLabel =
    kind === "back2" ? "ท้าย 2 ตัว" : kind === "front3" ? "3 ตัวหน้า" : "3 ตัวหลัง";

  return ga.recommendations.map((r) => ({
    number: r.asString,
    confidence: Math.round(Math.min(95, 35 + r.fitness * 60)),
    reason: `วิวัฒนาการ ${positionLabel} จากสถิติ ${history.length} entry — fitness ${r.fitness.toFixed(2)} (ตำแหน่งหลัก, ผลรวม, สมดุลคู่/คี่, ความใหม่)`,
  }));
}

/** Mock fallback if external API is unreachable. */
export function mockDraws(): LottoDraw[] {
  const out: LottoDraw[] = [];
  const start = new Date();
  start.setDate(1);
  for (let i = 0; i < 24; i++) {
    const d = new Date(start);
    d.setMonth(start.getMonth() - i);
    const seed = (i * 7919) % 1_000_000;
    const six = seed.toString().padStart(6, "0");
    out.push({
      date: d.toISOString().slice(0, 10),
      prizes: {
        first: six,
        front3: [
          ((seed * 3) % 1000).toString().padStart(3, "0"),
          ((seed * 5) % 1000).toString().padStart(3, "0"),
        ],
        back3: [
          ((seed * 7) % 1000).toString().padStart(3, "0"),
          ((seed * 11) % 1000).toString().padStart(3, "0"),
        ],
        back2: ((seed * 13) % 100).toString().padStart(2, "0"),
      },
    });
  }
  return out;
}
