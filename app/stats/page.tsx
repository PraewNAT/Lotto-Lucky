import HeatMap from "@/components/HeatMap";
import StatsChart from "@/components/StatsChart";
import Predictor from "@/components/Predictor";
import Leaderboard from "@/components/Leaderboard";
import { fetchHistory } from "@/lib/lottoApi";

export const metadata = { title: "สถิติ — Lotto Lucky" };
export const revalidate = 3600;

export default async function StatsPage() {
  // 5 ปีย้อนหลัง = 5 × 24 งวด/ปี = 120 งวด (เผื่อเล็กน้อยเป็น 130)
  const draws = await fetchHistory(130);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="eyebrow">สถิติ</div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight3 text-ink">
          สถิติ & Heatmap
        </h1>
        <p className="text-[14px] text-muted">
          ข้อมูลจาก {draws.length} งวด • อัปเดตอัตโนมัติทุก 1 ชั่วโมง
        </p>
      </header>

      <HeatMap draws={draws} />
      <StatsChart draws={draws} />
      <Predictor draws={draws} latestDrawDate={draws[0]?.date} />
      <Leaderboard draws={draws} />
    </div>
  );
}
