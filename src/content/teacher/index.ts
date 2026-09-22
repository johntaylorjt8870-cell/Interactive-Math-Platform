// ============================================================
// إجابات المعلم — Teacher-only datasets
// ============================================================
// ⚠️ هذا الملف وكل ملفات هذا المجلد **خادمية فقط**.
//
// المبدأ (غير قابل للتفاوض): إجابات الأسئلة وشروحها لا تدخل
// حزمة المتصفح إطلاقًا. ليست مخفية بـ CSS ولا في حالة React —
// بل لا تُحزَّم مع العميل أصلًا.
//
// كيف تضيف مفتاح درس جديد:
//   1) أنشئ src/content/teacher/<lesson-id>.ts
//      مع `import "server-only"` و export default TeacherDataset.
//   2) أضف سطرًا واحدًا في USER_SERVER_DATASETS أدناه.
//   3) لا تستورد هذا المجلد من أي مكوّن عميل — سيفشل البناء،
//      وهذا مقصود (الحماية بالتصميم لا بالانتباه).
//
// تُقرأ المجموعات من مسارين:
//   - POST /api/grade        → تصحيح إجابات الطالب (يُرجع صحيح/خطأ + شرح)
//   - POST /api/teacher-key  → المفتاح الكامل (بعد كلمة مرور المعلم)
// ============================================================

import "server-only";
import type { TeacherDataset } from "@/lib/assessment/grade";

/**
 * سجل مفاتيح المعلم: معرّف الدرس ⇄ دالة تحميل كسولة.
 *
 * فارغ عن قصد في المرحلة الأولى: لا يوجد أي درس منهجي بعد.
 * (المبدأ: لا نُسجّل محتوى منهجيًا وهميًا كدرس حقيقي.)
 */
const TEACHER_DATASETS: Record<string, () => Promise<TeacherDataset>> = {
  "algebra-u1-l1": () => import("./algebra-u1-l1").then((m) => m.default),
  "geometry-u1-l1": () => import("./geometry-u1-l1").then((m) => m.default),
};

/** هل لهذا الدرس مفتاح معلم مسجَّل؟ */
export function isTeacherDatasetRegistered(lessonId: string): boolean {
  return Object.prototype.hasOwnProperty.call(TEACHER_DATASETS, lessonId);
}

/** قائمة الدروس التي لها مفاتيح مسجَّلة (للتقارير والتدقيق). */
export function listTeacherLessonIds(): string[] {
  return Object.keys(TEACHER_DATASETS);
}

/** يحمّل مفتاح درس — يُرجع null إن لم يكن مسجَّلًا. */
export async function loadTeacherDataset(lessonId: string): Promise<TeacherDataset | null> {
  const loader = TEACHER_DATASETS[lessonId];
  if (!loader) return null;
  const dataset = await loader();
  if (dataset.lessonId !== lessonId) {
    throw new Error(
      `TeacherDataset mismatch: registry key "${lessonId}" but dataset declares "${dataset.lessonId}"`,
    );
  }
  return dataset;
}
