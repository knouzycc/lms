/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { 
  User, 
  Lock, 
  MapPin, 
  GraduationCap, 
  Phone, 
  Camera, 
  Save, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";
import { User as UserType, GradeLevel } from "../types";
import { updateUserInFirestore } from "../lib/dbService";

interface StudentProfileProps {
  user: UserType;
  onUpdateProfile: (updatedUser: UserType) => void;
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

// Fun chemistry/academic pre-configured avatars
const ACADEMIC_AVATARS = [
  { emoji: "🌟", label: "نجم اليسر", url: "emoji:🌟" },
  { emoji: "👨‍🔬", label: "الكيميائي الصغير", url: "emoji:👨‍🔬" },
  { emoji: "👩‍🔬", label: "الكيميائية المبدعة", url: "emoji:👩‍🔬" },
  { emoji: "⚡", label: "طاقة وإبداع", url: "emoji:⚡" },
  { emoji: "🧪", label: "شغف التجارب", url: "emoji:🧪" },
  { emoji: "🧠", label: "عقل مفكر", url: "emoji:🧠" },
  { emoji: "🎓", label: "المتفوق المتميز", url: "emoji:🎓" },
  { emoji: "👑", label: "ملك الكيمياء", url: "emoji:👑" }
];

export default function StudentProfile({ user, onUpdateProfile }: StudentProfileProps) {
  const [name, setName] = React.useState(user.name);
  const [parentPhone, setParentPhone] = React.useState(user.parentPhone || "");
  const [governorate, setGovernorate] = React.useState(user.governorate || "القاهرة");
  const [grade, setGrade] = React.useState<GradeLevel>(user.grade || GradeLevel.THIRD);
  const [password, setPassword] = React.useState(user.password || "");
  const [showPassword, setShowPassword] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState(user.avatarUrl || "emoji:🦅");
  
  const [success, setSuccess] = React.useState("");
  const [error, setError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // File Upload Reference
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 250000) {
      setError("حجم الصورة كبير جداً! يرجى اختيار صورة أصغر من 250 كيلوبايت لضمان الحفظ.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result as string);
        setError("");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    if (!name.trim() || name.trim().split(" ").length < 2) {
      setError("برجاء كتابة الاسم ثنائياً أو ثلاثياً على الأقل لضمان التسجيل الرسمي");
      setIsSubmitting(false);
      return;
    }

    if (parentPhone && (parentPhone.length < 11 || !parentPhone.startsWith("01"))) {
      setError("برجاء إدخال رقم هاتف ولي أمر صحيح مكون من 11 رقماً ويبدأ بـ 01");
      setIsSubmitting(false);
      return;
    }

    if (user.phone === parentPhone) {
      setError("رقم هاتف ولي الأمر يجب أن يكون مختلفاً تماماً عن رقم هاتف الطالب!");
      setIsSubmitting(false);
      return;
    }

    if (password && password.length < 4) {
      setError("برجاء إدخال كلمة مرور مكونة من 4 أحرف أو أرقام على الأقل");
      setIsSubmitting(false);
      return;
    }

    try {
      const updatedUser: UserType = {
        ...user,
        name: name.trim(),
        parentPhone,
        governorate,
        grade,
        password,
        avatarUrl
      };

      // Save to Firestore
      await updateUserInFirestore(user.id, {
        name: name.trim(),
        parentPhone,
        governorate,
        grade,
        password,
        avatarUrl
      });

      onUpdateProfile(updatedUser);
      setSuccess("تم تحديث بياناتك الشخصية وحفظها في قاعدة البيانات بنجاح! ✨");
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Profile save error:", err);
      setError("حدث خطأ غير متوقع أثناء حفظ التعديلات.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAvatarPreview = () => {
    if (avatarUrl.startsWith("emoji:")) {
      const emoji = avatarUrl.split(":")[1] || "🦅";
      return (
        <div className="w-24 h-24 rounded-3xl bg-red-50 border border-red-200 shadow-inner flex items-center justify-center text-5xl">
          {emoji}
        </div>
      );
    }
    return (
      <img
        src={avatarUrl}
        alt="Avatar"
        className="w-24 h-24 rounded-3xl object-cover border-2 border-red-200 shadow-md"
        referrerPolicy="no-referrer"
      />
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-xs border border-gray-100 p-6 sm:p-8 text-right" id="student-profile-section">
      <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100 mb-6">
        {/* Avatar Section */}
        <div className="relative group">
          {renderAvatarPreview()}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -left-1 bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-2xl shadow-md transition-all cursor-pointer hover:scale-105"
            title="تغيير الصورة الشخصية"
            id="upload-avatar-trigger"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Student Welcome Header */}
        <div className="text-center sm:text-right space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold">طالب مسجل</span>
            <span className="font-mono text-xs text-gray-500">ID: {user.id.substring(0, 10)}</span>
          </div>
          <h3 className="text-xl font-black text-gray-900">{user.name}</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            رقم الهاتف: <span className="font-mono font-bold text-gray-700">{user.phone}</span> • يمكنك تخصيص صورتك وباقي بيانات حسابك بالأسفل.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600 animate-bounce" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Academic Avatars selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-600">اختر رمزاً أكاديمياً كصورة لحسابك (اختياري)</label>
          <div className="flex flex-wrap gap-2">
            {ACADEMIC_AVATARS.map((av) => (
              <button
                key={av.url}
                type="button"
                onClick={() => setAvatarUrl(av.url)}
                className={`py-1.5 px-3.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  avatarUrl === av.url
                    ? "bg-red-50 border-red-400 text-red-700 font-bold scale-105"
                    : "bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-600"
                }`}
              >
                <span className="text-lg">{av.emoji}</span>
                <span>{av.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Student Name */}
          <div className="space-y-1.5">
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
                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-hidden text-right font-medium"
                placeholder="أدخل اسمك بالكامل"
                id="profile-name-input"
              />
            </div>
          </div>

          {/* Academic Grade */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-600">الصف الدراسي الحالي</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none">
                <GraduationCap className="w-4 h-4" />
              </span>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as GradeLevel)}
                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-hidden text-right cursor-pointer"
                id="profile-grade-select"
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

          {/* Governorate */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-600">المحافظة</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none">
                <MapPin className="w-4 h-4" />
              </span>
              <select
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-hidden text-right cursor-pointer"
                id="profile-governorate-select"
              >
                {GOVERNORATES.map((gov) => (
                  <option key={gov} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Parent Phone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-600">رقم هاتف ولي الأمر</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-hidden text-right font-mono"
                placeholder="01xxxxxxxxx"
                id="profile-parent-phone"
              />
            </div>
          </div>

          {/* Secure Password Field */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-gray-600">تحديث كلمة مرور الحساب</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all outline-hidden text-right"
                placeholder="أدخل كلمة مرور جديدة أو اتركها كما هي لحفظ الحالية"
                id="profile-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                id="profile-password-toggle"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-3.5 rounded-xl text-xs shadow-md shadow-red-100 hover:shadow-lg hover:shadow-red-200 transition-all cursor-pointer flex items-center gap-2 ${
              isSubmitting ? "opacity-75 cursor-not-allowed" : ""
            }`}
            id="profile-submit-btn"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري الحفظ والتحديث...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات الشخصية الحالية 💾</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
