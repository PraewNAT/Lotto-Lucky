import type {
  LottoDraw,
  NumberSet,
  NumberSetSignal,
  Science,
  StatsSummary,
  UserInput,
} from "./types";
import { astrologyScore } from "./astrology";
import { numerologyScore } from "./numerology";
import { fengshuiScore } from "./fengshui";
import { runGA, type HistoryEntry } from "./lotteryGA";

export function pad6(n: number): string {
  return n.toString().padStart(6, "0");
}

export function randomSixDigit(): string {
  return pad6(Math.floor(Math.random() * 1_000_000));
}

export function splitParts(num: string) {
  return {
    number: num,
    front3: num.slice(0, 3),
    back3: num.slice(-3),
    back2: num.slice(-2),
  };
}

export function digitSum(s: string): number {
  return s.split("").reduce((a, c) => a + Number(c || 0), 0);
}

export function reduceToSingle(n: number): number {
  while (n > 9) n = n.toString().split("").reduce((a, c) => a + Number(c), 0);
  return n;
}

/** Math science: rewards balanced digit distribution + non-degenerate patterns. */
function mathScore(num: string, stats?: StatsSummary): number {
  const digits = num.split("").map(Number);
  const counts: Record<number, number> = {};
  digits.forEach((d) => (counts[d] = (counts[d] || 0) + 1));
  const max = Math.max(...Object.values(counts));
  // diversity: prefer 4–6 unique digits
  const unique = Object.keys(counts).length;
  const diversity = unique >= 4 ? 25 : unique * 5;
  // anti-monotone: penalize all same / 5+ repeats
  const repeatPenalty = max >= 5 ? -20 : max === 4 ? -8 : 0;
  // golden ratio of digit sum near 27 (mean of 0..54)
  const sum = digitSum(num);
  const sumScore = 25 - Math.min(25, Math.abs(sum - 27));
  // statistical: digit frequency from history (rare digits get small boost)
  let statBoost = 0;
  if (stats) {
    const total = stats.digitFreq.reduce((a, b) => a + b, 0) || 1;
    statBoost = digits.reduce((acc, d) => {
      const p = stats.digitFreq[d] / total;
      return acc + (0.1 - p) * 30;
    }, 0);
  }
  return Math.max(0, Math.min(100, 30 + diversity + repeatPenalty + sumScore + statBoost));
}

export function scoreNumber(
  num: string,
  sciences: Science[],
  user: UserInput,
  stats?: StatsSummary,
): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};
  if (sciences.includes("math")) breakdown.math = mathScore(num, stats);
  if (sciences.includes("astro")) breakdown.astro = astrologyScore(num, user);
  if (sciences.includes("numero")) breakdown.numero = numerologyScore(num, user);
  if (sciences.includes("fengshui")) breakdown.fengshui = fengshuiScore(num, user);
  // statistical signal applied to all when stats available
  if (stats) {
    const back2 = Number(num.slice(-2));
    const lastSeen = stats.back2LastSeen[back2];
    if (lastSeen) {
      const days = Math.max(0, (Date.now() - new Date(lastSeen).getTime()) / 86_400_000);
      // longer absence = higher boost (cap at 30)
      breakdown.gap = Math.min(30, days / 20);
    } else {
      breakdown.gap = 30;
    }
  }
  const values = Object.values(breakdown);
  const avg = values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
  return { score: Math.round(avg * 10) / 10, breakdown };
}

/** แปลงประวัติงวดเป็น history สำหรับ GA (รางวัลที่ 1, 6 หลัก) */
function drawsToHistory6(draws: LottoDraw[]): HistoryEntry[] {
  const out: HistoryEntry[] = [];
  for (const d of draws) {
    if (!/^\d{6}$/.test(d.prizes.first)) continue;
    out.push({
      digits: d.prizes.first.split("").map(Number),
      date: d.date,
    });
  }
  return out;
}

/** สร้าง insight ชิปสำหรับเลขแต่ละชุด — deterministic ไม่ใช้ LLM */
function computeSignals(
  set: NumberSet,
  user: UserInput,
  sciences: Science[],
  stats?: StatsSummary,
): NumberSetSignal[] {
  const signals: NumberSetSignal[] = [];

  // 1) Gap — เลขท้าย 2 ตัว ห่างหายไปนานแค่ไหน
  if (stats) {
    const b2 = parseInt(set.back2, 10);
    if (!isNaN(b2)) {
      const lastSeen = stats.back2LastSeen[b2];
      if (lastSeen) {
        const days = Math.round(
          (Date.now() - new Date(lastSeen).getTime()) / 86_400_000,
        );
        if (days >= 180) {
          const months = Math.floor(days / 30);
          signals.push({
            kind: "gap",
            tone: "positive",
            text: `ท้าย 2 (${set.back2}) ห่างหาย ${months} เดือน`,
          });
        } else if (days <= 14) {
          signals.push({
            kind: "gap",
            tone: "warn",
            text: `ท้าย 2 (${set.back2}) เพิ่งออกเมื่อ ${days} วันก่อน`,
          });
        }
      } else {
        signals.push({
          kind: "gap",
          tone: "positive",
          text: `ท้าย 2 (${set.back2}) ยังไม่เคยออกในข้อมูล`,
        });
      }
    }
  }

  // 2) Sum balance — ผลรวมหลัก (mean ของ 6 หลักคือ 27)
  const sum = digitSum(set.number);
  if (Math.abs(sum - 27) <= 4) {
    signals.push({
      kind: "sum",
      tone: "positive",
      text: `ผลรวมหลักสมดุล (${sum})`,
    });
  } else if (sum < 12 || sum > 42) {
    signals.push({
      kind: "sum",
      tone: "warn",
      text: `ผลรวมหลักเอียง (${sum})`,
    });
  }

  // 3) Parity — สัดส่วนคู่/คี่
  const evens = set.number.split("").filter((d) => Number(d) % 2 === 0).length;
  if (evens === 3) {
    signals.push({ kind: "parity", tone: "positive", text: "คู่/คี่ลงตัว 3:3" });
  } else if (evens === 0 || evens === 6) {
    signals.push({
      kind: "parity",
      tone: "warn",
      text: evens === 0 ? "เลขคี่ทั้งหมด" : "เลขคู่ทั้งหมด",
    });
  }

  // 4) Diversity — จำนวนเลขไม่ซ้ำ
  const unique = new Set(set.number.split("")).size;
  if (unique >= 5) {
    signals.push({
      kind: "diversity",
      tone: "positive",
      text: `เลขหลากหลาย ${unique} ค่าต่าง`,
    });
  } else if (unique <= 2) {
    signals.push({
      kind: "diversity",
      tone: "warn",
      text: `เลขซ้ำเยอะ (${unique} ค่าต่าง)`,
    });
  }

  // 5) Personal match — ตรงดวงผู้ใช้
  const hasPersonal = !!(user.birthDate || user.fullName || user.facingDirection);
  if (hasPersonal) {
    if (sciences.includes("numero") && (set.breakdown.numero ?? 0) >= 70) {
      signals.push({
        kind: "personal",
        tone: "positive",
        text: `เลขศาสตร์ตรงดวง (${Math.round(set.breakdown.numero)})`,
      });
    }
    if (sciences.includes("astro") && (set.breakdown.astro ?? 0) >= 70) {
      signals.push({
        kind: "personal",
        tone: "positive",
        text: `โหราฯ ตรงพลังวันเกิด (${Math.round(set.breakdown.astro)})`,
      });
    }
    if (sciences.includes("fengshui") && (set.breakdown.fengshui ?? 0) >= 70) {
      signals.push({
        kind: "personal",
        tone: "positive",
        text: `ฮวงจุ้ยเสริมทิศคุณ (${Math.round(set.breakdown.fengshui)})`,
      });
    }
  }

  // 6) Back3 freshness — ท้าย 3 ตัวห่างหายเกิน 2 ปี
  if (stats) {
    const b3 = parseInt(set.back3, 10);
    if (!isNaN(b3)) {
      const seen = stats.back3LastSeen[b3];
      if (seen) {
        const days = (Date.now() - new Date(seen).getTime()) / 86_400_000;
        if (days >= 730) {
          signals.push({
            kind: "freq",
            tone: "positive",
            text: `ท้าย 3 (${set.back3}) ไม่ออกมาเกิน 2 ปี`,
          });
        }
      } else {
        signals.push({
          kind: "freq",
          tone: "neutral",
          text: `ท้าย 3 (${set.back3}) ไม่เคยออกในข้อมูล`,
        });
      }
    }
  }

  return signals;
}

/** ในแต่ละ batch แท็กชุดที่เด่นที่สุดในแต่ละมิติ — แต่ละชุดได้มาก 1 highlight */
function assignHighlights(sets: NumberSet[], sciences: Science[]): void {
  if (sets.length === 0) return;

  // ลำดับความสำคัญ: dimension ไหนพิจารณาก่อน ชุดที่ชนะจะได้ highlight นั้น
  const dimensions: Array<{ key: string; label: string; min: number }> = [
    { key: "numero", label: "เด่นด้านเลขศาสตร์", min: 60 },
    { key: "astro", label: "เด่นด้านโหราศาสตร์", min: 60 },
    { key: "fengshui", label: "เด่นด้านฮวงจุ้ย", min: 60 },
    { key: "gap", label: "เลขห่างหายมากที่สุด", min: 15 },
    { key: "math", label: "เด่นด้านสมดุลตัวเลข", min: 60 },
  ];

  // เพิ่มเฉพาะ dimension ที่ผู้ใช้เลือก (math/astro/numero/fengshui) + gap (เสมอถ้ามี stats)
  for (const dim of dimensions) {
    if (
      ["math", "astro", "numero", "fengshui"].includes(dim.key) &&
      !sciences.includes(dim.key as Science)
    ) {
      continue;
    }
    let bestIdx = -1;
    let bestVal = -Infinity;
    sets.forEach((s, i) => {
      if (s.highlight) return; // จับจองไปแล้ว
      const v = s.breakdown[dim.key];
      if (typeof v !== "number") return;
      if (v > bestVal && v >= dim.min) {
        bestVal = v;
        bestIdx = i;
      }
    });
    if (bestIdx >= 0) sets[bestIdx].highlight = dim.label;
  }

  // ชุดที่ score สูงสุดและยังไม่มี highlight → ติด "คะแนนรวมสูงสุด"
  let topScoreIdx = -1;
  let topScore = -Infinity;
  sets.forEach((s, i) => {
    if (s.score > topScore) {
      topScore = s.score;
      topScoreIdx = i;
    }
  });
  if (topScoreIdx >= 0 && !sets[topScoreIdx].highlight) {
    sets[topScoreIdx].highlight = "คะแนนรวมสูงสุด";
  }
}

export function generateAndRank(
  count: number,
  sciences: Science[],
  user: UserInput,
  stats?: StatsSummary,
  draws?: LottoDraw[],
): NumberSet[] {
  const targetPool = Math.max(count * 3, 9);
  const seen = new Set<string>();
  const pool: string[] = [];

  // ใช้ GA evolve candidate pool จากประวัติ (ถ้ามีพอ)
  const history6 = draws ? drawsToHistory6(draws) : [];
  if (history6.length >= 5) {
    const ga = runGA({
      digitCount: 6,
      history: history6,
      config: {
        populationSize: Math.max(targetPool * 4, 60),
        generations: 40,
        topResults: targetPool,
      },
    });
    for (const r of ga.recommendations) {
      if (!seen.has(r.asString)) {
        seen.add(r.asString);
        pool.push(r.asString);
      }
    }
  }

  // เติม pool ด้วยการสุ่มถ้ายังไม่ครบ (หรือไม่มี history เลย)
  while (pool.length < targetPool) {
    const num = randomSixDigit();
    if (seen.has(num)) continue;
    seen.add(num);
    pool.push(num);
  }

  // ใช้ scoreNumber (math/astro/numero/fengshui + gap) จัดอันดับสุดท้าย
  const candidates: NumberSet[] = pool.map((num) => {
    const { score, breakdown } = scoreNumber(num, sciences, user, stats);
    return { ...splitParts(num), score, breakdown };
  });
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, count);

  // เติม signals ต่อชุด + highlight แบบเปรียบเทียบในกลุ่ม
  for (const s of top) {
    s.signals = computeSignals(s, user, sciences, stats);
  }
  assignHighlights(top, sciences);

  return top;
}

export function fallbackReason(set: NumberSet, sciences: Science[]): string {
  const parts: string[] = [];
  if (sciences.includes("math")) parts.push(`ผลรวมหลัก ${digitSum(set.number)} เข้าหลักความสมดุล`);
  if (sciences.includes("astro")) parts.push(`พลังของวันสนับสนุนเลขท้าย ${set.back2}`);
  if (sciences.includes("numero")) parts.push(`เลขชะตาเลข ${reduceToSingle(digitSum(set.number))} เป็นเลขเด่น`);
  if (sciences.includes("fengshui")) parts.push(`ทิศและธาตุของคุณกลมกลืนกับชุดนี้`);
  if (parts.length === 0) parts.push("ชุดนี้มีโครงเลขที่สมดุลและน่าจับตามอง");
  return parts.join(" ") + ".";
}
