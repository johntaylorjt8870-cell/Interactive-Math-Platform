"use client";

import { useState } from "react";
import type { ExtractActivity } from "@/content/types";
import ActivityShell, { CheckButton } from "../lesson/ActivityShell";
import RichText from "../bidi/RichText";
import MathExpr from "../math/MathExpr";

// ============================================================
// أين الخطأ؟ — Mistake hunt
// ============================================================
// المتطلب 33: الخطأ الشائع يُعرض صريحًا، ثم يُشرح سببه، ثم الصواب،
// ثم طريقة تذكّر. الهدف ليس تلقين الطالب خطأً، بل تدريبه على
// تمييزه — وهذا يثبّت الفهم.
//
// لا يُركَّب التصحيح في DOM قبل أن يطلب الطالب كشفه.
// ============================================================

export default function MistakeHunt({
  activity,
}: {
  activity: ExtractActivity<"mistakeHunt">;
}) {
  const [revealed, setRevealed] = useState<boolean[]>(() =>
    activity.items.map(() => false),
  );

  const revealOne = (index: number) =>
    setRevealed((previous) => previous.map((value, i) => (i === index ? true : value)));

  const revealedCount = revealed.filter(Boolean).length;

  return (
    <ActivityShell
      source={activity.source}
      prompt={activity.prompt}
      icon="🔍"
      footer={
        <>
          <CheckButton
            onClick={() => setRevealed(activity.items.map(() => true))}
            disabled={revealedCount === activity.items.length}
            label={revealedCount === 0 ? "اكشف الأخطاء" : "اكشف الباقي"}
          />
          <CheckButton
            variant="ghost"
            onClick={() => setRevealed(activity.items.map(() => false))}
            disabled={revealedCount === 0}
            label="إخفاء"
          />
        </>
      }
    >
      <ul className="space-y-3">
        {activity.items.map((item, index) => (
          <li key={index} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                ✗ غير صحيح
              </span>
              <MathExpr value={item.wrong} />
            </div>

            {revealed[index] ? (
              <div data-locked="true" className="reveal-panel space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                    ✓ الصحيح
                  </span>
                  <MathExpr value={item.correct} />
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  <span className="font-bold text-slate-700">السبب: </span>
                  <RichText text={item.why} />
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => revealOne(index)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                أين الخطأ؟
              </button>
            )}
          </li>
        ))}
      </ul>
    </ActivityShell>
  );
}
