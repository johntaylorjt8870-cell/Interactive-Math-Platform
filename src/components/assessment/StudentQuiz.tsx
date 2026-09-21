"use client";

import { useState } from "react";
import type { StudentQuestion } from "@/content/types";
import { useLessonRuntime } from "../lesson/LessonContext";
import TeachersSpace from "./TeachersSpace";
import RichText from "../bidi/RichText";
import MathExpr from "../math/MathExpr";
import { scoreMessage } from "@/lib/assessment/grade";

// ============================================================
// الاختبار الختامي — Final quiz
// ============================================================
// قاعدة الحالة (من درس اللغة الإنجليزية): الاختيار ≠ التصحيح.
//   pick    = ما اختاره الطالب فقط.
//   checked = هل ضغط «تحقق من الإجابات»؟
// كل التغذية الراجعة (صح/خطأ، الشرح، النتيجة) معلّقة على checked.
//
// والأهم: الإجابات الصحيحة لا تصل إلى المتصفح إلا كنتيجة تصحيح
// من الخادم — لا مفاتيح في الصفحة ولا في الحزمة.
// ============================================================

interface GradeResponse {
  total: number;
  score: number;
  answers: { questionId: string; correct: boolean; why: string; answer: number }[];
  error?: string;
}

export default function StudentQuiz({ questions }: { questions: StudentQuestion[] }) {
  const { lessonId } = useLessonRuntime();
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [result, setResult] = useState<GradeResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [message, setMessage] = useState("");

  const answered = questions.filter((q) => picks[q.id] !== undefined).length;
  const perQuestion = new Map((result?.answers ?? []).map((a) => [a.questionId, a]));

  const submit = async () => {
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, answers: picks }),
      });
      const payload = (await response.json()) as GradeResponse;
      if (!response.ok) {
        setStatus("error");
        setMessage(
          payload?.error === "unknown_lesson"
            ? "لا يوجد مفتاح مصحَّح مسجَّل لهذا الدرس بعد."
            : "تعذّر التصحيح حاليًا.",
        );
        return;
      }
      setResult(payload);
      setStatus("idle");
    } catch {
      setStatus("error");
      setMessage("تعذّر الاتصال بالخادم للتصحيح.");
    }
  };

  const percent = result && result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;

  return (
    <div>
      <ol className="space-y-4">
        {questions.map((question, index) => {
          const picked = picks[question.id];
          const graded = perQuestion.get(question.id);
          return (
            <li key={question.id} className="step-card p-4">
              <p className="mb-2 font-bold text-slate-800">
                <span className="mr-1 text-slate-400">{index + 1}.</span>
                <RichText text={question.ar} />
              </p>
              {question.math && (
                <div className="mb-2">
                  <MathExpr value={question.math} display />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {question.opts.map((option, optionIndex) => {
                  const isPicked = picked === optionIndex;
                  const showCorrect = graded && optionIndex === graded.answer;
                  const showWrong = graded && isPicked && !graded.correct;
                  return (
                    <button
                      key={optionIndex}
                      type="button"
                      onClick={() => {
                        setPicks((previous) => ({ ...previous, [question.id]: optionIndex }));
                        setResult(null);
                      }}
                      aria-pressed={isPicked}
                      disabled={Boolean(result)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-bold transition disabled:cursor-default ${
                        showCorrect
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : showWrong
                            ? "border-rose-300 bg-rose-50 text-rose-800"
                            : isPicked
                              ? "border-transparent text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                      style={isPicked && !result ? { background: "var(--accent)" } : undefined}
                    >
                      <MathExpr value={option} />
                    </button>
                  );
                })}
              </div>
              {graded && (
                // data-locked: الشرح يأتي من الخادم بعد «تحقق من الإجابات» فقط
                <p
                  data-locked="true"
                  className={`reveal-panel mt-3 rounded-xl p-3 text-sm font-semibold leading-relaxed ${
                    graded.correct ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"
                  }`}
                >
                  <RichText text={graded.why} />
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={answered !== questions.length || status === "sending"}
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          {status === "sending" ? "جارٍ التصحيح…" : "تحقق من الإجابات"}
        </button>
        {result && (
          <button
            type="button"
            onClick={() => {
              setPicks({});
              setResult(null);
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            إعادة الاختبار
          </button>
        )}
        <span className="text-xs font-semibold text-slate-500">
          أجبتَ عن {answered} من {questions.length}
        </span>
      </div>

      {status === "error" && (
        <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-800" role="alert">
          {message}
        </p>
      )}

      {result && (
        <div data-locked="true" className="reveal-panel mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-2xl font-black text-slate-800">
            {result.score} / {result.total}
          </div>
          <p className="mt-1 font-bold text-slate-600">{scoreMessage(percent)}</p>
        </div>
      )}

      <TeachersSpace />
    </div>
  );
}
