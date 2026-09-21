// ============================================================
// تطبيع الأجوبة — Answer normalization
// ============================================================
// خطر حقيقي: الطالب يكتب الجواب الصحيح فيُرفض بسبب شكل الكتابة فقط.
// أمثلة على اختلافات يجب ألّا تُحسب خطأً:
//   "٤"      مقابل "4"      (أرقام عربية-هندية)
//   "1٫5"    مقابل "1.5"    (الفاصلة العشرية العربية)
//   "2x + 3" مقابل "2x+3"   (الفراغات)
//   "−3"     مقابل "-3"     (شرطة الطرح الطويلة)
//   "٣ × ٥"  مقابل "3*5"    (رموز العمليات)
// لذلك كل مقارنة أجوبة تمرّ من هنا قبل التصحيح الآلي.
// ============================================================

const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EXTENDED_ARABIC_INDIC_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export type NormalizeMode = "math" | "text";

export interface NormalizeOptions {
  /** "math" يشدد على الرموز والأرقام، و"text" يلطّف العربية. */
  mode?: NormalizeMode;
  /** توحيد أشكال الحروف العربية (أ/إ/آ → ا) — للأسئلة النصية. */
  looseArabic?: boolean;
}

/** يحوّل الأرقام العربية-الهندية والفارسية إلى أرقام غربية. */
export function toWesternDigits(input: string): string {
  let out = "";
  for (const char of input) {
    const arabicIndex = ARABIC_INDIC_DIGITS.indexOf(char);
    if (arabicIndex !== -1) {
      out += String(arabicIndex);
      continue;
    }
    const extendedIndex = EXTENDED_ARABIC_INDIC_DIGITS.indexOf(char);
    if (extendedIndex !== -1) {
      out += String(extendedIndex);
      continue;
    }
    out += char;
  }
  return out;
}

/** يحوّل الأرقام الغربية إلى عربية-هندية (للعرض في سياق عربي إن لزم). */
export function toArabicDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) => ARABIC_INDIC_DIGITS[Number(d)]);
}

/** توحيد أشكال الحروف العربية الشائعة. */
function normalizeArabicLetters(input: string): string {
  return input
    .replace(/[\u0623\u0625\u0622]/g, "\u0627") // أ إ آ → ا
    .replace(/\u0649/g, "\u064A") // ى → ي
    .replace(/\u0629/g, "\u0647") // ة → ه
    .replace(/[\u064B-\u0652\u0670\u0640]/g, ""); // تشكيل وتطويل
}

/**
 * توحيد الرموز الرياضية:
 *   × ✕ ⋅ · → *      ÷ → /
 *   − – — ‒ → -      ≤ ≥ ≠ ≈ → <= >= != ~=
 *   ٫ → .            ٬ → ""        ٪ → %
 */
function applyMathSymbols(input: string): string {
  return input
    .replace(/\u066B/g, ".")
    .replace(/\u066C/g, "")
    .replace(/\u066A/g, "%")
    .replace(/[\u2264]/g, "<=")
    .replace(/[\u2265]/g, ">=")
    .replace(/[\u2260]/g, "!=")
    .replace(/[\u2248]/g, "~=")
    .replace(/[\u00D7\u2715\u22C5\u00B7]/g, "*")
    .replace(/\u00F7/g, "/")
    .replace(/[\u2212\u2013\u2014\u2012]/g, "-");
}

/**
 * يطبّع نص الجواب للمقارنة.
 * لا يغيّر ما يراه الطالب — للمقارنة الداخلية فقط.
 */
export function normalizeAnswer(input: string, options: NormalizeOptions = {}): string {
  const mode = options.mode ?? "math";
  let out = toWesternDigits(String(input ?? ""));

  if (mode === "math") {
    out = applyMathSymbols(out);
    out = out
      .replace(/[\u066B\u060C,\u060C]/g, ".") // الفاصلة العربية كفاصلة عشرية
      .replace(/[{}×]/g, "")
      .replace(/\s+/g, "")
      .replace(/\*/g, "*");
    // "2*x" و "2x" متكافئتان
    out = out.replace(/(\d)\*([a-zA-Z(])/g, "$1$2");
    out = out.replace(/=+$/g, ""); // علامة "=" زائدة في النهاية
    return out;
  }

  out = out
    .replace(/[\u060C]/g, ",") // ، → ,
    .replace(/[\u061F]/g, "?") // ؟ → ?
    .replace(/[\u00AB\u00BB\u201C\u201D]/g, '"')
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, "") // محارف تحكم الاتجاه
    .replace(/\s+/g, " ")
    .trim();

  if (options.looseArabic ?? true) out = normalizeArabicLetters(out);
  return out;
}

/**
 * هل يطابق جواب الطالب أحد الأجوبة المقبولة؟
 * يقبل مصفوفة صيغ مقبولة لأن الجواب الرياضي قد يُكتب بأشكال متكافئة.
 */
export function answersMatch(
  input: string,
  accepted: string[],
  options: NormalizeOptions = {},
): boolean {
  const mode = options.mode ?? "math";
  const normalizedInput = normalizeAnswer(input, { ...options, mode });
  if (!normalizedInput) return false;

  const strict = normalizeAnswer(normalizedInput, { ...options, mode: "math" });
  return accepted.some((candidate) => {
    const normalizedCandidate = normalizeAnswer(candidate, { ...options, mode });
    if (normalizedCandidate === normalizedInput) return true;
    // مقارنة إضافية بلا مسافات لتفادي اختلاف التنسيق
    const a = normalizeAnswer(normalizedCandidate, { mode: "math" });
    const b = normalizeAnswer(normalizedInput, { mode: "math" });
    return a === b || a === strict;
  });
}

/**
 * مقارنة متسامحة: تنجح إن طابق الجوابُ أيَّ صيغة مقبولة
 * في الوضع الرياضي أو في الوضع النصي.
 *
 * السبب: أسئلة المنهاج مختلطة — جواب رياضي ("2x+3") أو جواب لغوي
 * ("مستقيمان متوازيان")، ولا نريد أن يعتمد القبول على تخمين المؤلف.
 */
export function answersMatchLoosely(input: string, accepted: string[]): boolean {
  if (answersMatch(input, accepted, { mode: "math" })) return true;
  return answersMatch(input, accepted, { mode: "text", looseArabic: true });
}
