/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Phone, Lock, User, Users, MapPin, GraduationCap, AlertCircle, CheckCircle, ShieldAlert } from "lucide-react";
import { fetchUserByPhone, saveUserInFirestore } from "../lib/dbService";
import { GradeLevel, User as UserType } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (name: string, phone: string, role: "student" | "admin" | "teacher", grade?: GradeLevel) => void;
}

const GOVERNORATES = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "القليوبية",
  "الدقهلية",
  "الغربية",
  "الشرقية",
  "المنوفية",
  "دمياط",
  "كفر الشيخ",
  "البحيرة",
  "مطروح",
  "بورسعيد",
  "الإسماعيلية",
  "السويس",
  "شمال سيناء",
  "جنوب سيناء",
  "الفيوم",
  "بني سويف",
  "المنيا",
  "أسيوط",
  "سوهاج",
  "قنا",
  "الأقصر",
  "أسوان",
  "الوادي الجديد",
  "البحر الأحمر"
];

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = React.useState(true);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [parentPhone, setParentPhone] = React.useState("");
  const [governorate, setGovernorate] = React.useState("القاهرة");
  const [gender, setGender] = React.useState<"male" | "female">("male");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [grade, setGrade] = React.useState<GradeLevel>(GradeLevel.THIRD);
  const [error, setError] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setName("");
      setPhone("");
      setParentPhone("");
      setGovernorate("القاهرة");
      setGender("male");
      setPassword("");
      setConfirmPassword("");
      setError("");
      setSuccessMsg("");
      setIsSubmitting(false);
    }
  }, [isOpen, isLogin]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      // Validate common fields
      if (!phone || phone.length < 11 || !phone.startsWith("01")) {
        setError("برجاء إدخال رقم هاتف محمول صحيح مكون من 11 رقماً ويبدأ بـ 01");
        setIsSubmitting(false);
        return;
      }
      if (!password || password.length < 4) {
        setError("برجاء إدخال كلمة مرور مكونة من 4 أحرف أو أرقام على الأقل");
        setIsSubmitting(false);
        return;
      }

      // Check if it's admin/teacher bypass
      const isAdminBypass = phone === "01000000000" || password === "admin123";
      const isTeacherBypass = phone === "01111111111" || password === "teacher123";

      if (isLogin) {
        if (isAdminBypass) {
          onLoginSuccess("مدير المنصة", phone, "admin", grade);
          setSuccessMsg("تم تسجيل الدخول بصلاحيات مدير المنصة (صلاحيات غير محدودة) بنجاح! جاري الانتقال لوحة التحكم... 👑");
          setTimeout(() => {
            onClose();
          }, 1200);
          return;
        }

        if (isTeacherBypass) {
          onLoginSuccess("الأستاذ ياسر أبوستيت (معلم الرياضيات)", phone, "teacher", grade);
          setSuccessMsg("تم تسجيل الدخول بصلاحيات المعلم (صلاحيات محدودة) بنجاح! جاري الانتقال لوحة التحكم... 👨‍🏫");
          setTimeout(() => {
            onClose();
          }, 1200);
          return;
        }

        // Fetch user from Firestore
        const dbUser = await fetchUserByPhone(phone);
        if (!dbUser) {
          setError("عذراً، هذا الرقم غير مسجل بالمنصة! برجاء إنشاء حساب طالب جديد أولاً.");
          setIsSubmitting(false);
          return;
        }

        // Verify password
        if (dbUser.password && dbUser.password !== password) {
          setError("كلمة المرور غير صحيحة! يرجى إعادة المحاولة.");
          setIsSubmitting(false);
          return;
        }

        // Login success
        onLoginSuccess(dbUser.name, phone, dbUser.role, dbUser.grade);
        setSuccessMsg(`مرحباً بك مجدداً يا ${dbUser.name}! جاري دخول المنصة...`);
        setTimeout(() => {
          onClose();
        }, 1200);

      } else {
        // Register mode validation
        if (!name || name.trim().split(" ").length < 2) {
          setError("برجاء كتابة الاسم ثنائياً أو ثلاثياً على الأقل لضمان التسجيل الرسمي");
          setIsSubmitting(false);
          return;
        }
        if (!parentPhone || parentPhone.length < 11 || !parentPhone.startsWith("01")) {
          setError("برجاء إدخال رقم هاتف ولي أمر صحيح مكون من 11 رقماً ويبدأ بـ 01");
          setIsSubmitting(false);
          return;
        }
        if (phone === parentPhone) {
          setError("رقم هاتف ولي الأمر يجب أن يكون مختلفاً تماماً عن رقم هاتف الطالب!");
          setIsSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("كلمتا المرور غير متطابقتين! برجاء إعادة التحقق.");
          setIsSubmitting(false);
          return;
        }

        // Check if user already exists
        const existingUser = await fetchUserByPhone(phone);
        if (existingUser) {
          setError("هذا الرقم مسجل بالفعل بالمنصة! يمكنك تسجيل الدخول مباشرة بنفس الرقم.");
          setIsSubmitting(false);
          return;
        }

        // Create new user object
        const newStudent: UserType = {
          id: "student-" + Date.now(),
          name: name.trim(),
          phone,
          role: "student",
          walletBalance: 0, // welcome balance
          enrolledCourseIds: [],
          quizAttempts: {},
          completedLectures: [],
          parentPhone,
          governorate,
          gender,
          password,
        };

        // Save to Firestore
        await saveUserInFirestore(newStudent);

        setSuccessMsg("تم إنشاء حسابك وتفعيله بنجاح! جاري تسجيل دخولك تلقائياً... 🎉");
        
        // Pass to parent handler
        onLoginSuccess(newStudent.name, phone, "student", grade);
        
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("حدث خطأ غير متوقع أثناء معالجة البيانات، يرجى المحاولة لاحقاً.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-xs">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className={`relative bg-white w-full ${
            isLogin ? "max-w-md" : "max-w-2xl"
          } rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-right border border-gray-100 transition-all duration-300 my-8`}
          dir="rtl"
          id="auth-modal-content"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-full transition-all cursor-pointer z-20"
            id="auth-close-btn"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Star Logo and Platform Header */}
          <div className="text-center space-y-2 mb-6">
            <span className="font-mono text-3xl font-extrabold text-red-600 bg-red-50 w-14 h-14 inline-flex items-center justify-center rounded-2xl mb-1 shadow-inner animate-pulse">
              🌟
            </span>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {isLogin ? "تسجيل الدخول للمنصة" : "إنشاء حساب طالب جديد"}
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              {isLogin
                ? "مرحباً بك مجدداً في منصة اليسر التعليمية"
                : "سجل بياناتك الرسمية والصحيحة لتتمكن من تفعيل الكورسات فورياً"}
            </p>
          </div>

          {/* Interactive Sliding Toggle Switch */}
          <div className="relative flex p-1.5 bg-gray-100 rounded-2xl mb-6">
            <div
              className={`absolute top-1.5 bottom-1.5 right-1.5 bg-white shadow-md rounded-xl transition-all duration-300 ${
                isLogin ? "w-[calc(50%-6px)] translate-x-0" : "w-[calc(50%-6px)] -translate-x-[100%]"
              }`}
            />
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`relative z-10 w-1/2 py-2 text-xs font-bold text-center rounded-xl transition-colors cursor-pointer ${
                isLogin ? "text-red-700" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`relative z-10 w-1/2 py-2 text-xs font-bold text-center rounded-xl transition-colors cursor-pointer ${
                !isLogin ? "text-red-700" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              إنشاء حساب جديد
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-500 animate-bounce" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Responsive Input Fields Container */}
            <div className={`grid grid-cols-1 ${isLogin ? "gap-4" : "md:grid-cols-2 gap-4"}`}>
              {/* === Column 1 === */}
              <div className="space-y-4">
                {/* Student Full Name (Signup only) */}
                {!isLogin && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-600">الاسم ثلاثي أو رباعي بالكامل</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-hidden text-right"
                        placeholder="أدخل اسمك كاملاً للتسجيل"
                        id="auth-name-input"
                      />
                    </div>
                  </div>
                )}

                {/* Student Phone Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-600">
                    {isLogin ? "رقم الهاتف المسجل" : "رقم هاتف الطالب"}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-hidden text-right font-mono"
                      placeholder="01xxxxxxxxx"
                      id="auth-phone-input"
                    />
                  </div>
                </div>

                {/* Parent Phone Number (Signup only) */}
                {!isLogin && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-600">رقم هاتف ولي الأمر</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none">
                        <Users className="w-4 h-4" />
                      </span>
                      <input
                        type="tel"
                        required
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-hidden text-right font-mono"
                        placeholder="01xxxxxxxxx"
                        id="auth-parent-phone-input"
                      />
                    </div>
                  </div>
                )}

                {/* Governorate Selector (Signup only) */}
                {!isLogin && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-600">المحافظة</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <select
                        value={governorate}
                        onChange={(e) => setGovernorate(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-hidden text-right cursor-pointer"
                        id="auth-governorate-select"
                      >
                        {GOVERNORATES.map((gov) => (
                          <option key={gov} value={gov}>
                            {gov}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* === Column 2 === */}
              <div className="space-y-4">
                {/* Academic Grade (Signup only) */}
                {!isLogin && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-600">الصف الدراسي</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none">
                        <GraduationCap className="w-4 h-4" />
                      </span>
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value as GradeLevel)}
                        className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-hidden text-right cursor-pointer"
                        id="auth-grade-select"
                      >
                        <option value={GradeLevel.PRIMARY_1}>الصف الأول الابتدائي 🎒</option>
                        <option value={GradeLevel.PRIMARY_2}>الصف الثاني الابتدائي 🎒</option>
                        <option value={GradeLevel.PRIMARY_3}>الصف الثالث الابتدائي 🎒</option>
                        <option value={GradeLevel.PRIMARY_4}>الصف الرابع الابتدائي 🎒</option>
                        <option value={GradeLevel.PRIMARY_5}>الصف الخامس الابتدائي 🎒</option>
                        <option value={GradeLevel.PRIMARY_6}>الصف السادس الابتدائي 🎒</option>
                        <option value={GradeLevel.PREP_1}>الصف الأول الإعدادي 📝</option>
                        <option value={GradeLevel.PREP_2}>الصف الثاني الإعدادي 📝</option>
                        <option value={GradeLevel.PREP_3}>الصف الثالث الإعدادي 📝</option>
                        <option value={GradeLevel.FIRST}>الصف الأول الثانوي 🎓</option>
                        <option value={GradeLevel.SECOND}>الصف الثاني الثانوي 🎓</option>
                        <option value={GradeLevel.THIRD}>الصف الثالث الثانوي 🎓</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Gender Options (Signup only) */}
                {!isLogin && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-600">الجنس (النوع)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGender("male")}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-extrabold transition-all cursor-pointer ${
                          gender === "male"
                            ? "bg-red-50 border-red-600 text-red-700 shadow-xs"
                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        👨 ذكر
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender("female")}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-extrabold transition-all cursor-pointer ${
                          gender === "female"
                            ? "bg-red-50 border-red-600 text-red-700 shadow-xs"
                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        👩 أنثى
                      </button>
                    </div>
                  </div>
                )}

                {/* Account Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-600">كلمة المرور</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-hidden text-right"
                      placeholder="••••••••"
                      id="auth-password-input"
                    />
                  </div>
                </div>

                {/* Confirm Account Password (Signup only) */}
                {!isLogin && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-600">تأكيد كلمة المرور</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-hidden text-right"
                        placeholder="••••••••"
                        id="auth-confirm-password-input"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Platform Security Rules Panel (Signup only) */}
            {!isLogin && (
              <div className="p-3.5 bg-red-50/40 border border-red-100 rounded-2xl text-right space-y-1.5 mt-2">
                <div className="flex items-center gap-1.5 text-red-700 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 animate-bounce" />
                  <span>تنبيه أمان وحماية الحساب:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-gray-600 font-medium">
                  يُسمح بتسجيل الدخول للحساب من جهاز واحد فقط في نفس الوقت. تتبع المنصة نظام حماية متطور يقوم برصد أي محاولات لمشاركة الحساب أو تشغيله على أجهزة متعددة بشكل متزامن، مما قد يعرض حساب الطالب للإيقاف التلقائي والنهائي حرصاً على أمن المحتوى والمستخدم.
                </p>
              </div>
            )}

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3.5 rounded-xl text-sm shadow-md shadow-red-100 transition-all cursor-pointer mt-4 flex items-center justify-center gap-2 ${
                isSubmitting ? "opacity-75 cursor-not-allowed" : ""
              }`}
              id="auth-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري معالجة طلبك...</span>
                </>
              ) : (
                <span>{isLogin ? "تسجيل الدخول للمنصة 🚪" : "إنشاء الحساب وتفعيل العضوية 🚀"}</span>
              )}
            </button>
          </form>

          {/* Form Switch Bottom Toggle Link */}
          <div className="text-center mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
              id="auth-toggle-mode-btn"
            >
              {isLogin ? "لا تملك حساباً؟ اضغط هنا لإنشاء حساب طالب جديد" : "تملك حساباً بالفعل؟ اضغط هنا لتسجيل الدخول"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
