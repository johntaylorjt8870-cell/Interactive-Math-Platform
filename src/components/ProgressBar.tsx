"use client";

interface ProgressBarProps {
  value: number; // 0–100
  colorClass?: "algebra" | "geometry" | "default";
  label?: string;
  showPercent?: boolean;
  size?: "sm" | "md" | "lg";
}

const colorMap = {
  algebra: "bg-indigo-500",
  geometry: "bg-teal-500",
  default: "bg-slate-500",
};

const heightMap = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-3.5",
};

export default function ProgressBar({
  value,
  colorClass = "default",
  label,
  showPercent = true,
  size = "md",
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const fillColor = colorMap[colorClass];
  const height = heightMap[size];

  return (
    <div className="w-full" role="progressbar" aria-valuenow={clampedValue} aria-valuemin={0} aria-valuemax={100} aria-label={label || "التقدم"}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-xs font-medium text-slate-600">{label}</span>}
          {showPercent && (
            <span className="text-xs font-bold text-slate-700">{clampedValue}%</span>
          )}
        </div>
      )}
      <div className={`w-full ${height} bg-slate-100 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${fillColor} rounded-full progress-bar-fill transition-all duration-700`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
