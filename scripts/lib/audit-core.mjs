// ============================================================
// منطق تدقيق الدرس — pure audit rules
// ============================================================
// فصلنا القواعد عن الطرفية (CLI) لسببين:
//   1) يمكن اختبارها ببيانات في الذاكرة (scripts/self-test.mjs)
//      فيُثبت أن البوابة *تكتشف* الأخطاء فعلًا، لا أنها تعرض ✓ فقط.
//   2) إعادة استخدامها لاحقًا في CI أو في تقارير أخرى.
//
// كل دوال هذا الملف نقية: تُعيد قائمة أخطاء، ولا تطبع شيئًا.
// ============================================================

/** يقسّم نصًا مختلطًا إلى مقاطع نصية ورياضية ($...$). */
export function splitRichText(text) {
  const parts = [];
  let cursor = 0;
  const source = String(text);
  while (cursor < source.length) {
    const start = source.indexOf("$", cursor);
    if (start === -1) {
      parts.push({ kind: "text", value: source.slice(cursor) });
      break;
    }
    const end = source.indexOf("$", start + 1);
    if (end === -1) {
      parts.push({ kind: "text", value: source.slice(cursor) });
      break;
    }
    if (start > cursor) parts.push({ kind: "text", value: source.slice(cursor, start) });
    parts.push({ kind: "math", value: source.slice(start + 1, end) });
    cursor = end + 1;
  }
  return parts.filter((part) => part.value !== "");
}

/** يجمع عناصر المحتوى ويصنّفها. */
export function walkContent(lessonContent) {
  const mathFields = [];
  const texts = [];
  const solveSteps = [];
  const sources = [];
  const figures = [];
  const studentQuestions = [];
  const counts = {
    bookExamples: 0,
    extraExamples: 0,
    misconceptions: 0,
    guidedSolutions: 0,
    figures: 0,
    checks: 0,
    fractions: 0,
    steps: lessonContent.steps.length,
  };

  const visitMath = (value) => {
    if (typeof value !== "string" || value.trim() === "") return;
    mathFields.push(value);
    // نحسب عدد الكسور الفعلي (كل \frac) لا عدد الحقول التي فيها كسر
    counts.fractions += (value.match(/\\frac/g) ?? []).length;
  };

  /**
   * نص عربي قد يحتوي رياضيات مغلّفة بـ $...$.
   * المقاطع الرياضية تُحسب ضمن الحقول الرياضية (للتدقيق والعدّ)،
   * وأي أمر LaTeX خارج $...$ يُرصد كخلل لأنه سيُعرض خامًا للطالب.
   */
  // حقول «لا تُعرض قبل تصرّف الطالب» — نجمعها لمقارنتها بـ DOM المُصيَّر.
  const hidden = [];
  let currentStep = null;
  const markHidden = (value) => {
    if (typeof value !== "string" || value.trim() === "") return;
    hidden.push({ stepId: currentStep?.id ?? "", field: value });
  };

  const unwrappedMath = [];
  const visitText = (value) => {
    if (typeof value !== "string" || value === "") return;
    texts.push(value);
    for (const part of splitRichText(value)) {
      if (part.kind === "math") {
        visitMath(part.value);
      } else if (/\\[A-Za-z]/.test(part.value)) {
        unwrappedMath.push(value);
      }
    }
  };

  const visitSource = (source) => {
    if (!source) return;
    sources.push(source);
    if (source.provenance === "book") counts.bookExamples += 1;
    else if (source.provenance === "extra") counts.extraExamples += 1;
  };

  const visitSolution = (solution, { hidden: isHidden = false } = {}) => {
    if (!solution) return;
    counts.guidedSolutions += 1;
    for (const step of solution.steps ?? []) {
      solveSteps.push(step);
      visitMath(step.math);
      if (isHidden) {
        markHidden(step.action);
        markHidden(step.why);
        markHidden(step.math);
      }
    }
    for (const key of ["answer", "check", "conclusion", "given", "required", "goal", "result"]) {
      if (solution[key] !== undefined) visitText(solution[key]);
      if (isHidden) markHidden(solution[key]);
    }
  };

  const visitActivity = (activity) => {
    if (!activity) return;
    visitSource(activity.source);
    if (activity.prompt) visitText(activity.prompt);
    if (activity.math) visitMath(activity.math);

    switch (activity.kind) {
      case "revealSteps":
        counts.checks += 1;
        visitSolution({ steps: activity.steps }, { hidden: true });
        break;
      case "tryYourself":
        counts.checks += 1;
        visitMath(activity.answer?.display);
        (activity.answer?.accepted ?? []).forEach(visitMath);
        (activity.answer?.choices ?? []).forEach(visitMath);
        if (activity.hint) visitText(activity.hint);
        // الجواب والحل لا يدخلان DOM قبل أن يجرّب الطالب
        markHidden(activity.answer?.display);
        (activity.answer?.accepted ?? []).forEach(markHidden);
        visitSolution({ steps: activity.solution }, { hidden: true });
        break;
      case "chooseOperation":
        counts.checks += 1;
        activity.options.forEach(visitMath);
        visitText(activity.why);
        markHidden(activity.why);
        break;
      case "predictReveal":
        counts.checks += 1;
        activity.choices.forEach(visitMath);
        visitMath(activity.reveal);
        visitText(activity.why);
        markHidden(activity.reveal);
        markHidden(activity.why);
        break;
      case "matchPairs":
        counts.checks += 1;
        activity.pairs.forEach((pair) => {
          visitMath(pair.left);
          visitMath(pair.right);
        });
        break;
      case "mistakeHunt":
        counts.checks += 1;
        activity.items.forEach((item) => {
          visitMath(item.wrong);
          visitMath(item.correct);
          visitText(item.why);
          markHidden(item.correct);
          markHidden(item.why);
        });
        break;
      case "figureQuery":
        counts.checks += 1;
        figures.push(activity.figure);
        activity.options.forEach((option) => visitText(option.label));
        visitText(activity.why);
        markHidden(activity.why);
        break;
      case "quickCheck":
        counts.checks += 1;
        activity.items.forEach((item) => {
          visitText(item.ar);
          visitText(item.why);
          visitMath(item.math);
          item.opts.forEach(visitMath);
          markHidden(item.why);
        });
        break;
      case "practiceSet":
        counts.checks += 1;
        activity.questions.forEach((question) => {
          studentQuestions.push(question);
          visitText(question.ar);
          visitMath(question.math);
          question.opts.forEach(visitMath);
        });
        break;
      default:
        break;
    }
  };

  const visitBlock = (block) => {
    switch (block.type) {
      case "text":
      case "heading":
      case "note":
      case "warning":
        visitText(block.text);
        break;
      case "definition":
        visitText(block.term);
        visitText(block.text);
        visitMath(block.notation);
        break;
      case "formula":
        visitMath(block.math);
        if (block.note) visitText(block.note);
        visitSource(block.source);
        break;
      case "example":
        visitSource(block.source);
        visitText(block.title);
        visitText(block.text);
        break;
      case "list":
        block.items.forEach(visitText);
        break;
      case "table":
        [...block.headers, ...block.rows.flat()].forEach(visitText);
        if (block.caption) visitText(block.caption);
        break;
      case "symbolLegend":
        block.items.forEach((item) => {
          visitMath(item.symbol);
          visitText(item.meaning);
        });
        break;
      case "worked":
        visitSource(block.source);
        visitText(block.title);
        visitSolution(block.solution);
        break;
      case "misconception":
        visitSource(block.source);
        counts.misconceptions += 1;
        visitMath(block.wrong);
        visitMath(block.correct);
        visitText(block.whyWrong);
        visitText(block.remember);
        break;
      case "figure":
        visitSource(block.source);
        counts.figures += 1;
        figures.push(block.figure);
        break;
      case "activity":
        visitActivity(block.activity);
        break;
      default:
        break;
    }
  };

  for (const step of lessonContent.steps) {
    currentStep = step;
    for (const key of ["lead", "tip", "subtitle", "note", "text"]) {
      if (step[key]) visitText(step[key]);
    }
    if (step.kind === "objectives") step.items.forEach(visitText);
    if (step.kind === "summary") {
      step.items.forEach((item) => {
        visitText(item.label);
        visitText(item.text);
      });
    }
    if (step.kind === "lesson") step.blocks.forEach(visitBlock);
    if (step.kind === "interactive" || step.kind === "practice") visitActivity(step.activity);
    if (step.kind === "quiz") {
      step.questions.forEach((question) => {
        studentQuestions.push(question);
        visitText(question.ar);
        visitMath(question.math);
        question.opts.forEach(visitMath);
      });
    }
  }

  return {
    mathFields,
    texts,
    solveSteps,
    sources,
    figures,
    studentQuestions,
    unwrappedMath,
    hidden,
    counts,
  };
}

/** مطبِّع نص للمقارنة (بلا فراغات ولا محارف اتجاه). */
export function normalizeText(value) {
  return String(value)
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\u0640]/g, "")
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

/** تماسك الشكل: كل مرجع نقطة موجود، وviewBox صالح، والشكل غير فارغ. */
export function checkFigureConsistency(figure, label) {
  const errors = [];
  const ids = new Set((figure.points ?? []).map((point) => point.id));
  const refs = [];
  (figure.segments ?? []).forEach((segment) => refs.push(segment.from, segment.to));
  (figure.angles ?? []).forEach((angle) => refs.push(angle.vertex, angle.from, angle.to));
  (figure.rightAngles ?? []).forEach((right) => refs.push(right.vertex, right.from, right.to));
  (figure.circles ?? []).forEach((circle) => {
    refs.push(circle.center);
    if (circle.through) refs.push(circle.through);
    if (circle.arcFrom) refs.push(circle.arcFrom);
    if (circle.arcTo) refs.push(circle.arcTo);
  });

  const missing = [...new Set(refs)].filter((id) => !ids.has(id));
  if (missing.length > 0) {
    errors.push(`${label}: مراجع إلى نقاط غير موجودة: ${missing.join(", ")}`);
  }

  const viewBox = figure.viewBox ?? [];
  const validViewBox =
    viewBox.length === 4 &&
    viewBox.every((value) => Number.isFinite(value)) &&
    viewBox[2] > 0 &&
    viewBox[3] > 0;
  if (!validViewBox) errors.push(`${label}: viewBox غير صالح`);

  const hasShape = (figure.segments ?? []).length > 0 || (figure.circles ?? []).length > 0;
  if ((figure.points ?? []).length < 2 || !hasShape) {
    errors.push(`${label}: الشكل بلا عناصر مرسومة (نقاط وقطع)`);
  }
  return errors;
}

/**
 * كل قواعد التدقيق على المحتوى + سجل التغطية.
 * @returns {{ failures: string[], warnings: string[], stats: object }}
 */
export function evaluateLesson({
  lessonContent,
  coverage,
  curriculumEntry,
  options = {},
  math = {},
}) {
  const failures = [];
  const warnings = [];
  // أوامر LaTeX تُمرَّر من الخارج (لا نستورد TypeScript داخل Node مباشرة).
  const knownCommands = new Set(math.knownCommands ?? []);
  const collectCommands = math.collectCommands ?? (() => []);
  const requireFigure = options.requireFigure ?? false;

  const {
    mathFields,
    texts,
    solveSteps,
    sources,
    figures,
    studentQuestions,
    unwrappedMath,
    counts,
  } = walkContent(lessonContent);

  // (ز) الهوية
  if (!curriculumEntry) {
    failures.push("الدرس غير موجود في المنهاج — لا معرّفات مُخترعة");
  }
  if (lessonContent.lessonId !== coverage.lessonId) {
    failures.push(
      `معرّف المحتوى (${lessonContent.lessonId}) لا يطابق معرّف سجل التغطية (${coverage.lessonId})`,
    );
  }
  if (lessonContent.textbook?.title !== coverage.textbook?.title) {
    failures.push("عنوان المصدر في المحتوى لا يطابق سجل التغطية");
  }

  // (أ) التغطية النصية
  const units = coverage.units ?? [];
  if (units.length === 0) failures.push("سجل التغطية لا يحتوي أي وحدة مصدر");
  const haystack = texts.map(normalizeText).join("|");
  const missingBodies = units.filter((unit) => !haystack.includes(normalizeText(unit.body)));
  if (missingBodies.length > 0) {
    failures.push(
      `نصوص مصدر غير موجودة كاملة في الدرس: ${missingBodies.map((u) => u.ref).join(", ")}`,
    );
  }

  // (ب) المصدر والتبرير
  const badExtra = sources.filter(
    (source) => source.provenance === "extra" && !String(source.reason ?? "").trim(),
  );
  if (badExtra.length > 0) failures.push(`عناصر إضافية بلا سبب: ${badExtra.length}`);
  const badBook = sources.filter(
    (source) => source.provenance === "book" && !String(source.bookRef ?? "").trim(),
  );
  if (badBook.length > 0) failures.push(`عناصر من الكتاب بلا مرجع: ${badBook.length}`);
  const badProvenance = sources.filter(
    (source) => source.provenance !== "book" && source.provenance !== "extra",
  );
  if (badProvenance.length > 0) failures.push(`عناصر بلا provenance صريح: ${badProvenance.length}`);

  // (ج) الأعداد المعلنة
  const declared = coverage.counts ?? {};
  for (const key of Object.keys(counts)) {
    if (declared[key] === undefined) {
      failures.push(`سجل التغطية لا يعلن العدد: ${key}`);
      continue;
    }
    if (declared[key] !== counts[key]) {
      failures.push(
        `العدد غير مطابق لـ ${key}: الموجود ${counts[key]} والمعلن ${declared[key]}`,
      );
    }
  }

  // (د) التعليل
  const withoutWhy = solveSteps.filter((step) => String(step.why ?? "").trim().length < 4);
  if (withoutWhy.length > 0) {
    failures.push(`${withoutWhy.length} خطوة حلّ بلا تعليل مكتوب (why)`);
  }
  const withoutAction = solveSteps.filter((step) => !String(step.action ?? "").trim());
  if (withoutAction.length > 0) failures.push(`${withoutAction.length} خطوة بلا وصف إجراء`);

  // (هـ) الرياضيات
  const unknown = new Set();
  const flatFractions = [];
  for (const field of mathFields) {
    for (const command of collectCommands(field)) {
      if (!knownCommands.has(command)) unknown.add(`${command} ← ${field}`);
    }
    if (/\d\s*\/\s*\d/.test(field) && !/\\frac/.test(field)) flatFractions.push(field);
  }
  if (unknown.size > 0) failures.push(`أوامر LaTeX مجهولة: ${[...unknown].join(" | ")}`);
  if (flatFractions.length > 0) {
    failures.push(`كسور مسطّحة يجب كتابتها \\frac: ${flatFractions.join(" | ")}`);
  }
  if (mathFields.length === 0) failures.push("لا يوجد أي حقل رياضي في الدرس");
  if (unwrappedMath.length > 0) {
    failures.push(
      `رياضيات في نص غير مغلّفة بـ $...$ (ستُعرض أوامر LaTeX خامًا): ${unwrappedMath
        .slice(0, 3)
        .join(" | ")}`,
    );
  }

  // (و) الأشكال
  figures.forEach((figure, index) => {
    failures.push(...checkFigureConsistency(figure, `الشكل ${index + 1}`));
  });
  if (requireFigure && counts.figures === 0) {
    failures.push("الدرس هندسي لكنه لا يحتوي أي شكل");
  }

  // أسئلة الطالب: لا إجابات في المحتوى
  const leaked = studentQuestions.filter(
    (question) => "answer" in question || "why" in question || "correct" in question,
  );
  if (leaked.length > 0) {
    failures.push(`أسئلة طالب تحمل إجابات/شروحًا في المحتوى: ${leaked.length}`);
  }

  // تحذيرات (لا توقف البناء)
  if (counts.bookExamples === 0) {
    warnings.push("لا يوجد أي عنصر من الكتاب — تأكد أن الدرس ليس كله إضافات");
  }
  if (counts.misconceptions === 0) {
    warnings.push("لا يوجد أي خطأ شائع (misconception) — يُستحسن إضافته عند وجود خطأ متوقّع");
  }
  if (counts.checks === 0) {
    warnings.push("لا يوجد أي تفاعل تحقّق — يُستحسن تفاعل واحد على الأقل");
  }

  return { failures, warnings, stats: counts };
}

// ============================================================
// قواعد فحص DOM المُصيَّر — rendered-DOM rules
// ============================================================
// هذه هي الطبقة الأقوى في التدقيق: لا تفحص ما كتبناه، بل ما يصل
// فعلًا إلى شاشة الطالب. تُستدعى بعد تصيير كل خطوة بـ React.
// ============================================================

/** يحوّل HTML إلى نص مقروء (يحذف الوسوم ويفكّ الكيانات). */
export function htmlToText(html) {
  return String(html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** كل الوسوم التي تحمل صنفًا معيّنًا. */
function tagsWithClass(html, className) {
  const pattern = new RegExp(`<([a-z]+)([^>]*class="[^"]*${className}[^"]*"[^>]*)>`, "gi");
  return [...String(html).matchAll(pattern)].map((match) => ({ tag: match[1], attrs: match[2] }));
}

/** كل وسوم <text> داخل SVG. */
function svgTextTags(html) {
  return [...String(html).matchAll(/<text([^>]*)>/gi)].map((match) => match[1]);
}

/**
 * يحكم على الخطوات المُصيَّرة.
 * @param {object} args
 * @param {object} args.lessonContent محتوى الدرس
 * @param {{id:string,kind:string,html:string,error?:string}[]} args.rendered الخطوات المُصيَّرة
 * @param {{stepId:string,field:string}[]} args.hidden حقول يجب ألّا تظهر قبل تصرّف الطالب
 * @param {object|null} args.teacherDataset مجموعة إجابات المعلم (إن وُجدت)
 * @param {number} args.fractionCount عدد الكسور في المحتوى
 * @param {number} args.figureCount عدد الأشكال في المحتوى
 */
export function evaluateRenderedSteps({
  lessonContent,
  rendered,
  hidden = [],
  teacherDataset = null,
  fractionCount = 0,
  figureCount = 0,
}) {
  const failures = [];
  const warnings = [];

  // (1) كل الخطوات تُصيَّر بلا استثناء
  if (rendered.length !== lessonContent.steps.length) {
    failures.push(
      `عدد الخطوات المُصيَّرة (${rendered.length}) لا يطابق المحتوى (${lessonContent.steps.length})`,
    );
  }
  for (const step of rendered) {
    if (step.error) failures.push(`فشل تصيير الخطوة «${step.id}»: ${step.error}`);
    if (!step.html) failures.push(`الخطوة «${step.id}» أنتجت HTML فارغًا`);
  }

  const html = rendered.map((step) => step.html).join("\n");
  const text = htmlToText(html);

  // (2) لا أوامر LaTeX خامّة ترى الطالب
  const rawLatex = text.match(/\\[A-Za-z]{2,}|\^\{|_\{/g);
  if (rawLatex) {
    const sample = [...new Set(rawLatex)].slice(0, 5).join(" , ");
    failures.push(`ظهرت أوامر LaTeX خامّة في الصفحة (لم تُصيَّر): ${sample}`);
  }

  // (3) لا أوامر مجهولة في العرض
  const unknownTags = tagsWithClass(html, "m-unknown");
  if (unknownTags.length > 0) {
    failures.push(`أوامر LaTeX غير معروفة ظهرت في العرض: ${unknownTags.length} موضعًا`);
  }

  // (4) الرياضيات داخل عزل LTR صريح
  const mathContainers = tagsWithClass(html, "math-expr");
  if (mathContainers.length === 0) {
    failures.push("لا يوجد أي تعبير رياضي في الصفحة المُصيَّرة");
  }
  const withoutDir = mathContainers.filter((container) => !/dir="ltr"/.test(container.attrs));
  if (withoutDir.length > 0) {
    failures.push(`${withoutDir.length} تعبيرًا رياضيًا بلا عزل اتجاه صريح (dir=\"ltr\")`);
  }

  // (5) الكسور مكدّسة فعلًا في العرض
  if (fractionCount > 0) {
    const fractionTags = tagsWithClass(html, "m-frac-num");
    const bars = tagsWithClass(html, "m-frac-bar");
    if (fractionTags.length === 0) {
      failures.push("المحتوى يحتوي كسورًا لكن العرض لا يحتوي أي كسر مكدّس");
    } else if (bars.length < fractionTags.length) {
      failures.push("كسر معروض بلا خط كسري (bar) — الكسر ليس مكدّسًا بشكل صحيح");
    }
  }
  // كسر مسطّح في النص المرئي (يُعرض RTL فينعكس معناه)
  const flatFraction = text.match(/(?<![\d./-])\d+\s*\/\s*\d+(?![\d/-])/);
  if (flatFraction) {
    failures.push(`كسر مسطّح في النص المرئي: «${flatFraction[0]}» — استخدم \\frac أو كسرًا مكدّسًا`);
  }

  // (6) الأشكال: SVG صالح، ونصوصه الداخلية محدّدة الاتجاه
  if (figureCount > 0) {
    const svgCount = (html.match(/<svg/g) ?? []).length;
    if (svgCount === 0) failures.push("المحتوى يعلن أشكالًا هندسية لكن الصفحة لا تحتوي SVG");
    const svgsWithoutViewBox = [...html.matchAll(/<svg([^>]*)>/gi)].filter(
      (match) => !/viewBox="/.test(match[1]),
    );
    if (svgsWithoutViewBox.length > 0) {
      failures.push(`${svgsWithoutViewBox.length} شكلًا بلا viewBox (لن تبقى تناسباته صحيحة)`);
    }
    const textsWithoutDirection = svgTextTags(html).filter(
      (attrs) => !/direction="(ltr|rtl)"/.test(attrs),
    );
    if (textsWithoutDirection.length > 0) {
      failures.push(
        `${textsWithoutDirection.length} نصًّا داخل شكل هندسي بلا تحديد اتجاه — قد ينعكس ترتيبه`,
      );
    }
  }

  // (7أ) البنية: لا يوجد أي عنصر يحمل علامة «محتوى محجوب» في HTML الأولي.
  //      هذه علامة قياسية (data-locked) يضعها المكوّن على كل ما لا يجوز
  //      أن يوجد قبل تصرّف الطالب. وجودها هنا يعني أن المحتوى صار في DOM
  //      ولو أُخفي بـ CSS — وهو ما يمنعه المبدأ صراحةً.
  const lockedTags = (html.match(/data-locked="[^"]*"/g) ?? []).length;
  if (lockedTags > 0) {
    failures.push(
      `${lockedTags} عنصرًا من «المحتوى المحجوب» موجود في HTML الأولي للطالب (لا يجوز حتى لو أُخفي بـ CSS)`,
    );
  }

  // (7ب) النصّي: لا يظهر نصّ حلّ طويل في DOM الخطوة نفسها.
  //      نتجاهل النصوص القصيرة (مثل جواب «4») لأن البحث عنها في صفحة
  //      مليئة بالأرقام يعطي نتيجة كاذبة؛ البنية أعلاه هي الضمانة الحقيقية.
  const leakedHidden = [];
  for (const item of hidden) {
    const target = rendered.find((step) => step.id === item.stepId);
    if (!target || !item.field.trim()) continue;
    const needle = normalizeText(item.field);
    if (needle.length < 6) continue;
    if (normalizeText(target.html).includes(needle)) {
      leakedHidden.push(`${item.stepId}: ${String(item.field).slice(0, 40)}`);
    }
  }
  if (leakedHidden.length > 0) {
    failures.push(
      `محتوى حلّ ظاهر في DOM قبل تصرّف الطالب (${leakedHidden.length}): ${leakedHidden
        .slice(0, 3)
        .join(" | ")}`,
    );
  }

  // (8) لا تتسرّب إجابات المعلم إلى DOM الطالب
  if (teacherDataset) {
    const leak = [];
    for (const question of teacherDataset.questions ?? []) {
      for (const secret of [question.answer, question.why, question.explanation]) {
        if (typeof secret === "string" && secret.trim() && normalizeText(html).includes(normalizeText(secret))) {
          leak.push(`${question.id}: ${secret.slice(0, 30)}`);
        }
      }
    }
    if (leak.length > 0) {
      failures.push(`تسرّبت إجابات المعلم إلى DOM الطالب (${leak.length}): ${leak.slice(0, 3).join(" | ")}`);
    }
  }

  return { failures, warnings };
}
