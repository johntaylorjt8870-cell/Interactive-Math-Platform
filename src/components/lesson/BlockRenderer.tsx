"use client";

import type { Block } from "@/content/types";
import MathExpr from "../math/MathExpr";
import Figure from "../geometry/Figure";
import ProvenanceBadge from "./ProvenanceBadge";
import WorkedSolutionView from "./WorkedSolutionView";
import ActivityRenderer from "../interactive/ActivityRenderer";
import { LatinRuns } from "../bidi/LatinRuns";
import RichText from "../bidi/RichText";

// ============================================================
// مُصيّر الكتل — Block renderer
// ============================================================
// نقطة واحدة تحوّل بيانات الدرس إلى شرح معروض.
//
// ضمانان معماريان مهمان:
//   1) كل نص عربي يمرّ عبر <LatinRuns> تلقائيًا → لا يمكن أن
//      ينسى المؤلف عزل عبارة لاتينية داخل جملة عربية.
//   2) كل تعبير رياضي يمرّ عبر <MathExpr> → لا يمكن أن يُعرض
//      رياضيات داخل سياق RTL بلا عزل.
//   3) كل مثال/شكل/حل يحمل <ProvenanceBadge> → لا يمكن أن
//      يظهر محتوى إضافي بصفة محتوى كتابي.
// ============================================================

export default function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "heading":
      return (
        <h3 className="mt-6 border-r-4 pr-3 text-lg font-black text-slate-800" style={{ borderColor: "var(--accent)" }}>
          <RichText text={block.text} />
        </h3>
      );

    case "text":
      return (
        <p className="leading-loose text-slate-700">
          <RichText text={block.text} />
        </p>
      );

    case "definition":
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded-lg px-2 py-0.5 text-xs font-bold text-white" style={{ background: "var(--accent)" }}>
              تعريف
            </span>
            <span className="font-black text-slate-800">
              <RichText text={block.term} />
            </span>
          </div>
          <p className="leading-relaxed text-slate-700">
            <RichText text={block.text} />
          </p>
          {block.notation && (
            <div className="mt-2 rounded-lg bg-slate-50 p-2">
              <MathExpr value={block.notation} display />
            </div>
          )}
        </div>
      );

    case "formula":
      return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
          <MathExpr value={block.math} display size={1.25} />
          {block.note && (
            <p className="mt-2 text-sm text-slate-600">
              <RichText text={block.note} />
            </p>
          )}
          {block.source && (
            <div className="mt-2 flex justify-center">
              <ProvenanceBadge source={block.source} />
            </div>
          )}
        </div>
      );

    case "example":
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="font-black text-slate-800">
              <RichText text={block.title} />
            </span>
            <ProvenanceBadge source={block.source} />
          </div>
          <div className="leading-relaxed text-slate-700">
            <RichText text={block.text} />
          </div>
        </div>
      );

    case "note":
      return (
        <Callout tone="info" icon="📌" text={block.text} />
      );

    case "warning":
      return (
        <Callout tone="warning" icon="⚠️" text={block.text} />
      );

    case "list":
      return block.ordered ? (
        <ol className="list-decimal space-y-1.5 pr-6 text-slate-700">
          {block.items.map((item, index) => (
            <li key={index} className="leading-relaxed">
              <RichText text={item} />
            </li>
          ))}
        </ol>
      ) : (
        <ul className="space-y-1.5 pr-5 text-slate-700">
          {block.items.map((item, index) => (
            <li key={index} className="flex gap-2 leading-relaxed">
              <span aria-hidden="true" style={{ color: "var(--accent)" }}>
                ●
              </span>
              <span>
                <RichText text={item} />
              </span>
            </li>
          ))}
        </ul>
      );

    case "table":
      return (
        <div className="overflow-x-auto">
          {block.caption && (
            <p className="mb-1 text-sm font-bold text-slate-600">
              <RichText text={block.caption} />
            </p>
          )}
          <table className="w-full min-w-[18rem] border-collapse overflow-hidden rounded-xl text-sm">
            <thead>
              <tr className="bg-slate-100">
                {block.headers.map((header, index) => (
                  <th key={index} className="border border-slate-200 px-3 py-2 text-right font-black text-slate-700">
                    <RichText text={header} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 ? "bg-slate-50/60" : "bg-white"}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-slate-200 px-3 py-2 text-slate-700">
                      <RichText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "symbolLegend":
      return (
        <ul className="grid gap-2 sm:grid-cols-2">
          {block.items.map((item, index) => (
            <li key={index} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <span className="min-w-12 text-center">
                <MathExpr value={item.symbol} />
              </span>
              <span className="text-sm font-semibold text-slate-700">
                <RichText text={item.meaning} />
              </span>
            </li>
          ))}
        </ul>
      );

    case "worked":
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-base font-black text-slate-800">
              <RichText text={block.title} />
            </span>
            <ProvenanceBadge source={block.source} />
          </div>
          <WorkedSolutionView solution={block.solution} />
        </div>
      );

    case "misconception":
      return (
        <div className="rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/40 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-base font-black text-rose-800">✗ خطأ شائع</span>
            <ProvenanceBadge source={block.source} />
          </div>
          <div className="space-y-2">
            <div className="rounded-xl border border-rose-200 bg-white p-3 text-center">
              <MathExpr value={block.wrong} display />
            </div>
            <p className="text-sm leading-relaxed text-slate-700">
              <span className="font-bold text-rose-700">لماذا هو خطأ؟ </span>
              <RichText text={block.whyWrong} />
            </p>
            <div className="rounded-xl border border-emerald-200 bg-white p-3 text-center">
              <MathExpr value={block.correct} display />
            </div>
            <p className="rounded-xl bg-emerald-50 p-2.5 text-sm font-bold leading-relaxed text-emerald-900">
              <span aria-hidden="true">🧠 </span>
              <RichText text={block.remember} />
            </p>
          </div>
        </div>
      );

    case "figure":
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold text-slate-600">
              {block.figure.caption ? <RichText text={block.figure.caption} /> : "شكل هندسي"}
            </span>
            <ProvenanceBadge source={block.source} />
          </div>
          <Figure spec={block.figure} />
        </div>
      );

    case "activity":
      return <ActivityRenderer activity={block.activity} />;

    default: {
      const exhaustive: never = block;
      return (
        <p className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-700">
          نوع كتلة غير مدعوم: {(exhaustive as Block).type}
        </p>
      );
    }
  }
}

function Callout({
  tone,
  icon,
  text,
}: {
  tone: "info" | "warning";
  icon: string;
  text: string;
}) {
  const styles =
    tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-sky-200 bg-sky-50 text-sky-900";
  return (
    <div className={`flex gap-2 rounded-xl border p-3 ${styles}`}>
      <span aria-hidden="true">{icon}</span>
      <p className="text-sm font-semibold leading-relaxed">
        <RichText text={text} />
      </p>
    </div>
  );
}
