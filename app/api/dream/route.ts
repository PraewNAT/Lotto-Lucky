import { NextResponse } from "next/server";
import { chatJSON } from "@/lib/anthropic";
import { findSymbols, pickNumbers, type MatchedSymbol, type NumberOption } from "@/lib/dreamSymbols";

export const runtime = "nodejs";

interface DreamSymbolOut {
  symbol: string;
  numbers: string;
  meaning: string;
  source: "dictionary" | "ai";
}

interface DreamResult {
  six: string;
  sixFrom: string;
  threeOptions: NumberOption[];
  twoOptions: NumberOption[];
  symbols: DreamSymbolOut[];
  summary: string;
}

interface LLMResult {
  symbols?: { symbol: string; meaning: string }[];
  summary?: string;
}

function symbolsFromMatched(matched: MatchedSymbol[]): DreamSymbolOut[] {
  return matched.map((m) => ({
    symbol: m.symbol.label,
    numbers: m.symbol.two.slice(0, 3).join(", "),
    meaning: m.symbol.meaning,
    source: "dictionary" as const,
  }));
}

export async function POST(req: Request) {
  const { dream } = (await req.json()) as { dream: string };
  if (!dream || dream.trim().length < 5) {
    return NextResponse.json({ error: "กรุณาพิมพ์ความฝันอย่างน้อย 5 ตัวอักษร" }, { status: 400 });
  }

  const matched = findSymbols(dream, 6);
  const numbers = pickNumbers(matched, dream);
  const dictSymbols = symbolsFromMatched(matched);

  const dictHint = matched.length
    ? matched.map((m) => `- ${m.symbol.label} (${m.symbol.two.join("/")}): ${m.symbol.meaning}`).join("\n")
    : "(ไม่พบสัญลักษณ์ในดิกชันนารี)";

  const system = `คุณเป็นนักทำนายฝันสายไทย ผู้ใช้เล่าฝัน คุณช่วย:
1. ระบุสัญลักษณ์เพิ่มเติมที่ไม่อยู่ในดิกชันนารี (ถ้ามี) สูงสุด 2 รายการ
2. เขียนสรุปการตีความ 2-3 ประโยคภาษาไทยธรรมชาติ
ห้ามเลือกตัวเลขเอง — ตัวเลขมาจากดิกชันนารีแล้ว
ตอบกลับเป็น JSON เท่านั้น:
{
  "symbols": [{"symbol": "สัญลักษณ์", "meaning": "เหตุผล 1 ประโยค"}],
  "summary": "สรุป 2-3 ประโยค"
}`;

  const userPrompt = `ความฝัน: ${dream}

สัญลักษณ์จากดิกชันนารี:
${dictHint}`;

  const llm = await chatJSON<LLMResult>(system, userPrompt, {
    symbols: [],
    summary: matched.length
      ? `ฝันนี้มีสัญลักษณ์ "${matched[0].symbol.label}" — ${matched[0].symbol.meaning}`
      : "เลขนี้มาจากจังหวะของถ้อยคำในฝัน เพราะไม่พบสัญลักษณ์ที่ตรงกับตำรา",
  });

  const aiSymbols: DreamSymbolOut[] = Array.isArray(llm.symbols)
    ? llm.symbols.slice(0, 2).map((s) => ({
        symbol: s.symbol || "",
        numbers: numbers.twoOptions[0]?.n ?? "",
        meaning: s.meaning || "",
        source: "ai" as const,
      })).filter((s) => s.symbol && s.meaning)
    : [];

  const result: DreamResult = {
    six: numbers.six,
    sixFrom: numbers.sixFrom,
    threeOptions: numbers.threeOptions,
    twoOptions: numbers.twoOptions,
    symbols: [...dictSymbols, ...aiSymbols].slice(0, 6),
    summary: llm.summary || "",
  };
  return NextResponse.json(result);
}
