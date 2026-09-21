"use client";

import { groupStepsBySection, type Step } from "@/content/types";
import RichText from "../bidi/RichText";

// ============================================================
// الشريط الجانبي للخطوات — Step rail
// ============================================================
// قائمة ثابتة بأقسام الدرس وخطواته:
//   - الأقسام (من الكتاب عادة) تُجمَّع بصريًا.
//   - الخطوة الحالية مبرزة.
//   - النقر ينقل مباشرة إلى أي خطوة.
//   - مناسب لدرس من 20 إلى 45 خطوة: تمرير داخلي فقط.
// ============================================================

export default function StepRail({
  steps,
  currentIndex,
  onSelect,
  onExit,
  onClose,
  lessonTitle,
  subjectTitle,
}: {
  steps: Step[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onExit?: () => void;
  onClose?: () => void;
  lessonTitle: string;
  subjectTitle: string;
}) {
  const groups = groupStepsBySection(steps);

  return (
    <aside className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-100 p-4">
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="text-sm font-bold text-slate-400 transition hover:text-slate-800"
          >
            → جميع دروس {subjectTitle}
          </button>
        )}
        <div className="mt-2 text-lg font-black leading-snug text-slate-900">
          <RichText text={lessonTitle} />
        </div>
        <div className="mt-1 text-xs font-bold text-slate-400">
          {steps.length} خطوة · {groups.length} أقسام
        </div>
      </div>

      <nav
        className="step-rail-scroll flex-1 overflow-y-auto p-2"
        aria-label="خطوات الدرس"
      >
        {groups.map((group) => (
          <div key={group.section} className="mb-2">
            <div className="px-3 py-1 text-xs font-black text-slate-400">
              <RichText text={group.section} />
            </div>
            {group.indexes.map((index) => {
              const step = steps[index];
              const active = index === currentIndex;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    onSelect(index);
                    onClose?.();
                  }}
                  aria-current={active ? "step" : undefined}
                  className={`step-rail-item mb-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-sm ${
                    active
                      ? "font-bold text-white shadow"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  style={active ? { background: "var(--accent)" } : undefined}
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      active ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    <RichText text={step.title} />
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3 text-xs font-semibold text-slate-400">
        التنقّل: الأسهم ← → أو مفتاح المسافة
      </div>
    </aside>
  );
}
