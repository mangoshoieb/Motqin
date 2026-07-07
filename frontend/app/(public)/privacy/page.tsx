import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function PrivacyPolicyPage() {
  const sections = [
    {
      id: "info",
      title: "1. المعلومات التي نجمعها",
      content: (
        <>
          <p>
            قد نقوم بجمع المعلومات التالية عند استخدام تطبيق متقن:
          </p>

          <ul className="list-disc pr-6 mt-3 space-y-2">
            <li>رقم الهاتف.</li>
            <li>الاسم.</li>
            <li>بيانات تسجيل الدخول عبر Google أو Facebook.</li>
            <li>المواد الدراسية والخطط الدراسية.</li>
            <li>نتائج الاختبارات ومستوى التقدم الدراسي.</li>
            <li>إعدادات التطبيق والتفضيلات الشخصية.</li>
          </ul>
        </>
      ),
    },
    {
      id: "usage",
      title: "2. كيفية استخدام المعلومات",
      content: (
        <>
          <p>تستخدم البيانات التي نجمعها للأغراض التالية:</p>

          <ul className="list-disc pr-6 mt-3 space-y-2">
            <li>إنشاء وإدارة حساب المستخدم.</li>
            <li>التحقق من هوية المستخدم.</li>
            <li>تخصيص تجربة التعلم داخل التطبيق.</li>
            <li>متابعة الأداء والتقدم الدراسي.</li>
            <li>تحسين جودة التطبيق وإضافة ميزات جديدة.</li>
            <li>تقديم الدعم الفني عند الحاجة.</li>
          </ul>
        </>
      ),
    },
    {
      id: "sharing",
      title: "3. مشاركة المعلومات",
      content: (
        <>
          <p>
            نحن لا نقوم ببيع أو تأجير بيانات المستخدمين لأي جهة خارجية.
          </p>

          <p className="mt-4">
            قد تتم مشاركة بعض البيانات فقط في الحالات التالية:
          </p>

          <ul className="list-disc pr-6 mt-3 space-y-2">
            <li>إذا كان ذلك مطلوبًا بموجب القانون.</li>
            <li>عند استخدام خدمات Google أو Facebook لتسجيل الدخول.</li>
            <li>مع الخدمات الضرورية لتشغيل التطبيق بشكل آمن.</li>
          </ul>
        </>
      ),
    },
    {
      id: "security",
      title: "4. حماية البيانات",
      content: (
        <>
          <p>نعمل على حماية بيانات المستخدمين من خلال:</p>

          <ul className="list-disc pr-6 mt-3 space-y-2">
            <li>تشفير الاتصالات باستخدام HTTPS.</li>
            <li>استخدام رموز الوصول (Access Tokens).</li>
            <li>حماية الوصول إلى بيانات المستخدم.</li>
            <li>اتباع أفضل الممارسات الأمنية أثناء تطوير التطبيق.</li>
          </ul>
        </>
      ),
    },
    {
      id: "cookies",
      title: "5. ملفات تعريف الارتباط (Cookies)",
      content: (
        <p>
          قد يستخدم التطبيق ملفات تعريف الارتباط أو تقنيات مشابهة لتحسين
          تجربة الاستخدام وحفظ إعدادات المستخدم.
        </p>
      ),
    },
    {
      id: "retention",
      title: "6. الاحتفاظ بالبيانات",
      content: (
        <p>
          يتم الاحتفاظ بالبيانات طالما كانت ضرورية لتقديم خدمات التطبيق أو حتى
          يطلب المستخدم حذف حسابه، ما لم يتطلب القانون الاحتفاظ بها لفترة
          أطول.
        </p>
      ),
    },
    {
      id: "rights",
      title: "7. حقوق المستخدم",
      content: (
        <>
          <p>يحق للمستخدم:</p>

          <ul className="list-disc pr-6 mt-3 space-y-2">
            <li>الاطلاع على بياناته الشخصية.</li>
            <li>تعديل بياناته.</li>
            <li>طلب حذف حسابه وبياناته.</li>
            <li>التواصل معنا بشأن أي استفسار يتعلق بالخصوصية.</li>
          </ul>
        </>
      ),
    },
    {
      id: "third-party",
      title: "8. خدمات الطرف الثالث",
      content: (
        <>
          <p>قد يستخدم التطبيق خدمات خارجية مثل:</p>

          <ul className="list-disc pr-6 mt-3 space-y-2">
            <li>Google Sign-In</li>
            <li>Facebook Login</li>
          </ul>

          <p className="mt-4">
            وتخضع هذه الخدمات لسياسات الخصوصية الخاصة بها.
          </p>
        </>
      ),
    },
    {
      id: "children",
      title: "9. خصوصية الأطفال",
      content: (
        <p>
          تم تصميم متقن لمساعدة الطلاب على التعلم، ولا نجمع أي بيانات شخصية
          تتجاوز ما هو ضروري لتقديم الخدمة وتحسين تجربة المستخدم.
        </p>
      ),
    },
    {
      id: "updates",
      title: "10. التعديلات على سياسة الخصوصية",
      content: (
        <p>
          قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سيتم نشر أي تحديث على هذه
          الصفحة مع توضيح تاريخ آخر تعديل.
        </p>
      ),
    },
    {
      id: "contact",
      title: "11. التواصل معنا",
      content: (
        <>
          <p>
            إذا كانت لديك أي استفسارات أو ملاحظات بخصوص سياسة الخصوصية،
            يمكنك التواصل معنا عبر:
          </p>

          <p className="font-semibold mt-4 text-primary">
            shoiep001@gmail.com
          </p>
        </>
      ),
    },
  ];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--surface)] py-12 px-4 sm:px-6"
    >
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Table of contents */}
        <aside className="hidden lg:block w-72 sticky top-8 self-start">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="font-bold text-lg mb-5">
              محتويات الصفحة
            </h2>

            <nav className="space-y-3 text-sm">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block text-gray-600 hover:text-blue-600 transition"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-3xl shadow-sm border p-6 sm:p-10">
            {/* Header */}

            <div className="flex items-center gap-4 mb-8">
              <div className="size-14 rounded-full bg-blue-100 flex items-center justify-center">
                <ShieldCheck className="text-blue-600" size={28} />
              </div>

              <div>
                <h1 className="text-4xl font-bold">
                  سياسة الخصوصية
                </h1>

                <span className="inline-block mt-2 rounded-full bg-blue-100 text-blue-700 text-sm px-3 py-1">
                  آخر تحديث: 1 يوليو 2026
                </span>
              </div>
            </div>

            <p className="text-gray-600 leading-8 mb-12">
              نرحب بك في <strong>متقن</strong>. نحن نحترم خصوصية
              مستخدمينا ونسعى لحماية بياناتهم الشخصية. توضح هذه الصفحة
              كيفية جمع المعلومات واستخدامها وحمايتها أثناء استخدام
              التطبيق.
            </p>

            {/* Sections */}

            <div className="space-y-12">
              {sections.map((section) => (
                <section
                  id={section.id}
                  key={section.id}
                  className="scroll-mt-20"
                >
                  <h2 className="text-2xl font-bold mb-5">
                    {section.title}
                  </h2>

                  <div className="text-gray-700 leading-8">
                    {section.content}
                  </div>
                </section>
              ))}
            </div>

            {/* Notice */}

            <div className="mt-14 rounded-2xl border border-blue-200 bg-blue-50 p-6">
              <p className="font-semibold text-blue-800 leading-8">
                باستخدامك لتطبيق <strong>متقن</strong> فإنك توافق على
                سياسة الخصوصية الموضحة في هذه الصفحة.
              </p>
            </div>

            {/* Back */}

            <div className="mt-10">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition"
              >
                <ArrowRight size={18} />
                العودة إلى الصفحة الرئيسية
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}