"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lesson, Unit, Subject } from "@/data/curriculum";
import { markLessonOpened } from "@/lib/progress";
import Breadcrumbs from "@/components/Breadcrumbs";

interface LessonPageClientProps {
  lesson: Lesson;
  unit: Unit;
  subject: Subject;
  prevLesson: Lesson | null;
  nextLesson: Lesson | null;
}

export default function LessonPageClient({
  lesson,
  unit,
  subject,
  prevLesson,
  nextLesson,
}: LessonPageClientProps) {
  const [frameLoaded, setFrameLoaded] = useState(false);
  const colorClass = subject.colorClass as "algebra" | "geometry";

  const navColors = {
    algebra: {
      headerBg: "bg-indigo-600",
      btnBg: "bg-indigo-500 hover:bg-indigo-400",
      badge: "bg-indigo-500/30",
    },
    geometry: {
      headerBg: "bg-teal-600",
      btnBg: "bg-teal-500 hover:bg-teal-400",
      badge: "bg-teal-500/30",
    },
  };
  const nc = navColors[colorClass];

  // Mark lesson as opened
  useEffect(() => {
    markLessonOpened(lesson.id);
  }, [lesson.id]);

  const subjectPath = `/${subject.id}`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Lesson Navigation Header */}
      <header className={`${nc.headerBg} text-white shadow-lg sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-3 min-w-0">
              <Breadcrumbs
                items={[
                  { label: "الرئيسية", href: "/" },
                  { label: subject.title, href: subjectPath },
                  { label: unit.title, href: subjectPath },
                  { label: lesson.title },
                ]}
                colorClass="default"
              />
            </div>

            {/* Lesson Badge */}
            <span className={`${nc.badge} px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap`}>
              درس {lesson.globalNumber}
            </span>
          </div>

          {/* Title Row */}
          <div className="mt-2 flex items-center justify-between gap-4">
            <h1 className="text-lg sm:text-xl font-black leading-tight truncate">
              {lesson.title}
            </h1>
            <div className="flex items-center gap-2 flex-shrink-0 text-sm font-medium opacity-80">
              <span>{unit.title}</span>
              <span>•</span>
              <span>{subject.title}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Lesson Content */}
      <main className="flex-1">
        {lesson.contentPath ? (
          <div className="relative w-full min-h-screen">
            {!frameLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" aria-hidden="true" />
                  <p className="text-slate-500 font-medium">جارٍ تحميل الدرس...</p>
                </div>
              </div>
            )}
            <iframe
              src={lesson.contentPath}
              title={lesson.title}
              className="lesson-frame"
              style={{ opacity: frameLoaded ? 1 : 0, transition: "opacity 0.3s" }}
              onLoad={() => setFrameLoaded(true)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              aria-label={`محتوى الدرس: ${lesson.title}`}
            />
          </div>
        ) : (
          // Coming Soon State
          <div className="max-w-2xl mx-auto px-4 py-20 text-center">
            <div className={`w-24 h-24 mx-auto rounded-3xl ${colorClass === "algebra" ? "bg-indigo-50 border-indigo-100" : "bg-teal-50 border-teal-100"} border-2 flex items-center justify-center mb-6 text-5xl`}>
              {lesson.icon || "📖"}
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-3">{lesson.title}</h2>
            <p className="text-slate-600 mb-2 leading-relaxed">{lesson.description}</p>
            <p className="text-slate-500 text-sm mb-8">
              هذا الدرس سيكون متاحًا قريبًا. نعمل على إعداد محتوى تفاعلي عالي الجودة.
            </p>

            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-100 text-amber-700 rounded-xl text-sm font-bold border border-amber-200">
              <span aria-hidden="true">🔒</span>
              <span>قريبًا — {lesson.status === "coming" ? "تحت الإعداد" : "غير متاح"}</span>
            </div>

            {/* Meta Info */}
            {(lesson.slidesCount !== undefined || lesson.exercisesCount !== undefined) && (
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
                {lesson.slidesCount !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden="true">📚</span>
                    <span>{lesson.slidesCount} شرائح</span>
                  </span>
                )}
                {lesson.exercisesCount !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden="true">📝</span>
                    <span>{lesson.exercisesCount} تمارين</span>
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav
        className="border-t border-slate-200 bg-white shadow-lg py-4 px-4 sm:px-6 lg:px-8"
        aria-label="التنقل بين الدروس"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Previous */}
          <div className="flex-1 flex justify-start">
            {prevLesson ? (
              prevLesson.status === "available" ? (
                <Link
                  href={`/lesson/${prevLesson.id}`}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors max-w-48"
                  aria-label={`الدرس السابق: ${prevLesson.title}`}
                >
                  <span aria-hidden="true">→</span>
                  <span className="truncate">{prevLesson.title}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-400 rounded-xl text-sm max-w-48 cursor-not-allowed" aria-disabled="true">
                  <span aria-hidden="true">→</span>
                  <span className="truncate">{prevLesson.title}</span>
                </div>
              )
            ) : (
              <div />
            )}
          </div>

          {/* Back to Unit */}
          <Link
            href={subjectPath}
            className={`flex items-center gap-2 px-4 py-2.5 ${colorClass === "algebra" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-teal-600 hover:bg-teal-700"} text-white rounded-xl text-sm font-bold transition-colors shadow-sm`}
            aria-label={`العودة إلى ${subject.title}`}
          >
            <span aria-hidden="true">⊞</span>
            <span className="hidden sm:inline">العودة إلى {subject.title}</span>
            <span className="sm:hidden">الوحدة</span>
          </Link>

          {/* Next */}
          <div className="flex-1 flex justify-end">
            {nextLesson ? (
              nextLesson.status === "available" ? (
                <Link
                  href={`/lesson/${nextLesson.id}`}
                  className={`flex items-center gap-2 px-4 py-2.5 ${nc.btnBg} text-white rounded-xl text-sm font-semibold transition-colors max-w-48`}
                  aria-label={`الدرس التالي: ${nextLesson.title}`}
                >
                  <span className="truncate">{nextLesson.title}</span>
                  <span aria-hidden="true">←</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-400 rounded-xl text-sm max-w-48 cursor-not-allowed" aria-disabled="true">
                  <span className="truncate">{nextLesson.title}</span>
                  <span aria-hidden="true">←</span>
                </div>
              )
            ) : (
              <div />
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
