/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import {
  BookOpen,
  GraduationCap,
  Users,
  Award,
  BookMarked,
  Layers,
  ArrowLeft,
  Tv,
  CheckCircle,
  FileText,
  Clock,
  Zap,
} from "lucide-react";
import { Course, GradeLevel, CourseCategory, User, PlatformSettings, AdCampaign } from "../types";

export function AdBanner({ ad }: { ad: AdCampaign }) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ad || !ad.isActive || ad.type !== "html" || !containerRef.current) return;

    // Clear previous contents
    containerRef.current.innerHTML = "";

    // Parse the HTML string
    const parser = new DOMParser();
    const doc = parser.parseFromString(ad.htmlCode || "", "text/html");
    
    // Move all non-script children to a fragment
    const fragment = document.createDocumentFragment();
    const elements = Array.from(doc.body.childNodes);
    const scriptsToExecute: HTMLScriptElement[] = [];

    elements.forEach((node) => {
      if (node.nodeName.toLowerCase() === "script") {
        scriptsToExecute.push(node as HTMLScriptElement);
      } else {
        fragment.appendChild(node.cloneNode(true));
      }
    });

    // Append non-script elements first
    containerRef.current.appendChild(fragment);

    // Execute scripts sequentially
    scriptsToExecute.forEach((script) => {
      const newScript = document.createElement("script");
      
      // Copy all attributes
      Array.from(script.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });

      if (script.src) {
        newScript.src = script.src;
        newScript.async = true;
      } else {
        newScript.textContent = script.textContent;
      }

      containerRef.current?.appendChild(newScript);
    });

    // Trigger Google AdSense push if needed
    try {
      if (window && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      console.warn("Google AdSense push error", e);
    }
  }, [ad]);

  if (!ad || !ad.isActive) return null;

  if (ad.type === "html") {
    return (
      <div 
        ref={containerRef}
        className="w-full overflow-hidden rounded-2xl flex justify-center items-center" 
      />
    );
  }

  return (
    <a 
      href={ad.linkUrl || "#"} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="block w-full overflow-hidden rounded-2xl hover:opacity-95 transition-opacity"
      title={ad.title}
    >
      <img 
        src={ad.imageUrl} 
        alt={ad.title} 
        className="w-full max-h-[300px] object-cover rounded-2xl" 
        referrerPolicy="no-referrer"
      />
    </a>
  );
}

export const translateCategory = (cat: CourseCategory) => {
  switch (cat) {
    case CourseCategory.PURE: return "رياضيات بحتة 📐";
    case CourseCategory.APPLIED: return "رياضيات تطبيقية ⚙️";
    case CourseCategory.PHYSICS: return "الفيزياء ⚡";
    case CourseCategory.CHEMISTRY: return "الكيمياء 🧪";
    case CourseCategory.BIOLOGY: return "الأحياء 🧬";
    case CourseCategory.ARABIC: return "اللغة العربية 📝";
    case CourseCategory.ENGLISH: return "اللغة الإنجليزية 🇬🇧";
    case CourseCategory.GEOLOGY: return "الجيولوجيا 💎";
    case CourseCategory.HISTORY: return "التاريخ ⏳";
    case CourseCategory.GEOGRAPHY: return "الجغرافيا 🗺️";
    case CourseCategory.MATH: return "الرياضيات العامة 📐";
    case CourseCategory.SCIENCE: return "العلوم 🧪";
    case CourseCategory.SOCIAL_STUDIES: return "الدراسات الاجتماعية 🗺️";
    case CourseCategory.FRENCH: return "اللغة الفرنسية 🇫🇷";
    case CourseCategory.GERMAN: return "اللغة الألمانية 🇩🇪";
    case CourseCategory.ITALIAN: return "اللغة الإيطالية 🇮🇹";
    case CourseCategory.COMPUTER: return "الحاسب الآلي والتكنولوجيا 💻";
    case CourseCategory.RELIGION: return "التربية الدينية 🕌";
    case CourseCategory.PHILOSOPHY: return "الفلسفة والمنطق 🧠";
    case CourseCategory.PSYCHOLOGY: return "علم النفس والاجتماع 👥";
    default: return "عام 🌐";
  }
};

export const translateGrade = (grade: GradeLevel) => {
  switch (grade) {
    case GradeLevel.PRIMARY_1: return "الأول الابتدائي";
    case GradeLevel.PRIMARY_2: return "الثاني الابتدائي";
    case GradeLevel.PRIMARY_3: return "الثالث الابتدائي";
    case GradeLevel.PRIMARY_4: return "الرابع الابتدائي";
    case GradeLevel.PRIMARY_5: return "الخامس الابتدائي";
    case GradeLevel.PRIMARY_6: return "السادس الابتدائي";
    case GradeLevel.PREP_1: return "الأول الإعدادي";
    case GradeLevel.PREP_2: return "الثاني الإعدادي";
    case GradeLevel.PREP_3: return "الثالث الإعدادي";
    case GradeLevel.FIRST: return "الأول الثانوي";
    case GradeLevel.SECOND: return "الثاني الثانوي";
    case GradeLevel.THIRD: return "الثالث الثانوي";
    default: return "صف دراسي آخر";
  }
};

interface LandingPageProps {
  courses: Course[];
  user: User | null;
  onOpenAuth: () => void;
  onSelectCourse: (course: Course) => void;
  onChangeTab: (tab: string) => void;
  platformSettings?: PlatformSettings;
}

export default function LandingPage({
  courses,
  user,
  onOpenAuth,
  onSelectCourse,
  onChangeTab,
  platformSettings,
}: LandingPageProps) {
  const [selectedGrade, setSelectedGrade] = React.useState<GradeLevel | "all">("all");
  const [selectedCategory, setSelectedCategory] = React.useState<CourseCategory | "all">("all");

  const filteredCourses = courses.filter((course) => {
    const matchesGrade = selectedGrade === "all" || course.grade === selectedGrade;
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
    return matchesGrade && matchesCategory;
  });

  const stats = [
    { id: "stat-1", label: "طالب وطالبة", value: "+٥٠,٠٠٠", icon: Users, color: "text-red-600 bg-red-50" },
    { id: "stat-2", label: "محاضرة تفاعلية", value: "+١,٢٠٠", icon: Tv, color: "text-emerald-600 bg-emerald-50" },
    { id: "stat-3", label: "أوراق عمل وملخصات", value: "+٨٠٠", icon: FileText, color: "text-blue-600 bg-blue-50" },
    { id: "stat-4", label: "سنوات الخبرة", value: "١٢ عاماً", icon: Award, color: "text-amber-600 bg-amber-50" },
  ];

  // Ad configurations
  const topAd = platformSettings?.ads?.find((a) => a.placement === "landing_top" && a.isActive);
  const sidebarAd = platformSettings?.ads?.find((a) => a.placement === "landing_sidebar" && a.isActive);
  const middleAd = platformSettings?.ads?.find((a) => a.placement === "landing_middle" && a.isActive);
  const bottomAd = platformSettings?.ads?.find((a) => a.placement === "landing_bottom" && a.isActive);

  return (
    <div className="space-y-16 pb-20" id="landing-page-root">
      {/* Top Banner Ad Campaign */}
      {topAd && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <AdBanner ad={topAd} />
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white py-12 md:py-20 border-b border-gray-100" id="hero-section">
        <div className="absolute inset-0 bg-radial from-red-50/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-sm font-bold border border-red-100"
            >
              <GraduationCap className="w-4 h-4" />
              <span>أقوى منصة تعليمية 🏆</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight text-center"
            >
              افهم موادك الدراسية <span className="text-red-600 relative inline-block">
                بكل سهولة
                <span className="absolute left-0 bottom-1 w-full h-2 bg-red-200/50 -z-10" />
              </span> وتفوق في امتحاناتك
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-gray-600 max-w-2xl leading-relaxed text-center"
            >
              مع نخبة من <span className="font-extrabold text-gray-900">كبار معلمي مصر</span> بقيادة الأستاذ ياسر أبوستيت، نوفر لك شرحاً تفاعلياً وافياً ومبسطاً لكل المواد الدراسية (الرياضيات، الفيزياء، الكيمياء، اللغات، والأدبيات)، بالإضافة لأقوى بنك أسئلة وتدريبات تفاعلية تضمن لك الـ 100%.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-4 justify-center pt-4"
            >
              {user ? (
                <button
                  onClick={() => onChangeTab("student-dashboard")}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-red-200 cursor-pointer text-base"
                >
                  <span>لوحة تحكم الطالب ومتابعة كورساتي</span>
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <>
                  <button
                    onClick={onOpenAuth}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-red-200 cursor-pointer text-base"
                  >
                    <span>اشترك وابدأ التعلم الآن</span>
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <a
                    href="#courses"
                    className="flex items-center justify-center border-2 border-gray-200 hover:border-red-600 hover:text-red-600 text-gray-700 font-extrabold px-8 py-4 rounded-2xl transition-all cursor-pointer text-base"
                  >
                    تصفح الكورسات المتاحة
                  </a>
                </>
              )}
            </motion.div>

            {/* Quick info row */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100 w-full max-w-lg">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-700">امتحانات فورية</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-700">ملخصات PDF ممتازة</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-700">دعم فني متكامل</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Middle Banner Ad Campaign */}
      {middleAd && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <AdBanner ad={middleAd} />
        </div>
      )}

      {/* Courses Catalog Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24" id="courses">
        <div className="text-center space-y-4 mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            تصفح المحاضرات والـكـورسـات الـمـتـاحـة 📚
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            اختر الصف الدراسي والفرع المناسب لك وابدأ الدراسة والتدريب الفوري.
          </p>

          {/* Filters layout */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center pt-6 max-w-4xl mx-auto">
            {/* Grade Filter */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200/80 rounded-2xl shadow-xs w-full md:w-1/2" id="grade-filter-group">
              <GraduationCap className="w-5 h-5 text-red-500 shrink-0" />
              <div className="text-right w-full">
                <span className="block text-[10px] font-black text-gray-400">تصفية حسب الصف</span>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value as any)}
                  className="bg-transparent text-sm font-bold text-gray-800 outline-hidden cursor-pointer w-full text-right"
                >
                  <option value="all">كل المراحل والصفوف الدراسية 🌍</option>
                  <optgroup label="المرحلة الابتدائية">
                    <option value={GradeLevel.PRIMARY_1}>الصف الأول الابتدائي</option>
                    <option value={GradeLevel.PRIMARY_2}>الصف الثاني الابتدائي</option>
                    <option value={GradeLevel.PRIMARY_3}>الصف الثالث الابتدائي</option>
                    <option value={GradeLevel.PRIMARY_4}>الصف الرابع الابتدائي</option>
                    <option value={GradeLevel.PRIMARY_5}>الصف الخامس الابتدائي</option>
                    <option value={GradeLevel.PRIMARY_6}>الصف السادس الابتدائي</option>
                  </optgroup>
                  <optgroup label="المرحلة الإعدادية">
                    <option value={GradeLevel.PREP_1}>الصف الأول الإعدادي</option>
                    <option value={GradeLevel.PREP_2}>الصف الثاني الإعدادي</option>
                    <option value={GradeLevel.PREP_3}>الصف الثالث الإعدادي</option>
                  </optgroup>
                  <optgroup label="المرحلة الثانوية">
                    <option value={GradeLevel.FIRST}>الصف الأول الثانوي</option>
                    <option value={GradeLevel.SECOND}>الصف الثاني الثانوي</option>
                    <option value={GradeLevel.THIRD}>الصف الثالث الثانوي</option>
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200/80 rounded-2xl shadow-xs w-full md:w-1/2" id="category-filter-group">
              <BookOpen className="w-5 h-5 text-red-500 shrink-0" />
              <div className="text-right w-full">
                <span className="block text-[10px] font-black text-gray-400">تصفية حسب المادة الدراسية</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="bg-transparent text-sm font-bold text-gray-800 outline-hidden cursor-pointer w-full text-right"
                >
                  <option value="all">جميع المواد الدراسية 📚</option>
                  {Object.values(CourseCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {translateCategory(cat)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Responsive layout with sidebar ad */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className={`${sidebarAd ? "lg:col-span-9" : "lg:col-span-12"} space-y-8`}>
            {/* Courses grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="courses-grid">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course) => {
                  const isEnrolled = user?.enrolledCourseIds.includes(course.id);
                  
                  return (
                    <motion.div
                      key={course.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.3 }}
                      className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg hover:border-red-100 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Cover image & Category badge */}
                        <div className="relative h-48 bg-gray-100 overflow-hidden">
                          <img
                            src={course.image}
                            alt={course.title}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-4 right-4 flex gap-2">
                            <span className="bg-red-600 text-white font-extrabold px-3 py-1 rounded-lg text-xs shadow-md">
                              {translateGrade(course.grade)}
                            </span>
                            <span className="bg-gray-900/80 backdrop-blur-xs text-white font-extrabold px-3 py-1 rounded-lg text-xs">
                              {translateCategory(course.category)}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 h-14 leading-snug">
                              {course.title}
                            </h3>
                            {course.teacherName && (
                              <p className="text-xs text-red-600 font-extrabold flex items-center gap-1 mt-1">
                                <span>👨‍🏫 الأستاذ:</span>
                                <span className="text-gray-700 font-black">{course.teacherName}</span>
                              </p>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-3 h-15 leading-relaxed">
                            {course.description}
                          </p>

                          {/* Course statistics */}
                          <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100 text-xs font-semibold text-gray-500 text-center">
                            <div>
                              <span className="block text-gray-400 font-normal">المحاضرات</span>
                              <span className="text-gray-900 font-bold">{course.lecturesCount} محاضرة</span>
                            </div>
                            <div>
                              <span className="block text-gray-400 font-normal">المدة</span>
                              <span className="text-gray-900 font-bold">{course.hoursCount}</span>
                            </div>
                            <div>
                              <span className="block text-gray-400 font-normal">المشتركون</span>
                              <span className="text-gray-900 font-bold">{course.studentsCount} طالب</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pricing / CTA row */}
                      <div className="p-6 bg-gray-50/60 border-t border-gray-50 flex items-center justify-between">
                        <div>
                          <span className="block text-xs text-gray-400 font-bold">سعر الكورس</span>
                          <span className="text-2xl font-black text-red-600 font-mono">
                            {course.price} <span className="text-sm font-bold">ج.م</span>
                          </span>
                        </div>

                        {isEnrolled ? (
                          <button
                            onClick={() => onSelectCourse(course)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-sm shadow-md transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>متابعة التعلم</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onSelectCourse(course)}
                            className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-sm shadow-md hover:shadow-red-200 transition-all cursor-pointer"
                          >
                            اشترك بالتفاصيل
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center text-gray-400 font-medium">
                  عذراً، لم يتم العثور على كورسات تطابق هذا الفلتر حالياً.
                </div>
              )}
            </div>
          </div>

          {sidebarAd && (
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white border border-gray-100 rounded-3xl p-5 sticky top-24 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <span className="text-xs font-black text-slate-800">مساحة إعلانية 📢</span>
                  <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-extrabold">ممول</span>
                </div>
                <AdBanner ad={sidebarAd} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-gray-50 py-16" id="about-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <span className="text-xs font-extrabold text-red-600 tracking-wider uppercase block">
              نحن نهتم بنجاحك التفوقي
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900">
              لماذا منصة اليسر هي خيارك الأول؟ 🎓
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">
              بنينا نظاماً متكاملاً يدعم الطالب خطوة بخطوة من الشرح الأساسي حتى ليلة الامتحان.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4 text-right">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                <Tv className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">أعلى جودة تصوير</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                شرح تفاعلي بجودة 4K على سبورة ذكية لتوضيح كل الخطوات الهندسية والرسوم البيانية بوضوح تام.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4 text-right">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <BookMarked className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">تدريب بعد كل فقرة</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                لكل مفهوم رياضي اختبارات تفاعلية مصغرة لتأكيد الفهم قبل الانتقال للنقطة التالية مباشرة.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4 text-right">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">أقوى ملازم وملخصات</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                أوراق شرح مرتبة بعناية تحتوي على خرائط ذهنية وملخصات للقوانين الرياضية لسهولة الحفظ والمراجعة.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4 text-right">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">متابعة أولياء الأمور</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                إرسال تقارير دورية بمستوى الطالب ونسبة إنجازه في الكورسات ودرجات امتحاناته أولاً بأول.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Banner Ad Campaign */}
      {bottomAd && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <AdBanner ad={bottomAd} />
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-100 pt-10 pb-6 text-center space-y-6">
        {platformSettings && (
          <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 max-w-2xl mx-auto">
            {platformSettings.contactPhone && (
              <span className="flex items-center gap-1.5">
                📞 الهاتف: <strong className="text-gray-700" id="contact-phone">{platformSettings.contactPhone}</strong>
              </span>
            )}
            {platformSettings.contactWhatsapp && (
              <a href={`https://wa.me/${platformSettings.contactWhatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-emerald-600 hover:underline" id="contact-whatsapp">
                💬 واتساب: <strong>{platformSettings.contactWhatsapp}</strong>
              </a>
            )}
            {platformSettings.contactEmail && (
              <span className="flex items-center gap-1.5">
                📧 البريد: <strong className="text-gray-700" id="contact-email">{platformSettings.contactEmail}</strong>
              </span>
            )}
            {platformSettings.contactTelegram && (
              <a href={platformSettings.contactTelegram.startsWith("http") ? platformSettings.contactTelegram : `https://${platformSettings.contactTelegram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sky-600 hover:underline" id="contact-telegram">
                ✈️ تليجرام
              </a>
            )}
            {platformSettings.contactFacebook && (
              <a href={platformSettings.contactFacebook.startsWith("http") ? platformSettings.contactFacebook : `https://${platformSettings.contactFacebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline" id="contact-facebook">
                👥 فيسبوك
              </a>
            )}
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500 pt-4 border-t border-gray-50">
          <p>© 2026 {platformSettings?.platformName || "منصة اليسر التعليمية 🌟"}. جميع الحقوق محفوظة.</p>
          <div className="flex gap-4">
            <span onClick={() => onChangeTab("landing-privacy")} className="hover:text-red-600 cursor-pointer">سياسة الخصوصية</span>
            <span onClick={() => onChangeTab("landing-terms")} className="hover:text-red-600 cursor-pointer">شروط الاستخدام</span>
            <span onClick={() => onChangeTab("landing-support")} className="hover:text-red-600 cursor-pointer">الدعم الفني والاتصال</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
