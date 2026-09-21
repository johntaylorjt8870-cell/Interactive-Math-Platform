// ============================================================
// Progress Tracking — localStorage based
// ============================================================
// يتتبع هذا الملف تقدم الطالب محليًا في المتصفح.
// ============================================================

const STORAGE_KEY = "math8_student_progress";

export interface StudentProgress {
  openedLessons: string[];    // IDs of lessons the student has opened
  completedLessons: string[]; // IDs of lessons the student has completed
  lastVisited?: string;       // ID of last visited lesson
  lastUpdated: string;        // ISO date string
}

const defaultProgress: StudentProgress = {
  openedLessons: [],
  completedLessons: [],
  lastUpdated: new Date().toISOString(),
};

export function getProgress(): StudentProgress {
  if (typeof window === "undefined") return defaultProgress;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultProgress;
    return JSON.parse(stored) as StudentProgress;
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: StudentProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...progress,
      lastUpdated: new Date().toISOString(),
    }));
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
  if (subjectLessonIds.length === 0) return 0;
  const progress = getProgress();
  const completed = subjectLessonIds.filter((id) =>
    progress.completedLessons.includes(id) || progress.openedLessons.includes(id)
  ).length;
  return Math.round((completed / subjectLessonIds.length) * 100);
}
