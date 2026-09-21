import { notFound } from "next/navigation";
import LessonShell from "@/components/lesson/LessonShell";
import { devFixtureContent } from "@/dev/lesson-fixture";

// ============================================================
// معاينة هيكل الدرس — DEV ONLY
// ============================================================
// هذا المسار للعرض التقني أثناء التطوير فقط:
//   • غير مرتبط بأي درس في المنهاج.
//   • لا يظهر في التنقّل ولا في أي قائمة دروس.
//   • في الإنتاج يعيد 404 (لا يُبنى أصلًا).
//
// الغرض: التأكد بصريًا من أن نظام الخطوات والرياضيات والأشكال
// والتفاعلات يعمل — قبل كتابة أي محتوى منهجي حقيقي.
// ============================================================

export const metadata = {
  title: "معاينة هيكل الدرس (تطوير)",
  robots: { index: false, follow: false },
};

export default function DevLessonShellPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <LessonShell
      content={devFixtureContent}
      lessonTitle="نموذج عرض تقني"
      subjectId="algebra"
      subjectTitle="عرض"
      unitTitle="نماذج"
      exitHref="/"
    />
  );
}
