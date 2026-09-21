// ============================================================
// نموذج المحتوى — Content Model
// ============================================================
// هذا الملف يحدّد "شكل" محتوى كل درس.
//
// المبادئ الملزمة المرمّزة في هذه الأنواع:
//
//  1) كتاب الرياضيات هو المصدر المرجعي للمحتوى والترتيب.
//     لذلك كل عنصر يمكن أن يكون من الكتاب يحمل `bookRef` إلزاميًا.
//
//  2) الشرح التدريسي أطول من الكتاب وأعمق — لكنه *إضافة*،
//     ولا يُسمح له أن يحلّ محلّ عنصر من الكتاب.
//     لذلك `provenance` إلزامي على كل مثال/تمرين/شكل:
//       - "book"  → مُصاغ من الكتاب، ويجب أن يبقى ماثلًا (لا حذف ولا اختصار).
//       - "extra" → مثال تعليمي إضافي، ويجب تبريره بسبب مكتوب.
//
//  3) كل خطوة حلّ تحمل تعليلها إلزاميًا (`why`).
//     `why` ليس اختياريًا في النوع، فيستحيل برمجيًا كتابة
//     "نطبق القانون." بلا تفسير — وهذا مقصود.
//
//  4) أسئلة الطالب وتمارينه لا تحمل إجاباتها هنا إطلاقًا.
//     إجابات المعلم تعيش في src/content/teacher/** ولا تُحزَّم مع المتصفح.
//
//  5) الدرس يتكوّن من 20–45 خطوة (Step)، والخطوات تُجمَّع في أقسام
//     لعرضها في الشريط الجانبي.
// ============================================================

/** إصدار نموذج المحتوى — يُزاد عند تغيير الأنواع تغييرًا غير متوافق. */
export const CONTENT_MODEL_VERSION = 1;

// ============================================================
// 1) المصدر — Provenance
// ============================================================

/**
 * مصدر العنصر داخل الدرس.
 *
 * - "book": من الكتاب المدرسي — إلزامي: `bookRef` (مرجع دقيق: صفحة/مثال/تمرين).
 * - "extra": إضافة تعليمية من إعداد المنصة — إلزامي: `reason` (لماذا أُضيف؟).
 *
 * قاعدة صارمة: لا يجوز أبدًا أن يظهر مثال إضافي بشارة "من الكتاب".
 */
export type ContentSource =
  | {
      provenance: "book";
      /** مرجع المصدر كما هو في الكتاب. مثال: "ص 14 — مثال 2" */
      bookRef: string;
      /** رقم الصفحة إن وُجد (يسهّل التحقق الآلي والتقارير). */
      page?: number;
    }
  | {
      provenance: "extra";
      /** تبرير الإضافة التعليمية. مثال: "تثبيت فكرة توحيد المقامات قبل التمرين" */
      reason: string;
    };

/** عنصر من الكتاب المدرسي — النص كما ورد (لا اختصار، لا إعادة صياغة). */
export interface BookItem {
  source: ContentSource & { provenance: "book" };
  /** النص الأصلي من الكتاب — يُقارَن حرفيًا في تدقيق التغطية. */
  text: string;
}

// ============================================================
// 2) خطوات الحل — SolveStep
// ============================================================

/**
 * خطوة واحدة في حل مسألة.
 *
 * `why` إلزامي بالتصميم: كل خطوة رياضية تُبرَّر بسببها
 * (أي قانون؟ لماذا ينطبق هنا؟).
 */
export interface SolveStep {
  /** ما نفعله في هذه الخطوة. */
  action: string;
  /** لماذا نفعله — التعليل الرياضي. إلزامي. */
  why: string;
  /** التعبير الرياضي لهذه الخطوة (يُعرض LTR عبر <MathExpr>). اختياري. */
  math?: string;
}

/**
 * أنواع الحلول — اتحاد مميّز حتى لا نُجبر كل الدروس على قالب واحد
 * (متطلب «لا تُجبر كل درس على قالب متطابق»).
 */
export type WorkedSolution =
  /** حلّ مسألة: معطيات → مطلوب → خطوات → تحقق → جواب نهائي. */
  | {
      kind: "solve";
      /** ما المعطى؟ */
      given?: string;
      /** ما المطلوب؟ */
      required?: string;
      /** الخطوات، كل خطوة بتعليلها. */
      steps: SolveStep[];
      /** الجواب النهائي مصاغًا بوضوح. */
      answer: string;
      /** كيف نتحقق من صحة الجواب؟ */
      check?: string;
    }
  /** برهان هندسي: المطلوب إثباته + الخطوات. */
  | {
      kind: "prove";
      given: string;
      goal: string;
      steps: SolveStep[];
    }
  /** إنشاء/رسم هندسي. */
  | {
      kind: "construct";
      steps: SolveStep[];
      result?: string;
    }
  /** مقارنة أو تصنيف (مثلًا: متطابقة أم معادلة؟ نوع مثلث؟). */
  | {
      kind: "compare";
      items: string[];
      steps: SolveStep[];
      conclusion: string;
    };

// ============================================================
// 3) الأشكال الهندسية — Figure Spec (نظام إحداثيات، لا زخرفة)
// ============================================================

/**
 * رأس/نقطة في الشكل.
 * الإحداثيات هي المصدر الوحيد للحقيقة: كل العلامات (زوايا قائمة،
 * أطوال متساوية، توازٍ) تُشتق حسابيًا من هذه الإحداثيات،
 * ولا تُرسم يدويًا في مواضع تخمينية.
 */
export interface FigurePoint {
  id: string;
  x: number;
  y: number;
  /** التسمية المعروضة (A، B، C…) — تُعرض LTR. */
  label?: string;
  /** موضع التسمية بالنسبة للنقطة (يُحسب تلقائيًا إن لم يُحدَّد). */
  labelOffset?: { dx: number; dy: number };
}

/** قطعة مستقيمة بين نقطتين (أو مستقيم/شعاع/متجه). */
export interface FigureSegment {
  from: string;
  to: string;
  kind?: "segment" | "line" | "ray" | "vector";
  /** إبراز القطعة بلون مختلف (مثلًا: الضلع المطلوب). */
  emphasis?: boolean;
  /** تعليم طول متساوٍ: نفس `group` = نفس عدد العلامات. */
  equalGroup?: string;
  /** علامة توازٍ: نفس `group` = نفس عدد الأسهم. */
  parallelGroup?: string;
  /** قياس مكتوب على القطعة (مثلًا: "5 سم" أو "x"). */
  measure?: string;
  label?: string;
}

/** قوس زاوية عند رأس بين شعاعين — يُرسم رياضيًا من اتجاهي الشعاعين. */
export interface FigureAngle {
  /** رأس الزاوية. */
  vertex: string;
  /** نقطة على الشعاع الأول. */
  from: string;
  /** نقطة على الشعاع الثاني. */
  to: string;
  /** القياس المعروض (مثلًا: "40°" أو "x"). */
  measure?: string;
  /** عدد أقواس العلامة (للتطابق). */
  marks?: number;
  /** قوس مميّز بلون مختلف. */
  emphasis?: boolean;
}

/** علامة زاوية قائمة — تُرسم كمربع صغير مشتق من اتجاهي الشعاعين. */
export interface FigureRightAngle {
  vertex: string;
  from: string;
  to: string;
}

/** دائرة — للمحيط والأقواس. */
export interface FigureCircle {
  center: string;
  /** نقطة على المحيط تحدّد نصف القطر (أو استخدم radius). */
  through?: string;
  radius?: number;
  /** تعليم القوس (اختياري). */
  arcFrom?: string;
  arcTo?: string;
}

/** نص حر داخل الشكل (ملاحظة، قياس زاوية مستقل…). */
export interface FigureText {
  x: number;
  y: number;
  text: string;
  /** "math" يُعرض LTR معزولًا، "ar" عربي في سياق RTL. */
  role?: "math" | "ar";
  anchor?: "start" | "middle" | "end";
  size?: number;
}

/** شكل هندسي كامل — بيانات وصفية تُغذّي مُصيّرًا واحدًا دقيقًا. */
export interface FigureSpec {
  /** [minX, minY, width, height] بنظام إحداثيات رياضي. */
  viewBox: [number, number, number, number];
  /** تشبيك مرجعي (اختياري) — يساعد على القراءة الرياضية. */
  grid?: { step: number } | null;
  points: FigurePoint[];
  segments?: FigureSegment[];
  angles?: FigureAngle[];
  rightAngles?: FigureRightAngle[];
  circles?: FigureCircle[];
  texts?: FigureText[];
  /** وصف نصي للشكل (لإمكانية الوصول وللتدقيق). */
  description?: string;
  /** عنوان صغير يظهر أعلى الشكل. */
  caption?: string;
}

// ============================================================
// 4) الكتل — Blocks (لبّ الشرح)
// ============================================================

/**
 * كتلة محتوى داخل خطوة شرح.
 *
 * ملاحظة معمارية مهمة:
 *   - كل نص عربي يمرّ عبر مكوّن <Mixed> فيعزل المقاطع اللاتينية تلقائيًا.
 *   - كل حقل رياضي (`math`) يمرّ عبر <MathExpr> فيُعرض LTR معزولًا.
 *   - الكسور تُكتب دائمًا بصيغة LaTeX المكدّسة `\frac{...}{...}`،
 *     ويصيِّرها <MathExpr> كبسط فوق خط كسري فوق مقام.
 *     الكسر المسطّح ("1/2") مرفوض: يرصده التدقيق الآلي ويفشل.
 */
export type Block =
  /** نص تفسيري عربي. */
  | { type: "text"; text: string }
  /** عنوان فرعي داخل الخطوة. */
  | { type: "heading"; text: string }
  /** تعريف مصطلح (المصطلح + شرحه + رمزه). */
  | { type: "definition"; term: string; text: string; notation?: MathField }
  /** قانون أو صيغة — تُعرض LTR بارزة. */
  | { type: "formula"; math: MathField; note?: string; source?: ContentSource }
  /** مثال من الكتاب أو مثال إضافي (الفرق ظاهر للمعلّم وللطالب). */
  | { type: "example"; source: ContentSource; title: string; text: string }
  /** ملاحظة مساعدة («لاحظ أن…»). */
  | { type: "note"; text: string }
  /** تحذير من خطأ شائع. */
  | { type: "warning"; text: string }
  /** قائمة نقطية أو مرقّمة. */
  | { type: "list"; items: string[]; ordered?: boolean }
  /** جدول مقارنة/تنظيم. */
  | { type: "table"; headers: string[]; rows: string[][]; caption?: string }
  /** مفاتيح الرموز: الرمز ⇄ معناه. */
  | { type: "symbolLegend"; items: { symbol: MathField; meaning: string }[] }
  /** حلّ محلول كامل بخطوات مبرَّرة. */
  | { type: "worked"; source: ContentSource; title: string; solution: WorkedSolution }
  /** خطأ شائع: الصيغة الخطأ، سببه، الصواب، وطريقة تذكّر. */
  | {
      type: "misconception";
      source: ContentSource;
      wrong: MathField;
      whyWrong: string;
      correct: MathField;
      remember: string;
    }
  /** شكل هندسي مبني على إحداثيات. */
  | { type: "figure"; source: ContentSource; figure: FigureSpec }
  /** إدراج تفاعل تعليمي داخل خطوة الشرح. */
  | { type: "activity"; activity: Activity };

// ============================================================
// 5) الحقول الرياضية — Math fields
// ============================================================

/** نص رياضي بسيط (يُعرض LTR معزولًا). */
export type MathField = string;

/** كسر مكدّس حقيقي: بسط فوق مقام وخط كسري بينهما.
 *  (نوع مساعد لمكوّن <Frac> عند بناء كسر برمجيًا بدل نصّ LaTeX.) */
export interface Fraction {
  num: MathField;
  den: MathField;
}

// ============================================================
// 6) الأنشطة التفاعلية — Activities
// ============================================================
// كل نشاط يحمل `source` إلزاميًا، فلا يدخل تفاعل إلى الدرس
// دون تحديد هل هو من الكتاب أم إضافة تعليمية.

/** عنصر تحقّق سريع (بلا إجابة محفوظة في DOM الطالب قبل الضغط). */
export interface QuickCheckItem {
  id: string;
  ar: string;
  math?: MathField;
  opts: string[];
  /** فهرس الخيار الصحيح — داخل مكوّن تفاعلي تعليمي (يُكشف بعد الإجابة فقط). */
  correct: number;
  why: string;
}

/** سؤال تمرين للطالب — بلا إجابة ولا شرح (الإجابات عند المعلم). */
export interface StudentQuestion {
  id: string;
  ar: string;
  math?: MathField;
  opts: string[];
}

export type AnswerSpec = {
  /** الجواب بالشكل النهائي المعروض للطالب عند الكشف. */
  display: MathField;
  /** صيغ مقبولة للتصحيح الآلي (تُطبَّع عبر normalizeAnswer). */
  accepted: string[];
  /** هل التصحيح بالخيارات بدل الكتابة؟ */
  choices?: string[];
};

export type Activity =
  /** «جرّب بنفسك» — كتابة أو اختيار + كشف الحل المبرَّر. */
  | {
      kind: "tryYourself";
      source: ContentSource;
      prompt: string;
      math?: MathField;
      hint?: string;
      answer: AnswerSpec;
      solution: SolveStep[];
    }
  /** كشف الخطوة التالية — يتابع الطالب خطوات الحل واحدة واحدة. */
  | { kind: "revealSteps"; source: ContentSource; prompt: string; steps: SolveStep[] }
  /** اختر العملية الصحيحة. */
  | {
      kind: "chooseOperation";
      source: ContentSource;
      prompt: string;
      math?: MathField;
      options: string[];
      correct: number;
      why: string;
    }
  /** توقّع قبل الكشف. */
  | {
      kind: "predictReveal";
      source: ContentSource;
      prompt: string;
      choices: string[];
      correct: number;
      reveal: string;
      why: string;
    }
  /** توصيل العناصر المتقابلة. */
  | {
      kind: "matchPairs";
      source: ContentSource;
      prompt: string;
      pairs: { left: string; right: string }[];
    }
  /** «أين الخطأ؟» — اكتشاف الخطأ وتصحيحه. */
  | {
      kind: "mistakeHunt";
      source: ContentSource;
      prompt: string;
      items: { wrong: MathField; correct: MathField; why: string }[];
    }
  /** تحديد علاقة هندسية في شكل. */
  | {
      kind: "figureQuery";
      source: ContentSource;
      prompt: string;
      figure: FigureSpec;
      options: { label: string; correct?: boolean }[];
      why: string;
    }
  /** تحقّق سريع من الفهم. */
  | { kind: "quickCheck"; source: ContentSource; prompt: string; items: QuickCheckItem[] }
  /** تمرين قصير بعد الشرح — الإجابات عند المعلم فقط. */
  | {
      kind: "practiceSet";
      source: ContentSource;
      prompt: string;
      badge?: string;
      questions: StudentQuestion[];
    };

/** استخراج نوع نشاط واحد من اتحاد الأنشطة: ExtractActivity<"quickCheck"> */
export type ExtractActivity<K extends Activity["kind"]> = Extract<Activity, { kind: K }>;
export type ExtractBlock<K extends Block["type"]> = Extract<Block, { type: K }>;
export type ExtractStep<K extends Step["kind"]> = Extract<Step, { kind: K }>;

// ============================================================
// 7) الخطوات — Steps
// ============================================================

/** حقول مشتركة لكل خطوة. */
interface StepBase {  /** معرّف فريد داخل الدرس — يُستخدم في الروابط العميقة وفي تتبّع التقدّم. */
  id: string;
  /** القسم الذي تنتمي إليه الخطوة (يُجمَّع في الشريط الجانبي). */
  section: string;
  /** عنوان الخطوة في الشريط الجانبي والشريط العلوي. */
  title: string;
}

export type Step =
  /** الغلاف. */
  | (StepBase & { kind: "cover"; subtitle?: string; mascot?: string })
  /** أهداف الدرس — من الكتاب، كما وردت. */
  | (StepBase & { kind: "objectives"; items: string[]; note?: string })
  /** خطوة شرح (أساس الدرس). */
  | (StepBase & { kind: "lesson"; lead?: string; blocks: Block[]; tip?: string })
  /** نشاط تفاعلي مستقل بأكمله. */
  | (StepBase & { kind: "interactive"; subtitle?: string; activity: Activity })
  /** تمرين قصير. */
  | (StepBase & { kind: "practice"; subtitle?: string; activity: Activity })
  /** الاختبار الختامي — الأسئلة هنا، الإجابات عند المعلم. */
  | (StepBase & { kind: "quiz"; subtitle?: string; questions: StudentQuestion[] })
  /** ملخّص الدرس. */
  | (StepBase & { kind: "summary"; items: { label: string; text: string }[] })
  /** خاتمة. */
  | (StepBase & { kind: "closing"; text?: string })
  /** خطوة بمكوّن خاص بالدرس (منفذ احتياطي للدروس الاستثنائية). */
  | (StepBase & { kind: "custom"; componentId: string });

// ============================================================
// 8) الدرس — LessonContent
// ============================================================

export interface LessonContent {
  /** يجب أن يطابق معرّف الدرس في src/data/curriculum.ts تمامًا. */
  lessonId: string;
  /** إصدار نموذج المحتوى الذي كُتب عليه هذا الدرس. */
  modelVersion: number;
  /** المصدر المرجعي (الكتاب) — يظهر في سجل التغطية. */
  textbook: {
    title: string;
    grade: string;
    pages?: string;
  };
  /** الخطوات بترتيب الكتاب. */
  steps: Step[];
}

// ============================================================
// 9) أدوات مساعدة على الأنواع
// ============================================================

/** هل هذه الخطوة من الكتاب؟ (تستخدمها الشارات والتدقيق). */
export function isBookSource(source: ContentSource): source is Extract<ContentSource, { provenance: "book" }> {
  return source.provenance === "book";
}

/** هل هذه الخطوة إضافة تعليمية؟ */
export function isExtraSource(source: ContentSource): source is Extract<ContentSource, { provenance: "extra" }> {
  return source.provenance === "extra";
}

/** تجميع الخطوات في أقسام لعرضها في الشريط الجانبي. */
export function groupStepsBySection(steps: Step[]): { section: string; indexes: number[] }[] {
  const groups: { section: string; indexes: number[] }[] = [];
  steps.forEach((step, index) => {
    const last = groups[groups.length - 1];
    if (last && last.section === step.section) last.indexes.push(index);
    else groups.push({ section: step.section, indexes: [index] });
  });
  return groups;
}
