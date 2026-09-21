import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getLessonById, getAdjacentLessons, curriculum } from "@/data/curriculum";
import { isLessonImplemented, loadLessonModule, type LessonModule } from "@/lessons/registry";
import LessonShell from "@/components/lesson/LessonShell";
import LessonPageClient from "./LessonPageClient";

// ============================================================
// صفحة الدرس — Lesson route
// ============================================================
// الصفحة خادمية: تقرأ بيانات المنهاج، ثم:
//   • إن كان للدرس محتوى تفاعلي مسجَّل في src/lessons/registry.ts
//     → تعرض LessonShell (نظام الخطوات الكامل).
//   • وإلا → تعرض حالة «قريبًا» (وهي حالة كل الدروس حاليًا).
//
// ملاحظة مهمة: لم يعد هناك iframe لأي درس. محتوى الدرس مكوّنات
// React حقيقية، لأن الـ iframe يمنع: التنقّل بين الخطوات، تتبّع
// التقدّم، عزل الاتجاه، وتصحيح التمارين على الخادم.
// ============================================================

interface LessonPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const params: { id: string }[] = [];
  for (const subject of Object.values(curriculum.subjects)) {
    for (const unit of subject.units) {
      for (const lesson of unit.lessons) {
        if (lesson.status === "available") {
          params.push({ id: lesson.id });
        }
      }
    }
  }
  return params;
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { id } = await params;
  const found = getLessonById(id);
  if (!found) {
    return { title: "الدرس غير موجود" };
  }
  return {
    title: `${found.lesson.title} — ${found.subject.title} — رياضيات الصف الثامن`,
    description: found.lesson.description,
  };
}

/**
 * يبني مكوّنات الخطوات المخصّصة (خطوات من نوع "custom").
 * كل درس قد يوفّر مكوّنات خاصة به في مجلده، دون أن يعرف
 * LessonShell شيئًا عنها — وهذا ما يحفظ استقلال الدروس.
 */
function buildCustomRenderers(module: LessonModule): Record<string, ReactNode> | undefined {
  if (!module.customSteps) return undefined;
  const renderers: Record<string, ReactNode> = {};
  for (const step of module.content.steps) {
    if (step.kind !== "custom") continue;
    const CustomStep = module.customSteps[step.componentId];
    if (CustomStep && !(step.componentId in renderers)) {
      renderers[step.componentId] = <CustomStep step={step} />;
    }
  }
  return Object.keys(renderers).length > 0 ? renderers : undefined;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { id } = await params;
  const found = getLessonById(id);

  if (!found) {
    notFound();
  }

  const { lesson, unit, subject } = found;
  const adjacent = getAdjacentLessons(id);

  if (isLessonImplemented(lesson.id)) {
    const lessonModule = await loadLessonModule(lesson.id);
    if (lessonModule) {
      return (
        <LessonShell
          content={lessonModule.content}
          lessonTitle={lesson.title}
          subjectId={subject.colorClass as "algebra" | "geometry"}
          subjectTitle={subject.title}
          unitTitle={unit.title}
          customRenderers={buildCustomRenderers(lessonModule)}
          exitHref={`/${subject.id}`}
        />
      );
    }
  }

  return (
    <LessonPageClient
      lesson={lesson}
      unit={unit}
      subject={subject}
      prevLesson={adjacent?.prev ?? null}
      nextLesson={adjacent?.next ?? null}
    />
  );
}
