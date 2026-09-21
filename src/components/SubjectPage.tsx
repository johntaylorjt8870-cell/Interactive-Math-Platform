"use client";

import type { Subject } from "@/data/curriculum";
import { getSubjectStats } from "@/data/curriculum";
import LessonCard from "@/components/LessonCard";
import SearchBar from "@/components/SearchBar";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProgressBar from "@/components/ProgressBar";
import { computeSubjectProgress } from "@/lib/progress";
import { useProgress } from "@/lib/progress-store";

interface SubjectPageProps {
  subject: Subject;
}

export default function SubjectPage({ subject }: SubjectPageProps) {
  const stats = getSubjectStats(subject);
  const colorClass = subject.colorClass as "algebra" | "geometry";

  // Collect all lesson IDs
  const allLessonIds = subject.units.flatMap((u) => u.lessons.map((l) => l.id));

  // حالة التقدّم تُقرأ من مخزن localStorage عبر useSyncExternalStore،
  // ثم تُشتقّ النسبة والخريطة أثناء العرض (بلا setState داخل effect).
  const progressState = useProgress();
  const progress = computeSubjectProgress(progressState, allLessonIds);
  const completedMap: Record<string, boolean> = {};
  allLessonIds.forEach((id) => {
    completedMap[id] = progressState.completedLessons.includes(id);
  });

  const colorStyles = {
    algebra: {
      headerBg: "from-indigo-600 to-violet-700",
      headerText: "text-indigo-50",
      badgeBg: "bg-indigo-500/30 text-indigo-50",
      unitAccent: "border-indigo-200 bg-indigo-50",
      unitTitle: "text-indigo-800",
      unitBar: "bg-indigo-400",
    },
    geometry: {
      headerBg: "from-teal-600 to-cyan-700",
      headerText: "text-teal-50",
      badgeBg: "bg-teal-500/30 text-teal-50",
      unitAccent: "border-teal-200 bg-teal-50",
      unitTitle: "text-teal-800",
      unitBar: "bg-teal-400",
    },
  };
  const cs = colorStyles[colorClass];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Subject Header */}
      <div className={`bg-gradient-to-br ${cs.headerBg} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Breadcrumbs */}
          <nav className="mb-6" aria-label="مسار التنقل">
            <Breadcrumbs
              items={[
                { label: "الرئيسية", href: "/" },
                { label: subject.title },
              ]}
              colorClass="default"
            />
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Title Area */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl ${cs.badgeBg} flex items-center justify-center text-2xl font-black`}>
                  {subject.icon}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black">{subject.subtitle}</h1>
                  <p className="text-sm opacity-80">{subject.description}</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-3 mt-4">
                <span className={`${cs.badgeBg} px-3 py-1 rounded-full text-xs font-bold`}>
                  {stats.totalUnits} وحدات
                </span>
                <span className={`${cs.badgeBg} px-3 py-1 rounded-full text-xs font-bold`}>
                  {stats.totalLessons} درس
                </span>
                <span className="bg-emerald-500/30 text-emerald-50 px-3 py-1 rounded-full text-xs font-bold">
                  {stats.availableLessons} متاح
                </span>
                {stats.comingLessons > 0 && (
                  <span className="bg-amber-500/30 text-amber-50 px-3 py-1 rounded-full text-xs font-bold">
                    {stats.comingLessons} قريبًا
                  </span>
                )}
              </div>
            </div>

            {/* Progress Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 min-w-56 border border-white/20">
              <div className="text-sm font-semibold mb-1 opacity-90">تقدمك في {subject.title}</div>
              <div className="text-3xl font-black mb-3">{progress}%</div>
              <ProgressBar value={progress} colorClass="default" showPercent={false} size="lg" />
              <div className="text-xs opacity-70 mt-2">
                {Math.round((progress / 100) * allLessonIds.length)} من {allLessonIds.length} درس
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-8">
          <SearchBar
            subjectId={subject.id}
            placeholder={`ابحث في دروس ${subject.title}...`}
            colorClass={colorClass}
          />
        </div>

        {/* Units & Lessons */}
        <div className="space-y-10">
          {subject.units.map((unit, unitIdx) => {
            const unitLessonIds = unit.lessons.map((l) => l.id);
            const availableCount = unit.lessons.filter((l) => l.status === "available").length;

            return (
              <section
                key={unit.id}
                className="animate-fade-in"
                style={{ animationDelay: `${unitIdx * 0.1}s` }}
                aria-labelledby={`unit-${unit.id}-title`}
              >
                {/* Unit Header */}
                <div className={`flex items-center justify-between p-5 rounded-2xl border ${cs.unitAccent} mb-5`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${colorClass === "algebra" ? "bg-indigo-600" : "bg-teal-600"} text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-sm`}>
                      {unit.number}
                    </div>
                    <div>
                      <h2 id={`unit-${unit.id}-title`} className={`font-black text-lg ${cs.unitTitle}`}>
                        {unit.title}
                      </h2>
                      {unit.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{unit.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-left text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{unit.lessons.length}</span> درس
                    {availableCount > 0 && (
                      <span className="mr-2 text-emerald-600 font-semibold">
                        ({availableCount} متاح)
                      </span>
                    )}
                  </div>
                </div>

                {/* Lessons Grid */}
                {unit.lessons.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                    {unit.lessons.map((lesson) => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        subjectId={subject.id}
                        unitId={unit.id}
                        colorClass={colorClass}
                        isCompleted={completedMap[lesson.id]}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="font-medium">لا توجد دروس في هذه الوحدة حتى الآن</p>
                    <p className="text-sm mt-1">سيتم إضافة الدروس قريبًا</p>
                  </div>
                )}

                {/* Unit Divider (not last) */}
                {unitIdx < subject.units.length - 1 && (
                  <div className="mt-10 border-t border-slate-200" aria-hidden="true" />
                )}
              </section>
            );
          })}
        </div>

        {/* Empty State */}
        {subject.units.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">لا توجد وحدات بعد</h3>
            <p className="text-slate-500">سيتم إضافة وحدات {subject.title} قريبًا</p>
          </div>
        )}
      </div>
    </div>
  );
}
