"use client";

import Link from "next/link";
import type { Lesson } from "@/data/curriculum";

interface LessonCardProps {
  lesson: Lesson;
  subjectId: string;
  unitId: string;
  colorClass: "algebra" | "geometry";
  isCompleted?: boolean;
}

const statusConfig = {
  available: {
    badge: "متاح",
    badgeClass: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    buttonText: "ابدأ الدرس",
    buttonClass: "",
    disabled: false,
  },
  coming: {
    badge: "قريبًا",
    badgeClass: "bg-amber-100 text-amber-700",
    dot: "bg-amber-400",
    buttonText: "قريبًا",
    buttonClass: "opacity-60 cursor-not-allowed",
    disabled: true,
  },
  completed: {
    badge: "مكتمل",
    badgeClass: "bg-violet-100 text-violet-700",
    dot: "bg-violet-500",
    buttonText: "مراجعة الدرس",
    buttonClass: "",
    disabled: false,
  },
};

const colorConfig = {
  algebra: {
    numberBg: "bg-indigo-600",
    numberText: "text-white",
    buttonBg: "bg-indigo-600 hover:bg-indigo-700 text-white",
    borderAccent: "border-indigo-100",
    iconBg: "bg-indigo-50 text-indigo-500",
    reviewBg: "bg-violet-600 hover:bg-violet-700 text-white",
  },
  geometry: {
    numberBg: "bg-teal-600",
    numberText: "text-white",
    buttonBg: "bg-teal-600 hover:bg-teal-700 text-white",
    borderAccent: "border-teal-100",
    iconBg: "bg-teal-50 text-teal-500",
    reviewBg: "bg-violet-600 hover:bg-violet-700 text-white",
  },
};

export default function LessonCard({ lesson, colorClass, isCompleted }: LessonCardProps) {
  const effectiveStatus = isCompleted ? "completed" : lesson.status;
  const status = statusConfig[effectiveStatus];
  const colors = colorConfig[colorClass];

  const lessonPath = `/lesson/${lesson.id}`;

  return (
    <div
      className={`lesson-card bg-white rounded-2xl border border-slate-200 ${colors.borderAccent} shadow-sm overflow-hidden flex flex-col`}
      role="article"
      aria-label={`الدرس ${lesson.globalNumber}: ${lesson.title}`}
    >
      {/* Card Header */}
      <div className="p-5 flex items-start gap-4">
        {/* Number Badge */}
        <div
          className={`${colors.numberBg} ${colors.numberText} w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm`}
          aria-label={`رقم الدرس ${lesson.globalNumber}`}
        >
          {String(lesson.globalNumber).padStart(2, "0")}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-bold text-slate-800 text-base leading-snug truncate">
              {lesson.title}
            </h3>
            {/* Status Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${status.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot} inline-block`} aria-hidden="true" />
              {status.badge}
            </span>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
            {lesson.description}
          </p>
        </div>
      </div>

      {/* Meta Info */}
      {(lesson.slidesCount !== undefined || lesson.exercisesCount !== undefined) && (
        <div className="px-5 pb-3 flex items-center gap-4 text-xs text-slate-500">
          {lesson.slidesCount !== undefined && (
            <span className="flex items-center gap-1">
              <span aria-hidden="true">📚</span>
              <span>{lesson.slidesCount} شرائح</span>
            </span>
          )}
          {lesson.exercisesCount !== undefined && (
            <span className="flex items-center gap-1">
              <span aria-hidden="true">📝</span>
              <span>{lesson.exercisesCount} تمارين</span>
            </span>
          )}
          {lesson.duration && (
            <span className="flex items-center gap-1">
              <span aria-hidden="true">⏱</span>
              <span>{lesson.duration}</span>
            </span>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="mx-5 border-t border-slate-100" />

      {/* Action Button */}
      <div className="p-4">
        {lesson.status === "available" ? (
          <Link
            href={lessonPath}
            className={`
              w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
              text-sm font-semibold transition-all duration-200 shadow-sm
              ${effectiveStatus === "completed" ? colors.reviewBg : colors.buttonBg}
            `}
          >
            <span>{status.buttonText}</span>
            <span aria-hidden="true">←</span>
          </Link>
        ) : (
          <button
            disabled
            className={`
              w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
              text-sm font-semibold bg-slate-100 text-slate-400 cursor-not-allowed
            `}
            aria-disabled="true"
          >
            <span>🔒</span>
            <span>{status.buttonText}</span>
          </button>
        )}
      </div>
    </div>
  );
}
