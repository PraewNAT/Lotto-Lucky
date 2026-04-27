// Curated Thai dream-symbol → lucky-number dictionary
// Sources: เลขนำโชคจากความฝัน (S_34010), 9786163901019, S_13308
// Plus widely-circulated Thai dream-interpretation conventions
//
// Each entry maps dream keywords to 2-digit numbers (and optional 3-digit hints).
// Numbers below are the conventional pairs found across multiple Thai dream books;
// when sources disagree, the most-frequent entries are kept.

export type DreamCategory =
  | "animal"
  | "person"
  | "nature"
  | "object"
  | "body"
  | "spirit"
  | "action"
  | "place"
  | "food";

export interface DreamSymbol {
  // Canonical Thai label shown to the user
  label: string;
  // Keywords (Thai) — substrings that, if present in dream text, trigger this symbol.
  // Include common synonyms and variants.
  keywords: string[];
  // 2-digit numbers (most authoritative pair first)
  two: string[];
  // Optional 3-digit hints
  three?: string[];
  // Brief Thai meaning (1 sentence)
  meaning: string;
  category: DreamCategory;
}

export const DREAM_SYMBOLS: DreamSymbol[] = [
  // ── Animals ────────────────────────────────────────────
  {
    label: "งู",
    keywords: ["งู", "อสรพิษ", "งูเหลือม", "งูจงอาง", "งูเห่า"],
    two: ["06", "90", "56", "89"],
    three: ["456", "789"],
    meaning: "เนื้อคู่ คนรัก หรือผู้มีอำนาจเข้ามาในชีวิต",
    category: "animal",
  },
  {
    label: "ช้าง",
    keywords: ["ช้าง", "ช้างเผือก"],
    two: ["19", "91", "41"],
    three: ["191", "419"],
    meaning: "ลาภใหญ่ บารมี ผู้ใหญ่อุปถัมภ์",
    category: "animal",
  },
  {
    label: "เสือ",
    keywords: ["เสือ", "พยัคฆ์"],
    two: ["31", "13", "63"],
    three: ["313", "631"],
    meaning: "อำนาจ การแข่งขัน ระวังศัตรู",
    category: "animal",
  },
  {
    label: "ปลา",
    keywords: ["ปลา", "ปลาทอง", "ปลาตัวใหญ่"],
    two: ["27", "72", "12"],
    three: ["227", "722"],
    meaning: "โชคทรัพย์ ความอุดมสมบูรณ์",
    category: "animal",
  },
  {
    label: "นก",
    keywords: ["นก", "นกแก้ว", "นกพิราบ"],
    two: ["28", "82", "08"],
    meaning: "ข่าวดี การติดต่อสื่อสาร",
    category: "animal",
  },
  {
    label: "หมา/สุนัข",
    keywords: ["หมา", "สุนัข", "ลูกหมา"],
    two: ["08", "80", "38"],
    meaning: "มิตรแท้ คนซื่อสัตย์ใกล้ตัว",
    category: "animal",
  },
  {
    label: "แมว",
    keywords: ["แมว", "ลูกแมว"],
    two: ["59", "95", "05"],
    meaning: "เสน่ห์ การเงินแอบเข้ามา",
    category: "animal",
  },
  {
    label: "วัว/ควาย",
    keywords: ["วัว", "ควาย", "โค"],
    two: ["46", "64", "06"],
    meaning: "งานหนักกำลังให้ผล อดทนแล้วได้ทรัพย์",
    category: "animal",
  },
  {
    label: "ม้า",
    keywords: ["ม้า", "ขี่ม้า"],
    two: ["35", "53", "05"],
    meaning: "การเดินทาง ก้าวหน้ารวดเร็ว",
    category: "animal",
  },
  {
    label: "จระเข้",
    keywords: ["จระเข้", "ตะเข้"],
    two: ["16", "76", "48"],
    meaning: "ระวังศัตรูซ่อนเร้น แต่รอดได้ทรัพย์",
    category: "animal",
  },
  {
    label: "เต่า",
    keywords: ["เต่า"],
    two: ["07", "70", "67"],
    meaning: "อายุยืน ความมั่นคง ค่อยเป็นค่อยไป",
    category: "animal",
  },
  {
    label: "หมู",
    keywords: ["หมู", "สุกร"],
    two: ["98", "89", "08"],
    meaning: "ลาภลอย การงานราบรื่น",
    category: "animal",
  },

  // ── People & spirits ──────────────────────────────────
  {
    label: "พระ/พระสงฆ์",
    keywords: ["พระ", "พระสงฆ์", "พระอุปัชฌาย์", "หลวงปู่", "หลวงพ่อ"],
    two: ["09", "90", "89"],
    three: ["089", "189"],
    meaning: "ได้ที่พึ่ง บุญหนุนนำ ปลดเปลื้องเคราะห์",
    category: "spirit",
  },
  {
    label: "ผี/วิญญาณ",
    keywords: ["ผี", "วิญญาณ", "ภูต", "ปีศาจ"],
    two: ["00", "11", "44"],
    meaning: "ผู้ตายมาบอกใบ้ ใส่ใจสัญญาณรอบตัว",
    category: "spirit",
  },
  {
    label: "พระสยามเทวาธิราช/เทวดา",
    keywords: ["เทวดา", "นางฟ้า", "เทพ"],
    two: ["39", "93", "99"],
    meaning: "สิ่งศักดิ์สิทธิ์คุ้มครอง โอกาสใหญ่กำลังมา",
    category: "spirit",
  },
  {
    label: "เด็กทารก",
    keywords: ["เด็ก", "ทารก", "เด็กแรกเกิด", "อุ้มเด็ก"],
    two: ["56", "65", "16"],
    meaning: "เริ่มต้นใหม่ ภาระที่กลายเป็นโชค",
    category: "person",
  },
  {
    label: "คนตาย",
    keywords: ["คนตาย", "ศพ", "งานศพ", "โลงศพ"],
    two: ["04", "40", "44"],
    three: ["404", "440"],
    meaning: "ปลดทุกข์ เริ่มต้นใหม่ มักให้เลขแม่น",
    category: "spirit",
  },
  {
    label: "พ่อแม่",
    keywords: ["พ่อ", "แม่", "บิดา", "มารดา"],
    two: ["29", "92", "12"],
    meaning: "ผู้ใหญ่ในครอบครัวให้พร อุปถัมภ์",
    category: "person",
  },
  {
    label: "คนรัก/คู่รัก",
    keywords: ["คนรัก", "แฟน", "คู่รัก", "จูบ"],
    two: ["67", "76", "06"],
    meaning: "ความสัมพันธ์ก้าวหน้า ลาภจากคู่",
    category: "person",
  },

  // ── Nature ────────────────────────────────────────────
  {
    label: "น้ำท่วม/น้ำ",
    keywords: ["น้ำท่วม", "น้ำเต็ม", "ทะเล", "แม่น้ำ"],
    two: ["37", "73", "07"],
    three: ["337", "373"],
    meaning: "ทรัพย์ไหลเข้า ระวังเสียทรัพย์ถ้าน้ำขุ่น",
    category: "nature",
  },
  {
    label: "ไฟไหม้",
    keywords: ["ไฟ", "ไฟไหม้", "เพลิง"],
    two: ["54", "45", "07"],
    three: ["545", "454"],
    meaning: "เปลี่ยนแปลงครั้งใหญ่ ลาภจากความวุ่นวาย",
    category: "nature",
  },
  {
    label: "ฟ้าผ่า/ฟ้าร้อง",
    keywords: ["ฟ้าผ่า", "ฟ้าร้อง", "ฟ้าแลบ"],
    two: ["33", "13", "31"],
    meaning: "ข่าวด่วน เรื่องน่าตกใจที่กลายเป็นโอกาส",
    category: "nature",
  },
  {
    label: "ฝนตก",
    keywords: ["ฝน", "ฝนตก"],
    two: ["79", "97", "07"],
    meaning: "เรื่องเดิมคลี่คลาย ทรัพย์มาแบบไม่คาด",
    category: "nature",
  },
  {
    label: "ดวงอาทิตย์",
    keywords: ["พระอาทิตย์", "ตะวัน", "ดวงอาทิตย์"],
    two: ["01", "10", "11"],
    meaning: "อำนาจ บารมี ความสำเร็จที่เห็นชัด",
    category: "nature",
  },
  {
    label: "ดวงจันทร์",
    keywords: ["พระจันทร์", "ดวงจันทร์", "เดือน"],
    two: ["02", "20", "22"],
    meaning: "ความเป็นแม่ ความนุ่มนวล ลาภเงียบ",
    category: "nature",
  },
  {
    label: "ดาว",
    keywords: ["ดาว", "ดาวตก"],
    two: ["05", "50", "55"],
    meaning: "ความหวัง โอกาสไกลตัวที่กำลังเข้ามา",
    category: "nature",
  },
  {
    label: "ต้นไม้ใหญ่",
    keywords: ["ต้นไม้", "ต้นโพธิ์", "ต้นไทร"],
    two: ["24", "42", "07"],
    meaning: "หลักยึดมั่นคง ผู้ใหญ่อุปถัมภ์",
    category: "nature",
  },

  // ── Body ──────────────────────────────────────────────
  {
    label: "ฟัน/ฟันหลุด",
    keywords: ["ฟันหลุด", "ฟันหัก", "ถอนฟัน"],
    two: ["38", "83", "08"],
    meaning: "ระวังคนใกล้ตัว แต่ทุกข์เก่าจะคลาย",
    category: "body",
  },
  {
    label: "ผม/ตัดผม",
    keywords: ["ตัดผม", "ผมยาว", "หวีผม"],
    two: ["15", "51", "05"],
    meaning: "ตัดเรื่องเก่า เริ่มต้นใหม่",
    category: "body",
  },
  {
    label: "เลือด",
    keywords: ["เลือด", "เลือดออก"],
    two: ["59", "95", "55"],
    meaning: "ลาภจากเรื่องไม่คาด การเงินสะดุดแล้วฟื้น",
    category: "body",
  },

  // ── Objects & places ─────────────────────────────────
  {
    label: "ทอง/ทองคำ",
    keywords: ["ทอง", "ทองคำ", "สร้อยทอง"],
    two: ["89", "98", "09"],
    three: ["089", "899"],
    meaning: "ทรัพย์มงคล ลาภยศใหญ่",
    category: "object",
  },
  {
    label: "เงิน",
    keywords: ["เงิน", "เงินสด", "ธนบัตร"],
    two: ["55", "67", "28"],
    meaning: "เงินสดเข้ามือ การหมุนเวียนคล่อง",
    category: "object",
  },
  {
    label: "บ้าน",
    keywords: ["บ้าน", "เรือน"],
    two: ["12", "21", "02"],
    meaning: "ครอบครัว ความมั่นคง การลงหลักปักฐาน",
    category: "place",
  },
  {
    label: "วัด",
    keywords: ["วัด", "เจดีย์", "อุโบสถ"],
    two: ["09", "90", "39"],
    meaning: "บุญเก่าหนุน ที่พึ่งทางใจ",
    category: "place",
  },
  {
    label: "รถ/รถยนต์",
    keywords: ["รถ", "รถยนต์", "ขับรถ"],
    two: ["35", "53", "08"],
    meaning: "การเดินทาง การเปลี่ยนงาน",
    category: "object",
  },
  {
    label: "เรือ",
    keywords: ["เรือ", "ล่องเรือ"],
    two: ["27", "72", "07"],
    meaning: "การเดินทางไกล ลาภจากต่างถิ่น",
    category: "object",
  },
  {
    label: "ดอกไม้",
    keywords: ["ดอกไม้", "ช่อดอกไม้"],
    two: ["16", "61", "06"],
    meaning: "ความรัก คำชม โอกาสใหม่",
    category: "nature",
  },
  {
    label: "อาหาร",
    keywords: ["อาหาร", "กินข้าว", "งานเลี้ยง"],
    two: ["32", "23", "03"],
    meaning: "ความอุดมสมบูรณ์ มิตรสหายช่วยเหลือ",
    category: "food",
  },

  // ── Common actions / misc ────────────────────────────
  {
    label: "บินได้",
    keywords: ["บิน", "บินได้", "ลอย"],
    two: ["46", "64", "04"],
    meaning: "ปลดปล่อย เป้าหมายใหญ่ใกล้สำเร็จ",
    category: "action",
  },
  {
    label: "ตกจากที่สูง",
    keywords: ["ตก", "ตกเหว", "ตกจาก"],
    two: ["43", "34", "04"],
    meaning: "เปลี่ยนสถานะ ระวังพลาดพลั้งช่วงสั้น",
    category: "action",
  },
  {
    label: "วิ่งหนี",
    keywords: ["วิ่งหนี", "ถูกไล่"],
    two: ["57", "75", "05"],
    meaning: "หลีกเลี่ยงปัญหาเดิม โอกาสใหม่รออยู่",
    category: "action",
  },
  {
    label: "แต่งงาน",
    keywords: ["แต่งงาน", "งานแต่ง"],
    two: ["22", "34", "69"],
    meaning: "ความสัมพันธ์ก้าวหน้า สัญญาใหญ่ใกล้เกิด",
    category: "action",
  },

  // ── Additional verified entries from S_13308 ก-section ───
  {
    label: "กบ",
    keywords: ["กบ"],
    two: ["11", "19", "32", "90"],
    three: ["114", "174", "523"],
    meaning: "กิจการระยะสั้นได้ผลกำไร ผลผลิตงอกงาม",
    category: "animal",
  },
  {
    label: "กระต่าย",
    keywords: ["กระต่าย"],
    two: ["41", "43", "34"],
    three: ["586", "438"],
    meaning: "อย่าตกใจกลัวก่อนเหตุ มั่นในเป้าที่ตั้งไว้",
    category: "animal",
  },
  {
    label: "กา",
    keywords: ["กา ", "อีกา", "นกกา"],
    two: ["04", "85", "22"],
    three: ["522"],
    meaning: "ภัยใกล้ตัว ต้องตั้งสติ",
    category: "animal",
  },
  {
    label: "กวาง",
    keywords: ["กวาง"],
    two: ["45", "06", "13"],
    three: ["529", "680", "806"],
    meaning: "เปลี่ยนแปลงตำแหน่งงาน ก้าวขึ้นที่สูง",
    category: "animal",
  },
  {
    label: "กุญแจ",
    keywords: ["กุญแจ"],
    two: ["47", "70", "74"],
    three: ["467", "764", "342"],
    meaning: "ปลดล็อกอุปสรรคเดิม ได้ตำแหน่งใหม่",
    category: "object",
  },
  {
    label: "กรรไกร",
    keywords: ["กรรไกร"],
    two: ["69", "80", "11"],
    three: ["690"],
    meaning: "ระวังผู้ใหญ่เจ็บป่วย ตัดเรื่องเก่า",
    category: "object",
  },
  {
    label: "ไข่",
    keywords: ["ไข่", "ฟองไข่"],
    two: ["11", "37"],
    meaning: "เริ่มต้นใหม่ ลาภเล็กกำลังฟักตัว",
    category: "object",
  },
  {
    label: "ขโมย",
    keywords: ["ขโมย", "ถูกขโมย", "โจร"],
    two: ["09", "21"],
    meaning: "เสียทรัพย์เล็กแต่ได้ลาภใหญ่ ระวังคนใกล้ตัว",
    category: "action",
  },
  {
    label: "ครู/อาจารย์",
    keywords: ["ครู", "อาจารย์"],
    two: ["05", "10"],
    meaning: "ผู้รู้ชี้ทาง ได้คำแนะนำที่เปลี่ยนชีวิต",
    category: "person",
  },
  {
    label: "เครื่องบิน",
    keywords: ["เครื่องบิน", "ขึ้นเครื่อง"],
    two: ["13", "21"],
    meaning: "การเดินทางไกล โอกาสไกลตัวใกล้เข้ามา",
    category: "object",
  },
];

export interface MatchedSymbol {
  symbol: DreamSymbol;
  matchedKeyword: string;
}

export function findSymbols(text: string, max = 6): MatchedSymbol[] {
  const found: MatchedSymbol[] = [];
  const seen = new Set<string>();
  for (const sym of DREAM_SYMBOLS) {
    for (const kw of sym.keywords) {
      if (text.includes(kw) && !seen.has(sym.label)) {
        found.push({ symbol: sym, matchedKeyword: kw });
        seen.add(sym.label);
        break;
      }
    }
    if (found.length >= max) break;
  }
  return found;
}

export interface NumberOption {
  n: string;
  from: string;  // short label: which symbol or "เลขท้าย 6 หลัก"
}

export interface PickedNumbers {
  six: string;
  sixFrom: string;       // e.g., "งู + ช้าง + น้ำ"
  threeOptions: NumberOption[];
  twoOptions: NumberOption[];
}

export function pickNumbers(matched: MatchedSymbol[], dreamText: string): PickedNumbers {
  const seed = [...dreamText].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rng = (mod: number, salt: number) => ((seed * (salt + 13)) >>> 0) % mod;

  if (matched.length === 0) {
    const six = rng(1_000_000, 1).toString().padStart(6, "0");
    return {
      six,
      sixFrom: "ลักษณะถ้อยคำในฝัน",
      threeOptions: [{ n: rng(1000, 2).toString().padStart(3, "0"), from: "ลักษณะถ้อยคำ" }],
      twoOptions: [{ n: six.slice(-2), from: "เลขท้าย 6 หลัก" }],
    };
  }

  const primary = matched[0].symbol;

  // 6-digit: stitch 2 from primary, 2 from secondary (or primary[1]), 2 from tertiary
  const a = primary.two[0];
  const b = matched[1]?.symbol.two[0] ?? primary.two[1] ?? rng(100, 5).toString().padStart(2, "0");
  const c = matched[2]?.symbol.two[0] ?? rng(100, 7).toString().padStart(2, "0");
  const six = (a + b + c).slice(0, 6).padStart(6, "0");
  const sixFrom = matched.slice(0, 3).map((m) => m.symbol.label).join(" + ");

  // 2-digit options: back2 of six first, then all from each symbol (preserve which symbol)
  const twoSeen = new Set<string>();
  const twoOptions: NumberOption[] = [];

  const back2 = six.slice(-2);
  twoSeen.add(back2);
  twoOptions.push({ n: back2, from: "เลขท้าย 6 หลัก" });

  for (const m of matched) {
    for (const n of m.symbol.two) {
      if (!twoSeen.has(n)) {
        twoSeen.add(n);
        twoOptions.push({ n, from: m.symbol.label });
      }
    }
  }

  // 3-digit options: from three field, track which symbol
  const threeSeen = new Set<string>();
  const threeOptions: NumberOption[] = [];

  for (const m of matched) {
    if (m.symbol.three) {
      for (const n of m.symbol.three) {
        if (!threeSeen.has(n)) {
          threeSeen.add(n);
          threeOptions.push({ n, from: m.symbol.label });
        }
      }
    }
  }
  if (threeOptions.length === 0) {
    const fallback = (a + b).slice(0, 3).padStart(3, "0");
    threeOptions.push({ n: fallback, from: `${matched[0].symbol.label} + ${matched[1]?.symbol.label ?? "ลักษณะฝัน"}` });
  }

  return {
    six,
    sixFrom,
    threeOptions: threeOptions.slice(0, 6),
    twoOptions: twoOptions.slice(0, 8),
  };
}
