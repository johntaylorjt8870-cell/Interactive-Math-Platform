import { NextResponse } from "next/server";
import {
  GATE_COOKIE_MAX_AGE_SECONDS,
  GATE_COOKIE_NAME,
  gateCookieOptions,
  getGateMode,
  readSitePassword,
  safeNextPath,
} from "@/lib/gate/config";
import { createGateCookieValue, isCorrectSitePassword } from "@/lib/gate/token";

// ============================================================
// POST /api/gate — تسجيل الدخول إلى الموقع
// ============================================================
// الطلب: { "password": "…", "next": "/algebra" }
//   • كلمة المرور تُقارَن على الخادم فقط — لا تُرسل أبدًا إلى العميل.
//   • عند النجاح: كوكي HttpOnly موقَّع + المسار الآمن للعودة.
//   • عند الفشل: 401، ورسالة عامة بلا أي تفصيل عن السبب.
//
// إن لم تُضبط كلمة المرور على الخادم → 503 (مقفل، لا احتياطي).
//
// هذا المسار مسؤول عن بوابة الموقع وحدها. لا علاقة له بـ
// /api/teacher-key ولا بـ TEACHER_KEY_PASSWORD — الحمايتان منفصلتان تمامًا.
// ============================================================

export const dynamic = "force-dynamic";

interface GateRequestBody {
  password?: unknown;
  next?: unknown;
}

/** لا نخزّن ردود المصادقة في أي وسيط تخزين. */
const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function POST(request: Request) {
  const isProduction = process.env.NODE_ENV === "production";
  const sitePassword = readSitePassword();
  const mode = getGateMode({ isProduction, sitePassword });

  if (mode !== "enabled") {
    return NextResponse.json(
      { ok: false, error: "not_configured" },
      { status: 503, headers: NO_STORE },
    );
  }

  let body: GateRequestBody;
  try {
    body = (await request.json()) as GateRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad_request" },
      { status: 400, headers: NO_STORE },
    );
  }

  const submitted = typeof body.password === "string" ? body.password : "";
  if (submitted.length === 0) {
    return NextResponse.json(
      { ok: false, error: "missing_password" },
      { status: 400, headers: NO_STORE },
    );
  }

  const expiresAt = Date.now() + GATE_COOKIE_MAX_AGE_SECONDS * 1000;
  const accepted = await isCorrectSitePassword({ secret: sitePassword, submitted, expiresAt });

  if (!accepted) {
    // رسالة واحدة موحّدة — لا نفرّق بين «كلمة خاطئة» و«كلمة ناقصة» في الردّ.
    return NextResponse.json(
      { ok: false, error: "invalid_password" },
      { status: 401, headers: NO_STORE },
    );
  }

  const response = NextResponse.json(
    {
      ok: true,
      next: safeNextPath(typeof body.next === "string" ? body.next : null),
    },
    { headers: NO_STORE },
  );

  // القيمة موقَّعة تشفيريًا ولا تحمل كلمة المرور إطلاقًا.
  response.cookies.set({
    name: GATE_COOKIE_NAME,
    value: await createGateCookieValue(sitePassword, expiresAt),
    ...gateCookieOptions(isProduction),
  });

  return response;
}
