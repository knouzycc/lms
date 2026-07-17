import React from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { LiveQuiz, LiveQuizParticipant, User } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  Zap,
  Users,
  Award,
  Crown,
  ChevronLeft,
  Timer,
  CheckCircle2,
  X,
  LogOut,
  Sparkles,
  HelpCircle
} from "lucide-react";

interface LiveQuizStudentInterfaceProps {
  user: User;
  quiz: LiveQuiz;
  onExit: () => void;
}

export default function LiveQuizStudentInterface({
  user,
  quiz: initialQuiz,
  onExit
}: LiveQuizStudentInterfaceProps) {
  const [quiz, setQuiz] = React.useState<LiveQuiz>(initialQuiz);
  const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
  const [userAnswers, setUserAnswers] = React.useState<number[]>([]);
  const [hasSubmittedCurrent, setHasSubmittedCurrent] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState<number>(initialQuiz.durationSeconds);

  // Subscribe to real-time changes of this live quiz
  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, "live_quizzes", initialQuiz.id), (docSnap) => {
      if (docSnap.exists()) {
        const updatedQuiz = docSnap.data() as LiveQuiz;
        setQuiz(updatedQuiz);
      }
    });
    return () => unsub();
  }, [initialQuiz.id]);

  // Sync / Reset local answer selection when teacher advances to the next question
  const currentQuestionIndex = quiz.currentQuestionIndex;
  React.useEffect(() => {
    // Reset selection for the new question
    setSelectedOption(null);
    setHasSubmittedCurrent(false);
  }, [currentQuestionIndex]);

  // Load user's already recorded answers if any (to prevent state loss on page refresh)
  React.useEffect(() => {
    const me = quiz.participants?.[user.id];
    if (me && me.answers) {
      setUserAnswers(me.answers);
      if (currentQuestionIndex >= 0 && me.answers[currentQuestionIndex] !== undefined) {
        setSelectedOption(me.answers[currentQuestionIndex]);
        setHasSubmittedCurrent(true);
      }
    }
  }, [quiz.participants, user.id, currentQuestionIndex]);

  // Countdown timer logic when active
  React.useEffect(() => {
    if (quiz.status !== "active" || !quiz.startedAt) return;

    const interval = setInterval(() => {
      const startedTime = new Date(quiz.startedAt!).getTime();
      const now = new Date().getTime();
      const elapsedSeconds = Math.floor((now - startedTime) / 1000);
      const remaining = Math.max(0, quiz.durationSeconds - elapsedSeconds);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quiz.status, quiz.startedAt, quiz.durationSeconds]);

  const handleSelectOption = (idx: number) => {
    if (hasSubmittedCurrent) return; // Answer locked
    setSelectedOption(idx);
  };

  const handleConfirmAnswer = async () => {
    if (selectedOption === null || hasSubmittedCurrent) return;

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedOption;

    // Calculate score
    let scoreCount = 0;
    for (let i = 0; i <= currentQuestionIndex; i++) {
      const ans = newAnswers[i];
      if (ans !== undefined && ans === quiz.questions[i].correctOptionIndex) {
        scoreCount++;
      }
    }

    try {
      setUserAnswers(newAnswers);
      setHasSubmittedCurrent(true);

      const participantRef = doc(db, "live_quizzes", quiz.id);
      await updateDoc(participantRef, {
        [`participants.${user.id}.answers`]: newAnswers,
        [`participants.${user.id}.score`]: scoreCount,
        [`participants.${user.id}.solvedCount`]: newAnswers.filter(a => a !== undefined).length,
        [`participants.${user.id}.lastUpdated`]: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error submitting live answer:", err);
    }
  };

  // Get current active question object
  const currentQuestion = currentQuestionIndex >= 0 && currentQuestionIndex < quiz.questions.length
    ? quiz.questions[currentQuestionIndex]
    : null;

  // Sorting leaderboard
  const sortedParticipants = (Object.values(quiz.participants || {}) as LiveQuizParticipant[]).sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return new Date(a.lastUpdated || 0).getTime() - new Date(b.lastUpdated || 0).getTime();
  });

  const myRank = sortedParticipants.findIndex(p => p.studentId === user.id) + 1;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 text-right" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top bar */}
        <div className="bg-white border border-gray-150 rounded-2xl p-4 flex justify-between items-center shadow-2xs">
          <button
            onClick={onExit}
            className="px-4 py-2 hover:bg-red-50 text-red-600 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer border border-red-100"
          >
            <LogOut className="w-4 h-4 rotate-180" />
            <span>انسحاب من المنافسة 🚪</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <h3 className="text-sm font-black text-slate-900 truncate max-w-[200px] sm:max-w-xs">{quiz.title}</h3>
              <p className="text-[10px] text-gray-400 font-extrabold">{quiz.courseTitle}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black">
              <Zap className="w-5 h-5" />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* 1. WAITING ROOM / LOBBY */}
          {quiz.status === "waiting" && (
            <motion.div
              key="waiting-lobby"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-10 text-center space-y-8 shadow-xs"
            >
              <div className="relative inline-block">
                <div className="animate-ping absolute inset-0 rounded-full bg-amber-400 opacity-20"></div>
                <div className="h-16 w-16 bg-amber-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto relative shadow-md">
                  ⏳
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-gray-900">أنت في غرفة الانتظار الآن! 🌟</h2>
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                  لقد انضممت بنجاح للمنافسة المباشرة. يرجى الانتظار بينما يكتمل انضمام زملائك الطلاب، وسيقوم المعلم ببدء الأسئلة فوراً للجميع.
                </p>
              </div>

              {/* Connected classmates list */}
              <div className="border-t border-gray-100 pt-6 space-y-4">
                <h4 className="text-xs font-black text-slate-800 flex items-center justify-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>الطلاب المتصلون حالياً باللعبة ({sortedParticipants.length}):</span>
                </h4>

                <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
                  {sortedParticipants.map((p) => {
                    const isMe = p.studentId === user.id;
                    return (
                      <div
                        key={p.studentId}
                        className={`px-3 py-1.5 rounded-full text-xs font-extrabold border transition-all flex items-center gap-1.5 ${
                          isMe
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${isMe ? "bg-amber-400 animate-pulse" : "bg-emerald-500 animate-ping"}`} />
                        <span>{p.studentName} {isMe && "(أنت)"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/60 max-w-md mx-auto">
                <p className="text-xs font-bold text-amber-800 leading-relaxed">
                  💡 بمجرد بدء المعلم للتحدي، ستتحول الشاشة تلقائياً وتبدأ الأسئلة والوقت بالظهور لحظياً! لا تقم بإغلاق الصفحة.
                </p>
              </div>
            </motion.div>
          )}

          {/* 2. ACTIVE QUIZ BATTLE SCREEN */}
          {quiz.status === "active" && currentQuestion && (
            <motion.div
              key={`active-question-${currentQuestionIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Main Question Panel */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                  
                  {/* Progress Header & Timer */}
                  <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-extrabold text-xs">
                        {currentQuestionIndex + 1}
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-extrabold block">السؤال الحالي</span>
                        <span className="text-xs font-black text-slate-800 font-mono">
                          {currentQuestionIndex + 1} / {quiz.questions.length}
                        </span>
                      </div>
                    </div>

                    {/* Timer Clock */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-xl text-red-600">
                      <Timer className="w-4 h-4 animate-spin" />
                      <span className="text-xs font-black font-mono">{timeLeft} ثانية متبقية</span>
                    </div>
                  </div>

                  {/* Question stem */}
                  <div className="space-y-3">
                    <h3 className="text-base font-black text-gray-900 leading-relaxed font-sans flex items-start gap-2">
                      <HelpCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <span>{currentQuestion.text}</span>
                    </h3>
                    {currentQuestion.imageUrl && (
                      <div className="rounded-2xl overflow-hidden border border-gray-100 max-h-[300px] flex justify-center bg-gray-50 p-2">
                        <img
                          src={currentQuestion.imageUrl}
                          alt="سؤال الاختبار المباشر"
                          className="max-h-full object-contain rounded-xl"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 gap-3 pt-2">
                    {currentQuestion.options.map((optionText, idx) => {
                      const isSelected = selectedOption === idx;
                      let optionStyle = "bg-gray-50 hover:bg-gray-100/80 text-gray-800 border-gray-200";
                      
                      if (hasSubmittedCurrent) {
                        if (isSelected) {
                          optionStyle = "bg-slate-900 text-white border-slate-900 shadow-sm";
                        } else {
                          optionStyle = "bg-gray-50/50 text-gray-400 border-gray-100 cursor-not-allowed";
                        }
                      } else if (isSelected) {
                        optionStyle = "bg-red-50 text-red-700 border-red-300 ring-2 ring-red-100";
                      }

                      return (
                        <button
                          key={idx}
                          disabled={hasSubmittedCurrent}
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full p-4 rounded-2xl border text-right text-xs font-extrabold transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}
                        >
                          <span className="leading-relaxed flex-1">{optionText}</span>
                          <span className={`h-6 w-6 rounded-lg font-black font-mono text-[10px] flex items-center justify-center border shrink-0 ${
                            isSelected ? "bg-white text-slate-900 border-white" : "bg-white text-gray-400 border-gray-200"
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Submit lock button */}
                  {!hasSubmittedCurrent ? (
                    <button
                      onClick={handleConfirmAnswer}
                      disabled={selectedOption === null}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>تأكيد وتسجيل إجابتي فوراً 🗳️</span>
                    </button>
                  ) : (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-150 rounded-2xl text-emerald-800 text-xs font-extrabold text-center flex items-center justify-center gap-1.5 animate-pulse">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>تم قفل إجابتك بنجاح! بانتظار السؤال التالي من المعلم... ⏳</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Side Column: Dynamic Realtime Leaderboard */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-gray-150 rounded-3xl p-5 space-y-4 shadow-2xs">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span>جدول الترتيب اللحظي</span>
                    </h4>
                    <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md font-black">
                      مركزك: #{myRank}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {sortedParticipants.map((p, index) => {
                      const isMe = p.studentId === user.id;
                      let rankIcon = <span className="text-[10px] font-black text-gray-400 font-mono">#{index + 1}</span>;
                      let cardBg = isMe ? "bg-slate-900 text-white border-slate-950 shadow-xs" : "bg-gray-50 text-gray-800 border-gray-100";

                      if (index === 0) {
                        rankIcon = <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-300" />;
                      }

                      return (
                        <div
                          key={p.studentId}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-right transition-all ${cardBg}`}
                        >
                          <div className="text-[10px] font-black font-mono">
                            {p.score} / {quiz.questions.length}
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-extrabold block truncate">{p.studentName} {isMe && "(أنت)"}</span>
                            <span className={`text-[8px] block ${isMe ? "text-amber-300" : "text-gray-400"} font-mono`}>
                              مجاب: {p.solvedCount}
                            </span>
                          </div>

                          <div className="shrink-0 flex justify-center items-center w-5">
                            {rankIcon}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. FINAL RESULTS / PODIUM */}
          {quiz.status === "ended" && (
            <motion.div
              key="quiz-results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-10 text-center space-y-8 shadow-xs"
            >
              <div className="space-y-2">
                <div className="text-4xl">🏆</div>
                <h2 className="text-xl font-black text-gray-900">انتهت المنافسة التنافسية المباشرة!</h2>
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                  مبارك لكل الأبطال الذين أكملوا هذا التحدي الشيق وسجلوا أسماءهم في لوحة الشرف! إليكم النتائج النهائية:
                </p>
              </div>

              {/* Top 3 Podium Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-4">
                {/* 2nd Place */}
                {sortedParticipants[1] && (
                  <div className="bg-slate-50 border border-gray-150 rounded-2xl p-5 text-center flex flex-col justify-between items-center relative order-2 sm:order-1 sm:mt-6">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-800 text-[10px] font-black px-3 py-1 rounded-full border border-slate-400 shadow-2xs">
                      🥈 المركز الثاني
                    </div>
                    <div className="h-10 w-10 bg-slate-200 text-slate-800 font-extrabold rounded-full flex items-center justify-center text-sm border-2 border-slate-300 mt-2">
                      {sortedParticipants[1].studentName.charAt(0)}
                    </div>
                    <div className="mt-3">
                      <span className="font-extrabold text-xs text-gray-950 block truncate max-w-[150px]">{sortedParticipants[1].studentName}</span>
                      <span className="text-[10px] text-slate-500 font-bold block mt-1 font-mono">الدرجة: {sortedParticipants[1].score} نقاط</span>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {sortedParticipants[0] && (
                  <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-2 border-amber-300 rounded-2xl p-6 text-center flex flex-col justify-between items-center relative order-1 sm:order-2 shadow-sm">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-black px-4 py-1 rounded-full border border-amber-400 shadow-2xs flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 fill-amber-300" />
                      <span>👑 بطل المنافسة</span>
                    </div>
                    <div className="h-12 w-12 bg-amber-150 text-amber-700 font-black rounded-full flex items-center justify-center text-base border-2 border-amber-300 mt-2">
                      {sortedParticipants[0].studentName.charAt(0)}
                    </div>
                    <div className="mt-3">
                      <span className="font-black text-sm text-amber-950 block truncate max-w-[170px]">{sortedParticipants[0].studentName}</span>
                      <span className="text-xs text-amber-700 font-black block mt-1 font-mono">الدرجة: {sortedParticipants[0].score} نقاط</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {sortedParticipants[2] && (
                  <div className="bg-slate-50 border border-gray-150 rounded-2xl p-5 text-center flex flex-col justify-between items-center relative order-3 sm:order-3 sm:mt-6">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-700 text-amber-50 text-[10px] font-black px-3 py-1 rounded-full border border-amber-800 shadow-2xs">
                      🥉 المركز الثالث
                    </div>
                    <div className="h-10 w-10 bg-amber-100 text-amber-800 font-extrabold rounded-full flex items-center justify-center text-sm border-2 border-amber-200 mt-2">
                      {sortedParticipants[2].studentName.charAt(0)}
                    </div>
                    <div className="mt-3">
                      <span className="font-extrabold text-xs text-gray-950 block truncate max-w-[150px]">{sortedParticipants[2].studentName}</span>
                      <span className="text-[10px] text-amber-850 font-bold block mt-1 font-mono">الدرجة: {sortedParticipants[2].score} نقاط</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Personal Score Summary */}
              {(() => {
                const myResult = quiz.participants?.[user.id];
                if (!myResult) return null;
                const correctCount = myResult.score;
                const totalCount = quiz.questions.length;
                return (
                  <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 sm:p-6 max-w-md mx-auto space-y-2">
                    <h4 className="text-xs font-black text-gray-900">أداؤك الشخصي في التحدي المباشر:</h4>
                    <div className="grid grid-cols-2 gap-4 text-center pt-2">
                      <div className="p-3 bg-white rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-400 block font-bold">إجاباتك الصحيحة</span>
                        <span className="text-base font-black text-emerald-600 font-mono">{correctCount} / {totalCount}</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-400 block font-bold">ترتيبك بين زملائك</span>
                        <span className="text-base font-black text-indigo-600 font-mono">#{myRank}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <button
                onClick={onExit}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-8 py-3 rounded-xl text-xs transition-colors cursor-pointer"
              >
                العودة للوحة المتابعة الرئيسة 🏠
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
