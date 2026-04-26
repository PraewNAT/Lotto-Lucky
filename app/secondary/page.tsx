import SecondaryPrize from "@/components/SecondaryPrize";

export const metadata = { title: "รางวัลรอง — Lotto Lucky" };

export default function SecondaryPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="eyebrow">รางวัลรอง</div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight3 text-ink">
          สุ่มเลขรางวัลรอง
        </h1>
        <p className="text-[14px] text-muted">
          เลขแนะนำสำหรับรางวัลที่ 2, 3, 4, 5 และเลขท้าย 3/2 ตัว
        </p>
      </header>
      <SecondaryPrize />
    </div>
  );
}
