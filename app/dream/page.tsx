import DreamAnalyzer from "@/components/DreamAnalyzer";

export const metadata = { title: "ทำนายฝัน — Lotto Lucky" };

export default function DreamPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="eyebrow">ทำนายฝัน</div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight3 text-ink">
          วิเคราะห์ความฝัน
        </h1>
        <p className="text-[14px] text-muted">
          เล่าความฝันแบบอิสระ AI จะตีความและแปลงเป็นเลขมงคล
        </p>
      </header>
      <DreamAnalyzer />
    </div>
  );
}
