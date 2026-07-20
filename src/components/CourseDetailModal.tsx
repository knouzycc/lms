/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Play, FileText, Lock, CheckCircle, Wallet, ArrowLeft, BookOpen, AlertCircle, Star } from "lucide-react";
import { Course, User } from "../types";

interface CourseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  user: User | null;
  onOpenAuth: () => void;
  onPurchaseWithWallet: (courseId: string, amount: number) => void;
  onTriggerPayment: () => void;
  onSubmitReview: (courseId: string, rating: number, comment: string) => void;
}

export default function CourseDetailModal({
  isOpen,
  onClose,
  course,
  user,
  onOpenAuth,
  onPurchaseWithWallet,
  onTriggerPayment,
  onSubmitReview,
}: CourseDetailModalProps) {
  if (!isOpen || !course) return null;

  const [ratingInput, setRatingInput] = React.useState(5);
  const [commentInput, setCommentInput] = React.useState("");
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);
  const [successMsg, setSuccessMsg] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const isEnrolled = user?.enrolledCourseIds.includes(course.id);
  const canAfford = user ? user.walletBalance >= course.price : false;

  const handleActionClick = () => {
    if (!user) {
      onOpenAuth();
    } else if (isEnrolled) {
      onClose(); // Parent handles tab switch
    } else if (canAfford) {
      onPurchaseWithWallet(course.id, course.price);
    } else {
      onTriggerPayment();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl z-10 text-right border border-gray-100 flex flex-col max-h-[90vh]"
          dir="rtl"
        >
          {/* Header Cover Photo */}
          <div className="relative h-48 bg-gray-900 flex-shrink-0">
            <img
              src={course.image}
              alt={course.title}
              className="w-full h-full object-cover opacity-70"
              referrerPolicy="no-referrer"
            />
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 bg-black/40 text-white hover:bg-black/60 rounded-full transition-all cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 right-4 text-white space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white font-extrabold px-2.5 py-1 rounded-md text-xs">
                  {course.category === "pure" ? "رياضيات بحتة" : "رياضيات تطبيقية"}
                </span>
                {course.rating && (
                  <span className="bg-amber-500 text-white font-extrabold px-2.5 py-1 rounded-md text-xs flex items-center gap-1 shadow-xs">
                    <Star className="w-3.5 h-3.5 fill-white stroke-none" />
                    <span>{course.rating}</span>
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black leading-tight drop-shadow-md">
                {course.title}
              </h3>
            </div>
          </div>

          {/* Body Content - Scrollable */}
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-extrabold text-gray-900">حول هذا الكورس التعليمي:</h4>
                {course.teacherName && (
                  <span className="text-xs bg-red-50 text-red-600 font-extrabold px-2.5 py-1 rounded-lg border border-red-100 flex items-center gap-1">
                    <span>👨‍🏫 الأستاذ:</span>
                    <strong>{course.teacherName}</strong>
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {course.description}
              </p>
            </div>

            {/* Share Course Widget */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-extrabold text-slate-800 block">📢 شارك الكورس مع زملائك:</span>
                <span className="text-[10px] text-gray-400">انشر العلم وساعد زملائك في الوصول لهذا الكورس المميز ✨</span>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={() => {
                    const shareText = `أوصيك بالتسجيل في كورس "${course.title}" للأستاذ ${course.teacherName || "القدير"}!`;
                    const shareUrl = `${window.location.origin}/?courseId=${course.id}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + "\n" + shareUrl)}`, "_blank");
                  }}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-emerald-100"
                  title="مشاركة عبر واتساب"
                >
                  <span>🟢 واتساب</span>
                </button>

                {/* Telegram */}
                <button
                  type="button"
                  onClick={() => {
                    const shareText = `أوصيك بالتسجيل في كورس "${course.title}" للأستاذ ${course.teacherName || "القدير"}!`;
                    const shareUrl = `${window.location.origin}/?courseId=${course.id}`;
                    window.open(`https://telegram.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "_blank");
                  }}
                  className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-sky-100"
                  title="مشاركة عبر تيليجرام"
                >
                  <span>🔵 تيليجرام</span>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/?courseId=${course.id}`;
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
                  }}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-blue-100"
                  title="مشاركة عبر فيسبوك"
                >
                  <span>🔵 فيسبوك</span>
                </button>

                {/* Copy Link */}
                <button
                  type="button"
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/?courseId=${course.id}`;
                    navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-slate-200"
                  title="نسخ الرابط"
                >
                  {copied ? (
                    <span className="text-emerald-600 flex items-center gap-1">✔️ تم النسخ!</span>
                  ) : (
                    <span>🔗 نسخ الرابط</span>
                  )}
                </button>
              </div>
            </div>

            {/* Course Curriculum */}
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5 pb-2 border-b border-gray-50">
                <BookOpen className="w-4 h-4 text-red-600" />
                <span>المحاضرات والدروس المشمولة ({course.lectures.length}):</span>
              </h4>

              <div className="space-y-3">
                {course.lectures.map((lect, idx) => (
                  <div
                    key={lect.id}
                    className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="block font-bold text-gray-800">{lect.title}</span>
                        <span className="block text-[10px] text-gray-400 mt-0.5">⏱️ المدة: {lect.duration}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400 font-bold">
                      {isEnrolled ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> متاح
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px]">
                          <Lock className="w-3.5 h-3.5" /> مغلق
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews & Ratings Section */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5 pb-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>تقييمات وآراء الطلاب ({course.reviews?.length || 0}):</span>
              </h4>

              {/* Average and Stars summary */}
              <div className="bg-amber-50/40 border border-amber-100/40 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-right space-y-1">
                  <span className="block text-xs font-medium text-gray-500">تقييم الكورس العام</span>
                  <div className="flex items-center justify-center sm:justify-start gap-1">
                    <span className="text-3xl font-black text-gray-900">{course.rating || "0.0"}</span>
                    <span className="text-sm text-gray-400">/ 5</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-400 justify-center sm:justify-start">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(course.rating || 0)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-center sm:text-left text-xs text-gray-500 max-w-sm">
                  <span className="block font-bold text-gray-800">تجارب وتقييمات حقيقية</span>
                  <span className="block text-[10px] text-gray-400 mt-0.5">كل التقييمات مأخوذة من حسابات طلاب مسجلين بالمنصة بالفعل للمصداقية التامة.</span>
                </div>
              </div>

              {/* Submission Form */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                <h5 className="text-xs font-extrabold text-gray-800">شاركنا رأيك وتقييمك للكورس:</h5>
                {user ? (
                  <div className="space-y-3">
                    {/* Interactive Stars */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500 ml-2">تقييمك بالنجوم:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingInput(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="p-0.5 hover:scale-110 transition-transform cursor-pointer focus:outline-hidden"
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              star <= (hoverRating !== null ? hoverRating : ratingInput)
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    {/* Comment text area */}
                    <div className="space-y-2">
                      <textarea
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="ما هو انطباعك عن جودة الشرح، التمارين، والملخصات؟"
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-red-500 focus:outline-hidden resize-none h-20 text-right"
                      />
                      
                      {successMsg && (
                        <p className="text-xs text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg text-center">
                          {successMsg}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (!commentInput.trim()) return;
                          onSubmitReview(course.id, ratingInput, commentInput);
                          setCommentInput("");
                          setSuccessMsg("تم تسجيل تقييمك ورأيك بنجاح! شكراً لك ✨");
                          setTimeout(() => setSuccessMsg(""), 4000);
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1 transition-all"
                      >
                        <span>إرسال التقييم والتعليق 💬</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-gray-500">يرجى تسجيل الدخول لتتمكن من كتابة تقييم ومشاركة رأيك.</p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAuth();
                      }}
                      className="mt-2 text-xs font-extrabold text-red-600 hover:underline"
                    >
                      تسجيل الدخول الآن 🔑
                    </button>
                  </div>
                )}
              </div>

              {/* Reviews List */}
              <div className="space-y-3 pt-2">
                {course.reviews && course.reviews.length > 0 ? (
                  course.reviews.map((rev) => (
                    <div key={rev.id} className="p-3 bg-white border border-gray-100 rounded-xl space-y-1.5 shadow-2xs">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-black text-xs">
                            {rev.studentName ? rev.studentName.charAt(0) : "ط"}
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-gray-800">{rev.studentName}</span>
                            <span className="block text-[10px] text-gray-400">
                              {new Date(rev.timestamp).toLocaleDateString("ar-EG", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Star display */}
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= rev.rating ? "fill-amber-400 text-amber-400" : "text-gray-100"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed pr-10">
                        {rev.comment}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4">لا توجد تقييمات مكتوبة بعد. كن أول من يقيم الكورس!</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer - Sticky bar */}
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
            {user && !isEnrolled && (
              <div className="text-right text-xs text-gray-500">
                <span className="block font-medium">رصيد محفظتك المتاح:</span>
                <span className="text-sm font-black text-gray-800">
                  <span className="text-red-600">{user.walletBalance}</span> ج.م
                </span>
              </div>
            )}

            <div>
              <span className="block text-[10px] text-gray-400 font-extrabold">مبلغ الاشتراك المطلق</span>
              <span className="text-2xl font-black text-red-600 font-mono">
                {course.price} <span className="text-xs font-bold">ج.م</span>
              </span>
            </div>

            <div className="w-full sm:w-auto">
              {!user ? (
                <button
                  onClick={handleActionClick}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-extrabold px-8 py-3 rounded-xl text-sm shadow-md cursor-pointer"
                >
                  سجل دخولك للاشتراك
                </button>
              ) : isEnrolled ? (
                <button
                  onClick={handleActionClick}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-8 py-3 rounded-xl text-sm shadow-md cursor-pointer flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>أنت مشترك! ابدأ الحصة الآن</span>
                </button>
              ) : canAfford ? (
                <button
                  onClick={handleActionClick}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-8 py-3 rounded-xl text-sm shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Wallet className="w-4 h-4" />
                  <span>تأكيد الشراء من رصيد المحفظة</span>
                </button>
              ) : (
                <button
                  onClick={handleActionClick}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-extrabold px-8 py-3 rounded-xl text-sm shadow-md shadow-red-100 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Wallet className="w-4 h-4" />
                  <span>شحن المحفظة وتفعيل الكورس</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
