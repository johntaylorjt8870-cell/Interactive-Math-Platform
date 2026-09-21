import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg">
                ر٨
              </div>
              <div>
                <div className="font-bold text-white text-base">منصة الرياضيات</div>
                <div className="text-xs text-slate-400">الصف الثامن الإعدادي</div>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              منصة تعليمية تفاعلية لمنهاج الرياضيات للصف الثامن الإعدادي في سوريا.
              تعلّم الجبر والهندسة خطوة بخطوة.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm">المواد الدراسية</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                  <span>🏠</span> الصفحة الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/algebra" className="text-sm text-slate-400 hover:text-indigo-300 transition-colors flex items-center gap-2">
                  <span>𝑥</span> الجبر
                </Link>
              </li>
              <li>
                <Link href="/geometry" className="text-sm text-slate-400 hover:text-teal-300 transition-colors flex items-center gap-2">
                  <span>△</span> الهندسة
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm">التواصل</h3>
            <p className="text-sm text-slate-400 mb-3">المهندس سومر شاهين</p>
            <a
              href="https://wa.me/963930215022"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>0930215022</span>
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            © 2025–2026 منصة الرياضيات — الصف الثامن الإعدادي في سوريا
          </p>
          <p className="text-xs text-slate-500">
            المهندس سومر شاهين —{" "}
            <a href="https://wa.me/963930215022" className="hover:text-green-400 transition-colors">
              0930215022
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
