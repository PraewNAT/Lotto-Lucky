export type Science = "math" | "astro" | "numero" | "fengshui";

export const SCIENCE_LABEL: Record<Science, string> = {
  math: "คณิตศาสตร์",
  astro: "โหราศาสตร์",
  numero: "เลขศาสตร์",
  fengshui: "ฮวงจุ้ย",
};

export interface UserInput {
  birthDate?: string;       // YYYY-MM-DD
  birthTime?: string;       // HH:mm
  birthProvince?: string;
  fullName?: string;
  birthYear?: number;
  facingDirection?: string; // เหนือ ใต้ ตะวันออก ...
}

export interface NumberSetSignal {
  kind: "gap" | "sum" | "parity" | "diversity" | "personal" | "freq";
  tone: "positive" | "neutral" | "warn";
  text: string;
}

export interface NumberSet {
  number: string;     // 6-digit string
  front3: string;
  back3: string;
  back2: string;
  score: number;      // 0–100
  breakdown: Record<string, number>;
  reason?: string;    // filled by AI; fallback otherwise
  signals?: NumberSetSignal[]; // deterministic insights (gap, sum, personal, ...)
  highlight?: string; // "เด่นด้านสมดุล" / "ห่างหายมากที่สุด" — at most one per set
}

export interface LottoDraw {
  date: string;
  prizes: {
    first: string;
    front3: string[];
    back3: string[];
    back2: string;
  };
}

export interface StatsSummary {
  digitFreq: number[];          // length 10
  back2Freq: number[];          // length 100
  back2LastSeen: (string | null)[];
  front3Freq: number[];         // length 1000
  front3LastSeen: (string | null)[];
  back3Freq: number[];          // length 1000
  back3LastSeen: (string | null)[];
  totalDraws: number;
}

export type HeatmapMode = "back2" | "front3" | "back3";
