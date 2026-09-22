// ============================================================
// اختبار بوابة الموقع عبر HTTP — Site gate end-to-end
// ============================================================
// يتحقّق من السلوك الفعلي على خادم Next حقيقي (proxy + مسارات + كوكي):
//   1)  زائر بلا كوكي لا يصل إلى أي صفحة محمية.
//   2)  صفحة الدخول تبقى مفتوحة.
//   3)  كلمة المرور الخاطئة تُرفض.
//   4)  كلمة المرور الصحيحة تمنح الوصول.
//   5)  الوصول يستمرّ عبر التنقّل بين الصفحات.
//   6)  مسارات الدروس محمية.
//   7)  الكوكي HttpOnly.
//   8)  الكوكي SameSite=Lax و Secure في الإنتاج.
//   9)  كلمة المرور لا تُوضع في الكوكي ولا في أي HTML أو حزمة متصفح.
//   10) /api/health ما زال يعمل.
//   11) حماية المعلم مستقلة: كلمة مرور الموقع لا تفتح مفتاح المعلم.
//   12) نظافة التخزين للنشر: الصفحات المحمية (والتحويلات قبل الدخول) لا
//       تُخزَّن في أي وسيط مشترك (CDN/وسيط عكسي) — فلا يقدّم وسيطٌ ردًّا
//       محميًا لزائر بلا كوكي. وتبقى أصول Next.js قابلة للتخزين.
//
// التشغيل (على خادم يعمل بنفس القيمة):
//   SITE_PASSWORD=<قيمة اختبارية> npm run test:gate:e2e -- http://127.0.0.1:3000
//
// ⚠️ لا يحمل هذا الملف أي كلمة مرور: القيمة تُقرأ من البيئة في زمن التشغيل.
// ============================================================

import { join } from "node:path";
import { ROOT, colors, importModule, cleanBundles } from "./lib/bundle.mjs";

const BASE = (process.argv[2] ?? process.env.GATE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const SECRET = process.env.SITE_PASSWORD ?? "";

if (SECRET.length === 0) {
  console.error(
    colors.red("✕ مرّر قيمة اختبارية في SITE_PASSWORD (نفس القيمة التي يعمل بها الخادم)."),
  );
  process.exit(2);
}

let passed = 0;
const failures = [];

function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) passed += 1;
  else failures.push(`${name}\n    المتوقع: ${e}\n    الفعلي : ${a}`);
}

function checkTrue(name, condition) {
  check(name, Boolean(condition), true);
}

function section(title) {
  console.log(colors.dim(`\n— ${title} —`));
}

const token = await importModule(join(ROOT, "src", "lib", "gate", "token.ts"), [
  "createGateCookieValue",
]);

const COOKIE_NAME = "site_access";
const cookieHeader = (value) => ({ Cookie: `${COOKIE_NAME}=${value}` });

/** طلب لا يتبع التحويلات، لنرى 307 وLocation كما هي. */
async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    ...options,
    headers: { ...(options.headers ?? {}) },
  });
  return response;
}

async function getHtml(path, options = {}) {
  const response = await request(path, { redirect: "follow", ...options });
  return { response, html: await response.text() };
}

const REDIRECT_STATUSES = [301, 302, 303, 307, 308];

// ============================================================
// 1) بلا كوكي: كل الصفحات المحمية محجوبة
// ============================================================
section("زائر بلا كوكي");

for (const path of ["/", "/algebra", "/geometry", "/lesson/geometry-u1-l1", "/lesson/algebra-u1-l1"]) {
  const response = await request(path);
  checkTrue(`محجوب: ${path} (تحويل)`, REDIRECT_STATUSES.includes(response.status));

  const location = response.headers.get("location") ?? "";
  checkTrue(`وجهة التحويل إلى صفحة الدخول: ${path}`, location.includes("/gate"));
  checkTrue(`مسار العودة محفوظ: ${path}`, location.includes("next="));
}

{
  const location = (await request("/algebra")).headers.get("location") ?? "";
  checkTrue("مسار العودة يحمل الصفحة المطلوبة", decodeURIComponent(location).includes("next=/algebra"));
}

// اتباع التحويل لا يعطي المحتوى المحمي.
{
  const { response, html } = await getHtml("/algebra");
  check("الحالة بعد اتباع التحويل", response.status, 200);
  checkTrue("المحتوى المحمي غير ظاهر قبل الدخول", !html.includes("وحدات") && !html.includes("الجبر — رياضيات الصف الثامن"));
}

// ============================================================
// 2) صفحة الدخول مفتوحة
// ============================================================
section("صفحة الدخول");

{
  const response = await request("/gate");
  check("صفحة الدخول متاحة بلا كوكي", response.status, 200);
  const html = await response.text();
  checkTrue("عنوان البوابة ظاهر", html.includes("هذا الموقع محمي"));
  checkTrue("التوجيه ظاهر", html.includes("أدخل كلمة المرور للمتابعة"));
  checkTrue("حقل كلمة المرور LTR", html.includes('dir="ltr"'));
  checkTrue("صفحة الدخول عربية RTL", html.includes('dir="rtl"'));
  checkTrue("كلمة المرور ليست في صفحة الدخول", !html.includes(SECRET));
}

// ============================================================
// 3) مسار الدخول: خاطئة، فارغة، صحيحة
// ============================================================
section("مسار الدخول /api/gate");

const post = (body) =>
  request("/api/gate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

{
  const response = await post({ password: `${SECRET}-wrong`, next: "/algebra" });
  check("كلمة المرور الخاطئة → 401", response.status, 401);
  const payload = await response.json();
  check("رمز الخطأ", payload.error, "invalid_password");
  check("لا كوكي عند الفشل", response.headers.getSetCookie().length, 0);
  checkTrue("الردّ لا يكشف القيمة الصحيحة", !JSON.stringify(payload).includes(SECRET));
}

{
  const response = await post({ password: "", next: "/algebra" });
  check("إدخال فارغ → 400", response.status, 400);
  check("لا كوكي عند الإدخال الفارغ", response.headers.getSetCookie().length, 0);
}

{
  const response = await post({ next: "/algebra" });
  check("طلب بلا حقل كلمة المرور → 400", response.status, 400);
  check("لا كوكي", response.headers.getSetCookie().length, 0);
}

{
  const response = await post({ password: SECRET, next: "//evil.example" });
  const payload = await response.json();
  check("مسار عودة خارجي يُعقَّم إلى /", payload.next, "/");
}

let cookieValue = "";
{
  const response = await post({ password: SECRET, next: "/geometry?from=gate" });
  check("كلمة المرور الصحيحة → 200", response.status, 200);

  const payload = await response.json();
  check("ok = true", payload.ok, true);
  check("مسار العودة محفوظ", payload.next, "/geometry?from=gate");

  const setCookie = response.headers.getSetCookie();
  check("كوكي واحد يُضبط", setCookie.length, 1);

  const raw = setCookie[0] ?? "";
  cookieValue = raw.split(";")[0].slice(`${COOKIE_NAME}=`.length);

  // 7) و 8) خصائص الكوكي
  checkTrue("الكوكي HttpOnly", /HttpOnly/i.test(raw));
  checkTrue("الكوكي SameSite=Lax", /SameSite=Lax/i.test(raw));
  checkTrue("الكوكي على المسار /", /Path=\//i.test(raw));
  checkTrue("الكوكي بصلاحية ٧ أيام", /Max-Age=604800/i.test(raw));

  const isProductionServer = process.env.GATE_EXPECT_SECURE !== "0";
  check(
    `Secure في الإنتاج (GATE_EXPECT_SECURE=${isProductionServer ? "1" : "0"})`,
    /;\s*Secure/i.test(raw),
    isProductionServer,
  );

  // 9) القيمة لا تحمل كلمة المرور
  checkTrue("الكوكي لا يحوي كلمة المرور", !raw.includes(SECRET));
  checkTrue("الكوكي لا يساوي كلمة المرور", cookieValue !== SECRET);
  checkTrue("قيمة الكوكي موقَّعة (تاريخ.توقيع)", /^\d+\.[A-Za-z0-9_-]{20,}$/.test(cookieValue));
}

// ============================================================
// 4) بالكوكي: الوصول والصمود عبر التنقّل
// ============================================================
section("الوصول بعد الدخول");

const authHeaders = cookieHeader(cookieValue);

{
  const response = await request("/", { headers: authHeaders });
  check("الصفحة الرئيسية متاحة", response.status, 200);
  const html = await response.text();
  checkTrue("محتوى الرئيسية ظاهر", html.includes("دروس"));
  checkTrue("كلمة المرور ليست في HTML", !html.includes(SECRET));
}

for (const path of ["/algebra", "/geometry"]) {
  const response = await request(path, { headers: authHeaders });
  check(`متاح: ${path}`, response.status, 200);
}

// 6) مسارات الدروس محمية ثم متاحة
{
  const response = await request("/lesson/geometry-u1-l1", { headers: authHeaders });
  check("درس محمي ثم متاح بالكوكي", response.status, 200);
  const html = await response.text();
  checkTrue("صفحة الدرس ليست صفحة الدخول", !html.includes("هذا الموقع محمي"));
}

// 5) الاستمرار عبر التنقّل: طلبات متتالية بنفس الكوكي
{
  const sequence = ["/", "/algebra", "/lesson/algebra-u1-l1", "/geometry", "/"];
  const statuses = [];
  for (const path of sequence) {
    statuses.push((await request(path, { headers: authHeaders })).status);
  }
  check("الوصول مستمرّ عبر التنقّل", statuses, [200, 200, 200, 200, 200]);
}

// ============================================================
// 5) كوكي مزوّر أو منتهٍ لا يمنح وصولًا
// ============================================================
section("كوكي مزوّر");

{
  const response = await request("/", { headers: cookieHeader(`${cookieValue}x`) });
  checkTrue("توقيع مُعدَّل → تحويل", REDIRECT_STATUSES.includes(response.status));
}

{
  const response = await request("/", { headers: cookieHeader("not-a-real-cookie") });
  checkTrue("كوكي مشوّه → تحويل", REDIRECT_STATUSES.includes(response.status));
}

{
  const foreign = await token.createGateCookieValue("a-completely-different-key", Date.now() + 86_400_000);
  const response = await request("/", { headers: cookieHeader(foreign) });
  checkTrue("كوكي موقَّع بمفتاح آخر → تحويل", REDIRECT_STATUSES.includes(response.status));
}

{
  const expired = await token.createGateCookieValue(SECRET, Date.now() - 1000);
  const response = await request("/", { headers: cookieHeader(expired) });
  checkTrue("كوكي منتهي الصلاحية → تحويل", REDIRECT_STATUSES.includes(response.status));
}

// ============================================================
// 10) و 11) المسارات المستثناة وحماية المعلم المستقلة
// ============================================================
section("المسارات المستثناة وحماية المعلم");

{
  // /api/health بلا كوكي — يجب أن يبقى صالحًا لفحوص النشر
  const response = await request("/api/health");
  check("api/health بلا كوكي → 200", response.status, 200);
  const payload = await response.json();
  check("api/health يعمل", payload.ok, true);
}

{
  // حماية المعلم مستقلة: بلا كلمة مرور معلم → لا بيانات
  const response = await request("/api/teacher-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessonId: "geometry-u1-l1", password: "definitely-wrong" }),
  });
  checkTrue("teacher-key لا يُفتح بكلمة خاطئة", response.status === 401 || response.status === 503);
}

{
  // الأهم: كلمة مرور الموقع نفسها لا تفتح مفتاح المعلم
  const response = await request("/api/teacher-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessonId: "geometry-u1-l1", password: SECRET }),
  });
  checkTrue(
    "كلمة مرور الموقع لا تفتح teacher-key",
    response.status === 401 || response.status === 503 || response.status === 404,
  );
  const text = await response.text();
  checkTrue("لا تُسرَّب إجابات المعلم", !text.includes('"answer"'));
}

{
  // أصول Next.js الثابتة لا تُحجب (ضرورية لرسم صفحة الدخول)
  const { html } = await getHtml("/gate");
  const asset = html.match(/\/_next\/static\/[^"'\s]+?\.(?:js|css)/);
  checkTrue("حزمة أصول موجودة في صفحة الدخول", Boolean(asset));
  if (asset) {
    const response = await request(asset[0]);
    check(`أصل ثابت متاح بلا كوكي: ${asset[0].slice(0, 48)}…`, response.status, 200);
    const body = await response.text();
    checkTrue("كلمة المرور ليست في حزمة المتصفح", !body.includes(SECRET));
    checkTrue("اسم متغيّر البوابة ليس في حزمة المتصفح", !body.includes("SITE_PASSWORD"));
  }
}

{
  // /api/gate نفسه مستثنى من البوابة (وإلا لتعذّر الدخول أصلًا)
  const response = await post({ password: "x", next: "/" });
  checkTrue("api/gate متاح بلا كوكي", response.status !== 307);
}

{
  // favicon/robots مستثناة من الحجب
  const response = await request("/favicon.ico");
  checkTrue("favicon غير محجوب (لا تحويل)", !REDIRECT_STATUSES.includes(response.status));
}

// ============================================================
// 12) نظافة التخزين للنشر خارج Vercel
// ============================================================
// البوابة تتحقّق على الخادم قبل الرد، لكنها لا تتحكّم في ترويسات
// التخزين. فإن كان أمام الخادم وسيط مشترك (CDN أو وسيط عكسي) يخزّن
// HTML، صار في الإمكان تقديم صفحة محمية لزائر بلا كوكي. لذلك:
//   • كل ردّ HTML وكل ردّ من /api/* يجب ألّا يكون قابلًا للتخزين المشترك.
//   • أصول /_next/static تبقى قابلة للتخزين (لا نُقايض الأداء).
// التفصيل في docs/deployment-node.md وفي next.config.ts.
section("تخزين الاستجابات (النشر خلف CDN)");

/** هل تسمح ترويسة التخزين لوسيط **مشترك** بتخزين الردّ؟ */
function sharedCacheable(cacheControl) {
  const value = (cacheControl ?? "").toLowerCase();
  if (value.includes("no-store")) return false;
  if (value.includes("private")) return false;
  return /\bs-maxage\b/.test(value) || value.includes("public");
}

{
  const response = await request("/", { headers: authHeaders });
  const cacheControl = response.headers.get("cache-control");
  checkTrue(
    `HTML محمي غير قابل للتخزين المشترك (Cache-Control: ${cacheControl})`,
    !sharedCacheable(cacheControl),
  );
}

{
  const response = await request("/lesson/algebra-u1-l1", { headers: authHeaders });
  const cacheControl = response.headers.get("cache-control");
  checkTrue(
    `صفحة درس محمية غير قابلة للتخزين المشترك (Cache-Control: ${cacheControl})`,
    !sharedCacheable(cacheControl),
  );
}

{
  // تحويل الزائر غير المسجَّل لا يُخزَّن كذلك — منع تسرّب صفحات الدخول المؤقتة.
  const response = await request("/algebra");
  const cacheControl = response.headers.get("cache-control");
  checkTrue(
    `تحويل الزائر غير المسجَّل غير قابل للتخزين المشترك (Cache-Control: ${cacheControl})`,
    !sharedCacheable(cacheControl),
  );
}

{
  // الأصول الثابتة تبقى قابلة للتخزين: لا نُقايض الأداء.
  const { html } = await getHtml("/gate");
  const asset = html.match(/\/_next\/static\/[^"'\s]+?\.(?:js|css)/);
  if (asset) {
    const response = await request(asset[0]);
    const cacheControl = (response.headers.get("cache-control") ?? "").toLowerCase();
    checkTrue(
      `أصول Next.js تبقى قابلة للتخزين (Cache-Control: ${cacheControl})`,
      !cacheControl.includes("no-store"),
    );
  }
}

// ============================================================
// التقرير
// ============================================================
console.log("");
if (failures.length > 0) {
  for (const failure of failures) console.error(colors.red(`✕ ${failure}`));
  console.error(colors.red(`\nفشل اختبار البوابة الشامل: ${failures.length} من ${passed + failures.length}.`));
  cleanBundles();
  process.exit(1);
}
console.log(colors.green(`نجح اختبار البوابة الشامل على ${BASE}: ${passed} تحقّقًا.`));
cleanBundles();
