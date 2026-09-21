"use client";

import { useState } from "react";
import type { ExtractActivity } from "@/content/types";
import ActivityShell, { CheckButton } from "../lesson/ActivityShell";
import SolutionSteps from "../lesson/SolutionSteps";
import { LatinRuns } from "../bidi/LatinRuns";

// ============================================================
// كشف الخطوة التالية — Reveal the next step
// ============================================================
// يبني الطالب الحل خطوة خطوة بنفسه، فلا يرى الحل كاملًا دفعة واحدة.
// المحتوى لا يُركَّب في DOM قبل ضغط الزر (لا إخفاء بـ CSS).
// ============================================================

export default function RevealSteps({
  activity,
}: {
  activity: ExtractActivity<"revealSteps">;
}) {
  const [shown, setShown] = useState(0);
  const total = activity.steps.length;
  const done = shown >= total;

  return (
    <ActivityShell
      source={activity.source}
      prompt={activity.prompt}
      icon="🪜"
      footer={
        <>
          {!done ? (
            <CheckButton
              onClick={() => setShown((n) => Math.min(n + 1, total))}
              label={shown === 0 ? "ابدأ أول خطوة" : "اكشف الخطوة التالية"}
            />
          ) : (
            <span className="text-sm font-bold text-emerald-700">
              ✅ اكتمل الحل — راجع التعليل في كل خطوة.
            </span>
          )}
          {shown > 0 && !done && (
            <CheckButton
              variant="ghost"
              onClick={() => setShown(total)}
              label="أظهر الحل كاملًا"
            />
          )}
          {shown > 0 && (
            <span className="text-xs font-semibold text-slate-500">
              الخطوة {shown} من {total}
            </span>
          )}
        </>
      }
    >
      {shown > 0 ? (
        // data-locked: خطوات الحل تُركَّب فقط بعد الكشف — والتدقيق
        // الآلي يرفض وجود هذه العلامة في HTML الأولي للطالب.
        <div data-locked="true">
          <SolutionSteps steps={activity.steps} to={shown} />
        </div>
      ) : (
        <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
          <LatinRuns text="فكّر أولًا: ما المعطى؟ وما المطلوب؟ ثم اكشف الخطوة الأولى." />
        </p>
      )}
    </ActivityShell>
  );
}
