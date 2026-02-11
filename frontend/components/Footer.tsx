import Image from "next/image";
import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <footer className="w-full bg-gray-50" dir="rtl">
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
            <p className="text-gray-600 leading-7 text-sm">
              متقن منصة تعليمية تساعد الطلاب على التركيز، الفهم العميق،
              وتتبع التقدم الأكاديمي من خلال نظام متكامل يجمع بين الذكاء الاصطناعي والانضباط الذاتي.
            </p>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-lg">الخدمات</h3>
            <ul className="flex flex-col gap-2 text-gray-600 text-sm">
              <li>
                <Link href="/ai-teacher" className="hover:text-black transition">
                  المعلم الذكي
                </Link>
              </li>
              <li>
                <Link href="/planner" className="hover:text-black transition">
                  المخطط الدراسي
                </Link>
              </li>
              <li>
                <Link href="/focus-mode" className="hover:text-black transition">
                  وضع التركيز (حظر التطبيقات)
                </Link>
              </li>
              <li>
                <Link href="/quiz" className="hover:text-black transition">
                  الاختبارات وتتبع التقدم
                </Link>
              </li>
              <li>
                <Link href="/competitions" className="hover:text-black transition">
                  المنافسات
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Trust */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-lg">الدعم والثقة</h3>
            <ul className="flex flex-col gap-2 text-gray-600 text-sm">
              <li>
                <Link href="/help-center" className="hover:text-black transition">
                  مركز المساعدة
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-black transition">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-black transition">
                  الشروط والأحكام
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-black transition">
                  تواصل معنا
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t flex flex-col md:flex-row justify-between items-center text-sm text-gray-400 gap-4">
          <p>© 2026 متقن</p>
          <p>صُمم للطلاب الذين يسعون للتميّز.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
