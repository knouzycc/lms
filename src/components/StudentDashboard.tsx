/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  PlayCircle,
  FileText,
  HelpCircle,
  CheckCircle,
  Wallet,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Award,
  AlertCircle,
  BarChart2,
  ListRestart,
  MessageSquare,
  Send,
  RefreshCw,
  LifeBuoy,
  UserCheck,
  Shield,
  ShoppingBag,
  Truck,
  BookMarked,
  MapPin,
  AlertTriangle,
  Compass,
} from "lucide-react";
import { Course, Lecture, Quiz, Question, User, PendingPayment, VideoSettings, PlatformSettings, AdCampaign, ActivityLog, SupportTicket, TicketReply, CourseCategory, BookStoreItem, BookOrder } from "../types";
import CertificateModal from "./CertificateModal";
import StudentProfile from "./StudentProfile";
import AdvancedQuizEngine from "./AdvancedQuizEngine";
import { fetchSupportTicketsByUser, saveSupportTicketInFirestore } from "../lib/dbService";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { LiveQuiz, LiveQuizParticipant } from "../types";
import LiveQuizStudentInterface from "./LiveQuizStudentInterface";
import { Zap } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

function AdBanner({ ad }: { ad: AdCampaign }) {
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
        className="w-full overflow-hidden rounded-3xl flex justify-center items-center" 
      />
    );
  }

  return (
    <a 
      href={ad.linkUrl || "#"} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="block w-full overflow-hidden rounded-3xl hover:opacity-95 transition-opacity shadow-xs"
      title={ad.title}
    >
      <img 
        src={ad.imageUrl} 
        alt={ad.title} 
        className="w-full max-h-[180px] object-cover rounded-3xl" 
        referrerPolicy="no-referrer"
      />
    </a>
  );
}

const getCategoryLabel = (cat: CourseCategory) => {
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

function getYoutubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return `https://www.youtube.com/embed/${trimmed}?autoplay=0&rel=0`;
  }
  
  if (trimmed.includes("youtube.com/embed/")) {
    return trimmed;
  }

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
  }
  return null;
}

interface StudentDashboardProps {
  user: User;
  courses: Course[];
  pendingPayments: PendingPayment[];
  activityLogs?: ActivityLog[];
  onCompleteLecture: (lectureId: string) => void;
  onCompleteQuiz: (quizId: string, score: number, total: number, answers: any[]) => void;
  onSelectCourseFromDashboard: (course: Course) => void;
  onRechargeWithCode: (code: string) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  videoSettings?: VideoSettings;
  platformSettings?: PlatformSettings;
  onUpdateProfile?: (updatedUser: User) => void;
  books?: BookStoreItem[];
  bookOrders?: BookOrder[];
  onBuyBook?: (bookId: string, governorate: string, address: string) => Promise<{ success: boolean; message: string }>;
  activeTab?: "courses" | "reports" | "tickets" | "profile" | "store";
  onChangeActiveTab?: (tab: "courses" | "reports" | "tickets" | "profile" | "store") => void;
}

export default function StudentDashboard({
  user,
  courses,
  pendingPayments,
  activityLogs = [],
  onCompleteLecture,
  onCompleteQuiz,
  onSelectCourseFromDashboard,
  onRechargeWithCode,
  videoSettings,
  platformSettings,
  onUpdateProfile,
  books = [],
  bookOrders = [],
  onBuyBook,
  activeTab: propActiveTab,
  onChangeActiveTab,
}: StudentDashboardProps) {
  const [activeCourse, setActiveCourse] = React.useState<Course | null>(null);
  const [activeLecture, setActiveLecture] = React.useState<Lecture | null>(null);
  const [viewingMode, setViewingMode] = React.useState<"video" | "quiz" | "liveQuiz">("video");
  const [localActiveTab, setLocalActiveTab] = React.useState<"courses" | "reports" | "tickets" | "profile" | "store">("courses");
  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = onChangeActiveTab !== undefined ? onChangeActiveTab : setLocalActiveTab;
  const [selectedCategory, setSelectedCategory] = React.useState<CourseCategory | "all">("all");
  const [lectureCopied, setLectureCopied] = React.useState(false);

  // Deep linking initial check
  const hasCheckedParamsRef = React.useRef(false);
  React.useEffect(() => {
    if (hasCheckedParamsRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get("courseId");
    const lectureId = params.get("lectureId");
    if (courseId && courses.length > 0 && user?.enrolledCourseIds?.includes(courseId)) {
      const course = courses.find((c) => c.id === courseId);
      if (course) {
        setActiveCourse(course);
        if (lectureId) {
          const lec = (course.lectures || []).find((l) => l.id === lectureId);
          if (lec) {
            setActiveLecture(lec);
          } else {
            setActiveLecture(course.lectures[0] || null);
          }
        } else {
          setActiveLecture(course.lectures[0] || null);
        }
        setViewingMode("video");
        hasCheckedParamsRef.current = true;
      }
    }
  }, [courses, user]);
  
  // Live Quizzes States
  const [liveQuizzes, setLiveQuizzes] = React.useState<LiveQuiz[]>([]);
  const [joinedLiveQuiz, setJoinedLiveQuiz] = React.useState<LiveQuiz | null>(null);

  // Real-time listener for live quizzes
  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "live_quizzes"), (snapshot) => {
      const list: LiveQuiz[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as LiveQuiz);
      });
      setLiveQuizzes(list);
    });
    return () => unsubscribe();
  }, []);

  // Restore active battle session on load or state updates if user is currently registered in an ongoing session
  React.useEffect(() => {
    const activeJoined = liveQuizzes.find(lq => lq.participants && lq.participants[user.id] && lq.status !== "ended");
    if (activeJoined && viewingMode !== "liveQuiz") {
      setJoinedLiveQuiz(activeJoined);
      setViewingMode("liveQuiz");
    }
  }, [liveQuizzes, user.id]);

  // Support Tickets States
  const [tickets, setTickets] = React.useState<SupportTicket[]>([]);
  const [isTicketsLoading, setIsTicketsLoading] = React.useState(false);
  const [newTicketTitle, setNewTicketTitle] = React.useState("");
  const [newTicketMessage, setNewTicketMessage] = React.useState("");
  const [newTicketCategory, setNewTicketCategory] = React.useState<SupportTicket["category"]>("technical");
  const [activeTicketId, setActiveTicketId] = React.useState<string | null>(null);
  const [replyMessage, setReplyMessage] = React.useState("");
  const [ticketSuccess, setTicketSuccess] = React.useState("");
  const [ticketError, setTicketError] = React.useState("");

  const loadUserTickets = React.useCallback(async () => {
    setIsTicketsLoading(true);
    try {
      const fetched = await fetchSupportTicketsByUser(user.id);
      setTickets(fetched);
    } catch (err) {
      console.error("Error loading tickets:", err);
    } finally {
      setIsTicketsLoading(false);
    }
  }, [user.id]);

  React.useEffect(() => {
    if (activeTab === "tickets") {
      loadUserTickets();
    }
  }, [activeTab, loadUserTickets]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketTitle.trim() || !newTicketMessage.trim()) {
      setTicketError("الرجاء تعبئة جميع حقول التذكرة");
      return;
    }
    setTicketError("");
    setTicketSuccess("");
    try {
      const ticketId = "tkt-" + Date.now();
      const newTicket: SupportTicket = {
        id: ticketId,
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        title: newTicketTitle.trim(),
        message: newTicketMessage.trim(),
        category: newTicketCategory,
        status: "open",
        createdAt: new Date().toISOString(),
        replies: []
      };
      await saveSupportTicketInFirestore(newTicket);
      setTickets((prev) => [newTicket, ...prev]);
      setNewTicketTitle("");
      setNewTicketMessage("");
      setTicketSuccess("تم إرسال تذكرتك بنجاح وجاري مراجعتها من الدعم الفني! ✨");
      setTimeout(() => setTicketSuccess(""), 5000);
    } catch (err) {
      console.error("Error creating ticket:", err);
      setTicketError("فشل في إرسال التذكرة. الرجاء المحاولة مرة أخرى.");
    }
  };

  const handleSendTicketReply = async (ticketId: string) => {
    if (!replyMessage.trim()) return;
    try {
      const targetTicket = tickets.find((t) => t.id === ticketId);
      if (!targetTicket) return;

      const newReply: TicketReply = {
        id: "rep-" + Date.now(),
        senderRole: "student",
        senderName: user.name,
        message: replyMessage.trim(),
        createdAt: new Date().toISOString()
      };

      const updatedTicket: SupportTicket = {
        ...targetTicket,
        status: "open",
        replies: [...targetTicket.replies, newReply]
      };

      await saveSupportTicketInFirestore(updatedTicket);
      setTickets((prev) => prev.map((t) => t.id === ticketId ? updatedTicket : t));
      setReplyMessage("");
    } catch (err) {
      console.error("Error sending ticket reply:", err);
    }
  };
  
  // Recharge states
  const [rechargeCodeInput, setRechargeCodeInput] = React.useState("");
  const [rechargeMsg, setRechargeMsg] = React.useState("");

  const handleRechargeSubmit = async () => {
    if (!rechargeCodeInput.trim()) return;
    const res = await onRechargeWithCode(rechargeCodeInput);
    setRechargeMsg(res.message);
    if (res.success) {
       setRechargeCodeInput("");
    }
    setTimeout(() => setRechargeMsg(""), 5000);
  };
  
  // Quiz active state
  const [activeQuiz, setActiveQuiz] = React.useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = React.useState<any[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = React.useState(0);
  const [showQuizResults, setShowQuizResults] = React.useState(false);
  const [isReviewingAnswers, setIsReviewingAnswers] = React.useState(false);
  const [reviewAnswersFilter, setReviewAnswersFilter] = React.useState<"all" | "correct" | "incorrect">("all");

  // Timer settings
  const [timerMode, setTimerMode] = React.useState<"quiz" | "question" | "off">("quiz");
  const [customMinutes, setCustomMinutes] = React.useState<number>(5); // total quiz time in minutes
  const [customSecondsPerQ, setCustomSecondsPerQ] = React.useState<number>(60); // seconds per question
  const [secondsRemaining, setSecondsRemaining] = React.useState<number>(0);
  const [initialDuration, setInitialDuration] = React.useState<number>(300); // to calculate progress bar percentage

  // DRM & Anti-Cheat Advanced Systems
  const [movingWatermarkPos, setMovingWatermarkPos] = React.useState({ top: "35%", left: "40%", rotate: "0deg" });
  const [showScreenshotAlert, setShowScreenshotAlert] = React.useState(false);
  const [screenshotAlertMsg, setScreenshotAlertMsg] = React.useState("");
  const [antiCheatViolations, setAntiCheatViolations] = React.useState(0);
  const [antiCheatLogs, setAntiCheatLogs] = React.useState<string[]>([]);
  const [showAntiCheatOverlay, setShowAntiCheatOverlay] = React.useState(false);
  const [fullscreenTimer, setFullscreenTimer] = React.useState(10);

  // Booklet Store checkout states
  const [buyingBookId, setBuyingBookId] = React.useState<string | null>(null);
  const [checkoutGov, setCheckoutGov] = React.useState("");
  const [checkoutAddress, setCheckoutAddress] = React.useState("");
  const [checkoutSuccessMsg, setCheckoutSuccessMsg] = React.useState("");
  const [checkoutErrorMsg, setCheckoutErrorMsg] = React.useState("");
  const [isBuyingProcess, setIsBuyingProcess] = React.useState(false);

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
    if (ans === undefined || ans === null) return false;
    const type = q.type || "mcq";
    if (type === "mcq" || type === "true_false") {
      return ans !== -1;
    }
    if (type === "text") {
      return typeof ans === "string" && ans.trim().length > 0;
    }
    if (type === "multi_select") {
      return Array.isArray(ans) && ans.length > 0;
    }
    return false;
  };

  // quizAnswers ref to ensure timer submission always gets the latest responses without stale closures
  const quizAnswersRef = React.useRef<any[]>([]);
  React.useEffect(() => {
    quizAnswersRef.current = quizAnswers;
  }, [quizAnswers]);

  // Handle individual question timers resetting when the active question changes
  React.useEffect(() => {
    if (activeQuiz && !showQuizResults && timerMode === "question") {
      setSecondsRemaining(customSecondsPerQ);
      setInitialDuration(customSecondsPerQ);
    }
  }, [currentQuestionIdx, activeQuiz, showQuizResults, timerMode, customSecondsPerQ]);

  // Independent countdown ticker interval (only ticks, doesn't depend on answers or current index)
  React.useEffect(() => {
    if (!activeQuiz || showQuizResults || timerMode === "off") {
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuiz, showQuizResults, timerMode]);

  // Handle what happens when secondsRemaining hits zero
  React.useEffect(() => {
    if (!activeQuiz || showQuizResults || timerMode === "off") {
      return;
    }

    if (secondsRemaining === 0) {
      if (timerMode === "quiz") {
        // Time is up for the entire quiz!
        let score = 0;
        activeQuiz.questions.forEach((q, idx) => {
          if (isAnswerCorrect(q, quizAnswersRef.current[idx])) {
            score++;
          }
        });
        onCompleteQuiz(activeQuiz.id, score, activeQuiz.questions.length, quizAnswersRef.current);
        setShowQuizResults(true);
        alert("⏱️ انتهى وقت الاختبار الكلي! تم حفظ وتوصيل إجاباتك تلقائياً.");
      } else if (timerMode === "question") {
        // Time is up for this question!
        if (currentQuestionIdx < activeQuiz.questions.length - 1) {
          // Go to next question
          setCurrentQuestionIdx((prev) => prev + 1);
          setSecondsRemaining(customSecondsPerQ);
          setInitialDuration(customSecondsPerQ);
        } else {
          // No more questions, submit quiz
          let score = 0;
          activeQuiz.questions.forEach((q, idx) => {
            if (isAnswerCorrect(q, quizAnswersRef.current[idx])) {
              score++;
            }
          });
          onCompleteQuiz(activeQuiz.id, score, activeQuiz.questions.length, quizAnswersRef.current);
          setShowQuizResults(true);
          alert("⏱️ انتهى وقت السؤال الأخير! تم تسليم الاختبار وحساب النتيجة تلقائياً.");
        }
      }
    }
  }, [secondsRemaining, activeQuiz, showQuizResults, timerMode, currentQuestionIdx, customSecondsPerQ, onCompleteQuiz]);

  // 1. Moving Watermark Effect: Updates position and rotation every 4 seconds
  React.useEffect(() => {
    if (!activeLecture) return;
    const interval = setInterval(() => {
      const topRandom = Math.floor(Math.random() * 70 + 15) + "%";
      const leftRandom = Math.floor(Math.random() * 70 + 15) + "%";
      const rotateRandom = Math.floor(Math.random() * 40 - 20) + "deg";
      setMovingWatermarkPos({ top: topRandom, left: leftRandom, rotate: rotateRandom });
    }, 4000);
    return () => clearInterval(interval);
  }, [activeLecture]);

  // Screen Capture & Print Detection (Educational Video Protection System)
  React.useEffect(() => {
    if (!activeLecture) return;

    const triggerScreenshotViolation = (reason: string) => {
      // Pause any active video
      const videoEl = document.querySelector("video");
      if (videoEl) {
        videoEl.pause();
      }
      setShowScreenshotAlert(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Print screen / Print shortcuts
      if (e.key === "PrintScreen") {
        e.preventDefault();
        triggerScreenshotViolation("مفتاح تصوير الشاشة (Print Screen)");
      }
      // Cmd/Ctrl + P (Print)
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        triggerScreenshotViolation("محاولة طباعة الصفحة / تصويرها");
      }
      // Windows/Meta + Shift + S
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "s") {
        e.preventDefault();
        triggerScreenshotViolation("محاولة قص جزء من الشاشة (Snipping Tool)");
      }
      // Mac print combinations (Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5)
      if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) {
        e.preventDefault();
        triggerScreenshotViolation("محاولة تصوير الشاشة على نظام macOS");
      }
    };

    const handleBeforePrint = (e: Event) => {
      e.preventDefault();
      triggerScreenshotViolation("محاولة طباعة الصفحة");
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeprint", handleBeforePrint);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeprint", handleBeforePrint);
    };
  }, [activeLecture]);

  // 2. Keyboard & Copy-Paste Protection (Anti-Piracy & Anti-Cheat)
  React.useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12 (Inspect)
      if (e.key === "F12") {
        e.preventDefault();
        return;
      }
      // Block Ctrl+Shift+I / Ctrl+Shift+C / Ctrl+Shift+J / Ctrl+U
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "C" || e.key === "J")) {
        e.preventDefault();
        return;
      }
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
        return;
      }
      // Block Copy/Paste inside Quiz
      if (activeQuiz && !showQuizResults) {
        if (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "a")) {
          e.preventDefault();
          alert("🚫 عذراً، تم تعطيل النسخ واللصق وتحديد النص لضمان نزاهة ومكافحة غش الاختبار!");
        }
      }
    };

    const handleCopyPaste = (e: Event) => {
      if (activeQuiz && !showQuizResults) {
        e.preventDefault();
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("copy", handleCopyPaste);
    window.addEventListener("cut", handleCopyPaste);
    window.addEventListener("paste", handleCopyPaste);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("copy", handleCopyPaste);
      window.removeEventListener("cut", handleCopyPaste);
      window.removeEventListener("paste", handleCopyPaste);
    };
  }, [activeQuiz, showQuizResults]);

  // 3. Tab Visibility Switching Detection (Anti-Cheat Violation System)
  React.useEffect(() => {
    if (!activeQuiz || showQuizResults) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Increment violations
        setAntiCheatViolations((prev) => {
          const next = prev + 1;
          const timeStr = new Date().toLocaleTimeString("ar-EG");
          const logMsg = `⚠️ [${timeStr}] مخالفة: مغادرة صفحة الاختبار وتغيير التبويب (${next}/3)`;
          setAntiCheatLogs((prevLogs) => [logMsg, ...prevLogs]);

          if (next >= 3) {
            // Auto-submit the exam!
            setTimeout(() => {
              let score = 0;
              activeQuiz.questions.forEach((q, idx) => {
                if (isAnswerCorrect(q, quizAnswersRef.current[idx])) {
                  score++;
                }
              });
              onCompleteQuiz(activeQuiz.id, score, activeQuiz.questions.length, quizAnswersRef.current);
              setShowQuizResults(true);
              setAntiCheatViolations(0);
              alert("🚨 تم إلغاء الاختبار وتسليم إجاباتك تلقائياً لتخطي الحد الأقصى لمخالفات تغيير التبويب (3 مخالفات)!");
            }, 500);
          } else {
            alert(`🚨 تنبيه مكافحة الغش: تم رصد مغادرة صفحة الاختبار! تم تسجيل مخالفة رقم (${next}/3). تكرار مغادرة الصفحة سيؤدي لتسليم وإغلاق الاختبار تلقائياً!`);
          }
          return next;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeQuiz, showQuizResults, onCompleteQuiz]);

  // 4. Fullscreen Enforcement Overlay Countdown
  React.useEffect(() => {
    if (!activeQuiz || showQuizResults) {
      setShowAntiCheatOverlay(false);
      return;
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setShowAntiCheatOverlay(true);
        setFullscreenTimer(12);
      } else {
        setShowAntiCheatOverlay(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [activeQuiz, showQuizResults]);

  // Fullscreen Countdown Ticker
  React.useEffect(() => {
    if (!showAntiCheatOverlay || !activeQuiz || showQuizResults) return;

    const timer = setInterval(() => {
      setFullscreenTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit because of leaving fullscreen for too long
          let score = 0;
          activeQuiz.questions.forEach((q, idx) => {
            if (isAnswerCorrect(q, quizAnswersRef.current[idx])) {
              score++;
            }
          });
          onCompleteQuiz(activeQuiz.id, score, activeQuiz.questions.length, quizAnswersRef.current);
          setShowQuizResults(true);
          setShowAntiCheatOverlay(false);
          alert("🚨 تم تسليم الاختبار تلقائياً لعدم العودة لوضع ملء الشاشة قبل انتهاء المهلة المحددة!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showAntiCheatOverlay, activeQuiz, showQuizResults, onCompleteQuiz]);

  const requestFullscreenExam = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }
    setShowAntiCheatOverlay(false);
  };

  // Certificate state and checker
  const [isCertModalOpen, setIsCertModalOpen] = React.useState(false);
  const [certCourse, setCertCourse] = React.useState<Course | null>(null);

  const isCourseCompleted = (c: Course, u: User) => {
    if (!c.lectures || c.lectures.length === 0) return false;
    const allLecturesCompleted = c.lectures.every((lect) =>
      u.completedLectures.includes(lect.id)
    );
    if (!allLecturesCompleted) return false;

    const allQuizzesCompleted = c.lectures.every((lect) => {
      if (!lect.quiz) return true;
      return u.quizAttempts[lect.quiz.id] !== undefined;
    });

    return allQuizzesCompleted;
  };

  const enrolledCourses = courses.filter((c) => user.enrolledCourseIds.includes(c.id));
  const filteredEnrolledCourses = enrolledCourses.filter((course) => selectedCategory === "all" || course.category === selectedCategory);
  
  const otherAvailableCourses = courses.filter((c) => !user.enrolledCourseIds.includes(c.id));
  const filteredOtherCourses = otherAvailableCourses.filter((course) => selectedCategory === "all" || course.category === selectedCategory);

  const userPayments = pendingPayments.filter((p) => p.userId === user.id);

  const handleStartCourse = (course: Course) => {
    setActiveCourse(course);
    setActiveLecture(course.lectures[0] || null);
    setActiveQuiz(null);
    setShowQuizResults(false);
    setViewingMode("video");
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    const initialAnswers = new Array(quiz.questions.length).fill(-1);
    setQuizAnswers(initialAnswers);
    quizAnswersRef.current = initialAnswers;
    setCurrentQuestionIdx(0);
    setShowQuizResults(false);
    setIsReviewingAnswers(false);
    setReviewAnswersFilter("all");

    // Initialize timer
    if (timerMode === "quiz") {
      const duration = customMinutes * 60;
      setSecondsRemaining(duration);
      setInitialDuration(duration);
    } else if (timerMode === "question") {
      const duration = customSecondsPerQ;
      setSecondsRemaining(duration);
      setInitialDuration(duration);
    } else {
      setSecondsRemaining(0);
      setInitialDuration(0);
    }
  };

  const handleAnswerSelect = (optIdx: number) => {
    const updated = [...quizAnswers];
    updated[currentQuestionIdx] = optIdx;
    setQuizAnswers(updated);
  };

  const handleToggleMultiAnswer = (optIdx: number) => {
    let currentSelected: number[] = Array.isArray(quizAnswers[currentQuestionIdx])
      ? quizAnswers[currentQuestionIdx]
      : [];
    if (currentSelected.includes(optIdx)) {
      currentSelected = currentSelected.filter(i => i !== optIdx);
    } else {
      currentSelected = [...currentSelected, optIdx];
    }
    const updated = [...quizAnswers];
    updated[currentQuestionIdx] = currentSelected;
    setQuizAnswers(updated);
  };

  const handleTextAnswerChange = (text: string) => {
    const updated = [...quizAnswers];
    updated[currentQuestionIdx] = text;
    setQuizAnswers(updated);
  };

  const handleNextQuestion = () => {
    if (activeQuiz && currentQuestionIdx < activeQuiz.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(currentQuestionIdx - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!activeQuiz) return;
    
    // Calculate score
    let score = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (isAnswerCorrect(q, quizAnswers[idx])) {
        score++;
      }
    });

    onCompleteQuiz(activeQuiz.id, score, activeQuiz.questions.length, quizAnswers);
    setShowQuizResults(true);
  };

  // Helper stats
  const completedLecturesCount = user.completedLectures.length;
  const averageQuizScore = React.useMemo(() => {
    const attempts = Object.values(user.quizAttempts);
    if (attempts.length === 0) return 0;
    const totalPercentage = attempts.reduce((acc, curr) => acc + (curr.score / curr.total) * 100, 0);
    return Math.round(totalPercentage / attempts.length);
  }, [user.quizAttempts]);

  // Activity Log Search and Filter States
  const [logSearchQuery, setLogSearchQuery] = React.useState("");
  const [logTypeFilter, setLogTypeFilter] = React.useState<"all" | "watched_video" | "solved_quiz" | "recharged_balance" | "course_enrollment">("all");
  const [visibleLogsCount, setVisibleLogsCount] = React.useState(10);

  // Chart data calculations
  const scoreTrendData = React.useMemo(() => {
    return Object.entries(user.quizAttempts).map(([quizId, attempt]) => {
      // Find the quiz title for the label
      let quizTitle = "اختبار";
      for (const c of courses) {
        for (const l of c.lectures) {
          if (l.quiz && l.quiz.id === quizId) {
            quizTitle = l.quiz.title;
            break;
          }
        }
      }
      // Trim title if too long
      const shortTitle = quizTitle.length > 25 ? quizTitle.substring(0, 22) + "..." : quizTitle;
      const percentage = Math.round((attempt.score / attempt.total) * 100);

      return {
        name: shortTitle,
        fullTitle: quizTitle,
        percentage: percentage,
        scoreText: `${attempt.score} من ${attempt.total}`,
        completedAt: attempt.completedAt,
      };
    });
  }, [user.quizAttempts, courses]);

  const quizComplianceData = React.useMemo(() => {
    let totalQuizzes = 0;
    enrolledCourses.forEach((course) => {
      course.lectures.forEach((lect) => {
        if (lect.quiz) {
          totalQuizzes++;
        }
      });
    });

    const solvedQuizzes = Object.keys(user.quizAttempts).length;
    const remainingQuizzes = Math.max(0, totalQuizzes - solvedQuizzes);

    return [
      { name: "تم حلها 📝", value: solvedQuizzes, color: "#10b981" }, // emerald
      { name: "متبقية ⏳", value: remainingQuizzes, color: "#ef4444" }, // red
    ];
  }, [enrolledCourses, user.quizAttempts]);

  const courseProgressData = React.useMemo(() => {
    return enrolledCourses.map((course) => {
      const totalLectures = course.lectures.length;
      if (totalLectures === 0) return { name: course.title, completion: 0, completed: 0, total: 0 };
      const completedCount = course.lectures.filter((lect) =>
        user.completedLectures.includes(lect.id)
      ).length;
      const completionPercentage = Math.round((completedCount / totalLectures) * 100);

      return {
        name: course.title.length > 20 ? course.title.substring(0, 18) + "..." : course.title,
        fullTitle: course.title,
        completion: completionPercentage,
        completed: completedCount,
        total: totalLectures,
      };
    });
  }, [enrolledCourses, user.completedLectures]);

  const studentLogs = React.useMemo(() => {
    return activityLogs.filter((log) => log.userId === user.id);
  }, [activityLogs, user.id]);

  const filteredLogs = React.useMemo(() => {
    return studentLogs.filter((log) => {
      // 1. Filter by actionType
      if (logTypeFilter !== "all" && log.actionType !== logTypeFilter) {
        return false;
      }
      // 2. Filter by search query
      if (logSearchQuery.trim()) {
        const query = logSearchQuery.toLowerCase();
        const matchesTitle = log.title.toLowerCase().includes(query);
        const matchesDetails = log.details.toLowerCase().includes(query);
        return matchesTitle || matchesDetails;
      }
      return true;
    });
  }, [studentLogs, logTypeFilter, logSearchQuery]);

  const paginatedLogs = React.useMemo(() => {
    return filteredLogs.slice(0, visibleLogsCount);
  }, [filteredLogs, visibleLogsCount]);

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return isoString;
    }
  };

  const handleJoinLiveQuiz = async (lq: LiveQuiz) => {
    const participantRef = doc(db, "live_quizzes", lq.id);
    const initialParticipant: LiveQuizParticipant = {
      studentId: user.id,
      studentName: user.name,
      studentPhone: user.phone || "",
      score: 0,
      solvedCount: 0,
      answers: [],
      isFinished: false,
      lastUpdated: new Date().toISOString()
    };
    try {
      await updateDoc(participantRef, {
        [`participants.${user.id}`]: initialParticipant
      });
      setJoinedLiveQuiz(lq);
      setViewingMode("liveQuiz");
    } catch (err) {
      console.error("Error joining live quiz:", err);
    }
  };

  if (viewingMode === "liveQuiz" && joinedLiveQuiz) {
    return (
      <LiveQuizStudentInterface
        user={user}
        quiz={joinedLiveQuiz}
        onExit={() => {
          setViewingMode("video");
          setJoinedLiveQuiz(null);
        }}
      />
    );
  }

  const studentTopAd = platformSettings?.ads?.find((a) => a.placement === "student_top" && a.isActive);
  const studentSidebarAd = platformSettings?.ads?.find((a) => a.placement === "student_sidebar" && a.isActive);
  const studentBottomAd = platformSettings?.ads?.find((a) => a.placement === "student_bottom" && a.isActive);
  const studentClassroomAd = platformSettings?.ads?.find((a) => a.placement === "student_classroom" && a.isActive);

  return (
    <div className="space-y-8 pb-16" dir="rtl" id="student-dashboard-root">
      {/* Student Top Ad */}
      {studentTopAd && (
        <div className="w-full">
          <AdBanner ad={studentTopAd} />
        </div>
      )}

      {/* Live Quiz Active Announcement Banner */}
      {viewingMode !== "liveQuiz" && (() => {
        const activeLiveQuiz = liveQuizzes.find(q => q.status === "waiting" || q.status === "active");
        if (!activeLiveQuiz) return null;

        const isAlreadyJoined = activeLiveQuiz.participants?.[user.id] !== undefined;

        return (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-850 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row justify-between items-center gap-4 text-right"
            dir="rtl"
            id="live-quiz-announcement"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 animate-pulse">
                <Zap className="w-6 h-6 fill-amber-400" />
              </div>
              <div>
                <span className="text-[10px] bg-red-600 text-white font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide">تحدي مباشر تنافسي الآن ⚡</span>
                <h4 className="text-sm font-black mt-1 text-white">جلسة اختبار تنافسي جارية: {activeLiveQuiz.title}</h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed font-sans">
                  أطلق المعلم اختباراً مباشراً وتنافسياً! ابدأ الآن لتجيب على الأسئلة في نفس اللحظة وتتصدر زملائك على الهواء مباشرة.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleJoinLiveQuiz(activeLiveQuiz)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs transition-all shadow-md shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              {isAlreadyJoined ? "الدخول لغرفة التحدي المستمر ➡️" : "انضم للتحدي التنافسي المباشر 🚀"}
            </button>
          </motion.div>
        );
      })()}

      {/* Overview Stat Widgets */}
      <section className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">لوحة المتابعة الشخصية 📊</h2>
            <p className="text-xs text-gray-400">تتبع مستواك التعليمي ومحاضراتك في مادة الرياضيات</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-extrabold rounded-lg">
            <span>الصف الدراسي:</span>
            <span>
              {user.enrolledCourseIds.length > 0
                ? "نشط بالمنصة"
                : "تصفح الكورسات لتفعيل حسابك"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-2 text-right">
            <span className="block text-xs font-bold text-gray-400">الكورسات المشترك بها</span>
            <span className="block text-3xl font-black text-red-600">{enrolledCourses.length}</span>
            <span className="block text-[10px] text-gray-400">من أصل {courses.length} كورسات متاحة</span>
          </div>

          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-2 text-right">
            <span className="block text-xs font-bold text-gray-400">المحاضرات المكتملة</span>
            <span className="block text-3xl font-black text-emerald-600">
              {completedLecturesCount}
            </span>
            <span className="block text-[10px] text-gray-400">استمر لمشاهدة باقي الشرح</span>
          </div>

          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-2 text-right">
            <span className="block text-xs font-bold text-gray-400">متوسط درجات الاختبارات</span>
            <span className="block text-3xl font-black text-amber-600">
              {averageQuizScore}%
            </span>
            <span className="block text-[10px] text-gray-400">في {Object.keys(user.quizAttempts).length} اختبارات منجزة</span>
          </div>
        </div>
      </section>



      {/* Main Workspace (Course Active View or Courses List) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {activeCourse ? (
          /* Active Classroom / Workspace */
          <div className="lg:col-span-12 space-y-6" id="classroom-workspace">
            {/* Header / Back button */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100">
              <button
                onClick={() => {
                  setActiveCourse(null);
                  setActiveLecture(null);
                  setActiveQuiz(null);
                }}
                className="flex items-center gap-1 text-sm font-extrabold text-red-600 hover:text-red-700 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة لـكورساتي</span>
              </button>
              <h3 className="text-base font-extrabold text-gray-800 truncate max-w-lg">
                {activeCourse.title}
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Right column: Lectures & Quizzes Sidebar of current course */}
              <div className="lg:col-span-4 space-y-4">
                {isCourseCompleted(activeCourse, user) && (
                  <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 rounded-3xl space-y-3 shadow-md relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-white/10" />
                    <Award className="w-8 h-8 text-amber-200" />
                    <div className="space-y-1 relative">
                      <h4 className="text-sm font-black">مبارك إتمام الكورس! 🎓</h4>
                      <p className="text-[10px] text-amber-50 leading-relaxed">
                        لقد أتممت بنجاح جميع محاضرات واختبارات هذا الكورس. شهادتك الإلكترونية جاهزة للتحميل والطباعة فورياً!
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setCertCourse(activeCourse);
                        setIsCertModalOpen(true);
                      }}
                      className="w-full bg-white hover:bg-amber-50 text-amber-900 font-extrabold py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      <span>تحميل شهادة الإتمام 🏆</span>
                    </button>
                  </div>
                )}

                <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-4 shadow-xs">
                  <div className="border-b border-gray-50 pb-3">
                    <h4 className="text-sm font-extrabold text-gray-900">
                      فهرس المحاضرات والاختبارات 📚
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">تتبع مسار تعلمك وحل الاختبارات لكل حصة</p>
                  </div>

                  <div className="space-y-4">
                    {activeCourse.lectures.map((lect, idx) => {
                      const isLectureSelected = activeLecture?.id === lect.id && viewingMode === "video";
                      const isLectureCompleted = user.completedLectures.includes(lect.id);
                      
                      const hasQuiz = !!lect.quiz;
                      const isQuizSelected = activeLecture?.id === lect.id && viewingMode === "quiz";
                      const quizAttempt = lect.quiz ? user.quizAttempts[lect.quiz.id] : null;
                      const isQuizCompleted = !!quizAttempt;

                      return (
                        <div key={lect.id} className="border border-gray-100/70 rounded-2xl p-2.5 space-y-2 bg-gray-50/20">
                          {/* Lecture Selector Button */}
                          <button
                            onClick={() => {
                              setActiveLecture(lect);
                              setViewingMode("video");
                              setActiveQuiz(null);
                              setShowQuizResults(false);
                            }}
                            className={`w-full p-2.5 rounded-xl text-right transition-all flex items-center justify-between gap-3 cursor-pointer text-xs ${
                              isLectureSelected
                                ? "bg-red-600 text-white font-bold shadow-sm"
                                : "hover:bg-gray-50 text-gray-800"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-5.5 h-5.5 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center flex-shrink-0 ${
                                isLectureSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                              }`}>
                                {idx + 1}
                              </span>
                              <span className="font-extrabold truncate">
                                {lect.title}
                              </span>
                            </div>
                            {isLectureCompleted ? (
                              <CheckCircle className={`w-4 h-4 flex-shrink-0 ${isLectureSelected ? "text-white" : "text-emerald-600"}`} />
                            ) : (
                              <Clock className={`w-4 h-4 flex-shrink-0 ${isLectureSelected ? "text-white/60" : "text-gray-300"}`} />
                            )}
                          </button>

                          {/* Quiz Sub-item Selector Button */}
                          {hasQuiz && (
                            <div className="mr-3.5 pl-1 border-r border-gray-100 pr-2.5 pt-0.5">
                              <button
                                onClick={() => {
                                  setActiveLecture(lect);
                                  setViewingMode("quiz");
                                  if (quizAttempt) {
                                    setActiveQuiz(lect.quiz!);
                                    setQuizAnswers(quizAttempt.answers || []);
                                    setShowQuizResults(true);
                                    setIsReviewingAnswers(false);
                                    setReviewAnswersFilter("all");
                                  } else {
                                    setActiveQuiz(null);
                                    setShowQuizResults(false);
                                    setIsReviewingAnswers(false);
                                    setReviewAnswersFilter("all");
                                  }
                                }}
                                className={`w-full p-2 rounded-lg text-right transition-all flex items-center justify-between gap-2.5 cursor-pointer text-[11px] ${
                                  isQuizSelected
                                    ? "bg-amber-500 text-white font-bold shadow-xs"
                                    : "hover:bg-gray-50 text-gray-600"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate">الاختبار التفاعلي للدرس</span>
                                </div>
                                
                                {isQuizCompleted ? (
                                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                                    isQuizSelected ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-100/40"
                                  }`}>
                                    <span>درجة: {quizAttempt.score}/{quizAttempt.total}</span>
                                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                  </span>
                                ) : (
                                  <span className={`text-[8px] font-bold px-1 py-0.5 rounded-md ${
                                    isQuizSelected ? "bg-white/15 text-amber-100" : "bg-gray-100 text-gray-400"
                                  }`}>
                                    غير محلول 📝
                                  </span>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Left Column: Video screen, PDF sheets, Interactive Quizzes */}
              <div className="lg:col-span-8 space-y-6">
                {activeLecture ? (
                  <div className="space-y-6">
                    {viewingMode === "video" ? (
                      /* Lecture Video & Material View */
                      <div className="space-y-6">
                        {/* Simulated Premium Video Player */}
                        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
                          <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                            <div>
                              <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-md">
                                فيديو المحاضرة الشاملة 🎥
                              </span>
                              <h4 className="text-base font-extrabold text-gray-900 mt-1">
                                {activeLecture.title}
                              </h4>
                            </div>
                            <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                              ⏳ {activeLecture.duration}
                            </span>
                          </div>

                          {/* Video Container with DRM protections */}
                          <div
                            className="relative aspect-video bg-gray-950 flex items-center justify-center select-none overflow-hidden"
                            onContextMenu={videoSettings?.enableRightClickBlock ? (e) => e.preventDefault() : undefined}
                          >
                            {getYoutubeEmbedUrl(activeLecture.videoUrl) ? (
                              <iframe
                                src={getYoutubeEmbedUrl(activeLecture.videoUrl) || ""}
                                title={activeLecture.title}
                                className="w-full h-full object-contain relative z-10 pointer-events-auto border-0 aspect-video"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                              />
                            ) : (
                              <video
                                src={activeLecture.videoUrl}
                                controls
                                controlsList={videoSettings?.enableRightClickBlock ? "nodownload" : undefined}
                                className="w-full h-full object-contain relative z-10 pointer-events-auto"
                                poster="https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=800"
                              />
                            )}

                            {/* DRM BRAND LOGO OVERLAY */}
                            {videoSettings?.logoUrl && (
                              <div
                                className="absolute pointer-events-none z-20 transition-all duration-300"
                                style={{
                                  opacity: videoSettings.logoOpacity,
                                  top: videoSettings.logoPosition.startsWith("top") ? 16 : "auto",
                                  bottom: videoSettings.logoPosition.startsWith("bottom") ? 16 : "auto",
                                  right: videoSettings.logoPosition.endsWith("right") ? 16 : "auto",
                                  left: videoSettings.logoPosition.endsWith("left") ? 16 : "auto",
                                }}
                              >
                                <img
                                  src={videoSettings.logoUrl}
                                  alt="Brand DRM Logo"
                                  className="w-10 sm:w-16 object-contain rounded"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}

                            {/* DRM STUDENT DETAILS WATERMARK OVERLAY */}
                            <div
                              className="absolute pointer-events-none z-30 select-none font-black text-[10px] sm:text-xs text-white/90 bg-black/50 px-2.5 py-1.5 rounded-lg border border-white/10 whitespace-nowrap transition-all duration-700 shadow-lg"
                              style={{
                                opacity: videoSettings?.watermarkOpacity ?? 0.3,
                                ...(videoSettings?.watermarkPosition === "random" ? {
                                  top: movingWatermarkPos.top,
                                  left: movingWatermarkPos.left,
                                  transform: `rotate(${movingWatermarkPos.rotate || "0deg"})`,
                                } : videoSettings?.watermarkPosition === "center" ? {
                                  top: "50%",
                                  left: "50%",
                                  transform: "translate(-50%, -50%)"
                                } : {
                                  top: videoSettings?.watermarkPosition?.startsWith("top") ? 20 : "auto",
                                  bottom: videoSettings?.watermarkPosition?.startsWith("bottom") ? 20 : "auto",
                                  right: videoSettings?.watermarkPosition?.endsWith("right") ? 20 : "auto",
                                  left: videoSettings?.watermarkPosition?.endsWith("left") ? 20 : "auto",
                                })
                              }}
                            >
                              {videoSettings?.watermarkTextType === "student_info" ? (
                                <span className="flex flex-col items-center gap-0.5">
                                  <span>حساب الطالب: {user.name} 📱</span>
                                  <span className="text-[9px] text-gray-300 font-mono">هاتف: {user.phone} | معرف: {user.id.slice(0, 8)}</span>
                                  <span className="text-[8px] text-red-300 font-mono">IP: 197.34.{(user.id.charCodeAt(0) || 5) * 4}.{10 + (user.id.charCodeAt(1) || 2)} 🔒</span>
                                </span>
                              ) : (
                                <span>{videoSettings?.customWatermarkText || "حقوق الطبع محفوظة"}</span>
                              )}
                            </div>

                            {/* Screenshot recording warning block */}
                            {videoSettings?.enableAntiScreenshotAlert && (
                              <div className="absolute top-4 left-4 z-20 bg-black/75 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] text-red-400 font-bold flex items-center gap-1 border border-red-500/10 pointer-events-none">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                                <span>حماية البث مُفعلة 🔒</span>
                              </div>
                            )}

                            {/* SCREENSHOT VIOLATION FULLSCREEN BLACKOUT OVERLAY */}
                            {showScreenshotAlert && (
                              <div className="absolute inset-0 z-50 bg-black/98 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in select-none">
                                <div className="w-14 h-14 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center border border-red-500/30 mb-3 animate-pulse">
                                  <AlertTriangle className="w-6 h-6" />
                                </div>
                                <h3 className="text-red-500 text-sm font-black mb-1.5">
                                  🚨 تم رصد محاولة تسجيل الشاشة أو تصوير البث!
                                </h3>
                                <p className="text-[11px] text-slate-300 max-w-sm leading-relaxed mb-4">
                                  عذراً، تمنع قوانين الحماية الفكرية والأكاديمية للمنصة أي عمليات تصوير شاشة أو استخدام برامج التقاط البث. تم إيقاف الفيديو احترازياً لحماية المحتوى.
                                </p>
                                <button
                                  onClick={() => setShowScreenshotAlert(false)}
                                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
                                >
                                  أوافق وأتعهد بعدم التكرار 👍
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Actions row: PDF materials & Complete button */}
                          <div className="p-5 bg-gray-50/60 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-red-600" />
                              <span className="text-xs font-bold text-gray-700">أوراق الشرح والملخص:</span>
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  alert(`جاري تحميل ملف الشرح: ${activeLecture.pdfUrl || 'ملخص الدرس'}`);
                                }}
                                className="text-xs text-red-600 hover:underline font-extrabold"
                              >
                                تحميل ({activeLecture.pdfUrl}) 📥
                              </a>
                            </div>

                            {!user.completedLectures.includes(activeLecture.id) ? (
                              <button
                                onClick={() => onCompleteLecture(activeLecture.id)}
                                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md transition-colors cursor-pointer"
                              >
                                تحديد كـ محاضرة مكتملة ✔️
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4" /> أكملت مشاهدة هذا الدرس بنجاح
                              </span>
                            )}
                          </div>

                          {/* Share Lecture Row */}
                          <div className="p-5 bg-slate-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 rounded-b-3xl">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-700">📢 مشاركة هذه المحاضرة:</span>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {/* WhatsApp */}
                              <button
                                type="button"
                                onClick={() => {
                                  const shareText = `أوصيك بمشاهدة محاضرة "${activeLecture.title}" من كورس "${activeCourse?.title || ""}"!`;
                                  const shareUrl = `${window.location.origin}/?courseId=${activeCourse?.id || ""}&lectureId=${activeLecture.id}`;
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
                                  const shareText = `أوصيك بمشاهدة محاضرة "${activeLecture.title}" من كورس "${activeCourse?.title || ""}"!`;
                                  const shareUrl = `${window.location.origin}/?courseId=${activeCourse?.id || ""}&lectureId=${activeLecture.id}`;
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
                                  const shareUrl = `${window.location.origin}/?courseId=${activeCourse?.id || ""}&lectureId=${activeLecture.id}`;
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
                                  const shareUrl = `${window.location.origin}/?courseId=${activeCourse?.id || ""}&lectureId=${activeLecture.id}`;
                                  navigator.clipboard.writeText(shareUrl);
                                  setLectureCopied(true);
                                  setTimeout(() => setLectureCopied(false), 2000);
                                }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-slate-200"
                                title="نسخ رابط الدرس"
                              >
                                {lectureCopied ? (
                                  <span className="text-emerald-600 flex items-center gap-1">✔️ تم النسخ!</span>
                                ) : (
                                  <span>🔗 نسخ الرابط</span>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Student Classroom Ad */}
                        {studentClassroomAd && (
                          <div className="w-full">
                            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs">
                              <div className="flex items-center justify-between border-b border-gray-50 pb-2 mb-3">
                                <span className="text-xs font-black text-slate-800">إعلان ترويجي 📢</span>
                                <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-extrabold">ممول</span>
                              </div>
                              <AdBanner ad={studentClassroomAd} />
                            </div>
                          </div>
                        )}

                        {/* Quiz Promo / Shortcut CTA */}
                        {activeLecture.quiz && (
                          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100/60 p-5 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="space-y-1 text-right">
                              <h5 className="text-sm font-extrabold text-red-950 flex items-center gap-1.5">
                                <HelpCircle className="w-4 h-4 text-red-600" />
                                <span>يوجد اختبار تفاعلي مخصص لهذه المحاضرة!</span>
                              </h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed">
                                نوصيك بحل الأسئلة فورياً بعد مشاهدة الشرح للتأكد من فهم القوانين الرياضية وطرق الاستنتاج.
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setViewingMode("quiz");
                                const attempt = user.quizAttempts[activeLecture.quiz!.id];
                                if (attempt) {
                                  setActiveQuiz(activeLecture.quiz!);
                                  setQuizAnswers(attempt.answers || []);
                                  setShowQuizResults(true);
                                  setIsReviewingAnswers(false);
                                  setReviewAnswersFilter("all");
                                } else {
                                  setActiveQuiz(null);
                                  setShowQuizResults(false);
                                  setIsReviewingAnswers(false);
                                  setReviewAnswersFilter("all");
                                }
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1 flex-shrink-0"
                            >
                              <span>الانتقال للاختبار التفاعلي ✏️</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Interactive Quiz View */
                      <div className="space-y-6">
                        {activeLecture.quiz ? (
                          <div className="space-y-6">
                            {/* Quiz Screen Header with Switch back */}
                            <div className="bg-white border border-gray-100 rounded-3xl p-5 flex justify-between items-center shadow-2xs">
                              <div>
                                <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-md">
                                  الاختبار التفاعلي المباشر ✏️
                                </span>
                                <h4 className="text-base font-extrabold text-gray-900 mt-1">
                                  {activeLecture.quiz.title}
                                </h4>
                              </div>
                              <button
                                onClick={() => setViewingMode("video")}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <span>العودة لفيديو المحاضرة 🎥</span>
                              </button>
                            </div>

                            {/* Quiz content wrapper */}
                            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-6">
                              {!activeQuiz ? (
                                /* Initial CTA view */
                                <div className="text-center py-6 space-y-4">
                                  <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto">
                                    <HelpCircle className="w-8 h-8" />
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="text-lg font-extrabold text-gray-900">
                                      {activeLecture.quiz.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                                      اختبر مهاراتك الرياضية فورياً وتعرف على خطوات الحل والتمارين التفصيلية.
                                    </p>
                                  </div>

                                  {/* Timer Settings Selector */}
                                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-150 max-w-md mx-auto text-right space-y-4 shadow-xs" id="quiz-timer-config">
                                    <span className="block text-xs font-black text-gray-700">⚙️ إعدادات مؤقت الاختبار التفاعلي:</span>
                                    <div className="grid grid-cols-3 gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setTimerMode("quiz")}
                                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                          timerMode === "quiz"
                                            ? "bg-red-600 text-white border-red-600 shadow-sm font-black text-xs"
                                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100 text-xs font-bold"
                                        }`}
                                      >
                                        <span className="block text-[10px]">⏱️ مؤقت كلي</span>
                                        <span className="block text-[11px] mt-0.5">{customMinutes} دقائق</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setTimerMode("question")}
                                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                          timerMode === "question"
                                            ? "bg-red-600 text-white border-red-600 shadow-sm font-black text-xs"
                                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100 text-xs font-bold"
                                        }`}
                                      >
                                        <span className="block text-[10px]">⏱️ لكل سؤال</span>
                                        <span className="block text-[11px] mt-0.5">{customSecondsPerQ} ثانية</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setTimerMode("off")}
                                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                          timerMode === "off"
                                            ? "bg-red-600 text-white border-red-600 shadow-sm font-black text-xs"
                                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100 text-xs font-bold"
                                        }`}
                                      >
                                        <span className="block text-[10px]">🚫 بدون مؤقت</span>
                                        <span className="block text-[11px] mt-0.5">تدريب حر</span>
                                      </button>
                                    </div>

                                    {/* Sliders */}
                                    {timerMode === "quiz" && (
                                      <div className="space-y-1.5 pt-2 border-t border-gray-150 animate-fade-in">
                                        <div className="flex justify-between items-center text-[11px]">
                                          <span className="text-gray-500">مدة الاختبار بالكامل:</span>
                                          <span className="font-bold text-red-600">{customMinutes} دقائق</span>
                                        </div>
                                        <input
                                          type="range"
                                          min="1"
                                          max="30"
                                          value={customMinutes}
                                          onChange={(e) => setCustomMinutes(Number(e.target.value))}
                                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600 animate-fade-in"
                                        />
                                      </div>
                                    )}

                                    {timerMode === "question" && (
                                      <div className="space-y-1.5 pt-2 border-t border-gray-150 animate-fade-in">
                                        <div className="flex justify-between items-center text-[11px]">
                                          <span className="text-gray-500">الزمن المتاح لكل سؤال:</span>
                                          <span className="font-bold text-red-600">{customSecondsPerQ} ثانية</span>
                                        </div>
                                        <input
                                          type="range"
                                          min="10"
                                          max="180"
                                          step="10"
                                          value={customSecondsPerQ}
                                          onChange={(e) => setCustomSecondsPerQ(Number(e.target.value))}
                                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600 animate-fade-in"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {user.quizAttempts[activeLecture.quiz.id] ? (
                                    <div className="space-y-3">
                                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">
                                        <Award className="w-3.5 h-3.5" />
                                        <span>
                                          لقد قمت بحل هذا الاختبار مسبقاً وحصلت على:{" "}
                                          <span className="font-bold">
                                            {user.quizAttempts[activeLecture.quiz.id].score} /{" "}
                                            {user.quizAttempts[activeLecture.quiz.id].total}
                                          </span>
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => handleStartQuiz(activeLecture.quiz!)}
                                        className="block mx-auto text-xs font-bold text-red-600 hover:underline flex items-center gap-1 justify-center cursor-pointer"
                                      >
                                        <ListRestart className="w-3.5 h-3.5" /> إعادة المحاولة
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleStartQuiz(activeLecture.quiz!)}
                                      className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-3 rounded-xl text-sm shadow-md cursor-pointer"
                                    >
                                      بدء الاختبار التفاعلي الآن ✏️
                                    </button>
                                  )}
                                </div>
                              ) : showQuizResults ? (
                                /* Quiz Results & Detailed Explanations with Math Steps */
                                <div className="space-y-6">
                                  {(() => {
                                    const totalQuestions = activeQuiz.questions.length;
                                    const score = quizAnswers.reduce((acc, ans, idx) => {
                                      return isAnswerCorrect(activeQuiz.questions[idx], ans) ? acc + 1 : acc;
                                    }, 0);
                                    const wrongCount = totalQuestions - score;
                                    const percentage = Math.round((score / totalQuestions) * 100);

                                    // Feedback message based on percentage
                                    let feedbackTitle = "أداء مقبول! 📐";
                                    let feedbackMessage = "الرياضيات تحتاج لمزيد من الممارسة وحل التمارين. يمكنك مراجعة الإجابات لمعرفة طريقة الحل النموذجي.";
                                    let feedbackColor = "text-amber-600";
                                    let feedbackBg = "bg-amber-50";

                                    if (percentage === 100) {
                                      feedbackTitle = "درجة كاملة استثنائية! 🏆👑";
                                      feedbackMessage = "أنت عبقري حقيقي في الرياضيات! أداؤك مذهل وخالٍ من الأخطاء تماماً، استمر في هذا المستوى العالي.";
                                      feedbackColor = "text-emerald-600";
                                      feedbackBg = "bg-emerald-50";
                                    } else if (percentage >= 85) {
                                      feedbackTitle = "أداء رائع وممتاز جداً! 🌟✨";
                                      feedbackMessage = "مستوى متميز وباهر للغاية! مهاراتك الرياضية قوية جداً وعلى استعداد كامل للتفوق النهائي.";
                                      feedbackColor = "text-red-600";
                                      feedbackBg = "bg-red-50";
                                    } else if (percentage >= 60) {
                                      feedbackTitle = "أداء جيد ومبشر! 📐👍";
                                      feedbackMessage = "أحسنت! أداؤك جيد جداً ولديك أساس رياضي متين. راجع بعض الملاحظات البسيطة للوصول للدرجة النهائية.";
                                      feedbackColor = "text-blue-600";
                                      feedbackBg = "bg-blue-50";
                                    }

                                    return (
                                      <div className="space-y-6">
                                        {!isReviewingAnswers ? (
                                          /* Score Card & Dashboard Summary */
                                          <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-center"
                                          >
                                            <div className="space-y-1">
                                              <span className="text-[10px] bg-red-50 text-red-700 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                تقرير النتيجة الفوري 📊
                                              </span>
                                              <h4 className="text-lg font-black text-gray-900 mt-2">
                                                ملخص أدائك في اختبار: {activeQuiz.title}
                                              </h4>
                                            </div>

                                            {/* Score Ring / Gauge */}
                                            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                                {/* Background Circle */}
                                                <circle
                                                  cx="50"
                                                  cy="50"
                                                  r="40"
                                                  stroke="#f3f4f6"
                                                  strokeWidth="8"
                                                  fill="transparent"
                                                />
                                                {/* Progress Circle */}
                                                <circle
                                                  cx="50"
                                                  cy="50"
                                                  r="40"
                                                  stroke={percentage >= 85 ? "#dc2626" : percentage >= 60 ? "#3b82f6" : "#f59e0b"}
                                                  strokeWidth="8"
                                                  fill="transparent"
                                                  strokeDasharray="251.2"
                                                  strokeDashoffset={251.2 - (251.2 * percentage) / 100}
                                                  className="transition-all duration-1000 ease-out"
                                                  strokeLinecap="round"
                                                />
                                              </svg>
                                              <div className="absolute flex flex-col items-center justify-center">
                                                <span className="text-3xl font-black text-gray-950 font-mono">
                                                  {percentage}%
                                                </span>
                                                <span className="text-[10px] font-extrabold text-gray-400 mt-0.5">
                                                  الدرجة: {score} / {totalQuestions}
                                                </span>
                                              </div>
                                            </div>

                                            {/* Feedback banner */}
                                            <div className={`${feedbackBg} ${feedbackColor} border border-current/10 p-4 rounded-2xl text-right space-y-1`}>
                                              <h5 className="text-xs font-black flex items-center gap-1.5">
                                                {feedbackTitle}
                                              </h5>
                                              <p className="text-[11px] leading-relaxed opacity-90">
                                                {feedbackMessage}
                                              </p>
                                            </div>

                                            {/* Metrics Stats Grid */}
                                            <div className="grid grid-cols-3 gap-3">
                                              <div className="bg-emerald-50/40 border border-emerald-100 p-3 rounded-2xl text-center space-y-1">
                                                <span className="block text-[10px] font-bold text-emerald-600">الإجابات الصحيحة</span>
                                                <span className="text-base font-black text-emerald-700 font-mono">
                                                  {score} أسئلة ✅
                                                </span>
                                              </div>
                                              <div className="bg-red-50/40 border border-red-100 p-3 rounded-2xl text-center space-y-1">
                                                <span className="block text-[10px] font-bold text-red-600">الإجابات الخاطئة</span>
                                                <span className="text-base font-black text-red-700 font-mono">
                                                  {wrongCount} أسئلة ❌
                                                </span>
                                              </div>
                                              <div className="bg-gray-50 border border-gray-150 p-3 rounded-2xl text-center space-y-1">
                                                <span className="block text-[10px] font-bold text-gray-500">إجمالي الأسئلة</span>
                                                <span className="text-base font-black text-gray-800 font-mono">
                                                  {totalQuestions}
                                                </span>
                                              </div>
                                            </div>

                                            {/* Controls */}
                                            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-50">
                                              <button
                                                onClick={() => setIsReviewingAnswers(true)}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                                              >
                                                <span>مراجعة الإجابات والحلول التفصيلية 🔍</span>
                                              </button>
                                              <button
                                                onClick={() => handleStartQuiz(activeQuiz)}
                                                className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-extrabold px-4 py-3 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                                              >
                                                <span>إعادة المحاولة 🔄</span>
                                              </button>
                                              <button
                                                onClick={() => setActiveQuiz(null)}
                                                className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 font-extrabold px-4 py-3 rounded-xl text-xs transition-colors cursor-pointer"
                                              >
                                                إنهاء ومتابعة المحاضرات 🎥
                                              </button>
                                            </div>
                                          </motion.div>
                                        ) : (
                                          /* Detailed Review Mode with Filter, Highlighting, and explanations */
                                          <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-6"
                                          >
                                            {/* Header back bar */}
                                            <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                              <button
                                                onClick={() => setIsReviewingAnswers(false)}
                                                className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                                              >
                                                <ArrowRight className="w-4 h-4" />
                                                <span>العودة لملخص النتيجة</span>
                                              </button>
                                              <span className="text-xs font-extrabold text-gray-500">
                                                أنت الآن تتصفح الإجابات التفصيلية لمطابقة القوانين والشروحات
                                              </span>
                                            </div>

                                            {/* Filters Bar */}
                                            <div className="flex flex-wrap gap-2">
                                              <button
                                                onClick={() => setReviewAnswersFilter("all")}
                                                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all border ${
                                                  reviewAnswersFilter === "all"
                                                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                                }`}
                                              >
                                                📋 جميع الأسئلة ({totalQuestions})
                                              </button>
                                              <button
                                                onClick={() => setReviewAnswersFilter("correct")}
                                                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all border ${
                                                  reviewAnswersFilter === "correct"
                                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                                }`}
                                              >
                                                🟢 الصحيحة ({score})
                                              </button>
                                              <button
                                                onClick={() => setReviewAnswersFilter("incorrect")}
                                                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all border ${
                                                  reviewAnswersFilter === "incorrect"
                                                    ? "bg-red-600 text-white border-red-600 shadow-xs"
                                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                                }`}
                                              >
                                                🔴 الخاطئة ({wrongCount})
                                              </button>
                                            </div>

                                            {/* List of Questions with explanations */}
                                            <div className="space-y-5">
                                              {activeQuiz.questions
                                                .map((q, qIdx) => ({ q, qIdx }))
                                                .filter(({ q, qIdx }) => {
                                                  const isCorrect = isAnswerCorrect(q, quizAnswers[qIdx]);
                                                  if (reviewAnswersFilter === "correct") return isCorrect;
                                                  if (reviewAnswersFilter === "incorrect") return !isCorrect;
                                                  return true;
                                                })
                                                .map(({ q, qIdx }) => {
                                                  const userAns = quizAnswers[qIdx];
                                                  const isCorrect = isAnswerCorrect(q, userAns);
                                                  const hasAnswered = isQuestionAnswered(q, userAns);

                                                  return (
                                                    <motion.div
                                                      layout
                                                      key={q.id}
                                                      className={`p-5 sm:p-6 rounded-2xl border ${
                                                        isCorrect ? "border-emerald-100 bg-emerald-50/10" : "border-red-100 bg-red-50/10"
                                                      } space-y-4 text-right`}
                                                    >
                                                      <div className="flex justify-between items-start gap-4">
                                                        <div className="flex flex-col items-start gap-1">
                                                          <h6 className="text-xs font-black text-gray-400">
                                                            سؤال رقم ({qIdx + 1})
                                                          </h6>
                                                          <span className="text-[9px] text-gray-400">
                                                            {q.type === "true_false" && "سؤال صواب أو خطأ"}
                                                            {q.type === "text" && "سؤال مقالي"}
                                                            {q.type === "multi_select" && "سؤال متعدد الإجابات"}
                                                            {(q.type === "mcq" || !q.type) && "سؤال اختيار من متعدد"}
                                                          </span>
                                                        </div>
                                                        {isCorrect ? (
                                                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                                            <span>إجابة صحيحة ✨</span>
                                                          </span>
                                                        ) : (
                                                          <span className="text-[10px] bg-red-100 text-red-800 font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                                            <span>{hasAnswered ? "إجابة خاطئة ⚠️" : "لم يتم الحل في الوقت ⏳"}</span>
                                                          </span>
                                                        )}
                                                      </div>

                                                      <p className="text-sm font-black text-gray-900 leading-relaxed font-sans">
                                                        {q.text}
                                                      </p>

                                                      {/* Options or Text Answers Display based on Type */}
                                                      {q.type === "text" ? (
                                                        <div className="space-y-2.5">
                                                          <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                                                            isCorrect ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-red-500 bg-red-50 text-red-900"
                                                          }`}>
                                                            <div className="flex justify-between items-center">
                                                              <span className="font-bold">✍️ إجابتك المكتوبة:</span>
                                                              <span className="font-extrabold">{userAns || "لم تجب"}</span>
                                                            </div>
                                                          </div>
                                                          <div className="p-4 rounded-xl border border-emerald-500 bg-emerald-50 text-emerald-900 text-xs leading-relaxed">
                                                            <div className="flex justify-between items-center">
                                                              <span className="font-bold">🎯 الإجابة النموذجية الصحيحة:</span>
                                                              <span className="font-extrabold">{q.correctTextAnswer}</span>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      ) : q.type === "multi_select" ? (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                          {q.options.map((opt, optIdx) => {
                                                            const correctIndices = q.correctAnswersIndices || [];
                                                            const isCorrectOpt = correctIndices.includes(optIdx);
                                                            const isUserSelected = Array.isArray(userAns) && userAns.includes(optIdx);

                                                            return (
                                                              <div
                                                                key={optIdx}
                                                                className={`p-3 rounded-xl border text-xs leading-relaxed transition-all ${
                                                                  isCorrectOpt
                                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-extrabold shadow-2xs"
                                                                    : isUserSelected
                                                                    ? "border-red-500 bg-red-50 text-red-900 font-bold"
                                                                    : "border-gray-150 bg-white text-gray-600"
                                                                }`}
                                                              >
                                                                <div className="flex justify-between items-center">
                                                                  <div className="flex items-center gap-2">
                                                                    <span className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                                                                      isUserSelected ? "bg-red-600 border-red-600 text-white" : "border-gray-300"
                                                                    }`}>
                                                                      {isUserSelected && "✓"}
                                                                    </span>
                                                                    <span>{opt}</span>
                                                                  </div>
                                                                  <span className="text-[9px] font-extrabold">
                                                                    {isCorrectOpt && "🎯 إجابة نموذجية"}
                                                                    {isUserSelected && !isCorrectOpt && "❌ غير صحيح"}
                                                                  </span>
                                                                </div>
                                                              </div>
                                                            );
                                                          })}
                                                        </div>
                                                      ) : (
                                                        /* MCQ / True-False */
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                          {q.options.map((opt, optIdx) => {
                                                            const isCorrectOpt = optIdx === q.correctAnswerIndex;
                                                            const isUserSelected = optIdx === userAns;

                                                            return (
                                                              <div
                                                                key={optIdx}
                                                                className={`p-3 rounded-xl border text-xs leading-relaxed transition-all ${
                                                                  isCorrectOpt
                                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-extrabold shadow-2xs"
                                                                    : isUserSelected
                                                                    ? "border-red-500 bg-red-50 text-red-900 font-bold"
                                                                    : "border-gray-150 bg-white text-gray-600"
                                                                }`}
                                                              >
                                                                <div className="flex justify-between items-center">
                                                                  <span>{opt}</span>
                                                                  <span className="text-[9px] font-extrabold">
                                                                    {isCorrectOpt && "🎯 إجابة نموذجية"}
                                                                    {isUserSelected && !isCorrectOpt && "❌ اختيارك"}
                                                                  </span>
                                                                </div>
                                                              </div>
                                                            );
                                                          })}
                                                        </div>
                                                      )}

                                                      {/* Elegant Explanation Section */}
                                                      <div className="mt-3.5 p-4 bg-white/90 border border-gray-150 rounded-2xl space-y-1.5 shadow-3xs">
                                                        <span className="block text-[11px] font-black text-red-600 flex items-center gap-1">
                                                          <span>💡 طريقة الاستنتاج الرياضي والشرح:</span>
                                                        </span>
                                                        <p className="text-xs text-gray-600 leading-relaxed font-sans whitespace-pre-line">
                                                          {q.explanation}
                                                        </p>
                                                      </div>
                                                    </motion.div>
                                                  );
                                                })}
                                            </div>

                                            {/* Footer controls for Review */}
                                            <div className="flex justify-between items-center pt-4 border-t border-gray-150">
                                              <button
                                                onClick={() => setIsReviewingAnswers(false)}
                                                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                                              >
                                                الرجوع لتقرير النتيجة
                                              </button>
                                              <button
                                                onClick={() => setActiveQuiz(null)}
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                                              >
                                                إنهاء المراجعة 🎥
                                              </button>
                                            </div>
                                          </motion.div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              ) : (
                                <AdvancedQuizEngine
                                  quiz={activeQuiz}
                                  timerMode={timerMode}
                                  customMinutes={customMinutes}
                                  onCompleteQuiz={(score, total, answersList) => {
                                    onCompleteQuiz(activeQuiz.id, score, total, answersList);
                                    setShowQuizResults(true);
                                  }}
                                  onCancel={() => setActiveQuiz(null)}
                                  user={user}
                                />
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-400 font-bold">
                            لا يوجد اختبار متوفر لهذه المحاضرة حالياً.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-400 font-bold">
                    برجاء اختيار حصة أو محاضرة من الفهرس الأيمن للبدء بطلب العلم والمشاهدة.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Normal Dashboard with Sidebar + Content */
          <>
            {/* Sidebar Column (Renders on the right in RTL desktop, stacks on top on mobile) */}
            <div className="lg:col-span-3 space-y-6" id="dashboard-sidebar-column">
              <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs space-y-4 lg:sticky lg:top-24">
                <div className="border-b border-gray-50 pb-3 flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-red-600" />
                    <span>أقسام لوحة التحكم 🧭</span>
                  </h3>
                </div>

                <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none scroll-smooth" id="student-sidebar-menu">
                  <button
                    onClick={() => setActiveTab("courses")}
                    className={`py-2.5 px-4 rounded-2xl text-xs font-extrabold transition-all text-right flex items-center gap-2 group cursor-pointer whitespace-nowrap lg:w-full border-r-4 ${
                      activeTab === "courses"
                        ? "bg-red-50 text-red-600 border-red-600 font-black"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent"
                    }`}
                  >
                    <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === "courses" ? "text-red-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                    <span>كورساتي ومحاضراتي 📚</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("reports")}
                    className={`py-2.5 px-4 rounded-2xl text-xs font-extrabold transition-all text-right flex items-center gap-2 group cursor-pointer whitespace-nowrap lg:w-full border-r-4 ${
                      activeTab === "reports"
                        ? "bg-red-50 text-red-600 border-red-600 font-black"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent"
                    }`}
                  >
                    <BarChart2 className={`w-4 h-4 shrink-0 ${activeTab === "reports" ? "text-red-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                    <span>التقارير وسجل الأنشطة 📊</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("tickets")}
                    className={`py-2.5 px-4 rounded-2xl text-xs font-extrabold transition-all text-right flex items-center gap-2 group cursor-pointer whitespace-nowrap lg:w-full border-r-4 ${
                      activeTab === "tickets"
                        ? "bg-red-50 text-red-600 border-red-600 font-black"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent"
                    }`}
                    id="student-tickets-tab-trigger-sidebar"
                  >
                    <LifeBuoy className={`w-4 h-4 shrink-0 ${activeTab === "tickets" ? "text-red-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                    <span>الدعم الفني والشكاوى 🛠️</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("store")}
                    className={`py-2.5 px-4 rounded-2xl text-xs font-extrabold transition-all text-right flex items-center gap-2 group cursor-pointer whitespace-nowrap lg:w-full border-r-4 ${
                      activeTab === "store"
                        ? "bg-red-50 text-red-600 border-red-600 font-black"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent"
                    }`}
                  >
                    <ShoppingBag className={`w-4 h-4 shrink-0 ${activeTab === "store" ? "text-red-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                    <span>متجر المذكرات والكتب 📖</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`py-2.5 px-4 rounded-2xl text-xs font-extrabold transition-all text-right flex items-center gap-2 group cursor-pointer whitespace-nowrap lg:w-full border-r-4 ${
                      activeTab === "profile"
                        ? "bg-red-50 text-red-600 border-red-600 font-black"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent"
                    }`}
                    id="student-profile-tab-trigger-sidebar"
                  >
                    <UserCheck className={`w-4 h-4 shrink-0 ${activeTab === "profile" ? "text-red-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                    <span>الملف الشخصي 👤</span>
                  </button>
                </div>

                {/* Sidebar Ad if any */}
                {studentSidebarAd && (
                  <div className="hidden lg:block pt-3 border-t border-gray-50">
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-[10px] font-black text-slate-800">إعلان ممول 📢</span>
                    </div>
                    <AdBanner ad={studentSidebarAd} />
                  </div>
                )}
              </div>
            </div>

            {/* Content Column (Lenders remaining width) */}
            <div className="lg:col-span-9 space-y-8" id="dashboard-content-column">
              {activeTab === "courses" ? (
                /* Normal Dashboard Panel listing enrolled courses and wallet activities */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            {/* Academic Charts Dashboard Widget */}
            {enrolledCourses.length > 0 && (
              <div className="lg:col-span-12 bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="border-b border-gray-50 pb-3">
                  <h3 className="text-base font-extrabold text-gray-900">مؤشرات الأداء الدراسي والتقدم العام 📊</h3>
                  <p className="text-xs text-gray-400">تحليل فوري ونسب مئوية لمدى اكتمال محاضرات موادك الدراسية وسجل درجات اختباراتك السابقة</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Chart 1: Lectures Completion Rate */}
                  <div className="space-y-2 bg-gray-50/50 border border-gray-100 p-4 rounded-2xl">
                    <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      معدل التقدم العام واكتمال المحاضرات الحالية 📚
                    </span>
                    <div className="h-56 w-full text-xs font-bold" dir="ltr">
                      {courseProgressData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={courseProgressData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                            <Tooltip 
                              formatter={(value: any) => [`${value}% مكتمل`, "نسبة الإنجاز"]}
                              contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #f1f5f9", fontFamily: "sans-serif" }}
                            />
                            <Bar dataKey="completion" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 font-bold" dir="rtl">
                          ابدأ بمشاهدة المحاضرات لتظهر إحصائياتك هنا 🎬
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chart 2: Previous Quiz Scores Trend */}
                  <div className="space-y-2 bg-gray-50/50 border border-gray-100 p-4 rounded-2xl">
                    <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                      منحنى تطور نتائج الاختبارات السابقة 🎯
                    </span>
                    <div className="h-56 w-full text-xs font-bold" dir="ltr">
                      {scoreTrendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={scoreTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                            <defs>
                              <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                            <Tooltip 
                              formatter={(value: any, name: any, props: any) => [props.payload.scoreText, "الدرجة المحققة"]}
                              contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #f1f5f9", fontFamily: "sans-serif" }}
                            />
                            <Area type="monotone" dataKey="percentage" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#scoreColor)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 font-bold" dir="rtl">
                          لم تقم بحل أي اختبارات حتى الآن 📝
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Active Enrolled Courses */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col gap-4 border-b border-gray-50 pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900">كورساتك النشطة بالمنصة 📖</h3>
                      <p className="text-xs text-gray-400">تصفح محاضراتك واختباراتك التفاعلية للمواد المشترك بها</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                      المشتركة: {enrolledCourses.length}
                    </span>
                  </div>

                  {/* Category Filter Group */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedCategory === "all"
                          ? "bg-red-600 text-white shadow-xs"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                      }`}
                    >
                      الكل 🌍
                    </button>
                    {Array.from(new Set(courses.map(c => c.category))).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedCategory === cat
                            ? "bg-red-600 text-white shadow-xs"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                        }`}
                      >
                        {getCategoryLabel(cat)}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredEnrolledCourses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {filteredEnrolledCourses.map((course) => (
                      <motion.div
                        key={course.id}
                        whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
                        className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md hover:border-red-100 transition-all"
                      >
                        <div className="p-5 space-y-3">
                          <span className="text-[10px] bg-red-50 text-red-600 font-extrabold px-2 py-0.5 rounded-md">
                            {getCategoryLabel(course.category)}
                          </span>
                          <h4 className="text-sm font-bold text-gray-900 line-clamp-1">
                            {course.title}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {course.description}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center gap-2">
                          <div className="flex flex-col text-right">
                            <span className="text-[10px] text-gray-400 font-bold">
                              {course.lecturesCount} محاضرات تفاعلية
                            </span>
                            {isCourseCompleted(course, user) && (
                              <span className="text-[10px] text-amber-600 font-extrabold flex items-center gap-0.5 mt-0.5">
                                <Award className="w-3.5 h-3.5" /> مؤهل للشهادة 🎓
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isCourseCompleted(course, user) && (
                              <button
                                onClick={() => {
                                  setCertCourse(course);
                                  setIsCertModalOpen(true);
                                }}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-0.5 animate-pulse"
                                title="عرض وتحميل شهادة التفوق والاعتماد"
                              >
                                <span>الشهادة 🏆</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleStartCourse(course)}
                              className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-4 py-1.5 rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                            >
                              دخول الفصل الدراسي 🚪
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : enrolledCourses.length > 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <p className="text-sm text-gray-500 font-bold">
                      لا توجد كورسات نشطة تناسب هذا التصنيف حالياً.
                    </p>
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className="text-xs font-extrabold text-red-600 underline cursor-pointer"
                    >
                      عرض جميع كورساتي النشطة 📋
                    </button>
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-4">
                    <p className="text-sm text-gray-500">
                      لم تشترك في أي كورس أو مادة تعليمية حتى الآن.
                    </p>
                    <button
                      onClick={() => onSelectCourseFromDashboard(courses[0])}
                      className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md"
                    >
                      استعراض الكورسات وتفعيل كورس 🚀
                    </button>
                  </div>
                )}
              </div>

              {/* Other Available Courses Section */}
              {otherAvailableCourses.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-6">
                  <div className="border-b border-gray-50 pb-3">
                    <h3 className="text-base font-extrabold text-gray-900">اكتشف كورسات ومواد جديدة بالمنصة 🌟</h3>
                    <p className="text-xs text-gray-400">يمكنك شحن محفظتك وتفعيل أي كورس والانضمام الفوري للفصل الدراسي</p>
                  </div>

                  {filteredOtherCourses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {filteredOtherCourses.map((course) => (
                        <motion.div
                          key={course.id}
                          whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
                          className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md hover:border-red-100 transition-all"
                        >
                          <div className="p-5 space-y-3">
                            <span className="text-[10px] bg-red-50 text-red-600 font-extrabold px-2 py-0.5 rounded-md">
                              {getCategoryLabel(course.category)}
                            </span>
                            <h4 className="text-sm font-bold text-gray-900 line-clamp-1">
                              {course.title}
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                              {course.description}
                            </p>
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-xs font-mono font-bold text-gray-900 bg-gray-100/80 px-2 py-1 rounded-lg">
                                السعر: {course.price} ج.م
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold">
                                {course.lecturesCount} محاضرات
                              </span>
                            </div>
                          </div>
                          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center gap-2">
                            <span className="text-[10px] text-gray-400 font-bold">
                              تفوق معنا الآن 🏆
                            </span>
                            <button
                              onClick={() => onSelectCourseFromDashboard(course)}
                              className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-4 py-1.5 rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                            >
                              تفاصيل وتفعيل 🚀
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center space-y-2">
                      <p className="text-sm text-gray-500 font-bold">
                        لا توجد كورسات جديدة تناسب هذا التصنيف حالياً.
                      </p>
                      <button
                        onClick={() => setSelectedCategory("all")}
                        className="text-xs font-extrabold text-red-600 underline cursor-pointer"
                      >
                        عرض جميع الكورسات المتاحة 🌍
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Wallet payments tracking */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card 1: My Wallet & Recharge System */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-4">
                <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-50 pb-3 flex items-center gap-1.5">
                  <Wallet className="w-5 h-5 text-red-600" />
                  <span>محفظتي التعليمية والتحصيل 💸</span>
                </h3>

                <div className="bg-red-50/50 rounded-2xl p-4 text-center space-y-1 border border-red-100/50">
                  <span className="text-[10px] text-gray-400 font-extrabold block">الرصيد المتاح حالياً بالمنصة</span>
                  <span className="text-2xl font-black text-red-600 font-mono">{user.walletBalance} ج.م</span>
                </div>

                {/* Recharge Code Form */}
                <div className="space-y-2 pt-3 border-t border-gray-100">
                  <label className="text-[11px] font-bold text-gray-600 block">شحن فوري للمحفظة بكود الكارت 🎫</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="مثال: CODE-100-EGP-XXXX"
                      value={rechargeCodeInput}
                      onChange={(e) => setRechargeCodeInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-center outline-hidden focus:bg-white focus:border-red-500"
                    />
                    <button
                      onClick={handleRechargeSubmit}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      شحن
                    </button>
                  </div>
                  {rechargeMsg && (
                    <p className={`text-[10px] font-extrabold text-center mt-1 p-2 rounded-lg ${
                      rechargeMsg.includes("نجاح") ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                    }`}>
                      {rechargeMsg}
                    </p>
                  )}
                </div>
              </div>

              {/* Card 2: Payments history ledger */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-4">
                <h3 className="text-base font-extrabold text-gray-900 border-b border-gray-50 pb-3">
                  سجل طلبات الاشتراك والمالية 💸
                </h3>

                <div className="space-y-3">
                  {userPayments.length > 0 ? (
                    userPayments.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 text-right text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-800 truncate max-w-[120px]" title={p.courseTitle}>
                            {p.courseTitle}
                          </span>
                          <span className="font-mono font-bold text-red-600">{p.amount} ج.م</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-[10px] text-gray-400">
                          <span>بواسطة: {p.method === "vodafone_cash" ? "فودافون كاش" : p.method === "instapay" ? "إنستاباي" : p.method === "fawry" ? "فوري" : "فيزا"}</span>
                          
                          {p.status === "pending" && (
                            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-bold border border-amber-100">
                              ⏳ قيد الانتظار
                            </span>
                          )}
                          {p.status === "approved" && (
                            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-100">
                              ✅ مفعل ومشترك
                            </span>
                          )}
                          {p.status === "rejected" && (
                            <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded font-bold border border-red-100">
                              ❌ مرفوض
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-gray-400">
                      لا توجد طلبات دفع سابقة.
                    </div>
                  )}
                </div>
              </div>

              {/* Student Sidebar Ad */}
              {studentSidebarAd && (
                <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                    <span className="text-xs font-black text-slate-800">إعلان ممول 📢</span>
                    <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-extrabold">موصى به</span>
                  </div>
                  <AdBanner ad={studentSidebarAd} />
                </div>
              )}
                </div>
              </div>
              ) : activeTab === "reports" ? (
                /* Reports and Activity Log Panel */
                <div className="space-y-8 animate-fade-in" id="reports-activity-container">
            {/* Header explaining Reports */}
            <div className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-3xl p-6 sm:p-8 shadow-md text-right space-y-2">
              <h3 className="text-xl sm:text-2xl font-black">تقارير المتابعة الأكاديمية وسجل الحركة 📈</h3>
              <p className="text-xs sm:text-sm text-red-100 max-w-2xl leading-relaxed">
                مرحباً بك في لوحة التحليلات المتقدمة. هنا يمكنك مراقبة التقدم الدراسي في الكورسات، والتحقق من نسب حل الاختبارات ومتوسط الدرجات المحققة، بالإضافة لمراجعة سجل الحركة الشفاف لجميع أنشطتك على المنصة.
              </p>
            </div>

            {/* CHARTS CONTAINER GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="charts-dashboard-grid">
              {/* Card 1: Course completion (Bar Chart) */}
              <div className="lg:col-span-6 bg-white border border-gray-150 rounded-3xl p-6 shadow-xs space-y-4">
                <div>
                  <h4 className="text-base font-extrabold text-gray-900">تقدم الكورسات المشتركة 📊</h4>
                  <p className="text-xs text-gray-400">نسبة المحاضرات المكتملة بكل كورس مسجل</p>
                </div>
                <div className="h-[280px] w-full" id="course-progress-chart-container">
                  {courseProgressData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={courseProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} unit="%" />
                        <Tooltip
                          contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '12px', border: '1px solid #e5e7eb' }}
                          formatter={(value: any, name: any, props: any) => [
                            `${value}% (${props.payload.completed}/${props.payload.total} محاضرة)`,
                            "نسبة الإنجاز"
                          ]}
                        />
                        <Bar dataKey="completion" fill="#dc2626" radius={[6, 6, 0, 0]} maxBarSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-gray-400 font-bold">
                      لا توجد كورسات مشتركة لتتبع تقدمها حالياً.
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Quiz Solved vs Remaining (Pie Chart) */}
              <div className="lg:col-span-6 bg-white border border-gray-150 rounded-3xl p-6 shadow-xs space-y-4">
                <div>
                  <h4 className="text-base font-extrabold text-gray-900">نسبة إنجاز الاختبارات 📝</h4>
                  <p className="text-xs text-gray-400">عدد الاختبارات المحلولة مقارنة بإجمالي اختبارات الكورسات</p>
                </div>
                <div className="h-[280px] w-full flex flex-col sm:flex-row items-center justify-around" id="quiz-compliance-chart-container">
                  {quizComplianceData[0].value > 0 || quizComplianceData[1].value > 0 ? (
                    <>
                      <div className="w-[180px] h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={quizComplianceData}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={75}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {quizComplianceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '12px', border: '1px solid #e5e7eb' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-3 text-right">
                        {quizComplianceData.map((entry, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                            <span className="text-xs font-extrabold text-gray-700">{entry.name}:</span>
                            <span className="text-sm font-black text-gray-900">{entry.value}</span>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-gray-100 text-[10px] text-gray-400 leading-relaxed max-w-[160px]">
                          * يوصى بحل جميع الاختبارات لضمان الفهم التام وتدريب العقل.
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-gray-400 font-bold">
                      لا تملك كورسات نشطة تحتوي على اختبارات حالياً.
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Quiz scores trend (Area Chart) */}
              <div className="lg:col-span-12 bg-white border border-gray-150 rounded-3xl p-6 shadow-xs space-y-4">
                <div>
                  <h4 className="text-base font-extrabold text-gray-900">منحنى درجات الاختبارات التفاعلية 📈</h4>
                  <p className="text-xs text-gray-400">تطور درجاتك المئوية عبر المحاولات المتتالية للاختبارات</p>
                </div>
                <div className="h-[280px] w-full" id="score-trend-chart-container">
                  {scoreTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={scoreTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} unit="%" />
                        <Tooltip
                          contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '12px', border: '1px solid #e5e7eb' }}
                          formatter={(value: any, name: any, props: any) => [
                            `${value}% (${props.payload.scoreText})`,
                            "درجة الاختبار"
                          ]}
                        />
                        <Area type="monotone" dataKey="percentage" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorPercentage)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400 space-y-2">
                      <HelpCircle className="w-10 h-10 text-gray-300 stroke-[1.5]" />
                      <span className="text-sm font-bold">لم تقم بحل أي اختبارات تفاعلية حتى الآن.</span>
                      <span className="text-xs text-gray-400">ابدأ بفتح حصة تعليمية، وحل اختبارها لتسجيل درجاتك هنا!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SOLVED QUIZZES DETAILED REVIEW BOARD */}
            {(() => {
              const quizAttemptsList = Object.entries(user.quizAttempts || {}).map(([quizId, attempt]) => {
                let foundQuiz: Quiz | null = null;
                let foundLecture: Lecture | null = null;
                let foundCourse: Course | null = null;

                for (const course of courses) {
                  for (const lect of course.lectures) {
                    if (lect.quiz && lect.quiz.id === quizId) {
                      foundQuiz = lect.quiz;
                      foundLecture = lect;
                      foundCourse = course;
                      break;
                    }
                  }
                  if (foundQuiz) break;
                }

                return {
                  quizId,
                  attempt,
                  quiz: foundQuiz,
                  lecture: foundLecture,
                  course: foundCourse,
                };
              }).filter(item => item.quiz && item.course && item.lecture);

              return (
                <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6" id="solved-quizzes-review-board">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                      <span>🏆 سجل درجات وتقارير الاختبارات التفاعلية</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">اضغط على أي اختبار لمراجعة إجاباتك النموذجية والتفصيلية ومعرفة الصواب والخطأ مع الشرح النموذجي</p>
                  </div>

                  {quizAttemptsList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {quizAttemptsList.map((item) => {
                        const qCount = item.quiz!.questions.length;
                        const scoreVal = item.attempt.score;
                        const percentVal = Math.round((scoreVal / qCount) * 100);

                        let gradeBadgeColor = "bg-amber-50 text-amber-700 border-amber-150";
                        if (percentVal >= 85) gradeBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-150";
                        else if (percentVal < 60) gradeBadgeColor = "bg-red-50 text-red-700 border-red-150";

                        return (
                          <div
                            key={item.quizId}
                            className="bg-gray-50/50 border border-gray-150 rounded-2xl p-4 flex flex-col justify-between gap-4 hover:bg-gray-50 transition-all text-right"
                          >
                            <div className="space-y-2">
                              {/* Course and Lecture tags */}
                              <div className="flex flex-wrap gap-1.5">
                                <span className="text-[9px] bg-red-50 text-red-600 font-extrabold px-2 py-0.5 rounded-md border border-red-100/30">
                                  {item.course!.title}
                                </span>
                                <span className="text-[9px] bg-gray-150 text-gray-600 font-bold px-2 py-0.5 rounded-md">
                                  {item.lecture!.title}
                                </span>
                              </div>

                              <h4 className="text-xs font-black text-gray-900 line-clamp-1">
                                {item.quiz!.title}
                              </h4>

                              <div className="flex justify-between items-center text-[10px] text-gray-500">
                                <span>تاريخ المحاولة: {item.attempt.completedAt || "غير محدد"}</span>
                                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${gradeBadgeColor}`}>
                                  الدرجة: {scoreVal} / {qCount} ({percentVal}%)
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setActiveCourse(item.course);
                                setActiveLecture(item.lecture);
                                setViewingMode("quiz");
                                setActiveQuiz(item.quiz);
                                setQuizAnswers(item.attempt.answers || []);
                                setShowQuizResults(true);
                                setIsReviewingAnswers(true);
                              }}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                            >
                              <span>مراجعة إجاباتك النموذجية 🔍</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-gray-400 text-xs space-y-2 bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl">
                      <HelpCircle className="w-8 h-8 text-gray-300 mx-auto" />
                      <p className="font-extrabold text-gray-500">لا توجد اختبارات تفاعلية محلولة لمراجعتها حالياً</p>
                      <p className="text-[10px] text-gray-400">بمجرد قيامك بحل أي اختبار، ستتمكن من مراجعة خطوات حله هنا بالتفصيل.</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ACTIVITY LOG TABLE */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6" id="activity-log-table-container">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-50 pb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">سجل الأنشطة والمتابعة الزمنية (Activity Log) 🕒</h3>
                  <p className="text-xs text-gray-400">قائمة تفصيلية مرتبة زمنياً لجميع تفاعلات الطالب بالمنصة لضمان شفافية المتابعة الفائقة</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 text-[10px] text-gray-500 font-bold">
                  <span>إجمالي الحركات:</span>
                  <span className="text-red-600 text-xs font-black">{studentLogs.length}</span>
                </div>
              </div>

              {/* FILTER ROW */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                {/* Search field */}
                <div className="w-full sm:w-72 relative">
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    placeholder="ابحث عن نشاط محدد..."
                    className="w-full text-xs bg-white border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-right transition-colors"
                  />
                </div>

                {/* Type Filter Buttons */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    { id: "all", label: "الكل 📋" },
                    { id: "watched_video", label: "فيديوهات الشرح 🎥" },
                    { id: "solved_quiz", label: "حل الاختبارات ✏️" },
                    { id: "recharged_balance", label: "شحن رصيد 💳" },
                    { id: "course_enrollment", label: "الاشتراكات 📚" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setLogTypeFilter(filter.id as any)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors border ${
                        logTypeFilter === filter.id
                          ? "bg-red-600 text-white border-red-600 shadow-xs"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TABLE ELEMENT */}
              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 font-extrabold text-xs border-b border-gray-100">
                      <th className="p-4 w-1/4">نوع النشاط</th>
                      <th className="p-4 w-1/2">تفاصيل وبيان الحركة</th>
                      <th className="p-4 w-1/4 text-left">التاريخ والوقت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {paginatedLogs.length > 0 ? (
                      paginatedLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 whitespace-nowrap">
                            {log.actionType === "watched_video" && (
                              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 font-extrabold px-2.5 py-1 rounded-lg border border-blue-100">
                                <PlayCircle className="w-3.5 h-3.5" />
                                مشاهدة فيديو
                              </span>
                            )}
                            {log.actionType === "solved_quiz" && (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 font-extrabold px-2.5 py-1 rounded-lg border border-amber-100">
                                <HelpCircle className="w-3.5 h-3.5" />
                                حل اختبار تفاعلي
                              </span>
                            )}
                            {log.actionType === "recharged_balance" && (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 font-extrabold px-2.5 py-1 rounded-lg border border-emerald-100">
                                <Wallet className="w-3.5 h-3.5" />
                                شحن رصيد المحفظة
                              </span>
                            )}
                            {log.actionType === "course_enrollment" && (
                              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-600 font-extrabold px-2.5 py-1 rounded-lg border border-purple-100">
                                <BookOpen className="w-3.5 h-3.5" />
                                الاشتراك بكورس
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-gray-700 font-bold leading-relaxed">
                            {log.details}
                          </td>
                          <td className="p-4 text-gray-400 font-mono text-left font-medium whitespace-nowrap">
                            {formatTime(log.timestamp)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-12 text-center text-gray-400 font-bold">
                          لا توجد أنشطة مطابقة لبحثك أو الفلتر المختار حالياً.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION / LOAD MORE */}
              {filteredLogs.length > visibleLogsCount && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setVisibleLogsCount((prev) => prev + 10)}
                    className="px-6 py-2.5 bg-gray-50 border border-gray-250 hover:bg-gray-100 text-gray-700 font-extrabold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <ListRestart className="w-4 h-4" />
                    <span>عرض المزيد من السجلات 🕒</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "store" ? (
          /* E-Book & Shipping Store Panel */
          <div className="space-y-6 animate-fade-in text-right font-sans" id="student-book-store-container">
            <div className="bg-gradient-to-r from-red-600 to-red-850 text-white rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-black">متجر الكتب المطبوعة والمذكرات الورقية 📚🚚</h3>
                <p className="text-xs sm:text-sm text-red-100 max-w-2xl leading-relaxed">
                  احصل على ملازم الشرح الملونة والمذكرات الرسمية والكتب الخارجية مطبوعة ومجلدة بجودة عالية، مع خدمة شحن سريعة إلى باب منزلك في أي محافظة بجمهورية مصر العربية!
                </p>
              </div>
              <div className="flex-shrink-0 bg-white/10 px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-2">
                <div className="text-right">
                  <span className="block text-[10px] text-red-100 font-bold">رصيد محفظتك المتاح</span>
                  <span className="block text-base font-black">{user.walletBalance} ج.م</span>
                </div>
                <Wallet className="w-5 h-5 text-red-100" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Book Orders Tracking */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-4">
                  <h4 className="text-sm font-black text-gray-900 border-b border-gray-50 pb-3 flex items-center justify-between">
                    <span>تتبع طلبات الشحن الخاصة بك 📦</span>
                    <Truck className="w-4 h-4 text-red-600" />
                  </h4>

                  {bookOrders.filter((o) => o.userId === user.id).length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-xs space-y-2">
                      <Truck className="w-8 h-8 text-gray-350 mx-auto animate-bounce" />
                      <p className="font-extrabold text-gray-500">لا توجد طلبات شحن حالية</p>
                      <p className="text-[10px] text-gray-400">عند شراء أي كتاب من المتجر باليمين، ستظهر حالة الشحن وتفاصيل التوصيل ورقم التتبع هنا تلقائياً.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                      {bookOrders
                        .filter((o) => o.userId === user.id)
                        .map((order) => (
                          <div key={order.id} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-right space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-[10px] text-gray-400">ID: {order.id.slice(-6)}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                                order.status === "pending" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                                order.status === "shipped" ? "bg-blue-100 text-blue-700 border border-blue-200 animate-pulse" :
                                order.status === "delivered" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                                "bg-red-100 text-red-700 border border-red-200"
                              }`}>
                                {order.status === "pending" && "قيد المراجعة ⏳"}
                                {order.status === "shipped" && "تم الشحن 🚚"}
                                {order.status === "delivered" && "تم التوصيل ✅"}
                                {order.status === "cancelled" && "ملغي ❌"}
                              </span>
                            </div>
                            <h5 className="font-black text-gray-900">{order.bookTitle}</h5>
                            <p className="text-[10px] text-gray-500 font-bold">السعر المدفوع: <span className="text-red-600">{order.price} ج.م</span></p>
                            <p className="text-[10px] text-gray-500">العنوان: {order.governorate} - {order.address}</p>
                            {order.shippingCompany && (
                              <div className="bg-white p-2 rounded-xl border border-gray-100 space-y-1 mt-1 text-[10px] text-gray-600">
                                <p className="font-bold text-gray-700">🚚 شركة الشحن: {order.shippingCompany}</p>
                                <p className="font-mono text-gray-600">رقم التتبع: <span className="text-red-600 font-extrabold">{order.trackingNumber || "جاري التحديث"}</span></p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Book Store Showcase */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-6">
                  <h4 className="text-base font-extrabold text-gray-900 border-b border-gray-50 pb-3 flex items-center gap-1.5 justify-start">
                    <BookMarked className="w-5 h-5 text-red-600" />
                    <span>الكتب المطبوعة ومذكرات الشرح المتوفرة 🎓</span>
                  </h4>

                  {books.length === 0 ? (
                    <div className="py-16 text-center text-gray-400 text-sm space-y-2">
                      <ShoppingBag className="w-12 h-12 text-gray-350 mx-auto" />
                      <p className="font-extrabold text-gray-500">المتجر فارغ حالياً</p>
                      <p className="text-xs text-gray-400">سيقوم المشرف والأساتذة برفع المذكرات والكتب المتاحة قريباً جداً.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {books.map((book) => {
                        const isSelectedForCheckout = buyingBookId === book.id;
                        return (
                          <div key={book.id} className="bg-gray-50/50 rounded-2xl border border-gray-100 p-4 flex flex-col justify-between space-y-4 hover:shadow-xs transition-all duration-300">
                            <div className="space-y-3">
                              {book.imageUrl ? (
                                <img
                                  src={book.imageUrl}
                                  alt={book.title}
                                  className="w-full h-40 object-cover rounded-xl border border-gray-100 bg-white"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-40 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">
                                  <BookMarked className="w-12 h-12" />
                                </div>
                              )}

                              <div className="space-y-1 text-right">
                                <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-black ${
                                  book.stock > 10 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                  book.stock > 0 ? "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse" :
                                  "bg-red-50 text-red-600 border border-red-100"
                                }`}>
                                  {book.stock > 10 ? `متوفر بالمخزن (${book.stock} نسخة)` :
                                   book.stock > 0 ? `الكمية محدودة جداً (${book.stock} متبقية)` :
                                   "نفد من المخزن مؤقتاً"}
                                </span>
                                <h5 className="text-sm font-black text-gray-900 leading-snug">{book.title}</h5>
                                <p className="text-[10px] text-gray-400 line-clamp-2">{book.description || "لا يوجد وصف متوفر للكتيب."}</p>
                              </div>
                            </div>

                            <div className="space-y-3 pt-2 border-t border-gray-100/50 text-right">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-gray-400">سعر النسخة المطبوعة</span>
                                <span className="text-base font-black text-red-600 font-mono">{book.price} ج.م</span>
                              </div>

                              {isSelectedForCheckout ? (
                                <div className="bg-white p-3.5 rounded-xl border border-red-100 space-y-3 animate-fade-in text-right">
                                  <p className="text-[10px] font-bold text-red-800">✍️ إتمام طلب الشحن والتوصيل:</p>
                                  
                                  {checkoutErrorMsg && (
                                    <p className="text-[10px] text-red-600 font-extrabold bg-red-50 p-2 rounded-lg">{checkoutErrorMsg}</p>
                                  )}
                                  {checkoutSuccessMsg && (
                                    <p className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 p-2 rounded-lg">{checkoutSuccessMsg}</p>
                                  )}

                                  <div className="space-y-2 text-right">
                                    <div>
                                      <label className="text-[9px] font-bold text-gray-600 block mb-1">المحافظة لحساب تكلفة التوصيل</label>
                                      <select
                                        value={checkoutGov}
                                        onChange={(e) => setCheckoutGov(e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[11px] text-right outline-hidden"
                                      >
                                        <option value="">-- اختر محافظة التوصيل --</option>
                                        <option value="القاهرة">القاهرة</option>
                                        <option value="الجيزة">الجيزة</option>
                                        <option value="الإسكندرية">الإسكندرية</option>
                                        <option value="القليوبية">القليوبية</option>
                                        <option value="الدقهلية">الدقهلية</option>
                                        <option value="المنوفية">المنوفية</option>
                                        <option value="الغربية">الغربية</option>
                                        <option value="الشرقية">الشرقية</option>
                                        <option value="البحيرة">البحيرة</option>
                                        <option value="دمياط">دمياط</option>
                                        <option value="كفر الشيخ">كفر الشيخ</option>
                                        <option value="بورسعيد">بورسعيد</option>
                                        <option value="الإسماعيلية">الإسماعيلية</option>
                                        <option value="السويس">السويس</option>
                                        <option value="الفيوم">الفيوم</option>
                                        <option value="بني سويف">بني سويف</option>
                                        <option value="المنيا">المنيا</option>
                                        <option value="أسيوط">أسيوط</option>
                                        <option value="سوهاج">سوهاج</option>
                                        <option value="قنا">قنا</option>
                                        <option value="الأقصر">الأقصر</option>
                                        <option value="أسوان">أسوان</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="text-[9px] font-bold text-gray-600 block mb-1">عنوان الشحن بالتفصيل (الشارع والمبنى ورقم الشقة)</label>
                                      <input
                                        type="text"
                                        required
                                        value={checkoutAddress}
                                        onChange={(e) => setCheckoutAddress(e.target.value)}
                                        placeholder="مثال: شارع الجلاء، عمارة التوحيد، الدور الثالث شقة 5"
                                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[11px] text-right outline-hidden"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex gap-1.5">
                                    <button
                                      disabled={isBuyingProcess}
                                      onClick={async () => {
                                        if (!checkoutGov || !checkoutAddress.trim()) {
                                          setCheckoutErrorMsg("يرجى ملء جميع بيانات الشحن المذكورة بالكامل!");
                                          return;
                                        }
                                        setCheckoutErrorMsg("");
                                        setIsBuyingProcess(true);
                                        const res = await onBuyBook?.(book.id, checkoutGov, checkoutAddress);
                                        setIsBuyingProcess(false);
                                        if (res?.success) {
                                          setCheckoutSuccessMsg(res.message);
                                          setCheckoutAddress("");
                                          setCheckoutGov("");
                                          setTimeout(() => {
                                            setBuyingBookId(null);
                                            setCheckoutSuccessMsg("");
                                          }, 4000);
                                        } else {
                                          setCheckoutErrorMsg(res?.message || "فشلت عملية الشراء لسبب غير متوقع.");
                                        }
                                      }}
                                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 rounded-lg text-[10px] cursor-pointer"
                                    >
                                      {isBuyingProcess ? "جاري الخصم والشحن..." : "تأكيد الشراء الفوري ✔️"}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setBuyingBookId(null);
                                        setCheckoutErrorMsg("");
                                        setCheckoutSuccessMsg("");
                                      }}
                                      className="px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold py-2 rounded-lg text-[10px] cursor-pointer"
                                    >
                                      إلغاء
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  disabled={book.stock <= 0}
                                  onClick={() => {
                                    setBuyingBookId(book.id);
                                    setCheckoutGov("");
                                    setCheckoutAddress("");
                                  }}
                                  className={`w-full py-2.5 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                                    book.stock > 0
                                      ? "bg-slate-900 text-white hover:bg-slate-800"
                                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  }`}
                                >
                                  <ShoppingBag className="w-4 h-4" />
                                  <span>{book.stock > 0 ? "طلب وشراء الكتاب المطبوع 🚚" : "غير متوفر بالمخزن حالياً"}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "tickets" ? (
          /* Support Tickets Panel */
          <div className="space-y-6 animate-fade-in text-right font-sans" id="student-tickets-container">
            <div className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-3xl p-6 sm:p-8 shadow-md space-y-2">
              <h3 className="text-xl sm:text-2xl font-black">مركز الدعم الفني والتحصيل والأكاديمي 🛠️</h3>
              <p className="text-xs sm:text-sm text-red-100 max-w-2xl leading-relaxed">
                هل تواجه مشكلة تقنية، أو لديك سؤال تعليمي بالأكاديمية؟ يمكنك إرسال تذكرة تواصل مباشرة مع الإدارة، وسنجيبك في أسرع وقت ممكن.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Create New Ticket */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-4">
                  <h4 className="text-base font-extrabold text-gray-900 border-b border-gray-50 pb-3">فتح تذكرة دعم جديدة 🎫</h4>
                  
                  {ticketSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-bold">
                      {ticketSuccess}
                    </div>
                  )}

                  {ticketError && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-bold">
                      {ticketError}
                    </div>
                  )}

                  <form onSubmit={handleCreateTicket} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 block">عنوان الاستفسار</label>
                      <input
                        type="text"
                        required
                        value={newTicketTitle}
                        onChange={(e) => setNewTicketTitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden focus:bg-white focus:border-red-500 text-right"
                        placeholder="مثال: مشكلة في تشغيل فيديوهات الكورس"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 block">قسم الدعم المعني</label>
                      <select
                        value={newTicketCategory}
                        onChange={(e) => setNewTicketCategory(e.target.value as any)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden focus:bg-white focus:border-red-500 text-right cursor-pointer"
                      >
                        <option value="technical">دعم تقني (تشغيل الفيديوهات، حظر التطبيقات)</option>
                        <option value="academic">دعم أكاديمي (أسئلة في المادة والمسائل الشائعة)</option>
                        <option value="financial">استفسار مالي (شحن المحفظة، الأكواد والملازم)</option>
                        <option value="other">استفسارات عامة أخرى</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 block">تفاصيل الرسالة والمشكلة</label>
                      <textarea
                        required
                        rows={4}
                        value={newTicketMessage}
                        onChange={(e) => setNewTicketMessage(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden focus:bg-white focus:border-red-500 text-right resize-none"
                        placeholder="اكتب هنا كافة تفاصيل استفسارك ومقترحاتك للإدارة..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3.5 rounded-xl text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-4 h-4" />
                      <span>إرسال التذكرة للإدارة والرد الفوري 🚀</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Ticket List and conversation */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <h4 className="text-base font-extrabold text-gray-900">سجل تذاكر الدعم والردود 💬</h4>
                    <button
                      onClick={loadUserTickets}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="تحديث البيانات"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {isTicketsLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400 text-xs">
                      <span className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      <span>جاري تحميل التذاكر وتحديث البيانات...</span>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-xs space-y-2">
                      <MessageSquare className="w-8 h-8 text-gray-350 mx-auto" />
                      <p className="font-extrabold text-gray-500">لا توجد لديك تذاكر دعم سابقة</p>
                      <p className="text-[10px] text-gray-400">أي تذكرة تقوم بإنشائها باليسار ستظهر هنا مع ردود المشرفين والأستاذ.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                      {tickets.map((t) => {
                        const isSelected = activeTicketId === t.id;
                        return (
                          <div
                            key={t.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              isSelected
                                ? "bg-red-50/15 border-red-200"
                                : "bg-gray-50/30 border-gray-100 hover:bg-gray-50/70"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-4 cursor-pointer" onClick={() => setActiveTicketId(isSelected ? null : t.id)}>
                              <div className="space-y-1">
                                <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-600 mb-1">
                                  {t.category === "technical" ? "دعم تقني 🛠️" : t.category === "academic" ? "دعم أكاديمي 📐" : t.category === "financial" ? "استفسار مالي 💳" : "أخرى 📋"}
                                </span>
                                <h5 className="text-xs font-black text-gray-900">{t.title}</h5>
                                <p className="text-[10px] text-gray-400">تاريخ الإنشاء: {new Date(t.createdAt).toLocaleDateString("ar-EG")}</p>
                              </div>

                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                {t.status === "open" && (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">
                                    قيد الانتظار ⏳
                                  </span>
                                )}
                                {t.status === "replied" && (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse">
                                    تم الرد من الإدارة ✨
                                  </span>
                                )}
                                {t.status === "closed" && (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-250">
                                    مغلقة ومكتملة 🔒
                                  </span>
                                )}
                                <span className="text-[10px] text-red-600 font-extrabold underline hover:text-red-700 mt-1">
                                  {isSelected ? "إخفاء التفاصيل ▲" : `عرض المحادثة (${t.replies.length} رد) ▼`}
                                </span>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="mt-4 pt-4 border-t border-gray-100/70 space-y-4">
                                <div className="p-3 bg-white rounded-xl border border-gray-100 text-xs text-gray-850 leading-relaxed">
                                  <span className="font-extrabold text-red-600 block mb-1 text-[10px]">استفسارك الأساسي:</span>
                                  {t.message}
                                </div>

                                {t.replies.map((rep) => (
                                  <div
                                    key={rep.id}
                                    className={`p-3 rounded-xl text-xs leading-relaxed max-w-[85%] ${
                                      rep.senderRole === "admin"
                                        ? "bg-red-50 text-red-800 mr-auto border border-red-100/60"
                                        : "bg-gray-100 text-gray-800 ml-auto"
                                    }`}
                                  >
                                    <div className="flex justify-between items-center mb-1 text-[10px] font-bold">
                                      <span className={rep.senderRole === "admin" ? "text-red-700" : "text-gray-600"}>
                                        {rep.senderRole === "admin" ? "👑 الأستاذ والمشرفين" : "👤 أنت"}
                                      </span>
                                      <span className="font-mono text-gray-400">
                                        {new Date(rep.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </div>
                                    <p>{rep.message}</p>
                                  </div>
                                ))}

                                {t.status !== "closed" ? (
                                  <div className="flex gap-2 pt-2 border-t border-gray-50">
                                    <input
                                      type="text"
                                      value={replyMessage}
                                      onChange={(e) => setReplyMessage(e.target.value)}
                                      placeholder="اكتب ردك ومتابعتك للمشكلة هنا..."
                                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs outline-hidden focus:bg-white focus:border-red-500 text-right"
                                      onKeyDown={(e) => e.key === "Enter" && handleSendTicketReply(t.id)}
                                    />
                                    <button
                                      onClick={() => handleSendTicketReply(t.id)}
                                      className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs cursor-pointer flex items-center justify-center flex-shrink-0"
                                    >
                                      إرسال
                                    </button>
                                  </div>
                                ) : (
                                  <p className="text-center text-[10px] text-gray-400 pt-2 font-extrabold">
                                    تلك التذكرة مغلقة ومحلولة. لا يمكن كتابة ردود إضافية.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
              ) : (
                /* Student Profile Panel */
                <div className="space-y-6 animate-fade-in" id="student-profile-container">
                  <StudentProfile user={user} onUpdateProfile={onUpdateProfile || (() => {})} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {studentBottomAd && (
        <div className="w-full mt-6">
          <AdBanner ad={studentBottomAd} />
        </div>
      )}

      {certCourse && (
        <CertificateModal
          isOpen={isCertModalOpen}
          onClose={() => {
            setIsCertModalOpen(false);
            setCertCourse(null);
          }}
          course={certCourse}
          user={user}
        />
      )}

      {/* Anti-Cheat Fullscreen Enforcement Overlay */}
      {showAntiCheatOverlay && (
        <div className="fixed inset-0 bg-red-950/95 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-6 text-center text-white select-none">
          <div className="max-w-md bg-black/40 border border-red-500/30 p-8 rounded-3xl space-y-6 shadow-2xl animate-bounce">
            <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto border border-red-500/50">
              <AlertTriangle className="w-10 h-10 text-red-500 animate-ping" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-red-500">تم الخروج من وضع ملء الشاشة!</h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                🚨 تنبيه مكافحة الغش: قوانين المنصة تفرض البقاء في وضع ملء الشاشة طوال فترة الاختبار. يرجى إعادة الدخول فوراً!
              </p>
            </div>
            <div className="bg-red-900/40 py-3 rounded-xl border border-red-700/50 font-mono text-lg font-black text-red-300">
              الوقت المتبقي للعودة: <span className="text-white text-xl">{fullscreenTimer}</span> ثانية
            </div>
            <button
              onClick={requestFullscreenExam}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-sm transition-all duration-300 cursor-pointer shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              العودة لوضع ملء الشاشة ومتابعة الاختبار 🔒
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
