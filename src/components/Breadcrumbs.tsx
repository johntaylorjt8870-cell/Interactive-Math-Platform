import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  colorClass?: "algebra" | "geometry" | "default";
}

export default function Breadcrumbs({ items, colorClass = "default" }: BreadcrumbsProps) {
  const accentColor =
    colorClass === "algebra"
      ? "text-indigo-600"
      : colorClass === "geometry"
      ? "text-teal-600"
      : "text-slate-600";

  return (
    <nav aria-label="مسار التنقل" className="flex items-center flex-wrap gap-1 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && (
              <span className="text-slate-300 mx-0.5" aria-hidden="true">
                ‹
              </span>
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className={`font-medium ${accentColor} hover:underline underline-offset-2 transition-colors`}
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-slate-500 font-medium" : "text-slate-400"}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
