import { NextResponse } from "next/server";
import { fetchHistory, fetchLatest } from "@/lib/lottoApi";
import { summarize } from "@/lib/stats";

export const revalidate = 3600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "history";
  const limit = Number(searchParams.get("limit") || "24");

  if (mode === "latest") {
    const latest = await fetchLatest();
    return NextResponse.json({ latest });
  }

  const draws = await fetchHistory(limit);
  const stats = summarize(draws);
  return NextResponse.json({ draws, stats });
}
