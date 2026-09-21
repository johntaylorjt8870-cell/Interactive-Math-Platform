import type { ReactElement } from "react";
import type { FigureSpec } from "@/content/types";
import { linearize, parseMath } from "../math/parse";
import { LatinRuns, hasArabic } from "../bidi/LatinRuns";
import {
  add,
  angleArcPath,
  angleLabelPosition,
  centroid,
  extendLine,
  labelPosition,
  length,
  parallelChevrons,
  rightAngleLegs,
  round,
  scale,
  sub,
  tickMarks,
  toSvg,
  toSvgViewBox,
  unit,
  type Pt,
} from "./geometry-math";

// ============================================================
// رسم الأشكال الهندسية — Geometry renderer
// ============================================================
// الشكل جزء من المحتوى المنهجي، لذا يُبنى من بيانات إحداثية دقيقة:
//   * كل العلامات (زوايا قائمة، تطابق أطوال، توازٍ، أقواس) مشتقّة حسابيًا.
//   * لا مواضع تقريبية مكتوبة يدويًا.
//   * الرسم متجاوب: viewBox ثابت + عرض مرن، فيبقى التناسب صحيحًا
//     على أي شاشة، وتكبر الخطوط والعلامات مع الشكل بنسبة ثابتة.
//   * الاتجاه: SVG لا يتأثر بـ RTL، والتسميات الرياضية تُعزل LTR،
//     والكلمات العربية داخل الشكل تُعزل RTL.
// ============================================================

const STROKE = 0.55;
const LABEL_SIZE = 1.35;
const MEASURE_SIZE = 1.15;

export default function Figure({ spec }: { spec: FigureSpec }) {
  const points = new Map(spec.points.map((p) => [p.id, { x: p.x, y: p.y }]));
  const get = (id: string): Pt | null => points.get(id) ?? null;

  const [minX, minY, width, height] = spec.viewBox;
  const unitScale = Math.max(1, Math.min(width, height)) / 10;
  const pointRadius = 0.14 * unitScale;
  const labelGap = 0.55 * unitScale;
  const tickLength = 0.5 * unitScale;
  const chevronSize = 0.32 * unitScale;
  const rightSize = 0.75 * unitScale;

  const allPoints = [...points.values()];
  const center = centroid(allPoints);

  return (
    <figure className="geo-figure">
      {spec.caption && (
        <figcaption className="geo-caption">
          <LatinRuns text={spec.caption} />
        </figcaption>
      )}

      <div className="geo-canvas">
        <svg
          style={{ direction: "ltr" }}
          viewBox={toSvgViewBox(spec.viewBox)}
          role="img"
          aria-label={spec.description ?? spec.caption ?? "شكل هندسي"}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker
              id="geo-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth={6 * unitScale}
              markerHeight={6 * unitScale}
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
            <marker
              id="geo-arrow-emphasis"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth={6 * unitScale}
              markerHeight={6 * unitScale}
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="geo-emphasis-fill" />
            </marker>
          </defs>

          {/* تشبيك مرجعي */}
          {spec.grid && <Grid viewBox={spec.viewBox} step={spec.grid.step} />}

          {/* الدوائر */}
          {spec.circles?.map((circle, index) => {
            const c = get(circle.center);
            if (!c) return null;
            const radius =
              circle.radius ?? (circle.through ? length(sub(get(circle.through) ?? c, c)) : 1);
            const centerSvg = toSvg(c);
            const arrowStart = circle.arcFrom ? get(circle.arcFrom) : null;
            const arrowEnd = circle.arcTo ? get(circle.arcTo) : null;
            return (
              <g key={`circle-${index}`}>
                <circle
                  cx={round(centerSvg.x)}
                  cy={round(centerSvg.y)}
                  r={round(radius)}
                  className="geo-circle"
                  strokeWidth={STROKE}
                />
                {radius > 0 && (
                  <RadiusLine center={c} radius={radius} from={arrowStart} to={arrowEnd} strokeWidth={STROKE} />
                )}
              </g>
            );
          })}

          {/* القطع والمستقيمات والأشعة والمتجهات */}
          {spec.segments?.map((segment, index) => {
            const a = get(segment.from);
            const b = get(segment.to);
            if (!a || !b) return null;

            let p1 = a;
            let p2 = b;
            if (segment.kind === "line") {
              const extended = extendLine(a, b);
              p1 = extended.from;
              p2 = extended.to;
            }
            const s1 = toSvg(p1);
            const s2 = toSvg(p2);
            const emphasis = Boolean(segment.emphasis);
            const hasArrow = segment.kind === "ray" || segment.kind === "vector";

            return (
              <g key={`segment-${index}`} className={emphasis ? "geo-emphasis" : undefined}>
                <line
                  x1={round(s1.x)}
                  y1={round(s1.y)}
                  x2={round(s2.x)}
                  y2={round(s2.y)}
                  className={emphasis ? "geo-line geo-line-emphasis" : "geo-line"}
                  strokeWidth={emphasis ? STROKE * 1.6 : STROKE}
                  markerEnd={
                    hasArrow
                      ? emphasis
                        ? "url(#geo-arrow-emphasis)"
                        : "url(#geo-arrow)"
                      : undefined
                  }
                />
                {segment.equalGroup && (
                  <EqualLengthMarks
                    a={a}
                    b={b}
                    group={segment.equalGroup}
                    groups={collectGroups((spec.segments ?? []).map((s) => s.equalGroup))}
                    tickLength={tickLength}
                  />
                )}
                {segment.parallelGroup && (
                  <ParallelMarks a={a} b={b} count={segment.parallelGroup.length} size={chevronSize} />
                )}
                {segment.measure && (
                  <MeasureLabel a={a} b={b} text={segment.measure} offset={labelGap * 0.85} />
                )}
                {segment.label && (
                  <MathText
                    at={add(
                      { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
                      scale(unit(center, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }), labelGap),
                    )}
                    value={segment.label}
                  />
                )}
              </g>
            );
          })}

          {/* أقواس الزوايا */}
          {spec.angles?.map((angle, index) => {
            const vertex = get(angle.vertex);
            const from = get(angle.from);
            const to = get(angle.to);
            if (!vertex || !from || !to) return null;

            const baseRadius = 0.95 * unitScale;
            const marks = Math.max(1, angle.marks ?? 1);
            const arcs = Array.from({ length: marks }, (_, i) => baseRadius + i * 0.28 * unitScale);

            return (
              <g key={`angle-${index}`} className={angle.emphasis ? "geo-emphasis" : undefined}>
                {arcs.map((radius, i) => (
                  <path
                    key={i}
                    d={angleArcPath(vertex, from, to, radius)}
                    className={angle.emphasis ? "geo-arc geo-arc-emphasis" : "geo-arc"}
                    fill="none"
                    strokeWidth={angle.emphasis ? STROKE * 1.6 : STROKE}
                  />
                ))}
                {angle.measure && (
                  <MathText
                    at={angleLabelPosition(vertex, from, to, arcs[arcs.length - 1])}
                    value={angle.measure}
                    size={MEASURE_SIZE}
                  />
                )}
              </g>
            );
          })}

          {/* علامات الزوايا القائمة */}
          {spec.rightAngles?.map((right, index) => {
            const vertex = get(right.vertex);
            const from = get(right.from);
            const to = get(right.to);
            if (!vertex || !from || !to) return null;
            const size = Math.min(
              rightSize,
              length(sub(from, vertex)) * 0.35,
              length(sub(to, vertex)) * 0.35,
            );
            const legs = rightAngleLegs(vertex, from, to, size);
            const a = toSvg(legs.a);
            const b = toSvg(legs.b);
            const corner = toSvg(legs.corner);
            return (
              <polyline
                key={`right-${index}`}
                points={`${round(a.x)},${round(a.y)} ${round(corner.x)},${round(corner.y)} ${round(b.x)},${round(b.y)}`}
                className="geo-right-angle"
                fill="none"
                strokeWidth={STROKE}
              />
            );
          })}

          {/* النقاط */}
          {spec.points.map((point) => {
            const p = toSvg({ x: point.x, y: point.y });
            return (
              <circle
                key={`point-${point.id}`}
                cx={round(p.x)}
                cy={round(p.y)}
                r={round(pointRadius)}
                className="geo-point"
              />
            );
          })}

          {/* تسميات النقاط */}
          {spec.points
            .filter((point) => point.label)
            .map((point) => {
              const at = labelPosition(
                { x: point.x, y: point.y },
                center,
                labelGap,
                point.labelOffset,
              );
              return (
                <MathText
                  key={`label-${point.id}`}
                  at={at}
                  value={point.label as string}
                  size={LABEL_SIZE}
                  bold
                />
              );
            })}

          {/* نصوص حرة */}
          {spec.texts?.map((text, index) => {
            const p = toSvg({ x: text.x, y: text.y });
            const anchor = text.anchor ?? "middle";
            const size = text.size ?? MEASURE_SIZE;
            if (text.role === "ar" || hasArabic(text.text)) {
              return (
                <text
                  key={`text-${index}`}
                  x={round(p.x)}
                  y={round(p.y)}
                  textAnchor={anchor === "middle" ? "middle" : anchor === "start" ? "start" : "end"}
                  className="geo-text-ar"
                  fontSize={size}
                  direction="rtl"
                >
                  {text.text}
                </text>
              );
            }
            return (
              <text
                key={`text-${index}`}
                x={round(p.x)}
                y={round(p.y)}
                textAnchor={anchor === "middle" ? "middle" : anchor === "start" ? "start" : "end"}
                className="geo-text-math"
                fontSize={size}
                direction="ltr"
              >
                {text.text}
              </text>
            );
          })}
        </svg>
      </div>

      {spec.description && (
        <p className="geo-description">
          <LatinRuns text={spec.description} />
        </p>
      )}
    </figure>
  );
}

/** يجمع المجموعات لتحديد عدد الشرطات لكل مجموعة تطابق أطوال. */
function collectGroups(groups: (string | undefined)[]): string[] {
  return [...new Set(groups.filter((g): g is string => Boolean(g)))];
}

function Grid({ viewBox, step }: { viewBox: [number, number, number, number]; step: number }) {
  const [minX, minY, width, height] = viewBox;
  const lines: ReactElement[] = [];
  for (let x = minX; x <= minX + width; x += step) {
    const a = toSvg({ x, y: minY });
    const b = toSvg({ x, y: minY + height });
    lines.push(
      <line key={`gx-${x}`} x1={round(a.x)} y1={round(a.y)} x2={round(b.x)} y2={round(b.y)} className="geo-grid-line" />,
    );
  }
  for (let y = minY; y <= minY + height; y += step) {
    const a = toSvg({ x: minX, y });
    const b = toSvg({ x: minX + width, y });
    lines.push(
      <line key={`gy-${y}`} x1={round(a.x)} y1={round(a.y)} x2={round(b.x)} y2={round(b.y)} className="geo-grid-line" />,
    );
  }
  return <g>{lines}</g>;
}

function EqualLengthMarks({
  a,
  b,
  group,
  groups,
  tickLength,
}: {
  a: Pt;
  b: Pt;
  group: string;
  groups: string[];
  tickLength: number;
}) {
  const index = groups.indexOf(group);
  const count = index + 1;
  const tickLengthScaled = tickLength * 0.9;
  const marks = tickMarks(a, b, count, tickLengthScaled, tickLengthScaled * 1.25);
  return (
    <g>
      {marks.map((m, i) => (
        <line key={i} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} className="geo-tick" strokeWidth={STROKE} />
      ))}
    </g>
  );
}

function ParallelMarks({ a, b, count, size }: { a: Pt; b: Pt; count: number; size: number }) {
  const marks = parallelChevrons(a, b, count, size, size * 1.5);
  return (
    <g>
      {marks.map((m, i) => (
        <path key={i} d={m.d} className="geo-parallel" fill="none" strokeWidth={STROKE} />
      ))}
    </g>
  );
}

function MeasureLabel({ a, b, text, offset }: { a: Pt; b: Pt; text: string; offset: number }) {
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const n = unit({ x: 0, y: 0 }, { x: -(b.y - a.y), y: b.x - a.x });
  return <MathText at={add(mid, scale(n, offset))} value={text} size={MEASURE_SIZE} />;
}

function RadiusLine({
  center,
  radius,
  from,
  to,
  strokeWidth,
}: {
  center: Pt;
  radius: number;
  from: Pt | null;
  to: Pt | null;
  strokeWidth: number;
}) {
  const startPt = from ?? { x: center.x + radius, y: center.y };
  const endPt = to ?? { x: center.x + radius, y: center.y };
  const s = toSvg(startPt);
  const e = toSvg(endPt);
  return (
    <line x1={round(s.x)} y1={round(s.y)} x2={round(e.x)} y2={round(e.y)} className="geo-radius" strokeWidth={strokeWidth} />
  );
}

/**
 * نص داخل SVG.
 *
 * قرار هندسي: لا نستخدم foreignObject لأن قصّه وأبعاده الثابتة هشّة
 * عند التكبير. بدلًا من ذلك:
 *   - الكلمات العربية الخالصة تُرسم <text> مع direction="rtl".
 *   - الرموز الرياضية تُرسم <text direction="ltr"> بصيغة خطّية
 *     (linearize) وخط الرياضيات — فتتناسب مع حجم الشكل تلقائيًا.
 * تسميات الأشكال هي أسماء نقاط وقياسات ورموز، ولا تحتاج كسورًا مكدّسة.
 */
function MathText({
  at,
  value,
  size = MEASURE_SIZE,
  bold,
}: {
  at: Pt;
  value: string;
  size?: number;
  bold?: boolean;
}) {
  const p = toSvg(at);
  if (hasArabic(value) && !/[A-Za-z0-9\\]/.test(value)) {
    return (
      <text
        x={round(p.x)}
        y={round(p.y)}
        textAnchor="middle"
        dominantBaseline="middle"
        className="geo-text-ar"
        fontSize={size}
        direction="rtl"
      >
        {value}
      </text>
    );
  }
  const text = linearize(parseMath(value));
  return (
    <text
      x={round(p.x)}
      y={round(p.y)}
      textAnchor="middle"
      dominantBaseline="middle"
      className={bold ? "geo-text-math geo-label-bold" : "geo-text-math"}
      fontSize={size}
      direction="ltr"
    >
      {text}
    </text>
  );
}
