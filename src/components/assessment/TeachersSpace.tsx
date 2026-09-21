"use client";

import { useState } from "react";
import { useLessonRuntime } from "../lesson/LessonContext";
import RichText from "../bidi/RichText";
import MathExpr from "../math/MathExpr";

// ============================================================
// فضاء المعلم — Teacher's Space
// ============================================================
// المفتاح الكامل (الأسئلة + الإجابات + الشرح) لا يوجد في حزمة
// المتصفح. هذه الواجهة ترسل كلمة المرور إلى /api/teacher-key،
// والخادم يرد بالمفتاح فقط بعد التحقق.
//
// ملاحظتان صريحتان:
//   1) القفل هنا ليس حماية تنزيل: الطالب الخبير قد يجرّب كلمات مرور.
//      لكنه ليس «إخفاءً بـ CSS» — فالحلول ليست في الصفحة أصلًا.
//   2) كلمة المرور تُضبط في متغيّر البيئة TEACHER_KEY_PASSWORD،
//      ولا توجد كلمة مرور مكتوبة في الكود.
//
// حالة هذا القسم مستقلة تمامًا عن حالة الاختبار: فتحه أو إغلاقه
// لا يمسّ اختيارات الطالب ولا نتيجته.
// ============================================================

interface TeacherKeyResponse {
  lessonId: string;
  questions: { id: string; ar: string; math?: string; opts: string[]; answer: number; why: string }[];
  error?: string;
}

const LETTERS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح"];

export default function TeachersSpace() {
  const { lessonId, lessonTitle } = useLessonRuntime();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [dataset, setDataset] = useState<TeacherKeyResponse | null>(null);
  const [status, setStatus] = useState<"locked" | "checking" | "unlocked" | "error">("locked");
  const [message, setMessage] = useState("");

  const unlock = async () => {
    setStatus("checking");
    setMessage("");
    try {
      const response = await fetch("/api/teacher-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, password }),
      });
      const payload = (await response.json()) as TeacherKeyResponse;
      if (!response.ok) {
        setStatus("error");
        setMessage(
          payload?.error === "not_configured"
            ? "مفتاح المعلم غير مُهيّأ على الخادم (TEACHER_KEY_PASSWORD)."
            : payload?.error === "unknown_lesson"
              ? "لا يوجد مفتاح مسجَّل لهذا الدرس بعد."
              : "كلمة المرور غير صحيحة.",
        );
        return;
      }
      setDataset(payload);
      setStatus("unlocked");
      setPassword("");
    } catch {
      setStatus("error");
      setMessage("تعذّر الاتصال بالخادم.");
    }
  };

  return (
    <section className="mt-10 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-200 text-xl" aria-hidden="true">
          🧑‍🏫
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-black text-slate-700">فضاء المعلم</div>
          <div className="text-sm font-bold text-slate-500">
            <RichText text={`مفتاح الأسئلة والإجابات — ${lessonTitle}`} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-500 shadow-sm transition hover:text-slate-700"
          aria-expanded={open}
        >
          {status === "unlocked" ? "🔓 مفتوحة" : "🔒 مقفلة"}
        </button>
      </div>

      {!open && (
        <p className="mt-3 text-xs font-semibold text-slate-400">
          للاستخدام التعليمي من المعلّم — محتوى هذا القسم لا يظهر للطالب في الصفحة.
        </p>
      )}

      {open && status !== "unlocked" && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") unlock();
            }}
            placeholder="كلمة مرور المعلم"
            aria-label="كلمة مرور المعلم"
            className="w-48 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
          <button
            type="button"
            onClick={unlock}
            disabled={!password || status === "checking"}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition disabled:opacity-40"
          >
            {status === "checking" ? "جارٍ التحقق…" : "فتح المفتاح"}
          </button>
          {message && <p className="text-sm font-bold text-rose-600">{message}</p>}
        </div>
      )}

      {open && status === "unlocked" && dataset && (
        <ol className="reveal-panel mt-4 space-y-4">
          {dataset.questions.map((question, index) => (
            <li key={question.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-2 font-bold text-slate-800">
                <span className="mr-1 text-slate-400">{index + 1}.</span>
                <RichText text={question.ar} />
              </p>
              {question.math && (
                <div className="mb-2">
                  <MathExpr value={question.math} display />
                </div>
              )}
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {question.opts.map((option, optionIndex) => (
                  <li
                    key={optionIndex}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
                      optionIndex === question.answer
                        ? "border-emerald-300 bg-emerald-50 font-bold text-emerald-900"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    <span className="font-black text-slate-400">{LETTERS[optionIndex] ?? optionIndex + 1}</span>
                    <MathExpr value={option} />
                    {optionIndex === question.answer && <span aria-hidden="true">✓</span>}
                  </li>
                ))}
              </ul>
              <p className="mt-2 rounded-xl bg-sky-50 p-2.5 text-sm leading-relaxed text-sky-900">
                <span className="font-bold">الشرح: </span>
                <RichText text={question.why} />
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
