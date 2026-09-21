// ============================================================
// التصحيح — Grading (منطق نقي، بلا React وبلا شبكة)
// ============================================================
// يُستخدم من الخادم فقط عبر /api/grade.
//
// المبدأ: إجابات الطالب تُرسل إلى الخادم، والخادم يرد بـ
//   «صحيح/خطأ + الشرح»
// فقط. المفتاح الكامل لا يُرسل في الوضع العادي — لذلك
// حلول الأسئلة لا توجد في حزمة المتصفح إطلاقًا.
// ============================================================

import type { StudentQuestion } from "@/content/types";

/** سؤال مع إجابته وشرحه — يعيش على الخادم فقط (src/content/teacher/**). */
export interface TeacherQuestion extends StudentQuestion {
  /** فهرس الخيار الصحيح. */
  answer: number;
  /** شرح الإجابة بالعربية — «حلّ المعلم» على مستوى السؤال. */
  why: string;
}

/** مجموعة أسئلة درس واحد. */
export interface TeacherDataset {
  lessonId: string;
  questions: TeacherQuestion[];
}

export interface GradedAnswer {
  questionId: string;
  /** -1 تعني: لم يجب الطالب. */
  choice: number;
  correct: boolean;
  /** الشرح — يُرسل فقط للسؤال الذي جرى تقييمه. */
  why: string;
  /** فهرس الإجابة الصحيحة لهذا السؤال. */
  answer: number;
}

export interface GradeResult {
  lessonId: string;
  total: number;
  score: number;
  answers: GradedAnswer[];
}

/**
 * يصحّح إجابات الطالب مقابل مجموعة الأسئلة.
 *
 * @param dataset مجموعة الدرس (تبقى على الخادم)
 * @param submission ما أرسله المتصفح: معرّف السؤال ⇄ فهرس اختياره
 * @param options.revealAnswer إظهار الإجابة الصحيحة داخل النتيجة.
 *        يُستخدم في «تحقق من الإجابات» — أما التمرين القصير فقد يكتفي بالشرح.
 */
export function gradeSubmission(
  dataset: TeacherDataset,
  submission: Record<string, number>,
  options: { revealAnswer?: boolean } = {},
): GradeResult {
  const revealAnswer = options.revealAnswer ?? true;
  const answers: GradedAnswer[] = dataset.questions.map((question) => {
    const raw = submission[question.id];
    const choice = Number.isInteger(raw) ? raw : -1;
    const correct = choice === question.answer;
    return {
      questionId: question.id,
      choice,
      correct,
      why: question.why,
      answer: revealAnswer ? question.answer : -1,
    };
  });

  const score = answers.filter((a) => a.correct).length;
  return { lessonId: dataset.lessonId, total: dataset.questions.length, score, answers };
}

/** رسالة تشجيعية حسب النتيجة — موحّدة لكل الدروس. */
export function scoreMessage(percent: number): string {
  if (percent === 100) return "🏆 ممتاز! علامة كاملة — أنت جاهز للدرس التالي.";
  if (percent >= 80) return "🌟 رائع جدًا! راجع الأسئلة الخاطئة فقط.";
  if (percent >= 60) return "👍 جيد! أعد قراءة الشرح ثم حاول مجددًا.";
  return "💪 لا بأس — راجع الدرس من البداية ثم أعد الاختبار.";
}

/**
 * يبني خريطة الإجابات لفهرس الخيارات.
 * (تُستخدم في الاختبارات الذاتية وفي الواجهة لإرسال إجابات الطالب.)
 */
export function buildSubmission(
  entries: { questionId: string; choice: number }[],
): Record<string, number> {
  const submission: Record<string, number> = {};
  for (const entry of entries) submission[entry.questionId] = entry.choice;
  return submission;
}
