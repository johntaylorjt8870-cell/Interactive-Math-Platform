"use client";

import { createContext, useContext, type ReactNode } from "react";

// ============================================================
// سياق الدرس — Lesson runtime context
// ============================================================
// بعض المكوّنات (التمرين، الاختبار، فضاء المعلم) تحتاج معرّف الدرس
// لترسل التصحيح إلى الخادم. نمرّره عبر السياق بدل تمريره يدويًا
// في كل نشاط، فيبقى نموذج المحتوى نظيفًا من تفاصيل التشغيل.
// ============================================================

export interface LessonRuntime {
  lessonId: string;
  subjectId: "algebra" | "geometry";
  /** عنوان الدرس — يُعرض في رسائل المعلم. */
  lessonTitle: string;
}

const LessonContext = createContext<LessonRuntime | null>(null);

export function LessonProvider({
  value,
  children,
}: {
  value: LessonRuntime;
  children: ReactNode;
}) {
  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
}

export function useLessonRuntime(): LessonRuntime {
  const value = useContext(LessonContext);
  if (!value) {
    throw new Error(
      "useLessonRuntime must be used inside <LessonProvider> — تأكد أن الدرس معروض داخل LessonShell.",
    );
  }
  return value;
}
