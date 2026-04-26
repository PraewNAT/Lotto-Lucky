"use client";

import { useEffect, useState } from "react";
import type { LottoDraw } from "@/lib/types";

const KEY = "lotto-lucky:tickets";

interface Match {
  ticket: string;
  prize: string | null;
  amount: number;
}

function checkTicket(ticket: string, latest: LottoDraw): Match {
  const t = ticket.replace(/\D/g, "");
  if (t.length !== 6) return { ticket, prize: null, amount: 0 };
  const p = latest.prizes;
  if (t === p.first) return { ticket, prize: "รางวัลที่ 1", amount: 6_000_000 };
  if (p.front3.includes(t.slice(0, 3))) return { ticket, prize: "เลขหน้า 3 ตัว", amount: 4_000 };
  if (p.back3.includes(t.slice(-3))) return { ticket, prize: "เลขท้าย 3 ตัว", amount: 4_000 };
  if (t.slice(-2) === p.back2) return { ticket, prize: "เลขท้าย 2 ตัว", amount: 2_000 };
  const f = Number(p.first);
  if (!isNaN(f) && Math.abs(Number(t) - f) === 1)
    return { ticket, prize: "ใกล้เคียงรางวัลที่ 1", amount: 100_000 };
  return { ticket, prize: null, amount: 0 };
}

export default function NotifyChecker() {
  const [tickets, setTickets] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [latest, setLatest] = useState<LottoDraw | null>(null);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setTickets(JSON.parse(raw));
    } catch {}
    fetch("/api/lotto?mode=latest")
      .then((r) => r.json())
      .then((j) => setLatest(j.latest))
      .catch(() => {});
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  function persist(next: string[]) {
    setTickets(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }

  function add() {
    const t = input.replace(/\D/g, "");
    if (t.length !== 6) return;
    if (tickets.includes(t)) return;
    persist([...tickets, t]);
    setInput("");
  }

  function remove(t: string) {
    persist(tickets.filter((x) => x !== t));
  }

  async function askPermission() {
    if (!("Notification" in window)) {
      alert("เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน");
      return;
    }
    const p = await Notification.requestPermission();
    setPushPermission(p);
    if (p === "granted") {
      new Notification("Lotto Lucky", {
        body: "เปิดการแจ้งเตือนเรียบร้อย • จะแจ้งเมื่อผลงวดใหม่ออก",
      });
    }
  }

  const matches = latest ? tickets.map((t) => checkTicket(t, latest)) : [];
  const totalWin = matches.reduce((a, m) => a + m.amount, 0);

  return (
    <div className="space-y-5">
      <section className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="eyebrow">งวดล่าสุด</div>
            <div className="mt-1 text-[15px] font-medium text-ink">
              {latest ? latest.date : "กำลังโหลด..."}
            </div>
          </div>
          <button
            onClick={askPermission}
            disabled={pushPermission === "granted"}
            className={pushPermission === "granted" ? "btn-secondary" : "btn-primary"}
          >
            {pushPermission === "granted" ? "เปิดแจ้งเตือนแล้ว" : "เปิดแจ้งเตือน"}
          </button>
        </div>
        {latest && (
          <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <Stat label="รางวัลที่ 1" value={latest.prizes.first} large />
            <Stat label="เลขหน้า 3 ตัว" value={latest.prizes.front3.join(" / ")} />
            <Stat label="เลขท้าย 3 ตัว" value={latest.prizes.back3.join(" / ")} />
            <Stat label="เลขท้าย 2 ตัว" value={latest.prizes.back2} large />
          </div>
        )}
      </section>

      <section className="card space-y-4">
        <h3 className="text-[15px] font-semibold tracking-tight2 text-ink">
          สลากที่ซื้อไว้
        </h3>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="กรอกเลข 6 หลัก"
            inputMode="numeric"
            maxLength={6}
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))}
          />
          <button onClick={add} className="btn-primary" disabled={input.length !== 6}>
            เพิ่ม
          </button>
        </div>

        {tickets.length === 0 ? (
          <p className="text-[13px] text-muted">ยังไม่มีสลากที่บันทึกไว้</p>
        ) : (
          <ul className="divide-y divide-line-subtle">
            {tickets.map((t) => {
              const m = matches.find((x) => x.ticket === t);
              return (
                <li key={t} className="flex items-center justify-between py-2.5">
                  <span className="num-sm">{t}</span>
                  <div className="flex items-center gap-3">
                    {m?.prize ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-success-soft px-2 py-1 text-[12px] font-medium text-success">
                        {m.prize} • {m.amount.toLocaleString()} ฿
                      </span>
                    ) : (
                      <span className="text-[12px] text-muted">ไม่ถูกรางวัล</span>
                    )}
                    <button
                      onClick={() => remove(t)}
                      className="text-[12px] text-muted hover:text-danger"
                    >
                      ลบ
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {totalWin > 0 && (
          <div className="rounded-lg bg-success-soft p-3 text-[14px] text-success">
            🎉 รวมเงินรางวัล <strong>{totalWin.toLocaleString()}</strong> บาท
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3 text-center">
      <div className="eyebrow">{label}</div>
      <div className={`mt-1 ${large ? "num-md" : "num-sm"}`}>{value}</div>
    </div>
  );
}
