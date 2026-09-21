// ============================================================
// بوابة الموقع — توقيع الكوكي (Site gate token)
// ============================================================
// قيمة الكوكي ليست كلمة المرور، بل قيمة مشتقّة تشفيريًا:
//
//     <expiresAt>.<base64url( HMAC-SHA-256( المفتاح = كلمة المرور, "v1:<expiresAt>" ) )>
//
// لماذا HMAC وليس تخزين كلمة المرور نفسها:
//   • الكوكي لا يحمل السرّ أبدًا — تسريبه لا يكشف كلمة المرور.
//   • لا يمكن تمديد الصلاحية أو تزويرها بلا معرفة السرّ،
//     لأن التاريخ نفسه داخل الرسالة الموقَّعة.
//   • المقارنة تتمّ بزمن ثابت.
//
// لماذا Web Crypto (crypto.subtle) وليس node:crypto:
//   هذا الملف يُستورَد من proxy.ts ومن مسار الخادم معًا،
//   وWeb Crypto متاح في بيئتَي التشغيل — فلا نقيّد أنفسنا ببيئة واحدة،
//   ويمكن اختبار الملف مباشرة من سكربتات التدقيق.
//
// الملف لا يستورد أي شيء — لا `next` ولا `server-only` — ليبقى قابلًا
// للاختبار المنفصل (انظر scripts/gate-test.mjs).
// ============================================================

/** إصدار الرسالة الموقَّعة — يتيح تغيير الصيغة لاحقًا بلا كسر الكوكيات القديمة. */
const TOKEN_VERSION = "v1";

const encoder = new TextEncoder();

/** ترميز base64url بلا حشو (آمن داخل قيمة كوكي). */
function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** الرسالة التي تُوقَّع: الإصدار + لحظة الانتهاء. */
export function gateTokenMessage(expiresAt: number): string {
  return `${TOKEN_VERSION}:${expiresAt}`;
}

/** يشتقّ التوقيع: HMAC-SHA-256 بمفتاح = كلمة المرور، على الرسالة. */
export async function deriveGateSignature(secret: string, expiresAt: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(gateTokenMessage(expiresAt)),
  );
  return toBase64Url(new Uint8Array(signature));
}

/** يبني قيمة الكوكي الكاملة. */
export async function createGateCookieValue(secret: string, expiresAt: number): Promise<string> {
  const signature = await deriveGateSignature(secret, expiresAt);
  return `${expiresAt}.${signature}`;
}

/** مقارنة بزمن ثابت — لا تكشف موضع أول اختلاف. */
export function constantTimeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

/**
 * يتحقّق من قيمة الكوكي: الصيغة، ثم عدم الانتهاء، ثم التوقيع.
 */
export async function verifyGateCookieValue(options: {
  secret: string;
  value: string;
  now: number;
}): Promise<boolean> {
  const { secret, value, now } = options;
  if (secret.length === 0) return false;

  const separator = value.indexOf(".");
  if (separator <= 0 || separator === value.length - 1) return false;

  const rawExpiry = value.slice(0, separator);
  const signature = value.slice(separator + 1);

  // لحظة الانتهاء: أرقام فقط، وصغيرة بما يكفي لتبقى عددًا صحيحًا آمنًا.
  if (!/^\d{1,15}$/.test(rawExpiry)) return false;
  const expiresAt = Number(rawExpiry);
  if (!Number.isSafeInteger(expiresAt)) return false;

  // منتهية الصلاحية.
  if (expiresAt <= now) return false;

  const expected = await deriveGateSignature(secret, expiresAt);
  return constantTimeStringEqual(signature, expected);
}

/**
 * يتحقّق من كلمة المرور المُدخلة.
 *
 * لا نقارن النصّين مباشرةً، بل نشتقّ توقيعين من نفس الرسالة — واحد
 * بكلمة المرور الصحيحة وواحد بالمُدخلة — ونقارنهما بزمن ثابت.
 * النتيجة: كلمة المرور نفسها لا تدخل أي مقارنة نصّية، ولا يُبنى أي
 * فرع زمني يعتمد على طولها أو بادئتها.
 */
export async function isCorrectSitePassword(options: {
  secret: string;
  submitted: string;
  expiresAt: number;
}): Promise<boolean> {
  const { secret, submitted, expiresAt } = options;

  // مفتاح فارغ لا يصلح لـ HMAC، وإدخال فارغ مرفوض ابتداءً.
  if (secret.length === 0 || submitted.length === 0) return false;

  const [expected, actual] = await Promise.all([
    deriveGateSignature(secret, expiresAt),
    deriveGateSignature(submitted, expiresAt),
  ]);

  return constantTimeStringEqual(actual, expected);
}
