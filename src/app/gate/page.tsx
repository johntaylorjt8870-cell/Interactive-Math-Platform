import type { Metadata } from "next";
import GateForm from "@/components/gate/GateForm";
import GateNotice from "@/components/gate/GateNotice";
import { getGateMode, readSitePassword, safeNextPath } from "@/lib/gate/config";

// ============================================================
// صفحة الدخول — /gate
// ============================================================
// هذه الصفحة مستثناة من البوابة (انظر GATE_MATCHER)، لأنها المدخل
// الوحيد لمن لا يملك كوكيًا صالحًا — لو حُميت لدارت البوابة على نفسها.
//
// تقرأ مسار العودة `?next=` من معاملات البحث على الخادم وتُعقّمه
// قبل تمريره إلى النموذج، فلا يصل مسار خارجي إلى المتصفح أصلًا.
//
// وإن كانت البيئة إنتاجية بلا كلمة مرور مضبوطة، لا نعرض نموذجًا
// لا يمكن أن ينجح، بل نعرض خطأ الإعداد صريحًا.
// ============================================================

export const metadata: Metadata = {
  title: "الدخول إلى المنصة — منصة الرياضيات",
  robots: { index: false, follow: false },
};

interface GatePageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function GatePage({ searchParams }: GatePageProps) {
  const { next } = await searchParams;

  const isProduction = process.env.NODE_ENV === "production";
  const sitePassword = readSitePassword();

  if (getGateMode({ isProduction, sitePassword }) === "blocked-misconfigured") {
    return <GateNotice />;
  }

  const rawNext = Array.isArray(next) ? next[0] : next;
  return <GateForm nextPath={safeNextPath(rawNext)} />;
}
