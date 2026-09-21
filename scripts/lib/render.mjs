// ============================================================
// تصيير درس فعليًا للتدقيق — render a lesson through React (Node)
// ============================================================
// يجمّل:  harness العرض + محتوى الدرس + إجابات المعلم (إن وُجدت)
// في حزمة واحدة، ثم يستوردها ويستدعيها.
//
// ملاحظات تصميمية مهمة:
//   • react/react-dom خارج الحزمة (external) ليبقى نسخة React واحدة
//     هي الموجودة في node_modules — لا نسختان متصارعتان.
//   • "server-only" يُستبدل بوحدة فارغة، تمامًا كما يفعل Next في
//     حزمة الخادم، فيمكن تدقيق إجابات المعلم من Node.
//   • الوسم "@/" يُحوَّل إلى src/ كما في tsconfig.
// ============================================================

import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT } from "./bundle.mjs";

const require = createRequire(import.meta.url);
const esbuild = require("esbuild");

const OUT_DIR = join(ROOT, "scripts", ".audit-build");
const SHIM_DIR = join(OUT_DIR, "shims");

/** وحدة فارغة تُستبدل بها حزمة server-only عند التجميع لـ Node. */
function serverOnlyShimPath() {
  mkdirSync(SHIM_DIR, { recursive: true });
  const file = join(SHIM_DIR, "server-only.js");
  writeFileSync(file, "export default {};\n", "utf8");
  return file;
}

let counter = 0;

/**
 * يصيّر كل خطوات درس مسجَّل.
 * @param {string} lessonId معرّف الدرس (يُبحث عنه في src/lessons/<id>/)
 * @returns {Promise<{ rendered: {id:string,kind:string,html:string,error?:string}[], content: object, teacher: object|null }>}
 */
export async function renderLesson(lessonId) {
  const modulePath = join(ROOT, "src", "lessons", lessonId, "content.ts");
  return renderModulePath(modulePath, lessonId);
}

/** يصيّر نموذج العرض التقني (src/dev) — يُستخدم للتحقق من خط التدقيق نفسه. */
export async function renderDevFixture() {
  const modulePath = join(ROOT, "src", "dev", "lesson-fixture.ts");
  return renderModulePath(modulePath, "dev-fixture", "devFixtureContent");
}

async function renderModulePath(modulePath, lessonId, exportName = "default") {
  mkdirSync(OUT_DIR, { recursive: true });
  counter += 1;
  const entry = join(OUT_DIR, `entry-${counter}.tsx`);
  const outfile = join(OUT_DIR, `render-${counter}.mjs`);

  writeFileSync(
    entry,
    `import { renderLessonSteps } from ${JSON.stringify(join(ROOT, "scripts", "harness", "render-steps.tsx"))};
import * as contentModule from ${JSON.stringify(modulePath)};
const content = contentModule.${exportName} ?? contentModule.default ?? contentModule;
const lessonModule = { content, customSteps: contentModule.customSteps };
export const result = renderLessonSteps(lessonModule, {
  lessonTitle: "درس قيد التدقيق",
  subjectTitle: "الجبر",
  unitTitle: "وحدة",
});
`,
    "utf8",
  );

  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    jsx: "automatic",
    logLevel: "silent",
    target: "node20",
    alias: {
      "@": join(ROOT, "src"),
      "server-only": serverOnlyShimPath(),
    },
    external: [
      "react",
      "react-dom",
      "react-dom/server",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  });

  const mod = await import(pathToFileURL(outfile).href);
  const { rendered } = mod.result;
  return { rendered, lessonId };
}

/** يجمع HTML كل الخطوات (للفحص الشامل عبر الخطوات). */
export function allHtml(rendered) {
  return rendered.map((step) => step.html).join("\n<!--step-->\n");
}
