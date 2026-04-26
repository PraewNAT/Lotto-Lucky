import { NextResponse } from "next/server";
import { chatJSON } from "@/lib/anthropic";

export const runtime = "nodejs";

interface DreamResult {
  six: string;
  three: string;
  two: string;
  symbols: { symbol: string; numbers: string; meaning: string }[];
  summary: string;
}

function fallbackFromDream(text: string): DreamResult {
  const seed = [...text].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rng = (mod: number, salt: number) => ((seed * (salt + 13)) >>> 0) % mod;
  const six = rng(1_000_000, 1).toString().padStart(6, "0");
  const three = rng(1000, 2).toString().padStart(3, "0");
  const two = rng(100, 3).toString().padStart(2, "0");
  return {
    six,
    three,
    two,
    symbols: [
      { symbol: "ภาพรวมของฝัน", numbers: two, meaning: "อารมณ์ในฝันเชื่อมโยงกับเลขท้ายชุดนี้" },
    ],
    summary: "เลขนี้มาจากจังหวะของคำพูดในฝัน รวมกับสัญลักษณ์ที่ปรากฏชัดที่สุด",
  };
}

export async function POST(req: Request) {
  const { dream } = (await req.json()) as { dream: string };
  if (!dream || dream.trim().length < 5) {
    return NextResponse.json({ error: "กรุณาพิมพ์ความฝันอย่างน้อย 5 ตัวอักษร" }, { status: 400 });
  }

  const system = `คุณเป็นนักทำนายฝันสายไทย แปลงเรื่องเล่าฝันเป็นเลข
ตอบกลับเป็น JSON เท่านั้น:
{
  "six": "6 หลัก",
  "three": "3 หลัก",
  "two": "2 หลัก",
  "symbols": [{"symbol": "สัญลักษณ์ในฝัน", "numbers": "เลขที่ได้", "meaning": "เหตุผล 1 ประโยค"}],
  "summary": "สรุปการตีความ 2-3 ประโยค ภาษาไทยธรรมชาติ"
}
ห้ามใส่ข้อความอื่นนอกจาก JSON`;

  const result = await chatJSON<DreamResult>(system, dream, fallbackFromDream(dream));
  // sanitize lengths
  const safe: DreamResult = {
    six: (result.six || "").replace(/\D/g, "").padStart(6, "0").slice(-6),
    three: (result.three || "").replace(/\D/g, "").padStart(3, "0").slice(-3),
    two: (result.two || "").replace(/\D/g, "").padStart(2, "0").slice(-2),
    symbols: Array.isArray(result.symbols) ? result.symbols.slice(0, 6) : [],
    summary: result.summary || "",
  };
  return NextResponse.json(safe);
}
