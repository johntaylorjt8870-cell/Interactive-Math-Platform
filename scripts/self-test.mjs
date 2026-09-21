// ============================================================
// اختبارات ذاتية — Platform self-tests
// ============================================================
// تثبت أن اللبنات تعمل فعلًا، لا أنها مكتوبة فقط:
//   1) محلّل الرياضيات: كسور، أسس، أقواس، أوامر مجهولة.
//   2) تطبيع الأجوبة: أرقام عربية-هندية، فاصلة عشرية، فراغات، رموز.
//   3) التصحيح على الخادم: صحيح/خطأ/بلا جواب + عدم كشف الإجابة.
//   4) الهندسة: علامة الزاوية القائمة، قوس الزاوية، شرطات التطابق،
//      قلب الإحداثيات مرّة واحدة.
//   5) قواعد التدقيق: تُثبت أنها *تكتشف* الخلل (درس مكسور يفشل),
//      لا أنها تطبع ✓ دائمًا.
//
// التشغيل: npm run self-test
// ============================================================

import { join } from "node:path";
import { ROOT, colors, importModule, cleanBundles } from "./lib/bundle.mjs";
import {
  evaluateLesson,
  evaluateRenderedSteps,
  walkContent,
  checkFigureConsistency,
} from "./lib/audit-core.mjs";
import { renderDevFixture } from "./lib/render.mjs";

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

// ============================================================
// 1) محلّل الرياضيات
// ============================================================
const parse = await importModule(join(ROOT, "src", "components", "math", "parse.ts"), [
  "parseMath",
  "linearize",
  "collectCommands",
  "KNOWN_COMMANDS",
]);

section("محلّل الرياضيات");

{
  const tree = parse.parseMath("\\frac{1}{2}");
  check("كسر: نوع العقدة الجذرية", tree[0].t, "frac");
  check("كسر: البسط", parse.linearize(tree[0].num), "1");
  check("كسر: المقام", parse.linearize(tree[0].den), "2");
}

{
  const tree = parse.parseMath("x^{2} + 3x - 1");
  check("أس: العقدة الأولى أسّية", tree[0].t, "sup");
  check("أس: الأساس", parse.linearize(tree[0].base), "x");
  check("أس: تكرار خطّي", parse.linearize(tree), "x^2+3x-1");
}

{
  const tree = parse.parseMath("2(x+1) = 8");
  check("أقواس: نوع العقدة", tree[1].t, "group");
  check("أقواس: محتواها", parse.linearize(tree[1].body), "x+1");
  check("علاقة التساوي", tree[2].t, "rel");
}

check(
  "كسر مركّب: كسر داخل كسر",
  parse.linearize(parse.parseMath("\\frac{\\frac{1}{2}}{3}")),
  "1/2/3",
);

check(
  "أوامر معروفة: \\times و\\le و\\angle",
  parse.collectCommands("5 \\times 3 \\le 20 \\angle ABC").sort(),
  ["angle", "le", "times"],
);

const known = new Set(parse.KNOWN_COMMANDS);
checkTrue("\\frac مدرج ضمن الأوامر المعروفة", known.has("frac"));
checkTrue("\\sqrt مدرج ضمن الأوامر المعروفة", known.has("sqrt"));
check(
  "أمر مجهول: يُعلَّم بدل الانهيار",
  parse.parseMath("\\nonsense{x}")[0].t,
  "unknown",
);
check(
  "كسر عربي بنص داخل رياضيات: \\text{سم}",
  parse.linearize(parse.parseMath("5\\text{سم}^2")),
  "5سم^2",
);

// ============================================================
// 2) تطبيع الأجوبة
// ============================================================
const normalize = await importModule(join(ROOT, "src", "lib", "math", "normalize.ts"), [
  "normalizeAnswer",
  "answersMatch",
  "answersMatchLoosely",
  "toWesternDigits",
]);

section("تطبيع الأجوبة");

check("أرقام عربية-هندية → غربية", normalize.toWesternDigits("٤٣٢"), "432");
check("فاصلة عشرية عربية", normalize.normalizeAnswer("١٫٥", { mode: "math" }), "1.5");
check("حذف الفراغات في الرياضيات", normalize.normalizeAnswer("2x + 3", { mode: "math" }), "2x+3");
check("توحيد × مع *", normalize.normalizeAnswer("٣ × ٥", { mode: "math" }), "3*5");
check("شرطة الطرح الطويلة", normalize.normalizeAnswer("−7", { mode: "math" }), "-7");
check("متباينة ≤ تُقبل", normalize.normalizeAnswer("x ≤ 5", { mode: "math" }), "x<=5");
check("علامة = زائدة في النهاية", normalize.normalizeAnswer("x=4=", { mode: "math" }), "x=4");

checkTrue("مطابقة: ٤ مع 4", normalize.answersMatch("٤", ["4"]));
checkTrue("مطابقة: 2x مع 2x", normalize.answersMatch("2x", ["2x"]));
checkTrue("مطابقة: 2×3 مع 6", normalize.answersMatch("2×3", ["6", "2*3"]));
checkTrue("عدم مطابقة: 5 مع 4", !normalize.answersMatch("5", ["4"]));
checkTrue(
  "مطابقة نصية عربية مع همزة مختلفة",
  normalize.answersMatchLoosely("إجابة", ["اجابة"]),
);
checkTrue(
  "عدم مطابقة جواب فارغ",
  !normalize.answersMatch("", ["4"]),
);

// ============================================================
// 3) التصحيح على الخادم
// ============================================================
const grade = await importModule(join(ROOT, "src", "lib", "assessment", "grade.ts"), [
  "gradeSubmission",
  "scoreMessage",
  "buildSubmission",
]);

section("التصحيح على الخادم");

const dataset = {
  lessonId: "demo",
  questions: [
    { id: "q1", ar: "س1", opts: ["أ", "ب"], answer: 0, why: "لأن أ صحيحة" },
    { id: "q2", ar: "س2", opts: ["أ", "ب"], answer: 1, why: "لأن ب صحيحة" },
  ],
};

{
  const result = grade.gradeSubmission(dataset, grade.buildSubmission([
    { questionId: "q1", choice: 0 },
    { questionId: "q2", choice: 0 },
  ]));
  check("النتيجة: مجموع", result.score, 1);
  check("النتيجة: الإجمالي", result.total, 2);
  check("النتيجة: السؤال الأول صحيح", result.answers[0].correct, true);
  check("النتيجة: السؤال الثاني خطأ", result.answers[1].correct, false);
  check("الشرح يُرسل للسؤال المُقيَّم", result.answers[0].why, "لأن أ صحيحة");
}

{
  const hidden = grade.gradeSubmission(dataset, { q1: 0 }, { revealAnswer: false });
  check("إخفاء الإجابة الصحيحة عند الطلب", hidden.answers[0].answer, -1);
  check("السؤال غير المُجاب يُحسب خطأً", hidden.answers[1].correct, false);
  check("السؤال غير المُجاب: choice = -1", hidden.answers[1].choice, -1);
}

check("رسالة 100%", grade.scoreMessage(100).startsWith("🏆"), true);
check("رسالة 60%", grade.scoreMessage(60).startsWith("👍"), true);

// ============================================================
// 4) الهندسة
// ============================================================
const geometry = await importModule(
  join(ROOT, "src", "components", "geometry", "geometry-math.ts"),
  [
    "rightAngleLegs",
    "rightAngleCorner",
    "angleArcPath",
    "angleLabelPosition",
    "tickMarks",
    "parallelChevrons",
    "extendLine",
    "toSvg",
    "toSvgViewBox",
    "unit",
    "midpoint",
    "angleBetween",
    "centroid",
    "round",
  ],
);

section("الهندسة");

{
  // زاوية قائمة عند B=(0,0) مع A على المحور y و C على المحور x
  const vertex = { x: 0, y: 0 };
  const from = { x: 0, y: 2 };
  const to = { x: 2, y: 0 };
  const legs = geometry.rightAngleLegs(vertex, from, to, 1);
  check("قاعدة أولى على الشعاع الأول", [legs.a.x, legs.a.y], [0, 1]);
  check("قاعدة ثانية على الشعاع الثاني", [legs.b.x, legs.b.y], [1, 0]);
  check("رأس المربع = مجموع متجهَي الوحدة", [legs.corner.x, legs.corner.y], [1, 1]);
  checkTrue(
    "رأس المربع يبعد مسافة ثابتة عن الرأس",
    Math.abs(Math.hypot(legs.corner.x, legs.corner.y) - Math.SQRT2) < 1e-9,
  );
}

{
  // الزاوية قائمة فعلًا: يجب أن تساوي 90°
  check(
    "قياس الزاوية يحسب 90°",
    Math.round(geometry.angleBetween({ x: 0, y: 1 }, { x: 1, y: 0 })),
    90,
  );
  check(
    "اتجاه قوس الزاوية: من المحور y إلى x = 90° بعكس عقارب الساعة",
    Math.round(geometry.angleBetween({ x: 0, y: 1 }, { x: 1, y: 0 })),
    90,
  );
}

{
  // من (1,0) إلى (0,1) حول الأصل: دوران موجب (عكس عقارب الساعة) في الفضاء الرياضي
  const arc = geometry.angleArcPath({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, 2);
  checkTrue("مسار القوس يبدأ بـ M", arc.startsWith("M "));
  checkTrue("مسار القوس يحتوي أمر A بنصف قطر 2", arc.includes("A 2 2 0"));
  const arcFlags = arc.split("A ")[1].split(" ").slice(3, 5);
  check("قوس: largeArc = 0 لزاوية حادة", arcFlags[0], "0");
  // في فضاء SVG (المقلوب) يقابل الدوران الرياضي الموجب sweep = 1
  check("قوس: اتجاه الدوران sweep = 1", arcFlags[1], "1");

  // رياضيّاً: الزاوية بين شعاعين محصورة في [0,180]، لذلك largeArc = 0 دائمًا
  // والاتجاه (sweep) وحده يحدّد جهة القوس.
  const wide = geometry.angleArcPath({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: -0.2 }, 1);
  check("قوس: largeArc = 0 حتى للزوايا الكبيرة", wide.split("A ")[1].split(" ")[3], "0");
  // والاتجاه ينعكس عند عكس ترتيب الشعاعين
  const flipped = geometry.angleArcPath({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }, 1);
  check("قوس: الاتجاه ينعكس بعكس ترتيب الشعاعين", flipped.split("A ")[1].split(" ")[4], "0");
}

{
  const ticks = geometry.tickMarks({ x: 0, y: 0 }, { x: 4, y: 0 }, 2, 0.4, 0.5);
  check("عدد شرطات التطابق", ticks.length, 2);
  checkTrue(
    "الشرطات عمودية على القطعة الأفقية",
    ticks.every((tick) => Math.abs(tick.x1 - tick.x2) < 1e-9),
  );
  checkTrue(
    "الشرطات حول منتصف القطعة",
    ticks.every((tick) => Math.abs(tick.x1 - 2) <= 0.5 + 1e-9),
  );
}

{
  const chevrons = geometry.parallelChevrons({ x: 0, y: 0 }, { x: 4, y: 0 }, 1, 0.3, 0.5);
  check("عدد أسهم التوازي", chevrons.length, 1);
  checkTrue("سهم التوازي مسار مرسوم", chevrons[0].d.startsWith("M "));
}

{
  // التمديد متناسب مع طول القطعة: قطعة طولها 2 بعامل 1.5 تمتدّ 3 وحدات لكل جهة
  const extended = geometry.extendLine({ x: 0, y: 0 }, { x: 2, y: 0 }, 1.5);
  check("تمديد المستقيم متناسب مع الطول", [extended.from.x, extended.to.x], [-3, 5]);
  const shortSegment = geometry.extendLine({ x: 0, y: 0 }, { x: 1, y: 0 }, 1.5);
  check("التمديد لا يعتمد على مقياس الشكل", [shortSegment.from.x, shortSegment.to.x], [-1.5, 2.5]);
}

{
  check("قلب المحور y مرّة واحدة", geometry.toSvg({ x: 3, y: 2 }), { x: 3, y: -2 });
  check(
    "viewBox يحوّل الزاوية العلوية",
    geometry.toSvgViewBox([0, 0, 10, 4]),
    "0 -4 10 4",
  );
}

check("مركز الثقل", geometry.centroid([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 4 }]), {
  x: 4 / 3,
  y: 4 / 3,
});

// ============================================================
// 5) قواعد التدقيق — تكتشف الخلل فعلًا
// ============================================================
section("قواعد التدقيق (سلبية وإيجابية)");

const goodContent = {
  lessonId: "demo-lesson",
  modelVersion: 1,
  textbook: { title: "كتاب تجريبي", grade: "—", pages: "—" },
  steps: [
    {
      kind: "lesson",
      id: "concept",
      section: "قسم",
      title: "شرح",
      blocks: [
        { type: "text", text: "نص المصدر الكامل: نجمع الكسرين بعد توحيد المقامات." },
        {
          type: "formula",
          math: "\\frac{1}{2} + \\frac{1}{3} = \\frac{5}{6}",
          note: "توحيد المقامات ثم الجمع.",
          source: { provenance: "book", bookRef: "ص 10" },
        },
        {
          type: "worked",
          source: { provenance: "extra", reason: "تثبيت فكرة توحيد المقامات" },
          title: "مثال إضافي",
          solution: {
            kind: "solve",
            given: "$\\frac{1}{4} + \\frac{1}{4}$",
            required: "الناتج في أبسط صورة",
            steps: [
              { action: "نجمع البسطين", why: "المقامات موحّدة أصلًا فلا نحتاج توحيدًا.", math: "\\frac{1+1}{4}" },
              { action: "نبسّط الكسر", why: "نقسم البسط والمقام على العامل المشترك 2.", math: "\\frac{1}{2}" },
            ],
            answer: "$\\frac{1}{2}$",
            check: "التعويض في الأصل يؤكد أن الناتج صحيح.",
          },
        },
      ],
    },
  ],
};

const goodCoverage = {
  lessonId: "demo-lesson",
  textbook: { title: "كتاب تجريبي", grade: "—", pages: "—" },
  units: [
    {
      ref: "①",
      bookRef: "ص 10",
      title: "توحيد المقامات",
      body: "نجمع الكسرين بعد توحيد المقامات.",
    },
  ],
  // الأعداد محسوبة يدويًا من محتوى goodContent:
  // الكسور: 3 في الصيغة + 2 في "المعطى" + 1 في "الجواب" + 2 في خطوتي الحل = 8
  counts: {
    bookExamples: 1,
    extraExamples: 1,
    misconceptions: 0,
    guidedSolutions: 1,
    figures: 0,
    checks: 0,
    fractions: 8,
    steps: 1,
  },
};

{
  const result = evaluateLesson({
    lessonContent: goodContent,
    coverage: goodCoverage,
    curriculumEntry: { lesson: { id: "demo-lesson" } },
    math: { knownCommands: parse.KNOWN_COMMANDS, collectCommands: parse.collectCommands },
  });
  check("درس سليم: لا أخطاء", result.failures, []);
}

{
  // (1) حذف نص المصدر
  const broken = structuredClone(goodContent);
  broken.steps[0].blocks[0].text = "نص مختصر مختلف تمامًا";
  const result = evaluateLesson({
    lessonContent: broken,
    coverage: goodCoverage,
    curriculumEntry: { lesson: { id: "demo-lesson" } },
    math: { knownCommands: parse.KNOWN_COMMANDS, collectCommands: parse.collectCommands },
  });
  checkTrue(
    "يُكتشف حذف/اختصار نص المصدر",
    result.failures.some((f) => f.includes("نصوص مصدر غير موجودة")),
  );
}

{
  // (2) خطوة بلا تعليل
  const broken = structuredClone(goodContent);
  broken.steps[0].blocks[2].solution.steps[0].why = "";
  const result = evaluateLesson({
    lessonContent: broken,
    coverage: goodCoverage,
    curriculumEntry: { lesson: { id: "demo-lesson" } },
    math: { knownCommands: parse.KNOWN_COMMANDS, collectCommands: parse.collectCommands },
  });
  checkTrue(
    "يُكتشف غياب التعليل (why) في خطوة",
    result.failures.some((f) => f.includes("بلا تعليل")),
  );
}

{
  // (3) كسر مسطّح
  const broken = structuredClone(goodContent);
  broken.steps[0].blocks[1].math = "1/2 + 1/3 = 5/6";
  const result = evaluateLesson({
    lessonContent: broken,
    coverage: goodCoverage,
    curriculumEntry: { lesson: { id: "demo-lesson" } },
    math: { knownCommands: parse.KNOWN_COMMANDS, collectCommands: parse.collectCommands },
  });
  checkTrue(
    "يُكتشف الكسر المسطّح",
    result.failures.some((f) => f.includes("كسور مسطّحة")),
  );
}

{
  // (4) أمر LaTeX مجهول
  const broken = structuredClone(goodContent);
  broken.steps[0].blocks[1].math = "\\unknowncmd{1}{2}";
  const result = evaluateLesson({
    lessonContent: broken,
    coverage: goodCoverage,
    curriculumEntry: { lesson: { id: "demo-lesson" } },
    math: { knownCommands: parse.KNOWN_COMMANDS, collectCommands: parse.collectCommands },
  });
  checkTrue(
    "يُكتشف أمر LaTeX مجهول",
    result.failures.some((f) => f.includes("أوامر LaTeX مجهولة")),
  );
}

{
  // (5) عنصر إضافي بلا سبب
  const broken = structuredClone(goodContent);
  broken.steps[0].blocks[2].source.reason = "";
  const result = evaluateLesson({
    lessonContent: broken,
    coverage: goodCoverage,
    curriculumEntry: { lesson: { id: "demo-lesson" } },
    math: { knownCommands: parse.KNOWN_COMMANDS, collectCommands: parse.collectCommands },
  });
  checkTrue(
    "يُكتشف عنصر إضافي بلا سبب",
    result.failures.some((f) => f.includes("بلا سبب")),
  );
}

{
  // (6) عدد معلن غير مطابق
  const brokenCoverage = structuredClone(goodCoverage);
  brokenCoverage.counts.fractions = 99;
  const result = evaluateLesson({
    lessonContent: goodContent,
    coverage: brokenCoverage,
    curriculumEntry: { lesson: { id: "demo-lesson" } },
    math: { knownCommands: parse.KNOWN_COMMANDS, collectCommands: parse.collectCommands },
  });
  checkTrue(
    "يُكتشف عدم تطابق الأعداد المعلنة",
    result.failures.some((f) => f.includes("العدد غير مطابق")),
  );
}

{
  // (7) معرّف غير موجود في المنهاج
  const result = evaluateLesson({
    lessonContent: goodContent,
    coverage: goodCoverage,
    curriculumEntry: null,
    math: { knownCommands: parse.KNOWN_COMMANDS, collectCommands: parse.collectCommands },
  });
  checkTrue(
    "يُكتشف معرّف درس غير موجود في المنهاج",
    result.failures.some((f) => f.includes("غير موجود في المنهاج")),
  );
}

{
  // (8) سؤال طالب يحمل إجابة في المحتوى
  const broken = structuredClone(goodContent);
  broken.steps.push({
    kind: "quiz",
    id: "quiz",
    section: "قسم",
    title: "اختبار",
    questions: [{ id: "q1", ar: "سؤال", opts: ["أ", "ب"], answer: 0 }],
  });
  const result = evaluateLesson({
    lessonContent: broken,
    coverage: { ...structuredClone(goodCoverage), counts: { ...goodCoverage.counts, steps: 2 } },
    curriculumEntry: { lesson: { id: "demo-lesson" } },
    math: { knownCommands: parse.KNOWN_COMMANDS, collectCommands: parse.collectCommands },
  });
  checkTrue(
    "يُكتشف تسريب الإجابة داخل أسئلة الطالب",
    result.failures.some((f) => f.includes("تحمل إجابات")),
  );
}

{
  // (9) شكل هندسي متماسك + شكل مكسور
  const goodFigure = {
    viewBox: [0, 0, 4, 4],
    points: [
      { id: "A", x: 0, y: 0 },
      { id: "B", x: 4, y: 0 },
      { id: "C", x: 4, y: 4 },
    ],
    segments: [{ from: "A", to: "B" }, { from: "B", to: "C" }],
    rightAngles: [{ vertex: "B", from: "A", to: "C" }],
  };
  check("شكل متماسك: لا أخطاء", checkFigureConsistency(goodFigure, "شكل"), []);

  const brokenFigure = structuredClone(goodFigure);
  brokenFigure.segments.push({ from: "A", to: "Z" });
  checkTrue(
    "يُكتشف مرجع نقطة غير موجود",
    checkFigureConsistency(brokenFigure, "شكل").some((e) => e.includes("مراجع إلى نقاط غير موجودة")),
  );

  const badViewBox = structuredClone(goodFigure);
  badViewBox.viewBox = [0, 0, 0, -1];
  checkTrue(
    "يُكتشف viewBox غير صالح",
    checkFigureConsistency(badViewBox, "شكل").some((e) => e.includes("viewBox غير صالح")),
  );

  // إحداثيات غير منتهية: كانت تمرّ سابقًا فتُرسم العلامة في موضع NaN
  const nanPoint = structuredClone(goodFigure);
  nanPoint.points[1] = { ...nanPoint.points[1], x: Number.NaN };
  checkTrue(
    "يُكتشف إحداثي NaN في نقطة",
    checkFigureConsistency(nanPoint, "شكل").some((e) => e.includes("إحداثيات غير صالحة")),
  );

  const nanText = structuredClone(goodFigure);
  nanText.texts = [{ x: Number.NaN, y: 2, text: "قياس", role: "ar" }];
  checkTrue(
    "يُكتشف إحداثي NaN في نص داخل الشكل",
    checkFigureConsistency(nanText, "شكل").some((e) => e.includes("نصوص داخل الشكل")),
  );
}

{
  // (10) walkContent يجمع الأعداد بدقة
  const stats = walkContent(goodContent);
  check("جمع العناصر: من الكتاب", stats.counts.bookExamples, 1);
  check("جمع العناصر: إضافي", stats.counts.extraExamples, 1);
  check("جمع العناصر: حلول موجّهة", stats.counts.guidedSolutions, 1);
  check("جمع العناصر: خطوات الحل", stats.solveSteps.length, 2);
}

// ============================================================
// 5-ب) قواعد DOM المُصيَّر: تكتشف الأخطاء فعلًا
// ============================================================
// البوابة الآلية لا قيمة لها إن كانت تعرض ✓ دائمًا. هذه الحالات
// تُثبت أنها تفشل عند وجود المخالفة — كل حالة تخرق مبدأً واحدًا.
section("قواعد DOM المُصيَّر — كشف المخالفات");

{
  const steps = [{ id: "s1", kind: "lesson" }];
  const content = { lessonId: "l", steps };
  const goodHtml = {
    id: "s1",
    kind: "lesson",
    html: '<span dir="ltr" class="math-expr"><span class="m-frac"><span class="m-frac-num">1</span><span class="m-frac-bar"></span><span class="m-frac-den">2</span></span></span>',
  };
  const base = { lessonContent: content, hidden: [], teacherDataset: null };
  const judge = (html, extra = {}) =>
    evaluateRenderedSteps({
      ...base,
      rendered: [{ id: "s1", kind: "lesson", html }],
      fractionCount: 1,
      ...extra,
    });

  checkTrue("DOM سليم: لا أخطاء", judge(goodHtml.html).failures.length === 0);

  checkTrue(
    "كشف: أمر LaTeX خام في النص",
    judge("<p>الجواب \\frac{1}{2}</p>" + goodHtml.html).failures.length > 0,
  );
  checkTrue(
    "كشف: أمر مجهول ظهر في العرض",
    judge(goodHtml.html + '<span class="m-unknown">\\foo</span>').failures.length > 0,
  );
  checkTrue(
    "كشف: رياضيات بلا عزل اتجاه",
    judge('<span class="math-expr"><span class="m-num">5</span></span>').failures.length > 0,
  );
  checkTrue(
    "كشف: كسور في المحتوى بلا كسر مكدّس",
    judge('<span dir="ltr" class="math-expr"><span class="m-num">1</span></span>').failures.length > 0,
  );
  checkTrue(
    "كشف: كسر مسطّح في النص المرئي",
    judge(goodHtml.html + "<p>النسبة 3/4 من الكل</p>").failures.length > 0,
  );
  checkTrue(
    "كشف: عنصر محجوب موجود في DOM الطالب",
    judge(goodHtml.html + '<div data-locked="true">الحل</div>').failures.length > 0,
  );
  checkTrue(
    "كشف: نص حلّ ظاهر قبل تصرّف الطالب",
    evaluateRenderedSteps({
      ...base,
      rendered: [{ id: "s1", kind: "lesson", html: goodHtml.html + "<p>نقسم الطرفين على 2</p>" }],
      hidden: [{ stepId: "s1", field: "نقسم الطرفين على 2" }],
      fractionCount: 1,
    }).failures.length > 0,
  );
  checkTrue(
    "تجاهل: جواب قصير («4») لا يُعدّ تسريبًا",
    evaluateRenderedSteps({
      ...base,
      rendered: [{ id: "s1", kind: "lesson", html: goodHtml.html + "<p>الخطوة 4 من 9</p>" }],
      hidden: [{ stepId: "s1", field: "4" }],
      fractionCount: 1,
    }).failures.length === 0,
  );
  checkTrue(
    "كشف: شكل SVG بلا viewBox",
    judge('<svg width="10" height="10"><line x1="0" y1="0" x2="1" y2="1"/></svg>' + goodHtml.html, {
      figureCount: 1,
    }).failures.length > 0,
  );
  checkTrue(
    "كشف: نص داخل شكل بلا تحديد اتجاه",
    judge('<svg viewBox="0 0 10 10"><text x="1" y="1">A</text></svg>' + goodHtml.html, {
      figureCount: 1,
    }).failures.length > 0,
  );
  checkTrue(
    "كشف: تسرّب إجابة من مجموعة المعلم",
    evaluateRenderedSteps({
      ...base,
      rendered: [{ id: "s1", kind: "lesson", html: goodHtml.html + "<p>لأننا نجمع البسطين فقط</p>" }],
      fractionCount: 1,
      teacherDataset: { questions: [{ id: "q1", answer: 2, why: "لأننا نجمع البسطين فقط" }] },
    }).failures.length > 0,
  );
  checkTrue(
    "كشف: خطوة فشل تصييرها",
    evaluateRenderedSteps({
      ...base,
      rendered: [{ id: "s1", kind: "lesson", html: "", error: "boom" }],
      fractionCount: 0,
    }).failures.length > 0,
  );
}

// ============================================================
// 6) نموذج العرض التقني (fixture) يجتاز كل القواعد
// ============================================================
section("نموذج العرض التقني — فحص شامل لنموذج المحتوى");

{
  const fixtureModule = await importModule(join(ROOT, "src", "dev", "lesson-fixture.ts"), [
    "devFixtureContent",
  ]);
  const lessonContent = fixtureModule.devFixtureContent;
  const stats = walkContent(lessonContent);

  // سجل تغطية مشتق من المحتوى نفسه: الغرض فحص القواعد الأخرى على
  // نموذج كبير يمثّل كل أنواع الخطوات والكتل والتفاعلات.
  const coverage = {
    lessonId: lessonContent.lessonId,
    textbook: lessonContent.textbook,
    // وحدة مصدر اصطناعية نصّها مأخوذ من محتوى النموذج نفسه،
    // للتحقق من أن آلية مقارنة نصوص المصدر تعمل على نموذج كبير أيضًا.
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

  const result = evaluateLesson({
    lessonContent,
    coverage,
    curriculumEntry: { lesson: { id: lessonContent.lessonId } },
    math: { knownCommands: parse.KNOWN_COMMANDS, collectCommands: parse.collectCommands },
  });

  check("نموذج العرض: لا أخطاء في القواعد", result.failures, []);
  checkTrue("نموذج العرض: يمثّل كل أنواع الخطوات", lessonContent.steps.length >= 8);
  checkTrue("نموذج العرض: فيه كسور مكدّسة", stats.counts.fractions >= 8);
  checkTrue("نموذج العرض: فيه أشكال هندسية", stats.counts.figures >= 3);
  checkTrue("نموذج العرض: فيه تفاعلات", stats.counts.checks >= 4);
  checkTrue("نموذج العرض: كل خطوة حلّ لها تعليل", stats.solveSteps.every((step) => step.why));
  checkTrue(
    "نموذج العرض: لا رياضيات غير مغلّفة بـ $",
    stats.unwrappedMath.length === 0,
  );
  checkTrue(
    "نموذج العرض: لا أسئلة طالب تحمل إجابات",
    stats.studentQuestions.every((question) => !("answer" in question) && !("why" in question)),
  );

  // تصيير فعلي بمكوّنات React الحقيقية ثم فحص DOM الطالب.
  const { rendered } = await renderDevFixture();
  check("نموذج العرض: كل الخطوات تُصيَّر", rendered.filter((step) => step.error).length, 0);
  check("نموذج العرض: عدد الخطوات المُصيَّرة", rendered.length, lessonContent.steps.length);

  const domResult = evaluateRenderedSteps({
    lessonContent,
    rendered,
    hidden: stats.hidden,
    fractionCount: stats.counts.fractions,
    figureCount: stats.counts.figures,
  });
  check("نموذج العرض: DOM الطالب سليم", domResult.failures, []);

  const html = rendered.map((step) => step.html).join("\n");
  checkTrue("نموذج العرض: الكسور مكدّسة في العرض", html.includes("m-frac-num"));
  checkTrue("نموذج العرض: الأشكال مرسومة SVG", html.includes("<svg"));
  checkTrue("نموذج العرض: الرياضيات معزولة LTR", html.includes('dir="ltr" class="math-expr'));
}

// ============================================================
// التقرير
// ============================================================
console.log("");
if (failures.length > 0) {
  for (const failure of failures) console.error(colors.red(`✕ ${failure}`));
  console.error(colors.red(`\nفشل الاختبار الذاتي: ${failures.length} من ${passed + failures.length}.`));
  cleanBundles();
  process.exit(1);
}
console.log(colors.green(`نجح الاختبار الذاتي: ${passed} تحقّقًا.`));
cleanBundles();
