"use client";

import { useState } from "react";
import type { ExtractActivity } from "@/content/types";
import ActivityShell, { CheckButton, FeedbackNote } from "../lesson/ActivityShell";
import { LatinRuns } from "../bidi/LatinRuns";
import RichText from "../bidi/RichText";
import MathExpr from "../math/MathExpr";

// ============================================================
// توقّع قبل الكشف — Predict before reveal
// ============================================================
// التوقّع يجبر الطالب على استدعاء القاعدة قبل رؤية النتيجة،
// وهذا أقوى من قراءة الحل جاهزًا.
// نص الكشف لا يُركَّب في DOM قبل ضغط «اكشف».
// ============================================================

export default function PredictReveal({
  activity,
}: {
  activity: ExtractActivity<"predictReveal">;
}) {
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const correct = choice === activity.correct;

  return (
    <ActivityShell
      source={activity.source}
      prompt={activity.prompt}
      icon="🔮"
      footer={
        <>
          <CheckButton
            onClick={() => setChecked(true)}
            disabled={choice === null}
            label="تثبيت التوقّع"
          />
          {checked && !revealed && (
            <CheckButton onClick={() => setRevealed(true)} label="اكشف النتيجة" />
          )}
          {checked && (
            <CheckButton
              variant="ghost"
              onClick={() => {
                setChecked(false);
                setRevealed(false);
                setChoice(null);
              }}
              label="إعادة المحاولة"
            />
          )}
        </>
      }
    >
      <div className="flex flex-wrap gap-2">
        {activity.choices.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => {
              setChoice(index);
              setChecked(false);
              setRevealed(false);
            }}
            aria-pressed={choice === index}
            className={`rounded-xl border px-3.5 py-2 font-bold transition ${
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

      {checked && (
        <FeedbackNote status={correct ? "correct" : "wrong"}>
          <LatinRuns
            text={
              correct
                ? "توقّعك صحيح — أنت تستدعي القاعدة في محلها."
                : "توقّعك مختلف عمّا سيظهر — تابع الكشف لتفهم السبب، فهنا يحدث التعلّم."
            }
          />
        </FeedbackNote>
      )}

      {revealed && (
        <div data-locked="true" className="reveal-panel mt-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2">
            <MathExpr value={activity.reveal} display />
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            <RichText text={activity.why} />
          </p>
        </div>
      )}
    </ActivityShell>
  );
}
