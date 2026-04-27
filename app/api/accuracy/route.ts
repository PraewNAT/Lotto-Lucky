import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { Science } from "@/lib/types";

export const runtime = "nodejs";

// POST — บันทึกผลของ 1 session (1 row ต่อ 1 science ที่ใช้)
export async function POST(req: Request) {
  const body = await req.json() as {
    sciences: Science[];
    hitBack2: boolean;
    hitBack3: boolean;
  };

  if (!Array.isArray(body.sciences) || body.sciences.length === 0) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const rows = body.sciences.map((science) => ({
    science,
    hit_back2: body.hitBack2,
    hit_back3: body.hitBack3,
  }));

  const { error } = await supabase.from("accuracy_log").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// GET — aggregate ต่อศาสตร์
export async function GET() {
  const { data, error } = await supabase
    .from("accuracy_log")
    .select("science, hit_back2, hit_back3");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sciences: Science[] = ["math", "astro", "numero", "fengshui"];
  const result = Object.fromEntries(
    sciences.map((sci) => {
      const rows = (data ?? []).filter((r) => r.science === sci);
      return [
        sci,
        {
          checked: rows.length,
          hitBack2: rows.filter((r) => r.hit_back2).length,
          hitBack3: rows.filter((r) => r.hit_back3).length,
        },
      ];
    })
  );

  return NextResponse.json(result);
}
