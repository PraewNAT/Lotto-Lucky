import type { LottoDraw, StatsSummary } from "./types";

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

export function predictNext(draws: LottoDraw[], count = 5): { number: string; confidence: number; reason: string }[] {
  const summary = summarize(draws);
  const total = summary.back2Freq.reduce((a, b) => a + b, 0) || 1;
  const scored = summary.back2Freq.map((freq, idx) => {
    const lastSeen = summary.back2LastSeen[idx];
    const days = lastSeen ? (Date.now() - new Date(lastSeen).getTime()) / 86_400_000 : 9999;
    const gap = Math.min(1, days / 365);
    const rarity = 1 - freq / total * 100;
    const score = (rarity * 0.4 + gap * 0.6) * 100;
    return { idx, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map((s) => ({
    number: s.idx.toString().padStart(2, "0"),
    confidence: Math.round(Math.min(95, 35 + s.score * 0.5)),
    reason: `เลข ${s.idx.toString().padStart(2, "0")} ห่างหายไปนาน และมีความถี่ต่ำกว่าค่าเฉลี่ย`,
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
