"use client";

import { useMemo, useState } from "react";
import type { ExtractActivity } from "@/content/types";
import ActivityShell, { CheckButton, FeedbackNote } from "../lesson/ActivityShell";
import { LatinRuns } from "../bidi/LatinRuns";
import RichText from "../bidi/RichText";
import MathExpr from "../math/MathExpr";

// ============================================================
// توصيل العناصر — Match pairs
// ============================================================
// تنفيذ بلا سحب وإفلات: اختَر من اليسار ثم من اليمين.
// السبب: السحب والإفلات غير موثوق على الجوال، وغير متاح للوحة
// المفاتيح؛ الاختيار بالنقر يعمل في كل الحالات (إتاحة + متانة).
// ============================================================

export default function MatchPairs({ activity }: { activity: ExtractActivity<"matchPairs"> }) {
  const rights = useMemo(
    () => activity.pairs.map((pair) => pair.right).map((value, index) => ({ value, index })),
    [activity.pairs],
  );
  // خلط ثابت للترتيب (بلا Math.random حتى لا يتغيّر بين الخادم والمتصفح)
  const shuffledRights = useMemo(
    () => [...rights].sort((a, b) => a.value.localeCompare(b.value, "ar")),
    [rights],
  );

  const [activeLeft, setActiveLeft] = useState<number | null>(null);
  const [links, setLinks] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);

  const allLinked = Object.keys(links).length === activity.pairs.length;

  const chooseRight = (shuffledIndex: number) => {
    if (activeLeft === null) return;
    // نخزّن فهرس الزوج الأصلي (لا فهرس الترتيب المخلوط) حتى
    // يبقى التحقق صحيحًا مهما تغيّر ترتيب العرض.
    const originalIndex = shuffledRights[shuffledIndex].index;
    setLinks((previous) => {
      const next: Record<number, number> = {};
      // إزالة أي ربط سابق لنفس العنصر الأيمن (ربط واحد لكل عنصر)
      for (const [left, right] of Object.entries(previous)) {
        if (right !== originalIndex) next[Number(left)] = right;
      }
      next[activeLeft] = originalIndex;
      return next;
    });
    setActiveLeft(null);
    setChecked(false);
  };

  /** الربط صحيح إذا وصّلنا العنصر الأيسر بنظيره في نفس الزوج. */
  const isCorrect = (leftIndex: number) => links[leftIndex] === leftIndex;

  return (
    <ActivityShell
      source={activity.source}
      prompt={activity.prompt}
      icon="🧩"
      footer={
        <>
          <CheckButton onClick={() => setChecked(true)} disabled={!allLinked || checked} />
          {checked && (
            <CheckButton
              variant="ghost"
              onClick={() => {
                setLinks({});
                setActiveLeft(null);
                setChecked(false);
              }}
              label="إعادة المحاولة"
            />
          )}
          {!allLinked && (
            <span className="text-xs font-semibold text-slate-500">
              وصّل كل عنصر: اختر من العمود الأيسر ثم من الأيمن.
            </span>
          )}
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ul className="space-y-2">
          {activity.pairs.map((pair, leftIndex) => {
            const linked = links[leftIndex];
            const state = checked
              ? isCorrect(leftIndex)
                ? "correct"
                : "wrong"
              : linked === undefined
                ? "empty"
                : "linked";
            return (
              <li key={leftIndex}>
                <button
                  type="button"
                  onClick={() => setActiveLeft(leftIndex)}
                  aria-pressed={activeLeft === leftIndex}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-right transition ${
                    state === "correct"
                      ? "border-emerald-300 bg-emerald-50"
                      : state === "wrong"
                        ? "border-rose-300 bg-rose-50"
                        : activeLeft === leftIndex
                          ? "border-slate-800 bg-slate-100"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <MathExpr value={pair.left} />
                  {linked !== undefined && (
                    <span className="text-xs font-bold text-slate-500">
                      → <MathExpr value={activity.pairs[linked].right} />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <ul className="space-y-2">
          {shuffledRights.map((right, rightIndex) => {
            const used = Object.values(links).includes(rightIndex);
            return (
              <li key={right.index}>
                <button
                  type="button"
                  onClick={() => chooseRight(rightIndex)}
                  disabled={activeLeft === null}
                  className={`w-full rounded-xl border px-3 py-2 transition disabled:opacity-50 ${
                    used ? "border-slate-300 bg-slate-100" : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <MathExpr value={right.value} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {checked && (
        <FeedbackNote status={activity.pairs.every((_, index) => isCorrect(index)) ? "correct" : "wrong"}>
          <LatinRuns
            text={
              activity.pairs.every((_, index) => isCorrect(index))
                ? "كل التوصيلات صحيحة."
                : "بعض التوصيلات غير صحيحة — الأحمر يحتاج مراجعة."
            }
          />
        </FeedbackNote>
      )}
    </ActivityShell>
  );
}
