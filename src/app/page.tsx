import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { curriculum, getSubjectStats } from "@/data/curriculum";

export default function HomePage() {
  const algebraStats = getSubjectStats(curriculum.subjects.algebra);
  const geometryStats = getSubjectStats(curriculum.subjects.geometry);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-indigo-50 opacity-60" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-teal-50 opacity-60" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-50" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative">
            {/* Grade badge */}
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-600 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" aria-hidden="true" />
                {curriculum.grade} — {curriculum.year}
              </span>
            </div>

            {/* Main Title */}
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 mb-5 leading-tight">
                دروس{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-indigo-600 to-teal-600 bg-clip-text text-transparent">
                    الرياضيات
                  </span>
                  <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-indigo-300 to-teal-300 rounded-full opacity-60" aria-hidden="true" />
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-2">
                منهاج الرياضيات للصف الثامن الإعدادي
              </p>
              <p className="text-base text-slate-500">
                تعلّم الجبر والهندسة بطريقة تفاعلية خطوة بخطوة.
              </p>
            </div>

            {/* Stats strip */}
            <div className="flex justify-center gap-8 mt-8 mb-2">
              <div className="text-center">
                <div className="text-2xl font-black text-slate-800">
                  {algebraStats.totalUnits + geometryStats.totalUnits}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">وحدة دراسية</div>
              </div>
              <div className="w-px bg-slate-200" />
              <div className="text-center">
                <div className="text-2xl font-black text-slate-800">
                  {algebraStats.totalLessons + geometryStats.totalLessons}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">درس</div>
              </div>
              <div className="w-px bg-slate-200" />
              <div className="text-center">
                <div className="text-2xl font-black text-slate-800">
                  {algebraStats.availableLessons + geometryStats.availableLessons}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">درس متاح</div>
              </div>
            </div>
          </div>
        </section>

        {/* Subject Cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 stagger-children">

            {/* Algebra Card */}
            <div className="group relative bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* Top gradient bar */}
              <div className="h-2 bg-gradient-to-r from-indigo-500 via-indigo-400 to-violet-500" aria-hidden="true" />

              {/* Background pattern */}
              <div className="absolute top-8 left-8 w-32 h-32 rounded-full bg-indigo-50 opacity-0 group-hover:opacity-80 transition-opacity duration-500" aria-hidden="true" />

              <div className="p-8 relative">
                {/* Icon */}
                <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-100 transition-colors shadow-sm">
                  <span className="text-3xl font-black text-indigo-600 leading-none">𝑥</span>
                </div>

                {/* Title & Description */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-black text-slate-900">الجبر</h2>
                    <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                      Algebra
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {curriculum.subjects.algebra.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-indigo-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-black text-indigo-700">{algebraStats.totalUnits}</div>
                    <div className="text-xs text-indigo-500 mt-0.5">وحدات</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-black text-slate-700">{algebraStats.totalLessons}</div>
                    <div className="text-xs text-slate-500 mt-0.5">درس</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-black text-emerald-700">{algebraStats.availableLessons}</div>
                    <div className="text-xs text-emerald-500 mt-0.5">متاح</div>
                  </div>
                </div>

                {/* CTA Button */}
                <Link
                  href="/algebra"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-indigo-200 hover:shadow-lg group/btn"
                  aria-label="دخول إلى مادة الجبر"
                >
                  <span>دخول إلى الجبر</span>
                  <span className="transform group-hover/btn:translate-x-[-4px] transition-transform" aria-hidden="true">←</span>
                </Link>
              </div>
            </div>

            {/* Geometry Card */}
            <div className="group relative bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* Top gradient bar */}
              <div className="h-2 bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-500" aria-hidden="true" />

              {/* Background pattern */}
              <div className="absolute top-8 left-8 w-32 h-32 rounded-full bg-teal-50 opacity-0 group-hover:opacity-80 transition-opacity duration-500" aria-hidden="true" />

              <div className="p-8 relative">
                {/* Icon */}
                <div className="w-16 h-16 bg-teal-50 border border-teal-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-teal-100 transition-colors shadow-sm">
                  <span className="text-3xl font-black text-teal-600 leading-none">△</span>
                </div>

                {/* Title & Description */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-black text-slate-900">الهندسة</h2>
                    <span className="px-2.5 py-0.5 bg-teal-100 text-teal-700 text-xs font-bold rounded-full">
                      Geometry
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {curriculum.subjects.geometry.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-teal-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-black text-teal-700">{geometryStats.totalUnits}</div>
                    <div className="text-xs text-teal-500 mt-0.5">وحدات</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-black text-slate-700">{geometryStats.totalLessons}</div>
                    <div className="text-xs text-slate-500 mt-0.5">درس</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-black text-emerald-700">{geometryStats.availableLessons}</div>
                    <div className="text-xs text-emerald-500 mt-0.5">متاح</div>
                  </div>
                </div>

                {/* CTA Button */}
                <Link
                  href="/geometry"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-teal-200 hover:shadow-lg group/btn"
                  aria-label="دخول إلى مادة الهندسة"
                >
                  <span>دخول إلى الهندسة</span>
                  <span className="transform group-hover/btn:translate-x-[-4px] transition-transform" aria-hidden="true">←</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Features Strip */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: "🎯", title: "تعلّم تفاعلي", desc: "دروس حية ومتفاعلة" },
              { icon: "📐", title: "منهج سوري", desc: "الصف الثامن الإعدادي" },
              { icon: "💡", title: "فهم عميق", desc: "شرح خطوة بخطوة" },
              { icon: "📊", title: "تتبع التقدم", desc: "احفظ تقدمك دائمًا" },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                <div className="text-2xl mb-2" aria-hidden="true">{f.icon}</div>
                <div className="font-bold text-slate-700 text-sm">{f.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Banner */}
        <section className="bg-gradient-to-r from-slate-800 to-slate-900 py-8 px-4">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-white font-bold text-base">المهندس سومر شاهين</p>
              <p className="text-slate-400 text-sm">للتواصل والاستفسار عن المنصة التعليمية</p>
            </div>
            <a
              href="https://wa.me/963930215022"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl transition-colors shadow-lg"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>0930215022</span>
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
