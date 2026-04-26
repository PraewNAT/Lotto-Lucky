"use client";

import { Science, SCIENCE_LABEL, UserInput } from "@/lib/types";

interface Props {
  selected: Science[];
  onSelectedChange: (s: Science[]) => void;
  user: UserInput;
  onUserChange: (u: UserInput) => void;
}

export default function ScienceSelector({ selected, onSelectedChange, user, onUserChange }: Props) {
  const toggle = (s: Science) => {
    onSelectedChange(selected.includes(s) ? selected.filter((x) => x !== s) : [...selected, s]);
  };
  const set = (k: keyof UserInput, v: string | number | undefined) =>
    onUserChange({ ...user, [k]: v });

  const needBirthDate = selected.includes("astro") || selected.includes("numero");
  const needBirthTime = selected.includes("astro");
  const needProvince = selected.includes("astro");
  const needName = selected.includes("numero");
  const needBirthYear = selected.includes("fengshui");
  const needDirection = selected.includes("fengshui");

  return (
    <div className="card space-y-5">
      <div>
        <div className="eyebrow mb-2.5">ศาสตร์ที่ใช้</div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(SCIENCE_LABEL) as Science[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={`chip ${selected.includes(s) ? "chip-on" : "chip-off"}`}
            >
              {SCIENCE_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {(needBirthDate || needBirthTime || needProvince || needName || needBirthYear || needDirection) && (
        <div className="grid gap-3 md:grid-cols-2 pt-1">
          {needBirthDate && (
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-ink-2">วันเดือนปีเกิด</span>
              <input
                type="date"
                className="input"
                value={user.birthDate || ""}
                onChange={(e) => set("birthDate", e.target.value)}
              />
            </label>
          )}
          {needBirthTime && (
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-ink-2">เวลาเกิด <span className="text-subtle">(ถ้ามี)</span></span>
              <input
                type="time"
                className="input"
                value={user.birthTime || ""}
                onChange={(e) => set("birthTime", e.target.value)}
              />
            </label>
          )}
          {needProvince && (
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-ink-2">จังหวัดที่เกิด <span className="text-subtle">(ถ้ามี)</span></span>
              <input
                type="text"
                className="input"
                placeholder="เช่น กรุงเทพมหานคร"
                value={user.birthProvince || ""}
                onChange={(e) => set("birthProvince", e.target.value)}
              />
            </label>
          )}
          {needName && (
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-ink-2">ชื่อ-นามสกุล</span>
              <input
                type="text"
                className="input"
                placeholder="ชื่อจริง นามสกุล"
                value={user.fullName || ""}
                onChange={(e) => set("fullName", e.target.value)}
              />
            </label>
          )}
          {needBirthYear && (
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-ink-2">ปีเกิด (ค.ศ.)</span>
              <input
                type="number"
                min="1900"
                max="2100"
                className="input"
                placeholder="เช่น 1995"
                value={user.birthYear || ""}
                onChange={(e) => set("birthYear", e.target.value ? Number(e.target.value) : undefined)}
              />
            </label>
          )}
          {needDirection && (
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-ink-2">ทิศที่บ้านหันหน้า <span className="text-subtle">(ถ้ามี)</span></span>
              <select
                className="input"
                value={user.facingDirection || ""}
                onChange={(e) => set("facingDirection", e.target.value || undefined)}
              >
                <option value="">— ไม่ระบุ —</option>
                <option>เหนือ</option>
                <option>ใต้</option>
                <option>ตะวันออก</option>
                <option>ตะวันตก</option>
                <option>ตะวันออกเฉียงเหนือ</option>
                <option>ตะวันออกเฉียงใต้</option>
                <option>ตะวันตกเฉียงเหนือ</option>
                <option>ตะวันตกเฉียงใต้</option>
              </select>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
