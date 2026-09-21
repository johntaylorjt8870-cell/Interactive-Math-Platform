// ============================================================
// محلّل التعبيرات الرياضية — Mini math parser
// ============================================================
// لماذا محلّل صغير خاص بنا؟
//
//  - بيانات الدرس تبقى نصوصًا (JSON/TS) قابلة للتدقيق الآلي،
//    لا مكوّنات React مبثوثة في البيانات.
//  - الكسور تُكتب \frac{1}{2} فتُرسم مكدّسة (بسط فوق مقام)،
//    ويستطيع التدقيق الآلي رفض أي كسر مسطّح مثل "1/2".
//  - الصيغة **مجموعة جزئية صارمة من LaTeX/KaTeX**، لذا لو قرّرنا
//    لاحقًا استخدام KaTeX فلن تتغيّر أي بيانات — يتغيّر المُصيّر فقط.
//
// المدعوم (فقط ما يحتاجه منهاج الصف الثامن):
//   أعداد · متغيرات (تُعرض مائلة رياضياً) · عمليات + - * × ÷
//   علاقات = ≠ < > ≤ ≥ ≈ · أقواس ( ) [ ] · قيم مطلقة | |
//   \frac{a}{b}  \sqrt{x}  \sqrt[n]{x}  a^{b}  a_{b}
//   \times \cdot \div \pm \mp \le \ge \ne \approx \equiv
//   \pi \theta \alpha \beta \gamma \Delta \lambda \mu
//   \angle \parallel \perp \triangle \circ \deg \% \{ \}
//   \overline{AB} \vec{AB} \text{سم}
//
// أي أمر غير معروف لا يُسقط العرض: يُعرض كنص حرفي ويُعلَّم
// (`unknown`) ليرصده تدقيق المحتوى.
// ============================================================

export type MathNode =
  | { t: "num"; v: string }
  | { t: "ident"; v: string }
  | { t: "op"; v: string }
  | { t: "rel"; v: string }
  | { t: "fn"; v: string; display: string; spaced: boolean }
  | { t: "greek"; v: string; display: string }
  | { t: "frac"; num: MathNode[]; den: MathNode[] }
  | { t: "sqrt"; body: MathNode[]; index?: MathNode[] }
  | { t: "group"; body: MathNode[]; open: string; close: string }
  | { t: "sup"; base: MathNode[]; sup: MathNode[] }
  | { t: "sub"; base: MathNode[]; sub: MathNode[] }
  | { t: "subsup"; base: MathNode[]; sub: MathNode[]; sup: MathNode[] }
  | { t: "decor"; kind: "overline" | "vec"; body: MathNode[] }
  | { t: "text"; v: string }
  | { t: "unknown"; v: string };

/** أوامر لا تحمل معنى بصرياً (تُهمل). */
const IGNORED_COMMANDS = new Set(["left", "right", "displaystyle", "limits", "!"]);
/** أوامر تُعرض كرموز/كلمات. spaced = تُحاط بمسافات رياضية. */
const SYMBOL_COMMANDS: Record<string, { display: string; spaced: boolean }> = {
  times: { display: "×", spaced: true },
  cdot: { display: "·", spaced: true },
  div: { display: "÷", spaced: true },
  pm: { display: "±", spaced: true },
  mp: { display: "∓", spaced: true },
  le: { display: "≤", spaced: true },
  leq: { display: "≤", spaced: true },
  ge: { display: "≥", spaced: true },
  geq: { display: "≥", spaced: true },
  ne: { display: "≠", spaced: true },
  neq: { display: "≠", spaced: true },
  approx: { display: "≈", spaced: true },
  equiv: { display: "≡", spaced: true },
  Rightarrow: { display: "⇒", spaced: true },
  implies: { display: "⇒", spaced: true },
  rightarrow: { display: "→", spaced: true },
  to: { display: "→", spaced: true },
  leftarrow: { display: "←", spaced: true },
  angle: { display: "∠", spaced: false },
  parallel: { display: "∥", spaced: false },
  perp: { display: "⊥", spaced: false },
  triangle: { display: "△", spaced: false },
  circ: { display: "°", spaced: false },
  deg: { display: "°", spaced: false },
  percent: { display: "%", spaced: false },
  " ": { display: " ", spaced: false },
  ",": { display: ",", spaced: false },
  ";": { display: ";", spaced: false },
  "{": { display: "{", spaced: false },
  "}": { display: "}", spaced: false },
  "%": { display: "%", spaced: false },
  lbrace: { display: "{", spaced: false },
  rbrace: { display: "}", spaced: false },
};
/** حروف يونانية. */
const GREEK: Record<string, string> = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  Delta: "Δ",
  epsilon: "ε",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  lambda: "λ",
  mu: "μ",
  pi: "π",
  rho: "ρ",
  sigma: "σ",
  Sigma: "Σ",
  tau: "τ",
  phi: "φ",
  omega: "ω",
  Omega: "Ω",
};
/** أوامر الفراغ (LaTeX spacing) — تُعرض كفراغات ثابتة العرض. */
const CSSSIZE: Record<string, string> = {
  quad: "\u2003",
  qquad: "\u2003\u2003",
  ",": "\u2009",
  ":": "\u2005",
  ";": "\u2005",
};

class Parser {
  private index = 0;
  private readonly src: string;

  constructor(src: string) {
    this.src = src;
  }

  parse(): MathNode[] {
    return this.parseSequence(() => false);
  }

  /** يقرأ حتى نهاية النص أو حتى لقاء أحد رموز الإيقاف. */
  private parseSequence(stop: () => boolean): MathNode[] {
    const nodes: MathNode[] = [];
    while (this.index < this.src.length && !stop()) {
      const char = this.src[this.index];
      if (char === " ") {
        this.index += 1;
        continue;
      }
      const atom = this.parseAtom();
      if (!atom) continue;
      nodes.push(this.parseScripts(atom));
    }
    return nodes;
  }

  /** يربط ^ و _ بالذرّة السابقة (x^2 ، a_{n+1}). */
  private parseScripts(base: MathNode): MathNode {
    let sub: MathNode[] | undefined;
    let sup: MathNode[] | undefined;
    for (let guard = 0; guard < 2; guard += 1) {
      const char = this.src[this.index];
      if (char === "^") {
        this.index += 1;
        sup = this.parseScriptArgument();
      } else if (char === "_") {
        this.index += 1;
        sub = this.parseScriptArgument();
      } else break;
    }
    if (sub && sup) return { t: "subsup", base: [base], sub, sup };
    if (sup) return { t: "sup", base: [base], sup };
    if (sub) return { t: "sub", base: [base], sub };
    return base;
  }

  private parseScriptArgument(): MathNode[] {
    if (this.src[this.index] === "{") {
      this.index += 1;
      const body = this.parseSequence(() => this.src[this.index] === "}");
      if (this.src[this.index] === "}") this.index += 1;
      return body;
    }
    const atom = this.parseAtom();
    return atom ? [atom] : [];
  }

  private parseAtom(): MathNode | null {
    const char = this.src[this.index];
    if (char === undefined) return null;

    // أمر LaTeX
    if (char === "\\") {
      const name = this.readCommandName();
      if (name === "frac") return this.parseFrac();
      if (name === "sqrt") return this.parseSqrt();
      if (name === "text") return this.parseText();
      if (name === "overline" || name === "vec") {
        const body = this.readBraced();
        return { t: "decor", kind: name === "vec" ? "vec" : "overline", body };
      }
      if (IGNORED_COMMANDS.has(name)) return this.parseAtom();
      const spacing = CSSSIZE[name];
      if (spacing) return { t: "text", v: spacing };
      if (GREEK[name]) return { t: "greek", v: name, display: GREEK[name] };
      const symbol = SYMBOL_COMMANDS[name];
      if (symbol) return { t: "fn", v: name, display: symbol.display, spaced: symbol.spaced };
      return { t: "unknown", v: `\\${name}` };
    }

    // قوس فتح
    if (char === "(" || char === "[" || char === "|") {
      const close = char === "(" ? ")" : char === "[" ? "]" : "|";
      this.index += 1;
      const body = this.parseSequence(() => this.src[this.index] === close);
      if (this.src[this.index] === close) this.index += 1;
      return { t: "group", body, open: char, close };
    }
    // قوس إغلاق بلا فتح — نعرضه كما هو بدل الانهيار
    if (char === ")" || char === "]" || char === "}") {
      this.index += 1;
      return { t: "text", v: char };
    }

    // عدد (يشمل الفاصلة العشرية)
    if (/[0-9]/.test(char)) {
      let value = "";
      while (this.index < this.src.length && /[0-9]/.test(this.src[this.index])) {
        value += this.src[this.index];
        this.index += 1;
      }
      if (this.src[this.index] === "." && /[0-9]/.test(this.src[this.index + 1] ?? "")) {
        value += ".";
        this.index += 1;
        while (this.index < this.src.length && /[0-9]/.test(this.src[this.index])) {
          value += this.src[this.index];
          this.index += 1;
        }
      }
      return { t: "num", v: value };
    }

    // متغير لاتيني (يُعرض مائلًا)
    if (/[A-Za-z]/.test(char)) {
      this.index += 1;
      return { t: "ident", v: char };
    }

    // عملية حسابية
    if ("+-*/=".includes(char)) {
      this.index += 1;
      if (char === "=") return { t: "rel", v: "=" };
      return { t: "op", v: char };
    }

    // علاقات يقارن بها الطالب مباشرة على لوحة المفاتيح
    if ("<>≠≤≥≈".includes(char)) {
      this.index += 1;
      return { t: "rel", v: char };
    }

    // رموز متنوعة
    if (char === "°" || char === "∠" || char === "∥" || char === "⊥" || char === "△" || char === "π") {
      this.index += 1;
      return { t: "fn", v: char, display: char, spaced: false };
    }
    if (char === "," || char === ";" || char === "!" || char === "'") {
      this.index += 1;
      return { t: "text", v: char };
    }

    this.index += 1;
    return { t: "unknown", v: char };
  }

  private readCommandName(): string {
    this.index += 1; // تجاوز \
    let name = "";
    if (this.index < this.src.length && !/[A-Za-z]/.test(this.src[this.index])) {
      // أمر من محرف واحد: \{ \} \, \% \:
      name = this.src[this.index];
      this.index += 1;
      return name;
    }
    while (this.index < this.src.length && /[A-Za-z]/.test(this.src[this.index])) {
      name += this.src[this.index];
      this.index += 1;
    }
    return name;
  }

  private parseFrac(): MathNode {
    const num = this.readBraced();
    const den = this.readBraced();
    return { t: "frac", num, den };
  }

  private parseSqrt(): MathNode {
    // جذر من الدرجة n: \sqrt[3]{8}
    let index: MathNode[] | undefined;
    if (this.src[this.index] === "[") {
      this.index += 1;
      index = this.parseSequence(() => this.src[this.index] === "]");
      if (this.src[this.index] === "]") this.index += 1;
    }
    const body = this.readBraced();
    return { t: "sqrt", body, index };
  }

  private parseText(): MathNode {
    // \text{سم} — نص عربي داخل تعبير رياضي
    const nodes = this.readBraced();
    const value = linearize(nodes).trim();
    return { t: "text", v: value };
  }

  private readBraced(): MathNode[] {
    if (this.src[this.index] !== "{") {
      const atom = this.parseAtom();
      return atom ? [atom] : [];
    }
    this.index += 1;
    const body = this.parseSequence(() => this.src[this.index] === "}");
    if (this.src[this.index] === "}") this.index += 1;
    return body;
  }
}

/**
 * يحلّل نصًا رياضيًا إلى شجرة عرض.
 */
export function parseMath(source: string): MathNode[] {
  return new Parser(source).parse();
}

/** صيغة خطّية (لـ aria-label وللتدقيق). 1/2 بدل الكسر المكدّس. */
export function linearize(nodes: MathNode[]): string {
  return nodes
    .map((node) => {
      switch (node.t) {
        case "num":
        case "ident":
        case "op":
        case "rel":
        case "text":
          return node.v;
        case "fn":
        case "greek":
          return node.display;
        case "unknown":
          return node.v;
        case "group":
          return `${node.open}${linearize(node.body)}${node.close}`;
        case "frac":
          return `${linearize(node.num)}/${linearize(node.den)}`;
        case "sqrt":
          return node.index
            ? `${linearize(node.index)}√(${linearize(node.body)})`
            : `√(${linearize(node.body)})`;
        case "sup":
          return `${linearize(node.base)}^${linearize(node.sup)}`;
        case "sub":
          return `${linearize(node.base)}_${linearize(node.sub)}`;
        case "subsup":
          return `${linearize(node.base)}_${linearize(node.sub)}^${linearize(node.sup)}`;
        case "decor":
          return node.kind === "vec" ? `${linearize(node.body)}→` : `${linearize(node.body)}‾`;
        default:
          return "";
      }
    })
    .join("");
}

/** أوامر LaTeX المعروفة — يستخدمها تدقيق المحتوى لرصد الأوامر المجهولة. */
export const KNOWN_COMMANDS: string[] = [
  ...Object.keys(SYMBOL_COMMANDS),
  ...Object.keys(GREEK),
  ...Object.keys(CSSSIZE),
  ...IGNORED_COMMANDS,
  "frac",
  "sqrt",
  "text",
  "overline",
  "vec",
];

/** يجمع كل أوامر LaTeX الموجودة في نص (بما فيها الأوامر المجهولة). */
export function collectCommands(source: string): string[] {
  const found = new Set<string>();
  const re = /\\([A-Za-z]+|.)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) found.add(match[1]);
  return [...found];
}

/** يقشّر الأوامر من نص — للمقارنة النصية في التدقيق. */
export function stripCommands(source: string): string {
  return source.replace(/\\[A-Za-z]+/g, " ").replace(/[{}]/g, " ");
}
