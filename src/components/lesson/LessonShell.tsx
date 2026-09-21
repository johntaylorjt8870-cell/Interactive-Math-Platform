"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { LessonContent, Step } from "@/content/types";
import { LessonProvider } from "./LessonContext";
import StepRail from "./StepRail";
import StepView from "./StepView";
import { LatinRuns } from "../bidi/LatinRuns";
import {
  markLessonCompleted,
  markLessonOpened,
  markStepVisited,
} from "@/lib/progress";
import { useHydrated, useProgress } from "@/lib/progress-store";

// ============================================================
// هيكل الدرس التفاعلي — Interactive lesson shell
// ============================================================
// هذا هو «نظام التنقّل بين الخطوات» المطلوب:
//   - كل خطوة شاشة مستقلة (view)، لا صفحة طويلة بمراسي.
//   - شريط جانبي دائم يعرض الأقسام والخطوات.
//   - السابق/التالي + عدّاد + شريط تقدّم.
//   - تمرير تلقائي إلى أعلى عند تغيير الخطوة.
//   - لوحة مفاتيح: ← التالي، → السابق، المسافة التالي.
//   - على الشاشات الصغيرة: الفهرس في لوحة منسدلة (☰).
//   - استئناف من آخر خطوة وصل إليها الطالب.
// ============================================================

export interface LessonShellProps {
  content: LessonContent;
  lessonTitle: string;
  subjectId: "algebra" | "geometry";
  subjectTitle: string;
  unitTitle: string;
  /** مكوّنات خاصة بالدرس للخطوات من نوع custom. */
  customRenderers?: Record<string, ReactNode>;
  /** رابط العودة إلى صفحة المادة. */
  exitHref: string;
}

export default function LessonShell({
  content,
  lessonTitle,
  subjectId,
  subjectTitle,
  unitTitle,
  customRenderers,
  exitHref,
}: LessonShellProps) {
  const steps = content.steps;
  const total = steps.length;
  const [index, setIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [resumed, setResumed] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);

  const hydrated = useHydrated();
  const progressState = useProgress();

  // الاستئناف: بعد الترطيب فقط (كي لا يختلف HTML الخادم عن العميل).
  // ضبط الحالة أثناء العرض هو النمط الموصى به في React للاشتقاق من
  // نظام خارجي، وليس setState داخل useEffect.
  if (hydrated && !resumed) {
    setResumed(true);
    const saved = progressState.stepProgress?.[content.lessonId];
    if (saved && saved.lastStep > 0 && saved.lastStep < total) setIndex(saved.lastStep);
  }

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) return;
      setIndex(Math.min(Math.max(next, 0), total - 1));
    },
    [total],
  );

  const goNext = useCallback(() => setIndex((value) => Math.min(value + 1, total - 1)), [total]);
  const goPrev = useCallback(() => setIndex((value) => Math.max(value - 1, 0)), []);

  // تسجيل فتح الدرس وزيارة الخطوة — كتابة إلى نظام خارجي (localStorage)
  // داخل effect، بلا setState، وهو الاستخدام الصحيح للـ effects.
  useEffect(() => {
    if (!hydrated || total === 0) return;
    const current = steps[index];
    if (!current) return;
    markLessonOpened(content.lessonId);
    markStepVisited(content.lessonId, current.id, index);
    if (index === total - 1) markLessonCompleted(content.lessonId);
  }, [hydrated, content.lessonId, index, steps, total]);

  // تمرير إلى أعلى عند تغيير الخطوة (كل خطوة تبدأ من أعلاها)
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [index]);

  // لوحة المفاتيح: ← التالي (RTL) ، → السابق ، المسافة التالي
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (menuOpen) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      // لا نخطف المفاتيح أثناء الكتابة أو التفاعل مع الأزرار والخيارات
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON") return;
      if (event.key === "ArrowLeft") goNext();
      else if (event.key === "ArrowRight") goPrev();
      else if (event.key === " ") {
        event.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, menuOpen]);

  const runtime = useMemo(
    () => ({ lessonId: content.lessonId, subjectId, lessonTitle }),
    [content.lessonId, subjectId, lessonTitle],
  );

  if (total === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        لا توجد خطوات في هذا الدرس بعد.
      </div>
    );
  }

  const step: Step = steps[index];
  const progress = ((index + 1) / total) * 100;
  const atStart = index === 0;
  const atEnd = index === total - 1;

  return (
    <LessonProvider value={runtime}>
      <div
        className="lesson-shell relative flex h-[100dvh] flex-col overflow-hidden bg-slate-50"
        data-subject={subjectId}
      >
        {/* الشريط العلوي */}
        <header className="shrink-0 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3 px-3 py-2.5 sm:px-5">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-lg shadow-sm lg:hidden"
              aria-label="فهرس الدرس"
            >
              ☰
            </button>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-slate-500">
                <LatinRuns text={step.section} />
                <span className="mx-1.5 text-slate-300">·</span>
                <span className="font-black text-slate-800">
                  <LatinRuns text={step.title} />
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: "var(--accent)" }}
                />
              </div>
            </div>

            <span className="shrink-0 rounded-lg bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">
              {index + 1} / {total}
            </span>

            <Link
              href={exitHref}
              className="hidden shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-500 transition hover:bg-slate-100 sm:block"
            >
              خروج
            </Link>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          {/* الشريط الجانبي — سطح المكتب */}
          <div className="hidden w-72 shrink-0 border-s border-slate-200 lg:block">
            <StepRail
              steps={steps}
              currentIndex={index}
              onSelect={goTo}
              lessonTitle={lessonTitle}
              subjectTitle={subjectTitle}
            />
          </div>

          {/* منطقة الخطوة */}
          <main ref={mainRef} className="step-main min-w-0 flex-1 overflow-y-auto px-3 pb-28 pt-4 sm:px-6 lg:px-10">
            <div key={step.id} className="step-enter mx-auto max-w-3xl">
              <StepView
                step={step}
                lessonTitle={lessonTitle}
                subjectTitle={subjectTitle}
                unitTitle={unitTitle}
                customRenderers={customRenderers}
              />
            </div>
          </main>
        </div>

        {/* أزرار التنقّل العائمة */}
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-3">
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 p-1.5 shadow-xl backdrop-blur">
            <button
              type="button"
              onClick={goPrev}
              disabled={atStart}
              className="rounded-full px-4 py-2 text-sm font-bold text-slate-700 transition enabled:hover:bg-slate-100 disabled:opacity-30"
            >
              → السابق
            </button>
            <span className="h-6 w-px bg-slate-200" aria-hidden="true" />
            <button
              type="button"
              onClick={goNext}
              disabled={atEnd}
              className="rounded-full px-5 py-2 text-sm font-bold text-white shadow transition enabled:hover:opacity-90 disabled:opacity-30"
              style={{ background: "var(--accent)" }}
            >
              التالي ←
            </button>
          </div>
        </div>

        {/* الفهرس على الشاشات الصغيرة */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden" onClick={() => setMenuOpen(false)}>
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <div
              className="relative z-10 h-full w-80 max-w-[85vw] bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <StepRail
                steps={steps}
                currentIndex={index}
                onSelect={goTo}
                onClose={() => setMenuOpen(false)}
                lessonTitle={lessonTitle}
                subjectTitle={subjectTitle}
              />
            </div>
          </div>
        )}
      </div>
    </LessonProvider>
  );
}
