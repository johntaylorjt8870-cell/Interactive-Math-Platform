// ============================================================
// أشكال درس «الانسحاب وخواصه» — geometry-u1-l1
// ============================================================
// هذه الأشكال إعادة بناء إحداثية أمينة للأشكال الواردة في صور صفحات
// الكتاب (ص 3–7)، وفق مبدأ المنصة: أشكال الكتاب محتوى منهجي يُعاد
// بناؤه بإحداثيات دقيقة (لا تقريب زخرفي)، مع الحفاظ على كل النقاط
// والحروف والقياسات والعلامات الموجودة في المصدر.
//
// ملاحظة: صور الصفحات المرفوعة غير متوفرة كملفات داخل المستودع،
// لذا تُبنى الأشكال هنا من القراءة البصرية للمصدر، والقياسات
// والعلامات كما وردت فيه. التفاصيل في docs/geometry-u1-l1-source-notes.md
// ============================================================

import type { FigureSpec } from "@/content/types";

type P = { id: string; x: number; y: number; label?: string };

const pt = (id: string, x: number, y: number, label?: string): P => ({ id, x, y, label });

/** قطعة مستقيمة بسيطة. */
const seg = (from: string, to: string, extra: Record<string, unknown> = {}) => ({
  from,
  to,
  ...extra,
});

// ============================================================
// شكل السؤال 3 (ص 3): متوازي أضلاع بقياساته
// AB = 5cm في الأعلى، الجانبان 4cm، ارتفاع أحمر 3cm عمودي على DC
// ============================================================
// الارتفاع 3 والضلع المائل 4 ⇒ الإزاحة الأفقية = جذر(16−9) ≈ 2.65
const SLANT = Math.sqrt(16 - 9);

export const figQ3Area: FigureSpec = {
  viewBox: [-1.2, -1.2, 10.4, 5.6],
  points: [
    pt("A", SLANT, 3, "A"),
    pt("B", SLANT + 5, 3, "B"),
    pt("C", 5, 0, "C"),
    pt("D", 0, 0, "D"),
    pt("H", SLANT, 0),
  ],
  segments: [
    seg("A", "B", { measure: "5 cm" }),
    seg("B", "C", { measure: "4 cm", equalGroup: "side" }),
    seg("C", "D"),
    seg("D", "A", { measure: "4 cm", equalGroup: "side" }),
    seg("A", "H", { measure: "3 cm", emphasis: true }),
  ],
  rightAngles: [{ vertex: "H", from: "A", to: "C" }],
  description:
    "متوازي الأضلاع ABCD: الضلع الأعلى AB = 5 سم، الجانبان AD و BC = 4 سم، والارتفاع النازل من A على DC بطول 3 سم مع علامة زاوية قائمة.",
  caption: "شكل الكتاب ص 3 — السؤال 3",
};

// ============================================================
// شكل السؤال 6 (ص 3): القطعتان [QP] و [NM] متناصفتان
// ============================================================
export const figQ6Segments: FigureSpec = {
  viewBox: [-3.2, -3.2, 6.4, 6.4],
  points: [
    pt("P", 0.8, 2.2, "P"),
    pt("Q", -0.8, -2.2, "Q"),
    pt("N", -2.2, -0.8, "N"),
    pt("M", 2.2, 0.8, "M"),
    pt("O", 0, 0),
  ],
  segments: [
    seg("P", "O", { equalGroup: "pq" }),
    seg("O", "Q", { equalGroup: "pq" }),
    seg("N", "O", { equalGroup: "nm" }),
    seg("O", "M", { equalGroup: "nm" }),
  ],
  description:
    "قطعتان مستقيمتان [QP] و [NM] تتقاطعان في منتصفهما المشترك: أنصاف [QP] متساوية بعلامتين، وأنصاف [NM] متساوية بعلامة.",
  caption: "شكل الكتاب ص 3 — السؤال 6",
};

// ============================================================
// شكل النشاط 2 (ص 4): شبكة منقّطة بسبع نقاط
// ============================================================
export const figSevenPoints: FigureSpec = {
  viewBox: [-0.6, -1.4, 9.2, 6.6],
  grid: { step: 1 },
  points: [
    pt("A", 1, 4, "A"),
    pt("B", 4, 4, "B"),
    pt("C", 7, 4, "C"),
    pt("E", 2, 2, "E"),
    pt("D", 5, 2, "D"),
    pt("F", 3, 0, "F"),
    pt("G", 6, 0, "G"),
    // إطار الشبكة كما في الكتاب
    pt("w1", -0.2, -0.8),
    pt("w2", 8.2, -0.8),
    pt("w3", 8.2, 5),
    pt("w4", -0.2, 5),
  ],
  segments: [seg("w1", "w2"), seg("w2", "w3"), seg("w3", "w4"), seg("w4", "w1")],
  description:
    "شبكة منقّطة عليها سبع نقاط: A و B و C في الصف الأعلى، و E و D في الصف الأوسط، و F و G في الصف الأسفل.",
  caption: "شكل الكتاب ص 4 — النشاط 2",
};

// ============================================================
// شكل النشاط 3 (ص 4): رباعيان مرسومان يدويًا ① و ②
// ============================================================
export const figHandQuads: FigureSpec = {
  viewBox: [-0.8, -1.4, 11.6, 6.2],
  points: [
    // الرباعي ② (يسار): U C E P مع القطر [UE] منتصَف، والضلعان UC و PE متساويان
    pt("U", 0, 3.6, "U"),
    pt("C", 3, 3.2, "C"),
    pt("E", 3.6, 0, "E"),
    pt("P", 0.6, 0.4, "P"),
    pt("O2", 1.8, 1.8),
    // الرباعي ① (يمين): L T E' M مع القطرين المنتصفين
    pt("L", 6.2, 3.8, "L"),
    pt("T", 9.6, 3.4, "T"),
    pt("E2", 8.8, 0, "E"),
    pt("M", 5.8, 0.2, "M"),
    pt("O1", 7.5, 1.8),
  ],
  segments: [
    seg("U", "C", { equalGroup: "s2" }),
    seg("C", "E"),
    seg("E", "P", { equalGroup: "s2" }),
    seg("P", "U"),
    seg("U", "O2", { equalGroup: "d2", emphasis: true }),
    seg("O2", "E", { equalGroup: "d2", emphasis: true }),
    seg("L", "T"),
    seg("T", "E2"),
    seg("E2", "M"),
    seg("M", "L"),
    seg("L", "O1", { equalGroup: "d1a", emphasis: true }),
    seg("O1", "E2", { equalGroup: "d1a", emphasis: true }),
    seg("T", "O1", { equalGroup: "d1b", emphasis: true }),
    seg("O1", "M", { equalGroup: "d1b", emphasis: true }),
  ],
  texts: [
    { x: 1.8, y: -0.9, text: "②", role: "math", anchor: "middle" },
    { x: 7.6, y: -0.9, text: "①", role: "math", anchor: "middle" },
  ],
  description:
    "رباعيان مرسومان يدويًا: ② يسارًا رباعي UCEP مع قطره [UE] وعلامات انتصافه وعلامتا تساوٍ على الضلعين UC و PE؛ و① يمينًا رباعي LTEM مع قطريه وعلامات انتصافهما.",
  caption: "شكل الكتاب ص 4 — النشاط 3",
};

// ============================================================
// شكل «تحقّق من فهمك» (ص 6–7): شريط 15 متوازي أضلاع
// ============================================================
// البناء: ثلاثة صفوف من متوازيات الأضلاع المائلة بين أربعة خطوط
// أفقية: y=3 (أعلى)، y=2 (خط A…F)، y=1، y=0 (خط A'…F').
// الميل: الإزاحة الأفقية = 0.5 لكل وحدة ارتفاع.
const stripNumsTop = ["①", "④", "⑦", "⑩", "⑬"];
const stripNumsMid = ["②", "⑤", "⑧", "⑪", "⑭"];
const stripNumsBot = ["③", "⑥", "⑨", "⑫", "⑮"];

function buildStrip(): FigureSpec {
  const points: P[] = [];
  const segments: FigureSpec["segments"] = [];
  const texts: FigureSpec["texts"] = [];
  const k = 0.5; // الميل
  const xAt = (c: number, y: number) => c + k * y;

  // حروف الخطين الأوسط والأسفل
  // الحروف A…F على رؤوس الحواف العليا للصف الأوسط (كما في الكتاب)،
  // وA'…F' على رؤوس الحواف السفلى للصف الأسفل.
  const letters = ["A", "B", "C", "D", "E", "F"];
  letters.forEach((label, i) => points.push(pt(`M${i}`, xAt(i + 1, 2), 2, label)));
  letters.forEach((label, i) => points.push(pt(`B${i}`, xAt(i, 0), 0, `${label}'`)));

  const tile = (tag: string, quad: [number, number][]): string[] => {
    const ids = quad.map(([x, y], i) => {
      const id = `${tag}${i}`;
      points.push(pt(id, x, y));
      return id;
    });
    for (let i = 0; i < 4; i += 1) segments.push(seg(ids[i], ids[(i + 1) % 4]));
    return ids;
  };

  for (let c = 0; c < 5; c += 1) {
    // الصف الأعلى بين y=2 و y=3
    tile(`T${c}`, [
      [xAt(c + 1, 2), 2],
      [xAt(c + 2, 2), 2],
      [xAt(c + 2, 3), 3],
      [xAt(c + 1, 3), 3],
    ]);
    texts.push({ x: xAt(c + 1.5, 2.5), y: 2.5, text: stripNumsTop[c], role: "math", anchor: "middle" });
    // الصف الأوسط بين y=1 و y=2
    tile(`M${c}`, [
      [xAt(c + 1, 1), 1],
      [xAt(c + 2, 1), 1],
      [xAt(c + 2, 2), 2],
      [xAt(c + 1, 2), 2],
    ]);
    texts.push({ x: xAt(c + 1.5, 1.5), y: 1.5, text: stripNumsMid[c], role: "math", anchor: "middle" });
    // الصف الأسفل بين y=0 و y=1
    tile(`B${c}`, [
      [xAt(c, 0), 0],
      [xAt(c + 1, 0), 0],
      [xAt(c + 1, 1), 1],
      [xAt(c, 1), 1],
    ]);
    texts.push({ x: xAt(c + 0.5, 0.5), y: 0.5, text: stripNumsBot[c], role: "math", anchor: "middle" });
  }

  return {
    viewBox: [-0.6, -1, 8.4, 5],
    points,
    segments,
    texts,
    description:
      "شريط من 15 متوازي أضلاع مرقومة 1–15 في ثلاثة صفوف، والحروف A حتى F على الخط الأوسط، وA' حتى F' على الخط الأسفل.",
    caption: "شكل الكتاب ص 6 — تحقّق من فهمك ①",
  };
}

export const figStrip15: FigureSpec = buildStrip();
