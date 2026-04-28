import HeatMap from "@/components/HeatMap";
import StatsChart from "@/components/StatsChart";
import Leaderboard from "@/components/Leaderboard";
import SameDayRepeats from "@/components/SameDayRepeats";
import ScrollToHash from "@/components/ScrollToHash";
import { fetchHistory } from "@/lib/lottoApi";

export const metadata = { title: "สถิติ — Lotto Lucky" };
export const revalidate = 3600;

export default async function StatsPage() {
  // ดึงข้อมูลทั้งหมดตั้งแต่ พ.ศ. 2550 (~459 งวด) เพื่อใช้สำหรับวิเคราะห์ระยะยาว
  const allDraws = await fetchHistory(0, 2550);
  // สำหรับ component ส่วนใหญ่ ใช้แค่ข้อมูลตั้งแต่ ค.ศ. 2021 (เน้น short-term pattern)
  const draws = allDraws.filter((d) => {
    const dt = new Date(d.date);
    return !isNaN(dt.getTime()) && dt.getFullYear() >= 2021;
  });

  return (
    <div className="space-y-8">
      <ScrollToHash />
      <header className="space-y-2">
        <div className="eyebrow">สถิติ</div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight3 text-ink">
          สถิติ & Heatmap
        </h1>
        <p className="text-[14px] text-muted">
          ข้อมูลย้อนหลัง 5 ปี ({draws.length} งวด) สำหรับสถิติทั่วไป •
          ข้อมูลทั้งหมด {allDraws.length} งวด สำหรับวิเคราะห์ระยะยาว •
          อัปเดตอัตโนมัติทุก 1 ชั่วโมง
        </p>
      </header>

      <HeatMap draws={draws} />
      <StatsChart draws={draws} />
      <SameDayRepeats draws={allDraws} />
      <Leaderboard />
    </div>
  );
}
