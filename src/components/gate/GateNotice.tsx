import { GATE_ENV_VAR } from "@/lib/gate/config";

// ============================================================
// خطأ إعداد البوابة — مكوّن خادمي
// ============================================================
// يظهر عندما تكون البيئة إنتاجية ولا تكون كلمة مرور الموقع مضبوطة.
// الهدف: أن يفهم المشغّل سبب القفل فورًا بدل صفحة غامضة.
//
// يُعرض من موضعين:
//   • proxy يعيد كتابة أي صفحة محمية إلى /gate/not-configured بحالة 503.
//   • وصفحة /gate نفسها، لأن نموذج دخول بلا كلمة مرور مضبوطة لا فائدة منه.
//
// ملاحظة: ذكر اسم متغيّر البيئة هنا لا يكشف أي سرّ — القيمة غائبة
// أصلًا، والموقع غير عامل في هذه الحالة.
// ============================================================

export default function GateNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm">
          <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-400" aria-hidden="true" />

          <div className="p-7 sm:p-9">
            <div className="mb-5 text-center">
              <div
                className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-amber-100 bg-amber-50 shadow-sm"
                aria-hidden="true"
              >
                <span className="text-3xl leading-none">🛠️</span>
              </div>

              <h1 className="mb-2 text-2xl font-black text-slate-900">الموقع مقفل: إعداد ناقص</h1>
              <p className="text-sm leading-relaxed text-slate-500">
                كلمة مرور الموقع غير مضبوطة على الخادم، ولذلك لا يمكن عرض المحتوى.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
              <p className="mb-2 font-bold text-slate-700">ما يجب فعله</p>
              <p className="mb-3">
                اضبط متغيّر البيئة{" "}
                <code dir="ltr" className="rounded-md bg-white px-2 py-0.5 font-mono text-xs text-slate-800 ring-1 ring-slate-200">
                  {GATE_ENV_VAR}
                </code>{" "}
                في بيئة النشر، ثم أعد تشغيل الخادم.
              </p>
              <p className="text-xs text-slate-500">
                لا توجد كلمة مرور افتراضية في الكود، ولا يُفتح الموقع تلقائيًا عند نقص الإعداد.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
