import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Thai } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const notoSans = Noto_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const notoSansThai = Noto_Sans_Thai({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-sans-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lotto Lucky — สุ่มเลขสลากกินแบ่ง",
  description: "สุ่มเลขสลากกินแบ่งรัฐบาลด้วยศาสตร์หลากหลาย",
};

const NAV = [
  { href: "/", label: "ทำนายงวดถัดไป" },
  { href: "/random", label: "สุ่มเลข" },
  { href: "/secondary", label: "รางวัลรอง" },
  { href: "/dream", label: "ทำนายฝัน" },
  { href: "/horoscope", label: "ดวงรายวัน" },
  { href: "/stats", label: "สถิติ" },
  { href: "/notify", label: "ตรวจรางวัล" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${notoSans.variable} ${notoSansThai.variable} font-sans`}>
        <header className="sticky top-0 z-30 border-b border-line bg-surface/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 md:px-6 h-14">
            <Link href="/" className="flex items-center gap-2 group">
              <span
                aria-hidden
                className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent text-white text-[11px] font-semibold"
              >
                L
              </span>
              <span className="text-[14px] font-semibold tracking-tight2 text-ink">
                Lotto Lucky
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-0.5 text-[13px]">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-md px-2.5 py-1.5 font-medium text-ink-2 hover:bg-surface-2 hover:text-ink transition"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <nav className="md:hidden flex overflow-x-auto gap-1 px-3 pb-2 text-[12px]">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="whitespace-nowrap rounded-md px-2.5 py-1 font-medium text-ink-2 hover:bg-surface-2"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 md:px-6 py-8 md:py-12">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 md:px-6 pb-12 pt-4 text-center text-[12px] text-muted">
          เพื่อความบันเทิงเท่านั้น • ไม่ได้รับรองโดยสำนักงานสลากกินแบ่งรัฐบาล
        </footer>
      </body>
    </html>
  );
}
