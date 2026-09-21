import type { WorkedSolution } from "@/content/types";
import SolutionSteps from "./SolutionSteps";
import RichText from "../bidi/RichText";
import MathExpr from "../math/MathExpr";

// ============================================================
// عرض الحل المحلول — Worked solution
// ============================================================
// المتطلب 30: تدفّق تدريسي لا قالب جامد. لذلك الأنواع مختلفة:
//   solve      → المعطى / المطلوب / الخطوات بتعليلها / الجواب / التحقق
//   prove      → المعطى / المطلوب إثباته / الخطوات
//   construct  → الخطوات / الناتج
//   compare    → عناصر المقارنة / الخطوات / الخلاصة
// ونفس المكوّن يعرضها كلها بشكل موحّد مريح للطالب.
// ============================================================

export default function WorkedSolutionView({ solution }: { solution: WorkedSolution }) {
  return (
    <div className="space-y-3">
      {solution.kind === "solve" && (
        <>
          {(solution.given || solution.required) && (
            <div className="grid gap-2 sm:grid-cols-2">
              {solution.given && <InfoCard label="المعطى" text={solution.given} icon="📋" />}
              {solution.required && <InfoCard label="المطلوب" text={solution.required} icon="🎯" />}
            </div>
          )}
          <SolutionSteps steps={solution.steps} />
          <ResultRow label="الجواب النهائي" text={solution.answer} tone="answer" />
          {solution.check && (
            <ResultRow label="تحقّق من الجواب" text={solution.check} tone="check" />
          )}
        </>
      )}

      {solution.kind === "prove" && (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            <InfoCard label="المعطى" text={solution.given} icon="📋" />
            <InfoCard label="المطلوب إثباته" text={solution.goal} icon="🎯" />
          </div>
          <SolutionSteps steps={solution.steps} />
        </>
      )}

      {solution.kind === "construct" && (
        <>
          <SolutionSteps steps={solution.steps} />
          {solution.result && <ResultRow label="الناتج" text={solution.result} tone="answer" />}
        </>
      )}

      {solution.kind === "compare" && (
        <>
          <ul className="flex flex-wrap gap-2">
            {solution.items.map((item, index) => (
              <li
                key={index}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700"
              >
                <MathExpr value={item} />
              </li>
            ))}
          </ul>
          <SolutionSteps steps={solution.steps} />
          <ResultRow label="الخلاصة" text={solution.conclusion} tone="answer" />
        </>
      )}
    </div>
  );
}

function InfoCard({ label, text, icon }: { label: string; text: string; icon: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-500">
        <span aria-hidden="true">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-sm font-semibold text-slate-800">
        <RichText text={text} />
      </div>
    </div>
  );
}

function ResultRow({
  label,
  text,
  tone,
}: {
  label: string;
  text: string;
  tone: "answer" | "check";
}) {
  const styles =
    tone === "answer"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-sky-200 bg-sky-50 text-sky-900";
  const icon = tone === "answer" ? "✅" : "🔎";
  return (
    <div className={`rounded-xl border p-3 ${styles}`}>
      <div className="mb-1 flex items-center gap-1.5 text-xs font-bold opacity-80">
        <span aria-hidden="true">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="font-bold leading-relaxed">
        <RichText text={text} />
      </div>
    </div>
  );
}
