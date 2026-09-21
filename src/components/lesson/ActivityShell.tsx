"use client";

import type { ReactNode } from "react";
import type { ContentSource } from "@/content/types";
import ProvenanceBadge from "./ProvenanceBadge";
import RichText from "../bidi/RichText";
import MathExpr from "../math/MathExpr";

// ============================================================
// قالب النشاط التفاعلي — Activity shell
// ============================================================
// يوفر لكل الأنشطة:
//   - إطارًا موحّدًا (شكل واحد يريح الطالب ويعوّده).
//   - شارة المصدر (من الكتاب / إضافة).
//   - رأس السؤال.
//   - منطقة أزرار موحّدة.
// المبدأ الملزم: لا يُركَّب أي محتوى حلّ في DOM الطالب قبل تصرّفه
// (ضغط زر). لذلك كل الأنشطة تركّب الحل شرطيًا، لا بـ CSS.
// ============================================================

export default function ActivityShell({
  source,
  prompt,
  math,
  children,
  footer,
  icon = "✏️",
  tone = "neutral",
}: {
  source: ContentSource;
  prompt: string;
  math?: string;
  children?: ReactNode;
  footer?: ReactNode;
  icon?: string;
  tone?: "neutral" | "accent";
}) {
  return (
    <section
      className={`rounded-2xl border p-4 sm:p-5 ${
        tone === "accent" ? "border-transparent" : "border-slate-200 bg-white"
      }`}
      style={tone === "accent" ? { background: "var(--accent-soft, #eef2ff)" } : undefined}
      aria-label={prompt}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <span aria-hidden="true">{icon}</span>
          <span>جرّب بنفسك</span>
        </div>
        <ProvenanceBadge source={source} />
      </div>

      <p className="text-slate-800 font-semibold leading-relaxed">
        <RichText text={prompt} />
      </p>

      {math && (
        <div className="my-3">
          <MathExpr value={math} display />
        </div>
      )}

      {children && <div className="mt-3">{children}</div>}
      {footer && <div className="mt-4 flex flex-wrap items-center gap-3">{footer}</div>}
    </section>
  );
}

/** زر «تحقق من الإجابات» الموحّد. */
export function CheckButton({
  onClick,
  disabled,
  label = "تحقق من الإجابات",
  variant = "primary",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  variant?: "primary" | "ghost";
}) {
  if (variant === "ghost") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
      >
        {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl px-5 py-2 text-sm font-bold text-white shadow-sm transition disabled:opacity-40"
      style={{ background: "var(--accent)" }}
    >
      {label}
    </button>
  );
}

/** لوحة نتيجة (صواب/خطأ) موحّدة. */
export function FeedbackNote({
  status,
  children,
}: {
  status: "correct" | "wrong" | "info";
  children: ReactNode;
}) {
  const styles = {
    correct: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    wrong: "bg-rose-50 text-rose-800 ring-rose-100",
    info: "bg-slate-50 text-slate-700 ring-slate-100",
  } as const;
  const icons = { correct: "✅", wrong: "✗", info: "💬" } as const;
  return (
    // data-locked: علامة قياسية للمحتوى الذي لا يجوز أن يوجد في DOM
    // قبل تصرّف الطالب. المكوّن لا يُركَّب إلا بعد التحقق/الكشف،
    // والتدقيق الآلي يرفض ظهور هذه العلامة في HTML الأولي.
    <div
      data-locked="true"
      className={`reveal-panel mt-3 rounded-xl p-3 text-sm font-semibold leading-relaxed ring-1 ${styles[status]}`}
      role={status === "wrong" ? "alert" : "status"}
    >
      <span className="mr-1" aria-hidden="true">
        {icons[status]}
      </span>
      {children}
    </div>
  );
}
