import type { ReactNode } from "react";
import { parseMath, linearize, type MathNode } from "./parse";
import { LatinRuns, hasArabic } from "../bidi/LatinRuns";

// ============================================================
// عرض الرياضيات — Math rendering
// ============================================================
// قواعد ملزمة:
//   1) كل تعبير رياضي يُعرض داخل حاوية LTR معزولة (unicode-bidi: isolate)
//      ولا يُعكس ترتيبه مهما كان سياق الصفحة عربيًا RTL.
//   2) الكسور تُرسم مكدّسة: البسط فوق المقام وخط كسري بينهما — لا "1/2".
//   3) المتغيرات تُعرض مائلة (italic) والأرقام قائمة — اصطلاح رياضي صحيح.
//   4) النص العربي داخل تعبير رياضي (\text{سم}) يُعزل RTL داخل الحاوية.
// ============================================================

interface MathExprProps {
  /** التعبير بصيغة LaTeX الجزئية المدعومة. مثال: "\\frac{1}{2} + x". */
  value: string;
  /** عرض كتلة (وسط السطر، قابل للتمرير أفقيًا) أم داخل السطر. */
  display?: boolean;
  /** وصف نصّي بديل لقارئ الشاشة (إن لم يُحدَّد يُشتق آليًا). */
  label?: string;
  className?: string;
  /** حجم الخط بمقياس rem (للتكبير في الخطوات المهمة). */
  size?: number;
}

export default function MathExpr({
  value,
  display = false,
  label,
  className = "",
  size,
}: MathExprProps) {
  const nodes = parseMath(value);
  const accessibleLabel = label ?? linearize(nodes);

  const body = (
    // dir="ltr" صريح وليس اعتمادًا على CSS فقط: العزل يجب أن يكون في
    // البنية نفسها، فيبقى صحيحًا حتى لو تغيّرت الأنماط، ويمكن للتدقيق
    // الآلي أن يتحقق منه بفحص HTML المُصيَّر.
    <span dir="ltr" className={`math-expr${display ? " math-block" : ""} ${className}`.trim()}>
      <span className="math-inner" role="math" aria-label={accessibleLabel}>
        <Nodes nodes={nodes} />
      </span>
    </span>
  );

  if (!display) return body;

  return (
    <span className="math-block-outer" style={size ? { fontSize: `${size}rem` } : undefined}>
      {body}
    </span>
  );
}

/** كسر مكدّس — يُستخدم مباشرة عند الحاجة لكسر خارج نص LaTeX. */
export function Frac({
  num,
  den,
  display = false,
  className = "",
}: {
  num: string;
  den: string;
  display?: boolean;
  className?: string;
}) {
  return (
    <MathExpr
      value={`\\frac{${num}}{${den}}`}
      display={display}
      label={`${num} على ${den}`}
      className={className}
    />
  );
}

function Nodes({ nodes }: { nodes: MathNode[] }) {
  return (
    <>
      {nodes.map((node, index) => (
        <Node key={index} node={node} />
      ))}
    </>
  );
}

function Node({ node }: { node: MathNode }): ReactNode {
  switch (node.t) {
    case "num":
      return <span className="m-num">{node.v}</span>;
    case "ident":
      return <span className="m-var">{node.v}</span>;
    case "op":
    case "rel":
      return (
        <span className={node.v === "+" || node.v === "-" ? "m-op m-op-tight" : "m-op"}>
          {node.v === "*" ? "⋅" : node.v === "/" ? "÷" : node.v}
        </span>
      );
    case "fn":
      return <span className={node.spaced ? "m-fn m-fn-spaced" : "m-fn"}>{node.display}</span>;
    case "greek":
      return <span className="m-var m-greek">{node.display}</span>;
    case "text":
      return hasArabic(node.v) ? (
        <span className="m-text-ar" dir="rtl">
          <LatinRuns text={node.v} />
        </span>
      ) : (
        <span className="m-text">{node.v}</span>
      );
    case "group":
      return (
        <span className="m-group">
          <span className="m-paren">{node.open}</span>
          <Nodes nodes={node.body} />
          <span className="m-paren">{node.close}</span>
        </span>
      );
    case "frac":
      return <StackedFraction num={node.num} den={node.den} />;
    case "sqrt":
      return (
        <span className="m-sqrt">
          <span className="m-sqrt-index">{node.index ? <Nodes nodes={node.index} /> : null}</span>
          <span className="m-sqrt-sign">√</span>
          <span className="m-sqrt-body">
            <Nodes nodes={node.body} />
          </span>
        </span>
      );
    case "sup":
      return (
        <span className="m-script-base">
          <Nodes nodes={node.base} />
          <sup className="m-sup">
            <Nodes nodes={node.sup} />
          </sup>
        </span>
      );
    case "sub":
      return (
        <span className="m-script-base">
          <Nodes nodes={node.base} />
          <sub className="m-sub">
            <Nodes nodes={node.sub} />
          </sub>
        </span>
      );
    case "subsup":
      return (
        <span className="m-script-base">
          <Nodes nodes={node.base} />
          <sub className="m-sub">
            <Nodes nodes={node.sub} />
          </sub>
          <sup className="m-sup">
            <Nodes nodes={node.sup} />
          </sup>
        </span>
      );
    case "decor":
      return (
        <span className={node.kind === "vec" ? "m-decor m-vec" : "m-decor m-overline"}>
          <Nodes nodes={node.body} />
        </span>
      );
    case "unknown":
      return <span className="m-unknown">{node.v}</span>;
    default:
      return null;
  }
}

/**
 * الكسر المكدّس الحقيقي: عمود مرن، البسط أعلى، خط كسري، المقام أسفل.
 * الخط هو الحدّ السفلي للبسط فيتمدد تلقائيًا مع عرض المحتوى.
 */
function StackedFraction({ num, den }: { num: MathNode[]; den: MathNode[] }) {
  return (
    <span className="m-frac" dir="ltr">
      <span className="m-frac-num">
        <Nodes nodes={num} />
      </span>
      <span className="m-frac-bar" aria-hidden="true" />
      <span className="m-frac-den">
        <Nodes nodes={den} />
      </span>
    </span>
  );
}
