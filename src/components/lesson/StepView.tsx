"use client";

import type { ReactNode } from "react";
import type { Step } from "@/content/types";
import BlockRenderer from "./BlockRenderer";
import StudentQuiz from "../assessment/StudentQuiz";
import ActivityRenderer from "../interactive/ActivityRenderer";
import RichText from "../bidi/RichText";

// ============================================================
// عرض الخطوة — Step view
// ============================================================
// كل نوع خطوة له عرضه، مع الحفاظ على وحدة الشكل العام.
// «لا تُجبر كل الدروس على قالب واحد»: الشرح يختلف بحسب المادة
// (شرح، نشاط، تمرين، اختبار، ملخص)، لكن تجربة الطالب تبقى متسقة.
// ============================================================

export default function StepView({
  step,
  lessonTitle,
  subjectTitle,
  unitTitle,
  customRenderers,
}: {
  step: Step;
  lessonTitle: string;
  subjectTitle: string;
  unitTitle: string;
  customRenderers?: Record<string, ReactNode>;
}) {
  switch (step.kind) {
    case "cover":
      return (
        <div className="text-center">
          <div className="mb-4 text-6xl" aria-hidden="true">
            {step.mascot ?? "📘"}
          </div>
          <p className="mb-2 text-sm font-bold text-slate-500">
            <RichText text={`${unitTitle} · ${subjectTitle}`} />
          </p>
          <h2 className="text-3xl font-black leading-snug text-slate-900 sm:text-4xl">
            <RichText text={lessonTitle} />
          </h2>
          {step.subtitle && (
            <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
              <RichText text={step.subtitle} />
            </p>
          )}
          <p className="mt-6 text-sm font-semibold text-slate-400">
            استخدم الشريط الجانبي أو زرّي «السابق/التالي» للتنقّل بين خطوات الدرس.
          </p>
        </div>
      );

    case "objectives":
      return (
        <div>
          <SectionTitle icon="🎯" title={step.title} />
          <ol className="space-y-2">
            {step.items.map((item, index) => (
              <li key={index} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <span
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                  style={{ background: "var(--accent)" }}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="font-semibold leading-relaxed text-slate-700">
                  <RichText text={item} />
                </span>
              </li>
            ))}
          </ol>
          {step.note && (
            <p className="mt-3 rounded-xl bg-sky-50 p-3 text-sm font-semibold text-sky-900">
              <RichText text={step.note} />
            </p>
          )}
        </div>
      );

    case "lesson":
      return (
        <div>
          <SectionTitle icon="📖" title={step.title} />
          {step.lead && (
            <p className="mb-4 rounded-xl bg-slate-50 p-3 text-base font-semibold leading-relaxed text-slate-700">
              <RichText text={step.lead} />
            </p>
          )}
          <BlockRenderer blocks={step.blocks} />
          {step.tip && (
            <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-relaxed text-amber-900">
              <span aria-hidden="true">💡 </span>
              <RichText text={step.tip} />
            </p>
          )}
        </div>
      );

    case "interactive":
      return (
        <div>
          <SectionTitle icon="🧪" title={step.title} />
          {step.subtitle && (
            <p className="mb-3 text-slate-600">
              <RichText text={step.subtitle} />
            </p>
          )}
          <ActivityRenderer activity={step.activity} />
        </div>
      );

    case "practice":
      return (
        <div>
          <SectionTitle icon="📝" title={step.title} />
          {step.subtitle && (
            <p className="mb-3 text-slate-600">
              <RichText text={step.subtitle} />
            </p>
          )}
          <ActivityRenderer activity={step.activity} />
        </div>
      );

    case "quiz":
      return (
        <div>
          <SectionTitle icon="🏁" title={step.title} />
          {step.subtitle && (
            <p className="mb-3 text-slate-600">
              <RichText text={step.subtitle} />
            </p>
          )}
          <StudentQuiz questions={step.questions} />
        </div>
      );

    case "summary":
      return (
        <div>
          <SectionTitle icon="🧠" title={step.title} />
          <dl className="space-y-2">
            {step.items.map((item, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-white p-3">
                <dt className="font-black text-slate-800">
                  <RichText text={item.label} />
                </dt>
                <dd className="mt-1 text-slate-700">
                  <RichText text={item.text} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      );

    case "closing":
      return (
        <div className="text-center">
          <div className="mb-3 text-5xl" aria-hidden="true">
            🎓
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            <RichText text={step.title} />
          </h2>
          {step.text && (
            <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-slate-600">
              <RichText text={step.text} />
            </p>
          )}
        </div>
      );

    case "custom": {
      const custom = customRenderers?.[step.componentId];
      return (
        <div>
          <SectionTitle icon="🧩" title={step.title} />
          {custom ?? (
            <p className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-700">
              هذا الدرس يستخدم مكوّنًا خاصًا غير مسجَّل بعد: {step.componentId}
            </p>
          )}
        </div>
      );
    }

    default: {
      const exhaustive: never = step;
      return (
        <p className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-700">
          نوع خطوة غير مدعوم: {(exhaustive as Step).kind}
        </p>
      );
    }
  }
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-slate-900">
      <span aria-hidden="true">{icon}</span>
      <RichText text={title} />
    </h2>
  );
}
