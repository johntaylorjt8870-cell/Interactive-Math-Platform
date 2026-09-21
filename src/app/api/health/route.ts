import { sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@/db";

export const dynamic = "force-dynamic";

// ============================================================
// فحص صحة الخدمة
// ============================================================
// حالات الاستجابة:
//   200 { ok: true,  database: "connected" }      ← كل شيء سليم
//   200 { ok: true,  database: "not-configured" } ← الخدمة تعمل بلا قاعدة بيانات
//   500 { ok: false, database: "unreachable" }    ← مضبوطة لكن الاتصال فشل
//
// فصل حالة «غير مضبوطة» عن «فشل الاتصال» مهم: الأولى ليست عطلًا،
// لأن الدروس تُقدَّم من ملفات ثابتة لا من قاعدة البيانات.
// ============================================================

export async function GET() {
  if (!isDatabaseConfigured()) {
    return Response.json({
      ok: true,
      database: "not-configured",
      note: "المحتوى يُقدَّم من ملفات ثابتة؛ قاعدة البيانات غير مطلوبة لعرض الدروس.",
    });
  }

  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ ok: true, database: "connected" });
  } catch {
    return Response.json({ ok: false, database: "unreachable" }, { status: 500 });
  }
}
