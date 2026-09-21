"use client";

import { useState } from "react";
import type { ExtractActivity } from "@/content/types";
import ActivityShell, { CheckButton, FeedbackNote } from "../lesson/ActivityShell";
import RichText from "../bidi/RichText";
import MathExpr from "../math/MathExpr";

// ============================================================
// اختر العملية الصحيحة — Choose the correct operation
// ============================================================
// يدرّب الطالب على *قرار* الحل (أيّ عملية؟ ولماذا؟) لا على الحساب فقط.
// لا تغذية راجعة قبل ضغط «تحقق».
// ============================================================

export default function ChooseOperation({
  activity,
}: {
  activity: ExtractActivity<"chooseOperation">;
}) {
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const correct = choice === activity.correct;

  return (
    <ActivityShell
      source={activity.source}
      prompt={activity.prompt}
      math={activity.math}
      icon="🧭"
      footer={
        <>
          <CheckButton
            onClick={() => setChecked(true)}
            disabled={choice === null || checked}
          />
          {checked && (
            <CheckButton
              variant="ghost"
              onClick={() => {
                setChecked(false);
                setChoice(null);
              }}
              label="إعادة المحاولة"
            />
          )}
        </>
      }
    >
      <div className="flex flex-wrap gap-2">
        {activity.options.map((option, index) => {
          const isPicked = choice === index;
          const revealCorrect = checked && index === activity.correct;
          const revealWrong = checked && isPicked && !correct;
          return (
            <button
              key={index}
              type="button"
              onClick={() => {
                setChoice(index);
                setChecked(false);
              }}
              aria-pressed={isPicked}
              className={`rounded-xl border px-3.5 py-2 font-bold transition ${
                revealCorrect
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : revealWrong
                    ? "border-rose-300 bg-rose-50 text-rose-800"
                    : isPicked
                      ? "border-transparent text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              style={isPicked && !checked ? { background: "var(--accent)" } : undefined}
            >
              <MathExpr value={option} />
            </button>
          );
        })}
      </div>

      {checked && (
        <FeedbackNote status={correct ? "correct" : "wrong"}>
          <RichText text={activity.why} />
        </FeedbackNote>
      )}
    </ActivityShell>
  );
}
