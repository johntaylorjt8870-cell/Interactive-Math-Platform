"use client";

import { useState } from "react";

// ============================================================
// نموذج الدخول — بوابة الموقع
// ============================================================
// مكوّن عميل: لا يعرف كلمة المرور، ولا يقرأها من أي مكان.
// يرسل ما كتبه المستخدم إلى /api/gate، والخادم وحده يقرّر.
//
// الواجهة عربية RTL (الوراثة من <html dir="rtl">)، أمّا حقل كلمة
// المرور فمضبوط `dir="ltr"` لأن كلمات المرور لاتينية/أرقام عادةً،
// وقاعدة العزل في globals.css تمنع تأثّرها بسياق RTL.
// ============================================================

interface GateFormProps {
  /** المسار الآمن للعودة إليه بعد الدخول — مُعقَّم على الخادم. */
  nextPath: string;
}

interface GateResponseBody {
  ok?: boolean;
  next?: string;
  error?: string;
}

/** رسالة الفشل — عامة عن قصد، ولا تكشف أي تفصيل عن الإعداد. */
function describeError(code: string | undefined): string {
  if (code === "not_configured") return "بوابة الموقع غير مُهيّأة على الخادم بعد.";
  if (code === "missing_password") return "أدخل كلمة المرور أولًا.";
  if (code === "bad_request") return "تعذّر إرسال الطلب. أعد المحاولة.";
  return "كلمة المرور غير صحيحة. حاول مرة أخرى.";
}

export default function GateForm({ nextPath }: GateFormProps) {
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (checking) return;

    setChecking(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: value, next: nextPath }),
      });
      const payload = (await response.json()) as GateResponseBody;

      if (!response.ok || payload.ok !== true) {
        setChecking(false);
        setErrorMessage(describeError(payload.error));
        return;
      }

      // تنقّل كامل بالمتصفح (لا تنقّل داخلي في الراوتر):
      // يضمن أن أول طلب للمسار المطلوب يحمل الكوكي الجديد فعلًا،
      // بلا أي احتمال لصفحة مخزّنة مؤقتًا من قبل الدخول.
      window.location.assign(payload.next ?? nextPath);
    } catch {
      setChecking(false);
      setErrorMessage("تعذّر الاتصال بالخادم. تحقّق من الشبكة ثم أعد المحاولة.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="h-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-teal-500" aria-hidden="true" />

          <div className="p-7 sm:p-9">
            <div className="mb-6 text-center">
              <div
                className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-indigo-100 bg-indigo-50 shadow-sm"
                aria-hidden="true"
              >
                <span className="text-3xl leading-none">🔒</span>
              </div>

              <h1 className="mb-2 text-2xl font-black text-slate-900">هذا الموقع محمي</h1>
              <p className="text-sm leading-relaxed text-slate-500">
                أدخل كلمة المرور للمتابعة
              </p>
            </div>

            <form onSubmit={submit} noValidate>
              <div className="mb-4">
                <label htmlFor="gate-password" className="mb-2 block text-sm font-bold text-slate-700">
                  كلمة المرور
                </label>
                <input
                  id="gate-password"
                  type="password"
                  name="site-password"
                  dir="ltr"
                  autoComplete="current-password"
                  autoFocus
                  required
                  disabled={checking}
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  aria-invalid={errorMessage.length > 0}
                  aria-describedby={errorMessage.length > 0 ? "gate-error" : undefined}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-left font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 disabled:opacity-60"
                  placeholder="••••••••"
                />
              </div>

              {errorMessage.length > 0 && (
                <p
                  id="gate-error"
                  role="alert"
                  aria-live="polite"
                  className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm font-bold text-red-700"
                >
                  <span aria-hidden="true">⚠️</span>
                  <span>{errorMessage}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={checking}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 font-bold text-white shadow-md transition-all duration-200 hover:bg-indigo-700 hover:shadow-lg active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {checking ? (
                  <>
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                      aria-hidden="true"
                    />
                    <span>جارٍ التحقّق…</span>
                  </>
                ) : (
                  <span>دخول</span>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          منصة الرياضيات — الصف الثامن الإعدادي
        </p>
      </div>
    </main>
  );
}
