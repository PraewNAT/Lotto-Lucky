import NotifyChecker from "@/components/NotifyChecker";

export const metadata = { title: "ตรวจรางวัล — Lotto Lucky" };

export default function NotifyPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="eyebrow">ตรวจรางวัล</div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight3 text-ink">
          แจ้งเตือนผลรางวัล
        </h1>
        <p className="text-[14px] text-muted">
          กรอกเลขสลากที่ซื้อไว้ ระบบจะตรวจให้อัตโนมัติเมื่อผลออก
        </p>
      </header>
      <NotifyChecker />
    </div>
  );
}
