// ============================================================
// بوابة الموقع — السياسة والإعدادات (Site gate policy)
// ============================================================
// ملف خادمي بحت: يقرأ متغيّر البيئة، ويحدّد وضع البوابة،
// ويحمل ثوابت الكوكي وقائمة المسارات المحمية.
//
// لا يوجد هنا — ولا في أي ملف آخر — أي كلمة مرور مكتوبة في الكود،
// ولا قيمة افتراضية احتياطية. القيمة تأتي من البيئة فقط.
//
// ملاحظة أمنية: هذا الملف يُستورَد من proxy ومن مسار /api/gate
// ومن صفحة الدخول (مكوّنات خادمية) — ولا يُستورَد من أي مكوّن عميل،
// فلا تصل قيمة البيئة إلى حزمة المتصفح إطلاقًا.
// ============================================================

/** اسم كوكي البوابة — HttpOnly، لا تقرأه جافاسكربت المتصفح. */
export const GATE_COOKIE_NAME = "site_access";

/**
 * اسم متغيّر البيئة الذي يحمل كلمة مرور الموقع.
 * يُستخدم للعرض في رسائل الإعداد فقط — لا يحمل قيمة.
 */
export const GATE_ENV_VAR = "SITE_PASSWORD";

/** مدّة الصلاحية: ٧ أيام. */
export const GATE_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/** صفحة الدخول. */
export const GATE_LOGIN_PATH = "/gate";

/** صفحة خطأ الإعداد — تُقدَّم بحالة 503 عند نقص الإعداد في الإنتاج. */
export const GATE_NOT_CONFIGURED_PATH = "/gate/not-configured";

/**
 * المسارات التي تمرّ من البوابة (matcher).
 *
 * مستثنى عن قصد:
 *   • `_next/`        أصول Next.js الثابتة (ضرورية لرسم صفحة الدخول).
 *   • `api/`          تبقى كل مسارات الـ API على حمايتها القائمة كما هي
 *                     (خصوصًا /api/health لفحوص النشر).
 *   • `gate`          صفحة الدخول وصفحة خطأ الإعداد — يجب أن تُفتح بلا كوكي.
 *   • favicon/robots/sitemap وملفات الأصول بامتداداتها.
 *
 * ⚠️ Next.js يشترط أن يكون matcher في proxy.ts حرفيًا ساكنًا (يُقرأ في زمن
 *    البناء)، فلا يمكن حقنه من هنا. لذلك هذا الثابت هو **النسخة المعيارية**،
 *    ويُضمّن نفس النصّ حرفيًا في proxy.ts. ويتحقّق scripts/gate-test.mjs
 *    آليًا من تطابق الاثنين — فإن عُدِّل أحدهما وحده يفشل الاختبار.
 */
export const GATE_MATCHER = [
  "/((?!_next/|api/|gate(?:/|$)|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|json|webmanifest|css|js|map|woff|woff2|ttf)$).*)",
];

/**
 * يقرأ كلمة مرور الموقع من البيئة — خادميًا فقط، وفي زمن الطلب.
 *
 * نستخدم القراءة المباشرة `process.env.SITE_PASSWORD` (لا فهرسة ديناميكية)
 * لأنها تبقى قراءة وقت تشغيل في proxy وفي مسارات الخادم — لا تُدمَج
 * القيمة في حزمة البناء. (تحقّقنا من ذلك عمليًا: حزمة proxy المُولَّدة
 * تحوي `process.env.SITE_PASSWORD` نصًّا، ولا تحوي أي قيمة.)
 *
 * لا نضع قيمة افتراضية، ولا نقصّ الفراغات (قد يكون الفراغ جزءًا مقصودًا).
 */
export function readSitePassword(): string {
  return process.env.SITE_PASSWORD ?? "";
}

/** وضع البوابة. */
export type GateMode =
  /** كلمة المرور مضبوطة → البوابة تعمل. */
  | "enabled"
  /** بلا كلمة مرور في التطوير → نسمح بالوصول حتى لا يتعطّل التطوير والمعاينة. */
  | "bypassed-in-development"
  /** بلا كلمة مرور في الإنتاج → نقفل المحتوى ونُظهر خطأ إعداد صريحًا. */
  | "blocked-misconfigured";

/**
 * يحدّد وضع البوابة من البيئة.
 * لا يوجد أي احتياطي: إن غابت القيمة في الإنتاج تُقفل الصفحات المحمية.
 */
export function getGateMode(options: { isProduction: boolean; sitePassword: string }): GateMode {
  if (options.sitePassword.length > 0) return "enabled";
  return options.isProduction ? "blocked-misconfigured" : "bypassed-in-development";
}

/** خصائص كوكي البوابة. */
export interface GateCookieOptions {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
}

/**
 * خصائص الكوكي:
 *   • HttpOnly — لا يصل إليه جافاسكربت المتصفح (حماية من XSS).
 *   • SameSite=Lax — لا يُرسل مع طلبات المواقع الأخرى.
 *   • Secure في الإنتاج — لا يُرسل إلا عبر HTTPS.
 */
export function gateCookieOptions(isProduction: boolean): GateCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: GATE_COOKIE_MAX_AGE_SECONDS,
  };
}

/**
 * يعقّم مسار العودة بعد الدخول (`?next=`) — حماية من إعادة التوجيه المفتوح.
 *
 * يُقبل مسار داخلي فقط يبدأ بـ `/`. ويُرفض كل ما يلي:
 *   • عنوان مطلق (`https://…`) أو ما يبدأ بـ `//` (بروتوكول نسبي).
 *   • مسار يحوي `\` (يُفسَّر في بعض المتصفحات كـ `/`).
 *   • محارف تحكّم.
 *   • صفحة الدخول نفسها (لتجنّب حلقة إعادة توجيه).
 * وفي كل حالة رفض نعود إلى الصفحة الرئيسية.
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (typeof raw !== "string") return "/";

  const value = raw.trim();
  if (value.length === 0) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  if (value.includes("\\")) return "/";
  if (/[\u0000-\u001F\u007F]/.test(value)) return "/";

  if (value === GATE_LOGIN_PATH) return "/";
  if (value.startsWith(`${GATE_LOGIN_PATH}/`)) return "/";
  if (value.startsWith(`${GATE_LOGIN_PATH}?`)) return "/";

  return value;
}
