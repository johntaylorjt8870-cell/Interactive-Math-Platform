// ============================================================
// أداة مساعدة للتدقيق — bundle a TypeScript module for Node
// ============================================================
// سكربتات التدقيق تعمل على ملفات .ts مباشرة: تُجمَّع بـ esbuild
// إلى وحدة ESM مؤقتة ثم تُستورَد في Node.
// السبب: نريد فحص *القيم الفعلية* (خطوات الحل، الأشكال، الكسور)
// لا فحص نص الملف بتعابير نمطية هشّة.
// ============================================================

import { createRequire } from "node:module";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const esbuild = require("esbuild");

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT_DIR = join(ROOT, "scripts", ".audit-build");

let counter = 0;

function serverOnlyShimPath() {
  const shimDir = join(OUT_DIR, "shims");
  mkdirSync(shimDir, { recursive: true });
  const file = join(shimDir, "server-only.js");
  writeFileSync(file, "export default {};\n", "utf8");
  return file;
}

/**
 * يجمّل وحدة ويستوردها.
 * @param {string} entry مسار الملف المطلق
 * @param {string[]} exported أسماء الصادرات المطلوبة
 */
export async function importModule(entry, exported = []) {
  mkdirSync(OUT_DIR, { recursive: true });
  counter += 1;
  const outfile = join(OUT_DIR, `bundle-${counter}.mjs`);

  // نصدّر الأسماء المطلوبة بإسناد صريح (لا بـ export { name })
  // لأن الأسماء غير موجودة في نطاق هذا الملف الوسيط.
  const exportList = exported.map((name) => `export const ${name} = __mod.${name};`).join("\n");
  const contents = `import * as __mod from ${JSON.stringify(entry)};\n${exportList}\nexport default __mod.default ?? null;`;

  await esbuild.build({
    stdin: { contents, resolveDir: ROOT, loader: "ts" },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    jsx: "automatic",
    packages: "external",
    alias: {
      "@": join(ROOT, "src"),
      "server-only": serverOnlyShimPath(),
    },
    logLevel: "silent",
  });

  const mod = await import(pathToFileURL(outfile).href);
  return mod;
}

/** ينظّف ملفات البناء المؤقتة. */
export function cleanBundles() {
  rmSync(OUT_DIR, { recursive: true, force: true });
}

/** ألوان بسيطة للتقرير. */
export const colors = {
  green: (s) => `\u001b[32m${s}\u001b[0m`,
  red: (s) => `\u001b[31m${s}\u001b[0m`,
  yellow: (s) => `\u001b[33m${s}\u001b[0m`,
  dim: (s) => `\u001b[2m${s}\u001b[0m`,
};

/** مطبِّع نص للمقارنة: يحذف الفراغات ومحارف الاتجاه والتشكيل. */
export function normalizeText(value) {
  return String(value)
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\u0640]/g, "")
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/\s+/g, "")
    .trim();
}
