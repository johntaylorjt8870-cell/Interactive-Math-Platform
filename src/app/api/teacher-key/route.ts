import { timingSafeEqual } from "node:crypto";
import { loadTeacherDataset } from "@/content/teacher";

// ============================================================
// POST /api/teacher-key — المفتاح الكامل للمعلم
// ============================================================
// بوابة بسيطة لكلمة مرور المعلم. المفتاح لا يُرسل إلا بعد نجاح
// التحقق، ولا يوجد أي مسار يُرسل الإجابات تلقائيًا مع الصفحة.
//
// إن لم يُضبط TEACHER_KEY_PASSWORD في البيئة، يُقفل المسار (503)
// — لا يوجد مفتاح افتراضي، ولا كلمة مرور مكتوبة في الكود.
// ============================================================

export const dynamic = "force-dynamic";

interface TeacherKeyBody {
  lessonId?: unknown;
  password?: unknown;
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export async function POST(request: Request) {
  const expected = process.env.TEACHER_KEY_PASSWORD;
  if (!expected) {
    return Response.json(
      { error: "not_configured", message: "مفتاح المعلم غير مُهيّأ على الخادم" },
      { status: 503 },
    );
  }

  let body: TeacherKeyBody;
  try {
    body = (await request.json()) as TeacherKeyBody;
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const lessonId = typeof body.lessonId === "string" ? body.lessonId : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!lessonId || !password) {
    return Response.json({ error: "missing_fields" }, { status: 400 });
  }

  if (!safeEqual(password, expected)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const dataset = await loadTeacherDataset(lessonId);
  if (!dataset) {
    return Response.json({ error: "unknown_lesson" }, { status: 404 });
  }

  return Response.json(dataset);
}
