"use client";

import { useState } from "react";
import type { ExtractActivity } from "@/content/types";
import ActivityShell, { CheckButton, FeedbackNote } from "../lesson/ActivityShell";
import RichText from "../bidi/RichText";
import MathExpr from "../math/MathExpr";
import OptionLabel from "../lesson/OptionLabel";

// ============================================================
// تحقّق سريع من الفهم — Quick check
// ============================================================
// سؤال أو سؤالان بعد فكرة جديدة، للتأكد من المتابعة قبل الاستمرار.
// قاعدة الحالة (من درس اللغة الإنجليزية): الاختيار ≠ التصحيح.
//   pick    = ما اختاره الطالب فقط، بلا أي دلالة على الصواب.
//   checked = هل ضغط «تحقق»؟
// كل التغذية الراجعة معلّقة على checked وحدها.
// ============================================================

export default function QuickCheck({ activity }: { activity: ExtractActivity<"quickCheck"> }) {
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);

  const allAnswered = activity.items.every((item) => picks[item.id] !== undefined);
  const score = activity.items.filter((item) => picks[item.id] === item.correct).length;

  return (
    <ActivityShell
      source={activity.source}
      prompt={activity.prompt}
      icon="⚡"
      footer={
        <>
          <CheckButton onClick={() => setChecked(true)} disabled={!allAnswered || checked} />
          {checked && (
            <>
              <span className="text-sm font-bold text-slate-700">
                النتيجة: {score} / {activity.items.length}
              </span>
              <CheckButton
                variant="ghost"
                onClick={() => {
                  setPicks({});
                  setChecked(false);
                }}
                label="إعادة المحاولة"
              />
            </>
          )}
        </>
      }
    >
      <ol className="space-y-4">
        {activity.items.map((item, index) => {
          const picked = picks[item.id];
          const isCorrect = picked === item.correct;
          return (
            <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="mb-2 font-semibold text-slate-800">
                <span className="mr-1 text-slate-400">{index + 1}.</span>
                <RichText text={item.ar} />
              </p>
              {item.math && (
                <div className="mb-2">
                  <MathExpr value={item.math} display />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {item.opts.map((option, optionIndex) => {
                  const showCorrect = checked && optionIndex === item.correct;
                  const showWrong = checked && picked === optionIndex && !isCorrect;
                  const isPicked = picked === optionIndex;
                  return (
                    <button
                      key={optionIndex}
                      type="button"
                      onClick={() => {
                        setPicks((previous) => ({ ...previous, [item.id]: optionIndex }));
                        setChecked(false);
                      }}
                      aria-pressed={isPicked}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-bold transition ${
                        showCorrect
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : showWrong
                            ? "border-rose-300 bg-rose-50 text-rose-800"
                            : isPicked
                              ? "border-transparent text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                      style={isPicked && !checked ? { background: "var(--accent)" } : undefined}
                    >
                      <OptionLabel value={option} />
                    </button>
                  );
                })}
              </div>
              {checked && (
                <FeedbackNote status={isCorrect ? "correct" : "wrong"}>
                  <RichText text={item.why} />
                </FeedbackNote>
              )}
            </li>
          );
        })}
      </ol>
    </ActivityShell>
  );
}
