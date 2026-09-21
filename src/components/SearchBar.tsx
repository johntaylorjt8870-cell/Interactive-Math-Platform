"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { searchLessons } from "@/data/curriculum";
import type { Lesson, Unit, Subject } from "@/data/curriculum";

interface SearchResult {
  lesson: Lesson;
  unit: Unit;
  subject: Subject;
}

interface SearchBarProps {
  subjectId?: string;
  placeholder?: string;
  colorClass?: "algebra" | "geometry" | "default";
}

export default function SearchBar({
  subjectId,
  placeholder = "ابحث عن درس...",
  colorClass = "default",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const focusColor =
    colorClass === "algebra"
      ? "focus:ring-indigo-400 focus:border-indigo-400"
      : colorClass === "geometry"
      ? "focus:ring-teal-400 focus:border-teal-400"
      : "focus:ring-slate-400 focus:border-slate-400";

  useEffect(() => {
    if (query.trim().length > 0) {
      const res = searchLessons(query, subjectId);
      setResults(res);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query, subjectId]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = () => {
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      {/* Input */}
      <div className="relative">
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 bg-white
            text-slate-700 text-sm placeholder:text-slate-400
            shadow-sm focus:outline-none focus:ring-2 ${focusColor}
            transition-all duration-200
          `}
          aria-label={placeholder}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-slate-600"
            aria-label="مسح البحث"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div
          className="absolute top-full right-0 left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in"
          role="listbox"
          aria-label="نتائج البحث"
        >
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              <div className="text-2xl mb-2">🔍</div>
              <p>لم يتم العثور على نتائج لـ &quot;{query}&quot;</p>
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {results.map(({ lesson, unit, subject }) => (
                <li key={lesson.id}>
                  {lesson.status === "available" ? (
                    <Link
                      href={`/lesson/${lesson.id}`}
                      onClick={handleSelect}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                      role="option"
                      aria-selected="false"
                    >
                      <span className="text-lg flex-shrink-0">{lesson.icon || "📖"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                          {lesson.title}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {subject.title} — {unit.title}
                        </div>
                      </div>
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        متاح
                      </span>
                    </Link>
                  ) : (
                    <div
                      className="flex items-center gap-3 px-4 py-3 opacity-60"
                      role="option"
                      aria-selected="false"
                      aria-disabled="true"
                    >
                      <span className="text-lg flex-shrink-0">{lesson.icon || "📖"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-600 truncate">
                          {lesson.title}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {subject.title} — {unit.title}
                        </div>
                      </div>
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        قريبًا
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              {results.length > 0 ? `${results.length} نتيجة` : "لا نتائج"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
