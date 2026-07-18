/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Wallet, CreditCard, Send, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { Course, User } from "../types";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  user: User;
  onNewPaymentRequest: (
    courseId: string,
    courseTitle: string,
    amount: number,
    method: "vodafone_cash" | "fawry" | "instapay" | "credit_card",
    senderPhoneOrRef: string
  ) => void;
  onDirectCardPurchase: (courseId: string, amount: number) => void;
}

type PaymentMethod = "vodafone_cash" | "instapay";

export default function PaymentModal({
  isOpen,
  onClose,
  course,
  user,
  onNewPaymentRequest,
  onDirectCardPurchase,
}: PaymentModalProps) {
  const [method, setMethod] = React.useState<PaymentMethod>("vodafone_cash");
  const [phoneOrRef, setPhoneOrRef] = React.useState("");
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setPhoneOrRef("");
      setSuccess(false);
      setError("");
    }
  }, [isOpen, method]);

  if (!isOpen || !course) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phoneOrRef) {
      setError("برجاء إدخال رقم المحول منه أو رقم مرجع المعاملة لتأكيد الدفع");
      return;
    }

    // Offline flow: request pending activation
    onNewPaymentRequest(course.id, course.title, course.price, method, phoneOrRef);
    setSuccess(true);
  };

  const methodsList: { id: PaymentMethod; label: string; desc: string }[] = [
    { id: "vodafone_cash", label: "كاش (Vodafone/Etisalat)", desc: "محافظ الهواتف الذكية" },
    { id: "instapay", label: "إنستاباي (InstaPay)", desc: "تحويل بنكي فوري مجاني" },
  ];

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

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          className="relative bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-right border border-gray-100"
          dir="rtl"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {success ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-8 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto border-2 border-emerald-100">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">
                تم إرسال طلب تفعيل الاشتراك بنجاح
              </h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                جاري مراجعة التحويل وتفعيل الكورس خلال دقائق. (لتجربة سريعة: بدّل لحساب المعلم ووافق على الطلب فورياً!).
              </p>
              <button
                onClick={onClose}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-sm"
              >
                حسناً، فهمت
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-black text-gray-900">الاشتراك في الكورس 💳</h2>
                <p className="text-xs text-gray-500">
                  كورس: <span className="text-red-600 font-extrabold">{course.title}</span>
                </p>
                <div className="inline-block mt-2 bg-red-50 text-red-600 px-4 py-1.5 rounded-xl font-mono text-lg font-black">
                  {course.price} ج.م
                </div>
              </div>

              {/* Grid of payment methods */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-600">اختر طريقة الدفع المفضلة:</label>
                <div className="grid grid-cols-2 gap-3">
                  {methodsList.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                        method === m.id
                          ? "border-red-500 bg-red-50/40 shadow-xs ring-1 ring-red-500"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className="block text-sm font-bold text-gray-900">{m.label}</span>
                      <span className="block text-[10px] text-gray-400 font-medium">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-gray-100">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Vodafone Cash Instructions */}
                {method === "vodafone_cash" && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                    <div className="text-xs text-gray-600 space-y-1">
                      <p className="font-extrabold text-gray-800">📌 خطوات الدفع عبر محفظة كاش:</p>
                      <p>1. قم بتحويل مبلغ <span className="font-extrabold text-red-600">{course.price} ج.م</span> إلى رقم المحفظة التالي:</p>
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-200 mt-1 font-mono text-base font-black text-gray-800 select-all" title="اضغط لنسخ الرقم">
                        <span>01008889818</span>
                        <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-md font-sans">محفظة الأكاديمية</span>
                      </div>
                      <p className="pt-1">2. بعد تحويل الأموال، اكتب رقم الهاتف الذي قمت بالتحويل منه ورقم المعاملة لتأكيد الدفع أدناه.</p>
                    </div>

                    <div className="space-y-1 pt-2">
                      <label className="block text-xs font-extrabold text-gray-700">رقم الهاتف المحول منه المعاملة</label>
                      <input
                        type="tel"
                        required
                        value={phoneOrRef}
                        onChange={(e) => setPhoneOrRef(e.target.value)}
                        placeholder="مثال: 01012345678"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-mono text-right outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                  </div>
                )}

                {/* InstaPay Instructions */}
                {method === "instapay" && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                    <div className="text-xs text-gray-600 space-y-1">
                      <p className="font-extrabold text-gray-800">📌 خطوات الدفع عبر إنستاباي (InstaPay):</p>
                      <p>1. افتح تطبيق InstaPay وقم بالتحويل إلى عنوان الدفع التالي:</p>
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-200 mt-1 font-mono text-base font-black text-gray-800 select-all" title="اضغط لنسخ العنوان">
                        <span>yassercc@instpay</span>
                        <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-md font-sans">IPN المعلم</span>
                      </div>
                      <p className="pt-1">2. أرسل مبلغ <span className="font-extrabold text-red-600">{course.price} ج.م</span> ثم اكتب اسم حسابك المحوَّل منه أو رقم معاملة التحويل أدناه.</p>
                    </div>

                    <div className="space-y-1 pt-2">
                      <label className="block text-xs font-extrabold text-gray-700">عنوان الدفع المحول منه أو رقم العملية</label>
                      <input
                        type="text"
                        required
                        value={phoneOrRef}
                        onChange={(e) => setPhoneOrRef(e.target.value)}
                        placeholder="مثال: ahmed@instapay أو رقم العملية"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-right outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Row */}
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3.5 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>تأكيد وإرسال طلب التفعيل للـمـعلم</span>
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>عملية مشفرة وآمنة تماماً لغرض التدريب والعرض الفني</span>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
