import type { NumberSet, Science } from "./types";

const STORAGE_KEY = "lotto-lucky:prediction-log";
const MAX_ENTRIES = 30;

export interface PredictionLogEntry {
  id: string;
  timestamp: number;
  sciences: Science[];
  count: number;
  /** งวดล่าสุดที่ใช้อ้างอิง (ISO date) */
  refDate?: string;
  sets: Array<{
    number: string;
    score: number;
    highlight?: string;
  }>;
}

function compactSets(sets: NumberSet[]): PredictionLogEntry["sets"] {
  return sets.map((s) => ({
    number: s.number,
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
      sets: compactSets(input.sets),
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
