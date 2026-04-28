// เลขศาสตร์ scoring — combines five Thai-numerology signals into a 0–100 score:
//
//   1. ผลรวมมงคล      ผลรวม 6 หลักตรงกับ AUSPICIOUS_SUMS หรือไม่
//   2. ท้าย 2 ตัว      ความหมายของ 2 หลักท้ายจาก TWO_DIGIT_MEANINGS
//   3. เลขชะตาตรงตัว    ผลรวม-ย่อย่อตรงกับเลขชะตา/เลขชื่อของผู้ใช้
//   4. เลขเด่นวันเกิด    หลักของชุดอยู่ในชุดเลขเด่นประจำวันเกิด
//   5. กาลกิณี         ลงโทษถ้าใช้เลขที่ห้ามตามวันเกิดเยอะเกินไป
//
// Output is clamped to [0, 100] like the other science scorers.
//
// See lib/numerologyData.ts for the underlying tables (digit meanings,
// auspicious sums, kaalakini, day-of-week auspicious digits).

import type { UserInput } from "./types";
import { digitSum, reduceToSingle } from "./lottery";
import {
  isAuspiciousSum,
  meaningOfTwoDigit,
  singleDigitTone,
  kaalakiniForBirth,
  auspiciousDigitsForBirth,
  DIGIT_MEANINGS,
  AUSPICIOUS_SINGLES,
} from "./numerologyData";

// ────────────────────────────────────────────────────────────
// ชื่อ → เลข (Thai letter → digit map, classical numerology)
// ────────────────────────────────────────────────────────────
const THAI_LETTER_MAP: Record<string, number> = {
  "ก": 1, "ข": 2, "ค": 3, "ฆ": 4, "ง": 5,
  "จ": 6, "ฉ": 7, "ช": 8, "ซ": 9, "ญ": 10,
  "ด": 4, "ต": 6, "ถ": 7, "ท": 8, "ธ": 9, "น": 5,
  "บ": 6, "ป": 5, "ผ": 7, "ฝ": 9, "พ": 8, "ฟ": 9, "ภ": 8, "ม": 5,
  "ย": 1, "ร": 2, "ล": 3, "ว": 6, "ส": 7, "ห": 8, "อ": 1, "ฮ": 9,
};

export function nameNumber(name?: string): number | null {
  if (!name) return null;
  const sum = [...name].reduce((acc, ch) => acc + (THAI_LETTER_MAP[ch] || 0), 0);
  return sum > 0 ? reduceToSingle(sum) : null;
}

export function lifePathNumber(birthDate?: string): number | null {
  if (!birthDate) return null;
  const compact = birthDate.replace(/[^0-9]/g, "");
  if (!compact) return null;
  return reduceToSingle(digitSum(compact));
}

// ────────────────────────────────────────────────────────────
// Sub-scores — each returns a 0..100 component, combined with weights below
// ────────────────────────────────────────────────────────────

/** 6-digit total alignment with auspicious sums + reduce-to-single tone */
function sumScore(num: string): number {
  const sum = digitSum(num);
  let s = 40;
  if (isAuspiciousSum(sum)) s += 35;
  const reduced = reduceToSingle(sum);
  const tone = singleDigitTone(reduced);
  if (tone === "auspicious") s += 15;
  else if (tone === "warn") s -= 15;
  return Math.max(0, Math.min(100, s));
}

/** Back-2 meaning — uses the canonical 10..30 table when applicable */
function back2Score(num: string): number {
  const b2 = parseInt(num.slice(-2), 10);
  if (isNaN(b2)) return 50;
  const meaning = meaningOfTwoDigit(b2);
  if (meaning) {
    if (meaning.tone === "auspicious") return 85;
    if (meaning.tone === "warn") return 35;
    return 60;
  }
  // For 31..99 fall back to the reduced single tone
  const reduced = reduceToSingle(b2);
  const tone = singleDigitTone(reduced);
  if (tone === "auspicious") return 70;
  if (tone === "warn") return 40;
  return 55;
}

/** Personal alignment — life-path / name number match against the set's reduced sum */
function personalScore(num: string, user: UserInput): number {
  const name = nameNumber(user.fullName);
  const life = lifePathNumber(user.birthDate);
  if (name === null && life === null) return 50; // no info — neutral
  const reduced = reduceToSingle(digitSum(num));
  let s = 40;
  if (life !== null && reduced === life) s += 30;
  if (name !== null && reduced === name) s += 25;
  // soft bonus: any digit of the candidate equals the personal number
  const digits = num.split("").map(Number);
  if (life !== null && digits.includes(life)) s += 5;
  if (name !== null && digits.includes(name)) s += 5;
  return Math.max(0, Math.min(100, s));
}

/** Day-of-birth alignment — share of digits inside the day's auspicious set */
function dayDigitScore(num: string, user: UserInput): number {
  const lucky = auspiciousDigitsForBirth(user.birthDate);
  if (!lucky) return 50; // no birth info — neutral
  const digits = num.split("").map(Number);
  const matches = digits.filter((d) => lucky.includes(d)).length;
  // 0/6 → 30, 6/6 → 90
  return Math.max(0, Math.min(100, 30 + matches * 10));
}

/** Kaalakini penalty — too many forbidden-day digits is bad */
function kaalakiniPenalty(num: string, user: UserInput): number {
  const forbidden = kaalakiniForBirth(user.birthDate);
  if (forbidden === null) return 0;
  const count = num.split("").filter((d) => Number(d) === forbidden).length;
  // Up to 6 occurrences → up to ~30pt penalty
  return Math.min(30, count * 6);
}

/**
 * Combined numerology score. Weighting is tuned to behave gracefully when the
 * user supplies no profile (all sub-scores collapse to ~50, so the final lands
 * near 50 — neither rewarding nor punishing). With a full profile the spread
 * widens to roughly 25..95.
 */
export function numerologyScore(num: string, user: UserInput): number {
  const sum = sumScore(num);                    // weight 0.30
  const back2 = back2Score(num);                // weight 0.20
  const personal = personalScore(num, user);    // weight 0.25
  const dayDig = dayDigitScore(num, user);      // weight 0.25
  const penalty = kaalakiniPenalty(num, user);  // subtract directly

  const combined =
    sum * 0.30 +
    back2 * 0.20 +
    personal * 0.25 +
    dayDig * 0.25 -
    penalty;

  return Math.max(0, Math.min(100, Math.round(combined)));
}

/**
 * Deterministic Thai explanation for a number set, used by fallbackReason
 * and as a hint for the LLM in /api/analyze.
 */
export function numerologyExplanation(num: string, user: UserInput): string {
  const sum = digitSum(num);
  const reduced = reduceToSingle(sum);
  const meaning = DIGIT_MEANINGS[reduced];
  const parts: string[] = [];
  if (isAuspiciousSum(sum)) {
    parts.push(`ผลรวม ${sum} เป็นผลรวมมงคล`);
  } else if (meaning) {
    parts.push(
      `ผลรวม ${sum} ย่อเป็นเลข ${reduced} (${meaning.planet}) ${meaning.short}`,
    );
  }
  const b2 = parseInt(num.slice(-2), 10);
  const b2m = !isNaN(b2) ? meaningOfTwoDigit(b2) : null;
  if (b2m) parts.push(`ท้าย 2 (${num.slice(-2)}) ${b2m.short}`);

  const lucky = auspiciousDigitsForBirth(user.birthDate);
  if (lucky) {
    const matches = num.split("").filter((d) => lucky.includes(Number(d))).length;
    if (matches >= 3) parts.push(`มีเลขเด่นประจำวันเกิด ${matches}/6 หลัก`);
  }

  const forbidden = kaalakiniForBirth(user.birthDate);
  if (forbidden !== null) {
    const k = num.split("").filter((d) => Number(d) === forbidden).length;
    if (k >= 2) parts.push(`มีเลขกาลกิณี (${forbidden}) ถึง ${k} ตัว — ระวัง`);
  }

  if (parts.length === 0) {
    parts.push(`ผลรวม ${sum} ย่อเป็นเลข ${reduced}`);
  }
  return parts.join(" • ");
}

// Re-export commonly used helpers so other modules can import everything from here
export {
  AUSPICIOUS_SINGLES,
  isAuspiciousSum,
  meaningOfTwoDigit,
  kaalakiniForBirth,
  auspiciousDigitsForBirth,
};
