import { NextResponse } from "next/server";
import { chatJSON } from "@/lib/anthropic";
import { fallbackReason } from "@/lib/lottery";
import type { NumberSet, Science, UserInput } from "@/lib/types";
import { SCIENCE_LABEL } from "@/lib/types";
import { fetchLatest } from "@/lib/lottoApi";

export const runtime = "nodejs";

interface Body {
  sets: NumberSet[];
  sciences: Science[];
  user: UserInput;
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const latest = await fetchLatest();
  const sciencesLabel = body.sciences.map((s) => SCIENCE_LABEL[s]).join(", ");
  const system = `คุณเป็นผู้เชี่ยวชาญด้านเลขสลากกินแบ่งของไทย เขียนคำอธิบายสั้นๆ 2-4 ประโยค
สำหรับเลขแต่ละชุดที่ถูกสุ่มมา โดยรวมศาสตร์ที่ผู้ใช้เลือกเข้าด้วยกันเป็นเหตุผลเดียว
ห้ามแยกเป็น "คณิตบอกว่า... โหราบอกว่า..." ใช้ภาษาไทยเป็นธรรมชาติ ไม่ใช้ศัพท์เทคนิคเกินไป
ใช้ประเภทเหตุผลตามบริบท: seasonal pattern, personal match, statistical, combined signal
ตอบกลับเป็น JSON: {"reasons": ["...", "..."]} เรียงตามลำดับชุดเลขที่ส่งมา`;

  const ctx = {
    sciences: sciencesLabel,
    user: body.user,
    latestDraw: latest,
    sets: body.sets.map((s) => ({
      number: s.number,
      back2: s.back2,
      back3: s.back3,
      front3: s.front3,
      score: s.score,
    })),
  };
  const fb = { reasons: body.sets.map((s) => fallbackReason(s, body.sciences)) };
  const result = await chatJSON<{ reasons: string[] }>(
    system,
    JSON.stringify(ctx, null, 2),
    fb,
  );
  const reasons = result.reasons?.length === body.sets.length ? result.reasons : fb.reasons;
  return NextResponse.json({ reasons });
}
