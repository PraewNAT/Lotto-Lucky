import type { UserInput } from "./types";
import { digitSum, reduceToSingle } from "./lottery";

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

export function numerologyScore(num: string, user: UserInput): number {
  const name = nameNumber(user.fullName);
  const life = lifePathNumber(user.birthDate);
  if (name === null && life === null) return 38;
  const setReduced = reduceToSingle(digitSum(num));
  let score = 30;
  if (name !== null && setReduced === name) score += 30;
  if (life !== null && setReduced === life) score += 30;
  // soft bonus: if any digit equals personal number
  const digits = num.split("").map(Number);
  if (name !== null && digits.includes(name)) score += 5;
  if (life !== null && digits.includes(life)) score += 5;
  return Math.max(0, Math.min(100, score));
}
