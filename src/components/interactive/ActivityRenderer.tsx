"use client";

import type { Activity } from "@/content/types";
import RevealSteps from "./RevealSteps";
import TryYourself from "./TryYourself";
import ChooseOperation from "./ChooseOperation";
import PredictReveal from "./PredictReveal";
import MatchPairs from "./MatchPairs";
import MistakeHunt from "./MistakeHunt";
import FigureQuery from "./FigureQuery";
import QuickCheck from "./QuickCheck";
import PracticeSet from "./PracticeSet";

// ============================================================
// موزّع الأنشطة — Activity dispatcher
// ============================================================
// نقطة واحدة تربط بيانات النشاط بمكوّنه.
// إضافة نشاط جديد لاحقًا = إضافة فرع واحد هنا + نوعه في types.ts.
// لذا تبقى الدروس قابلة للإضافة بلا إعادة بناء المنصة.
// ============================================================

export default function ActivityRenderer({ activity }: { activity: Activity }) {
  switch (activity.kind) {
    case "revealSteps":
      return <RevealSteps activity={activity} />;
    case "tryYourself":
      return <TryYourself activity={activity} />;
    case "chooseOperation":
      return <ChooseOperation activity={activity} />;
    case "predictReveal":
      return <PredictReveal activity={activity} />;
    case "matchPairs":
      return <MatchPairs activity={activity} />;
    case "mistakeHunt":
      return <MistakeHunt activity={activity} />;
    case "figureQuery":
      return <FigureQuery activity={activity} />;
    case "quickCheck":
      return <QuickCheck activity={activity} />;
    case "practiceSet":
      return <PracticeSet activity={activity} />;
    default: {
      // حماية وقت البناء: إن أضفنا نوع نشاط ولم نضف فرعه هنا
      const exhaustive: never = activity;
      return <UnhandledActivity kind={(exhaustive as Activity).kind} />;
    }
  }
}

function UnhandledActivity({ kind }: { kind: string }) {
  return (
    <p className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-700">
      نوع نشاط غير مدعوم: {kind}
    </p>
  );
}
