"use client";

import { useState } from "react";
import type { ExtractActivity } from "@/content/types";
import ActivityShell, { CheckButton, FeedbackNote } from "../lesson/ActivityShell";
import { useLessonRuntime } from "../lesson/LessonContext";
import RichText from "../bidi/RichText";
import MathExpr from "../math/MathExpr";

// ============================================================
// تمرين قصير — Practice set
// ============================================================
// الإجابات والشروح **ليست في هذه الحزمة إطلاقًا**.
// يرسل المتصفح اختيارات الطالب إلى /api/grade، والخادم يعيد
// «صحيح/خطأ + الشرح» لكل سؤال.
//
// هذا ما يجعل المتطلبين 6 و7 معماريّين لا تجميليّين:
// لا يوجد مسار يمكن للطالب أن يقرأ منه الحل من الصفحة.
// ============================================================

interface GradeResponse {
  total: number;
  score: number;
  answers: { questionId: string; correct: boolean; why: string; answer: number }[];
  error?: string;
}

export default function PracticeSet({ activity }: { activity: ExtractActivity<"practiceSet"> }) {
  const { lessonId } = useLessonRuntime();
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [result, setResult] = useState<GradeResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const answered = activity.questions.filter((q) => picks[q.id] !== undefined).length;

  const submit = async () => {
    setStatus("sending");
    setErrorMessage("");
    try {
      const response = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, answers: picks }),
      });
      const payload = (await response.json()) as GradeResponse;
      if (!response.ok) {
        setStatus("error");
        setErrorMessage(
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
      setErrorMessage("تعذّر الاتصال بالخادم للتصحيح.");
    }
  };

  const perQuestion = new Map((result?.answers ?? []).map((a) => [a.questionId, a]));

  return (
    <ActivityShell
      source={activity.source}
      prompt={activity.prompt}
      icon="📝"
      footer={
        <>
          <CheckButton
            onClick={submit}
            disabled={answered !== activity.questions.length || status === "sending"}
            label={status === "sending" ? "جارٍ التصحيح…" : "تحقق من الإجابات"}
          />
          {activity.badge && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
              {activity.badge}
            </span>
          )}
          <span className="text-xs font-semibold text-slate-500">
            أجبتَ عن {answered} من {activity.questions.length}
          </span>
          {result && (
            <CheckButton
              variant="ghost"
              onClick={() => {
                setPicks({});
                setResult(null);
              }}
              label="إعادة المحاولة"
            />
          )}
        </>
      }
    >
      {status === "error" && <FeedbackNote status="wrong">{errorMessage}</FeedbackNote>}

      <ol className="space-y-4">
        {activity.questions.map((question, index) => {
          const picked = picks[question.id];
          const graded = perQuestion.get(question.id);
          return (
            <li key={question.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="mb-2 font-semibold text-slate-800">
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
                <FeedbackNote status={graded.correct ? "correct" : "wrong"}>
                  <RichText text={graded.why} />
                </FeedbackNote>
              )}
            </li>
          );
        })}
      </ol>

      {result && (
        <FeedbackNote status={result.score === result.total ? "correct" : "info"}>
          نتيجتك: {result.score} / {result.total}
        </FeedbackNote>
      )}
    </ActivityShell>
  );
}
