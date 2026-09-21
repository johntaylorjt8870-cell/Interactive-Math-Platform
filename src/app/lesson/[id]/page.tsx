import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLessonById, getAdjacentLessons, curriculum } from "@/data/curriculum";
import LessonPageClient from "./LessonPageClient";

interface LessonPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const params: { id: string }[] = [];
  for (const subject of Object.values(curriculum.subjects)) {
    for (const unit of subject.units) {
      for (const lesson of unit.lessons) {
        if (lesson.status === "available") {
          params.push({ id: lesson.id });
        }
      }
    }
  }
  return params;
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { id } = await params;
  const found = getLessonById(id);
  if (!found) {
    return { title: "الدرس غير موجود" };
  }
  return {
    title: `${found.lesson.title} — ${found.subject.title} — رياضيات الصف الثامن`,
    description: found.lesson.description,
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { id } = await params;
  const found = getLessonById(id);

  if (!found) {
    notFound();
  }

  const { lesson, unit, subject } = found;
  const adjacent = getAdjacentLessons(id);

  return (
    <LessonPageClient
      lesson={lesson}
      unit={unit}
      subject={subject}
      prevLesson={adjacent?.prev ?? null}
      nextLesson={adjacent?.next ?? null}
    />
  );
}
