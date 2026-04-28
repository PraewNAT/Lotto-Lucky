import Link from "next/link";
import PredictorDeck from "@/components/PredictorDeck";
import PredictHistory from "@/components/PredictHistory";
import ScrollToHash from "@/components/ScrollToHash";
import { fetchHistory } from "@/lib/lottoApi";

export const metadata = { title: "ทำนายเลขงวดถัดไป — Lotto Lucky" };
export const revalidate = 3600;

export default async function PredictPage() {
  const allDraws = await fetchHistory(0, 2550);
  const draws = allDraws.filter((d) => {
    const dt = new Date(d.date);
    return !isNaN(dt.getTime()) && dt.getFullYear() >= 2021;
  });

  return (
    <div className="space-y-8">
      <ScrollToHash />
      <header className="space-y-2">
        <div className="eyebrow">หน้าหลัก</div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight3 text-ink">
          ทำนายเลขงวดถัดไป
        </h1>
        <p className="text-[14px] text-muted">
          เลือกตำแหน่งที่ต้องการ แล้วดู Top 5 ที่อัลกอริทึม GA คัดจากสถิติ {draws.length} งวดย้อนหลัง
        </p>
      </header>

      <div className="rounded-lg border border-line bg-surface-2 px-4 py-3 text-[12.5px] text-ink-2 flex flex-col sm:flex-row sm:items-center gap-1.5">
        <span className="font-medium text-ink">อยากได้ชุด 6 หลักครบทุกรางวัล?</span>
        <span className="text-muted">ดูหน้าสุ่มเลข ที่ผสมเลขศาสตร์ + โหรา + ฮวงจุ้ย + สถิติ</span>
        <Link href="/random" className="text-accent hover:underline font-medium whitespace-nowrap">
          สุ่มเลข 6 หลัก →
        </Link>
      </div>

      <div className="card">
        <PredictorDeck
          draws={draws}
          latestDrawDate={draws[0]?.date}
          drawCount={draws.length}
        />
      </div>

      <PredictHistory draws={draws} />
    </div>
  );
}
