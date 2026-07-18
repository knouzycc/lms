import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  FileText, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  Award, 
  X,
  Play,
  RotateCcw
} from "lucide-react";
import { Quiz, Question, User, SupportTicket, ActivityLog } from "../types";
import { saveSupportTicketInFirestore, saveActivityLogInFirestore } from "../lib/dbService";

interface AdvancedQuizEngineProps {
  quiz: Quiz;
  timerMode: "quiz" | "question" | "off";
  customMinutes: number;
  onCompleteQuiz: (score: number, total: number, answers: any[]) => void;
  onCancel: () => void;
  user: User;
}

export default function AdvancedQuizEngine({
  quiz,
  timerMode,
  customMinutes,
  onCompleteQuiz,
  onCancel,
  user
}: AdvancedQuizEngineProps) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState<any[]>(
    new Array(quiz.questions.length).fill(-1)
  );
  
  // Timer states
  const [secondsRemaining, setSecondsRemaining] = React.useState(0);
  const [initialDuration, setInitialDuration] = React.useState(0);
  const [isTimeUp, setIsTimeUp] = React.useState(false);

  // Anti-cheat violations
  const [violationsCount, setViolationsCount] = React.useState(0);
  const [showCheatOverlay, setShowCheatOverlay] = React.useState(false);
  const [cheatLogs, setCheatLogs] = React.useState<string[]>([]);
  
  // Ensure we can access current answers inside interval callbacks safely
  const answersRef = React.useRef<any[]>([]);
  React.useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Check if answers are correct using identical grading logic
  const isAnswerCorrect = (q: Question, ans: any): boolean => {
    const type = q.type || "mcq";
    if (type === "mcq" || type === "true_false") {
      return ans === q.correctAnswerIndex;
    }
    if (type === "text") {
      if (typeof ans !== "string") return false;
      const cleanUser = ans.trim().toLowerCase();
      const cleanCorrect = (q.correctTextAnswer || "").trim().toLowerCase();
      return cleanUser !== "" && cleanUser === cleanCorrect;
    }
    if (type === "multi_select") {
      if (!Array.isArray(ans)) return false;
      const correctIndices = q.correctAnswersIndices || [q.correctAnswerIndex];
      if (ans.length !== correctIndices.length) return false;
      return ans.every(idx => correctIndices.includes(idx)) && correctIndices.every(idx => ans.includes(idx));
    }
    return false;
  };

  const isQuestionAnswered = (q: Question, ans: any): boolean => {
    const type = q.type || "mcq";
    if (type === "mcq" || type === "true_false") {
      return ans !== -1 && ans !== undefined && ans !== null;
    }
    if (type === "text") {
      return typeof ans === "string" && ans.trim().length > 0;
    }
    if (type === "multi_select") {
      return Array.isArray(ans) && ans.length > 0;
    }
    return false;
  };

  // Initialize timer
  React.useEffect(() => {
    if (timerMode === "quiz") {
      const duration = customMinutes * 60;
      setSecondsRemaining(duration);
      setInitialDuration(duration);
    } else if (timerMode === "question") {
      const qDuration = 60; // 60s per question
      setSecondsRemaining(qDuration);
      setInitialDuration(qDuration);
    }
  }, [quiz.id, timerMode, customMinutes, currentQuestionIdx]);

  // Submission handler
  const handleForceSubmit = React.useCallback((reason: string) => {
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      if (isAnswerCorrect(q, answersRef.current[idx])) {
        score++;
      }
    });
    
    // Play alert in Arabic
    alert(`🚨 تم تسليم وإغلاق الاختبار تلقائياً: ${reason}`);
    onCompleteQuiz(score, quiz.questions.length, answersRef.current);
  }, [quiz.questions, onCompleteQuiz]);

  // Tick timer
  React.useEffect(() => {
    if (timerMode === "off" || isTimeUp) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (timerMode === "quiz") {
            setIsTimeUp(true);
            handleForceSubmit("انتهى وقت الاختبار المحدد!");
          } else {
            // Next question or submit if last
            if (currentQuestionIdx < quiz.questions.length - 1) {
              setCurrentQuestionIdx(prevIdx => prevIdx + 1);
              return 60; // Reset question timer
            } else {
              setIsTimeUp(true);
              handleForceSubmit("انتهى الوقت المخصص لآخر سؤال!");
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerMode, currentQuestionIdx, quiz.questions.length, handleForceSubmit, isTimeUp]);

  // Anti-cheat listeners setup
  React.useEffect(() => {
    // 1. Context Menu blocker (Disable right-click)
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addLog("محاولة استخدام كليك يمين 🚫");
      alert("🚫 تم تعطيل الزر الأيمن للفأرة (كليك يمين) داخل الاختبار لحماية المحتوى التعليمي ومنع تسريبه!");
    };

    // 2. Keyboard shortcuts blocker (Disable copy, cut, paste, devtools)
    const blockShortcuts = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        addLog("محاولة فتح أدوات المطور F12 💻");
        return;
      }
      
      // Ctrl+Shift+I / J / C
      if (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) {
        e.preventDefault();
        addLog("محاولة رصد عناصر الصفحة 💻");
        return;
      }

      // Copy/Paste shortcuts
      if ((e.ctrlKey || e.metaKey) && ["C", "V", "X", "A"].includes(e.key.toUpperCase())) {
        e.preventDefault();
        addLog("محاولة النسخ واللصق أو التحديد الاختياري 📝");
        alert("🚫 تم حظر النسخ واللصق وتحديد النصوص داخل هذا الاختبار التفاعلي لضمان الأمان والنزاهة.");
        return;
      }
    };

    // 3. Clipboard events blockers
    const blockClipboard = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    // Add general window level blockers
    window.addEventListener("contextmenu", blockContextMenu);
    window.addEventListener("keydown", blockShortcuts);
    window.addEventListener("copy", blockClipboard);
    window.addEventListener("cut", blockClipboard);
    window.addEventListener("paste", blockClipboard);

    return () => {
      window.removeEventListener("contextmenu", blockContextMenu);
      window.removeEventListener("keydown", blockShortcuts);
      window.removeEventListener("copy", blockClipboard);
      window.removeEventListener("cut", blockClipboard);
      window.removeEventListener("paste", blockClipboard);
    };
  }, []);

  // 4. Tab switch / Window focus loss monitor
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        triggerViolation("تغيير تبويب المتصفح / مغادرة الصفحة");
      }
    };

    const handleWindowBlur = () => {
      triggerViolation("الخروج من نافذة الاختبار أو فتح تطبيق آخر");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [violationsCount]);

  // Helper to append security logs
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString("ar-EG");
    setCheatLogs(prev => [`[${time}] ${msg}`, ...prev]);
  };

  // Helper to handle anti-cheat violations
  const triggerViolation = async (action: string) => {
    addLog(`مخالفة: ${action}`);
    setShowCheatOverlay(true);
    
    const nextCount = violationsCount + 1;
    
    try {
      // Send a ticket to admin
      const ticketId = `cheat-${user.id}-${quiz.id}-${Date.now()}`;
      const newTicket: SupportTicket = {
        id: ticketId,
        userId: user.id,
        userName: user.name || "طالب مجهول",
        userPhone: user.phone || "بدون هاتف",
        title: `🚨 تنبيه أمني: محاولة غش - مغادرة صفحة الاختبار - ${quiz.title}`,
        message: `تم رصد محاولة مغادرة لصفحة الاختبار أو تغيير التبويب من قبل الطالب (${user.name}) أثناء حل اختبار "${quiz.title}".\nالإجراء المرصود: ${action}.\nعدد المخالفات التراكمية في هذا الاختبار: ${nextCount} من 3 محاولات مسموح بها.`,
        category: "technical",
        status: "open",
        createdAt: new Date().toISOString(),
        replies: []
      };
      await saveSupportTicketInFirestore(newTicket);

      // Save to activity log
      const logId = `log-${user.id}-${Date.now()}`;
      const newLog: ActivityLog = {
        id: logId,
        userId: user.id,
        actionType: "solved_quiz",
        title: "رصد مغادرة نافذة الاختبار 🚨",
        details: `حاول الطالب ${user.name} مغادرة نافذة اختبار "${quiz.title}". الإجراء المرصود: ${action}. المحاولة رقم: ${nextCount}.`,
        timestamp: new Date().toISOString()
      };
      await saveActivityLogInFirestore(newLog);
    } catch (err) {
      console.error("Failed to send cheat warning to admin:", err);
    }

    setViolationsCount((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        // Submit immediately on 3rd violation
        setShowCheatOverlay(false);
        setTimeout(() => {
          handleForceSubmit("تجاوز الحد الأقصى للمخالفات الأمنية المسموح بها (3 مخالفات)!");
        }, 300);
        return 0;
      }
      return next;
    });
  };

  // Answer modification helpers
  const handleSelectOption = (optIdx: number) => {
    const updated = [...answers];
    updated[currentQuestionIdx] = optIdx;
    setAnswers(updated);
  };

  const handleToggleMultiOption = (optIdx: number) => {
    const current = Array.isArray(answers[currentQuestionIdx]) ? answers[currentQuestionIdx] : [];
    let updatedSelected: number[] = [];
    if (current.includes(optIdx)) {
      updatedSelected = current.filter((idx: number) => idx !== optIdx);
    } else {
      updatedSelected = [...current, optIdx];
    }
    const updated = [...answers];
    updated[currentQuestionIdx] = updatedSelected;
    setAnswers(updated);
  };

  const handleTextChange = (val: string) => {
    const updated = [...answers];
    updated[currentQuestionIdx] = val;
    setAnswers(updated);
  };

  const handleNext = () => {
    if (currentQuestionIdx < quiz.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    }
  };

  const handleUserSubmit = () => {
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      if (isAnswerCorrect(q, answers[idx])) {
        score++;
      }
    });
    onCompleteQuiz(score, quiz.questions.length, answers);
  };

  const currentQuestion = quiz.questions[currentQuestionIdx];
  const qType = currentQuestion.type || "mcq";
  const isCurrentAnswered = isQuestionAnswered(currentQuestion, answers[currentQuestionIdx]);
  const isAllAnswered = quiz.questions.every((q, idx) => isQuestionAnswered(q, answers[idx]));

  return (
    <div 
      className="relative w-full max-w-4xl mx-auto select-none bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-right font-sans"
      dir="rtl"
    >
      {/* Dynamic Security Shield Indicator header */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 text-white rounded-2xl p-4 mb-6 border border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-600/25 flex items-center justify-center border border-red-500/30 animate-pulse">
            <Shield className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-black flex items-center gap-2">
              محرك الاختبارات المؤمن: {quiz.title}
              <span className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                نظام حماية الغش نشط 🔒
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              ممنوع نسخ النصوص، كليك يمين، مغادرة النافذة، أو التصوير.
            </p>
          </div>
        </div>
        
        {/* Violation count banner */}
        <div className="flex items-center gap-2.5">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
            violationsCount > 0 
              ? "bg-red-500/10 border-red-500/20 text-red-400 animate-bounce" 
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          }`}>
            🚨 مخالفات مغادرة النافذة: <span className="font-mono font-black">{violationsCount} / 3</span>
          </span>
        </div>
      </div>

      {/* Timer Section */}
      {timerMode !== "off" && (
        <div className="bg-white p-4 rounded-2xl border border-slate-150 mb-6 flex flex-col gap-2 shadow-xs">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <Clock className={`w-4 h-4 ${secondsRemaining <= 15 ? "text-red-500 animate-pulse" : "text-slate-400"}`} />
              <span>الوقت المتبقي لإنهاء الاختبار:</span>
            </div>
            <div className={`font-mono font-extrabold text-sm px-3.5 py-1 rounded-xl border ${
              secondsRemaining <= 15 
                ? "bg-red-50 text-red-600 border-red-200 animate-pulse" 
                : "bg-slate-50 text-slate-800 border-slate-200"
            }`}>
              {Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, "0")}
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                secondsRemaining <= 15 ? "bg-red-600" : "bg-red-500"
              }`}
              style={{ width: `${initialDuration > 0 ? (secondsRemaining / initialDuration) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Current Question Navigation Status */}
      <div className="flex justify-between items-center text-xs text-slate-500 mb-4 border-b border-slate-200/50 pb-2.5">
        <span className="font-extrabold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
          السؤال {currentQuestionIdx + 1} من {quiz.questions.length}
        </span>
        <span className="font-bold text-slate-600">اختبار ذكي تفاعلي</span>
      </div>

      {/* QUESTION CONTENT CARD */}
      <div className="bg-white border border-slate-150 rounded-2xl p-6 sm:p-8 mb-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2">
          {qType === "mcq" && (
            <span className="text-[10px] bg-rose-50 border border-rose-100 text-rose-700 font-extrabold px-3 py-1 rounded-full">
              🎯 اختيار من متعدد
            </span>
          )}
          {qType === "true_false" && (
            <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-3 py-1 rounded-full">
              ⚖️ صواب أو خطأ
            </span>
          )}
          {qType === "text" && (
            <span className="text-[10px] bg-amber-50 border border-amber-100 text-amber-700 font-extrabold px-3 py-1 rounded-full">
              ✏️ سؤال مقالي / كتابة الحل خطوة بخطوة
            </span>
          )}
          {qType === "multi_select" && (
            <span className="text-[10px] bg-teal-50 border border-teal-100 text-teal-700 font-extrabold px-3 py-1 rounded-full">
              ☑️ متعدد الخيارات
            </span>
          )}
        </div>

        <h4 
          className="text-base sm:text-lg font-black text-slate-900 leading-relaxed text-right select-none pointer-events-none"
          onCopy={(e) => {
            e.preventDefault();
            alert("🚫 نسخ نصوص الأسئلة محظور تماماً لحماية حقوق النشر والنزاهة الأكاديمية!");
          }}
        >
          {currentQuestion.text}
        </h4>

        {/* INPUT AND OPTION FIELDS RENDERING */}
        {qType === "text" ? (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-slate-600">اكتب إجابتك أو خطوات الحل بدقة:</label>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md">
                🚫 اللصق معطل لضمان النزاهة الأكاديمية
              </span>
            </div>
            <textarea
              value={answers[currentQuestionIdx] === -1 ? "" : (answers[currentQuestionIdx] || "")}
              onChange={(e) => handleTextChange(e.target.value)}
              onPaste={(e) => {
                e.preventDefault();
                alert("🚫 عذراً، لا يمكنك لصق النصوص هنا! يرجى كتابة إجابتك بيدك لضمان الجهد الفردي.");
              }}
              rows={4}
              placeholder="اكتب الإجابة التفصيلية هنا..."
              className="w-full p-4 rounded-xl border border-slate-200 text-right text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 leading-relaxed transition-all"
            />
            <div className="text-left text-[10px] text-slate-400">
              عدد الحروف المكتوبة: <span className="font-mono">{(answers[currentQuestionIdx] || "").length}</span> حرفاً
            </div>
          </div>
        ) : qType === "multi_select" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {currentQuestion.options.map((opt, optIdx) => {
              const isSelected = Array.isArray(answers[currentQuestionIdx]) && answers[currentQuestionIdx].includes(optIdx);
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleToggleMultiOption(optIdx)}
                  className={`p-4 rounded-xl border text-right transition-all text-xs font-bold cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? "border-red-500 bg-red-50 text-red-700 shadow-xs ring-2 ring-red-500/10"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-6 h-6 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-mono font-bold text-center leading-6 ml-1">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    isSelected ? "bg-red-600 border-red-600 text-white" : "border-slate-300 bg-white"
                  }`}>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 stroke-3 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {currentQuestion.options.map((opt, optIdx) => {
              const isSelected = answers[currentQuestionIdx] === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  className={`p-4 rounded-xl border text-right transition-all text-xs font-bold cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? "border-red-500 bg-red-50 text-red-700 shadow-xs ring-2 ring-red-500/10"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 bg-white"
                  }`}
                >
                  <span className="inline-block w-6 h-6 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-mono font-bold text-center leading-6 ml-1">
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* QUIZ NAVIGATION BUTTONS BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentQuestionIdx === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" /> السابق
        </button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {currentQuestionIdx === quiz.questions.length - 1 ? (
            <button
              type="button"
              onClick={handleUserSubmit}
              disabled={!isAllAnswered}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>إنهاء وإرسال إجابات الاختبار 🏁</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={!isCurrentAnswered}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer"
            >
              التالي <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mini live security violation log preview */}
      {cheatLogs.length > 0 && (
        <div className="mt-6 bg-slate-100 border border-slate-200/60 p-4 rounded-2xl text-right space-y-2">
          <span className="text-[10px] font-black text-slate-500 block">🪵 سجل الرصد الأمني اللحظي للاختبار:</span>
          <div className="max-h-24 overflow-y-auto space-y-1 font-mono text-[9px] text-red-600 leading-normal">
            {cheatLogs.map((log, index) => (
              <div key={index} className="flex justify-between items-center border-b border-slate-200/30 pb-0.5">
                <span>{log}</span>
                <span className="text-[8px] bg-red-50 text-red-500 font-sans px-1 rounded">مرصود</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FULL SCREEN ANTI-CHEAT BANNER OVERLAY MODAL */}
      <AnimatePresence>
        {showCheatOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 text-center select-none"
            onContextMenu={(e) => e.preventDefault()}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-red-100 shadow-2xl text-right space-y-6 relative"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100 animate-bounce">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 text-center">
                  🚨 تم رصد مغادرة نافذة الاختبار!
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed text-center">
                  لقد خرجت من نافذة الاختبار التفاعلي. نظام الذكاء الأمني للمنصة يقوم بتجميد الاختبار حالياً لضمان النزاهة الأكاديمية والحد من الغش.
                </p>
              </div>

              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-right space-y-1">
                <span className="block text-xs font-black text-red-800">📌 تعليمات أمنية غاية في الأهمية:</span>
                <span className="block text-[11px] text-red-700 leading-relaxed">
                  • يُمنع منعاً باتاً فتح أي تبويبات أو برامج أخرى أثناء تأدية الاختبار.
                </span>
                <span className="block text-[11px] text-red-700 leading-relaxed">
                  • تكرار المغادرة للمرة الثالثة سيؤدي لغلق الاختبار وتسليم درجاتك الحالية كحل نهائي تلقائياً!
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-center">
                <span className="text-xs font-bold text-slate-600">المخالفات الحالية: </span>
                <span className="text-sm font-mono font-black text-red-600">{violationsCount} / 3</span>
              </div>

              <button
                type="button"
                onClick={() => setShowCheatOverlay(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-black py-3 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 text-white fill-current" />
                <span>العودة لمتابعة الاختبار فوراً ▶️</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
