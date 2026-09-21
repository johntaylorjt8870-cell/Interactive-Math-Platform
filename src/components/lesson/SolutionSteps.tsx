import type { SolveStep } from "@/content/types";
import MathExpr from "../math/MathExpr";
import RichText from "../bidi/RichText";

// ============================================================
// خطوات الحل — Solution steps
// ============================================================
// المبدأ التربوي (المتطلب 30): لا خطوة رياضية بلا تعليل.
// النوع `SolveStep` يفرض `why`، وهذا المكوّن يعرضه بجانب كل خطوة
// بصيغة: «ماذا نفعل؟» + «لماذا؟» — فيتعلّم الطالب المنطق لا الحفظ.
// ============================================================

export default function SolutionSteps({
  steps,
  from = 0,
  to,
  compact = false,
}: {
  steps: SolveStep[];
  /** أول خطوة معروضة (للكشف التدريجي). */
  from?: number;
  /** آخر خطوة معروضة (غير شاملة). */
  to?: number;
  compact?: boolean;
}) {
  const visible = steps.slice(from, to ?? steps.length);
  return (
    <ol className={compact ? "space-y-2" : "space-y-3"}>
      {visible.map((step, index) => (
        <li
          key={from + index}
          className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
        >
          <span
            className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
            style={{ background: "var(--accent)" }}
            aria-hidden="true"
          >
            {from + index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-slate-800">
              <RichText text={step.action} />
            </div>
            {step.math && (
              <div className="mt-1">
                <MathExpr value={step.math} display />
              </div>
            )}
            <p className="mt-1.5 flex gap-1.5 text-sm text-slate-600 leading-relaxed">
              <span className="shrink-0 font-bold" style={{ color: "var(--accent)" }}>
                لماذا؟
              </span>
              <span>
                <RichText text={step.why} />
              </span>
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
