import type { FigureSpec, LessonContent } from "@/content/types";

// ============================================================
// ⚠️ نموذج عرض تقني — DEV FIXTURE (ليس محتوى منهجيًا)
// ============================================================
// الغرض الوحيد: التأكد بأن نظام الخطوات والكتل والرياضيات والأشكال
// يعمل فعليًا قبل أن يُكتب أي درس حقيقي.
//
// هذا الملف **غير مسجَّل** في src/lessons/registry.ts، ومعرّفه
// "dev-fixture" ليس معرّف درس في المنهاج، ولا يُبنى في الإنتاج
// (مسار العرض /dev/lesson-shell مغلق خارج بيئة التطوير).
//
// كل نص هنا وصفي تقني علامةً أنه ليس من الكتاب:
// «نموذج تقني» + bookRef = «—».
// ============================================================

const demoFigure: FigureSpec = {
  caption: "نموذج تقني: مثلث قائم مع علامات مشتقّة حسابيًا",
  description:
    "مثلث قائم الزاوية في B، الضلع AB = 3 والضلع BC = 4، وعلامة الزاوية القائمة مرسومة من اتجاهي الضلعين.",
  viewBox: [-0.6, -0.6, 5.4, 4.2],
  grid: null,
  points: [
    { id: "A", x: 0, y: 0, label: "A" },
    { id: "B", x: 0, y: 3, label: "B" },
    { id: "C", x: 4, y: 3, label: "C" },
  ],
  segments: [
    { from: "A", to: "B", measure: "3", emphasis: false },
    { from: "B", to: "C", measure: "4" },
    { from: "C", to: "A", measure: "5" },
  ],
  rightAngles: [{ vertex: "B", from: "A", to: "C" }],
  angles: [{ vertex: "A", from: "C", to: "B", measure: "36.9°", marks: 1 }],
};

const parallelFigure: FigureSpec = {
  caption: "نموذج تقني: علامتا توازٍ وعلامات أطوال متساوية",
  description: "مستطيل فيه ضلعان متوازيان معلَّمان بعلامة توازٍ، وضلعان بطولين متساويين معلَّمان بشرطتين.",
  viewBox: [-0.6, -0.6, 6.2, 3.6],
  points: [
    { id: "P", x: 0, y: 0, label: "P" },
    { id: "Q", x: 5, y: 0, label: "Q" },
    { id: "R", x: 5, y: 2.6, label: "R" },
    { id: "S", x: 0, y: 2.6, label: "S" },
  ],
  segments: [
    { from: "P", to: "Q", parallelGroup: "a", equalGroup: "x" },
    { from: "Q", to: "R", equalGroup: "y" },
    { from: "R", to: "S", parallelGroup: "a", equalGroup: "x" },
    { from: "S", to: "P", equalGroup: "y" },
  ],
};

export const devFixtureContent: LessonContent = {
  lessonId: "dev-fixture",
  modelVersion: 1,
  textbook: {
    title: "نموذج عرض تقني — ليس كتابًا",
    grade: "—",
    pages: "—",
  },
  steps: [
    {
      kind: "cover",
      id: "cover",
      section: "نموذج تقني",
      title: "عناصر الدرس التفاعلي",
      subtitle: "هذه صفحة عرض للبنية فقط: خطوات، شريط جانبي، رياضيات، أشكال، وتفاعلات.",
      mascot: "🧪",
    },
    {
      kind: "objectives",
      id: "objectives",
      section: "نموذج تقني",
      title: "ما الذي يعرضه هذا النموذج؟",
      items: [
        "خطوات منفصلة مع شريط جانبي وسابق/التالي (لا صفحة طويلة ولا مراسي).",
        "عرض الكسور ككسور مكدّسة حقيقية، والمعادلات والمتباينات LTR معزولة.",
        "أشكال هندسية مبنية على إحداثيات مع علامات مشتقّة حسابيًا.",
        "تفاعلات تعليمية لا تكشف حلّها قبل تصرّف الطالب.",
      ],
      note: "نصوص هذا النموذج وصفية تقنية، وليست محتوى منهجيًا.",
    },
    {
      kind: "lesson",
      id: "math-demo",
      section: "عرض المكوّنات",
      title: "الرياضيات: كسور ومعادلات ومتباينات",
      lead: "نموذج تقني لطريقة العرض، لا لطريقة الشرح المنهجي.",
      blocks: [
        {
          type: "formula",
          math: "\\frac{a}{b} \\times \\frac{c}{d} = \\frac{a \\times c}{b \\times d}",
          note: "نموذج تقني: كسران مكدّسان بعملية ضرب.",
        },
        {
          type: "text",
          text: "كسر مكدّس داخل جملة عربية: القيمة $\\frac{1}{2}$ تساوي نصفًا. لاحظ أن الترتيب لا ينعكس داخل النص العربي.",
        },
        {
          type: "formula",
          math: "2x + 3 = 11 \\;\\Rightarrow\\; x = 4",
          note: "نموذج تقني: معادلة تُعرض LTR معزولة.",
        },
        {
          type: "formula",
          math: "x + 3 \\le 7 \\;\\Rightarrow\\; x \\le 4",
          note: "نموذج تقني: متباينة ورمز ≤ ورمز الاستنتاج.",
        },
        {
          type: "definition",
          term: "عنصر تعريفي",
          text: "قالب عرض لتعريف مصطلح مع رمزه الرياضي.",
          notation: "\\sqrt[3]{27} = 3",
        },
        {
          type: "example",
          source: { provenance: "book", bookRef: "—", page: 0 },
          title: "قالب مثال كتابي",
          text: "قالب العرض لمثال يُنقل من الكتاب حرفيًا، ويظهر بشارة «من الكتاب» مع مرجع الصفحة.",
        },
        {
          type: "example",
          source: { provenance: "extra", reason: "قالب عرض فقط" },
          title: "قالب مثال إضافي",
          text: "قالب العرض لمثال تعليمي إضافي، ويظهر بشارة «توضيح إضافي» مع سبب الإضافة — فلا يُخلط بينه وبين الكتاب.",
        },
        {
          type: "worked",
          source: { provenance: "extra", reason: "قالب عرض لخطوات الحل" },
          title: "قالب حلّ محلول بتعليل كل خطوة",
          solution: {
            kind: "solve",
            given: "المعادلة 2x + 3 = 11",
            required: "قيمة x",
            steps: [
              {
                action: "نطرح 3 من الطرفين",
                why: "لأن الهدف عزل الحدّ الذي يحتوي x، والطرح من الطرفين يحفظ التساوي.",
                math: "2x + 3 - 3 = 11 - 3",
              },
              {
                action: "نبسّط الطرفين",
                why: "يجمع المتشابهات فيبقى الحدّ المطلوب وحده في طرف.",
                math: "2x = 8",
              },
              {
                action: "نقسم الطرفين على 2",
                why: "معامل x هو 2، والقسمة على المعامل تعطي قيمة x مباشرة.",
                math: "\\frac{2x}{2} = \\frac{8}{2}",
              },
              {
                action: "نستنتج قيمة x",
                why: "بعد التبسيط يظهر الجواب في أبسط صورة.",
                math: "x = 4",
              },
            ],
            answer: "x = 4",
            check: "نعوّض في الأصل: 2(4) + 3 = 11 ✓ — التعويض يتحقق من صحة الجواب.",
          },
        },
        {
          type: "misconception",
          source: { provenance: "extra", reason: "قالب عرض للخطأ الشائع" },
          wrong: "\\frac{1}{2} + \\frac{1}{3} = \\frac{2}{5}",
          whyWrong: "جمعنا البسطين والمقامين بلا توحيد مقامات، وهذا يخالف معنى الكسر.",
          correct: "\\frac{1}{2} + \\frac{1}{3} = \\frac{3}{6} + \\frac{2}{6} = \\frac{5}{6}",
          remember: "قبل الجمع: وحّد المقامات. الكسر لا يُجمع بجمع المقامين.",
        },
        {
          type: "figure",
          source: { provenance: "extra", reason: "قالب عرض لشكل هندسي" },
          figure: demoFigure,
        },
        {
          type: "activity",
          activity: {
            kind: "quickCheck",
            source: { provenance: "extra", reason: "قالب عرض لتفاعل تحقّق" },
            prompt: "نموذج تقني: تحقّق سريع من فهم العرض.",
            items: [
              {
                id: "q1",
                ar: "ما قيمة $\\frac{2}{4}$ في أبسط صورة؟",
                opts: ["\\frac{1}{2}", "\\frac{2}{4}", "\\frac{1}{4}"],
                correct: 0,
                why: "القسمة على 2 في البسط والمقام تعطي الصورة الأبسط.",
              },
            ],
          },
        },
      ],
      tip: "هذا النموذج تقني بالكامل، ولا يُستخدم في أي درس حقيقي.",
    },
    {
      kind: "lesson",
      id: "geometry-demo",
      section: "عرض المكوّنات",
      title: "الهندسة: أشكال وعلامات مشتقّة",
      blocks: [
        {
          type: "text",
          text: "العلامات أدناه ليست زخرفة: علامة الزاوية القائمة بُنيت من متجهَي الضلعين، وعلامات التوازي والأطوال المتساوية حُسبت من منتصف كل قطعة واتجاهها.",
        },
        {
          type: "figure",
          source: { provenance: "extra", reason: "قالب عرض لعلامة الزاوية القائمة" },
          figure: demoFigure,
        },
        {
          type: "figure",
          source: { provenance: "extra", reason: "قالب عرض لعلامات التوازي والتطابق" },
          figure: parallelFigure,
        },
        {
          type: "activity",
          activity: {
            kind: "figureQuery",
            source: { provenance: "extra", reason: "قالب عرض سؤال على شكل" },
            prompt: "نموذج تقني: حدّد العبارة الصحيحة عن الشكل الأول.",
            figure: demoFigure,
            options: [
              { label: "الزاوية عند B قائمة", correct: true },
              { label: "الضلع AC أقصر ضلع في المثلث", correct: false },
            ],
            why: "علامة المربع عند B تعني زاوية قائمة بُنيت من اتجاهي BA و BC.",
          },
        },
      ],
    },
    {
      kind: "interactive",
      id: "try-demo",
      section: "عرض المكوّنات",
      title: "تفاعل: جرّب بنفسك",
      subtitle: "نموذج تقني لتفاعل الكتابة والتحقق (يقبل الأرقام العربية والغربية).",
      activity: {
        kind: "tryYourself",
        source: { provenance: "extra", reason: "قالب عرض لتفاعل جرّب بنفسك" },
        prompt: "نموذج تقني: حلّ المعادلة $y + 5 = 9$. (اكتب الجواب بأي شكل: ٤ أو 4)",
        hint: "اطرح 5 من الطرفين ثم بسّط.",
        answer: { display: "y = 4", accepted: ["4", "y = 4", "y=4"] },
        solution: [
          {
            action: "نطرح 5 من الطرفين",
            why: "لعزل y مع الحفاظ على التساوي.",
            math: "y + 5 - 5 = 9 - 5",
          },
          {
            action: "نبسّط",
            why: "نجمع المتشابهات.",
            math: "y = 4",
          },
        ],
      },
    },
    {
      kind: "practice",
      id: "practice-demo",
      section: "عرض المكوّنات",
      title: "تمرين: إجابات على الخادم فقط",
      subtitle: "نموذج تقني: التمرين يرسل إجاباتك إلى الخادم؛ ولا توجد أي إجابة في هذه الصفحة.",
      activity: {
        kind: "practiceSet",
        source: { provenance: "extra", reason: "قالب عرض للتمرين" },
        prompt: "نموذج تقني: سؤالان يعرضان مسار التصحيح على الخادم.",
        badge: "نموذج",
        questions: [
          { id: "p1", ar: "نموذج: أيّ كسر يساوي 0.5 ؟", opts: ["\\frac{1}{2}", "\\frac{1}{3}", "\\frac{2}{3}"] },
          { id: "p2", ar: "نموذج: حل المعادلة z - 2 = 6.", opts: ["8", "4", "-8"] },
        ],
      },
    },
    {
      kind: "quiz",
      id: "quiz-demo",
      section: "عرض المكوّنات",
      title: "اختبار ختامي وفضاء المعلم",
      subtitle: "نموذج تقني: الاختبار وفضاء المعلم يعملان بلا أي إجابة داخل الحزمة.",
      questions: [
        { id: "z1", ar: "نموذج: ما ناتج $\\frac{1}{4} + \\frac{1}{4}$ ؟", opts: ["\\frac{1}{2}", "\\frac{2}{8}", "\\frac{1}{8}"] },
        { id: "z2", ar: "نموذج: أيّ رمز يعني «أصغر من أو يساوي»؟", opts: ["\\le", "\\ge", "\\ne"] },
      ],
    },
    {
      kind: "summary",
      id: "summary",
      section: "الخاتمة",
      title: "ملخّص النموذج التقني",
      items: [
        { label: "التنقّل", text: "خطوات مستقلة + شريط جانبي + سابق/التالي + لوحة مفاتيح." },
        { label: "الرياضيات", text: "كسور مكدّسة، معادلات ومتباينات LTR معزولة، متغيرات مائلة." },
        { label: "الهندسة", text: "أشكال ببيانات إحداثية وعلامات مشتقّة حسابيًا." },
        { label: "المصدر", text: "كل مثال أو شكل يحمل شارة «من الكتاب» أو «توضيح إضافي»." },
        { label: "الإجابات", text: "لا إجابات في المتصفح: التصحيح على الخادم، والمفتاح الكامل لفضاء المعلم." },
      ],
    },
    {
      kind: "closing",
      id: "closing",
      section: "الخاتمة",
      title: "نهاية النموذج",
      text: "هذه نهاية العرض التقني. الدروس الحقيقية تُضاف لاحقًا بمعرّفات المنهاج نفسها، مع سجل تغطية وتدقيق آلي.",
    },
  ],
};
