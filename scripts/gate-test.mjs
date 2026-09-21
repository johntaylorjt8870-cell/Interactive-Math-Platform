// ============================================================
// اختبارات بوابة الموقع — Site gate tests
// ============================================================
// تثبت أن البوابة تعمل فعلًا، لا أنها مكتوبة فقط:
//   1) توقيع الكوكي: صحة الاشتقاق، ورفض التزوير والانتهاء.
//   2) كلمة المرور: الصحيحة تُقبل، والخاطئة تُرفض — بزمن ثابت.
//   3) خصائص الكوكي: HttpOnly و SameSite و Secure ومدّة الصلاحية.
//   4) وضع البوابة عند غياب كلمة المرور (إنتاج مقفل / تطوير متجاوَز).
//   5) تعقيم مسار العودة (منع إعادة التوجيه المفتوح).
//   6) matcher: أي مسار محمي وأي مسار مستثنى — بلا خادم.
//   7) الأسرار: لا كلمة مرور في الكود، ولا تسريب إلى حزمة المتصفح.
//   8) فصل الحمايتين: بوابة الموقع ≠ مفاتيح المعلم.
//
// ⚠️ هذا الملف لا يحمل أي كلمة مرور حقيقية. القيمة الوحيدة المستخدمة
//    هنا قيمة اختبارية تُولَّد في زمن التشغيل؛ وإن مُرِّر SITE_PASSWORD
//    للعملية تُستخدم قيمتها كـ«دليل» (canary) للبحث عنه في المصادر
//    وفي حزمة المتصفح — وهو ما يجعل الاختبار صالحًا لأي كلمة مرور.
//
// التشغيل: npm run test:gate
// ============================================================

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT, colors, importModule, cleanBundles } from "./lib/bundle.mjs";

let passed = 0;
const failures = [];

function check(name, actual, expected) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson === expectedJson) {
    passed += 1;
  } else {
    failures.push(`${name}\n    المتوقع: ${expectedJson}\n    الفعلي : ${actualJson}`);
  }
}

function checkTrue(name, condition) {
  check(name, Boolean(condition), true);
}

function section(title) {
  console.log(colors.dim(`\n— ${title} —`));
}

// ------------------------------------------------------------
// أدوات: قراءة الملفات
// ------------------------------------------------------------
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "scripts"]);

function walk(dir, extensions, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, extensions, acc);
    else if (extensions.some((ext) => entry.endsWith(ext))) acc.push(full);
  }
  return acc;
}

const read = (file) => readFileSync(file, "utf8");
const rel = (file) => relative(ROOT, file);
const srcDir = join(ROOT, "src");
const srcFiles = walk(srcDir, [".ts", ".tsx", ".css"]);

// قيمة اختبارية لتشغيل الاختبار بلا أي سرّ حقيقي.
// تُستخدم كـ«دليل» يُبحث عنه في المصادر وحزمة المتصفح عندما لا يُمرَّر
// SITE_PASSWORD للعملية — فيبقى الفحص عاملًا في CI بلا أي سرّ.
const CANARY = "gate-test-canary-value";

/** هذا الملف نفسه يحمل قيمة الدليل، فلا يُفحَص ضدّها. */
const SELF_PATH = join(ROOT, "scripts", "gate-test.mjs");

/** يحذف التعليقات — لفحص الكود الفعلي لا التعليقات التي تصفه. */
const stripComments = (text) =>
  text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

// ============================================================
// 1) توقيع الكوكي
// ============================================================
const token = await importModule(join(srcDir, "lib", "gate", "token.ts"), [
  "createGateCookieValue",
  "verifyGateCookieValue",
  "deriveGateSignature",
  "isCorrectSitePassword",
  "constantTimeStringEqual",
  "gateTokenMessage",
]);

section("توقيع كوكي البوابة");

const NOW = Date.UTC(2026, 0, 1);
const EXPIRY = NOW + 7 * 24 * 60 * 60 * 1000;
const SECRET = "correct-horse-battery-staple";
const value = await token.createGateCookieValue(SECRET, EXPIRY);

checkTrue("كوكي صالح يُقبل", await token.verifyGateCookieValue({ secret: SECRET, value, now: NOW }));
checkTrue(
  "كوكي صادر عن سرّ آخر يُرفض",
  !(await token.verifyGateCookieValue({ secret: "another-secret", value, now: NOW })),
);
checkTrue(
  "كوكي منتهي الصلاحية يُرفض",
  !(await token.verifyGateCookieValue({ secret: SECRET, value, now: EXPIRY + 1 })),
);
checkTrue(
  "الصلاحية تُقبل قبل لحظة الانتهاء بجزء من الثانية",
  await token.verifyGateCookieValue({ secret: SECRET, value, now: EXPIRY - 1 }),
);

// تزوير: تمديد التاريخ بلا إعادة توقيع.
{
  const [rawExpiry, signature] = value.split(".");
  const forged = `${Number(rawExpiry) + 86_400_000}.${signature}`;
  checkTrue(
    "تمديد الصلاحية بلا إعادة توقيع يُرفض",
    !(await token.verifyGateCookieValue({ secret: SECRET, value: forged, now: NOW })),
  );
}

// تزوير: تغيير توقيع.
checkTrue(
  "توقيع مُعدَّل يُرفض",
  !(await token.verifyGateCookieValue({ secret: SECRET, value: `${EXPIRY}.AAAA`, now: NOW })),
);

for (const malformed of ["", ".", "abc", "123", "notanumber.signature", "123.", ".signature", "1e9.sig"]) {
  checkTrue(
    `قيمة مشوّهة تُرفض (${JSON.stringify(malformed)})`,
    !(await token.verifyGateCookieValue({ secret: SECRET, value: malformed, now: NOW })),
  );
}

// ------------------------------------------
// الكوكي لا يحمل كلمة المرور أبدًا
// ------------------------------------------
checkTrue("الكوكي لا يحوي كلمة المرور", !value.includes(SECRET));
checkTrue("الكوكي لا يساوي كلمة المرور", value !== SECRET);
check(
  "صيغة الكوكي: تاريخ + توقيع",
  value.split(".").length,
  2,
);
check(
  "الكوكي مجرّد من الفراغات والمحارف الخاصة",
  /^\d+\.[A-Za-z0-9_-]+$/.test(value),
  true,
);

// ------------------------------------------
// مقارنة كلمة المرور (بزمن ثابت)
// ------------------------------------------
checkTrue(
  "كلمة المرور الصحيحة تُقبل",
  await token.isCorrectSitePassword({ secret: SECRET, submitted: SECRET, expiresAt: EXPIRY }),
);
checkTrue(
  "كلمة المرور الخاطئة تُرفض",
  !(await token.isCorrectSitePassword({ secret: SECRET, submitted: `${SECRET}x`, expiresAt: EXPIRY })),
);
checkTrue(
  "كلمة المرور الخاطئة بالحرف الكبير/الصغير تُرفض",
  !(await token.isCorrectSitePassword({ secret: SECRET, submitted: SECRET.toUpperCase(), expiresAt: EXPIRY })),
);
checkTrue(
  "الإدخال الفارغ يُرفض",
  !(await token.isCorrectSitePassword({ secret: SECRET, submitted: "", expiresAt: EXPIRY })),
);
checkTrue(
  "السرّ الفارغ لا يقبل شيئًا",
  !(await token.isCorrectSitePassword({ secret: "", submitted: "", expiresAt: EXPIRY })),
);
checkTrue(
  "البادئة الصحيحة وحدها لا تكفي",
  !(await token.isCorrectSitePassword({ secret: SECRET, submitted: SECRET.slice(0, 4), expiresAt: EXPIRY })),
);

// مقارنة بزمن ثابت: النتيجة صحيحة، ولا تعتمد على موضع أول اختلاف.
check("مقارنة بزمن ثابت: متطابقتان", token.constantTimeStringEqual("abcdef", "abcdef"), true);
check("مقارنة بزمن ثابت: مختلفتان بنفس الطول", token.constantTimeStringEqual("abcdef", "abcdeX"), false);
check("مقارنة بزمن ثابت: مختلفتان في أول محرف", token.constantTimeStringEqual("abcdef", "Xbcdef"), false);
check("مقارنة بزمن ثابت: أطوال مختلفة", token.constantTimeStringEqual("abc", "abcd"), false);
check("مقارنة بزمن ثابت: فارغتان", token.constantTimeStringEqual("", ""), true);

// التوقيع نفسه يتغيّر بتغيّر السرّ (إثبات أن الاشتقاق حقيقي).
checkTrue(
  "الاشتقاق يختلف باختلاف السرّ",
  (await token.deriveGateSignature(SECRET, EXPIRY)) !== (await token.deriveGateSignature("other", EXPIRY)),
);
checkTrue(
  "الاشتقاق يختلف باختلاف لحظة الانتهاء",
  (await token.deriveGateSignature(SECRET, EXPIRY)) !==
    (await token.deriveGateSignature(SECRET, EXPIRY + 1000)),
);
checkTrue("الرسالة الموقَّعة تحمل الإصدار", token.gateTokenMessage(EXPIRY).startsWith("v1:"));

// ============================================================
// 2) السياسة: الكوكي، الأوضاع، مسار العودة
// ============================================================
const config = await importModule(join(srcDir, "lib", "gate", "config.ts"), [
  "GATE_COOKIE_NAME",
  "GATE_COOKIE_MAX_AGE_SECONDS",
  "GATE_LOGIN_PATH",
  "GATE_NOT_CONFIGURED_PATH",
  "GATE_MATCHER",
  "GATE_ENV_VAR",
  "getGateMode",
  "gateCookieOptions",
  "readSitePassword",
  "safeNextPath",
]);

section("خصائص كوكي البوابة");

const prodCookie = config.gateCookieOptions(true);
const devCookie = config.gateCookieOptions(false);

check("HttpOnly مفعّل", prodCookie.httpOnly, true);
check("SameSite = lax", prodCookie.sameSite, "lax");
check("Secure في الإنتاج", prodCookie.secure, true);
check("بلا Secure في التطوير (حتى لا ينكسر التطوير على http)", devCookie.secure, false);
check("مدّة الصلاحية ٧ أيام", prodCookie.maxAge, 7 * 24 * 60 * 60);
check("مدّة الصلاحية بالثواني", config.GATE_COOKIE_MAX_AGE_SECONDS, 604800);
check("المسار /", prodCookie.path, "/");
check("اسم الكوكي ثابت", config.GATE_COOKIE_NAME, "site_access");

section("وضع البوابة عند غياب كلمة المرور");

check(
  "إنتاج بلا كلمة مرور → مقفل (503)",
  config.getGateMode({ isProduction: true, sitePassword: "" }),
  "blocked-misconfigured",
);
check(
  "تطوير بلا كلمة مرور → متجاوَز",
  config.getGateMode({ isProduction: false, sitePassword: "" }),
  "bypassed-in-development",
);
check(
  "إنتاج مع كلمة مرور → مفعّل",
  config.getGateMode({ isProduction: true, sitePassword: "x" }),
  "enabled",
);
check(
  "تطوير مع كلمة مرور → مفعّل",
  config.getGateMode({ isProduction: false, sitePassword: "x" }),
  "enabled",
);

section("تعقيم مسار العودة (?next=)");

for (const [input, expected] of [
  ["/algebra", "/algebra"],
  ["/geometry", "/geometry"],
  ["/lesson/algebra-u1-l1", "/lesson/algebra-u1-l1"],
  ["/lesson/algebra-u1-l1?step=2", "/lesson/algebra-u1-l1?step=2"],
  ["  /algebra  ", "/algebra"],
]) {
  check(`مسار داخلي يُقبل: ${JSON.stringify(input)}`, config.safeNextPath(input), expected);
}

for (const hostile of [
  "//evil.example",
  "///evil.example",
  "https://evil.example",
  "http://evil.example",
  "javascript:alert(1)",
  "/\\evil.example",
  "\\\\evil.example",
  "algebra",
  "",
  null,
  undefined,
  "//evil.example/algebra",
  "/algebra\nHost: evil",
  "/algebra\r\nSet-Cookie: x=1",
]) {
  check(`محاولة إعادة توجيه مفتوح تُرفض: ${JSON.stringify(hostile)}`, config.safeNextPath(hostile), "/");
}

check("لا حلقة على صفحة الدخول", config.safeNextPath("/gate"), "/");
check("لا حلقة على صفحة الدخول (?next)", config.safeNextPath("/gate?next=/algebra"), "/");
check("لا حلقة على صفحة الدخول (مسار فرعي)", config.safeNextPath("/gate/not-configured"), "/");

// ============================================================
// 3) matcher: ما هو محمي وما هو مستثنى — بلا تشغيل خادم
// ============================================================
section("نطاق الحماية (matcher)");

const matcherPatterns = config.GATE_MATCHER.map((pattern) => new RegExp(`^${pattern}$`));
const isProtected = (pathname) => matcherPatterns.some((pattern) => pattern.test(pathname));

for (const protectedPath of [
  "/",
  "/algebra",
  "/geometry",
  "/lesson/algebra-u1-l1",
  "/lesson/geometry-u2-l3",
  "/lesson/nonexistent-id",
  "/dev/lesson-shell",
]) {
  checkTrue(`محمي: ${protectedPath}`, isProtected(protectedPath));
}

for (const openPath of [
  "/gate",
  "/gate/",
  "/gate/not-configured",
  "/api/gate",
  "/api/health",
  "/api/grade",
  "/api/teacher-key",
  "/_next/static/chunks/main-app.js",
  "/_next/image",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/icon.png",
  "/fonts/cairo.woff2",
]) {
  checkTrue(`مستثنى: ${openPath}`, !isProtected(openPath));
}

// ضمانة إضافية: مسار يبدأ بـ gate لكنه ليس صفحة الدخول يبقى محميًا.
checkTrue("مسار يبدأ بـ gate لكنه ليس صفحة الدخول يبقى محميًا", isProtected("/gateway"));

// ============================================================
// 4) الخطافات نفسها موجودة ومربوطة
// ============================================================
section("بنية الاصطلاح الجديد (proxy)");

const proxySourceText = read(join(srcDir, "proxy.ts"));

checkTrue("src/proxy.ts موجود", existsSync(join(srcDir, "proxy.ts")));
checkTrue("middleware.ts غير موجود في الجذر", !existsSync(join(ROOT, "middleware.ts")));
checkTrue("src/middleware.ts غير موجود", !existsSync(join(srcDir, "middleware.ts")));

// Next يشترط matcher حرفيًا ساكنًا، فالنسخة المعيارية في config.ts
// والنصّ المُضمَّن في proxy.ts يجب أن يتطابقا تمامًا.
{
  const embedded = proxySourceText.match(/matcher:\s*(\[[\s\S]*?\])/);
  checkTrue("proxy يُصرّح عن matcher حرفيًا", Boolean(embedded));

  let parsed = null;
  try {
    // المصفوفة في TS قد تحمل فاصلة أخيرة — غير مقبولة في JSON.
    parsed = JSON.parse(embedded[1].replace(/,\s*\]$/, "]"));
  } catch {
    parsed = "غير قابل للتحليل";
  }

  check("matcher المُضمَّن يطابق النسخة المعيارية في config.ts", parsed, config.GATE_MATCHER);
}

// ============================================================
// 5) الأسرار: لا كلمة مرور في الكود ولا في حزمة المتصفح
// ============================================================
section("نظافة الأسرار");

const runtimeSecret = process.env.SITE_PASSWORD ?? CANARY;

// 5.1 لا شيء في المصادر يحمل القيمة (أي قيمة تُضبط في البيئة).
const sourceLeaks = srcFiles.filter((file) => read(file).includes(runtimeSecret));
check("لا قيمة لكلمة المرور في أي ملف src", sourceLeaks.map(rel), []);

const committedFiles = [
  join(ROOT, ".env.example"),
  join(ROOT, "package.json"),
  join(ROOT, "README.md"),
  ...walk(join(ROOT, "docs"), [".md"]),
  ...walk(join(ROOT, "scripts"), [".mjs", ".tsx"]),
].filter((file) => file !== SELF_PATH);
const committedLeaks = committedFiles.filter(
  (file) => existsSync(file) && read(file).includes(runtimeSecret),
);
check("لا قيمة لكلمة المرور في ملفات المستودع", committedLeaks.map(rel), []);

// 5.2 لا متغيّر عام (NEXT_PUBLIC_*) للبوابة.
const publicEnvOffenders = srcFiles.filter((file) => /NEXT_PUBLIC_[A-Z_]*SITE_PASSWORD/.test(read(file)));
check("لا متغيّر بيئة عام (NEXT_PUBLIC) لكلمة مرور الموقع في src", publicEnvOffenders.map(rel), []);

// 5.3 ملفات «use client» لا تستورد وحدة السياسة أو التوقيع إطلاقًا.
//     هذه هي الضمانة البنيوية أن السرّ لا يدخل حزمة المتصفح.
const clientFiles = srcFiles.filter((file) => /^\s*["']use client["']/m.test(read(file)));
checkTrue("يوجد مكوّنات عميل في المشروع", clientFiles.length > 0);
const clientGateImports = clientFiles.filter((file) => /@\/lib\/gate|lib\/gate\//.test(read(file)));
check("لا مكوّن عميل يستورد منطق البوابة", clientGateImports.map(rel), []);

// 5.4 وحدتا البوابة خادميتان بالتعريف (لا use client).
checkTrue("config.ts ليست مكوّن عميل", !/["']use client["']/.test(read(join(srcDir, "lib", "gate", "config.ts"))));
checkTrue("token.ts ليست مكوّن عميل", !/["']use client["']/.test(read(join(srcDir, "lib", "gate", "token.ts"))));
checkTrue("proxy.ts ليست مكوّن عميل", !/["']use client["']/.test(read(join(srcDir, "proxy.ts"))));

// 5.5 قاعدة «لا كلمات مرور في الكود» نفسها (نسخة مطابقة لقاعدة تدقيق الاتجاه).
const hardcodedRule = /(password|passcode|secret)\s*[:=]\s*["'`][^"'`]{3,}["'`]/i;
const hardcodedOffenders = srcFiles.filter((file) => hardcodedRule.test(read(file)));
check("لا كلمات مرور مكتوبة في الكود (قاعدة التدقيق)", hardcodedOffenders.map(rel), []);

// 5.6 حزمة المتصفح بعد البناء — إن وُجدت.
const staticDir = join(ROOT, ".next", "static");
if (existsSync(staticDir)) {
  const bundleFiles = walk(staticDir, [".js", ".css", ".txt", ".json", ".map"]);
  const bundleLeaks = bundleFiles.filter((file) => read(file).includes(runtimeSecret));
  check("قيمة كلمة المرور ليست في حزمة المتصفح", bundleLeaks.map(rel), []);
  const teacherLeaks = bundleFiles.filter((file) => read(file).includes("TEACHER_KEY_PASSWORD"));
  check("اسم متغيّر مفتاح المعلم ليس في حزمة المتصفح", teacherLeaks.map(rel), []);
} else {
  console.log(colors.dim("  (تخطّي فحص حزمة المتصفح: لا يوجد بناء .next/static)"));
}

// ============================================================
// 6) فصل الحمايتين: بوابة الموقع ≠ مفاتيح المعلم
// ============================================================
section("فصل حماية الموقع عن حماية المعلم");

const teacherRoute = read(join(srcDir, "app", "api", "teacher-key", "route.ts"));
const teacherRouteCode = stripComments(teacherRoute);
checkTrue("مسار المعلم ما زال يقرأ TEACHER_KEY_PASSWORD", teacherRouteCode.includes("process.env.TEACHER_KEY_PASSWORD"));
checkTrue("مسار المعلم لا يقرأ كلمة مرور الموقع", !teacherRouteCode.includes("SITE_PASSWORD"));
checkTrue("مسار المعلم لا يستورد منطق البوابة", !teacherRouteCode.includes("lib/gate"));

const proxyCode = stripComments(read(join(srcDir, "proxy.ts")));
checkTrue("proxy لا يقرأ TEACHER_KEY_PASSWORD", !proxyCode.includes("TEACHER_KEY_PASSWORD"));
checkTrue("proxy لا يستورد محتوى المعلم", !proxyCode.includes("content/teacher"));

const gateRouteCode = stripComments(read(join(srcDir, "app", "api", "gate", "route.ts")));
checkTrue("مسار البوابة لا يستورد محتوى المعلم", !gateRouteCode.includes("content/teacher"));
checkTrue("مسار البوابة لا يقرأ TEACHER_KEY_PASSWORD", !gateRouteCode.includes("TEACHER_KEY_PASSWORD"));

const healthCode = stripComments(read(join(srcDir, "app", "api", "health", "route.ts")));
checkTrue("مسار الصحة لم يُمسّ (لا يعرف البوابة)", !healthCode.includes("lib/gate"));

// ============================================================
// 7) صفحة الدخول: الوجود والنصوص العربية
// ============================================================
section("صفحة الدخول (عربية RTL)");

const gatePage = read(join(srcDir, "app", "gate", "page.tsx"));
const gateForm = read(join(srcDir, "components", "gate", "GateForm.tsx"));
const gateNotice = read(join(srcDir, "components", "gate", "GateNotice.tsx"));

checkTrue("صفحة الدخول موجودة", existsSync(join(srcDir, "app", "gate", "page.tsx")));
checkTrue("نموذج الدخول موجود", existsSync(join(srcDir, "components", "gate", "GateForm.tsx")));
checkTrue("صفحة خطأ الإعداد موجودة", existsSync(join(srcDir, "app", "gate", "not-configured", "page.tsx")));
checkTrue("العنوان «هذا الموقع محمي» موجود", gateForm.includes("هذا الموقع محمي"));
checkTrue("التوجيه «أدخل كلمة المرور للمتابعة» موجود", gateForm.includes("أدخل كلمة المرور للمتابعة"));
checkTrue("زر «دخول» موجود", gateForm.includes(">دخول<"));
checkTrue("رسالة كلمة المرور الخاطئة موجودة", gateForm.includes("كلمة المرور غير صحيحة"));
checkTrue("رسالة نقص الإعداد موجودة", gateNotice.includes("إعداد ناقص"));
checkTrue("صفحة الدخول غير قابلة للفهرسة", /index:\s*false/.test(gatePage));
checkTrue("نموذج الدخول مكوّن عميل", /^\s*["']use client["']/m.test(gateForm));

// ============================================================
// التقرير
// ============================================================
console.log("");
if (failures.length > 0) {
  for (const failure of failures) console.error(colors.red(`✕ ${failure}`));
  console.error(colors.red(`\nفشل اختبار البوابة: ${failures.length} من ${passed + failures.length}.`));
  cleanBundles();
  process.exit(1);
}
console.log(colors.green(`نجح اختبار البوابة: ${passed} تحقّقًا.`));
cleanBundles();
