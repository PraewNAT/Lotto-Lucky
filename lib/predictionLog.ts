import type { NumberSet, Science } from "./types";

const STORAGE_KEY = "lotto-lucky:prediction-log";
const MAX_ENTRIES = 30;

export interface PredictionHit {
  type: "back2" | "back3" | "first";
  number: string;
  setIndex: number;
}

export interface PredictionResult {
  checkedAt: number;
  drawDate: string;
  actualBack2: string;
  actualBack3: string[];
  actualFirst: string;
  hits: PredictionHit[];
}

export interface PredictionLogEntry {
  id: string;
  timestamp: number;
  sciences: Science[];
  count: number;
  /** งวดล่าสุดที่ใช้อ้างอิง (ISO date) */
  refDate?: string;
  /** งวดถัดไปที่คาดว่าจะออก — ใช้เช็คผล */
  targetDate?: string;
  sets: Array<{
    number: string;
    back2: string;
    back3: string;
    score: number;
    highlight?: string;
  }>;
  /** ผลตรวจหลังงวดออก — null = ยังไม่ได้ตรวจ */
  result?: PredictionResult | null;
}

// หวยออก 1 และ 16 ของทุกเดือน
function nextDrawDate(fromTs: number): string {
  const d = new Date(fromTs);
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();
  if (day < 16) {
    return new Date(year, month, 16).toISOString().slice(0, 10);
  }
  return new Date(year, month + 1, 1).toISOString().slice(0, 10);
}

function compactSets(sets: NumberSet[]): PredictionLogEntry["sets"] {
  return sets.map((s) => ({
    number: s.number,
    back2: s.back2,
    back3: s.back3,
    score: s.score,
    highlight: s.highlight,
  }));
}

export function saveLog(input: {
  sciences: Science[];
  count: number;
  sets: NumberSet[];
  refDate?: string;
}): PredictionLogEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const entry: PredictionLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      sciences: input.sciences,
      count: input.count,
      refDate: input.refDate,
      targetDate: nextDrawDate(Date.now()),
      sets: compactSets(input.sets),
      result: null,
    };
    const existing = loadLogs();
    const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return entry;
  } catch {
    return null;
  }
}

export function loadLogs(): PredictionLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is PredictionLogEntry =>
      x && typeof x.id === "string" && typeof x.timestamp === "number" && Array.isArray(x.sets)
    );
  } catch {
    return [];
  }
}

export function updateLogResult(id: string, result: PredictionResult): PredictionLogEntry[] {
  if (typeof window === "undefined") return [];
  const logs = loadLogs().map((e) => (e.id === id ? { ...e, result } : e));
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {}
  return logs;
}

export function clearLogs(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function deleteLog(id: string): PredictionLogEntry[] {
  if (typeof window === "undefined") return [];
  const remaining = loadLogs().filter((e) => e.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  } catch {}
  return remaining;
}

/** คืนค่า accuracy จาก log ที่ตรวจผลแล้ว สำหรับแต่ละศาสตร์ */
export interface ScienceAccuracy {
  science: Science;
  checked: number;   // จำนวน log ที่ตรวจแล้ว
  hitBack2: number;  // ถูกอย่างน้อย 1 ชุด
  hitBack3: number;
}

export function computeAccuracy(logs: PredictionLogEntry[]): ScienceAccuracy[] {
  const sciences: Science[] = ["math", "astro", "numero", "fengshui"];
  return sciences.map((sci) => {
    const relevant = logs.filter(
      (e) => e.result && e.sciences.includes(sci)
    );
    const hitBack2 = relevant.filter((e) =>
      e.result!.hits.some((h) => h.type === "back2")
    ).length;
    const hitBack3 = relevant.filter((e) =>
      e.result!.hits.some((h) => h.type === "back3")
    ).length;
    return { science: sci, checked: relevant.length, hitBack2, hitBack3 };
  });
}
