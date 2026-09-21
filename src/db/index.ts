import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// ============================================================
// اتصال قاعدة البيانات (تحميل مؤجَّل)
// ============================================================
// كان الاتصال يُنشأ — ويُطلق خطأ — عند تحميل الوحدة، وهذا يكسر
// `next build` على أي بيئة بلا قاعدة بيانات (مثل بيئة البناء/CI).
// الآن لا يُنشأ الاتصال إلا عند أول استعلام فعلي، ولا تُقرأ
// متغيّرات البيئة إلا حينها.
//
// المنصة لا تعتمد على قاعدة بيانات لعرض الدروس (المحتوى ملفات TS
// ثابتة)، وقاعدة البيانات محجوزة لميزات لاحقة (تقدّم/صفوف افتراضية).
// ============================================================

type GlobalWithPool = typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

const globalForDb = globalThis as GlobalWithPool;

/** هل تم ضبط متغيّر البيئة DATABASE_URL؟ */
export function isDatabaseConfigured(): boolean {
  return typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL.length > 0;
}

function createPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const created = new Pool({ connectionString: databaseUrl });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = created;
  }

  return created;
}

/** يعيد المِجمّع المشترك، وينشئه عند أول استخدام فقط. */
export function getPool(): Pool {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required");
  }

  return globalForDb.__arenaNextJsPostgresqlPool ?? createPool();
}

let cachedDb: NodePgDatabase | undefined;

/** يعيد كائن Drizzle، وينشئه عند أول استخدام فقط. */
export function getDb(): NodePgDatabase {
  cachedDb ??= drizzle(getPool());
  return cachedDb;
}
