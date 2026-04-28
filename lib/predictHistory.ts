import type { LottoDraw } from "./types";
import type { PredictKind, Prediction } from "./stats";

export const HIST_KEY = "lotto-lucky:predHistory";
const MAX_ENTRIES = 12;

/** ข้อมูล 1 งวดที่บันทึกไว้ */
export interface HistEntry {
  /** งวดล่าสุดที่ใช้เป็นฐานข้อมูลตอนที่ทาย */
  latestDrawDate: string;
  /** ผลทำนายของแต่ละตำแหน่ง (top 5 เรียงตามคะแนน) */
  predictions: Record<PredictKind, Array<{ number: string; confidence: number }>>;
  savedAt: string;
}

export function loadHistory(): HistEntry[] {
  try {
    const raw = localStorage.getItem(HIST_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as HistEntry[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * บันทึกลง history — ถ้ามีรายการสำหรับ latestDrawDate นี้แล้ว จะ skip
 * (ไม่ overwrite ทุก page load เพราะ GA ใช้ random)
 * คืน true ถ้าบันทึกสำเร็จ, false ถ้า skip เพราะมีแล้ว
 */
export function appendHistory(
  latestDrawDate: string,
  predictions: Record<PredictKind, Prediction[]>,
): boolean {
  try {
    const arr = loadHistory();
    if (arr.some((e) => e.latestDrawDate === latestDrawDate)) return false;
    const entry: HistEntry = {
      latestDrawDate,
      predictions: {
        back2:  predictions.back2.map((p) => ({ number: p.number, confidence: p.confidence })),
        front3: predictions.front3.map((p) => ({ number: p.number, confidence: p.confidence })),
        back3:  predictions.back3.map((p) => ({ number: p.number, confidence: p.confidence })),
      },
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(HIST_KEY, JSON.stringify([entry, ...arr].slice(0, MAX_ENTRIES)));
    return true;
  } catch {
    return false;
  }
}

/**
 * หางวดที่ออกทันทีหลัง afterDate
 * draws ต้องเรียงใหม่→เก่า (draws[0] = ล่าสุด)
 */
export function findNextDraw(draws: LottoDraw[], afterDate: string): LottoDraw | null {
  let result: LottoDraw | null = null;
  for (const d of draws) {
    if (d.date <= afterDate) continue;
    if (!result || d.date < result.date) result = d;
  }
  return result;
}

export type { PredictKind };
