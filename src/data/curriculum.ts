// ============================================================
// CURRICULUM DATA — منهاج الرياضيات للصف الثامن الإعدادي في سوريا
// ============================================================
// هذا الملف هو المصدر الوحيد لبيانات المنهج.
// لإضافة درس جديد: أضف كائن الدرس في المكان الصحيح في المصفوفة.
// لإضافة وحدة جديدة: أضف كائن الوحدة في المصفوفة units.
// ============================================================

export type LessonStatus = "available" | "coming" | "completed";

export interface Lesson {
  id: string;           // ID فريد — لا تغيّره بعد الإنشاء
  number: number;       // رقم الدرس داخل الوحدة
  globalNumber: number; // الرقم التسلسلي العام في المادة
  title: string;        // عنوان الدرس
  description: string;  // وصف مختصر
  status: LessonStatus;
  slidesCount?: number;   // عدد الشرائح (اختياري)
  exercisesCount?: number; // عدد التمارين (اختياري)
  // ملاحظة: أُزيل حقل مسار ملف HTML القديم.
  // الدروس تُبنى مكوّنات React حقيقية عبر src/lessons/registry.ts،
  // لأن تضمين صفحة خارجية يمنع التنقّل بين الخطوات وتتبّع التقدّم وعزل الاتجاه.
  icon?: string;          // emoji icon
  duration?: string;      // المدة التقريبية
}

export interface Unit {
  id: string;
  number: number;
  title: string;
  description?: string;
  lessons: Lesson[];
  icon?: string;
}

export interface Subject {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  colorClass: string;          // algebra | geometry
  units: Unit[];
}

export interface Curriculum {
  grade: string;
  year: string;
  subjects: {
    algebra: Subject;
    geometry: Subject;
  };
}

// ============================================================
// منهاج الجبر
// ============================================================
// سيتم تحديث هذه البيانات عند استلام فهرس الكتاب من المستخدم.
// الدروس الحالية: placeholder — حالة "coming"
// ============================================================

const algebraSubject: Subject = {
  id: "algebra",
  title: "الجبر",
  subtitle: "رياضيات الصف الثامن — الجبر",
  description: "تعلّم أسس الجبر والمعادلات والمتباينات والعمليات على الأعداد الحقيقية بأسلوب تفاعلي.",
  icon: "𝑥",
  colorClass: "algebra",
  units: [
    {
      id: "algebra-unit-1",
      number: 1,
      title: "الوحدة الأولى",
      description: "الأعداد العادية والعمليات عليها",
      icon: "📐",
      lessons: [
        {
          id: "algebra-u1-l1",
          number: 1,
          globalNumber: 1,
          title: "الجمع والطرح",
          description: "جمع وطرح الأعداد العادية وتوحيد المقامات وقواعد الحساب وسلاسل العمليات ومسائل تطبيقية.",
          status: "available",
          icon: "📖",
        },
        {
          id: "algebra-u1-l2",
          number: 2,
          globalNumber: 2,
          title: "الدرس الثاني",
          description: "سيتم تحديث هذا الوصف عند استلام الفهرس",
          status: "coming",
          icon: "📖",
        },
        {
          id: "algebra-u1-l3",
          number: 3,
          globalNumber: 3,
          title: "الدرس الثالث",
          description: "سيتم تحديث هذا الوصف عند استلام الفهرس",
          status: "coming",
          icon: "📖",
        },
      ],
    },
    {
      id: "algebra-unit-2",
      number: 2,
      title: "الوحدة الثانية",
      description: "سيتم تحديث عنوان الوحدة عند استلام الفهرس",
      icon: "🔢",
      lessons: [
        {
          id: "algebra-u2-l1",
          number: 1,
          globalNumber: 4,
          title: "الدرس الأول",
          description: "سيتم تحديث هذا الوصف عند استلام الفهرس",
          status: "coming",
          icon: "📖",
        },
        {
          id: "algebra-u2-l2",
          number: 2,
          globalNumber: 5,
          title: "الدرس الثاني",
          description: "سيتم تحديث هذا الوصف عند استلام الفهرس",
          status: "coming",
          icon: "📖",
        },
      ],
    },
    {
      id: "algebra-unit-3",
      number: 3,
      title: "الوحدة الثالثة",
      description: "سيتم تحديث عنوان الوحدة عند استلام الفهرس",
      icon: "➗",
      lessons: [
        {
          id: "algebra-u3-l1",
          number: 1,
          globalNumber: 6,
          title: "الدرس الأول",
          description: "سيتم تحديث هذا الوصف عند استلام الفهرس",
          status: "coming",
          icon: "📖",
        },
        {
          id: "algebra-u3-l2",
          number: 2,
          globalNumber: 7,
          title: "الدرس الثاني",
          description: "سيتم تحديث هذا الوصف عند استلام الفهرس",
          status: "coming",
          icon: "📖",
        },
        {
          id: "algebra-u3-l3",
          number: 3,
          globalNumber: 8,
          title: "الدرس الثالث",
          description: "سيتم تحديث هذا الوصف عند استلام الفهرس",
          status: "coming",
          icon: "📖",
        },
      ],
    },
  ],
};

// ============================================================
// منهاج الهندسة
// ============================================================

const geometrySubject: Subject = {
  id: "geometry",
  title: "الهندسة",
  subtitle: "رياضيات الصف الثامن — الهندسة",
  description: "استكشف عالم الهندسة بالأشكال والمضلعات والمتوازيات والبراهين الهندسية بطريقة بصرية تفاعلية.",
  icon: "△",
  colorClass: "geometry",
  units: [
    {
      id: "geometry-unit-1",
      number: 1,
      title: "الوحدة الأولى",
      description: "سيتم تحديث عنوان الوحدة عند استلام الفهرس",
      icon: "📏",
      lessons: [
        {
          id: "geometry-u1-l1",
          number: 1,
          globalNumber: 1,
          title: "الدرس الأول",
          description: "سيتم تحديث هذا الوصف عند استلام الفهرس",
          status: "coming",
          icon: "📐",
        },
        {
          id: "geometry-u1-l2",
          number: 2,
          globalNumber: 2,
          title: "الدرس الثاني",
          description: "سيتم تحديث هذا الوصف عند استلام الفهرس",
          status: "coming",
          icon: "📐",
        },
        {
          id: "geometry-u1-l3",
          number: 3,
          globalNumber: 3,
          title: "الدرس الثالث",
          description: "سيتم تحديث هذا الوصف عند استلام الفهرس",
          status: "coming",
          icon: "📐",
        },
      ],
    },
    {
      id: "geometry-unit-2",
      number: 2,
      title: "الوحدة الثانية",
      description: "سيتم تحديث عنوان الوحدة عند استلام الفهرس",
      icon: "🔷",
      lessons: [
        {
          id: "geometry-u2-l1",
          number: 1,
          globalNumber: 4,
          title: "الدرس الأول",
          description: "سيتم تحديث هذا الوصف عند استلام الفهرس",
          status: "coming",
          icon: "📐",
        },
        {
          id: "geometry-u2-l2",
          number: 2,
          globalNumber: 5,
          title: "الدرس الثاني",
          description: "سيتم تحديث هذا الوصف عند استلام الفهرس",
          status: "coming",
          icon: "📐",
        },
      ],
    },
    {
      id: "geometry-unit-3",
      number: 3,
      title: "الوحدة الثالثة",
      description: "سيتم تحديث عنوان الوحدة عند استلام الفهرس",
      icon: "⭕",
      lessons: [
        {
          id: "geometry-u3-l1",
          number: 1,
          globalNumber: 6,
          title: "الدرس الأول",
          description: "سيتم تحديث هذا الوصف عند استلام الفهرس",
          status: "coming",
          icon: "📐",
        },
        {
          id: "geometry-u3-l2",
          number: 2,
          globalNumber: 7,
          title: "الدرس الثاني",
          description: "سيتم تحديث هذا الوصف عند استلام الفهرس",
          status: "coming",
          icon: "📐",
        },
      ],
    },
  ],
};

// ============================================================
// التصدير الرئيسي
// ============================================================

export const curriculum: Curriculum = {
  grade: "الصف الثامن الإعدادي",
  year: "2025–2026",
  subjects: {
    algebra: algebraSubject,
    geometry: geometrySubject,
  },
};

// ============================================================
// Helper Functions
// ============================================================

/** الحصول على درس بواسطة ID */
export function getLessonById(lessonId: string): {
  lesson: Lesson;
  unit: Unit;
  subject: Subject;
} | null {
  for (const subject of Object.values(curriculum.subjects)) {
    for (const unit of subject.units) {
      for (const lesson of unit.lessons) {
        if (lesson.id === lessonId) {
          return { lesson, unit, subject };
        }
      }
    }
  }
  return null;
}

/** الحصول على الدرس السابق والتالي */
export function getAdjacentLessons(lessonId: string): {
  prev: Lesson | null;
  next: Lesson | null;
  subject: Subject;
  unit: Unit;
} | null {
  for (const subject of Object.values(curriculum.subjects)) {
    // Flatten all lessons across units
    const allLessons: { lesson: Lesson; unit: Unit }[] = [];
    for (const unit of subject.units) {
      for (const lesson of unit.lessons) {
        allLessons.push({ lesson, unit });
      }
    }
    const idx = allLessons.findIndex((l) => l.lesson.id === lessonId);
    if (idx !== -1) {
      return {
        prev: idx > 0 ? allLessons[idx - 1].lesson : null,
        next: idx < allLessons.length - 1 ? allLessons[idx + 1].lesson : null,
        subject,
        unit: allLessons[idx].unit,
      };
    }
  }
  return null;
}

/** إحصاءات المادة */
export function getSubjectStats(subject: Subject): {
  totalUnits: number;
  totalLessons: number;
  availableLessons: number;
  comingLessons: number;
} {
  let totalLessons = 0;
  let availableLessons = 0;
  let comingLessons = 0;
  for (const unit of subject.units) {
    for (const lesson of unit.lessons) {
      totalLessons++;
      if (lesson.status === "available") availableLessons++;
      if (lesson.status === "coming") comingLessons++;
    }
  }
  return {
    totalUnits: subject.units.length,
    totalLessons,
    availableLessons,
    comingLessons,
  };
}

/** البحث في الدروس */
export function searchLessons(
  query: string,
  subjectId?: string
): Array<{ lesson: Lesson; unit: Unit; subject: Subject }> {
  const results: Array<{ lesson: Lesson; unit: Unit; subject: Subject }> = [];
  const q = query.trim().toLowerCase();
  if (!q) return results;

  const subjects = subjectId
    ? [curriculum.subjects[subjectId as keyof typeof curriculum.subjects]].filter(Boolean)
    : Object.values(curriculum.subjects);

  for (const subject of subjects) {
    if (!subject) continue;
    for (const unit of subject.units) {
      for (const lesson of unit.lessons) {
        const matches =
          lesson.title.toLowerCase().includes(q) ||
          lesson.description.toLowerCase().includes(q) ||
          unit.title.toLowerCase().includes(q) ||
          String(lesson.number).includes(q) ||
          String(lesson.globalNumber).includes(q);
        if (matches) {
          results.push({ lesson, unit, subject });
        }
      }
    }
  }
  return results;
}
