"use client";

import { useSyncExternalStore } from "react";
import { getProgress, PROGRESS_EVENT, type StudentProgress } from "./progress";

// ============================================================
// مخزن التقدّم — Progress store (React binding)
// ============================================================
// localStorage نظام خارجي عن React، والطريقة الصحيحة لقراءته هي
// useSyncExternalStore (لا setState داخل useEffect).
// فائدتان:
//   1) لا تعارض في الترطيب (hydration): الخادم يرى الحالة الافتراضية.
//   2) كل المكوّنات تتحدّث تلقائيًا عند تغيّر التقدّم في تبويب آخر
//      (حدث storage) أو في نفس التبويب (حدث مخصّص).
//
// getSnapshot يجب أن يعيد نفس المرجع إن لم تتغيّر البيانات،
// وإلا دخل React في حلقة إعادة رسم — لذلك نخزّن النتيجة مؤقتًا.
// ============================================================

const defaultSnapshot: StudentProgress = {
  openedLessons: [],
  completedLessons: [],
  stepProgress: {},
  lastUpdated: "",
};

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedSnapshot: StudentProgress = defaultSnapshot;

/** يقرأ الحالة الحالية مع تخزين مؤقت مبني على النص المخزَّن. */
function getSnapshot(): StudentProgress {
  if (typeof window === "undefined") return defaultSnapshot;
  const raw = window.localStorage.getItem("math8_student_progress");
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  cachedSnapshot = getProgress();
  return cachedSnapshot;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === "math8_student_progress") listener();
  };
  const onLocal = () => listener();
  window.addEventListener("storage", onStorage);
  window.addEventListener(PROGRESS_EVENT, onLocal);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(PROGRESS_EVENT, onLocal);
  };
}

/** حالة التقدّم، متزامنة مع localStorage ومتفاعلة. */
export function useProgress(): StudentProgress {
  return useSyncExternalStore(subscribe, getSnapshot, () => defaultSnapshot);
}

/**
 * هل نحن في المتصفح بعد الترطيب؟
 * تُستخدم للقراءات التي يجب ألّا تظهر في HTML الخادم.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
