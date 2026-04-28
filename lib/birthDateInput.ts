/** ดึงเฉพาะตัวเลขสูงสุด 8 หลัก แล้วใส่ `/` อัตโนมัติ เป็น วว/ดด/ปปปป */
export function formatBirthDraftInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** แปลง ISO YYYY-MM-DD → แสดงเป็น วว/ดด/ปปปป (ค.ศ.) */
export function isoToDdMmYyyy(iso: string | undefined): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * แปลงข้อความ วว/ดด/ปปปป (ค.ศ.) เป็น ISO YYYY-MM-DD
 * รองรับตัวคั่น / หรือ - หรือ .
 */
export function parseDdMmYyyyToIso(text: string): string | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;

  const parts = trimmed.split(/[/\-.]/).map((p) => p.trim());
  if (parts.length !== 3) return undefined;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return undefined;

  if (year < 1900 || year > 2100) return undefined;
  if (month < 1 || month > 12) return undefined;
  if (day < 1 || day > 31) return undefined;

  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return undefined;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
