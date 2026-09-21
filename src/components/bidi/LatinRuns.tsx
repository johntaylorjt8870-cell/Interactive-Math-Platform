import { Fragment } from "react";

// ============================================================
// عزل الاتجاه — Bidi isolation
// ============================================================
// الواجهة عربية RTL، لكن أي وحدة لاتينية/رياضية داخل نص عربي
// يجب أن تُعزل حتى لا ينعكس ترتيبها بصريًا.
//
// القاعدة الملزمة (مستمدة من درس اللغة الإنجليزية):
//   يُعزل المقطع اللاتيني *المتصل* كوحدة واحدة — لا الكلمة الواحدة.
//   تقسيم جملة إنجليزية إلى كلمات معزولة يعكس ترتيبها حتمًا.
//
// مثال على الخطر:
//   نص عربي: "القانون ax + b = 0 يحلّ المعادلة"
//   بلا عزل قد يظهر الترتيب البصري معكوسًا داخل السياق العربي.
// ============================================================

/** نطاقات الحروف العربية + علامات الترقيم العربية. */
const ARABIC_RANGES =
  "\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF";
const ARABIC_RUN = new RegExp(`[${ARABIC_RANGES}]+`, "g");
const HAS_ARABIC = new RegExp(`[${ARABIC_RANGES}]`);
const HAS_LATIN = /[A-Za-z]/;

/**
 * يقسّم النص إلى مقاطع، مع إبقاء المقاطع العربية علاماتٍ فاصلة.
 */
function splitKeep(text: string): string[] {
  ARABIC_RUN.lastIndex = 0;
  const out: string[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = ARABIC_RUN.exec(text)) !== null) {
    out.push(text.slice(last, match.index));
    out.push(match[0]);
    last = match.index + match[0].length;
  }
  out.push(text.slice(last));
  return out;
}

/**
 * يعزل كل مقطع لاتيني متصل داخل النص العربي كوحدة LTR واحدة.
 * يُستخدم تلقائيًا من مُصيّر الكتل لكل نص عربي — فلا يحتاج مؤلف الدرس
 * إلى التفكير في الاتجاه يدويًا.
 */
export function LatinRuns({
  text,
  className = "ltr-run",
}: {
  text: string;
  className?: string;
}) {
  return (
    <>
      {splitKeep(text).map((run, index) =>
        run !== "" && !HAS_ARABIC.test(run) && HAS_LATIN.test(run) ? (
          <span key={index} dir="ltr" className={className}>
            {run}
          </span>
        ) : (
          <Fragment key={index}>{run}</Fragment>
        ),
      )}
    </>
  );
}

/** هل النص يحتوي حروفًا عربية؟ */
export function hasArabic(text: string): boolean {
  return HAS_ARABIC.test(text);
}

/** هل النص يحتوي حروفًا لاتينية؟ */
export function hasLatin(text: string): boolean {
  return HAS_LATIN.test(text);
}
