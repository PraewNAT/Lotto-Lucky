import type { UserInput } from "./types";

const DAY_LUCKY: Record<number, number[]> = {
  0: [1, 6, 9],   // อาทิตย์
  1: [2, 5, 7],   // จันทร์
  2: [3, 8, 9],   // อังคาร
  3: [4, 6, 7],   // พุธ
  4: [3, 5, 9],   // พฤหัส
  5: [4, 6, 8],   // ศุกร์
  6: [1, 7, 8],   // เสาร์
};

export function dayOfWeekFromBirth(birthDate?: string): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  return d.getDay();
}

export function astrologyScore(num: string, user: UserInput): number {
  const day = dayOfWeekFromBirth(user.birthDate);
  if (day === null) {
    // no birth info → mid-low neutral score
    return 40;
  }
  const lucky = DAY_LUCKY[day];
  const digits = num.split("").map(Number);
  const matches = digits.filter((d) => lucky.includes(d)).length;
  let score = 30 + matches * 10;
  // hour-based small bonus if last digit aligns with birth hour mod 10
  if (user.birthTime) {
    const [h] = user.birthTime.split(":").map(Number);
    if (!isNaN(h) && Number(num.slice(-1)) === h % 10) score += 6;
  }
  // province presence small boost (acts as personalization signal)
  if (user.birthProvince) score += 3;
  return Math.max(0, Math.min(100, score));
}

export function dailyNumbersFromBirth(birthDate: string, today: Date = new Date()): {
  back2: string[];
  back3: string[];
  reason: string;
} {
  const day = dayOfWeekFromBirth(birthDate) ?? today.getDay();
  const lucky = DAY_LUCKY[day];
  const tDay = today.getDay();
  const tLucky = DAY_LUCKY[tDay];
  const set = Array.from(new Set([...lucky, ...tLucky]));
  const back2: string[] = [];
  const back3: string[] = [];
  for (let i = 0; i < 4; i++) {
    const a = set[(i + today.getDate()) % set.length];
    const b = set[(i * 2 + today.getMonth() + 1) % set.length];
    back2.push(`${a}${b}`);
  }
  for (let i = 0; i < 3; i++) {
    const a = set[(i + today.getDate()) % set.length];
    const b = set[(i + 1) % set.length];
    const c = set[(i + 2 + today.getMonth()) % set.length];
    back3.push(`${a}${b}${c}`);
  }
  const dayName = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"][tDay];
  return {
    back2,
    back3,
    reason: `วัน${dayName}นี้ ดาวประจำวันส่งพลังถึงเลขมงคลส่วนตัวของคุณ ผสมกับเลขแห่งวันได้เป็นชุดข้างต้น`,
  };
}
