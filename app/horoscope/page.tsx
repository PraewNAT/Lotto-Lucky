import DailyHoroscope from "@/components/DailyHoroscope";

export const metadata = { title: "ดวงรายวัน — Lotto Lucky" };

export default function HoroscopePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="eyebrow">ดวงรายวัน</div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight3 text-ink">
          ดวงชะตารายวัน
        </h1>
        <p className="text-[14px] text-muted">
          เลขมงคลประจำวันที่ปรับตามดาวประจำวันและธาตุเกิด
        </p>
      </header>
      <DailyHoroscope />
    </div>
  );
}
