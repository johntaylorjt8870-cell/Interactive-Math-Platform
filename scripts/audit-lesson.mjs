// ============================================================
// تدقيق الدرس — Lesson audit (CLI)
// ============================================================
// الاستخدام:
//   npm run audit:lesson -- algebra-u1-l1
//   npm run audit:lessons            (كل الدروس المنفَّذة)
//   npm run audit:fixture            (نموذج العرض التقني — للتحقق من خط التدقيق)
//
// ماذا يفحص؟ (بوابة الحدّ الأدنى)
//   أ) التغطية: كل وحدة مصدر في coverage.json نصّها الكامل موجود
//      في محتوى الدرس — لم يُحذف ولم يُختصر شيء من الكتاب.
//   ب) المصدر: كل مثال/شكل/حل يحمل provenance؛ والإضافي يحمل سببًا،
//      والكتابي يحمل مرجعًا (bookRef) — فلا يختلط الإضافي بالكتابي.
//   ج) الأعداد: أعداد الكسور/الأشكال/الأمثلة في المحتوى مطابقة
//      لما يعلنه سجل التغطية.
//   د) التعليل: كل خطوة حلّ لها `why` غير فارغ.
//   هـ) الرياضيات: لا كسور مسطّحة، ولا أوامر LaTeX مجهولة.
//   و) الأشكال: كل مرجع نقطة موجود، وviewBox صالح (متماسك هندسيًا).
//   ز) الهوية: معرّف الدرس يطابق المنهاج.
//   ح) العرض الفعلي: تُصيَّر كل خطوة بـ React وتُفحص:
//        • لا أوامر LaTeX خامّة ولا أوامر مجهولة في الصفحة.
//        • كل رياضيات داخل عزل LTR صريح (dir="ltr").
//        • الكسور مكدّسة فعلًا، ولا كسر مسطّح في النص المرئي.
//        • الأشكال SVG بـ viewBox، ونصوصها محدّدة الاتجاه.
//        • لا حلّ في DOM قبل تصرّف الطالب (ليس مخفيًا بـ CSS).
//        • لا إجابات من مجموعة المعلم في DOM الطالب.
//
// ⚠️ نجاح التدقيق لا يعني أن الشرح جيد تربويًا — الجودة تُراجع يدويًا
//    (انظر docs/math-lesson-standard.md).
// ============================================================

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, colors, importModule, cleanBundles } from "./lib/bundle.mjs";
import { evaluateLesson, evaluateRenderedSteps, walkContent } from "./lib/audit-core.mjs";
import { renderLesson, renderDevFixture } from "./lib/render.mjs";

let checks = 0;
const failures = [];
const warnings = [];

function ok(condition, message) {
  checks += 1;
  if (condition) {
    console.log(`${colors.green("✓")} ${message}`);
  } else {
    failures.push(message);
    console.log(`${colors.red("✕")} ${message}`);
  }
}

/** يطبع أخطاء قائمة ويحسبها. */
function report(result) {
  for (const failure of result.failures) {
    failures.push(failure);
    checks += 1;
    console.log(`${colors.red("✕")} ${failure}`);
  }
  for (const warning of result.warnings) warnings.push(warning);
  return result.failures.length === 0;
}

/**
 * بوابة العرض: تصيير كل خطوة بـ React ثم فحص DOM الناتج.
 * هذه البوابة تثبت ما لا تثبته قراءة الملفات.
 */
async function auditRenderedLesson({ lessonContent, render, teacherDataset = null }) {
  let rendered;
  try {
    ({ rendered } = await render());
  } catch (error) {
    failures.push(`فشل تصيير الدرس: ${error.message}`);
    checks += 1;
    console.log(`${colors.red("✕")} فشل تصيير الدرس: ${error.message}`);
    return;
  }

  const stats = walkContent(lessonContent);
  const result = evaluateRenderedSteps({
    lessonContent,
    rendered,
    hidden: stats.hidden,
    teacherDataset,
    fractionCount: stats.counts.fractions,
    figureCount: stats.counts.figures,
  });

  report(result);
  checks += 1;
  console.log(
    `${colors.green("✓")} صُيِّرت ${rendered.length} خطوة وفحص DOM الطالب ` +
      `(${stats.hidden.length} حقلًا محجوبًا، ${stats.counts.fractions} كسرًا، ${stats.counts.figures} شكلًا)`,
  );
}

/** يقرأ الدروس المنفَّذة من سجل الدروس. */
function implementedLessonIds() {
  const registry = readFileSync(join(ROOT, "src", "lessons", "registry.ts"), "utf8");
  return [...registry.matchAll(/^\s*"([^"]+)":\s*\(\)\s*=>/gm)].map((match) => match[1]);
}

async function auditLesson(lessonId) {
  console.log(colors.dim(`\n— تدقيق الدرس: ${lessonId} —\n`));

  const contentPath = join(ROOT, "src", "lessons", lessonId, "content.ts");
  const coveragePath = join(ROOT, "src", "lessons", lessonId, "coverage.json");

  ok(existsSync(contentPath), `محتوى الدرس موجود (${lessonId}/content.ts)`);
  ok(existsSync(coveragePath), `سجل التغطية موجود (${lessonId}/coverage.json)`);
  if (!existsSync(contentPath) || !existsSync(coveragePath)) return;

  const contentModule = await importModule(contentPath, []);
  const lessonContent = contentModule.default;
  const coverage = JSON.parse(readFileSync(coveragePath, "utf8"));

  const curriculumModule = await importModule(join(ROOT, "src", "data", "curriculum.ts"), [
    "getLessonById",
  ]);
  const curriculumEntry = curriculumModule.getLessonById(lessonId);

  const parseModule = await importModule(join(ROOT, "src", "components", "math", "parse.ts"), [
    "KNOWN_COMMANDS",
    "collectCommands",
  ]);

  const result = evaluateLesson({
    lessonContent,
    coverage,
    curriculumEntry,
    math: {
      knownCommands: parseModule.KNOWN_COMMANDS,
      collectCommands: parseModule.collectCommands,
    },
  });
  for (const failure of result.failures) {
    failures.push(failure);
    checks += 1;
    console.log(`${colors.red("✕")} ${failure}`);
  }
  for (const warning of result.warnings) {
    warnings.push(`${lessonId}: ${warning}`);
  }
  checks += 1;
  console.log(`${colors.green("✓")} فُحصت ${result.stats.steps} خطوة و ${result.stats.checks} تفاعلًا`);

  console.log(
    colors.dim(
      `  الأعداد: كتاب ${result.stats.bookExamples} · إضافي ${result.stats.extraExamples} · ` +
        `أخطاء شائعة ${result.stats.misconceptions} · حلول موجّهة ${result.stats.guidedSolutions} · ` +
        `أشكال ${result.stats.figures} · كسور ${result.stats.fractions}`,
    ),
  );

  await auditRenderedLesson({
    lessonContent,
    render: () => renderLesson(lessonId),
    teacherDataset: await loadTeacherDataset(lessonId),
  });
}

/** يحمّل إجابات المعلم إن وُجدت (لمقارنة DOM الطالب بها). */
async function loadTeacherDataset(lessonId) {
  const teacherPath = join(ROOT, "src", "content", "teacher", `${lessonId}.ts`);
  if (!existsSync(teacherPath)) return null;
  try {
    const mod = await importModule(teacherPath, []);
    return mod.default ?? null;
  } catch (error) {
    warnings.push(`${lessonId}: تعذّر تحميل مجموعة المعلم (${error.message})`);
    return null;
  }
}

/**
 * تدقيق نموذج العرض التقني: ليس درسًا منهجيًا، بل نموذج مليء
 * بكل أنواع الخطوات والكتل والتفاعلات. الغرض منه إثبات أن خط
 * التدقيق نفسه يعمل (تصيير + قواعد) قبل وصول أول درس حقيقي.
 */
async function auditFixture() {
  console.log(colors.dim("\n— تدقيق نموذج العرض التقني (ليس محتوى منهجيًا) —\n"));

  const contentModule = await importModule(join(ROOT, "src", "dev", "lesson-fixture.ts"), [
    "devFixtureContent",
  ]);
  const lessonContent = contentModule.devFixtureContent;
  const stats = walkContent(lessonContent);

  // سجل تغطية مشتق داخل الذاكرة: نتحقق من قواعد المصدر والتعليل
  // والأشكال على النموذج، دون الحاجة إلى سجلّ مصدر حقيقي.
  const coverage = {
    lessonId: lessonContent.lessonId,
    textbook: lessonContent.textbook,
    units: [
      {
        ref: "①",
        bookRef: "—",
        title: "نص من النموذج",
        body: "هذه صفحة عرض للبنية فقط: خطوات، شريط جانبي، رياضيات، أشكال، وتفاعلات.",
      },
    ],
    counts: stats.counts,
  };

  const curriculumEntry = { lesson: { id: lessonContent.lessonId } };
  const parseModule = await importModule(join(ROOT, "src", "components", "math", "parse.ts"), [
    "KNOWN_COMMANDS",
    "collectCommands",
  ]);

  report(
    evaluateLesson({
      lessonContent,
      coverage,
      curriculumEntry: lessonContent.lessonId === "dev-fixture" ? curriculumEntry : undefined,
      math: {
        knownCommands: parseModule.KNOWN_COMMANDS,
        collectCommands: parseModule.collectCommands,
      },
    }),
  );

  await auditRenderedLesson({ lessonContent, render: renderDevFixture });
}

async function main() {
  const argument = process.argv[2];
  if (!argument) {
    console.error(
      "الاستخدام: node scripts/audit-lesson.mjs <lesson-id> | --all | --fixture",
    );
    process.exit(2);
  }

  if (argument === "--fixture") {
    await auditFixture();
    finish(1);
    return;
  }

  const ids = argument === "--all" ? implementedLessonIds() : [argument];

  if (ids.length === 0) {
    console.log(
      colors.yellow(
        "لا توجد دروس منفَّذة بعد — السجل فارغ عن قصد في المرحلة الأولى (لا محتوى منهجي حتى الآن).",
      ),
    );
    console.log(
      colors.dim(
        "  نُشغّل تدقيق نموذج العرض التقني للتأكد من أن خط التدقيق (تصيير + قواعد) يعمل فعلًا.",
      ),
    );
    await auditFixture();
    finish(0);
    return;
  }

  for (const id of ids) await auditLesson(id);
  finish(ids.length);
}

/** طباعة الخلاصة والخروج بالرمز المناسب. */
function finish(lessonCount) {
  console.log("");
  for (const warning of warnings) console.log(colors.yellow(`• ${warning}`));

  if (failures.length > 0) {
    console.error(colors.red(`\nفشل التدقيق: ${failures.length} خطأ من ${checks} تحقّقًا.`));
    process.exit(1);
  }
  console.log(colors.green(`\nنجح تدقيق الدروس: ${checks} تحقّقًا عبر ${lessonCount} درسًا.`));
}

try {
  await main();
} finally {
  cleanBundles();
}
