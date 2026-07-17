/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Award, Printer, Download, ShieldCheck } from "lucide-react";
import { Course, User } from "../types";

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  user: User;
}

export default function CertificateModal({
  isOpen,
  onClose,
  course,
  user,
}: CertificateModalProps) {
  if (!isOpen) return null;

  const certificateId = `MATH-CERT-${course.id.toUpperCase()}-${user.id.slice(-4).toUpperCase()}`;
  const currentDate = new Date().toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal content wrapper */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative bg-white w-full max-w-4xl rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-right print:p-0 print:shadow-none print:my-0 print:max-w-full"
          dir="rtl"
        >
          {/* Close Button - hidden in print */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-full transition-all cursor-pointer z-10 print:hidden"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Banner message - hidden in print */}
          <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 print:hidden">
            <Award className="w-8 h-8 text-red-600 flex-shrink-0 animate-bounce" />
            <div>
              <h4 className="text-sm font-black text-gray-900">مبارك تخرجك وتفوقك! 🎉</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                لقد اجتزت بنجاح جميع محاضرات المادة وحصلت على الدرجات المطلوبة بالاختبارات. الشهادة جاهزة للطباعة أو الحفظ كملف PDF.
              </p>
            </div>
          </div>

          {/* Printable Certificate Frame */}
          <div 
            id="certificate-print-area"
            className="relative border-[12px] border-amber-800/80 p-8 sm:p-12 rounded-2xl bg-[#fdfcf7] text-center space-y-8 overflow-hidden shadow-inner border-double select-none"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(217,119,6,0.02) 0%, rgba(251,191,36,0.01) 100%)",
            }}
          >
            {/* Elegant Corner Ornaments */}
            <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-amber-600/50 rounded-tr-lg" />
            <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-amber-600/50 rounded-tl-lg" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-amber-600/50 rounded-br-lg" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-amber-600/50 rounded-bl-lg" />

            {/* Watermark Logo/Math symbols */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <span className="text-[200px] font-black font-mono">∑ ∫ π</span>
            </div>

            {/* Certificate Header */}
            <div className="space-y-3 relative">
              <div className="inline-flex items-center justify-center gap-2 text-amber-700">
                <ShieldCheck className="w-8 h-8 stroke-[1.5]" />
                <span className="text-sm font-extrabold tracking-widest uppercase">منصة اليسر التعليمية الإلكترونية</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-amber-900 font-sans tracking-tight">
                شهادة إتمام وتفوق 📜
              </h2>
              <div className="h-0.5 w-40 bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto mt-2" />
            </div>

            {/* Main Statement */}
            <div className="space-y-6 relative">
              <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed">
                بكل فخر واعتزاز بالتحصيل العلمي المتميز، تشهد إدارة المنصة بأن الطالب(ة):
              </p>
              
              <h3 className="text-xl sm:text-3xl font-black text-gray-900 font-sans border-b border-dashed border-amber-800/20 pb-2 max-w-lg mx-auto leading-relaxed">
                {user.name}
              </h3>

              <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed max-w-xl mx-auto">
                قد أتم بنجاح وبدرجة عالية من الكفاءة العلمية، دراسة ومراجعة وحل اختبارات كورس:
              </p>

              <h4 className="text-lg sm:text-2xl font-extrabold text-amber-800 leading-relaxed bg-amber-50/50 px-4 py-2 rounded-xl inline-block border border-amber-100/30">
                {course.title}
              </h4>

              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-lg mx-auto">
                وتقديراً لجهوده ومثابرته في حل المسائل والتمارين التفاعلية وإتقان فروع مادة الرياضيات للمرحلة الثانوية، تم منحه هذه الشهادة الإلكترونية الرسمية.
              </p>
            </div>

            {/* Footer with Signatures & Seal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 items-end relative text-right sm:text-center">
              {/* Teacher Signature */}
              <div className="space-y-2">
                <span className="block text-[11px] text-gray-400 font-bold">مدرس المادة:</span>
                <span className="block text-sm font-black text-amber-950 font-sans">الأستاذ ياسر أبوستيت</span>
                <span className="block text-[10px] text-emerald-600 font-serif font-semibold italic border-t border-gray-100 pt-1">ياسر أبوستيت (توقيع إلكتروني)</span>
              </div>

              {/* Golden Seal Badge */}
              <div className="flex justify-center my-2 sm:my-0">
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center shadow-lg border-4 border-amber-700/30 animate-pulse">
                  <div className="absolute inset-2 rounded-full border border-white/40 border-dashed" />
                  <Award className="w-10 h-10 text-white drop-shadow-md" />
                  {/* Seal ribbon effect */}
                  <div className="absolute -bottom-2 w-4 h-8 bg-amber-700 transform rotate-45 -z-10" />
                  <div className="absolute -bottom-2 w-4 h-8 bg-amber-700 transform -rotate-45 -z-10" />
                </div>
              </div>

              {/* Academy Verification ID */}
              <div className="space-y-2 text-right sm:text-left">
                <span className="block text-[11px] text-gray-400 font-bold">تاريخ الاعتماد:</span>
                <span className="block text-xs font-bold text-gray-700">{currentDate}</span>
                <div className="border-t border-gray-100 pt-1 text-[10px] text-gray-400 font-mono">
                  رقم الشهادة: <span className="font-bold text-gray-600">{certificateId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row - hidden in print */}
          <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3 print:hidden">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
            >
              إغلاق النافذة
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الشهادة / حفظ كـ PDF 📥</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
