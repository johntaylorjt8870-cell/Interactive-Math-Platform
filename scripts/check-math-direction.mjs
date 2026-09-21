// ============================================================
// فحص الاتجاه والمبادئ المعمارية — Direction & platform checks
// ============================================================
// بوابة سريعة (بلا بناء) تتحقق من القواعد الصارمة:
//
//   1) لا iframe لأي درس (يمنع الخطوات والتقدّم والاتجاه).
//   2) CSS يعزل الاتجاه بـ isolate (لا embed) للرياضيات واللاتينية.
//   3) لا كسور مسطّحة في المحتوى ("1/2") — الكسر \frac أو <Frac>.
//   4) لا كلمات مرور مكتوبة في الكود.
//   5) ملفات مفاتيح المعلم خادمية فقط (server-only).
//   6) لا Math.random في مكوّنات العرض (ترتيب غير ثابت = أخطاء ترطيب).
//   7) كل درس منفَّذ له سجل تغطية coverage.json.
// ============================================================

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT, colors } from "./lib/bundle.mjs";

const failures = [];
const notes = [];
let checks = 0;

function ok(condition, message) {
  checks += 1;
  if (condition) {
    console.log(`${colors.green("✓")} ${message}`);
  } else {
    failures.push(message);
    console.log(`${colors.red("✕")} ${message}`);
  }
}

/** كل ملفات src بامتدادات محدّدة. */
function walk(dir, extensions, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, extensions, acc);
    else if (extensions.some((ext) => entry.endsWith(ext))) acc.push(full);
  }
  return acc;
}

const srcDir = join(ROOT, "src");
const sourceFiles = walk(srcDir, [".ts", ".tsx", ".css"]);
const read = (file) => readFileSync(file, "utf8");
const rel = (file) => relative(ROOT, file);

console.log(colors.dim("— فحص بنية المنصة والاتجاه —\n"));

// ------------------------------------------------------------
// 1) لا iframe للدروس
// ------------------------------------------------------------
const iframeOffenders = sourceFiles.filter(
  (file) => /<iframe|sandbox=|allow-scripts|contentPath/.test(read(file)),
);
ok(
  iframeOffenders.length === 0,
  `لا يوجد iframe لأي درس${iframeOffenders.length ? ` (وجد في: ${iframeOffenders.map(rel).join(", ")})` : ""}`,
);

// ------------------------------------------------------------
// 2) عزل الاتجاه في CSS
// ------------------------------------------------------------
const css = read(join(srcDir, "app", "globals.css"));
ok(/unicode-bidi:\s*isolate/.test(css), "CSS يعزل الاتجاه بـ unicode-bidi: isolate");
ok(!/unicode-bidi:\s*embed/.test(css), "CSS لا يستخدم unicode-bidi: embed (أضعف من isolate)");
ok(
  /\[dir="ltr"\][\s\S]{0,160}direction:\s*ltr/.test(css),
  "CSS يفرض direction: ltr على عناصر [dir=ltr]",
);
ok(/\.m-frac-bar/.test(css), "CSS يعرّف خط الكسر المكدّس (.m-frac-bar)");
ok(
  /\.m-frac\s*\{[\s\S]*?flex-direction:\s*column/.test(css),
  "الكسر المكدّس مبني على flex-direction: column (بسط فوق مقام فعليًا)",
);

// ------------------------------------------------------------
// 3) لا كسور مسطّحة في المحتوى
// ------------------------------------------------------------
const contentFiles = [
  ...walk(join(srcDir, "lessons"), [".ts", ".tsx"]),
  ...walk(join(srcDir, "content"), [".ts", ".tsx"]),
  ...walk(join(srcDir, "dev"), [".ts", ".tsx"]),
];
const flatFractionPattern = /["'`][^"'`]*\d\s*\/\s*\d[^"'`]*["'`]/;
/** يحذف التعليقات السطرية والكتلية قبل الفحص (وإلا رصد التعليقات نفسها). */
const stripComments = (text) =>
  text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const flatFractions = contentFiles.filter((file) => {
  const text = stripComments(read(file));
  return text.split("\n").some((line) => flatFractionPattern.test(line));
});
ok(
  flatFractions.length === 0,
  `لا كسور مسطّحة في المحتوى${flatFractions.length ? ` (وجد في: ${flatFractions.map(rel).join(", ")})` : ""}`,
);

// ------------------------------------------------------------
// 4) لا كلمات مرور في الكود
// ------------------------------------------------------------
const passwordOffenders = sourceFiles.filter((file) =>
  /(password|passcode|secret)\s*[:=]\s*["'`][^"'`]{3,}["'`]/i.test(read(file)),
);
ok(
  passwordOffenders.length === 0,
  `لا كلمات مرور مكتوبة في الكود${passwordOffenders.length ? ` (وجد في: ${passwordOffenders.map(rel).join(", ")})` : ""}`,
);

// ------------------------------------------------------------
// 5) مفاتيح المعلم خادمية فقط
// ------------------------------------------------------------
const teacherFiles = walk(join(srcDir, "content", "teacher"), [".ts", ".tsx"]);
ok(teacherFiles.length > 0, "مجلد مفاتيح المعلم موجود");
const teacherNotServerOnly = teacherFiles.filter((file) => !/"server-only"/.test(read(file)));
ok(
  teacherNotServerOnly.length === 0,
  `كل ملفات مفاتيح المعلم تستورد "server-only"${
    teacherNotServerOnly.length ? ` (ناقص في: ${teacherNotServerOnly.map(rel).join(", ")})` : ""
  }`,
);

// ------------------------------------------------------------
// 6) لا Math.random في العرض
// ------------------------------------------------------------
const randomOffenders = sourceFiles.filter(
  (file) => /Math\.random\(/.test(read(file)) && !rel(file).startsWith("scripts/"),
);
ok(
  randomOffenders.length === 0,
  `لا Math.random في مكوّنات العرض (ترتيب ثابت)${randomOffenders.length ? ` (وجد في: ${randomOffenders.map(rel).join(", ")})` : ""}`,
);

// ------------------------------------------------------------
// 7) سجل التغطية لكل درس منفَّذ
// ------------------------------------------------------------
const registry = read(join(srcDir, "lessons", "registry.ts"));
const implemented = [...registry.matchAll(/^\s*"([^"]+)":\s*\(\)\s*=>/gm)].map((m) => m[1]);
const missingCoverage = implemented.filter(
  (id) => !existsSync(join(srcDir, "lessons", id, "coverage.json")),
);
ok(
  missingCoverage.length === 0,
  `كل درس منفَّذ له coverage.json${missingCoverage.length ? ` (ناقص: ${missingCoverage.join(", ")})` : ""}`,
);

if (implemented.length === 0) {
  notes.push("السجل فارغ عمدًا في هذه المرحلة: لا يوجد درس منهجي بعد.");
}

// ------------------------------------------------------------
// التقرير
// ------------------------------------------------------------
console.log("");
for (const note of notes) console.log(colors.yellow(`• ${note}`));

if (failures.length > 0) {
  console.error(colors.red(`\nفشل الفحص: ${failures.length} من ${checks} تحقّقًا.`));
  process.exit(1);
}
console.log(colors.green(`\nنجح فحص الاتجاه والبنية: ${checks} تحقّقًا.`));
