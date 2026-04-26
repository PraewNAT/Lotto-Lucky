import type { LottoDraw } from "./types";
import { mockDraws } from "./stats";

const BASE = process.env.LOTTO_API_BASE || "https://lotto.api.rayriffy.com";

const THAI_MONTHS: Record<string, number> = {
  มกราคม: 1, กุมภาพันธ์: 2, มีนาคม: 3, เมษายน: 4,
  พฤษภาคม: 5, มิถุนายน: 6, กรกฎาคม: 7, สิงหาคม: 8,
  กันยายน: 9, ตุลาคม: 10, พฤศจิกายน: 11, ธันวาคม: 12,
};

function parseThaiDate(thaiDate: string): string | null {
  // "16 เมษายน 2569" → "2026-04-16"
  const parts = thaiDate.trim().split(/\s+/);
  if (parts.length < 3) return null;
  const day = parseInt(parts[0]);
  const month = THAI_MONTHS[parts[1]];
  const bYear = parseInt(parts[parts.length - 1]);
  if (!day || !month || isNaN(bYear)) return null;
  const cYear = bYear - 543;
  return `${cYear}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

/** แปลง ID ของ API (ddmmBBBB) เป็น ISO date (YYYY-MM-DD) */
function idToIsoDate(id: string): string | null {
  if (!/^\d{8}$/.test(id)) return null;
  const dd = id.slice(0, 2);
  const mm = id.slice(2, 4);
  const bYear = parseInt(id.slice(4, 8));
  const cYear = bYear - 543;
  if (cYear < 1900 || cYear > 2200) return null;
  return `${cYear}-${mm}-${dd}`;
}

interface RawDraw {
  status?: string;
  response?: {
    date?: string;
    prizes?: Array<{ id: string; number: string[] }>;
    runningNumbers?: Array<{ id: string; number: string[] }>;
  };
}

function normalize(raw: RawDraw, isoDate?: string): LottoDraw | null {
  const r = raw.response;
  if (!r) return null;
  const findPrize = (id: string) => r.prizes?.find((p) => p.id === id)?.number ?? [];
  const findRun = (id: string) => r.runningNumbers?.find((p) => p.id === id)?.number ?? [];
  const first = findPrize("prizeFirst")[0] ?? "";
  const front3 = findRun("runningNumberFrontThree");
  const back3 = findRun("runningNumberBackThree");
  const back2 = findRun("runningNumberBackTwo")[0] ?? "";
  if (!first && !back2) return null;
  const date =
    isoDate ||
    (r.date ? parseThaiDate(r.date) : null) ||
    new Date().toISOString().slice(0, 10);
  return { date, prizes: { first, front3, back3, back2 } };
}

export async function fetchLatest(): Promise<LottoDraw | null> {
  try {
    const res = await fetch(`${BASE}/latest`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = (await res.json()) as RawDraw;
    const isoDate = json.response?.date
      ? (parseThaiDate(json.response.date) ?? undefined)
      : undefined;
    return normalize(json, isoDate);
  } catch {
    return null;
  }
}

/** ดึง ID ทุกงวดจาก paginated /list/{page} (20 รายการ/หน้า, ~24 หน้า)
 *  ถ้า targetCount > 0 จะดึงแค่หน้าที่จำเป็นเพื่อให้ครอบคลุม targetCount รายการ */
async function fetchAllIds(targetCount = 0): Promise<string[]> {
  const PAGE_SIZE = 20;
  const MAX_PAGES = 30;
  const pagesNeeded =
    targetCount > 0
      ? Math.min(MAX_PAGES, Math.ceil(targetCount / PAGE_SIZE) + 1)
      : MAX_PAGES;
  const pagePromises = Array.from({ length: pagesNeeded }, (_, i) =>
    fetch(`${BASE}/list/${i + 1}`, { next: { revalidate: 86_400 } })
      .then((r) => (r.ok ? r.json() : { response: [] }))
      .then((j: { response?: Array<{ id: string }> }) => j.response ?? [])
      .catch(() => [] as Array<{ id: string }>)
  );
  const pages = await Promise.all(pagePromises);
  return pages
    .flat()
    .map((r) => r.id)
    .filter((id) => /^\d{8}$/.test(id));
}

export async function fetchDraw(id: string): Promise<LottoDraw | null> {
  try {
    const isoDate = idToIsoDate(id) ?? undefined;
    const res = await fetch(`${BASE}/lotto/${id}`, { next: { revalidate: 86_400 } });
    if (!res.ok) return null;
    const json = (await res.json()) as RawDraw;
    return normalize(json, isoDate);
  } catch {
    return null;
  }
}

async function fetchInBatches(ids: string[], batchSize = 20): Promise<LottoDraw[]> {
  const results: LottoDraw[] = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((id) => fetchDraw(id)));
    results.push(...batchResults.filter((r): r is LottoDraw => !!r));
  }
  return results;
}

/** limit = 0 หมายถึงดึงทุกงวดที่มีในระบบ */
export async function fetchHistory(limit = 0): Promise<LottoDraw[]> {
  const latest = await fetchLatest();
  if (!latest) return limit > 0 ? mockDraws().slice(0, limit) : mockDraws();

  const ids = await fetchAllIds(limit);
  if (ids.length === 0) {
    const filler = limit > 0 ? mockDraws().slice(1, limit) : mockDraws().slice(1);
    return [latest, ...filler];
  }

  const slice = limit > 0 ? ids.slice(0, limit) : ids;
  const cleaned = await fetchInBatches(slice);
  if (cleaned.length === 0) {
    const fallback = limit > 0 ? mockDraws().slice(1, limit) : mockDraws().slice(1);
    return [latest, ...fallback];
  }
  return cleaned;
}
