// ============================================================
// مصيدة العرض — render harness for lesson auditing
// ============================================================
// تُستدعى من سكربتات التدقيق (Node) عبر esbuild، لا من التطبيق.
//
// الفكرة: لا نفحص ملفات المصدر نصًّا، بل **نُصيِّر كل خطوة فعليًا**
// بمكوّنات React الحقيقية (StepView وما تحته) ثم نفحص HTML الناتج.
// بهذا يثبت التدقيق أمورًا لا تُثبت بقراءة الملفات:
//   • لا يظهر أي أمر LaTeX خامًا للطالب.
//   • الكسور تُصيَّر مكدّسة فعلًا (بنية .m-frac)، لا مسطّحة.
//   • كل تعبير رياضي داخل حاوية عزل LTR صريحة (dir="ltr").
//   • محتوى «أكشف الحل» لا يوجد في DOM قبل تصرّف الطالب إطلاقًا
//     (ليس مخفيًا بـ CSS — غير موجود).
//   • لا تتسرّب أي إجابة من مجموعة المعلم إلى DOM الطالب.
// ============================================================

import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import StepView from "@/components/lesson/StepView";
import { LessonProvider, type LessonRuntime } from "@/components/lesson/LessonContext";
import type { LessonContent } from "@/content/types";
import type { LessonModule } from "@/lessons/registry";

export interface RenderedStep {
  id: string;
  kind: string;
  html: string;
  error?: string;
}

export interface RenderMeta {
  lessonTitle: string;
  subjectTitle: string;
  unitTitle: string;
}

/** يصيّر كل خطوات درس ويُعيد HTML كل خطوة. */
export function renderLessonSteps(
  lessonModule: LessonModule,
  meta: RenderMeta,
): { rendered: RenderedStep[]; renderError?: string } {
  const { content, customSteps } = lessonModule;

  const customRenderers: Record<string, ReactNode> = {};
  for (const step of content.steps) {
    if (step.kind !== "custom") continue;
    const CustomStep = customSteps?.[step.componentId];
    if (CustomStep) {
      customRenderers[step.componentId] = <CustomStep step={step} />;
    }
  }

  const runtime: LessonRuntime = {
    lessonId: content.lessonId,
    subjectId: "algebra",
    lessonTitle: meta.lessonTitle,
  };

  const rendered: RenderedStep[] = [];
  for (const step of content.steps) {
    try {
      const html = renderToStaticMarkup(
        <LessonProvider value={runtime}>
          <StepView
            step={step}
            lessonTitle={meta.lessonTitle}
            subjectTitle={meta.subjectTitle}
            unitTitle={meta.unitTitle}
            customRenderers={customRenderers}
          />
        </LessonProvider>,
      );
      rendered.push({ id: step.id, kind: step.kind, html });
    } catch (error) {
      rendered.push({
        id: step.id,
        kind: step.kind,
        html: "",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { rendered };
}

/** عدد الخطوات في المحتوى (يتحقق منه التدقيق أنه يساوي عدد المُصيَّر). */
export function countSteps(content: LessonContent): number {
  return content.steps.length;
}
