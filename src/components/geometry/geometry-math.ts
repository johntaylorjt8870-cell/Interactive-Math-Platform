// ============================================================
// رياضيات الأشكال — Geometry math helpers
// ============================================================
// كل علامة في الشكل الهندسي تُشتق حسابيًا من الإحداثيات:
//   - علامة الزاوية القائمة: مربع مبني على متجهَي الضلعين.
//   - قوس الزاوية: قوس دائري بنصف قطر محسوب من الرأس والشعاعين.
//   - علامات الأطوال المتساوية: شُرَط عمودية على القطعة في منتصفها.
//   - علامات التوازي: سهام على القطعة باتجاهها.
// لا يوجد أي موضع "تقريبي" مكتوب يدويًا.
//
// الإحداثيات في الفضاء الرياضي (y إلى الأعلى). التحويل إلى فضاء SVG
// (y إلى الأسفل) يحدث في نقطة واحدة فقط: toSvg().
// ============================================================

export interface Pt {
  x: number;
  y: number;
}

export const EPSILON = 1e-9;

export function sub(a: Pt, b: Pt): Pt {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function add(a: Pt, b: Pt): Pt {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function scale(a: Pt, k: number): Pt {
  return { x: a.x * k, y: a.y * k };
}

export function length(a: Pt): number {
  return Math.hypot(a.x, a.y);
}

/** متجه الوحدة من a إلى b. يعيد {0,0} إذا تطابقت النقطتان. */
export function unit(from: Pt, to: Pt): Pt {
  const d = sub(to, from);
  const len = length(d);
  if (len < EPSILON) return { x: 0, y: 0 };
  return { x: d.x / len, y: d.y / len };
}

/** دوران 90° عكس عقارب الساعة في الفضاء الرياضي. */
export function perp(v: Pt): Pt {
  return { x: -v.y, y: v.x };
}

export function midpoint(a: Pt, b: Pt): Pt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** الضرب الاتجاهي (z للمتجهين) — موجب = عكس عقارب الساعة من v إلى u. */
export function cross(v: Pt, u: Pt): number {
  return v.x * u.y - v.y * u.x;
}

export function dot(v: Pt, u: Pt): number {
  return v.x * u.x + v.y * u.y;
}

/** الزاوية بين متجهين بالدرجات (0..180). */
export function angleBetween(v: Pt, u: Pt): number {
  const lv = length(v);
  const lu = length(u);
  if (lv < EPSILON || lu < EPSILON) return 0;
  const cos = Math.min(1, Math.max(-1, dot(v, u) / (lv * lu)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** مركز ثقل مجموعة نقاط — يُستخدم لدفع التسميات بعيدًا عن الشكل. */
export function centroid(points: Pt[]): Pt {
  if (points.length === 0) return { x: 0, y: 0 };
  const sum = points.reduce((acc, p) => add(acc, p), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

/**
 * تحويل نقطة من الفضاء الرياضي إلى فضاء SVG (قلب المحور y).
 * النقطة الوحيدة في المنظومة التي تُقلب فيها الإحداثيات.
 */
export function toSvg(p: Pt): Pt {
  return { x: p.x, y: -p.y };
}

/** تحويل viewBox الرياضي [minX, minY, w, h] إلى viewBox الخاص بـ SVG. */
export function toSvgViewBox(viewBox: [number, number, number, number]): string {
  const [minX, minY, width, height] = viewBox;
  const topLeft = toSvg({ x: minX, y: minY + height });
  return `${topLeft.x} ${topLeft.y} ${width} ${height}`;
}

/**
 * رأس المربع الدال على الزاوية القائمة.
 * يُبنى على متجهَي الوحدة للضلعين، فيكون صحيحًا لأي زاوية (لا يفترض
 * أن الضلعين أفقي ورأسي) — وهذا جوهر الدقة الرياضية.
 */
export function rightAngleCorner(vertex: Pt, from: Pt, to: Pt, size: number): Pt {
  const u1 = unit(vertex, from);
  const u2 = unit(vertex, to);
  return add(vertex, scale(add(u1, u2), size));
}

/** نقطتا القاعدة للمربع الدال على الزاوية القائمة. */
export function rightAngleLegs(
  vertex: Pt,
  from: Pt,
  to: Pt,
  size: number,
): { a: Pt; b: Pt; corner: Pt } {
  const u1 = unit(vertex, from);
  const u2 = unit(vertex, to);
  return {
    a: add(vertex, scale(u1, size)),
    b: add(vertex, scale(u2, size)),
    corner: add(vertex, scale(add(u1, u2), size)),
  };
}

/**
 * مسار SVG لقوس الزاوية عند الرأس بين شعاعين.
 * @param radius نصف قطر القوس بوحدات الشكل
 */
export function angleArcPath(vertex: Pt, from: Pt, to: Pt, radius: number): string {
  const u1 = unit(vertex, from);
  const u2 = unit(vertex, to);
  if (length(u1) < EPSILON || length(u2) < EPSILON) return "";
  const start = add(vertex, scale(u1, radius));
  const end = add(vertex, scale(u2, radius));
  const signed = cross(u1, u2);
  // قوس الزاوية بين شعاعين لا يتجاوز 180° دائمًا (الزاوية بين متجهين
  // محصورة في [0,180])، لذلك largeArc = 0 أبدًا — و**اتجاه** الدوران
  // (sweep) هو الذي يحدّد أي جهة يُرسم القوس.
  const largeArc = 0;
  // في فضاء SVG (المقلوب) يقابل الدوران الرياضي الموجب sweep = 1.
  const sweep = signed >= 0 ? 1 : 0;
  const s = toSvg(start);
  const e = toSvg(end);
  return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${e.x} ${e.y}`;
}

/**
 * موضع تسمية الزاوية (منتصف القوس، مدفوعًا للخارج قليلًا)
 * حتى لا تتقاطع التسمية مع القوس أو مع أضلاع الزاوية.
 */
export function angleLabelPosition(
  vertex: Pt,
  from: Pt,
  to: Pt,
  radius: number,
): Pt {
  const u1 = unit(vertex, from);
  const u2 = unit(vertex, to);
  if (length(u1) < EPSILON || length(u2) < EPSILON) return vertex;
  const bisector = unit({ x: 0, y: 0 }, add(u1, u2));
  if (length(bisector) < EPSILON) return add(vertex, scale(u1, radius));
  return add(vertex, scale(bisector, radius * 1.6));
}

/**
 * شرطات تعليم تساوي الأطوال: شرطات عمودية على القطعة في منتصفها.
 * تُعاد كإحداثيات خطوط جاهزة للرسم.
 */
export function tickMarks(
  from: Pt,
  to: Pt,
  count: number,
  tickLength: number,
  gap: number,
): { x1: number; y1: number; x2: number; y2: number }[] {
  const u = unit(from, to);
  if (length(u) < EPSILON) return [];
  const n = perp(u);
  const mid = midpoint(from, to);
  const out: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const total = (count - 1) * gap;
  const firstOffset = -total / 2;
  for (let i = 0; i < count; i += 1) {
    const center = add(mid, scale(u, firstOffset + i * gap));
    const p1 = toSvg(add(center, scale(n, tickLength / 2)));
    const p2 = toSvg(add(center, scale(n, -tickLength / 2)));
    out.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
  }
  return out;
}

/**
 * علامة التوازي: سهم (chevron) عند منتصف القطعة باتجاهها.
 * عدة أسهم = مجموعات توازٍ متعددة.
 */
export function parallelChevrons(
  from: Pt,
  to: Pt,
  count: number,
  size: number,
  gap: number,
): { d: string }[] {
  const u = unit(from, to);
  if (length(u) < EPSILON) return [];
  const n = perp(u);
  const mid = midpoint(from, to);
  const out: { d: string }[] = [];
  const total = (count - 1) * gap;
  const firstOffset = -total / 2;
  for (let i = 0; i < count; i += 1) {
    const center = add(mid, scale(u, firstOffset + i * gap));
    const back = add(center, scale(u, -size));
    const tip = add(center, scale(u, size));
    const a = add(back, scale(n, size * 0.7));
    const b = add(back, scale(n, -size * 0.7));
    const A = toSvg(a);
    const B = toSvg(b);
    const T = toSvg(tip);
    out.push({ d: `M ${A.x} ${A.y} L ${T.x} ${T.y} L ${B.x} ${B.y}` });
  }
  return out;
}

/**
 * تمديد قطعة إلى مستقيم كامل.
 *
 * الإزاحة تُحسب بنسبة من **طول القطعة** لا بوحدات مطلقة، حتى يبدو
 * المستقيم متماثلًا في كل الأشكال مهما اختلف مقياسها (شكل طوله
 * وحدتان وآخر طوله عشرة يجب أن يُمدّا بتناسب صحيح).
 */
export function extendLine(from: Pt, to: Pt, factor = 1.6): { from: Pt; to: Pt } {
  const u = unit(from, to);
  const segmentLength = length(sub(to, from));
  const extension = factor * segmentLength;
  return { from: add(from, scale(u, -extension)), to: add(to, scale(u, extension)) };
}

/**
 * موضع تسمية نقطة: تُدفع بعيدًا عن مركز ثقل الشكل حتى لا تغطّي
 * الخطوط، مع إزاحة قابلة للتجاوز عند الحاجة.
 */
export function labelPosition(
  point: Pt,
  center: Pt,
  distance: number,
  explicit?: { dx: number; dy: number },
): Pt {
  if (explicit) return add(point, { x: explicit.dx, y: explicit.dy });
  const away = unit(center, point);
  if (length(away) < EPSILON) return add(point, { x: distance, y: distance });
  return add(point, scale(away, distance));
}

/** أقرب مسافة من نقطة إلى قطعة مستقيمة — تُستخدم لضبط أحجام العلامات. */
export function distanceToSegment(p: Pt, a: Pt, b: Pt): number {
  const ab = sub(b, a);
  const len2 = dot(ab, ab);
  if (len2 < EPSILON) return length(sub(p, a));
  const t = Math.min(1, Math.max(0, dot(sub(p, a), ab) / len2));
  return length(sub(p, add(a, scale(ab, t))));
}

/** يقصّ رقمًا إلى منزلة عشرية واحدة — لتنظيف مسارات SVG. */
export function round(value: number, digits = 2): number {
  const k = 10 ** digits;
  return Math.round(value * k) / k;
}
