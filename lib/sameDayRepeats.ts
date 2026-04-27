import type { LottoDraw } from "./types";

export type RepeatField = "first" | "back2" | "back3" | "front3";

export interface RepeatEntry {
  /** วันที่ของเดือน (1-31) */
  day: number;
  /** เลขที่ซ้ำ */
  number: string;
  /** วันที่ที่ออก (ISO date) เรียงจากใหม่ → เก่า */
  dates: string[];
}

/**
 * วิเคราะห์เลขที่ออกใน "วันที่เดียวกันของเดือน" ซ้ำกัน ≥ 2 ครั้ง
 *
 * @param draws ประวัติงวดทั้งหมด
 * @param field ฟิลด์ที่จะวิเคราะห์
 * @param minDigits ตัด entries ที่จำนวนหลักน้อยกว่านี้ออก (เช่น 3 สำหรับ back3/front3)
 */
export function analyzeSameDayRepeats(
  draws: LottoDraw[],
  field: RepeatField,
  minDigits = 0,
): RepeatEntry[] {
  const byDay = new Map<number, Map<string, string[]>>();

  for (const d of draws) {
    if (!d.date || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) continue;
    const day = parseInt(d.date.slice(8, 10));
    if (isNaN(day)) continue;

    const numbers: string[] = [];
    if (field === "first") {
      if (d.prizes.first) numbers.push(d.prizes.first);
    } else if (field === "back2") {
      if (d.prizes.back2) numbers.push(d.prizes.back2);
    } else if (field === "back3") {
      numbers.push(...(d.prizes.back3 || []));
    } else if (field === "front3") {
      numbers.push(...(d.prizes.front3 || []));
    }

    for (const n of numbers) {
      if (!n || (minDigits > 0 && n.length < minDigits)) continue;
      if (!byDay.has(day)) byDay.set(day, new Map());
      const dayMap = byDay.get(day)!;
      if (!dayMap.has(n)) dayMap.set(n, []);
      dayMap.get(n)!.push(d.date);
    }
  }

  const out: RepeatEntry[] = [];
  for (const [day, dayMap] of byDay) {
    for (const [num, dates] of dayMap) {
      if (dates.length >= 2) {
        out.push({
          day,
          number: num,
          dates: [...dates].sort().reverse(),
        });
      }
    }
  }
  out.sort((a, b) => b.dates.length - a.dates.length || a.day - b.day);
  return out;
}
