"use client";

import { useState } from "react";
import type { ExtractActivity } from "@/content/types";
import ActivityShell, { CheckButton, FeedbackNote } from "../lesson/ActivityShell";
import Figure from "../geometry/Figure";
import RichText from "../bidi/RichText";

// ============================================================
// حدّد العلاقة الهندسية — Figure query
// ============================================================
// يربط الشكل بالمفهوم: الطالب ينظر إلى الشكل الهندسي الدقيق
// ثم يحدّد العلاقة الصحيحة (توازٍ، تطابق، زاوية…).
// الشكل نفسه من Figure = مبني على إحداثيات، لا رسم تقريبي.
// ============================================================

export default function FigureQuery({ activity }: { activity: ExtractActivity<"figureQuery"> }) {
  const [picked, setPicked] = useState<boolean[]>(() => activity.options.map(() => false));
  const [checked, setChecked] = useState(false);

  const correctFlags = activity.options.map((option) => Boolean(option.correct));
  const isCorrect =
    correctFlags.every((flag, index) => flag === picked[index]);

  const toggle = (index: number) => {
    setPicked((previous) => previous.map((value, i) => (i === index ? !value : value)));
    setChecked(false);
  };

  return (
    <ActivityShell
      source={activity.source}
      prompt={activity.prompt}
      icon="📐"
      footer={
        <>
          <CheckButton
            onClick={() => setChecked(true)}
            disabled={!picked.some(Boolean) || checked}
          />
          {checked && (
            <CheckButton
              variant="ghost"
              onClick={() => {
                setPicked(activity.options.map(() => false));
                setChecked(false);
              }}
              label="إعادة المحاولة"
            />
          )}
        </>
      }
    >
      <Figure spec={activity.figure} />

      <ul className="mt-3 space-y-2">
        {activity.options.map((option, index) => {
          const isFlagged = picked[index];
          const showCorrect = checked && Boolean(option.correct);
          const showWrong = checked && isFlagged && !option.correct;
          return (
            <li key={index}>
              <button
                type="button"
                onClick={() => toggle(index)}
                aria-pressed={isFlagged}
                className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-right transition ${
                  showCorrect
                    ? "border-emerald-300 bg-emerald-50"
                    : showWrong
                      ? "border-rose-300 bg-rose-50"
                      : isFlagged
                        ? "border-slate-800 bg-slate-100"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded border border-slate-300 text-xs font-bold text-white"
                  style={{ background: isFlagged ? "var(--accent)" : "transparent" }}
                  aria-hidden="true"
                >
                  {isFlagged ? "✓" : ""}
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  <RichText text={option.label} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {checked && (
        <FeedbackNote status={isCorrect ? "correct" : "wrong"}>
          <RichText text={activity.why} />
        </FeedbackNote>
      )}
    </ActivityShell>
  );
}
