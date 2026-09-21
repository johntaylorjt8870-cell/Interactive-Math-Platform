import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubjectPage from "@/components/SubjectPage";
import { curriculum } from "@/data/curriculum";

export const metadata: Metadata = {
  title: "الجبر — رياضيات الصف الثامن",
  description: "تعلّم الجبر للصف الثامن الإعدادي — المعادلات والمتباينات والأعداد الحقيقية بطريقة تفاعلية",
};

export default function AlgebraPage() {
  return (
    <>
      <Navbar />
      <SubjectPage subject={curriculum.subjects.algebra} />
      <Footer />
    </>
  );
}
