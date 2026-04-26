import type { UserInput } from "./types";

export type Element = "ไม้" | "ไฟ" | "ดิน" | "ทอง" | "น้ำ";

const ELEMENT_LUCKY: Record<Element, number[]> = {
  ไม้: [3, 4],
  ไฟ: [2, 7],
  ดิน: [5, 8],
  ทอง: [6, 9],
  น้ำ: [0, 1],
};

export function elementFromYear(year?: number): Element | null {
  if (!year) return null;
  // Chinese stem cycle (decade): based on last digit
  const last = year % 10;
  if (last === 4 || last === 5) return "ไม้";
  if (last === 6 || last === 7) return "ไฟ";
  if (last === 8 || last === 9) return "ดิน";
  if (last === 0 || last === 1) return "ทอง";
  return "น้ำ"; // 2,3
}

const DIR_BONUS: Record<string, number[]> = {
  เหนือ: [1, 6],
  ใต้: [2, 7],
  ตะวันออก: [3, 4],
  ตะวันตก: [6, 9],
  "ตะวันออกเฉียงเหนือ": [5, 8],
  "ตะวันออกเฉียงใต้": [3, 4],
  "ตะวันตกเฉียงเหนือ": [6, 9],
  "ตะวันตกเฉียงใต้": [5, 8],
};

export function fengshuiScore(num: string, user: UserInput): number {
  const el = elementFromYear(user.birthYear);
  if (!el) return 38;
  const lucky = ELEMENT_LUCKY[el];
  const digits = num.split("").map(Number);
  const matches = digits.filter((d) => lucky.includes(d)).length;
  let score = 30 + matches * 10;
  if (user.facingDirection && DIR_BONUS[user.facingDirection]) {
    const dirLucky = DIR_BONUS[user.facingDirection];
    const dirMatches = digits.filter((d) => dirLucky.includes(d)).length;
    score += dirMatches * 4;
  }
  return Math.max(0, Math.min(100, score));
}
