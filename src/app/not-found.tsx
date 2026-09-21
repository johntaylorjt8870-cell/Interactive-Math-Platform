import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-8xl font-black text-slate-200 mb-4">٤٠٤</div>
          <h1 className="text-2xl font-black text-slate-800 mb-3">الصفحة غير موجودة</h1>
          <p className="text-slate-500 mb-8">
            عذرًا، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
            >
              🏠 الصفحة الرئيسية
            </Link>
            <Link
              href="/algebra"
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
            >
              𝑥 الجبر
            </Link>
            <Link
              href="/geometry"
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
            >
              △ الهندسة
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
