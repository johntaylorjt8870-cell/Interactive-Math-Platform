// ============================================================
// سجل الدروس — Lesson registry
// ============================================================
// العلاقة بين بيانات المنهاج (src/data/curriculum.ts) وتنفيذ الدروس.
//
//   • curriculum.ts  = بيانات وصفية: المعرّف، الرقم، العنوان، الحالة.
//   • هذا الملف     = أي دروس لها محتوى تفاعلي فعليًا، وأين يسكن.
//
// وهكذا تبقى الدروس مستقلّة: إضافة درس جديد = مجلد جديد + سطر واحد هنا،
// ولا تُعدَّل أي صفحة أخرى في المنصة (ولا الصفحة الرئيسية ولا صفحة المادة).
//
// ⚠️ السجل فارغ عن قصد في هذه المرحلة:
//     لا يوجد أي محتوى منهجي حقيقي بعد، ولا نُسجّل محتوى وهميًا.
//     كل الدروس الحالية تظهر بحالة «قريبًا» في صفحة المادة،
//     وهذا سلوكٌ مقصود لا خطأ.
//
// كيف تضيف درسًا لاحقًا (الخطوة 2 وما بعدها):
//   1) أنشئ المجلد:      src/lessons/<lesson-id>/
//   2) ضع المحتوى في:    src/lessons/<lesson-id>/content.ts
//        import type { LessonContent } from "@/content/types";
//        const content: LessonContent = { lessonId: "<lesson-id>", … };
//        export default content;
//   3) أضف سطرًا واحدًا هنا في LESSONS.
//   4) أنشئ سجل التغطية:  src/lessons/<lesson-id>/coverage.json
//   5) شغّل:              npm run audit:lesson -- <lesson-id>
//
// المعرّف في مجلد الدرس يجب أن يطابق معرّف الدرس في curriculum.ts
// حرفيًا — والتدقيق الآلي يتحقق من ذلك.
// ============================================================

import type { ComponentType } from "react";
import type { LessonContent, ExtractStep } from "@/content/types";

/** وحدة الدرس: المحتوى + أي مكوّنات خاصة (خطوات custom). */
export interface LessonModule {
  content: LessonContent;
  /** مكوّنات للخطوات من نوع custom — اختيارية، للدروس الاستثنائية فقط. */
  customSteps?: Record<string, ComponentType<{ step: ExtractStep<"custom"> }>>;
}

/**
 * سجل الدروس المنفَّذة: معرّف الدرس ⇄ دالة تحميل كسولة.
 * التحميل الكسول يعني أن كل درس يُحمَّل عند زيارته فقط،
 * فلا يتضخّم حجم الموقع مع كثرة الدروس.
 */
const LESSONS: Record<string, () => Promise<{ default: LessonModule | LessonContent }>> = {
  "algebra-u1-l1": () => import("./algebra-u1-l1/content"),
  // "geometry-u1-l1": () => import("./geometry-u1-l1/content"),
};

/** هل للدرس محتوى تفاعلي منفَّذ؟ */
export function isLessonImplemented(lessonId: string): boolean {
  return Object.prototype.hasOwnProperty.call(LESSONS, lessonId);
}

/** قائمة الدروس المنفَّذة (للإحصاءات والتدقيق). */
export function listImplementedLessonIds(): string[] {
  return Object.keys(LESSONS);
}

/** يحمّل محتوى درس — أو null إن لم يكن منفَّذًا بعد. */
export async function loadLessonModule(lessonId: string): Promise<LessonModule | null> {
  const loader = LESSONS[lessonId];
  if (!loader) return null;
  const loaded = await loader();
  const raw = loaded.default;
  const lessonModule: LessonModule =
    raw && typeof raw === "object" && "content" in raw
      ? (raw as LessonModule)
      : { content: raw as LessonContent };

  // حماية من أخطاء الربط: معرّف المحتوى يجب أن يطابق مفتاح السجل
  if (lessonModule.content.lessonId !== lessonId) {
    throw new Error(
      `Lesson registry mismatch: key "${lessonId}" but content declares "${lessonModule.content.lessonId}"`,
    );
  }
  return lessonModule;
}
