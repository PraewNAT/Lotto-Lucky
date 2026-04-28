import Link from "next/link";
import Predictor from "@/components/Predictor";
import ScrollToHash from "@/components/ScrollToHash";
import { fetchHistory } from "@/lib/lottoApi";

export const metadata = { title: "ทำนายเลขงวดถัดไป — Lotto Lucky" };
export const revalidate = 3600;

export default async function PredictPage() {
  // ใช้ข้อมูลตั้งแต่ ค.ศ. 2021 (เน้น short-term pattern) เหมือนหน้าสถิติ
  const allDraws = await fetchHistory(0, 2550);
  const draws = allDraws.filter((d) => {
    const dt = new Date(d.date);
    return !isNaN(dt.getTime()) && dt.getFullYear() >= 2021;
  });
  const latestDate = draws[0]?.date;

  return (
    <div className="space-y-8">
      <ScrollToHash />
      <header className="space-y-2">
        <div className="eyebrow">หน้าหลัก</div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight3 text-ink">
          ทำนายเลขงวดถัดไป
        </h1>
        <p className="text-[14px] text-muted">
          วิเคราะห์ <strong className="text-ink-2">3 ตัวหน้า / 3 ตัวหลัง / 2 ตัวท้าย</strong>{" "}
          ด้วยอัลกอริทึม GA จากสถิติ {draws.length} งวดย้อนหลัง — ใช้ตำแหน่งหลัก ผลรวม
          สมดุลคู่/คี่ และความใหม่ในการคัดเลข
        </p>
      </header>

      <div className="rounded-lg border border-line bg-surface-2 px-4 py-3 text-[12.5px] text-ink-2 flex flex-col sm:flex-row sm:items-center gap-1.5">
        <span className="font-medium text-ink">อยากได้ชุด 6 หลักครบทุกรางวัล?</span>
        <span className="text-muted">ดูที่หน้าสุ่มเลข ที่ใช้เลขศาสตร์ + โหรา + ฮวงจุ้ย ผสมกับสถิติ</span>
        <Link
          href="/random"
          className="text-accent hover:underline font-medium whitespace-nowrap"
        >
          สุ่มเลข 6 หลัก →
        </Link>
      </div>

      <div id="predict-front3" className="scroll-mt-28 md:scroll-mt-24">
        <Predictor draws={draws} latestDrawDate={latestDate} kind="front3" />
      </div>

      <div id="predict-back3" className="scroll-mt-28 md:scroll-mt-24">
        <Predictor draws={draws} latestDrawDate={latestDate} kind="back3" />
      </div>

      <div id="predict-back2" className="scroll-mt-28 md:scroll-mt-24">
        <Predictor draws={draws} latestDrawDate={latestDate} kind="back2" />
      </div>
    </div>
  );
}
