// เลขศาสตร์ knowledge base — Thai numerology data
// Sources: 00042_เลขศาสตร์ชื่อนั้นสำคัญไฉน (PDF), A_17147 (PDF),
// plus widely-circulated Thai numerology conventions where the two PDFs agree.
//
// Three pillars used by the scoring engine in lib/numerology.ts:
//   1. ความหมายของเลขเดี่ยว 1–9 (ดาวประจำเลข + กลุ่มดี/กลาง/เตือน)
//   2. ความหมายของเลขคู่ (10–30, lookup เร็ว)
//   3. ผลรวมมงคล (auspicious totals) + กาลกิณีตามวันเกิด
//
// All Thai labels are kept short (chip-friendly) so they can render directly
// in NumberSet signals without further translation.
//
// NOTE: เลขศาสตร์ is a belief system — outputs from this module are *not*
// predictions. They map a 6-digit candidate onto Thai numerology semantics
// so the ranking in lottery.ts can prefer numbers that "feel" auspicious.

export type DigitTone = "auspicious" | "neutral" | "warn";

export interface DigitMeaning {
  digit: number;        // 1..9 (0 handled separately)
  planet: string;       // ดาวประจำเลข
  short: string;        // 1-line label (used in chips/breakdown)
  traits: string[];     // keyword traits
  tone: DigitTone;
}

/** ความหมายของเลข 1–9 (ดาวประจำเลข + โทน) */
export const DIGIT_MEANINGS: Record<number, DigitMeaning> = {
  1: {
    digit: 1,
    planet: "อาทิตย์",
    short: "ผู้นำ บารมี",
    traits: ["ความเป็นผู้นำ", "เกียรติยศ", "เริ่มต้นใหม่"],
    tone: "auspicious",
  },
  2: {
    digit: 2,
    planet: "จันทร์",
    short: "เสน่ห์ อ่อนหวาน",
    traits: ["เสน่ห์", "ความนุ่มนวล", "เพื่อนพ้องบริวาร"],
    tone: "neutral",
  },
  3: {
    digit: 3,
    planet: "อังคาร",
    short: "กล้าหาญ แต่ร้อนแรง",
    traits: ["กำลังใจสูง", "การต่อสู้", "ความขัดแย้ง"],
    tone: "warn",
  },
  4: {
    digit: 4,
    planet: "พุธ",
    short: "เจรจา การค้า",
    traits: ["การสื่อสาร", "การเจรจา", "เชาวน์ปัญญา"],
    tone: "neutral",
  },
  5: {
    digit: 5,
    planet: "พฤหัสบดี",
    short: "ความสำเร็จ ผู้ใหญ่หนุน",
    traits: ["ผู้ใหญ่อุปถัมภ์", "ความรู้", "บารมีดี"],
    tone: "auspicious",
  },
  6: {
    digit: 6,
    planet: "ศุกร์",
    short: "เสน่ห์ ความรัก",
    traits: ["ศิลปะ", "ความรัก", "ทรัพย์สินสวยงาม"],
    tone: "auspicious",
  },
  7: {
    digit: 7,
    planet: "เสาร์",
    short: "อุปสรรค อดทน",
    traits: ["ความยากลำบาก", "ความอดทน", "ทุกข์"],
    tone: "warn",
  },
  8: {
    digit: 8,
    planet: "ราหู",
    short: "พลิกผัน เงินทางลัด",
    traits: ["ความผันผวน", "เล่ห์เหลี่ยม", "ลาภลอย"],
    tone: "warn",
  },
  9: {
    digit: 9,
    planet: "เกตุ",
    short: "พลังสูง บารมีแรง",
    traits: ["บารมี", "ความก้าวหน้า", "ผู้ใหญ่ให้คุณ"],
    tone: "auspicious",
  },
};

/** เลขคู่ 10–30 — ความหมายโดยย่อ (ใช้กับท้าย 2 ตัวและท้าย 3 ตัว 2 หลักท้าย) */
export const TWO_DIGIT_MEANINGS: Record<number, { tone: DigitTone; short: string }> = {
  10: { tone: "auspicious", short: "เกียรติยศ ผู้นำ" },
  11: { tone: "auspicious", short: "คู่บารมี ลาภยศ" },
  12: { tone: "neutral",    short: "เพื่อนพ้องเกื้อกูล" },
  13: { tone: "warn",       short: "ระวังคำพูด" },
  14: { tone: "auspicious", short: "เจรจาประสบผล" },
  15: { tone: "auspicious", short: "เสน่ห์เด่น โชคดี" },
  16: { tone: "auspicious", short: "เมตตามหานิยม" },
  17: { tone: "warn",       short: "เหนื่อยก่อนได้" },
  18: { tone: "auspicious", short: "ลาภลอย ทรัพย์ใหญ่" },
  19: { tone: "auspicious", short: "บารมีและทรัพย์" },
  20: { tone: "neutral",    short: "อ่อนหวาน เริ่มต้นใหม่" },
  21: { tone: "auspicious", short: "ผู้ใหญ่ให้โอกาส" },
  22: { tone: "neutral",    short: "เพื่อนซื่อสัตย์" },
  23: { tone: "auspicious", short: "ปัญญาเฉียบ" },
  24: { tone: "auspicious", short: "การเงินคล่อง ลาภลอย" },
  25: { tone: "neutral",    short: "เจรจาต้องระวัง" },
  26: { tone: "auspicious", short: "เสน่ห์ ค้าขายดี" },
  27: { tone: "auspicious", short: "ดวงกล้าหาญ ผู้นำ" },
  28: { tone: "warn",       short: "ลาภปนทุกข์" },
  29: { tone: "auspicious", short: "บารมีและทรัพย์ใหญ่" },
  30: { tone: "neutral",    short: "เริ่มงานใหม่ ค่อยเป็นค่อยไป" },
};

/**
 * ผลรวมเลขมงคล (auspicious totals) — ทั้งของชุดและของท้าย 2 ตัว
 * Combined list across both PDFs — ตัดเลขที่ขัดแย้งกันออก
 */
export const AUSPICIOUS_SUMS: ReadonlySet<number> = new Set([
  // เด่นด้านการเงิน-โชคลาภ
  14, 15, 19, 23, 24, 36, 41, 42, 45, 46, 50, 51, 54, 55, 56, 59,
  // เด่นด้านบารมี-ผู้ใหญ่หนุน
  9, 18, 27, 63, 65, 90, 95, 99, 100,
]);

/**
 * Reduce-to-single — auspicious vs warn buckets
 * (ใช้กับผลรวมหลังย่อสุดท้าย 1..9)
 */
export const AUSPICIOUS_SINGLES: ReadonlySet<number> = new Set([1, 5, 6, 9]);
export const WARN_SINGLES: ReadonlySet<number> = new Set([3, 7, 8]);

/**
 * กาลกิณีตามวันเกิด — เลขที่ "ห้าม" หรือควรหลีกเลี่ยงในชื่อ/เลขเด่น
 * Based on traditional Thai astrology (ทักษาปกรณ์):
 *   อาทิตย์→ศุกร์(6), จันทร์→อาทิตย์(1), อังคาร→จันทร์(2),
 *   พุธ(วัน)→พฤหัสบดี(5), พฤหัสบดี→พุธ(4),
 *   ศุกร์→ราหู(8), เสาร์→อังคาร(3)
 *
 * 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat (matches Date.getDay())
 */
export const KAALAKINI_DIGIT: Record<number, number> = {
  0: 6, // อาทิตย์ → ศุกร์
  1: 1, // จันทร์ → อาทิตย์
  2: 2, // อังคาร → จันทร์
  3: 5, // พุธ    → พฤหัสบดี
  4: 4, // พฤหัสบดี → พุธ
  5: 8, // ศุกร์   → ราหู
  6: 3, // เสาร์   → อังคาร
};

/**
 * เลขเด่นประจำวันเกิด (ดาวเสริม + ดาวศรี) — ผู้เกิดวันนี้นิยมใช้เลขเหล่านี้
 * (เน้นดาวบริวาร อายุ เดช ศรี เป็นหลัก)
 */
export const DAY_AUSPICIOUS_DIGITS: Record<number, number[]> = {
  0: [1, 2, 3, 4, 5],   // อาทิตย์
  1: [2, 3, 4, 5, 7],   // จันทร์
  2: [3, 4, 6, 8, 9],   // อังคาร
  3: [4, 6, 7, 8, 9],   // พุธ
  4: [5, 6, 7, 9, 1],   // พฤหัส
  5: [6, 7, 9, 1, 2],   // ศุกร์
  6: [7, 1, 2, 4, 5],   // เสาร์
};

export const THAI_DAY_NAMES = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
];

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/** ตอบโทนของเลขเดี่ยว (auspicious / neutral / warn) */
export function singleDigitTone(d: number): DigitTone {
  if (AUSPICIOUS_SINGLES.has(d)) return "auspicious";
  if (WARN_SINGLES.has(d)) return "warn";
  return "neutral";
}

/** ตรวจว่าเป็นผลรวมมงคลหรือไม่ */
export function isAuspiciousSum(sum: number): boolean {
  return AUSPICIOUS_SUMS.has(sum);
}

/** เลขกาลกิณีตามวันเกิด — null ถ้าไม่ทราบ */
export function kaalakiniForBirth(birthDate?: string): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  return KAALAKINI_DIGIT[d.getDay()] ?? null;
}

/** เลขเด่นประจำวันเกิด — null ถ้าไม่ทราบ */
export function auspiciousDigitsForBirth(birthDate?: string): number[] | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  return DAY_AUSPICIOUS_DIGITS[d.getDay()] ?? null;
}

/** ความหมายเลขคู่ — ใช้กับท้าย 2 ตัว (00–99 → modulo 31 ไม่ใช้, ดูตรงๆ) */
export function meaningOfTwoDigit(n: number): { tone: DigitTone; short: string } | null {
  return TWO_DIGIT_MEANINGS[n] ?? null;
}

/** สรุปคำอธิบายของเลขเดี่ยว (ใช้ในเหตุผลฝั่ง deterministic) */
export function describeSingle(d: number): string {
  const m = DIGIT_MEANINGS[d];
  if (!m) return "";
  return `เลข ${d} (${m.planet}) — ${m.short}`;
}
