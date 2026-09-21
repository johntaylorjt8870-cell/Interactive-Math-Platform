"use client";

import { useState } from "react";
import type { ExtractActivity } from "@/content/types";
import ActivityShell, { CheckButton, FeedbackNote } from "../lesson/ActivityShell";
import SolutionSteps from "../lesson/SolutionSteps";
import RichText from "../bidi/RichText";
import MathExpr from "../math/MathExpr";
import { answersMatchLoosely } from "@/lib/math/normalize";

// ============================================================
// جرّب بنفسك — Try it yourself
// ============================================================
// الطالب يحاول أولًا (كتابةً أو اختيارًا)، ثم يتحقق، ثم يرى الحل
// المبرَّر خطوة بخطوة. الجواب والحل لا يُركَّبان في DOM قبل التصرّف.
// التطبيع (normalizeAnswer) يمنع رفض جواب صحيح بسبب شكل الكتابة:
// أرقام عربية-هندية، فاصلة عشرية عربية، فراغات، إلخ.
// ============================================================

export default function TryYourself({
  activity,
}: {
  activity: ExtractActivity<"tryYourself">;
}) {
  const { answer } = activity;
  const choices = answer.choices;
  const [value, setValue] = useState("");
  const [choice, setChoice] = useState<number | null>(null);
  const [state, setState] = useState<"idle" | "correct" | "wrong">("idle");
  const [showHint, setShowHint] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const canCheck = choices ? choice !== null : value.trim().length > 0;

  const check = () => {
    const submitted = choices ? (choice !== null ? choices[choice] : "") : value;
    const correct = answersMatchLoosely(submitted, answer.accepted);
    setState(correct ? "correct" : "wrong");
    if (correct) setRevealed(true);
  };

  const reset = () => {
    setState("idle");
    setRevealed(false);
    setValue("");
    setChoice(null);
  };

  return (
    <ActivityShell
      source={activity.source}
      prompt={activity.prompt}
      math={activity.math}
      footer={
        <>
          <CheckButton onClick={check} disabled={!canCheck || state === "correct"} />
          {activity.hint && !showHint && (
            <CheckButton variant="ghost" onClick={() => setShowHint(true)} label="تلميح" />
          )}
          {state !== "idle" && <CheckButton variant="ghost" onClick={reset} label="إعادة المحاولة" />}
          {!revealed && (
            <CheckButton variant="ghost" onClick={() => setRevealed(true)} label="أظهر الحل" />
          )}
        </>
      }
    >
      {choices ? (
        <div className="flex flex-wrap gap-2">
          {choices.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setChoice(index);
                setState("idle");
              }}
              aria-pressed={choice === index}
              className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                choice === index
                  ? "border-transparent text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              style={choice === index ? { background: "var(--accent)" } : undefined}
            >
              <MathExpr value={option} />
            </button>
          ))}
        </div>
      ) : (
        <input
          dir="ltr"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setState("idle");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && canCheck) check();
          }}
          placeholder="اكتب الجواب هنا…"
          className="math-expr w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-slate-400"
          aria-label="جوابك"
        />
      )}

      {showHint && activity.hint && (
        <FeedbackNote status="info">
          <RichText text={activity.hint} />
        </FeedbackNote>
      )}

      {state === "correct" && (
        <FeedbackNote status="correct">
          <RichText text="أحسنت! الجواب صحيح." />
        </FeedbackNote>
      )}
      {state === "wrong" && (
        <FeedbackNote status="wrong">
          <RichText text="الجواب غير صحيح — راجع خطواتك، أو اطلب تلميحًا، ثم حاول مجددًا." />
        </FeedbackNote>
      )}

      {revealed && (
        <div data-locked="true" className="reveal-panel mt-4 rounded-xl border border-slate-200 bg-white p-3">
          <p className="mb-2 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-700">
            <span aria-hidden="true">🎯</span>
            <span>الجواب:</span>
            <MathExpr value={answer.display} />
          </p>
          <p className="mb-2 text-sm font-bold text-slate-700">
            <RichText text="خطوات الحل مع التعليل:" />
          </p>
          <SolutionSteps steps={activity.solution} />
        </div>
      )}
    </ActivityShell>
  );
}
