import { buildSubmission, gradeSubmission } from "@/lib/assessment/grade";
import { loadTeacherDataset } from "@/content/teacher";

// ============================================================
// POST /api/grade — تصحيح إجابات الطالب
// ============================================================
// لماذا على الخادم؟
//   لو صحّحنا في المتصفح لاحتجنا إرسال الإجابات الصحيحة إلى الحزمة،
//   فيستطيع الطالب رؤيتها. هنا تبقى الإجابات على الخادم،
//   ويُرسل للطالب نتيجة سؤاله وشرحه فقط.
//
// ملاحظة صريحة: هذا ليس حماية مطلقة (يمكن تخمين الخيارات محاولةً
// محاولة). الحماية الكاملة تحتاج تحديد معدل وتوثيقًا — خارج نطاق
// المرحلة الأولى، لكن معمارية «لا مفتاح في الحزمة» صحيحة وجاهزة.
// ============================================================

export const dynamic = "force-dynamic";

interface GradeRequestBody {
  lessonId?: unknown;
  answers?: unknown;
  revealAnswer?: unknown;
}

export async function POST(request: Request) {
  let body: GradeRequestBody;
  try {
    body = (await request.json()) as GradeRequestBody;
  } catch {
    return Response.json({ error: "bad_request", message: "صيغة الطلب غير صحيحة" }, { status: 400 });
  }

  const lessonId = typeof body.lessonId === "string" ? body.lessonId : "";
  if (!lessonId) {
    return Response.json({ error: "missing_lesson_id" }, { status: 400 });
  }

  const dataset = await loadTeacherDataset(lessonId);
  if (!dataset) {
    // لا معلومات عن دروس غير مسجّلة — رسالة واحدة موحّدة
    return Response.json({ error: "unknown_lesson" }, { status: 404 });
  }

  const rawAnswers =
    body.answers && typeof body.answers === "object"
      ? (body.answers as Record<string, unknown>)
      : {};

  const entries = Object.entries(rawAnswers)
    .filter(([, value]) => Number.isInteger(value))
    .map(([questionId, value]) => ({ questionId, choice: Number(value) }));

  const result = gradeSubmission(dataset, buildSubmission(entries), {
    revealAnswer: body.revealAnswer !== false,
  });

  return Response.json(result);
}
