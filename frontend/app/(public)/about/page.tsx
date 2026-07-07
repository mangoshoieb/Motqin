import Image from "next/image";

const features = [
  {
    icon: "🧠",
    title: "المعلم الذكي",
    description:
      "شرح الدروس، الإجابة عن الأسئلة، وتقديم المحتوى بطريقة تناسب مستوى كل طالب.",
  },
  {
    icon: "📅",
    title: "المخطط الذكي",
    description:
      "تنظيم الدراسة، جدولة المهام، وإضافة جلسات المراجعة تلقائياً.",
  },
  {
    icon: "🎯",
    title: "نظام التركيز",
    description:
      "تقليل المشتتات ومساعدة الطالب على الالتزام بجلسات الدراسة.",
  },
  {
    icon: "📈",
    title: "متابعة الأداء",
    description:
      "تحليل النتائج، اكتشاف نقاط الضعف، وعرض تقدم الطالب بمرور الوقت.",
  },
  {
    icon: "🏆",
    title: "التحديات",
    description:
      "زيادة الحماس من خلال الإنجازات والتحديات والمنافسات بين الطلاب.",
  },
];

const values = [
  "الابتكار",
  "التركيز",
  "التعلم المستمر",
  "الخصوصية",
  "سهولة الاستخدام",
  "الجودة",
];

const technologies = [
  "React",
  "Next.js",
  "Tailwind CSS",
  ".NET",
  "AI",
];

export default function AboutPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[var(--surface)] py-12 px-5"
    >
      <div className="max-w-7xl mx-auto">

        {/* Hero */}
        <section className="bg-white rounded-3xl shadow-sm p-8 md:p-12 mb-10 text-center">
          <Image
            src="/متقن.svg"
            alt="متقن"
            width={220}
            height={70}
            className="mx-auto mb-8"
          />

          <h1 className="text-4xl font-bold mb-6">
            عن متقن
          </h1>

          <p className="text-gray-600 text-lg leading-9 max-w-4xl mx-auto">
            متقن هو منصة تعليمية ذكية تهدف إلى مساعدة الطلاب على الدراسة
            بفاعلية أكبر من خلال الذكاء الاصطناعي، وإدارة الوقت، وتعزيز
            التركيز، وتتبع الأداء الأكاديمي في مكان واحد.
          </p>
        </section>

        {/* Statistics */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">

          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <h2 className="text-4xl mb-2">🧠</h2>
            <h3 className="font-bold text-xl">AI</h3>
            <p className="text-gray-500">معلم ذكي</p>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <h2 className="text-4xl mb-2">📚</h2>
            <h3 className="font-bold text-xl">5+</h3>
            <p className="text-gray-500">أنظمة مترابطة</p>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <h2 className="text-4xl mb-2">🎯</h2>
            <h3 className="font-bold text-xl">100%</h3>
            <p className="text-gray-500">التركيز على الطالب</p>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <h2 className="text-4xl mb-2">⚡</h2>
            <h3 className="font-bold text-xl">24/7</h3>
            <p className="text-gray-500">متاح دائماً</p>
          </div>

        </section>

        {/* Vision & Mission */}
        <section className="grid lg:grid-cols-2 gap-6 mb-10">

          <div className="bg-white rounded-3xl shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-5">
              رؤيتنا
            </h2>

            <p className="leading-9 text-gray-600">
              نسعى إلى بناء بيئة تعليمية حديثة تساعد الطلاب على تحقيق أفضل
              أداء أكاديمي من خلال دمج الذكاء الاصطناعي مع أحدث أساليب
              التعلم وإدارة الوقت.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-5">
              رسالتنا
            </h2>

            <p className="leading-9 text-gray-600">
              تمكين الطلاب من التعلم بذكاء، وتنظيم الدراسة، وتقليل
              التشتت، وتحويل المذاكرة إلى تجربة أكثر متعة وإنتاجية.
            </p>
          </div>

        </section>

        {/* Features */}
        <section className="bg-white rounded-3xl shadow-sm p-8 mb-10">

          <h2 className="text-3xl font-bold mb-8 text-center">
            لماذا متقن؟
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            {features.map((feature) => (
              <div
                key={feature.title}
                className="border rounded-2xl p-6 hover:shadow-md transition"
              >
                <div className="text-4xl mb-4">
                  {feature.icon}
                </div>

                <h3 className="font-bold text-xl mb-3">
                  {feature.title}
                </h3>

                <p className="text-gray-600 leading-8">
                  {feature.description}
                </p>
              </div>
            ))}

          </div>

        </section>

        {/* Difference */}
        <section className="bg-white rounded-3xl shadow-sm p-8 mb-10">

          <h2 className="text-3xl font-bold mb-6">
            لماذا يختلف متقن؟
          </h2>

          <p className="leading-9 text-gray-600 text-lg">
            معظم التطبيقات التعليمية تقدم أدوات منفصلة مثل التقويم أو
            الاختبارات أو الملاحظات، بينما يجمع متقن جميع هذه الأدوات في
            نظام واحد مترابط.
          </p>

          <br />

          <p className="leading-9 text-gray-600 text-lg">
            عند دراسة درس جديد يستطيع المعلم الذكي شرح المحتوى، ثم إنشاء
            اختبار مناسب، وبعدها يضيف المخطط الذكي مواعيد المراجعة
            تلقائياً، ويقوم نظام التركيز بمساعدتك على إتمام جلسة الدراسة
            دون تشتيت، بينما يتابع النظام تقدمك ويقدم توصيات لتحسين أدائك.
          </p>

        </section>

        {/* Timeline */}
        <section className="bg-white rounded-3xl shadow-sm p-8 mb-10">

          <h2 className="text-3xl font-bold mb-10 text-center">
            كيف يعمل؟
          </h2>

          <div className="grid md:grid-cols-4 gap-6 text-center">

            {[
              "أنشئ حسابك",
              "أضف المواد الدراسية",
              "ابدأ التعلم مع المعلم الذكي",
              "تابع تقدمك وحقق أهدافك",
            ].map((step, index) => (
              <div
                key={step}
                className="border rounded-2xl p-6"
              >
                <div className="text-3xl font-bold text-blue-600 mb-4">
                  {index + 1}
                </div>

                <p className="font-semibold leading-8">
                  {step}
                </p>
              </div>
            ))}

          </div>

        </section>

        {/* Values */}
        <section className="bg-white rounded-3xl shadow-sm p-8 mb-10">

          <h2 className="text-3xl font-bold mb-8 text-center">
            قيمنا
          </h2>

          <div className="flex flex-wrap justify-center gap-4">

            {values.map((value) => (
              <span
                key={value}
                className="px-6 py-3 rounded-full bg-blue-50 text-blue-700 font-semibold"
              >
                {value}
              </span>
            ))}

          </div>

        </section>

        {/* Technologies */}
        <section className="bg-white rounded-3xl shadow-sm p-8 mb-10">

          <h2 className="text-3xl font-bold mb-8 text-center">
            التقنيات المستخدمة
          </h2>

          <div className="flex flex-wrap justify-center gap-4">

            {technologies.map((tech) => (
              <div
                key={tech}
                className="border rounded-xl px-6 py-3 font-semibold"
              >
                {tech}
              </div>
            ))}

          </div>

        </section>

        {/* Team */}
        <section className="bg-white rounded-3xl shadow-sm p-8 mb-10">

          <h2 className="text-3xl font-bold mb-8 text-center">
            فريق العمل
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

            {[
              "Frontend Developer",
              "Backend Developer",
              "AI Engineer",
              "UI / UX Designer",
            ].map((role) => (
              <div
                key={role}
                className="border rounded-2xl p-6 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center text-3xl">
                  👤
                </div>

                <h3 className="font-bold">
                  اسم العضو
                </h3>

                <p className="text-gray-500 mt-2">
                  {role}
                </p>
              </div>
            ))}

          </div>

        </section>

        {/* Contact */}
        <section className="bg-white rounded-3xl shadow-sm p-8 text-center">

          <h2 className="text-3xl font-bold mb-6">
            تواصل معنا
          </h2>

          <p className="text-gray-600 leading-9 max-w-3xl mx-auto">
            إذا كانت لديك أي استفسارات أو اقتراحات لتحسين منصة متقن،
            يسعدنا التواصل معك والاستماع إلى آرائك.
          </p>

          <div className="mt-8 space-y-3">

            <p>
              📧 support@motqin.com
            </p>

            <p>
              🌐 www.motqin.com
            </p>

          </div>

        </section>

      </div>
    </main>
  );
}