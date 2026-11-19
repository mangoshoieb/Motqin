import Image from "next/image";
import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <footer className="w-full     bg-[var(--background)]" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-20">

          <div className="flex flex-col gap-4 col-span-2">
            <Image
              src="/متقن.svg"
              alt="Motqin Logo"
              width={200}
              height={50}
              priority
            />
            <p className="text-[var(--input-text)] leading-7 text-sm">
             المكان الأنسب لزيادة انتاجيتك وتحسين اداءك.
            </p>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-lg">الخدمات</h3>
            <ul className="flex flex-col gap-2 text-[var(--input-text)] text-[15px]">
              {/* <li>
                <Link href="/ai-teacher" className="hover:text-[var(--assistant-text)] transition">
                  المعلم الذكي
                </Link>
              </li> */}
              <li>
                <Link href="/planner/today" className="hover:text-[var(--assistant-text)] transition">
                  المخطط الدراسي
                </Link>
              </li>
              <li>
                <Link href="/focus-mode" className="hover:text-[var(--assistant-text)] transition">
                  وضع التركيز (حظر التطبيقات)
                </Link>
              </li>
              <li>
                <Link href="/subjects" className="hover:text-[var(--assistant-text)] transition">
                  متقن    
                    </Link>
              </li>
              <li>
                <Link href="/competitions" className="hover:text-[var(--assistant-text)] transition">
                  المنافسات
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Trust */}
          <div className="flex flex-col gap-3 ">
            <h3 className="font-semibold text-lg">الدعم والثقة</h3>
            <ul className="flex flex-col gap-2 text-[var(--input-text)] text-[15px]">
              <li>
                <Link href="/help-center" className="hover:text-[var(--assistant-text)] transition">
                  مركز المساعدة
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[var(--assistant-text)] transition">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[var(--assistant-text)] transition">
                  الشروط والأحكام
                </Link>
              </li>
              <li>
                <Link href="/data-deletion" className="hover:text-[var(--assistant-text)] transition">
                  حذف الحساب والبيانات
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[var(--assistant-text)] transition">
                  تواصل معنا
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t flex flex-col md:flex-row justify-between items-center text-sm text-gray-400 gap-4">
          <p>© 2026 متقن</p>
          <p></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
