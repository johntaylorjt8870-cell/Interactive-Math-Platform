// ============================================================
// أشكال مصوّرة مخصّصة — درس «الانسحاب وخواصه» (geometry-u1-l1)
// ============================================================
// بعض أشكال المصدر (الترصيف الصليبي، صورة المتزلّجين، الشبكة المثلثية،
// منطقة نصفي القرص، وجدول «لماذا ليس انسحابًا») لا تُختزل إلى نقاط
// وقطع فقط، لذا تُعرض هنا كخطوات `custom` برسوم SVG مرسومة يدويًا
// بأمانة لمصدرها: نفس العناصر، نفس الحروف، نفس القياسات والألوان
// التقريبية (أزرق/أحمر/أصفر كما في الكتاب).
//
// قاعدة التدقيق: كل <text> داخل SVG يحمل direction صريحًا.
// ============================================================

import type { ReactNode } from "react";

const BLUE = "#2e6da4";
const RED = "#c0392b";
const YELLOW = "#f2d15e";
const BROWN = "#b8862b";
const LIGHTBLUE = "#bcd3ea";

function FigureFrame({
  caption,
  viewBox,
  children,
}: {
  caption: string;
  viewBox: string;
  children: ReactNode;
}) {
  return (
    <figure className="geo-figure">
      <div className="geo-canvas">
        <svg viewBox={viewBox} role="img" aria-label={caption} style={{ width: "100%", height: "auto" }}>
          {children}
        </svg>
      </div>
      <figcaption className="geo-caption">{caption}</figcaption>
    </figure>
  );
}

/** نص داخل SVG — اتجاه صريح دائمًا (قاعدة التدقيق). */
function T({
  x,
  y,
  children,
  fill = "#0f172a",
  size = 0.42,
  anchor = "middle",
}: {
  x: number;
  y: number;
  children: string;
  fill?: string;
  size?: number;
  anchor?: "start" | "middle" | "end";
}) {
  return (
    <text x={x} y={y} fill={fill} fontSize={size} direction="ltr" textAnchor={anchor}>
      {children}
    </text>
  );
}

// ============================================================
// 1) ترصيف أرصفة دمشق (ص 5) — صلبان متشابكة بلونين
// ============================================================
// الصليب اليوناني يرقّع المستوى بالانتقالين u=(1,2) و v=(2,−1).
const CROSS_W = 0.5;
const CROSS_L = 1.5;

function crossPath(cx: number, cy: number, m: (x: number, y: number) => string): string {
  const w = CROSS_W;
  const l = CROSS_L;
  const pts: [number, number][] = [
    [cx - w, cy + l],
    [cx + w, cy + l],
    [cx + w, cy + w],
    [cx + l, cy + w],
    [cx + l, cy - w],
    [cx + w, cy - w],
    [cx + w, cy - l],
    [cx - w, cy - l],
    [cx - w, cy - w],
    [cx - l, cy - w],
    [cx - l, cy + w],
    [cx - w, cy + w],
  ];
  return `M ${pts.map(([x, y]) => m(x, y)).join(" L ")} Z`;
}

export function TessellationStep() {
  // تحويل إحداثيات رياضية → إحداثيات شاشة
  const m = (x: number, y: number) => `${(x + 1).toFixed(2)},${(7.5 - y).toFixed(2)}`;
  const crosses: { d: string; alt: boolean }[] = [];
  for (let i = -4; i <= 5; i += 1) {
    for (let j = -4; j <= 5; j += 1) {
      const cx = i * 1 + j * 2;
      const cy = i * 2 - j * 1;
      if (cx < -2.5 || cx > 9.5 || cy < -1.5 || cy > 8) continue;
      crosses.push({ d: crossPath(cx, cy, m), alt: ((i + j) % 2 + 2) % 2 === 0 });
    }
  }
  const letters: [string, number, number][] = [
    ["B", 2, 4.8],
    ["A", 6, 4.6],
    ["D", 1.6, 3.4],
    ["F", 3.4, 2.6],
    ["M", 4.4, 3.0],
    ["C", 5.6, 3.2],
    ["E", 7.6, 3.0],
    ["G", -0.6, 2.6],
    ["N", 4.0, 1.6],
    ["P", 5.2, 1.6],
  ];
  const stones: [string, number, number][] = [
    ["①", 6.5, 3.2],
    ["②", 1.1, 3.2],
    ["③", 3.0, 2.9],
    ["④", 4.5, 1.9],
    ["⑤", -0.2, 2.3],
    ["⑥", 5.2, 2.7],
    ["⑦", 4.5, 3.6],
    ["⑧", 0.7, 2.7],
    ["⑨", 6.6, 2.3],
    ["⑩", 2.0, 2.2],
    ["⑪", 3.6, 1.0],
    ["⑫", -0.5, 1.2],
  ];
  return (
    <FigureFrame caption="شكل الكتاب ص 5 — ترصيف أرصفة دمشق: حجارة صليبية متشابكة بحجرين ملونين" viewBox="0 0 10.5 8">
      {crosses.map((c, i) => (
        <path key={i} d={c.d} fill={c.alt ? BROWN : YELLOW} stroke="#ffffff" strokeWidth={0.03} />
      ))}
      {letters.map(([label, x, y]) => (
        <g key={label}>
          <circle cx={x + 1} cy={7.5 - y} r={0.09} fill="#0f172a" />
          <T x={x + 1} y={7.5 - y - 0.18} size={0.46}>
            {label}
          </T>
        </g>
      ))}
      {stones.map(([n, x, y]) => (
        <T key={n} x={x + 1} y={7.5 - y} fill={RED} size={0.44}>
          {n}
        </T>
      ))}
    </FigureFrame>
  );
}

// ============================================================
// 2) المتزلّجان (ص 6) — مخطط موازٍ لصورة الكتاب الفوتوغرافية
// ============================================================
function Skier({ ox, oy, tag }: { ox: number; oy: number; tag: "" | "'" }) {
  // شكل تخطيطي مبسّط للمتزلج (جسم منحطّ + لوح تزلج)
  return (
    <g transform={`translate(${ox} ${oy})`}>
      <path d="M -1.4 0.7 L 2.4 0.25" stroke="#8b5a2b" strokeWidth={0.14} fill="none" />
      <path
        d="M 0.1 0.45 C 0.0 -0.2 0.35 -0.75 0.85 -0.95 C 1.3 -1.12 1.75 -0.95 1.85 -0.55 C 1.9 -0.25 1.6 -0.1 1.35 -0.05 L 2.1 0.15 L 1.2 0.4 Z"
        fill="#3b6ea5"
        stroke="#274f79"
        strokeWidth={0.06}
      />
      <circle cx={1.5} cy={-1.15} r={0.3} fill="#d9a441" />
      <path d="M 1.2 -1.3 A 0.3 0.3 0 0 1 1.8 -1.3 L 1.8 -1.15 L 1.2 -1.15 Z" fill={RED} />
      <path d="M 0.5 -0.5 L -0.7 -0.35" stroke="#0f172a" strokeWidth={0.07} fill="none" />
      {/* نقاط الشكل */}
      <circle cx={0.55} cy={-0.15} r={0.07} fill="#0f172a" />
      <circle cx={1.9} cy={-0.25} r={0.07} fill="#0f172a" />
      <circle cx={-0.7} cy={-0.35} r={0.07} fill="#0f172a" />
      <circle cx={0.15} cy={-0.3} r={0.07} fill="#0f172a" />
      <circle cx={2.4} cy={0.25} r={0.07} fill="#0f172a" />
      <T x={0.45} y={-0.35} size={0.4}>{`N${tag}`}</T>
      <T x={2.15} y={-0.35} size={0.4}>{`M${tag}`}</T>
      <T x={-0.95} y={-0.5} size={0.4}>{`P${tag}`}</T>
      <T x={0.0} y={-0.55} size={0.4}>{`S${tag}`}</T>
      <T x={2.6} y={0.55} size={0.44}>{tag === "" ? "A" : "B"}</T>
      <T x={-0.6} y={-1.1} size={0.46} fill="#334155">{tag === "" ? "F" : "F'"}</T>
    </g>
  );
}

export function SkierStep() {
  return (
    <FigureFrame
      caption="شكل الكتاب ص 6 — عند التزلّج من A إلى B ينطبق الشكل F على الشكل F' (رسم تخطيطي موازٍ لصورة الكتاب)"
      viewBox="0 0 16 7"
    >
      <path d="M 0.5 4.6 L 6.5 3.9" stroke={LIGHTBLUE} strokeWidth={0.5} fill="none" />
      <path d="M 9 5.6 L 15.5 4.9" stroke={LIGHTBLUE} strokeWidth={0.5} fill="none" />
      <Skier ox={2.6} oy={3.6} tag="" />
      <Skier ox={11.2} oy={4.5} tag="'" />
      <defs>
        <marker id="tr-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M 0 0 L 7 3.5 L 0 7 z" fill={RED} />
        </marker>
      </defs>
      <path d="M 4.5 3.35 L 12.9 4.2" stroke={RED} strokeWidth={0.07} fill="none" markerEnd="url(#tr-arrow)" />
      <path d="M 1.9 3.25 L 10.3 4.1" stroke={RED} strokeWidth={0.07} fill="none" markerEnd="url(#tr-arrow)" />
    </FigureFrame>
  );
}

// ============================================================
// 3) الشبكة المثلثية مع 8 أشكال صفراء (ص 7 — تدرّب ①)
// ============================================================
export function TriGridStep() {
  const h = 0.87;
  const rows = 4;
  const cols = 10;
  const segs: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let r = 0; r <= rows; r += 1) segs.push({ x1: 0, y1: r * h, x2: cols, y2: r * h });
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c <= cols; c += 1) {
      segs.push({ x1: c, y1: r * h, x2: c + 0.5, y2: (r + 1) * h });
      segs.push({ x1: c + 0.5, y1: (r + 1) * h, x2: c + 1, y2: r * h });
    }
  }
  const shapes: [string, number, number][] = [
    ["①", 1, 1],
    ["②", 3, 1],
    ["③", 5, 0],
    ["④", 7, 1],
    ["⑤", 1, 2],
    ["⑥", 3, 2],
    ["⑦", 5, 2],
    ["⑧", 7, 2],
  ];
  return (
    <FigureFrame caption="شكل الكتاب ص 7 — تدرّب ①: شبكة مثلثية عليها ثمانية أشكال صفراء مرقومة" viewBox="-0.3 -0.3 10.6 4.1">
      {segs.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#7ea6d9" strokeWidth={0.035} />
      ))}
      {shapes.map(([n, c, r]) => (
        <g key={n}>
          <path
            d={`M ${c + 0.5} ${(r + 1) * h} L ${c + 1.5} ${(r + 1) * h} L ${c + 1} ${r * h} L ${c} ${r * h} Z`}
            fill={YELLOW}
            stroke="#d9b23a"
            strokeWidth={0.03}
          />
          <T x={c + 0.75} y={r * h + 0.62} fill={RED} size={0.4}>
            {n}
          </T>
        </g>
      ))}
    </FigureFrame>
  );
}

// ============================================================
// 4) منطقة نصفي القرص (ص 7 — تدرّب ②)
// ============================================================
export function SemicircleStep() {
  return (
    <FigureFrame
      caption="شكل الكتاب ص 7 — تدرّب ②: مستطيل ABCD بطول 6 سم وعرض 3 سم اقتُطع منه نصف قرص على [AD] وأضيف نصف قرص مماثل على [BC]"
      viewBox="0 0 12 6"
    >
      <path
        d="M 2.5 1.5 L 8.5 1.5 A 1.5 1.5 0 0 1 8.5 4.5 L 2.5 4.5 A 1.5 1.5 0 0 0 2.5 1.5 Z"
        fill={LIGHTBLUE}
        stroke={BLUE}
        strokeWidth={0.06}
      />
      <line x1={2.5} y1={1.5} x2={2.5} y2={4.5} stroke={RED} strokeWidth={0.05} strokeDasharray="0.18 0.12" />
      <line x1={8.5} y1={1.5} x2={8.5} y2={4.5} stroke={RED} strokeWidth={0.05} strokeDasharray="0.18 0.12" />
      <defs>
        <marker id="dim-a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M 0 0 L 6 3 L 0 6 z" fill={RED} />
        </marker>
      </defs>
      <line x1={2.7} y1={0.9} x2={8.3} y2={0.9} stroke={RED} strokeWidth={0.05} markerEnd="url(#dim-a)" markerStart="url(#dim-a)" />
      <T x={5.5} y={0.65} fill={RED} size={0.42}>
        6 cm
      </T>
      <line x1={1.6} y1={1.7} x2={1.6} y2={4.3} stroke={RED} strokeWidth={0.05} markerEnd="url(#dim-a)" markerStart="url(#dim-a)" />
      <T x={1.15} y={3.1} fill={RED} size={0.42}>
        3 cm
      </T>
      <T x={2.5} y={1.15} size={0.46}>A</T>
      <T x={8.5} y={1.15} size={0.46}>B</T>
      <T x={8.5} y={5.1} size={0.46}>C</T>
      <T x={2.5} y={5.1} size={0.46}>D</T>
    </FigureFrame>
  );
}

// ============================================================
// 5) جدول «لماذا ليس انسحابًا» (ص 7 — ②)
// ============================================================
const BIRD: [number, number][] = [
  [0.4, 2.6],
  [1.4, 3.0],
  [2.4, 2.6],
  [1.9, 2.0],
  [2.2, 1.3],
  [1.3, 1.7],
  [0.8, 1.3],
];

function poly(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${x},${y}`).join(" ");
}

export function NotTranslationStep() {
  const bandY = 4.1;
  return (
    <FigureFrame
      caption="شكل الكتاب ص 7 — ②: أربعة أعمدة، في كل عمود شكل أزرق وشكل أحمر ليس صورة له وفق انسحاب"
      viewBox="0 0 13 4.9"
    >
      {/* العمود ④ (يسار): دائرتان متحدتا المركز مختلفتا نصف القطر */}
      <circle cx={1.6} cy={2.1} r={1.15} fill="none" stroke={BLUE} strokeWidth={0.09} />
      <circle cx={1.6} cy={2.1} r={0.72} fill="none" stroke={RED} strokeWidth={0.09} />
      <rect x={0.1} y={bandY} width={3.1} height={0.7} fill="#f0b79a" />
      <T x={1.6} y={bandY + 0.5} fill={RED} size={0.44}>④</T>
      {/* العمود ③: شكلان معكوسان (علمان) */}
      <g stroke={BLUE} strokeWidth={0.09} fill="none">
        <polyline points="3.6,3.3 5.0,3.3 5.0,1.7" />
        <polyline points="3.6,3.3 3.6,2.5" />
      </g>
      <g stroke={RED} strokeWidth={0.09} fill="none" transform="translate(9.4 0) scale(-1 1)">
        <polyline points="3.6,3.3 5.0,3.3 5.0,1.7" />
        <polyline points="3.6,3.3 3.6,2.5" />
      </g>
      <rect x={3.35} y={bandY} width={3.1} height={0.7} fill="#c9e0b6" />
      <T x={4.9} y={bandY + 0.5} fill={RED} size={0.44}>③</T>
      {/* العمود ②: حرفا A مختلفا القياس */}
      <g stroke={BLUE} strokeWidth={0.09} fill="none">
        <line x1={7.4} y1={3.4} x2={6.8} y2={1.4} />
        <line x1={7.4} y1={3.4} x2={8.0} y2={1.4} />
        <line x1={7.05} y1={2.5} x2={7.75} y2={2.5} />
      </g>
      <g stroke={RED} strokeWidth={0.09} fill="none">
        <line x1={7.4} y1={3.9} x2={6.5} y2={1.0} transform="translate(0 -0.1)" />
        <line x1={7.4} y1={3.9} x2={8.3} y2={1.0} transform="translate(0 -0.1)" />
        <line x1={6.9} y1={2.4} x2={7.9} y2={2.4} transform="translate(0 -0.1)" />
      </g>
      <rect x={6.6} y={bandY} width={3.1} height={0.7} fill="#d9d9d9" />
      <T x={8.15} y={bandY + 0.5} fill={RED} size={0.44}>②</T>
      {/* العمود ① (يمين): شكلان متعاكسا الاتجاه */}
      <g transform="translate(9.85 0)">
        <polygon points={poly(BIRD)} fill="none" stroke={BLUE} strokeWidth={0.09} />
        <g transform="translate(2.8 4.4) rotate(180)">
          <polygon points={poly(BIRD)} fill="none" stroke={RED} strokeWidth={0.09} />
        </g>
      </g>
      <rect x={9.85} y={bandY} width={3.1} height={0.7} fill="#f7e08b" />
      <T x={11.4} y={bandY + 0.5} fill={RED} size={0.44}>①</T>
    </FigureFrame>
  );
}
