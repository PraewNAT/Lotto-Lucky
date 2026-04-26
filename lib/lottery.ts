import type { NumberSet, Science, StatsSummary, UserInput } from "./types";
import { astrologyScore } from "./astrology";
import { numerologyScore } from "./numerology";
import { fengshuiScore } from "./fengshui";

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

export function generateAndRank(
  count: number,
  sciences: Science[],
  user: UserInput,
  stats?: StatsSummary,
): NumberSet[] {
  const pool = Math.max(count * 3, 9);
  const candidates: NumberSet[] = [];
  const seen = new Set<string>();
  while (candidates.length < pool) {
    const num = randomSixDigit();
    if (seen.has(num)) continue;
    seen.add(num);
    const { score, breakdown } = scoreNumber(num, sciences, user, stats);
    candidates.push({ ...splitParts(num), score, breakdown });
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, count);
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
