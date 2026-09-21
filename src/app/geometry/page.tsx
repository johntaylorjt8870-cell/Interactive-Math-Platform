import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubjectPage from "@/components/SubjectPage";
import { curriculum } from "@/data/curriculum";

export const metadata: Metadata = {
  title: "الهندسة — رياضيات الصف الثامن",
  description: "تعلّم الهندسة للصف الثامن الإعدادي — الأشكال والمضلعات والبراهين بطريقة تفاعلية بصرية",
};

export default function GeometryPage() {
  return (
    <>
      <Navbar />
      <SubjectPage subject={curriculum.subjects.geometry} />
      <Footer />
    </>
  );
}
