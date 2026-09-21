import { Fragment } from "react";
import { LatinRuns } from "./LatinRuns";
import MathExpr from "../math/MathExpr";

// ============================================================
// نص مختلط: عربية + رياضيات — Rich text
// ============================================================
// المشكلة الحقيقية التي يحلّها هذا المكوّن:
// الحقول النصية في الدرس (المعطى، المطلوب، الجواب، التعليل، السؤال…)
// نصوص عربية قد تحتوي رياضيات في وسطها، مثل:
//   "المعادلة $2x + 3 = 11$ حلها هو $x = 4$."
//
// لو مرّ هذا النص على <LatinRuns> فقط لظهرت أوامر LaTeX كنص خام.
// ولو مرّ على <MathExpr> فقط لانعكس النص العربي.
//
// القاعدة الملزمة للمؤلف: كل رياضيات داخل نص تُكتب بين $...$
//   • داخل $ $  → يُعرض عبر MathExpr (LTR معزول + كسور مكدّسة)
//   • خارجها    → يُعرض عبر LatinRuns (عربي RTL مع عزل المقاطع اللاتينية)
//
// التدقيق الآلي يرفض أي أمر LaTeX في نص غير مغلّف بـ $...$،
// فلا يمكن أن يُعرض LaTeX خامًا للطالب بالخطأ.
// ============================================================

/** يقسّم النص إلى مقاطع: نص عادي ورياضيات ($...$). */
export function splitRichText(text: string): { kind: "text" | "math"; value: string }[] {
  const parts: { kind: "text" | "math"; value: string }[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const start = text.indexOf("$", cursor);
    if (start === -1) {
      parts.push({ kind: "text", value: text.slice(cursor) });
      break;
    }
    const end = text.indexOf("$", start + 1);
    if (end === -1) {
      // $ بلا إغلاق: نتعامل معه كنص عادي (والتدقيق يرصده)
      parts.push({ kind: "text", value: text.slice(cursor) });
      break;
    }
    if (start > cursor) parts.push({ kind: "text", value: text.slice(cursor, start) });
    parts.push({ kind: "math", value: text.slice(start + 1, end) });
    cursor = end + 1;
  }

  return parts.filter((part) => part.value !== "");
}

export default function RichText({
  text,
  className = "",
  display = false,
}: {
  text: string;
  className?: string;
  /** عرض المقاطع الرياضية كمعادلات بارزة في وسط السطر. */
  display?: boolean;
}) {
  const parts = splitRichText(text);

  return (
    <>
      {parts.map((part, index) =>
        part.kind === "math" ? (
          <MathExpr key={index} value={part.value} display={display} className={className} />
        ) : (
          <Fragment key={index}>
            <LatinRuns text={part.value} className="ltr-run" />
          </Fragment>
        ),
      )}
    </>
  );
}

/** يجمع كل المقاطع الرياضية داخل نص (يستخدمه التدقيق الآلي). */
export function collectInlineMath(text: string): string[] {
  return splitRichText(text)
    .filter((part) => part.kind === "math")
    .map((part) => part.value);
}

/** هل يحتوي النص أمر LaTeX خارج $...$ ؟ (يستخدمه التدقيق الآلي) */
export function hasUnwrappedMath(text: string): boolean {
  return splitRichText(text).some(
    (part) => part.kind === "text" && /\\[A-Za-z]/.test(part.value),
  );
}
