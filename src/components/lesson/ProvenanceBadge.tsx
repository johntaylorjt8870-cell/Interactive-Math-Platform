import type { ContentSource } from "@/content/types";
import { LatinRuns } from "../bidi/LatinRuns";

// ============================================================
// شارة المصدر — Provenance badge
// ============================================================
// المتطلب 29: لا يجوز أبدًا أن يظهر مثال مُخترَع بصفته من الكتاب.
// لذا كل مثال/شكل/تمرين يحمل شارة صريحة:
//   📘 من الكتاب  + مرجع الصفحة/المثال (bookRef)
//   💡 توضيح إضافي + سبب الإضافة (reason)
// الشارة ليست تجميلًا: هي عقد بين المنصة والمعلّم والطالب.
// ============================================================

export default function ProvenanceBadge({
  source,
  className = "",
}: {
  source: ContentSource;
  className?: string;
}) {
  if (source.provenance === "book") {
    return (
      <span
        className={`inline-flex flex-wrap items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-100 ${className}`.trim()}
        title={`مصدر الكتاب: ${source.bookRef}`}
      >
        <span aria-hidden="true">📘</span>
        <span>من الكتاب</span>
        <span className="font-medium text-sky-600">
          <LatinRuns text={source.bookRef} />
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex flex-wrap items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-100 ${className}`.trim()}
      title={source.reason}
    >
      <span aria-hidden="true">💡</span>
      <span>توضيح إضافي</span>
      <span className="font-medium text-amber-600">
        <LatinRuns text={source.reason} />
      </span>
    </span>
  );
}
