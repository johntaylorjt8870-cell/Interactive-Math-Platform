// ============================================================
// Progress Tracking — localStorage based
// ============================================================
// يتتبع هذا الملف تقدم الطالب محليًا في المتصفح.
//
// الدرس لم يعد صفحة واحدة: له خطوات (20–45 خطوة)، فيُحفظ:
//   - آخر خطوة وصل إليها الطالب (لاستئناف الدرس من مكانه).
//   - الخطوات التي زارها فعلًا.
// مع الحفاظ على التتبّع القديم (دروس فُتحت / أُكملت) كما هو،
// حتى لا تتأثر الصفحة الرئيسية وصفحات المواد.
// ============================================================

export const STORAGE_KEY = "math8_student_progress";

/**
 * حدث محلي يُطلَق بعد كل حفظ، حتى تتحدّث المكوّنات في نفس التبويب
 * (حدث storage القياسي يعمل بين التبويبات فقط).
 */
export const PROGRESS_EVENT = "math8:progress";

export interface LessonStepProgress {
  /** فهرس آخر خطوة وصل إليها الطالب. */
  lastStep: number;
  /** معرّفات الخطوات التي زارها. */
  visited: string[];
}

export interface StudentProgress {
  openedLessons: string[]; // IDs of lessons the student has opened
  completedLessons: string[]; // IDs of lessons the student has completed
  lastVisited?: string; // ID of last visited lesson
  /** تتبّع الخطوات لكل درس (أُضيف مع نظام الخطوات التفاعلي). */
  stepProgress?: Record<string, LessonStepProgress>;
  lastUpdated: string; // ISO date string
}

const defaultProgress: StudentProgress = {
  openedLessons: [],
  completedLessons: [],
  stepProgress: {},
  lastUpdated: new Date().toISOString(),
};

export function getProgress(): StudentProgress {
  if (typeof window === "undefined") return defaultProgress;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultProgress;
    const parsed = JSON.parse(stored) as StudentProgress;
    // توافق مع النسخة السابقة: بيانات قديمة بلا stepProgress
    return {
      ...defaultProgress,
      ...parsed,
      openedLessons: parsed.openedLessons ?? [],
      completedLessons: parsed.completedLessons ?? [],
      stepProgress: parsed.stepProgress ?? {},
    };
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: StudentProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...progress, lastUpdated: new Date().toISOString() }),
    );
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  } catch {
    // localStorage might be full or unavailable
  }
}

export function markLessonOpened(lessonId: string): void {
  const progress = getProgress();
  if (!progress.openedLessons.includes(lessonId)) {
    progress.openedLessons.push(lessonId);
  }
  progress.lastVisited = lessonId;
  saveProgress(progress);
}

export function markLessonCompleted(lessonId: string): void {
  const progress = getProgress();
  if (!progress.completedLessons.includes(lessonId)) {
    progress.completedLessons.push(lessonId);
  }
  if (!progress.openedLessons.includes(lessonId)) {
    progress.openedLessons.push(lessonId);
  }
  saveProgress(progress);
}

/** يسجّل زيارة خطوة — يدعم الاستئناف من مكان التوقّف. */
export function markStepVisited(lessonId: string, stepId: string, stepIndex: number): void {
  const progress = getProgress();
  const stepProgress = progress.stepProgress ?? {};
  const current = stepProgress[lessonId] ?? { lastStep: 0, visited: [] };
  const visited = current.visited.includes(stepId)
    ? current.visited
    : [...current.visited, stepId];
  stepProgress[lessonId] = { lastStep: stepIndex, visited };
  progress.stepProgress = stepProgress;
  progress.lastVisited = lessonId;
  saveProgress(progress);
}

/** آخر خطوة محفوظة لدرس (null إن لم يزره الطالب بعد). */
export function getLessonStepProgress(lessonId: string): LessonStepProgress | null {
  const progress = getProgress();
  return progress.stepProgress?.[lessonId] ?? null;
}

export function isLessonCompleted(lessonId: string): boolean {
  const progress = getProgress();
  return progress.completedLessons.includes(lessonId);
}

export function isLessonOpened(lessonId: string): boolean {
  const progress = getProgress();
  return progress.openedLessons.includes(lessonId);
}

/**
 * حساب نسبة التقدم في مادة معينة
 * @param subjectLessonIds - كل IDs الدروس في المادة
 */
export function getSubjectProgress(subjectLessonIds: string[]): number {
  return computeSubjectProgress(getProgress(), subjectLessonIds);
}

/**
 * نفس الحساب لكن من حالة جاهزة (نقية) — تسمح للمكوّنات باشتقاق
 * النسبة أثناء العرض بدل setState داخل useEffect.
 */
export function computeSubjectProgress(
  progress: StudentProgress,
  subjectLessonIds: string[],
): number {
  if (subjectLessonIds.length === 0) return 0;
  const completed = subjectLessonIds.filter(
    (id) => progress.completedLessons.includes(id) || progress.openedLessons.includes(id),
  ).length;
  return Math.round((completed / subjectLessonIds.length) * 100);
}
