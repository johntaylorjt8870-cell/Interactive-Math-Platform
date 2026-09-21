// ============================================================
// بوابة الموقع — proxy.ts
// ============================================================
// بوابة كلمة مرور واحدة تحمي صفحات المنصة كلها.
//
// في Next.js 16 صار اسم الاصطلاح `proxy` بدل `middleware`
// (الاسم القديم مهجور، ووجود الملفَّين معًا خطأ بناء).
//
// ما تفعله هذه البوابة في كل طلب:
//   1) تقرأ كلمة المرور من البيئة (خادميًا فقط، في زمن الطلب).
//   2) تحدّد الوضع: مفعّلة / متجاوَزة في التطوير / مقفلة لنقص الإعداد.
//   3) لا تقبل الطلب إلا بكوكي صالح — التوقيع يُتحقّق منه تشفيريًا.
//
// ما لا تفعله عن قصد:
//   • لا تمرّ على مسارات /api إطلاقًا (تبقى حمايتها القائمة كما هي).
//   • لا تمسّ أصول Next.js الثابتة ولا صفحة الدخول.
//   • لا تعرف شيئًا عن مفاتيح المعلم — ولا تستوردها ولا تقارن بها.
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import {
  GATE_COOKIE_NAME,
  GATE_LOGIN_PATH,
  GATE_NOT_CONFIGURED_PATH,
  getGateMode,
  readSitePassword,
} from "@/lib/gate/config";
import { verifyGateCookieValue } from "@/lib/gate/token";

/** نُسجّل خطأ الإعداد مرّة واحدة لكل عملية — لا نُغرق السجلّ في كل طلب. */
let misconfigurationLogged = false;

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const isProduction = process.env.NODE_ENV === "production";
  const sitePassword = readSitePassword();
  const mode = getGateMode({ isProduction, sitePassword });

  // التطوير بلا كلمة مرور: لا نعطّل سير العمل المحلي والمعاينة.
  if (mode === "bypassed-in-development") {
    return NextResponse.next();
  }

  // الإنتاج بلا كلمة مرور: نقفل المحتوى ونُظهر خطأ إعداد صريحًا (503).
  // لا كلمة مرور افتراضية، ولا فتح صامت.
  if (mode === "blocked-misconfigured") {
    if (!misconfigurationLogged) {
      misconfigurationLogged = true;
      console.error(
        "[site-gate] SITE_PASSWORD غير مضبوط في بيئة الإنتاج — الصفحات المحمية مقفلة بحالة 503.",
      );
    }
    return NextResponse.rewrite(new URL(GATE_NOT_CONFIGURED_PATH, request.url), { status: 503 });
  }

  // كوكي صالح → مرّ.
  const cookieValue = request.cookies.get(GATE_COOKIE_NAME)?.value;
  if (cookieValue) {
    const valid = await verifyGateCookieValue({
      secret: sitePassword,
      value: cookieValue,
      now: Date.now(),
    });
    if (valid) return NextResponse.next();
  }

  // غير مصرّح → صفحة الدخول مع المسار الأصلي للعودة إليه بعد النجاح.
  // نُسقط `_rsc` (بارامتر طلبات التنقّل الداخلي) حتى لا يلتصق بمسار العودة.
  const requestedParams = new URLSearchParams(request.nextUrl.search);
  requestedParams.delete("_rsc");
  const requestedQuery = requestedParams.toString();
  const requested = requestedQuery
    ? `${request.nextUrl.pathname}?${requestedQuery}`
    : request.nextUrl.pathname;

  const loginUrl = new URL(GATE_LOGIN_PATH, request.url);
  loginUrl.searchParams.set("next", requested);

  // 307: يحفظ الطريقة عند طلبات التنقّل الداخلي.
  return NextResponse.redirect(loginUrl);
}

// Next.js يشترط أن يكون `matcher` حرفيًا ساكنًا يُقرأ في زمن البناء،
// فلا يمكن تمريره كثابت مستورد. لذلك نُضمّنه هنا نصًّا، ونُبقي النسخة
// المعيارية في GATE_MATCHER داخل src/lib/gate/config.ts — ويتحقّق
// scripts/gate-test.mjs آليًا من تطابق الاثنين، فلا ينحرف أحدهما عن الآخر.
export const config = {
  matcher: [
    "/((?!_next/|api/|gate(?:/|$)|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|json|webmanifest|css|js|map|woff|woff2|ttf)$).*)",
  ],
};
