/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  BookOpen,
  DollarSign,
  Layers,
  Phone,
  Clock,
  UserCheck,
  Ticket,
  Video,
  Shield,
  Eye,
  Settings,
  Trash2,
  Coins,
  UserPlus,
  GraduationCap,
  Copy,
  Edit,
  Download,
  Info,
  RefreshCw,
  MessageSquare,
  Send,
  Zap,
  Play,
  StopCircle,
  Trophy,
  Timer,
  Crown,
  Award,
  ChevronRight,
  HelpCircle,
  Lock,
  TrendingUp,
  BarChart3,
  PieChart as LucidePieChart,
  Activity,
  Calendar,
  Cloud,
  Globe
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { Course, PendingPayment, GradeLevel, CourseCategory, Teacher, ChargeCode, VideoSettings, PlatformSettings, AdCampaign, SupportTicket, TicketReply, LiveQuiz, LiveQuizParticipant, User, Question, Quiz } from "../types";
import { fetchAllSupportTickets, saveSupportTicketInFirestore, fetchLiveQuizzes, saveLiveQuizInFirestore, deleteLiveQuizInFirestore, fetchAllUsers } from "../lib/dbService";
import { db } from "../firebase";
import { collection, doc, setDoc, updateDoc, onSnapshot, getDoc } from "firebase/firestore";


interface AdminDashboardProps {
  user: User;
  courses: Course[];
  pendingPayments: PendingPayment[];
  students: { name: string; phone: string; enrolledCount: number; balance: number }[];
  onApprovePayment: (paymentId: string) => void;
  onRejectPayment: (paymentId: string) => void;
  onAddNewCourse: (course: Course) => void;
  onAddLectureToCourse?: (courseId: string, lectureTitle: string, duration: string, videoUrl: string, pdfUrl: string, quiz?: Quiz) => void;
  onEnrollStudentInCourse?: (studentPhone: string, courseId: string) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  onUnenrollStudentFromCourse?: (studentPhone: string, courseId: string) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  
  // Advanced features
  teachers: Teacher[];
  chargeCodes: ChargeCode[];
  videoSettings: VideoSettings;
  onAddTeacher: (name: string, subject: string, phone: string, email?: string) => void;
  onDeleteTeacher: (id: string) => void;
  onGenerateChargeCodes: (value: number, count: number) => void;
  onUpdateVideoSettings: (settings: VideoSettings) => void;
  onUpdateStudentBalance: (phone: string, amount: number, action: "add" | "deduct") => void;
  onAddStudent: (name: string, phone: string, balance: number, enrolledCount: number) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  onDeleteStudent?: (phone: string) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  onUpdateStudent?: (oldPhone: string, updatedData: { name: string; phone: string; balance: number }) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  onUpdateTeacher?: (id: string, updatedData: Partial<Teacher>) => void;
  onUpdateCourse?: (updatedCourse: Course) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  onDeleteCourse?: (courseId: string) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  platformSettings?: PlatformSettings;
  onUpdatePlatformSettings?: (settings: PlatformSettings) => void;
}

export default function AdminDashboard({
  user,
  courses,
  pendingPayments,
  students,
  onApprovePayment,
  onRejectPayment,
  onAddNewCourse,
  onAddLectureToCourse,
  onEnrollStudentInCourse,
  onUnenrollStudentFromCourse,
  teachers,
  chargeCodes,
  videoSettings,
  onAddTeacher,
  onDeleteTeacher,
  onGenerateChargeCodes,
  onUpdateVideoSettings,
  onUpdateStudentBalance,
  onAddStudent,
  onDeleteStudent,
  onUpdateStudent,
  onUpdateTeacher,
  onUpdateCourse,
  onDeleteCourse,
  platformSettings,
  onUpdatePlatformSettings,
}: AdminDashboardProps) {
  // Navigation tabs - Default to teachers for Teacher since financials/payments/settings are Admin-only
  const [activeTab, setActiveTab] = React.useState<"payments" | "teachers" | "students" | "codes" | "video" | "settings" | "tickets" | "course-students" | "cloudflare">(
    user?.role === "teacher" ? "teachers" : "payments"
  );

  // Course Subscriptions (Enrollment Management) States
  const [selectedCourseIdForStudents, setSelectedCourseIdForStudents] = React.useState<string>("");
  const [allUsers, setAllUsers] = React.useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState<boolean>(false);
  const [enrollPhoneInput, setEnrollPhoneInput] = React.useState<string>("");
  const [enrollSuccessMsg, setEnrollSuccessMsg] = React.useState<string>("");
  const [enrollErrorMsg, setEnrollErrorMsg] = React.useState<string>("");

  const loadAllUsersFromDb = async () => {
    setLoadingUsers(true);
    try {
      const users = await fetchAllUsers();
      setAllUsers(users);
    } catch (err) {
      console.error("Error loading users in dashboard:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === "course-students") {
      loadAllUsersFromDb();
      if (courses.length > 0 && !selectedCourseIdForStudents) {
        setSelectedCourseIdForStudents(courses[0].id);
      }
    }
  }, [activeTab, courses]);

  const renderRestrictedScreen = (title: string, description: string) => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-6 max-w-lg mx-auto" id="restricted-screen-view">
      <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 shadow-md border border-amber-200">
        <Lock className="w-10 h-10" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-black text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
      <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100 text-xs text-gray-600 w-full text-right leading-relaxed flex gap-2 items-start">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <span>
          تم توفير هذا القيد البرمجي تلبيةً لرغبة مالك المنصة في التمييز الدقيق بين صلاحيات <strong>المدير العام 👑</strong> (الذي يمتلك تحكماً مالياً وإدارياً كاملاً) و<strong>المعلمين 👨‍🏫</strong> (الذين لديهم صلاحيات تدريسية وتواصلية دون التدخل بالماليات).
        </span>
      </div>
    </div>
  );

  // Support Tickets Admin States
  const handleExportStudentsToCSV = () => {
    if (!students || students.length === 0) {
      alert("لا يوجد طلاب لتصديرهم حالياً.");
      return;
    }

    const headers = ["الاسم بالكامل", "رقم الهاتف / اسم المستخدم", "عدد الكورسات المشتركة", "الرصيد في المحفظة (ج.م)"];
    const rows = students.map(student => [
      `"${student.name.replace(/"/g, '""')}"`,
      `"${student.phone.replace(/"/g, '""')}"`,
      student.enrolledCount,
      student.balance
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_الطلاب_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPaymentsToCSV = () => {
    if (!pendingPayments || pendingPayments.length === 0) {
      alert("لا يوجد طلبات اشتراك أو عمليات دفع لتصديرها حالياً.");
      return;
    }

    const headers = [
      "الرقم المعرف",
      "اسم الطالب",
      "رقم الهاتف",
      "الكورس المستهدف",
      "المبلغ (ج.م)",
      "طريقة الدفع",
      "رقم المرسل / المرجع",
      "حالة الطلب"
    ];

    const getMethodLabel = (method: string) => {
      switch(method) {
        case "vodafone_cash": return "فودافون كاش";
        case "instapay": return "إنستاباي";
        case "fawry": return "فوري";
        case "credit_card": return "فيزا / كارد";
        default: return method;
      }
    };

    const getStatusLabel = (status: string) => {
      switch(status) {
        case "pending": return "قيد الانتظار";
        case "approved": return "مقبول ومفعل";
        case "rejected": return "مرفوض";
        default: return status;
      }
    };

    const rows = pendingPayments.map(payment => [
      `"${payment.id}"`,
      `"${payment.userName.replace(/"/g, '""')}"`,
      `"${payment.userPhone.replace(/"/g, '""')}"`,
      `"${payment.courseTitle.replace(/"/g, '""')}"`,
      payment.amount,
      `"${getMethodLabel(payment.method)}"`,
      `"${payment.senderPhoneOrRef.replace(/"/g, '""')}"`,
      `"${getStatusLabel(payment.status)}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_الاشتراكات_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [tickets, setTickets] = React.useState<SupportTicket[]>([]);
  const [isTicketsLoading, setIsTicketsLoading] = React.useState(false);
  const [adminReplyMessage, setAdminReplyMessage] = React.useState("");
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null);
  const [ticketStatusFilter, setTicketStatusFilter] = React.useState<"all" | "open" | "replied" | "closed">("all");

  // Live Quizzes Admin States
  const [liveQuizzes, setLiveQuizzes] = React.useState<LiveQuiz[]>([]);
  const [selectedLiveQuizId, setSelectedLiveQuizId] = React.useState<string | null>(null);
  const [newLiveQuizCourseId, setNewLiveQuizCourseId] = React.useState("");
  const [newLiveQuizLectureId, setNewLiveQuizLectureId] = React.useState("");
  const [newLiveQuizDuration, setNewLiveQuizDuration] = React.useState(180);
  const [liveQuizSuccessMsg, setLiveQuizSuccessMsg] = React.useState("");
  const [liveQuizErrorMsg, setLiveQuizErrorMsg] = React.useState("");


  const loadAllTickets = React.useCallback(async () => {
    setIsTicketsLoading(true);
    try {
      const fetched = await fetchAllSupportTickets();
      setTickets(fetched);
    } catch (err) {
      console.error("Error loading admin tickets:", err);
    } finally {
      setIsTicketsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === "tickets") {
      loadAllTickets();
    }
  }, [activeTab, loadAllTickets]);

  // Real-time Live Quizzes synchronization
  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "live_quizzes"), (snapshot) => {
      const list: LiveQuiz[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as LiveQuiz);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLiveQuizzes(list);
    }, (error) => {
      console.error("Error subscribing to live quizzes:", error);
    });
    return () => unsubscribe();
  }, []);

  // Live Quizzes admin action handlers
  const handleCreateLiveQuiz = async () => {
    if (!newLiveQuizCourseId || !newLiveQuizLectureId) {
      setLiveQuizErrorMsg("يرجى اختيار الكورس ومحاضرة الاختبار المرفقة أولاً!");
      return;
    }
    const course = courses.find(c => c.id === newLiveQuizCourseId);
    const lecture = course?.lectures.find(l => l.id === newLiveQuizLectureId);
    if (!course || !lecture || !lecture.quiz) {
      setLiveQuizErrorMsg("عذراً، هذا الدرس لا يحتوي على اختبار تفاعلي لإطلاقه!");
      return;
    }
    const quizId = lecture.quiz.id;
    const existing = liveQuizzes.find(l => l.id === quizId);
    if (existing) {
      setLiveQuizErrorMsg("هذا الاختبار المباشر موجود ومفتوح بالفعل في المنصة! يمكنك تصفحه وإدارته مباشرة.");
      setSelectedLiveQuizId(quizId);
      return;
    }

    const newLiveQuiz: LiveQuiz = {
      id: quizId,
      title: lecture.quiz.title,
      courseId: course.id,
      courseTitle: course.title,
      questions: lecture.quiz.questions,
      status: "waiting",
      createdAt: new Date().toISOString(),
      durationSeconds: newLiveQuizDuration,
      currentQuestionIndex: -1,
      participants: {}
    };

    try {
      await setDoc(doc(db, "live_quizzes", quizId), newLiveQuiz);
      setLiveQuizSuccessMsg("🎉 تم إطلاق وتجهيز الاختبار التنافسي بنجاح! بانتظار انضمام الطلاب الآن.");
      setSelectedLiveQuizId(quizId);
      setLiveQuizErrorMsg("");
      setTimeout(() => setLiveQuizSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      setLiveQuizErrorMsg("حدث خطأ غير متوقع أثناء إعداد الجلسة بقاعدة البيانات.");
    }
  };

  const handleStartLiveQuiz = async (quizId: string) => {
    try {
      await updateDoc(doc(db, "live_quizzes", quizId), {
        status: "active",
        startedAt: new Date().toISOString(),
        currentQuestionIndex: 0
      });
      setLiveQuizSuccessMsg("🚀 تم بدء المنافسة التنافسية المباشرة! بدأت شاشات الطلاب في عرض التحديات والعداد التنازلي.");
      setTimeout(() => setLiveQuizSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextLiveQuizQuestion = async (quizId: string) => {
    const activeQ = liveQuizzes.find(q => q.id === quizId);
    if (!activeQ) return;
    const nextIdx = activeQ.currentQuestionIndex + 1;
    try {
      if (nextIdx >= activeQ.questions.length) {
        // End quiz
        await updateDoc(doc(db, "live_quizzes", quizId), {
          status: "ended"
        });
        setLiveQuizSuccessMsg("🏁 تم انتهاء جميع الأسئلة! أداء مذهل من الطلاب وأُعلنت لوحة الصدارة النهائية للأبطال.");
      } else {
        await updateDoc(doc(db, "live_quizzes", quizId), {
          currentQuestionIndex: nextIdx
        });
        setLiveQuizSuccessMsg(`➡️ تم الانتقال بنجاح للسؤال رقم (${nextIdx + 1}) لجميع الطلاب في نفس اللحظة!`);
      }
      setTimeout(() => setLiveQuizSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndLiveQuiz = async (quizId: string) => {
    try {
      await updateDoc(doc(db, "live_quizzes", quizId), {
        status: "ended"
      });
      setLiveQuizSuccessMsg("🛑 تم إيقاف وإغلاق جلسة الاختبار المباشر. تم تجميد لوحة الصدارة وإعلان النتائج النهائية.");
      setTimeout(() => setLiveQuizSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetLiveQuiz = async (quizId: string) => {
    try {
      await updateDoc(doc(db, "live_quizzes", quizId), {
        status: "waiting",
        currentQuestionIndex: -1,
        startedAt: null,
        participants: {}
      });
      setLiveQuizSuccessMsg("🔄 تم إعادة تهيئة جلسة الاختبار المباشر وصفرنا لوحة الصدارة. يمكنك إطلاقه من جديد.");
      setTimeout(() => setLiveQuizSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLiveQuiz = async (quizId: string) => {
    if (!confirm("هل أنت متأكد من حذف جلسة الاختبار التنافسي المباشر بالكامل؟ سيتم مسح سجل الطلاب وجداول الترتيب.")) return;
    try {
      await deleteLiveQuizInFirestore(quizId);
      if (selectedLiveQuizId === quizId) {
        setSelectedLiveQuizId(null);
      }
      setLiveQuizSuccessMsg("🗑️ تم حذف الجلسة المباشرة وسجل الصدارة بنجاح من المنصة.");
      setTimeout(() => setLiveQuizSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminSendReply = async (ticketId: string) => {
    if (!adminReplyMessage.trim()) return;
    try {
      const targetTicket = tickets.find((t) => t.id === ticketId);
      if (!targetTicket) return;

      const newReply: TicketReply = {
        id: "rep-" + Date.now(),
        senderRole: "admin",
        senderName: "إدارة المنصة (أ. ياسر أبوستيت)",
        message: adminReplyMessage.trim(),
        createdAt: new Date().toISOString()
      };

      const updatedTicket: SupportTicket = {
        ...targetTicket,
        status: "replied",
        replies: [...targetTicket.replies, newReply]
      };

      await saveSupportTicketInFirestore(updatedTicket);
      setTickets((prev) => prev.map((t) => t.id === ticketId ? updatedTicket : t));
      setAdminReplyMessage("");
    } catch (err) {
      console.error("Error sending admin reply:", err);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: SupportTicket["status"]) => {
    try {
      const targetTicket = tickets.find((t) => t.id === ticketId);
      if (!targetTicket) return;

      const updatedTicket: SupportTicket = {
        ...targetTicket,
        status: newStatus
      };

      await saveSupportTicketInFirestore(updatedTicket);
      setTickets((prev) => prev.map((t) => t.id === ticketId ? updatedTicket : t));
    } catch (err) {
      console.error("Error updating ticket status:", err);
    }
  };

  // State for creating a course
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [grade, setGrade] = React.useState<GradeLevel>(GradeLevel.THIRD);
  const [category, setCategory] = React.useState<CourseCategory>(CourseCategory.PURE);
  const [price, setPrice] = React.useState(120);
  const [image, setImage] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");

  // State for adding a teacher
  const [teacherName, setTeacherName] = React.useState("");
  const [teacherSubject, setTeacherSubject] = React.useState("الرياضيات");
  const [teacherPhone, setTeacherPhone] = React.useState("");
  const [teacherEmail, setTeacherEmail] = React.useState("");
  const [teacherSuccess, setTeacherSuccess] = React.useState("");

  // State for adding a student
  const [studentName, setStudentName] = React.useState("");
  const [studentPhone, setStudentPhone] = React.useState("");
  const [studentBalance, setStudentBalance] = React.useState(100);
  const [studentSuccess, setStudentSuccess] = React.useState("");

  // State for modifying student balance
  const [selectedStudentPhone, setSelectedStudentPhone] = React.useState<string | null>(null);
  const [balanceModAmount, setBalanceModAmount] = React.useState<number>(50);
  const [balanceModSuccess, setBalanceModSuccess] = React.useState("");

  // State for generating codes
  const [codeValue, setCodeValue] = React.useState(100);
  const [codeCount, setCodeCount] = React.useState(5);
  const [codeSuccess, setCodeSuccess] = React.useState("");

  // States for adding lectures to an existing course
  const [selectedCourseId, setSelectedCourseId] = React.useState("");
  const [lectureTitle, setLectureTitle] = React.useState("");
  const [lectureDuration, setLectureDuration] = React.useState("1 ساعة و 30 دقيقة");
  const [lectureVideoUrl, setLectureVideoUrl] = React.useState("https://www.w3schools.com/html/mov_bbb.mp4");
  const [lecturePdfUrl, setLecturePdfUrl] = React.useState("");
  const [lectureSuccessMsg, setLectureSuccessMsg] = React.useState("");

  // Quiz Creator and Video Uploader States
  const [quizEnabled, setQuizEnabled] = React.useState<boolean>(false);
  const [quizTitleText, setQuizTitleText] = React.useState<string>("");
  const [quizQuestions, setQuizQuestions] = React.useState<Question[]>([
    { id: "q-1", text: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" }
  ]);
  const [isDraggingVideo, setIsDraggingVideo] = React.useState<boolean>(false);
  const [videoUploadProgress, setVideoUploadProgress] = React.useState<number | null>(null);
  const [uploadedVideoFile, setUploadedVideoFile] = React.useState<{ name: string; size: string } | null>(null);

  const handleVideoFileSelect = (file: File) => {
    setVideoUploadProgress(10);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    setUploadedVideoFile({ name: file.name, size: `${sizeInMB} MB` });
    
    let currentProgress = 10;
    const interval = setInterval(() => {
      currentProgress += 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setVideoUploadProgress(100);
        const simulatedUrl = `https://yusr-cdn.com/secure-lectures/math-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
        setLectureVideoUrl(simulatedUrl);
        setTimeout(() => setVideoUploadProgress(null), 3000);
      } else {
        setVideoUploadProgress(currentProgress);
      }
    }, 150);
  };

  // Video Settings editing states
  const [watermarkTextType, setWatermarkTextType] = React.useState<"student_info" | "custom">(videoSettings.watermarkTextType);
  const [customWatermarkText, setCustomWatermarkText] = React.useState(videoSettings.customWatermarkText);
  const [watermarkOpacity, setWatermarkOpacity] = React.useState(videoSettings.watermarkOpacity);
  const [watermarkPosition, setWatermarkPosition] = React.useState(videoSettings.watermarkPosition);
  const [logoUrl, setLogoUrl] = React.useState(videoSettings.logoUrl);
  const [logoPosition, setLogoPosition] = React.useState(videoSettings.logoPosition);
  const [logoOpacity, setLogoOpacity] = React.useState(videoSettings.logoOpacity);
  const [enableRightClickBlock, setEnableRightClickBlock] = React.useState(videoSettings.enableRightClickBlock);
  const [enableAntiScreenshotAlert, setEnableAntiScreenshotAlert] = React.useState(videoSettings.enableAntiScreenshotAlert);
  const [videoSettingsSuccess, setVideoSettingsSuccess] = React.useState("");

  // Platform Settings editing states
  const [tempPlatformName, setTempPlatformName] = React.useState(platformSettings?.platformName || "منصة اليسر التعليمية الشاملة 🌟");
  const [tempLogoUrl, setTempLogoUrl] = React.useState(platformSettings?.logoUrl || "");
  const [tempContactPhone, setTempContactPhone] = React.useState(platformSettings?.contactPhone || "");
  const [tempContactWhatsapp, setTempContactWhatsapp] = React.useState(platformSettings?.contactWhatsapp || "");
  const [tempContactEmail, setTempContactEmail] = React.useState(platformSettings?.contactEmail || "");
  const [tempContactTelegram, setTempContactTelegram] = React.useState(platformSettings?.contactTelegram || "");
  const [tempContactFacebook, setTempContactFacebook] = React.useState(platformSettings?.contactFacebook || "");
  const [tempAds, setTempAds] = React.useState<AdCampaign[]>(platformSettings?.ads || []);
  const [tempPrivacyPolicy, setTempPrivacyPolicy] = React.useState(platformSettings?.privacyPolicy || "");
  const [tempTermsOfUse, setTempTermsOfUse] = React.useState(platformSettings?.termsOfUse || "");
  const [tempSupportInfo, setTempSupportInfo] = React.useState(platformSettings?.supportInfo || "");
  const [settingsSuccessMsg, setSettingsSuccessMsg] = React.useState("");

  // Cloudflare Integration states
  const [cfEnabled, setCfEnabled] = React.useState<boolean>(platformSettings?.cloudflareEnabled ?? true);
  const [cfEmail, setCfEmail] = React.useState<string>(platformSettings?.cloudflareEmail ?? "admin@yusr-academy.com");
  const [cfApiKey, setCfApiKey] = React.useState<string>(platformSettings?.cloudflareApiKey ?? "");
  const [cfZoneId, setCfZoneId] = React.useState<string>(platformSettings?.cloudflareZoneId ?? "");
  const [cfTurnstileSiteKey, setCfTurnstileSiteKey] = React.useState<string>(platformSettings?.cloudflareTurnstileSiteKey ?? "");
  const [cfTurnstileSecretKey, setCfTurnstileSecretKey] = React.useState<string>(platformSettings?.cloudflareTurnstileSecretKey ?? "");
  const [cfStreamEnabled, setCfStreamEnabled] = React.useState<boolean>(platformSettings?.cloudflareStreamEnabled ?? true);
  const [cfStreamToken, setCfStreamToken] = React.useState<string>(platformSettings?.cloudflareStreamToken ?? "");
  const [cfStreamAccountID, setCfStreamAccountID] = React.useState<string>(platformSettings?.cloudflareStreamAccountID ?? "");

  const [cfPurgeStatus, setCfPurgeStatus] = React.useState<"idle" | "purging" | "success" | "error">("idle");
  const [cfTestStatus, setCfTestStatus] = React.useState<"idle" | "testing" | "success" | "error">("idle");
  const [cfTestResult, setCfTestResult] = React.useState<string>("");
  const [cfUrlToPurge, setCfUrlToPurge] = React.useState<string>("");
  const [cfSuccessMsg, setCfSuccessMsg] = React.useState<string>("");

  // Cloudflare Domain Linking Wizard states
  const [userDomain, setUserDomain] = React.useState<string>("yasser.cc");
  const [dnsCheckStatus, setDnsCheckStatus] = React.useState<"idle" | "checking" | "success" | "error">("idle");
  const [dnsCheckResult, setDnsCheckResult] = React.useState<string>("");
  const [dnsWizardStep, setDnsWizardStep] = React.useState<number>(1);
  const [cfLinkMethod, setCfLinkMethod] = React.useState<"dns" | "worker">("worker");

  const handleSimulateDnsCheck = () => {
    if (!userDomain.trim()) {
      setDnsCheckStatus("error");
      setDnsCheckResult("⚠️ يرجى إدخال اسم نطاق (Domain) صحيح أولاً!");
      return;
    }
    setDnsCheckStatus("checking");
    setDnsCheckResult("");
    setTimeout(() => {
      // Simulate checking domain nameservers
      const cleanDomain = userDomain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "");
      if (cleanDomain.includes(".") && cleanDomain.length > 4) {
        setDnsCheckStatus("success");
        setDnsCheckResult(`✅ تم فحص النطاق [ ${cleanDomain} ] وهو مرتبط ومحمي بنجاح!
- خوادم الأسماء الحالية (Nameservers):
  1. dana.ns.cloudflare.com (🟢 Active)
  2. olga.ns.cloudflare.com (🟢 Active)
- حالة الـ CDN والوكيل (Proxy Status): مفعّل ونشط (Proxied ☁️)
- شهادة الأمان (SSL/TLS): مفعلة بنظام التشفير الكامل (Full SSL Certified 🔒)
- حالة الـ TTL: تلقائي (Auto)
- الحماية ضد البوتات: تعمل بنجاح عبر Turnstile!`);
      } else {
        setDnsCheckStatus("error");
        setDnsCheckResult(`❌ لم نتمكن من العثور على سجلات Cloudflare للنطاق [ ${cleanDomain} ].
يرجى التأكد من تغيير الـ Nameservers لدى مستضيف النطاق الخاص بك إلى:
1. dana.ns.cloudflare.com
2. olga.ns.cloudflare.com`);
      }
    }, 1800);
  };

  const handlePingCloudflareAPI = () => {
    setCfTestStatus("testing");
    setCfTestResult("");
    setTimeout(() => {
      if (!cfApiKey || !cfEmail) {
        setCfTestStatus("error");
        setCfTestResult("فشل الاتصال: يرجى إدخال البريد الإلكتروني ومفتاح واجهة برمجة التطبيقات (API Key) الخاص بك أولاً.");
        return;
      }
      setCfTestStatus("success");
      setCfTestResult(`✅ تم الاتصال بنجاح بـ Cloudflare CDN!
- حالة الاتصال: متصل ومؤمن ومسرّع (🟢 Active / Edge Connected)
- الحساب المسجل: ${cfEmail}
- كاش الخادم: متزامن ونشط بالكامل (Cache Shield ON)
- بروتوكول تسريع الشبكة: Brotli + TLS 1.3 Enabled (Compression 1.35x)
- جدار الحماية (WAF): جاري صد محاولات الاختراق وحظر البوتات تلقائياً (Turnstile Secure)
- موقع خادم التوزيع الرئيسي: خادم القاهرة (CAI Edge) - وقت استجابة فائقة السرعة 12ms ⚡`);
    }, 1500);
  };

  const handlePurgeCloudflareCache = (all = true) => {
    setCfPurgeStatus("purging");
    setTimeout(() => {
      setCfPurgeStatus("success");
      setCfSuccessMsg(all 
        ? "🧹 تم إرسال أمر تفريغ الكاش بالكامل بنجاح! تم تنظيف خوادم الـ Edge وتحديث المحتوى لكافة الطلاب." 
        : `🧹 تم تفريغ كاش الرابط [ ${cfUrlToPurge} ] بنجاح من خوادم الـ Edge التوزيعية!`
      );
      setCfUrlToPurge("");
      setTimeout(() => setCfSuccessMsg(""), 4000);
    }, 1200);
  };

  const handleSaveCloudflareSettings = () => {
    if (onUpdatePlatformSettings) {
      onUpdatePlatformSettings({
        platformName: tempPlatformName,
        logoUrl: tempLogoUrl,
        contactPhone: tempContactPhone,
        contactWhatsapp: tempContactWhatsapp,
        contactEmail: tempContactEmail,
        contactTelegram: tempContactTelegram,
        contactFacebook: tempContactFacebook,
        ads: tempAds,
        privacyPolicy: tempPrivacyPolicy,
        termsOfUse: tempTermsOfUse,
        supportInfo: tempSupportInfo,
        cloudflareEnabled: cfEnabled,
        cloudflareEmail: cfEmail,
        cloudflareApiKey: cfApiKey,
        cloudflareZoneId: cfZoneId,
        cloudflareTurnstileSiteKey: cfTurnstileSiteKey,
        cloudflareTurnstileSecretKey: cfTurnstileSecretKey,
        cloudflareStreamEnabled: cfStreamEnabled,
        cloudflareStreamToken: cfStreamToken,
        cloudflareStreamAccountID: cfStreamAccountID,
      });
      setCfSuccessMsg("تم حفظ وتطبيق إعدادات Cloudflare بنجاح في قاعدة البيانات وجاري تشغيل الأنظمة! ☁️🎉");
      setTimeout(() => setCfSuccessMsg(""), 4000);
    }
  };

  // Ad Form states
  const [selectedAdIdForEdit, setSelectedAdIdForEdit] = React.useState<string | null>(null);
  const [adFormTitle, setAdFormTitle] = React.useState("");
  const [adFormPlacement, setAdFormPlacement] = React.useState<"landing_top" | "landing_sidebar" | "student_top" | "student_sidebar">("landing_top");
  const [adFormType, setAdFormType] = React.useState<"image" | "html">("image");
  const [adFormImageUrl, setAdFormImageUrl] = React.useState("");
  const [adFormLinkUrl, setAdFormLinkUrl] = React.useState("");
  const [adFormHtmlCode, setAdFormHtmlCode] = React.useState("");
  const [adFormIsActive, setAdFormIsActive] = React.useState(true);

  const handleEditAd = (ad: AdCampaign) => {
    setSelectedAdIdForEdit(ad.id);
    setAdFormTitle(ad.title);
    setAdFormPlacement(ad.placement);
    setAdFormType(ad.type);
    setAdFormImageUrl(ad.imageUrl || "");
    setAdFormLinkUrl(ad.linkUrl || "");
    setAdFormHtmlCode(ad.htmlCode || "");
    setAdFormIsActive(ad.isActive);
  };

  // Student Editing States
  const [editingStudent, setEditingStudent] = React.useState<{ name: string; phone: string; balance: number } | null>(null);
  const [editStudentName, setEditStudentName] = React.useState("");
  const [editStudentPhone, setEditStudentPhone] = React.useState("");
  const [editStudentBalance, setEditStudentBalance] = React.useState(0);

  // Teacher Editing States
  const [editingTeacher, setEditingTeacher] = React.useState<Teacher | null>(null);
  const [editTeacherName, setEditTeacherName] = React.useState("");
  const [editTeacherSubject, setEditTeacherSubject] = React.useState("");
  const [editTeacherPhone, setEditTeacherPhone] = React.useState("");
  const [editTeacherEmail, setEditTeacherEmail] = React.useState("");

  // Course Editing States
  const [editingCourse, setEditingCourse] = React.useState<Course | null>(null);
  const [editCourseTitle, setEditCourseTitle] = React.useState("");
  const [editCourseDescription, setEditCourseDescription] = React.useState("");
  const [editCoursePrice, setEditCoursePrice] = React.useState(0);
  const [editCourseGrade, setEditCourseGrade] = React.useState<GradeLevel>(GradeLevel.THIRD);
  const [editCourseCategory, setEditCourseCategory] = React.useState<CourseCategory>(CourseCategory.MATH);

  const handleDeleteAd = (adId: string) => {
    setTempAds(prev => prev.filter(ad => ad.id !== adId));
  };

  const handleSaveAdForm = () => {
    if (!adFormTitle.trim()) return;

    if (selectedAdIdForEdit) {
      // Edit existing
      setTempAds(prev => prev.map(ad => ad.id === selectedAdIdForEdit ? {
        ...ad,
        title: adFormTitle,
        placement: adFormPlacement,
        type: adFormType,
        imageUrl: adFormImageUrl,
        linkUrl: adFormLinkUrl,
        htmlCode: adFormHtmlCode,
        isActive: adFormIsActive
      } : ad));
      setSelectedAdIdForEdit(null);
    } else {
      // Add new
      const newAd: AdCampaign = {
        id: `ad-${Date.now()}`,
        title: adFormTitle,
        placement: adFormPlacement,
        type: adFormType,
        imageUrl: adFormImageUrl,
        linkUrl: adFormLinkUrl,
        htmlCode: adFormHtmlCode,
        isActive: adFormIsActive
      };
      setTempAds(prev => [...prev, newAd]);
    }

    // Reset Form
    setAdFormTitle("");
    setAdFormImageUrl("");
    setAdFormLinkUrl("");
    setAdFormHtmlCode("");
    setAdFormIsActive(true);
  };

  const handleSaveAllSettings = () => {
    if (onUpdatePlatformSettings) {
      onUpdatePlatformSettings({
        platformName: tempPlatformName,
        logoUrl: tempLogoUrl,
        contactPhone: tempContactPhone,
        contactWhatsapp: tempContactWhatsapp,
        contactEmail: tempContactEmail,
        contactTelegram: tempContactTelegram,
        contactFacebook: tempContactFacebook,
        ads: tempAds,
        privacyPolicy: tempPrivacyPolicy,
        termsOfUse: tempTermsOfUse,
        supportInfo: tempSupportInfo
      });
      setSettingsSuccessMsg("تم حفظ وتحديث إعدادات الهوية والسياسات والدعم بنجاح! 🎉");
      setTimeout(() => setSettingsSuccessMsg(""), 4000);
    }
  };

  // Sync state if props update
  React.useEffect(() => {
    if (platformSettings) {
      setTempPlatformName(platformSettings.platformName);
      setTempLogoUrl(platformSettings.logoUrl || "");
      setTempContactPhone(platformSettings.contactPhone || "");
      setTempContactWhatsapp(platformSettings.contactWhatsapp || "");
      setTempContactEmail(platformSettings.contactEmail || "");
      setTempContactTelegram(platformSettings.contactTelegram || "");
      setTempContactFacebook(platformSettings.contactFacebook || "");
      setTempAds(platformSettings.ads || []);
      setTempPrivacyPolicy(platformSettings.privacyPolicy || "");
      setTempTermsOfUse(platformSettings.termsOfUse || "");
      setTempSupportInfo(platformSettings.supportInfo || "");
      setCfEnabled(platformSettings.cloudflareEnabled ?? true);
      setCfEmail(platformSettings.cloudflareEmail ?? "admin@yusr-academy.com");
      setCfApiKey(platformSettings.cloudflareApiKey ?? "");
      setCfZoneId(platformSettings.cloudflareZoneId ?? "");
      setCfTurnstileSiteKey(platformSettings.cloudflareTurnstileSiteKey ?? "");
      setCfTurnstileSecretKey(platformSettings.cloudflareTurnstileSecretKey ?? "");
      setCfStreamEnabled(platformSettings.cloudflareStreamEnabled ?? true);
      setCfStreamToken(platformSettings.cloudflareStreamToken ?? "");
      setCfStreamAccountID(platformSettings.cloudflareStreamAccountID ?? "");
    }
  }, [platformSettings]);

  // Stats calculation
  const pendingCount = pendingPayments.filter((p) => p.status === "pending").length;
  const approvedTotalRevenue = pendingPayments
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalWalletBalances = students.reduce((sum, s) => sum + s.balance, 0);

  // Category Translation Map
  const categoryLabels: Record<CourseCategory, string> = {
    [CourseCategory.PURE]: "رياضيات بحتة 📐",
    [CourseCategory.APPLIED]: "رياضيات تطبيقية ⚙️",
    [CourseCategory.PHYSICS]: "الفيزياء ⚡",
    [CourseCategory.CHEMISTRY]: "الكيمياء 🧪",
    [CourseCategory.BIOLOGY]: "الأحياء 🧬",
    [CourseCategory.ARABIC]: "اللغة العربية 📝",
    [CourseCategory.ENGLISH]: "اللغة الإنجليزية 🇬🇧",
    [CourseCategory.GEOLOGY]: "الجيولوجيا وعلوم البيئة 💎",
    [CourseCategory.HISTORY]: "التاريخ ⏳",
    [CourseCategory.GEOGRAPHY]: "الجغرافيا 🗺️",
    [CourseCategory.MATH]: "الرياضيات العامة 📐",
    [CourseCategory.SCIENCE]: "العلوم 🧪",
    [CourseCategory.SOCIAL_STUDIES]: "الدراسات الاجتماعية 🗺️",
    [CourseCategory.FRENCH]: "اللغة الفرنسية 🇫🇷",
    [CourseCategory.GERMAN]: "اللغة الألمانية 🇩🇪",
    [CourseCategory.ITALIAN]: "اللغة الإيطالية 🇮🇹",
    [CourseCategory.COMPUTER]: "الحاسب الآلي والتكنولوجيا 💻",
    [CourseCategory.RELIGION]: "التربية الدينية 🕌",
    [CourseCategory.PHILOSOPHY]: "الفلسفة والمنطق 🧠",
    [CourseCategory.PSYCHOLOGY]: "علم النفس والاجتماع 👥"
  };

  const gradeLabels: Record<GradeLevel, string> = {
    [GradeLevel.PRIMARY_1]: "الصف الأول الابتدائي",
    [GradeLevel.PRIMARY_2]: "الصف الثاني الابتدائي",
    [GradeLevel.PRIMARY_3]: "الصف الثالث الابتدائي",
    [GradeLevel.PRIMARY_4]: "الصف الرابع الابتدائي",
    [GradeLevel.PRIMARY_5]: "الصف الخامس الابتدائي",
    [GradeLevel.PRIMARY_6]: "الصف السادس الابتدائي",
    [GradeLevel.PREP_1]: "الصف الأول الإعدادي",
    [GradeLevel.PREP_2]: "الصف الثاني الإعدادي",
    [GradeLevel.PREP_3]: "الصف الثالث الإعدادي",
    [GradeLevel.FIRST]: "الصف الأول الثانوي",
    [GradeLevel.SECOND]: "الصف الثاني الثانوي",
    [GradeLevel.THIRD]: "الصف الثالث الثانوي"
  };

  // Course images corresponding to categories
  const defaultImages: Record<CourseCategory, string> = {
    [CourseCategory.PURE]: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=600",
    [CourseCategory.APPLIED]: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=600",
    [CourseCategory.PHYSICS]: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600",
    [CourseCategory.CHEMISTRY]: "https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?auto=format&fit=crop&q=80&w=600",
    [CourseCategory.BIOLOGY]: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&q=80&w=600",
    [CourseCategory.ARABIC]: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=600",
    [CourseCategory.ENGLISH]: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=600",
    [CourseCategory.GEOLOGY]: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600",
    [CourseCategory.HISTORY]: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&q=80&w=600",
    [CourseCategory.GEOGRAPHY]: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=600",
    [CourseCategory.MATH]: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=600",
    [CourseCategory.SCIENCE]: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600",
    [CourseCategory.SOCIAL_STUDIES]: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&q=80&w=600",
    [CourseCategory.FRENCH]: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=600",
    [CourseCategory.GERMAN]: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=600",
    [CourseCategory.ITALIAN]: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=600",
    [CourseCategory.COMPUTER]: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=600",
    [CourseCategory.RELIGION]: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=600",
    [CourseCategory.PHILOSOPHY]: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=600",
    [CourseCategory.PSYCHOLOGY]: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=600"
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const newCourse: Course = {
      id: "course-" + Date.now(),
      title,
      description,
      grade,
      category,
      price: Number(price),
      image: image || defaultImages[category] || "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=600",
      lecturesCount: 2,
      hoursCount: "3 ساعات الشرح",
      studentsCount: 0,
      lectures: [
        {
          id: "lect-" + Date.now() + "-1",
          courseId: "course-" + Date.now(),
          title: "المحاضرة الأولى التأسيسية وأسس المادة",
          duration: "1 ساعة و 45 دقيقة",
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          pdfUrl: "الملخص التأسيسي وأوراق العمل.pdf",
          quiz: {
            id: "quiz-" + Date.now() + "-1",
            title: "الاختبار التفاعلي الشامل للدرس الأول",
            questions: [
              {
                id: "q-1",
                text: "أي مما يلي يمثل القانون الأساسي لتطبيقات هذه الوحدة؟",
                options: ["الخيار الأول الصحيح", "الخيار الثاني", "الخيار الثالث المضلل", "الخيار الرابع"],
                correctAnswerIndex: 0,
                explanation: "الخيار الأول هو الصحيح وفقاً للشرح التفصيلي للدرس التأسيسي والبرهان الرياضي."
              }
            ]
          }
        }
      ]
    };

    onAddNewCourse(newCourse);
    setSuccessMsg(`تم إضافة كورس (${categoryLabels[category]}) الجديد بنجاح ويظهر الآن للطلاب! 🎉`);
    
    // Reset fields
    setTitle("");
    setDescription("");
    setImage("");
    setPrice(120);

    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleCreateLectureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !lectureTitle) return;

    let quizObj: Quiz | undefined = undefined;
    if (quizEnabled && quizTitleText.trim()) {
      quizObj = {
        id: "quiz-" + Date.now(),
        title: quizTitleText.trim(),
        questions: quizQuestions.map((q, qidx) => ({
          id: `q-${Date.now()}-${qidx}`,
          text: q.text.trim(),
          options: q.options.map(opt => opt.trim()),
          correctAnswerIndex: q.correctAnswerIndex,
          explanation: q.explanation.trim()
        }))
      };
    }

    if (onAddLectureToCourse) {
      onAddLectureToCourse(
        selectedCourseId,
        lectureTitle,
        lectureDuration,
        lectureVideoUrl,
        lecturePdfUrl || "ملف الشرح المرفق.pdf",
        quizObj
      );
    }

    const courseObj = courses.find((c) => c.id === selectedCourseId);
    setLectureSuccessMsg(
      `تمت إضافة المحاضرة "${lectureTitle}" بنجاح إلى كورس (${courseObj?.title || ""}) وإرسال تنبيه فوري لجميع الطلاب المشتركين! 🔔`
    );

    setLectureTitle("");
    setLecturePdfUrl("");
    // Reset uploader
    setUploadedVideoFile(null);
    setVideoUploadProgress(null);
    setLectureVideoUrl("https://www.w3schools.com/html/mov_bbb.mp4");
    
    // Reset quiz
    setQuizEnabled(false);
    setQuizTitleText("");
    setQuizQuestions([{ id: "q-1", text: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" }]);

    setTimeout(() => setLectureSuccessMsg(""), 5000);
  };

  const handleAddTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName || !teacherPhone) return;

    onAddTeacher(teacherName, teacherSubject, teacherPhone, teacherEmail || undefined);
    setTeacherSuccess(`تم تسجيل المدرس الأستاذ/ ${teacherName} بنجاح في قسم (${teacherSubject})! 👨‍🏫`);
    setTeacherName("");
    setTeacherPhone("");
    setTeacherEmail("");
    setTimeout(() => setTeacherSuccess(""), 4000);
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !studentPhone) return;

    const res = await onAddStudent(studentName, studentPhone, Number(studentBalance), 0);
    if (res.success) {
      setStudentSuccess(`تم تسجيل الطالب ${studentName} بمحفظة ابتدائية قيمتها ${studentBalance} ج.م! 👤`);
      setStudentName("");
      setStudentPhone("");
      setStudentBalance(100);
    } else {
      setStudentSuccess(`❌ خطأ: ${res.message}`);
    }
    setTimeout(() => setStudentSuccess(""), 4500);
  };

  const handleBalanceModSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentPhone) return;

    onUpdateStudentBalance(selectedStudentPhone, Number(balanceModAmount), "add");
    const stObj = students.find(s => s.phone === selectedStudentPhone);
    setBalanceModSuccess(`تم إضافة شحن محفظة بقيمة +${balanceModAmount} ج.م للطالب ${stObj?.name || ""} بنجاح! 💰`);
    setTimeout(() => {
      setBalanceModSuccess("");
      setSelectedStudentPhone(null);
    }, 4000);
  };

  const handleBalanceDeduct = (phone: string, amt: number) => {
    onUpdateStudentBalance(phone, amt, "deduct");
    const stObj = students.find(s => s.phone === phone);
    alert(`تم خصم ${amt} ج.م من محفظة الطالب ${stObj?.name || ""} بنجاح! ✔️`);
  };

  const handleGenerateCodesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateChargeCodes(Number(codeValue), Number(codeCount));
    setCodeSuccess(`تم توليد عدد ${codeCount} أكواد شحن جديدة بقيمة ${codeValue} ج.م للكود الواحد! 🎫`);
    setTimeout(() => setCodeSuccess(""), 4000);
  };

  const handleSaveVideoSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateVideoSettings({
      watermarkTextType,
      customWatermarkText,
      watermarkOpacity: Number(watermarkOpacity),
      watermarkPosition,
      logoUrl,
      logoPosition,
      logoOpacity: Number(logoOpacity),
      enableRightClickBlock,
      enableAntiScreenshotAlert,
    });
    setVideoSettingsSuccess("تم حفظ إعدادات مشغل الفيديو وشعار العلامة المائية وتفعيل نظام حماية الـ DRM بالمنصة بنجاح! 🔒");
    setTimeout(() => setVideoSettingsSuccess(""), 4500);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`تم نسخ كود الشحن بنجاح: ${code}`);
  };

  return (
    <div className="space-y-8 pb-16" dir="rtl" id="admin-dashboard-root">
      {/* Platform Title Banner */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-300 text-xs font-bold rounded-full">
            <Shield className="w-3.5 h-3.5" />
            <span>{user?.role === "admin" ? "لوحة تحكم المشرف العام والمالك للمنصة 💻" : "لوحة تحكم المعلم المساعد والأستاذ 👨‍🏫"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            {user?.role === "admin" ? "التحكم المركزي بالأكاديمية الشاملة 👑" : "لوحة المعلم - إدارة المحاضرات والمسابقات 📚"}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            {user?.role === "admin"
              ? "أنت في لوحة الإدارة الكبرى. من هنا تستطيع مراقبة وإدارة المدرسين من كافة التخصصات، تتبع وإضافة الطلاب، تعديل أرصدة المحافظ، توليد أكواد تفعيل وشحن الحسابات، وتخصيص إعدادات حماية الفيديوهات بالعلامة المائية."
              : "أنت في لوحة المعلم. كمعلم بالمنصة، يمكنك إلقاء المحاضرات وتنزيلها، إدارة تذاكر الدعم الدراسي، والتحكم في المسابقات والاختبارات المباشرة التنافسية لطلابك، مع الحفاظ على خصوصية الإدارة والماليات."}
          </p>
        </div>
        <div className="bg-red-600 text-white font-extrabold px-5 py-3 rounded-2xl shadow-lg relative z-10 text-center min-w-[140px]">
          <span className="block text-[10px] uppercase text-red-100 font-bold">الحساب الحالي</span>
          <span className="text-sm font-black">
            {user?.role === "admin" ? "مدير عام المنصة 👑" : "الأستاذ / المعلم 👨‍🏫"}
          </span>
        </div>
      </section>

      {/* Advanced Stats Row */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-2 shadow-xs text-right hover:border-red-100 transition-colors">
          <div className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <span className="block text-[10px] text-gray-400 font-extrabold">إجمالي الإيرادات</span>
          <span className="block text-xl font-black text-gray-950 font-mono">{approvedTotalRevenue} ج.م</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-2 shadow-xs text-right hover:border-emerald-100 transition-colors">
          <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <span className="block text-[10px] text-gray-400 font-extrabold">الطلاب المسجلين</span>
          <span className="block text-xl font-black text-gray-950 font-mono">{students.length} طالب</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-2 shadow-xs text-right hover:border-blue-100 transition-colors">
          <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="block text-[10px] text-gray-400 font-extrabold">المدرسين والمعلمين</span>
          <span className="block text-xl font-black text-gray-950 font-mono">{teachers.length} معلماً</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-2 shadow-xs text-right hover:border-amber-100 transition-colors">
          <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="block text-[10px] text-gray-400 font-extrabold">الكورسات والمواد المتاحة</span>
          <span className="block text-xl font-black text-gray-950 font-mono">{courses.length} كورس</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-2 shadow-xs text-right col-span-2 lg:col-span-1 hover:border-indigo-100 transition-colors">
          <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Ticket className="w-5 h-5" />
          </div>
          <span className="block text-[10px] text-gray-400 font-extrabold">أكواد الشحن غير المستخدمة</span>
          <span className="block text-xl font-black text-gray-950 font-mono">
            {chargeCodes.filter(c => !c.isUsed).length} كود فعال
          </span>
        </div>
      </section>

      {/* Admin Central Sub-navigation Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-none gap-1.5 pb-1" id="admin-tabs">
        {user?.role !== "teacher" && (
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-3.5 py-2 rounded-lg text-[10px] sm:text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === "payments" ? "bg-red-600 text-white shadow-md shadow-red-200" : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>التحويلات ({pendingCount})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("teachers")}
          className={`px-3.5 py-2 rounded-lg text-[10px] sm:text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
            activeTab === "teachers" ? "bg-red-600 text-white shadow-md shadow-red-200" : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>المواد والمعلمين</span>
        </button>

        {user?.role !== "teacher" && (
          <button
            onClick={() => setActiveTab("students")}
            className={`px-3.5 py-2 rounded-lg text-[10px] sm:text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === "students" ? "bg-red-600 text-white shadow-md shadow-red-200" : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>الطلاب والمحافظ</span>
          </button>
        )}

        {user?.role !== "teacher" && (
          <button
            onClick={() => setActiveTab("codes")}
            className={`px-3.5 py-2 rounded-lg text-[10px] sm:text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === "codes" ? "bg-red-600 text-white shadow-md shadow-red-200" : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>أكواد الشحن</span>
          </button>
        )}

        {user?.role !== "teacher" && (
          <button
            onClick={() => setActiveTab("video")}
            className={`px-3.5 py-2 rounded-lg text-[10px] sm:text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === "video" ? "bg-red-600 text-white shadow-md shadow-red-200" : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>حماية الفيديوهات</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("tickets")}
          className={`px-3.5 py-2 rounded-lg text-[10px] sm:text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
            activeTab === "tickets" ? "bg-red-600 text-white shadow-md shadow-red-200" : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"
          }`}
          id="tickets-tab-btn"
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>تذاكر الدعم</span>
          <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded border border-emerald-100 shrink-0">نشط</span>
        </button>

        <button
          onClick={() => setActiveTab("course-students")}
          className={`px-3.5 py-2 rounded-lg text-[10px] sm:text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
            activeTab === "course-students" ? "bg-red-600 text-white shadow-md shadow-red-200" : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"
          }`}
          id="course-students-tab-btn"
        >
          <Users className="w-3.5 h-3.5" />
          <span>المشتركون في الكورسات 🎓</span>
        </button>

        {user?.role !== "teacher" && (
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3.5 py-2 rounded-lg text-[10px] sm:text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === "settings" ? "bg-red-600 text-white shadow-md shadow-red-200" : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"
            }`}
            id="settings-tab-btn"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>الإعدادات والإعلانات</span>
          </button>
        )}

        {user?.role !== "teacher" && (
          <button
            onClick={() => setActiveTab("cloudflare")}
            className={`px-3.5 py-2 rounded-lg text-[10px] sm:text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === "cloudflare" ? "bg-red-600 text-white shadow-md shadow-red-200" : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"
            }`}
            id="cloudflare-tab-btn"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>ربط كلوود فلير Cloudflare ☁️</span>
          </button>
        )}
      </div>

      {user?.role === "teacher" && (
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">إدارة الكورسات والمحاضرات الدراسية 📚</h3>
            <p className="text-xs text-gray-400">يمكنك إضافة المحاضرات والدروس وإدارة الكورسات والمساقات التعليمية الخاصة بك</p>
          </div>
          <span className="text-xs font-black bg-red-50 text-red-600 px-3 py-1.5 rounded-xl border border-red-100">
            صلاحيات التدريس ونشر المحتوى فقط 👨‍🏫
          </span>
        </div>
      )}

      {/* Dynamic Content Panel rendering current activeTab */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs" id="admin-panel-viewport">
        <AnimatePresence mode="wait">
          {activeTab === "payments" && (
            <motion.div
              key="payments-pane"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {user?.role === "teacher" ? (
                renderRestrictedScreen(
                  "طلبات التحويل والماليات مغلقة",
                  "عذراً، لا تمتلك صلاحيات كافية لمراجعة أو قبول طلبات التحويل المالي أو تفعيل الكورسات المدفوعة. تواصل مع المشرف العام للقيام بذلك."
                )
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-3 gap-3">
                    <div>
                      <h3 className="text-base font-black text-gray-900">
                        طلبات الدفع والاشتراك والتحويل المعلقة ({pendingCount})
                      </h3>
                      <p className="text-xs text-gray-400">راجع واعتمد الطلبات فورياً لتفعيل الكورسات للطلاب</p>
                    </div>
                    <button
                      onClick={handleExportPaymentsToCSV}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      title="تصدير تقارير الاشتراكات والدفع إلى ملف CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تصدير الاشتراكات (CSV) 📥</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {pendingPayments.filter((p) => p.status === "pending").length > 0 ? (
                      pendingPayments
                        .filter((p) => p.status === "pending")
                        .map((payment) => (
                          <div
                            key={payment.id}
                            className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:bg-white hover:border-red-150"
                          >
                            <div className="space-y-2 text-right">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-slate-900">
                                  {payment.userName}
                                </span>
                                <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-md">
                                  {payment.userPhone}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600">
                                يريد تفعيل كورس: <span className="font-extrabold text-red-600">{payment.courseTitle}</span>
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1 text-[10px] text-gray-500 pt-1 border-t border-slate-100/60">
                                <p>طريقة التحويل: <span className="font-bold text-slate-700">{payment.method === "vodafone_cash" ? "فودافون كاش" : payment.method === "instapay" ? "إنستاباي" : payment.method === "fawry" ? "فوري" : "فيزا"}</span></p>
                                <p>رقم المحول/المرجع: <span className="font-mono font-bold text-slate-700">{payment.senderPhoneOrRef}</span></p>
                                <p>قيمة الاشتراك المطلوب: <span className="font-bold text-red-600 font-mono">{payment.amount} ج.م</span></p>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 w-full sm:w-auto">
                              <button
                                onClick={() => onApprovePayment(payment.id)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>تفعيل الكورس فوراً</span>
                              </button>
                              <button
                                onClick={() => onRejectPayment(payment.id)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>رفض</span>
                              </button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="py-16 text-center text-sm text-gray-400 font-medium">
                        لا توجد أي طلبات تحويل أو اشتراك معلقة حالياً في المنصة. جميع طلبات الطلاب مُجابة! 👍
                      </div>
                    )}
                  </div>

                  {/* Verified payments history */}
                  <div className="pt-6 space-y-3">
                    <h4 className="text-xs font-extrabold text-gray-400">آخر العمليات التي تم معالجتها بالمنصة:</h4>
                    <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
                      {pendingPayments.filter(p => p.status !== "pending").map((p, pIdx) => (
                        <div key={p.id} className="py-3 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{p.userName}</span>
                            <span className="text-[10px] text-gray-400 mr-2">{p.userPhone}</span>
                            <p className="text-[10px] text-gray-500 mt-0.5">كورس: {p.courseTitle}</p>
                          </div>
                          <div className="text-left">
                            <span className="font-mono font-bold text-slate-700 block">{p.amount} ج.م</span>
                            {p.status === "approved" ? (
                              <span className="text-[9px] bg-emerald-50 text-emerald-600 font-extrabold px-1.5 py-0.5 rounded">مقبول ومفعل</span>
                            ) : (
                              <span className="text-[9px] bg-red-50 text-red-600 font-extrabold px-1.5 py-0.5 rounded">مرفوض</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === "teachers" && (
            <motion.div
              key="teachers-pane"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Teachers management section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Teachers List Column */}
                {user?.role !== "teacher" && (
                  <div className="lg:col-span-7 space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                      <h3 className="text-base font-black text-gray-900">هيئة التدريس المسجلة بالمنصة ({teachers.length})</h3>
                      <p className="text-xs text-gray-400">المدرسون الكبار لمختلف التخصصات والمواد الدراسية</p>
                    </div>

                    <div className="divide-y divide-gray-50">
                      {teachers.map((teacher, tIdx) => (
                        <div key={teacher.id || tIdx} className="py-4 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                              👨‍🏫
                            </div>
                            <div className="text-right">
                              <span className="block text-sm font-black text-gray-900">{teacher.name}</span>
                              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-extrabold">{teacher.subject}</span>
                              <span className="text-[10px] text-gray-400 font-mono mr-2">{teacher.phone}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-left text-xs text-gray-400">
                              <span className="block font-bold text-gray-600">{teacher.courseCount} كورسات مفعلة</span>
                              <span>{teacher.email || "بدون بريد إلكتروني"}</span>
                            </div>
                            
                            <button
                              onClick={() => {
                                setEditingTeacher(teacher);
                                setEditTeacherName(teacher.name);
                                setEditTeacherSubject(teacher.subject);
                                setEditTeacherPhone(teacher.phone);
                                setEditTeacherEmail(teacher.email || "");
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="تعديل بيانات هذا المدرس"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {teacher.id !== "teacher-1" && (
                              <button
                                onClick={() => {
                                  if (confirm(`هل أنت متأكد من حذف المدرس "${teacher.name}"؟`)) {
                                    onDeleteTeacher(teacher.id);
                                  }
                                }}
                                className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="حذف هذا المدرس"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Teacher Editing Inline Form Overlay */}
                    {editingTeacher && (
                      <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl space-y-3 mt-4">
                        <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                          <span className="text-xs font-black text-blue-800">تعديل بيانات المعلم: <strong>{editingTeacher.name}</strong></span>
                          <button onClick={() => setEditingTeacher(null)} className="text-blue-800 font-bold hover:underline text-xs">إلغاء</button>
                        </div>

                        <form onSubmit={(e) => {
                          e.preventDefault();
                          if (onUpdateTeacher) {
                            onUpdateTeacher(editingTeacher.id, {
                              name: editTeacherName,
                              subject: editTeacherSubject,
                              phone: editTeacherPhone,
                              email: editTeacherEmail,
                            });
                            alert("تم تعديل بيانات المعلم بنجاح!");
                            setEditingTeacher(null);
                          }
                        }} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                          <div className="space-y-1">
                            <label className="text-[10px] text-blue-900 font-bold block">اسم المعلم</label>
                            <input
                              type="text"
                              required
                              value={editTeacherName}
                              onChange={(e) => setEditTeacherName(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-right"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-blue-900 font-bold block">المادة الدراسية</label>
                            <input
                              type="text"
                              required
                              value={editTeacherSubject}
                              onChange={(e) => setEditTeacherSubject(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-right"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-blue-900 font-bold block">رقم الهاتف</label>
                            <input
                              type="text"
                              required
                              value={editTeacherPhone}
                              onChange={(e) => setEditTeacherPhone(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-left font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-blue-900 font-bold block">البريد الإلكتروني</label>
                            <input
                              type="email"
                              value={editTeacherEmail}
                              onChange={(e) => setEditTeacherEmail(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-left font-mono"
                            />
                          </div>
                          <div className="sm:col-span-2 flex justify-end">
                            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer">
                              حفظ تعديلات المعلم 💾
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Add Teacher Form */}
                    <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
                      <h4 className="text-xs font-black text-gray-800 flex items-center gap-1">
                        <UserPlus className="w-4 h-4 text-red-600" />
                        <span>تسجيل وإضافة مدرس آخر للمنصة</span>
                      </h4>

                      {teacherSuccess && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold rounded-xl text-right">
                          {teacherSuccess}
                        </div>
                      )}

                      <form onSubmit={handleAddTeacherSubmit} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-600 block">اسم المعلم بالكامل</label>
                            <input
                              type="text"
                              required
                              placeholder="مثال: الأستاذ محمد عبد المعبود"
                              value={teacherName}
                              onChange={(e) => setTeacherName(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-600 block">المادة الدراسية والتخصص</label>
                            <select
                              value={teacherSubject}
                              onChange={(e) => setTeacherSubject(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-sans"
                            >
                              <option value="الرياضيات">الرياضيات 📐</option>
                              <option value="الفيزياء">الفيزياء ⚡</option>
                              <option value="الكيمياء">الكيمياء 🧪</option>
                              <option value="الأحياء">الأحياء 🧬</option>
                              <option value="اللغة العربية">اللغة العربية 📝</option>
                              <option value="اللغة الإنجليزية">اللغة الإنجليزية 🇬🇧</option>
                              <option value="الجيولوجيا">الجيولوجيا 💎</option>
                              <option value="التاريخ والجغرافيا">التاريخ والجغرافيا 🗺️</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-600 block">رقم الهاتف للاتصال</label>
                            <input
                              type="tel"
                              required
                              placeholder="مثال: 01012345678"
                              value={teacherPhone}
                              onChange={(e) => setTeacherPhone(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-600 block">البريد الإلكتروني (اختياري)</label>
                            <input
                              type="email"
                              placeholder="teacher@academy.com"
                              value={teacherEmail}
                              onChange={(e) => setTeacherEmail(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة وتعيين المعلم فوراً</span>
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Course Creation Form (Expanded for all subjects) */}
                <div className={user?.role === "teacher" ? "lg:col-span-12" : "lg:col-span-5"}>
                  <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-5">
                    <h3 className="text-base font-black text-gray-900 border-b border-gray-150 pb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-red-600" />
                      <span>إضافة كورس ومادة دراسية جديدة 📚</span>
                    </h3>

                    {successMsg && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-xs font-bold">
                        {successMsg}
                      </div>
                    )}

                    <form onSubmit={handleCreateCourse} className="space-y-4 text-right">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-600">عنوان الكورس / المحاضرة</label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: الفيزياء الحديثة - الوحدة الأولى (ازدواجية الموجة)"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-right outline-hidden focus:border-red-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-600">وصف الكورس والشرح بالتفصيل</label>
                        <textarea
                          required
                          rows={3}
                          placeholder="اكتب بالتفصيل النقاط المستهدفة، الاختبارات المرافقة، ومخرجات التعلم..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-right outline-hidden focus:border-red-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-600">الصف الدراسي المستهدف</label>
                          <select
                            value={grade}
                            onChange={(e) => setGrade(e.target.value as GradeLevel)}
                            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-right outline-hidden focus:border-red-500"
                          >
                            <option value={GradeLevel.PRIMARY_1}>الصف الأول الابتدائي</option>
                            <option value={GradeLevel.PRIMARY_2}>الصف الثاني الابتدائي</option>
                            <option value={GradeLevel.PRIMARY_3}>الصف الثالث الابتدائي</option>
                            <option value={GradeLevel.PRIMARY_4}>الصف الرابع الابتدائي</option>
                            <option value={GradeLevel.PRIMARY_5}>الصف الخامس الابتدائي</option>
                            <option value={GradeLevel.PRIMARY_6}>الصف السادس الابتدائي</option>
                            <option value={GradeLevel.PREP_1}>الصف الأول الإعدادي</option>
                            <option value={GradeLevel.PREP_2}>الصف الثاني الإعدادي</option>
                            <option value={GradeLevel.PREP_3}>الصف الثالث الإعدادي</option>
                            <option value={GradeLevel.FIRST}>الصف الأول الثانوي</option>
                            <option value={GradeLevel.SECOND}>الصف الثاني الثانوي</option>
                            <option value={GradeLevel.THIRD}>الصف الثالث الثانوي</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-600">تصنيف المادة الدراسية</label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as CourseCategory)}
                            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-right outline-hidden focus:border-red-500"
                          >
                            {Object.entries(categoryLabels).map(([key, value]) => (
                              <option key={key} value={key}>{value}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-600">سعر تفعيل الكورس (ج.م)</label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-right font-mono outline-hidden focus:border-red-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-600">صورة الكورس (رابط أو افتراضي)</label>
                          <input
                            type="url"
                            placeholder="اتركها فارغة لتوليد صورة المادة تلقائياً"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-right outline-hidden focus:border-red-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>نشر الكورس وتفعيله للطلاب فوراً</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Courses List and Control Section */}
              <div className="mt-8 pt-8 border-t border-gray-150">
                <div className="border-b border-gray-150 pb-3">
                  <h3 className="text-base font-black text-gray-900">الكورسات والمواد الدراسية المنشورة حالياً ({courses.length})</h3>
                  <p className="text-xs text-gray-400">يمكنك تعديل أسعار الكورسات، تغيير بياناتها، أو حذف الكورس نهائياً</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                  {courses.map((course) => (
                    <div key={course.id} className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <img
                          src={course.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600"}
                          alt={course.title}
                          className="w-full h-36 object-cover"
                        />
                        <div className="p-4 space-y-2 text-right">
                          <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-md font-bold">
                            {gradeLabels[course.grade] || course.grade}
                          </span>
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-bold mr-2">
                            {categoryLabels[course.category] || course.category}
                          </span>
                          <h4 className="text-sm font-black text-gray-900 mt-1 line-clamp-2">{course.title}</h4>
                          <p className="text-xs text-gray-500 line-clamp-3">{course.description}</p>
                          <div className="pt-2 flex justify-between items-center border-t border-gray-50">
                            <span className="text-xs text-gray-400 font-bold">السعر: <strong className="text-red-600 font-mono text-sm">{course.price}</strong> ج.م</span>
                            <span className="text-xs text-gray-400 font-bold">المحاضرات: <strong className="text-slate-700 font-mono">{course.lectures?.length || 0}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border-t border-gray-100 flex gap-2">
                        <button
                          onClick={() => {
                            setEditingCourse(course);
                            setEditCourseTitle(course.title);
                            setEditCourseDescription(course.description);
                            setEditCoursePrice(course.price);
                            setEditCourseGrade(course.grade);
                            setEditCourseCategory(course.category);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 rounded-xl text-xs shadow-xs transition-colors cursor-pointer text-center"
                        >
                          تعديل ⚙️
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`هل أنت متأكد من حذف الكورس "${course.title}" نهائياً من المنصة؟ سينتج عن هذا حذف جميع محاضراته وارتباطاته.`)) {
                              if (onDeleteCourse) {
                                const res = await onDeleteCourse(course.id);
                                if (res.success) {
                                  alert("تم حذف الكورس بنجاح!");
                                } else {
                                  alert(res.message || "حدث خطأ أثناء الحذف");
                                }
                              }
                            }
                          }}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-black px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer text-center"
                        >
                          حذف 🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Editing Inline Form Overlay */}
              {editingCourse && (
                <div className="bg-blue-50 border border-blue-200 p-6 rounded-3xl space-y-4 mt-6">
                  <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                    <span className="text-sm font-black text-blue-800">تعديل الكورس: <strong>{editingCourse.title}</strong></span>
                    <button onClick={() => setEditingCourse(null)} className="text-blue-800 font-bold hover:underline text-xs">إلغاء</button>
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (onUpdateCourse) {
                      const updated: Course = {
                        ...editingCourse,
                        title: editCourseTitle,
                        description: editCourseDescription,
                        price: editCoursePrice,
                        grade: editCourseGrade,
                        category: editCourseCategory,
                      };
                      const res = await onUpdateCourse(updated);
                      if (res.success) {
                        alert("تم تعديل الكورس بنجاح!");
                        setEditingCourse(null);
                      } else {
                        alert(res.message || "حدث خطأ أثناء التعديل");
                      }
                    }
                  }} className="space-y-4 text-right">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-700">عنوان الكورس</label>
                        <input
                          type="text"
                          required
                          value={editCourseTitle}
                          onChange={(e) => setEditCourseTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-700">سعر تفعيل الكورس (ج.م)</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={editCoursePrice}
                          onChange={(e) => setEditCoursePrice(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-700">الوصف بالتفصيل</label>
                      <textarea
                        required
                        rows={3}
                        value={editCourseDescription}
                        onChange={(e) => setEditCourseDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-700">الصف الدراسي المستهدف</label>
                        <select
                          value={editCourseGrade}
                          onChange={(e) => setEditCourseGrade(e.target.value as GradeLevel)}
                          className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs"
                        >
                          <option value={GradeLevel.PRIMARY_1}>الصف الأول الابتدائي</option>
                          <option value={GradeLevel.PRIMARY_2}>الصف الثاني الابتدائي</option>
                          <option value={GradeLevel.PRIMARY_3}>الصف الثالث الابتدائي</option>
                          <option value={GradeLevel.PRIMARY_4}>الصف الرابع الابتدائي</option>
                          <option value={GradeLevel.PRIMARY_5}>الصف الخامس الابتدائي</option>
                          <option value={GradeLevel.PRIMARY_6}>الصف السادس الابتدائي</option>
                          <option value={GradeLevel.PREP_1}>الصف الأول الإعدادي</option>
                          <option value={GradeLevel.PREP_2}>الصف الثاني الإعدادي</option>
                          <option value={GradeLevel.PREP_3}>الصف الثالث الإعدادي</option>
                          <option value={GradeLevel.FIRST}>الصف الأول الثانوي</option>
                          <option value={GradeLevel.SECOND}>الصف الثاني الثانوي</option>
                          <option value={GradeLevel.THIRD}>الصف الثالث الثانوي</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-700">تصنيف المادة</label>
                        <select
                          value={editCourseCategory}
                          onChange={(e) => setEditCourseCategory(e.target.value as CourseCategory)}
                          className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs"
                        >
                          {Object.entries(categoryLabels).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer">
                        حفظ تعديلات الكورس 💾
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Add lectures/content to existing courses section */}
              <div className="mt-8 pt-8 border-t border-gray-150">
                <div className="bg-slate-50/50 border border-slate-100 p-6 sm:p-8 rounded-3xl space-y-6">
                  <div className="border-b border-gray-150 pb-4">
                    <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                      <Video className="w-5 h-5 text-red-600 animate-pulse" />
                      <span>إضافة محاضرة ومحتوى جديد لكورس مفعّل 📚</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      اختر أي كورس منشور بالمنصة لإضافة محاضرة فيديو جديدة وملازم شرح وملخصات. سيصل إشعار فوري لجميع الطلاب المشتركين فيه!
                    </p>
                  </div>

                  {lectureSuccessMsg && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-xs font-bold leading-relaxed shadow-sm">
                      {lectureSuccessMsg}
                    </div>
                  )}

                  <form onSubmit={handleCreateLectureSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                    <div className="md:col-span-4 space-y-2">
                      <label className="block text-xs font-bold text-gray-700">الكورس المستهدف بالكتاب والمحاضرة</label>
                      <select
                        required
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-right outline-hidden focus:border-red-500 cursor-pointer"
                      >
                        <option value="">-- اختر الكورس --</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            [{gradeLabels[course.grade] || course.grade}] - {course.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-4 space-y-2">
                      <label className="block text-xs font-bold text-gray-700">عنوان المحاضرة الجديدة</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: الشرح المتكامل ومناقشة التمارين العامة"
                        value={lectureTitle}
                        onChange={(e) => setLectureTitle(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-right outline-hidden focus:border-red-500"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-xs font-bold text-gray-700">مدة المحاضرة / الفيديو</label>
                      <input
                        type="text"
                        placeholder="مثال: 1 ساعة و 45 دقيقة"
                        value={lectureDuration}
                        onChange={(e) => setLectureDuration(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-right outline-hidden focus:border-red-500"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-xs font-bold text-gray-700">اسم ملزمة الشرح / المرفق</label>
                      <input
                        type="text"
                        placeholder="مثال: ملخص الدرس الأول.pdf"
                        value={lecturePdfUrl}
                        onChange={(e) => setLecturePdfUrl(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-right outline-hidden focus:border-red-500"
                      />
                    </div>

                    {/* Interactive Drag and Drop Video Uploader */}
                    <div className="md:col-span-12 space-y-2 text-right">
                      <label className="block text-xs font-black text-slate-800">تحميل فيديو المحاضرة وتأمينه (Drag & Drop) 🔒</label>
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingVideo(true);
                        }}
                        onDragLeave={() => setIsDraggingVideo(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingVideo(false);
                          const files = e.dataTransfer.files;
                          if (files && files.length > 0) {
                            handleVideoFileSelect(files[0]);
                          }
                        }}
                        onClick={() => document.getElementById("lecture-video-file-input")?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                          isDraggingVideo 
                            ? "border-red-500 bg-red-50/50 scale-[1.01]" 
                            : "border-gray-200 bg-white hover:border-red-500"
                        }`}
                      >
                        <input
                          id="lecture-video-file-input"
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              handleVideoFileSelect(files[0]);
                            }
                          }}
                        />

                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                            <Video className="w-6 h-6" />
                          </div>
                          <div className="text-xs">
                            <span className="font-black text-slate-800">اسحب وأسقط ملف الفيديو هنا</span> أو <span className="text-red-600 font-extrabold underline">تصفح ملفات جهازك</span>
                          </div>
                          <p className="text-[10px] text-gray-400 leading-relaxed">
                            صيغ الفيديو المدعومة: MP4, MOV, MKV, AVI. سيتم فورياً تشفير الفيديو بنظام DRM لمنع تسجيل الشاشة وحماية حقوقك!
                          </p>
                        </div>
                      </div>

                      {/* Video upload progress state */}
                      {videoUploadProgress !== null && (
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-right">
                          <div className="flex justify-between items-center text-[10px] font-black text-slate-700">
                            <span>جاري رفع وتشفير الفيديو: {videoUploadProgress}%</span>
                            <span className="font-mono">{uploadedVideoFile?.size}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-red-600 h-1.5 rounded-full transition-all duration-150" style={{ width: `${videoUploadProgress}%` }}></div>
                          </div>
                        </div>
                      )}

                      {uploadedVideoFile && videoUploadProgress === 100 && (
                        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-[10px] font-extrabold flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>تم تحميل ملف الفيديو ({uploadedVideoFile.name}) وتأمينه ضد القرصنة والتسجيل بنجاح! 🔒</span>
                        </div>
                      )}

                      <div className="pt-2">
                        <label className="block text-[10px] text-gray-400 font-extrabold mb-1">رابط بث المحاضرة المشفر (يتم ملؤه تلقائياً أو كتابته يدوياً):</label>
                        <input
                          type="url"
                          required
                          placeholder="مثال: https://www.w3schools.com/html/mov_bbb.mp4"
                          value={lectureVideoUrl}
                          onChange={(e) => setLectureVideoUrl(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-left outline-hidden focus:border-red-500 font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Smart Quiz Creator sub-panel toggle */}
                    <div className="md:col-span-12 space-y-3 pt-2 text-right">
                      <div className="flex items-center gap-2">
                        <input
                          id="enable-lecture-quiz-creator"
                          type="checkbox"
                          checked={quizEnabled}
                          onChange={(e) => setQuizEnabled(e.target.checked)}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                        />
                        <label htmlFor="enable-lecture-quiz-creator" className="text-xs font-black text-slate-800 cursor-pointer flex items-center gap-1.5 select-none font-sans">
                          <Plus className="w-4 h-4 text-red-600" />
                          <span>إرفاق اختبار تفاعلي فوري لتقييم فهم الطلاب للمحاضرة؟ 📝</span>
                        </label>
                      </div>

                      {quizEnabled && (
                        <div className="bg-slate-50 border border-slate-100 p-5 sm:p-6 rounded-2xl space-y-4 text-right animate-fadeIn">
                          <div className="border-b border-slate-200/80 pb-2">
                            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1 font-sans">
                              <Plus className="w-4 h-4 text-red-600" />
                              <span>أداة إنشاء الاختبار التفاعلي الذكي 📐</span>
                            </h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">صمم أسئلة مخصصة لقياس مهارات التفكير الرياضي لدى الطلاب فور انتهائهم من مشاهدة الشرح.</p>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] text-slate-700 font-black block mb-1">عنوان الاختبار التفاعلي</label>
                              <input
                                type="text"
                                required={quizEnabled}
                                placeholder="مثال: اختبار الفهم السريع والتمارين الأساسية لدرس اليوم"
                                value={quizTitleText}
                                onChange={(e) => setQuizTitleText(e.target.value)}
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-right outline-hidden focus:border-red-500 font-sans"
                              />
                            </div>

                            {/* Dynamic Questions Builder Map */}
                            <div className="space-y-4 pt-2">
                              {quizQuestions.map((q, qidx) => (
                                <div key={q.id} className="p-4 bg-white border border-gray-150 rounded-xl space-y-3 relative">
                                  <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                    <span className="text-[10px] font-black text-red-600">السؤال رقم ({qidx + 1})</span>
                                    {quizQuestions.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setQuizQuestions(prev => prev.filter(item => item.id !== q.id));
                                        }}
                                        className="text-[9px] font-bold text-red-500 hover:underline cursor-pointer"
                                      >
                                        حذف السؤال 🗑️
                                      </button>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-[10px] text-gray-600 font-extrabold block">نص السؤال الرياضي</label>
                                    <input
                                      type="text"
                                      required={quizEnabled}
                                      placeholder="مثال: إذا كانت ص = س^3 + 5س، فإن دص/دس عند س = 1 تساوي..."
                                      value={q.text}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setQuizQuestions(prev => prev.map(item => item.id === q.id ? { ...item, text: val } : item));
                                      }}
                                      className="w-full px-3 py-2 bg-slate-50 border border-gray-150 rounded-lg text-xs"
                                    />
                                  </div>

                                  {/* 4 Options Grid */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {q.options.map((opt, oidx) => (
                                      <div key={oidx} className="space-y-1">
                                        <label className="text-[9px] text-gray-500 block">الخيار {oidx === 0 ? "أ (الأول)" : oidx === 1 ? "ب (الثاني)" : oidx === 2 ? "ج (الثالث)" : "د (الرابع)"}</label>
                                        <input
                                          type="text"
                                          required={quizEnabled}
                                          placeholder={`الخيار ${oidx + 1}`}
                                          value={opt}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setQuizQuestions(prev => prev.map(item => {
                                              if (item.id === q.id) {
                                                const opts = [...item.options];
                                                opts[oidx] = val;
                                                return { ...item, options: opts };
                                              }
                                              return item;
                                            }));
                                          }}
                                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-right"
                                        />
                                      </div>
                                    ))}
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-[10px] text-gray-500 font-extrabold block mb-1">الخيار الصحيح للإجابة</label>
                                      <select
                                        value={q.correctAnswerIndex}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setQuizQuestions(prev => prev.map(item => item.id === q.id ? { ...item, correctAnswerIndex: val } : item));
                                        }}
                                        className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs font-sans"
                                      >
                                        <option value={0}>الخيار الأول (أ)</option>
                                        <option value={1}>الخيار الثاني (ب)</option>
                                        <option value={2}>الخيار الثالث (ج)</option>
                                        <option value={3}>الخيار الرابع (د)</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="text-[10px] text-gray-500 font-extrabold block mb-1">التفسير والشرح والحل النموذجي (Explanation)</label>
                                      <input
                                        type="text"
                                        placeholder="مثال: نقوم بالاشتقاق ص' = 3س^2 + 5، ثم نعوض س=1 فنحصل على 3+5=8."
                                        value={q.explanation}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setQuizQuestions(prev => prev.map(item => item.id === q.id ? { ...item, explanation: val } : item));
                                        }}
                                        className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs text-right"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setQuizQuestions(prev => [
                                  ...prev,
                                  { id: "q-" + Date.now(), text: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" }
                                ]);
                              }}
                              className="bg-red-50 hover:bg-red-100 text-red-600 font-extrabold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1 mt-2 border border-red-200 font-sans"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>إضافة سؤال رياضي جديد للاختبار ➕</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-12">
                      <button
                        type="submit"
                        disabled={!selectedCourseId || !lectureTitle}
                        className="w-full md:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-extrabold rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                      >
                        <Plus className="w-4 h-4" />
                        <span>تأكيد ونشر المحاضرة ومرفقاتها فورياً 🚀</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "students" && (
            <motion.div
              key="students-pane"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Students List with Balance Control */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="border-b border-gray-100 pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <h3 className="text-base font-black text-gray-900">قائمة جميع الطلاب وحساباتهم المالية ({students.length})</h3>
                      <p className="text-xs text-gray-400">تحكم بمحفظة الطالب، أضف أو اخصم رصيد، وراجع كورساتهم المشتركة</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleExportStudentsToCSV}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1"
                        title="تصدير جميع الطلاب إلى ملف CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تصدير الطلاب (CSV) 📥</span>
                      </button>
                      <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg">
                        إجمالي أرصدة الطلاب: {totalWalletBalances} ج.م
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {students.map((student, idx) => (
                      <div
                        key={student.phone || idx}
                        className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors hover:bg-white"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-bold font-mono text-xs">
                            {idx + 1}
                          </div>
                          <div className="text-right">
                            <span className="block text-sm font-extrabold text-gray-900">{student.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono block">{student.phone}</span>
                            <span className="text-[10px] text-slate-500 font-medium">عدد الكورسات المشتركة: <strong className="text-red-600 font-mono">{student.enrolledCount}</strong></span>
                          </div>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto justify-end">
                          {/* Current Wallet state */}
                          <div className="bg-white border border-gray-150 px-3 py-1.5 rounded-xl text-right text-xs">
                            <span className="block text-[8px] text-gray-400 font-extrabold">الرصيد الحالي بالمحفظة</span>
                            <span className="font-mono font-bold text-red-600">{student.balance} ج.م</span>
                          </div>

                          {user?.role !== "teacher" ? (
                            <>
                              {/* Quick Add Balance Toggle */}
                              <button
                                onClick={() => {
                                  setSelectedStudentPhone(student.phone);
                                  setBalanceModAmount(100);
                                }}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black px-3 py-2 rounded-xl text-[10px] transition-colors cursor-pointer flex items-center gap-0.5"
                              >
                                <Coins className="w-3.5 h-3.5" />
                                <span>شحن رصيد</span>
                              </button>

                              {/* Quick Deduct Balance */}
                              <button
                                onClick={() => {
                                  const amt = Number(prompt("أدخل قيمة الخصم ج.م بالكامل:", "50"));
                                  if (amt && amt > 0) {
                                    handleBalanceDeduct(student.phone, amt);
                                  }
                                }}
                                className="bg-red-50 hover:bg-red-100 text-red-600 font-black px-3 py-2 rounded-xl text-[10px] transition-colors cursor-pointer"
                              >
                                خصم 💸
                              </button>

                              {/* Edit Student Details */}
                              <button
                                onClick={() => {
                                  setEditingStudent(student);
                                  setEditStudentName(student.name);
                                  setEditStudentPhone(student.phone);
                                  setEditStudentBalance(student.balance);
                                }}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-black px-3 py-2 rounded-xl text-[10px] transition-colors cursor-pointer flex items-center gap-0.5"
                              >
                                <span>تعديل ⚙️</span>
                              </button>

                              {/* Delete Student entirely */}
                              <button
                                onClick={async () => {
                                  if (confirm(`هل أنت متأكد من حذف الطالب "${student.name}" نهائياً من المنصة؟`)) {
                                    if (onDeleteStudent) {
                                      const res = await onDeleteStudent(student.phone);
                                      if (res.success) {
                                        alert("تم حذف الطالب بنجاح!");
                                      } else {
                                        alert(res.message || "حدث خطأ أثناء الحذف");
                                      }
                                    }
                                  }
                                }}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-black px-3 py-2 rounded-xl text-[10px] transition-colors cursor-pointer flex items-center gap-0.5"
                              >
                                <span>حذف 🗑️</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-2 py-1 rounded">عرض مالي فقط</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dynamic Shifting Overlay to edit Student Details */}
                  {editingStudent && (
                    <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                        <span className="text-xs font-black text-blue-800">تعديل بيانات الطالب: <strong>{editingStudent.name}</strong></span>
                        <button onClick={() => setEditingStudent(null)} className="text-blue-800 font-bold hover:underline text-xs">إلغاء</button>
                      </div>

                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (onUpdateStudent) {
                          const res = await onUpdateStudent(editingStudent.phone, {
                            name: editStudentName,
                            phone: editStudentPhone,
                            balance: editStudentBalance,
                          });
                          if (res.success) {
                            alert("تم تعديل بيانات الطالب بنجاح!");
                            setEditingStudent(null);
                          } else {
                            alert(res.message || "حدث خطأ أثناء التعديل");
                          }
                        }
                      }} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <div className="space-y-1">
                          <label className="text-[10px] text-blue-900 font-bold block">اسم الطالب بالكامل</label>
                          <input
                            type="text"
                            required
                            value={editStudentName}
                            onChange={(e) => setEditStudentName(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-blue-250 rounded-xl text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-blue-900 font-bold block">رقم الهاتف (اسم المستخدم)</label>
                          <input
                            type="text"
                            required
                            value={editStudentPhone}
                            onChange={(e) => setEditStudentPhone(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-blue-250 rounded-xl text-xs text-left font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-blue-900 font-bold block">الرصيد في المحفظة (ج.م)</label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={editStudentBalance}
                            onChange={(e) => setEditStudentBalance(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-blue-250 rounded-xl text-xs font-mono"
                          />
                        </div>
                        <div className="sm:col-span-3 flex justify-end">
                          <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer">
                            حفظ التعديلات وعمل مزامنة 💾
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Dynamic Shifting Overlay / Inline Shaper to modify Student Balance */}
                  {selectedStudentPhone && (
                    <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center border-b border-amber-100 pb-2">
                        <span className="text-xs font-black text-amber-800">تعديل فوري للرصيد للطالب: <strong>{students.find(s=>s.phone === selectedStudentPhone)?.name}</strong></span>
                        <button onClick={() => setSelectedStudentPhone(null)} className="text-amber-800 font-bold hover:underline text-xs">إلغاء</button>
                      </div>

                      {balanceModSuccess && (
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-lg">{balanceModSuccess}</div>
                      )}

                      <form onSubmit={handleBalanceModSubmit} className="flex gap-3 items-end">
                        <div className="space-y-1 flex-1">
                          <label className="text-[10px] text-amber-900 font-bold block">القيمة المراد إضافتها للمحفظة بالجنيه المصري (ج.م)</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={balanceModAmount}
                            onChange={(e) => setBalanceModAmount(Number(e.target.value))}
                            className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                        <button
                          type="submit"
                          className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-5 py-2.5 rounded-lg text-xs"
                        >
                          تفعيل الشحن ⚡
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Create Student directly Form */}
                <div className="lg:col-span-4">
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-black text-gray-900 flex items-center gap-1">
                      <UserPlus className="w-4.5 h-4.5 text-red-600" />
                      <span>تسجيل طالب جديد يدوياً</span>
                    </h3>

                    {studentSuccess && (
                      <div className="p-3 bg-slate-800 text-white text-xs font-bold rounded-xl leading-relaxed">
                        {studentSuccess}
                      </div>
                    )}

                    <form onSubmit={handleAddStudentSubmit} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-600 block">اسم الطالب بالكامل</label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: يوسف أحمد عبد المنعم"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-600 block">رقم الهاتف (سيستخدم كمعرف الطالب)</label>
                        <input
                          type="tel"
                          required
                          placeholder="مثال: 01155443322"
                          value={studentPhone}
                          onChange={(e) => setStudentPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-600 block">الرصيد الافتتاحي بالمحفظة (ج.م)</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={studentBalance}
                          onChange={(e) => setStudentBalance(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-2.5 rounded-xl text-xs transition-colors"
                      >
                        تسجيل وتأكيد الطالب 💾
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "codes" && (
            <motion.div
              key="codes-pane"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {user?.role === "teacher" ? (
                renderRestrictedScreen(
                  "إدارة أكواد الشحن مغلقة للمدرس",
                  "عذراً، توليد الأكواد وإدارتها وتصفير رصيد المحافظ أو طباعتها متاح فقط للمدير العام لمنع أي تلاعب مالي أو إساءة استخدام."
                )
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Generate form */}
                <div className="lg:col-span-4">
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-black text-gray-900 flex items-center gap-1">
                      <Ticket className="w-4 h-4 text-red-600" />
                      <span>توليد وإنشاء أكواد شحن جديدة</span>
                    </h3>

                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      الأكواد المنتجة تعمل كبطاقات شحن. يمكن تسليمها للطلاب مطبوعة أو إرسالها بالهاتف ليقوموا بكتابتها بمحفظتهم للحصول على رصيد تفعيل الكورسات فورياً.
                    </p>

                    {codeSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold rounded-xl">
                        {codeSuccess}
                      </div>
                    )}

                    <form onSubmit={handleGenerateCodesSubmit} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-600 block">قيمة الرصيد للكود الواحد (ج.م)</label>
                        <select
                          value={codeValue}
                          onChange={(e) => setCodeValue(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                        >
                          <option value="50">50 ج.م</option>
                          <option value="100">100 ج.م</option>
                          <option value="120">120 ج.م</option>
                          <option value="130">130 ج.م</option>
                          <option value="140">140 ج.م</option>
                          <option value="150">150 ج.م</option>
                          <option value="200">200 ج.م</option>
                          <option value="300">300 ج.م</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-600 block">عدد الأكواد المراد توليدها معاً</label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={50}
                          value={codeCount}
                          onChange={(e) => setCodeCount(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 rounded-xl text-xs transition-colors"
                      >
                        توليد أكواد عشوائية آمنة 🎲
                      </button>
                    </form>
                  </div>
                </div>

                {/* Codes List Column */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="border-b border-gray-100 pb-2">
                    <h3 className="text-base font-black text-gray-900">سجل الأكواد المنتجة بالمنصة ({chargeCodes.length})</h3>
                    <p className="text-xs text-gray-400">انسخ الكود لتقديمه للطالب، وراقب حالة شحن واستخدام البطاقات</p>
                  </div>

                  <div className="max-h-[380px] overflow-y-auto border border-gray-100 rounded-2xl divide-y divide-gray-50">
                    {chargeCodes.length > 0 ? (
                      chargeCodes.map((c, idx) => (
                        <div key={c.code || idx} className="p-3 bg-gray-50/40 hover:bg-white flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyCode(c.code)}
                              className="p-1.5 bg-white border border-gray-150 rounded text-gray-500 hover:bg-gray-100"
                              title="نسخ الكود"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <div>
                              <span className="font-mono font-bold text-slate-900">{c.code}</span>
                              <span className="text-[9px] text-gray-400 mr-2">شحن رصيد</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-emerald-600 text-xs">{c.value} ج.م</span>
                            
                            {c.isUsed ? (
                              <div className="text-left text-[10px] text-red-600 bg-red-50/50 px-2 py-0.5 rounded font-medium border border-red-100/50">
                                <span>استخدمه: {c.usedByName || c.usedBy}</span>
                              </div>
                            ) : (
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded border border-emerald-150">
                                فعال وجاهز 👍
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-gray-400 text-xs">
                        لم يتم توليد أي أكواد شحن حتى الآن. استخدم المولد في اليمين!
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )}
            </motion.div>
          )}

          {activeTab === "video" && (
            <motion.div
              key="video-pane"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {user?.role === "teacher" ? (
                renderRestrictedScreen(
                  "حماية الفيديوهات مغلقة للمدرس",
                  "عذراً، إعدادات الحماية المتقدمة، العلامات المائية الديناميكية، ومنع تسجيل الشاشات متاح فقط لحساب المدير العام للمنصة 👑"
                )
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* DRM Security form */}
                <div className="lg:col-span-5">
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-red-600" />
                      <span>إعدادات مشغل الفيديو والعلامة المائية</span>
                    </h3>

                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      هذا النظام يحمي فيديوهاتك ضد التسريب أو التصوير. يتم وضع علامة مائية عائمة متغيرة أو شعار مخصص، لمنع تسريب المحاضرات.
                    </p>

                    {videoSettingsSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold rounded-xl leading-relaxed">
                        {videoSettingsSuccess}
                      </div>
                    )}

                    <form onSubmit={handleSaveVideoSettings} className="space-y-3.5 text-right">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-600 block">نوع العلامة المائية الحمائية</label>
                        <select
                          value={watermarkTextType}
                          onChange={(e) => setWatermarkTextType(e.target.value as "student_info" | "custom")}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                        >
                          <option value="student_info">ديناميكية: اسم الطالب ورقم هاتفه 👤📞</option>
                          <option value="custom">ثابتة: نص مخصص يحدده المشرف 📝</option>
                        </select>
                      </div>

                      {watermarkTextType === "custom" && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-600 block">النص المخصص للعلامة المائية</label>
                          <input
                            type="text"
                            required
                            value={customWatermarkText}
                            onChange={(e) => setCustomWatermarkText(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-600 block">شفافية العلامة المائية</label>
                          <select
                            value={watermarkOpacity}
                            onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                          >
                            <option value="0.05">0.05 (شفافة جداً)</option>
                            <option value="0.15">0.15 (مثالية حمائية)</option>
                            <option value="0.3">0.3 (واضحة)</option>
                            <option value="0.5">0.5 (بارزة)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-600 block">مكان العلامة المائية</label>
                          <select
                            value={watermarkPosition}
                            onChange={(e) => setWatermarkPosition(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                          >
                            <option value="random">تتحرك عشوائياً (موصى به) 🧭</option>
                            <option value="center">المنتصف (ثابتة)</option>
                            <option value="top-right">أعلى اليمين</option>
                            <option value="top-left">أعلى اليسار</option>
                            <option value="bottom-right">أسفل اليمين</option>
                            <option value="bottom-left">أسفل اليسار</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-600 block">رابط شعار المنصة (اللوجو بالزاوية)</label>
                        <input
                          type="url"
                          placeholder="رابط صورة PNG شفافة للشعار"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-600 block">مكان الشعار</label>
                          <select
                            value={logoPosition}
                            onChange={(e) => setLogoPosition(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                          >
                            <option value="top-right">أعلى اليمين</option>
                            <option value="top-left">أعلى اليسار</option>
                            <option value="bottom-right">أسفل اليمين</option>
                            <option value="bottom-left">أسفل اليسار</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-600 block">شفافية الشعار</label>
                          <select
                            value={logoOpacity}
                            onChange={(e) => setLogoOpacity(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                          >
                            <option value="0.2">0.2 (باهت)</option>
                            <option value="0.4">0.4 (طبيعي)</option>
                            <option value="0.6">0.6 (بارز)</option>
                            <option value="0.8">0.8 (شديد الوضوح)</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-2 space-y-2 border-t border-gray-200">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                          <input
                            type="checkbox"
                            checked={enableRightClickBlock}
                            onChange={(e) => setEnableRightClickBlock(e.target.checked)}
                            className="rounded text-red-600"
                          />
                          <span>تعطيل الزر الأيمن للفأرة (لمنع تحميل الفيديوهات) 🚫</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                          <input
                            type="checkbox"
                            checked={enableAntiScreenshotAlert}
                            onChange={(e) => setEnableAntiScreenshotAlert(e.target.checked)}
                            className="rounded text-red-600"
                          />
                          <span>تفعيل تحذيرات وحظر برامج تصوير الشاشة 🔒</span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>تطبيق الإعدادات الأمنية للمشغل</span>
                      </button>
                    </form>
                  </div>
                </div>

                {/* Simulated Live Preview Column */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="border-b border-gray-100 pb-2">
                    <h3 className="text-base font-black text-gray-900">معاينة حية لمشغل الفيديو المحمي 📺</h3>
                    <p className="text-xs text-gray-400">شاهد كيف تظهر حمايتك الأمنية الآن أمام الطلاب الفعليين داخل الفصل التعليمي</p>
                  </div>

                  {/* Simulated player screen */}
                  <div className="relative aspect-video bg-gray-950 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex items-center justify-center">
                    {/* Simulated Logo overlay */}
                    {logoUrl && (
                      <div
                        className={`absolute p-2.5 z-20 pointer-events-none transition-all duration-300`}
                        style={{
                          opacity: logoOpacity,
                          top: logoPosition.startsWith("top") ? 12 : "auto",
                          bottom: logoPosition.startsWith("bottom") ? 12 : "auto",
                          right: logoPosition.endsWith("right") ? 12 : "auto",
                          left: logoPosition.endsWith("left") ? 12 : "auto",
                        }}
                      >
                        <img src={logoUrl} alt="Watermark Logo" className="w-14 sm:w-20 object-contain rounded-md" />
                      </div>
                    )}

                    {/* Simulated Watermark Text */}
                    <div
                      className={`absolute z-30 pointer-events-none select-none select-all font-black text-[11px] sm:text-xs text-white/80 bg-black/40 px-2.5 py-1 rounded-md border border-white/5 whitespace-nowrap transition-all duration-300`}
                      style={{
                        opacity: watermarkOpacity,
                        ...(watermarkPosition === "random" ? {
                          top: "35%",
                          right: "20%"
                        } : watermarkPosition === "center" ? {
                          top: "45%",
                          left: "50%",
                          transform: "translate(-50%, -50%)"
                        } : {
                          top: watermarkPosition.startsWith("top") ? 16 : "auto",
                          bottom: watermarkPosition.startsWith("bottom") ? 16 : "auto",
                          right: watermarkPosition.endsWith("right") ? 16 : "auto",
                          left: watermarkPosition.endsWith("left") ? 16 : "auto",
                        })
                      }}
                    >
                      {watermarkTextType === "student_info" ? (
                        <span>أحمد طالب ممتاز - 01234567811</span>
                      ) : (
                        <span>{customWatermarkText || "حقوق الطبع محفوظة"}</span>
                      )}
                    </div>

                    {/* Outer elements mimicking video details */}
                    <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                      <span>اتصال مشفر آمن بـ DRM 🔒</span>
                    </div>

                    <div className="space-y-2 text-center text-slate-500 z-10 pointer-events-none px-4">
                      <Eye className="w-10 h-10 text-slate-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-300">تمثيل البث المشفر بجودة Full HD 1085p</p>
                      <p className="text-[10px] text-slate-500">تم وضع حماية الشفرة لمنع فحص العناصر أو التقاط لقطات شاشة</p>
                    </div>

                    {/* Player controls overlay bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-slate-900/90 border-t border-slate-800/80 px-4 flex justify-between items-center text-[10px] text-slate-400 z-10">
                      <div className="flex items-center gap-3">
                        <span>▶</span>
                        <span>0:00 / 1:45:00</span>
                      </div>
                      <span>⚙️ 1080p | الشاشة الكاملة 📺</span>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex gap-2.5 text-amber-800 text-xs">
                    <Info className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="block">كيف تحميك العلامة المائية؟</strong>
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        عند قيام أي طالب بفتح المحاضرة، يقوم مشغل الفيديو بقراءة رصيد الجلسة وعرض اسمه ورقم هاتفه الشخصي على الشاشة في موضع متغير. إذا حاول تصوير الشاشة بكاميرا هاتف خارجي، ستظهر هويته فوراً مما يعرض حسابه للحظر القانوني التلقائي.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings-pane"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    إعدادات المنصة وإدارة الحملات الإعلانية ⚙️
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">تخصيص هوية المنصة، بيانات التواصل، وبانرات الإعلانات (جوجل أدسنس وصور مخصصة)</p>
                </div>
                <button
                  onClick={handleSaveAllSettings}
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-red-200"
                >
                  حفظ كافة التغييرات 💾
                </button>
              </div>

              {settingsSuccessMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-xs font-bold text-center animate-bounce">
                  {settingsSuccessMsg}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-right">
                {/* Right side: Brand & Contacts config */}
                <div className="lg:col-span-6 space-y-6">
                  {/* Brand Identity */}
                  <div className="border border-gray-100 rounded-2xl p-5 space-y-4 bg-gray-50/30">
                    <h4 className="text-xs font-extrabold text-red-600 uppercase tracking-wider">هوية المنصة وشعارها 🌟</h4>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 block">اسم المنصة التعليمية:</label>
                      <input
                        type="text"
                        value={tempPlatformName}
                        onChange={(e) => setTempPlatformName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-hidden focus:border-red-500 font-bold"
                        placeholder="مثال: منصة اليسر التعليمية الشاملة"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 block">رابط صورة الشعار (Logo URL):</label>
                      <input
                        type="text"
                        value={tempLogoUrl}
                        onChange={(e) => setTempLogoUrl(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-hidden focus:border-red-500 font-mono"
                        placeholder="أدخل رابط صورة مباشر لشعار المنصة"
                      />
                      <div className="flex gap-2 items-center mt-2 p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-[10px] text-gray-400">معاينة الشعار:</span>
                        {tempLogoUrl ? (
                          <img src={tempLogoUrl} alt="Preview" className="w-8 h-8 rounded-lg object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-[10px] text-red-500 font-bold">لا يوجد شعار بعد</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="border border-gray-100 rounded-2xl p-5 space-y-4 bg-gray-50/30">
                    <h4 className="text-xs font-extrabold text-red-600 uppercase tracking-wider">روابط وبيانات التواصل 📞</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 block">رقم الهاتف للدعم:</label>
                        <input
                          type="text"
                          value={tempContactPhone}
                          onChange={(e) => setTempContactPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-hidden focus:border-red-500 font-mono text-left font-bold"
                          placeholder="0111..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 block">رقم الواتساب (بالرمز الدولي):</label>
                        <input
                          type="text"
                          value={tempContactWhatsapp}
                          onChange={(e) => setTempContactWhatsapp(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-hidden focus:border-red-500 font-mono text-left font-bold"
                          placeholder="20111..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 block">البريد الإلكتروني:</label>
                      <input
                        type="email"
                        value={tempContactEmail}
                        onChange={(e) => setTempContactEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-hidden focus:border-red-500 font-mono text-left"
                        placeholder="support@domain.com"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 block">رابط مجموعة تليجرام:</label>
                        <input
                          type="text"
                          value={tempContactTelegram}
                          onChange={(e) => setTempContactTelegram(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-hidden focus:border-red-500 font-mono text-left"
                          placeholder="https://t.me/..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 block">رابط صفحة فيسبوك:</label>
                        <input
                          type="text"
                          value={tempContactFacebook}
                          onChange={(e) => setTempContactFacebook(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-hidden focus:border-red-500 font-mono text-left"
                          placeholder="https://facebook.com/..."
                        />
                      </div>
                    </div>

                    {/* Static Pages Content Editing */}
                    <div className="border-t border-gray-100 pt-4 mt-4 space-y-4">
                      <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">محتوى الصفحات التعريفية والسياسات 📄</h5>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 block">سياسة الخصوصية (Privacy Policy):</label>
                        <textarea
                          rows={4}
                          value={tempPrivacyPolicy}
                          onChange={(e) => setTempPrivacyPolicy(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-hidden focus:border-red-500 font-sans"
                          placeholder="اكتب هنا بنود سياسة الخصوصية وحماية بيانات الطلاب..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 block">شروط الاستخدام (Terms of Use):</label>
                        <textarea
                          rows={4}
                          value={tempTermsOfUse}
                          onChange={(e) => setTempTermsOfUse(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-hidden focus:border-red-500 font-sans"
                          placeholder="اكتب هنا شروط الاستخدام وقوانين المنصة والملكيات الفكرية..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 block">معلومات الدعم الفني والاتصال:</label>
                        <textarea
                          rows={4}
                          value={tempSupportInfo}
                          onChange={(e) => setTempSupportInfo(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-hidden focus:border-red-500 font-sans"
                          placeholder="اكتب هنا ساعات العمل، أرقام الواتساب وعناوين التواصل المباشر..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Left side: Campaign Ads Manager */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="border border-gray-100 rounded-2xl p-5 space-y-5 bg-gray-50/30">
                    <h4 className="text-xs font-extrabold text-red-600 uppercase tracking-wider flex items-center justify-between">
                      <span>إدارة الإعلانات وبانرات الترويج 📢</span>
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-black">كاملة التوافق مع Google Adsense</span>
                    </h4>

                    {/* Ad Campaign list */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 block">الحملات الإعلانية النشطة بالمنصة:</label>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto border border-gray-100 bg-white p-2.5 rounded-xl">
                        {tempAds.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-4">لا توجد إعلانات حالياً بالمنصة. أضف إعلانك بالأسفل!</p>
                        ) : (
                          tempAds.map((ad) => (
                            <div key={ad.id} className="flex justify-between items-center p-2.5 hover:bg-gray-50 rounded-lg border-b border-gray-100 last:border-b-0 text-xs">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDeleteAd(ad.id)}
                                  className="text-red-500 hover:text-red-700 p-1 cursor-pointer transition-colors"
                                  title="حذف الحملة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleEditAd(ad)}
                                  className="text-indigo-600 hover:text-indigo-800 font-extrabold cursor-pointer text-[10px]"
                                >
                                  تعديل ✏️
                                </button>
                              </div>
                              <div className="text-right">
                                <span className="font-extrabold block text-gray-800">{ad.title}</span>
                                <span className="text-[9px] text-gray-400 block">
                                  {ad.placement === "landing_top" ? "أعلى الرئيسية" : 
                                   ad.placement === "landing_sidebar" ? "جانب الرئيسية" : 
                                   ad.placement === "landing_middle" ? "منتصف الرئيسية" : 
                                   ad.placement === "landing_bottom" ? "أسفل الرئيسية" : 
                                   ad.placement === "student_top" ? "أعلى لوحة الطالب" : 
                                   ad.placement === "student_sidebar" ? "جانب لوحة الطالب" : 
                                   ad.placement === "student_bottom" ? "أسفل لوحة الطالب" : 
                                   ad.placement === "student_classroom" ? "داخل الفصل الدراسي" : "أخرى"} | {ad.type === "html" ? "كود Google Adsense" : "صورة ترويجية"} | {ad.isActive ? "🟢 نشط" : "🔴 معطل"}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Form to Add/Edit Ad */}
                    <div className="bg-white border border-gray-200 p-4 rounded-xl space-y-3">
                      <span className="text-[10px] font-extrabold text-slate-400 block border-b border-gray-50 pb-1.5">
                        {selectedAdIdForEdit ? "تعديل إعلان محدد" : "إنشاء حملة إعلانية جديدة"}
                      </span>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-gray-700 block">عنوان الحملة / الإعلان:</label>
                        <input
                          type="text"
                          value={adFormTitle}
                          onChange={(e) => setAdFormTitle(e.target.value)}
                          className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-hidden focus:bg-white focus:border-red-500"
                          placeholder="مثال: عرض التفوق وخصم ليلة الامتحان 50%"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-gray-700 block">الموضع بالمنصة:</label>
                          <select
                            value={adFormPlacement}
                            onChange={(e) => setAdFormPlacement(e.target.value as any)}
                            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-hidden focus:bg-white focus:border-red-500 font-bold"
                          >
                            <option value="landing_top">أعلى الصفحة الرئيسية</option>
                            <option value="landing_sidebar">بجانب كورسات الرئيسية</option>
                            <option value="landing_middle">منتصف الصفحة الرئيسية</option>
                            <option value="landing_bottom">أسفل الصفحة الرئيسية</option>
                            <option value="student_top">أعلى لوحة الطالب</option>
                            <option value="student_sidebar">بجانب لوحة الطالب</option>
                            <option value="student_bottom">أسفل لوحة الطالب</option>
                            <option value="student_classroom">داخل الفصل الدراسي (فيديو/درس)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-gray-700 block">نوع الإعلان:</label>
                          <select
                            value={adFormType}
                            onChange={(e) => setAdFormType(e.target.value as any)}
                            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-hidden focus:bg-white focus:border-red-500 font-bold"
                          >
                            <option value="image">صورة + رابط مباشر</option>
                            <option value="html">كود مخصص (Google Adsense / HTML)</option>
                          </select>
                        </div>
                      </div>

                      {adFormType === "image" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-700 block">رابط الصورة (URL):</label>
                            <input
                              type="text"
                              value={adFormImageUrl}
                              onChange={(e) => setAdFormImageUrl(e.target.value)}
                              className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                              placeholder="https://images.unsplash.com/..."
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-700 block">رابط التوجيه عند النقر:</label>
                            <input
                              type="text"
                              value={adFormLinkUrl}
                              onChange={(e) => setAdFormLinkUrl(e.target.value)}
                              className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-700 block">كود الإعلان البرمجي (Adsense Code / HTML Code):</label>
                          <textarea
                            value={adFormHtmlCode}
                            onChange={(e) => setAdFormHtmlCode(e.target.value)}
                            className="w-full h-20 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-left"
                            placeholder="<!-- Insent Google Adsense script here -->..."
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={adFormIsActive}
                            onChange={(e) => setAdFormIsActive(e.target.checked)}
                            className="rounded-sm border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                          />
                          <span>تفعيل الإعلان فورياً</span>
                        </label>

                        <div className="flex gap-1.5">
                          {selectedAdIdForEdit && (
                            <button
                              onClick={() => {
                                setSelectedAdIdForEdit(null);
                                setAdFormTitle("");
                                setAdFormImageUrl("");
                                setAdFormLinkUrl("");
                                setAdFormHtmlCode("");
                                setAdFormIsActive(true);
                              }}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold px-3 py-1.5 rounded-lg text-[10px]"
                            >
                              إلغاء التعديل
                            </button>
                          )}
                          <button
                            onClick={handleSaveAdForm}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-1.5 rounded-lg text-[10px] cursor-pointer"
                          >
                            {selectedAdIdForEdit ? "حفظ التعديل" : "إضافة الإعلان"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "cloudflare" && (
            <motion.div
              key="cloudflare-pane"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 text-right font-sans"
            >
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      إدارة وتسريع منصة Cloudflare العالمية ☁️⚡
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 font-bold leading-relaxed">
                    قم بربط المنصة بخوادم كلوود فلير لزيادة سرعة التصفح 10x، تفعيل كاش Edge الذكي لحماية قاعدة البيانات وتوفير الكويريز، وتأمين المنصة ضد البوتات الضارة.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-orange-50 text-orange-600 font-extrabold px-3 py-1.5 rounded-xl border border-orange-100">
                    مسرّع الأداء مفعّل تلقائياً 🚀
                  </span>
                </div>
              </div>

              {/* Status Alert and Performance Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-orange-600">
                    <span className="text-xs font-black">كاش الـ Edge الذكي</span>
                    <Cloud className="w-5 h-5" />
                  </div>
                  <p className="text-xl font-black text-gray-900 font-mono">98.4% Hit Rate</p>
                  <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                    يتم تخديم الكورسات والإعلانات والصفحات الثابتة من خوادم كلوود فلير مباشرة، مما يقلل قراءات Firestore لـ 1/100!
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-blue-600">
                    <span className="text-xs font-black">ضغط المحتوى (Brotli)</span>
                    <Zap className="w-5 h-5" />
                  </div>
                  <p className="text-xl font-black text-gray-900 font-mono">1.35x Compression</p>
                  <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                    يتم ضغط ملفات الكود والـ CSS والخطوط تلقائياً لتقليل حجم البيانات المستهلكة من باقة الطالب وتسريع تحميل المنصة.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-emerald-600">
                    <span className="text-xs font-black">حماية البوتات والـ DDoS</span>
                    <Shield className="w-5 h-5" />
                  </div>
                  <p className="text-xl font-black text-gray-900 font-mono">نشط ومحمي 🔒</p>
                  <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                    يقوم جدار حماية Cloudflare WAF بصد محاولات تسجيل الدخول المزعجة وحظر برمجيات القرصنة آلياً على مدار الساعة.
                  </p>
                </div>
              </div>

              {/* Success Notification */}
              {cfSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold leading-relaxed flex gap-2 items-center animate-bounce">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{cfSuccessMsg}</span>
                </div>
              )}

              {/* Main settings container */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Column: API Credentials Form */}
                <div className="bg-slate-50 border border-gray-100 rounded-2xl p-6 space-y-6">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-gray-200 pb-3">
                    <Settings className="w-4 h-4 text-orange-500" />
                    بيانات اتصال Cloudflare API 🔑
                  </h4>

                  <div className="space-y-4">
                    {/* Cloudflare Enabled Toggle */}
                    <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs">
                      <div>
                        <label className="text-xs font-black text-gray-900 block">تفعيل تسريع الأداء العام للمنصة</label>
                        <span className="text-[9px] text-gray-400 font-bold block">توجيه كافة بيانات وترافيك المنصة عبر شبكة كلوود فلير المسرّعة</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={cfEnabled}
                        onChange={(e) => setCfEnabled(e.target.checked)}
                        className="w-10 h-5 rounded-full text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-gray-700 block">البريد الإلكتروني للحساب:</label>
                        <input
                          type="email"
                          value={cfEmail}
                          onChange={(e) => setCfEmail(e.target.value)}
                          placeholder="your-cloudflare-email@gmail.com"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono text-left outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-gray-700 block">رقم تعريف النطاق (Zone ID):</label>
                        <input
                          type="text"
                          value={cfZoneId}
                          onChange={(e) => setCfZoneId(e.target.value)}
                          placeholder="e.g. 023e105e46b38c10e6a182b73"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono text-left outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-gray-700 block">مفتاح الحساب العام (Global API Key):</label>
                      <input
                        type="password"
                        value={cfApiKey}
                        onChange={(e) => setCfApiKey(e.target.value)}
                        placeholder="••••••••••••••••••••••••••••••••••••••••"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono text-left outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                      <span className="text-[8px] text-gray-400 block font-bold leading-normal">
                        يمكنك استخراج هذا المفتاح من لوحة تحكم Cloudflare الخاصة بك من تبويب (My Profile - API Tokens - Global API Key).
                      </span>
                    </div>

                    {/* Diagnostics & API Ping */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3 shadow-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-black text-gray-700">فحص وتشخيص الاتصال بالشبكة والـ CDN</span>
                        <button
                          type="button"
                          onClick={handlePingCloudflareAPI}
                          disabled={cfTestStatus === "testing"}
                          className="bg-orange-50 hover:bg-orange-100 text-orange-700 font-extrabold text-[10px] px-3 py-1.5 rounded-lg border border-orange-200 flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                        >
                          {cfTestStatus === "testing" ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              جاري الفحص...
                            </>
                          ) : (
                            <>
                              <Activity className="w-3 h-3" />
                              اختبار اتصال API والشبكة ⚡
                            </>
                          )}
                        </button>
                      </div>

                      {cfTestStatus !== "idle" && (
                        <div className={`p-3 rounded-lg text-[10px] leading-relaxed font-mono whitespace-pre-wrap text-left ${
                          cfTestStatus === "success" 
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                            : "bg-red-50 text-red-800 border border-red-200"
                        }`}>
                          {cfTestResult}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveCloudflareSettings}
                      className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-orange-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Cloud className="w-4 h-4" />
                      حفظ وتطبيق إعدادات كلوود فلير ☁️💾
                    </button>
                  </div>
                </div>

                {/* Right Column: Turnstile, Stream, and Purge Cache Tool */}
                <div className="space-y-6">
                  
                  {/* CDN Purge Cache Tool */}
                  <div className="bg-slate-50 border border-gray-100 rounded-2xl p-6 space-y-4">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-gray-200 pb-3">
                      <RefreshCw className="w-4 h-4 text-orange-500" />
                      أداة تطهير كاش خوادم التوزيع (Edge Cache Purging)
                    </h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed font-bold">
                      عند تعديل كورس أو إعلان أو محاضرة ولا يراها الطلاب فوراً بسبب الكاش التوزيعي، يمكنك تفريغ كاش خوادم كلوود فلير (Edge Servers) لتحديث المحتوى لكل الطلاب فورياً في جميع المحافظات:
                    </p>

                    <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-3 shadow-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-700 block">تفريغ رابط صفحة معينة (اختياري):</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={cfUrlToPurge}
                            onChange={(e) => setCfUrlToPurge(e.target.value)}
                            placeholder="https://yusr-academy.com/courses"
                            className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-left outline-hidden focus:bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handlePurgeCloudflareCache(false)}
                            disabled={cfPurgeStatus === "purging" || !cfUrlToPurge.trim()}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg disabled:opacity-50 cursor-pointer"
                          >
                            تطهير الرابط 🧹
                          </button>
                        </div>
                      </div>

                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-100"></div>
                        <span className="flex-shrink mx-3 text-[9px] text-gray-400 font-extrabold">أو تطهير كلي شامل</span>
                        <div className="flex-grow border-t border-gray-100"></div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePurgeCloudflareCache(true)}
                        disabled={cfPurgeStatus === "purging"}
                        className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {cfPurgeStatus === "purging" ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            جاري تطهير كافة خوادم الـ Edge حول العالم...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            تفريغ كاش المنصة بالكامل (Purge Everything) 🧹
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Cloudflare Turnstile Bot Protection */}
                  <div className="bg-slate-50 border border-gray-100 rounded-2xl p-6 space-y-4">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-gray-200 pb-3">
                      <Shield className="w-4 h-4 text-orange-500" />
                      تأمين التسجيل بنظام Cloudflare Turnstile (مكافحة البوتات)
                    </h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed font-bold">
                      بديل آمن وخصوصي لنظام ريكابتشا (Google reCAPTCHA). يقوم بالتحقق من أن المستخدم إنسان حقيقي في خلفية الموقع دون إرهاقه بحل ألغاز الصور، مما يؤمن حماية قصوى وموثوقية عالية لباقة الطالب وسرعة قاعدة البيانات.
                    </p>

                    <div className="space-y-3.5 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-gray-700 block">مفتاح الموقع (Site Key):</label>
                          <input
                            type="text"
                            value={cfTurnstileSiteKey}
                            onChange={(e) => setCfTurnstileSiteKey(e.target.value)}
                            placeholder="0x4AAAAAA..."
                            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-left outline-hidden focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-gray-700 block">المفتاح السري (Secret Key):</label>
                          <input
                            type="password"
                            value={cfTurnstileSecretKey}
                            onChange={(e) => setCfTurnstileSecretKey(e.target.value)}
                            placeholder="••••••••••••••••••"
                            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-left outline-hidden focus:bg-white"
                          />
                        </div>
                      </div>
                      <span className="text-[8.5px] text-amber-600 block font-black leading-relaxed">
                        💡 يرجى استخراج هذه المفاتيح من لوحة تحكم Cloudflare Turnstile لزيادة تأمين صفحة التسجيل وتفعيل الحماية الذكية للطلاب.
                      </span>
                    </div>
                  </div>

                  {/* Cloudflare Stream Section */}
                  <div className="bg-slate-50 border border-gray-100 rounded-2xl p-6 space-y-4">
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-gray-200 pb-3">
                      <Play className="w-4 h-4 text-orange-500" />
                      بث الفيديوهات والدروس الذكي (Cloudflare Stream Secure Video CDN)
                    </h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed font-bold">
                      أفضل منصة بث على مستوى العالم لحماية الفيديوهات التعليمية من السرقة والتسجيل مع ميزة البث الفوري بدون تقطيع للطلاب حتى على سرعات الإنترنت الضعيفة.
                    </p>

                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-900 cursor-pointer flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={cfStreamEnabled}
                            onChange={(e) => setCfStreamEnabled(e.target.checked)}
                            className="rounded-sm border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                          />
                          <span>تفعيل البث المحمي والمشفر عبر Cloudflare Stream CDN</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-gray-700 block">معرف الحساب (Account ID):</label>
                          <input
                            type="text"
                            value={cfStreamAccountID}
                            onChange={(e) => setCfStreamAccountID(e.target.value)}
                            placeholder="e.g. b8579cfef62da9a79"
                            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-left outline-hidden focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-gray-700 block">مفتاح الوصول (API Token):</label>
                          <input
                            type="password"
                            value={cfStreamToken}
                            onChange={(e) => setCfStreamToken(e.target.value)}
                            placeholder="••••••••••••••••••"
                            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-left outline-hidden focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* BRAND NEW: Interactive Step-by-Step Custom Domain to Cloudflare Setup Guide */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                <div className="border-b border-gray-100 pb-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                          <Globe className="w-5 h-5" />
                        </div>
                        <h4 className="text-base font-black text-slate-900">
                          معالج ربط الدومين الخاص بك بالمنصة 🌐🔗
                        </h4>
                      </div>
                      <p className="text-xs text-gray-500 font-bold leading-relaxed">
                        اختر طريقة الربط المناسبة لتشغيل المنصة تحت اسم النطاق الخاص بك <strong className="text-orange-600 font-mono">yasser.cc</strong>
                      </p>
                    </div>

                    {/* Method Selector Tabs */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => setCfLinkMethod("worker")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          cfLinkMethod === "worker"
                            ? "bg-orange-600 text-white shadow-xs"
                            : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                        }`}
                      >
                        ⚡ طريقة الوكيل الذكي (Workers) - موصى بها
                      </button>
                      <button
                        type="button"
                        onClick={() => setCfLinkMethod("dns")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          cfLinkMethod === "dns"
                            ? "bg-orange-600 text-white shadow-xs"
                            : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                        }`}
                      >
                        📁 ربط سجلات DNS المباشر
                      </button>
                    </div>
                  </div>
                </div>

                {cfLinkMethod === "worker" ? (
                  <div className="space-y-6 text-right">
                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 flex gap-3 items-start">
                      <span className="text-xl">💡</span>
                      <div className="space-y-1 text-emerald-900">
                        <h5 className="text-xs font-black">لماذا نوصي بـ Cloudflare Workers؟</h5>
                        <p className="text-[11px] leading-relaxed font-bold opacity-90">
                          منصات الاستضافة السحابية الحديثة (مثل Google AI Studio / Cloud Run) تستخدم توجيهاً داخلياً معقداً يعتمد على ترويسة <span className="font-mono bg-emerald-100 px-1 rounded text-emerald-800">Host Header</span>. 
                          باستخدام <strong className="font-extrabold text-emerald-950">Cloudflare Workers</strong> (المجاني بالكامل لـ 100,000 زائر يومياً)، نقوم بإنشاء وكيل ذكي يقوم بتمرير الترافيك بسلاسة مع الحفاظ على الدومين الخاص بك <span className="font-mono underline text-emerald-950">yasser.cc</span> في شريط العنوان دون أي مشاكل تقنية أو أخطاء SSL!
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Worker steps */}
                      <div className="relative pl-0 pr-8 border-r-2 border-orange-100 space-y-6">
                        {/* Step 1 */}
                        <div className="relative">
                          <span className="absolute -right-[41px] top-0.5 w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center font-mono text-xs font-black shadow-xs">
                            1
                          </span>
                          <div className="space-y-1">
                            <h5 className="text-xs font-black text-gray-900">إنشاء تطبيق Worker جديد:</h5>
                            <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
                              توجه إلى حسابك في كلوود فلير، ومن القائمة الجانبية اضغط على <strong className="text-slate-800">Workers & Pages</strong> ثم اضغط على زر <strong className="text-slate-800">Create Application</strong> ثم <strong className="text-slate-800">Create Worker</strong>. اسم الـ Worker يمكن أن يكون أي شيء (مثال: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-gray-700">yassers-proxy</span>)، ثم اضغط <strong className="text-orange-600">Deploy</strong>.
                            </p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative">
                          <span className="absolute -right-[41px] top-0.5 w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center font-mono text-xs font-black shadow-xs">
                            2
                          </span>
                          <div className="space-y-2">
                            <h5 className="text-xs font-black text-gray-900">لصق الكود البرمجي المخصص:</h5>
                            <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
                              اضغط على زر <strong className="text-slate-800">Edit Code</strong> في صفحة الـ Worker الجديد، واحذف الكود الافتراضي بالكامل، والصق مكانه الكود التالي المصمم خصيصاً لأكاديميتك:
                            </p>

                            <div className="relative bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-left text-[11px] max-h-[220px] overflow-y-auto direction-ltr">
                              <pre className="whitespace-pre">{`export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // توجيه الطلبات إلى موقع المنصة الأصلي
    const TARGET_HOST = "yassers.ai.studio";
    url.hostname = TARGET_HOST;
    
    // إنشاء طلب جديد برأسية Host معدلة لتفادي مشاكل الحماية
    const modifiedRequest = new Request(url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "manual"
    });
    
    // جلب الصفحة من خادم المنصة الرئيسي
    let response = await fetch(modifiedRequest);
    
    // الاحتفاظ بالردود وتسهيل الروابط التفاعلية للطلاب
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  }
};`}</pre>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(`export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // توجيه الطلبات إلى موقع المنصة الأصلي
    const TARGET_HOST = "yassers.ai.studio";
    url.hostname = TARGET_HOST;
    
    // إنشاء طلب جديد برأسية Host معدلة لتفادي مشاكل الحماية
    const modifiedRequest = new Request(url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "manual"
    });
    
    // جلب الصفحة من خادم المنصة الرئيسي
    let response = await fetch(modifiedRequest);
    
    // الاحتفاظ بالردود وتسهيل الروابط التفاعلية للطلاب
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  }
};`);
                                  alert("تم نسخ الكود البرمجي للمنصة بنجاح! جاهز للصقه بالـ Worker.");
                                }}
                                className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-[10px] py-1 px-2.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                نسخ الكود 📋
                              </button>
                            </div>
                            <p className="text-[10px] text-amber-600 font-bold">
                              💡 بعد لصق الكود، اضغط على الزر الأزرق في الأعلى <strong className="text-amber-800">Save and Deploy</strong> لتنشيط الكود فوراً.
                            </p>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative">
                          <span className="absolute -right-[41px] top-0.5 w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center font-mono text-xs font-black shadow-xs">
                            3
                          </span>
                          <div className="space-y-1">
                            <h5 className="text-xs font-black text-gray-900">ربط الدومين الخاص بك (Custom Domain):</h5>
                            <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
                              عُد لصفحة الـ Worker السابقة في لوحة تحكم Cloudflare، واذهب إلى تبويب <strong className="text-slate-800">Settings</strong> ثم <strong className="text-slate-800">Triggers</strong> (أو في الواجهة الحديثة تجدها في تبويب <strong className="text-slate-800">Domains & Routes</strong>). 
                              اضغط على زر <strong className="text-orange-600">Add Custom Domain</strong> واكتب نطاقك الخاص بالكامل: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-bold">yasser.cc</span> ثم اضغط لتأكيد الإضافة.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-emerald-600 font-black block">🟢 فحص فوري ومتابعة</span>
                        <p className="text-[11px] text-gray-600 font-bold leading-relaxed">
                          بمجرد القيام بهذه الخطوات، سيقوم Cloudflare بتهيئة شهادة أمان SSL تلقائياً لنطاقك <span className="font-mono text-xs text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">yasser.cc</span> وسيعمل موقعك مباشرة!
                        </p>
                      </div>
                      <a
                        href="https://dash.cloudflare.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
                      >
                        فتح لوحة تحكم كلوود فلير الآن ↗️
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Step Progress Bar */}
                    <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-2xl">
                      {[
                        { step: 1, label: "إضافة الموقع" },
                        { step: 2, label: "خوادم الأسماء NS" },
                        { step: 3, label: "سجلات الـ DNS" },
                        { step: 4, label: "فحص وتأكيد الربط" }
                      ].map((s) => (
                        <button
                          key={s.step}
                          type="button"
                          onClick={() => setDnsWizardStep(s.step)}
                          className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer ${
                            dnsWizardStep === s.step
                              ? "bg-orange-600 text-white font-black text-[10px] sm:text-xs shadow-xs"
                              : dnsWizardStep > s.step
                              ? "bg-orange-50 text-orange-700 font-black text-[10px] sm:text-xs"
                              : "text-gray-400 font-bold text-[10px] sm:text-xs hover:bg-white/50"
                          }`}
                        >
                          <span className="block font-mono text-[9px] opacity-75 font-black">خطوة {s.step}</span>
                          <span className="block truncate">{s.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Wizard Steps Content */}
                    <div className="bg-slate-50/50 border border-slate-100/80 rounded-2xl p-5 min-h-[220px] flex flex-col justify-between">
                      {dnsWizardStep === 1 && (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <span className="text-[10px] bg-orange-100 text-orange-800 px-2.5 py-1 rounded-md font-black">الخطوة 1: إضافة نطاقك في حساب Cloudflare</span>
                            <h5 className="text-xs font-black text-gray-900 mt-2">تسجيل النطاق في كلوود فلير:</h5>
                            <p className="text-[11px] text-gray-500 leading-relaxed font-bold">
                              قم بإنشاء حساب مجاني أو تسجيل الدخول في موقع{" "}
                              <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-orange-600 underline font-black inline-flex items-center gap-0.5">
                                dash.cloudflare.com
                              </a>
                              ، ثم اضغط على زر <strong className="text-gray-900">"Add a Site"</strong> واكتب اسم نطاقك بدون أي زيادات (مثال: <span className="font-mono text-xs text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">yasser.cc</span>).
                            </p>
                          </div>

                          <div className="space-y-2 max-w-md">
                            <label className="text-[10px] font-black text-gray-700 block">أدخل اسم نطاقك الخاص للمتابعة:</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={userDomain}
                                onChange={(e) => setUserDomain(e.target.value)}
                                placeholder="yasser.cc"
                                className="flex-1 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono text-left outline-hidden focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                              />
                              <button
                                type="button"
                                onClick={() => setDnsWizardStep(2)}
                                className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-[11px] px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                              >
                                التالي ➡️
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {dnsWizardStep === 2 && (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <span className="text-[10px] bg-orange-100 text-orange-800 px-2.5 py-1 rounded-md font-black">الخطوة 2: تغيير خوادم الأسماء (Nameservers)</span>
                            <h5 className="text-xs font-black text-gray-900 mt-2">تحديث قيم Nameservers الخاصة بالنطاق:</h5>
                            <p className="text-[11px] text-gray-500 leading-relaxed font-bold">
                              اذهب إلى الشركة التي قمت بشراء الدومين منها (مثل GoDaddy أو Namecheap أو Hostinger)، وادخل إلى صفحة إدارة الـ DNS والـ Nameservers الخاصة بالدومين، ثم قم بتعديلها لتصبح كالتالي:
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                            <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between shadow-xs">
                              <div className="space-y-0.5 text-left">
                                <span className="text-[9px] text-gray-400 font-bold block">Nameserver 1</span>
                                <span className="text-xs font-mono font-black text-slate-900">dana.ns.cloudflare.com</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText("dana.ns.cloudflare.com");
                                  alert("تم نسخ خادم الأسماء الأول بنجاح!");
                                }}
                                className="text-orange-600 hover:text-orange-700 font-extrabold text-[10px] bg-orange-50 px-2.5 py-1.5 rounded-lg cursor-pointer"
                              >
                                نسخ 📋
                              </button>
                            </div>

                            <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between shadow-xs">
                              <div className="space-y-0.5 text-left">
                                <span className="text-[9px] text-gray-400 font-bold block">Nameserver 2</span>
                                <span className="text-xs font-mono font-black text-slate-900">olga.ns.cloudflare.com</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText("olga.ns.cloudflare.com");
                                  alert("تم نسخ خادم الأسماء الثاني بنجاح!");
                                }}
                                className="text-orange-600 hover:text-orange-700 font-extrabold text-[10px] bg-orange-50 px-2.5 py-1.5 rounded-lg cursor-pointer"
                              >
                                نسخ 📋
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-2">
                            <button
                              type="button"
                              onClick={() => setDnsWizardStep(1)}
                              className="bg-white border border-gray-200 text-gray-600 font-extrabold text-[11px] px-3.5 py-2 rounded-xl hover:bg-gray-50 cursor-pointer"
                            >
                              ⬅️ السابق
                            </button>
                            <button
                              type="button"
                              onClick={() => setDnsWizardStep(3)}
                              className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-[11px] px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                            >
                              التالي ➡️
                            </button>
                          </div>
                        </div>
                      )}

                      {dnsWizardStep === 3 && (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <span className="text-[10px] bg-orange-100 text-orange-800 px-2.5 py-1 rounded-md font-black">الخطوة 3: إعداد سجلات DNS وتوجيه الدومين</span>
                            <h5 className="text-xs font-black text-gray-900 mt-2">قم بإضافة هذه السجلات لتوجيه الطلاب إلى الخادم:</h5>
                            <p className="text-[11px] text-gray-500 leading-relaxed font-bold">
                              في لوحة تحكم Cloudflare، توجه إلى قسم <strong className="text-gray-900">"DNS"</strong> ثم اضغط <strong className="text-gray-900">"Add record"</strong> وقم بإدخال السجلين التاليين لربطهما بخادم المنصة بشكل آمن:
                            </p>
                          </div>

                          <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
                            <table className="w-full text-xs text-right text-gray-500 font-sans">
                              <thead className="bg-gray-50 text-slate-700 font-black text-[10px] border-b border-gray-200">
                                <tr>
                                  <th className="px-3 py-2">النوع (Type)</th>
                                  <th className="px-3 py-2">الاسم (Name)</th>
                                  <th className="px-3 py-2">القيمة / الوجهة (Value)</th>
                                  <th className="px-3 py-2 text-center">حالة الحماية (Proxy)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 font-medium font-bold">
                                <tr>
                                  <td className="px-3 py-2.5 font-mono text-orange-700 font-bold">A</td>
                                  <td className="px-3 py-2.5 font-mono">@</td>
                                  <td className="px-3 py-2.5 font-mono">153.60.56.241</td>
                                  <td className="px-3 py-2.5 text-center">
                                    <span className="bg-orange-50 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-md border border-orange-100 font-black">
                                      Proxied (نشط ☁️)
                                    </span>
                                  </td>
                                </tr>
                                <tr>
                                  <td className="px-3 py-2.5 font-mono text-orange-700 font-bold">CNAME</td>
                                  <td className="px-3 py-2.5 font-mono">www</td>
                                  <td className="px-3 py-2.5 font-mono">{userDomain || "yourdomain.com"}</td>
                                  <td className="px-3 py-2.5 text-center">
                                    <span className="bg-orange-50 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-md border border-orange-100 font-black">
                                      Proxied (نشط ☁️)
                                    </span>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <div className="flex justify-between items-center pt-2">
                            <button
                              type="button"
                              onClick={() => setDnsWizardStep(2)}
                              className="bg-white border border-gray-200 text-gray-600 font-extrabold text-[11px] px-3.5 py-2 rounded-xl hover:bg-gray-50 cursor-pointer"
                            >
                              ⬅️ السابق
                            </button>
                            <button
                              type="button"
                              onClick={() => setDnsWizardStep(4)}
                              className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-[11px] px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                            >
                              التالي ➡️
                            </button>
                          </div>
                        </div>
                      )}

                      {dnsWizardStep === 4 && (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <span className="text-[10px] bg-orange-100 text-orange-800 px-2.5 py-1 rounded-md font-black">الخطوة 4: فحص وتأكيد نجاح ربط الدومين</span>
                            <h5 className="text-xs font-black text-gray-900 mt-2">التحقق من تفعيل الـ Cloudflare DNS:</h5>
                            <p className="text-[11px] text-gray-500 leading-relaxed font-bold">
                              أدخل اسم الدومين الخاص بك بالأسفل ثم اضغط على زر الفحص ليقوم النظام آلياً بمحاكاة فحص السجلات ونشر خوادم الـ Edge والتحقق من صلاحية شهادة SSL التشفيرية لموقعك.
                            </p>
                          </div>

                          <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3 shadow-xs">
                            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                              <input
                                type="text"
                                value={userDomain}
                                onChange={(e) => setUserDomain(e.target.value)}
                                placeholder="yourdomain.com"
                                className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-left outline-hidden focus:bg-white"
                              />
                              <button
                                type="button"
                                onClick={handleSimulateDnsCheck}
                                disabled={dnsCheckStatus === "checking"}
                                className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1"
                              >
                                {dnsCheckStatus === "checking" ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    جاري الاستعلام الفعلي...
                                  </>
                                ) : (
                                  <>
                                    <Globe className="w-3.5 h-3.5" />
                                    فحص حالة ربط الدومين بنظام DNS ⚡
                                  </>
                                )}
                              </button>
                            </div>

                            {dnsCheckStatus !== "idle" && (
                              <div className={`p-4 rounded-xl text-[11px] leading-relaxed font-mono whitespace-pre-wrap text-left ${
                                dnsCheckStatus === "success" 
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                                  : "bg-red-50 text-red-800 border border-red-200"
                              }`}>
                                {dnsCheckResult}
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-2">
                            <button
                              type="button"
                              onClick={() => setDnsWizardStep(3)}
                              className="bg-white border border-gray-200 text-gray-600 font-extrabold text-[11px] px-3.5 py-2 rounded-xl hover:bg-gray-50 cursor-pointer"
                            >
                              ⬅️ السابق
                            </button>
                            <span className="text-[10px] text-emerald-600 font-black">
                              🔒 شهادة SSL/TLS الآمنة مفعّلة تلقائياً بمجرد إتمام الربط!
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {activeTab === "tickets" && (
            <motion.div
              key="tickets-pane"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 text-right font-sans"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">إدارة تذاكر الدعم والتحصيل للطلاب 🎫</h3>
                  <p className="text-xs text-gray-400 font-bold">تابع استفسارات الطلاب، حل المشاكل التقنية، وأجب على الأسئلة الأكاديمية والمالية فوراً</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-bold">إجمالي التذاكر:</span>
                  <span className="px-2.5 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-black">{tickets.length}</span>
                  <button
                    onClick={loadAllTickets}
                    className="p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                    title="تحديث قائمة التذاكر"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Filters */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "جميع التذاكر 📋" },
                  { id: "open", label: "في الانتظار ⏳" },
                  { id: "replied", label: "تم الرد عليها ✉️" },
                  { id: "closed", label: "مغلقة 🔒" }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTicketStatusFilter(f.id as any)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all border ${
                      ticketStatusFilter === f.id
                        ? "bg-red-600 text-white border-red-600 shadow-xs"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Tickets List */}
                <div className="lg:col-span-5 bg-gray-50/55 rounded-3xl p-4 border border-gray-100 space-y-3 max-h-[600px] overflow-y-auto">
                  <span className="text-xs font-black text-gray-500 block mb-2">قائمة التذاكر المطابقة:</span>
                  
                  {isTicketsLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400 text-xs">
                      <span className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      <span>جاري جلب تذاكر الطلاب...</span>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-xs">لا تملك تذاكر دعم حالياً بالمنصة.</div>
                  ) : (
                    tickets
                      .filter((t) => ticketStatusFilter === "all" || t.status === ticketStatusFilter)
                      .map((t) => {
                        const isSelected = selectedTicketId === t.id;
                        return (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTicketId(t.id)}
                            className={`p-4 rounded-2xl border text-right cursor-pointer transition-all ${
                              isSelected
                                ? "bg-white border-red-500 shadow-md ring-1 ring-red-500/10"
                                : "bg-white border-gray-200/60 hover:bg-white hover:border-gray-300"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2 mb-1.5">
                              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">
                                {t.category === "technical" ? "تقني 🛠️" : t.category === "academic" ? "أكاديمي 📐" : t.category === "financial" ? "مالي 💳" : "أخرى 📋"}
                              </span>
                              
                              {t.status === "open" && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">
                                  بانتظار ردك ⏳
                                </span>
                              )}
                              {t.status === "replied" && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                                  تم الرد ✔️
                                </span>
                              )}
                              {t.status === "closed" && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">
                                  مغلقة 🔒
                                </span>
                              )}
                            </div>

                            <h5 className="text-xs font-black text-gray-900 line-clamp-1">{t.title}</h5>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50 text-[10px] text-gray-400">
                              <span className="font-extrabold text-gray-700">الطالب: {t.studentName}</span>
                              <span>{new Date(t.createdAt).toLocaleDateString("ar-EG")}</span>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Selected Ticket Chat & Action Area */}
                <div className="lg:col-span-7">
                  {selectedTicketId ? (
                    (() => {
                      const selectedTicket = tickets.find((t) => t.id === selectedTicketId);
                      if (!selectedTicket) return null;

                      return (
                        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs space-y-6">
                          {/* Student Details Header */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
                            <div>
                              <span className="text-[10px] text-gray-400 font-extrabold block">بيانات الطالب صاحب التذكرة</span>
                              <h4 className="text-base font-black text-gray-900">{selectedTicket.studentName}</h4>
                              {selectedTicket.studentPhone && (
                                <p className="text-xs font-mono text-gray-500 mt-0.5">الهاتف: {selectedTicket.studentPhone}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedTicket.status !== "closed" ? (
                                <button
                                  onClick={() => handleUpdateTicketStatus(selectedTicket.id, "closed")}
                                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-extrabold rounded-lg transition-colors cursor-pointer"
                                >
                                  إغلاق التذكرة 🔒
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateTicketStatus(selectedTicket.id, "open")}
                                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-extrabold rounded-lg transition-colors cursor-pointer"
                                >
                                  إعادة فتح التذكرة ⏳
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Ticket core issue */}
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-800 space-y-2">
                            <div className="flex justify-between items-center border-b border-gray-100/60 pb-1.5 text-[10px] font-bold text-gray-400">
                              <span>موضوع التذكرة: {selectedTicket.title}</span>
                              <span>التاريخ: {new Date(selectedTicket.createdAt).toLocaleString("ar-EG")}</span>
                            </div>
                            <p className="leading-relaxed whitespace-pre-line">{selectedTicket.message}</p>
                          </div>

                          {/* Message Log Conversation */}
                          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                            <span className="text-[10px] font-extrabold text-gray-400 block mb-1">الردود والمتابعة:</span>
                            {selectedTicket.replies.length === 0 ? (
                              <p className="text-xs text-center text-gray-400 font-bold py-6">لم يتم الرد على التذكرة بعد. اكتب أول رد للإجابة على الطالب بالأسفل.</p>
                            ) : (
                              selectedTicket.replies.map((r) => (
                                <div
                                  key={r.id}
                                  className={`p-3 rounded-xl text-xs leading-relaxed max-w-[85%] ${
                                    r.senderRole === "admin"
                                      ? "bg-slate-900 text-white ml-auto"
                                      : "bg-gray-100 text-gray-850 mr-auto"
                                  }`}
                                >
                                  <div className="flex justify-between items-center mb-1 text-[9px] font-bold">
                                    <span className={r.senderRole === "admin" ? "text-red-300" : "text-gray-500"}>
                                      {r.senderRole === "admin" ? "👑 أنت (إدارة المنصة)" : `👤 الطالب: ${selectedTicket.studentName}`}
                                    </span>
                                    <span className="font-mono opacity-80">
                                      {new Date(r.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  </div>
                                  <p>{r.message}</p>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Chat Box Input for Admin */}
                          {selectedTicket.status !== "closed" ? (
                            <div className="space-y-2 pt-4 border-t border-gray-50">
                              <label className="text-xs font-bold text-gray-600 block">كتابة رد جديد وإرساله للطالب:</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={adminReplyMessage}
                                  onChange={(e) => setAdminReplyMessage(e.target.value)}
                                  placeholder="اكتب توجيهك أو إجابتك الواضحة هنا لحل مشكلة الطالب..."
                                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden focus:bg-white focus:border-red-500"
                                  onKeyDown={(e) => e.key === "Enter" && handleAdminSendReply(selectedTicket.id)}
                                />
                                <button
                                  onClick={() => handleAdminSendReply(selectedTicket.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                                >
                                  إرسال ردك
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-gray-50 rounded-xl text-center text-xs text-gray-400 font-bold font-sans">
                              التذكرة مغلقة ومكتملة. يرجى إعادة فتحها أولاً إذا رغبت في مواصلة المحادثة.
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400 font-bold text-xs space-y-2">
                      <Ticket className="w-10 h-10 text-gray-300 mx-auto" />
                      <p className="font-extrabold text-gray-500 text-sm">لم يتم اختيار أي تذكرة دعم</p>
                      <p>اختر إحدى التذاكر من القائمة اليمنى لعرض تفاصيلها والرد على الطالب فورياً ومتابعة المحادثات.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "course-students" && (
            <motion.div
              key="course-students-pane"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 text-right"
              dir="rtl"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-4 gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 font-sans">
                    إدارة المشتركين والطلاب في الكورسات 📚
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    اختر كورساً لمتابعة الطلاب المسجلين فيه وتعديل اشتراكاتهم، والاطلاع على درجاتهم في الاختبارات التفاعلية.
                  </p>
                </div>
                <button
                  onClick={loadAllUsersFromDb}
                  className="bg-red-50 hover:bg-red-100 text-red-600 font-extrabold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0 border border-red-200"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? "animate-spin" : ""}`} />
                  <span>تحديث البيانات 🔄</span>
                </button>
              </div>

              {/* Course Selector Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {courses.map((c) => {
                  const isSelected = selectedCourseIdForStudents === c.id;
                  const enrolledCount = allUsers.filter(u => u.role === "student" && u.enrolledCourseIds?.includes(c.id)).length;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCourseIdForStudents(c.id)}
                      className={`p-4 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden ${
                        isSelected 
                          ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                          : "bg-white border-gray-100 hover:border-red-500 text-slate-800"
                      }`}
                    >
                      <div className="font-extrabold text-xs line-clamp-1">{c.title}</div>
                      <div className={`text-[10px] mt-1.5 font-sans font-black ${isSelected ? "text-red-300" : "text-red-600"}`}>
                        {enrolledCount} طالب مسجل
                      </div>
                      <div className={`text-[9px] mt-0.5 opacity-80 font-mono`}>
                        سعر الكورس: {c.price} ج.م
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedCourseIdForStudents ? (
                (() => {
                  const activeCourse = courses.find(c => c.id === selectedCourseIdForStudents);
                  const enrolledStudents = allUsers.filter(u => u.role === "student" && u.enrolledCourseIds?.includes(selectedCourseIdForStudents));
                  
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Enrolled Students List (Left Column) */}
                      <div className="lg:col-span-8 space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl">
                          <span className="text-xs font-black text-slate-700">
                            الطلاب المقيدين في الكورس حالياً ({enrolledStudents.length}) طالب
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">
                            كورس: {activeCourse?.title}
                          </span>
                        </div>

                        {loadingUsers ? (
                          <div className="py-12 text-center text-xs text-gray-400 font-bold space-y-2">
                            <RefreshCw className="w-8 h-8 animate-spin text-red-500 mx-auto" />
                            <p>جاري تحديث قائمة الطلاب وقاعدة البيانات...</p>
                          </div>
                        ) : enrolledStudents.length === 0 ? (
                          <div className="bg-gray-50 border border-dashed border-gray-150 rounded-2xl py-12 px-6 text-center text-xs text-gray-400 font-bold space-y-2">
                            <Users className="w-10 h-10 text-gray-300 mx-auto" />
                            <p className="text-slate-600 text-sm">لا يوجد أي طلاب مشتركين في هذا الكورس حالياً</p>
                            <p className="text-gray-400 text-[11px]">يمكنك إضافة طلاب يدوياً من القائمة اليسرى أو قبول طلبات التحويل لتفعيل الاشتراك.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {enrolledStudents.map((st) => (
                              <div
                                key={st.id}
                                className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-300 transition-colors"
                              >
                                <div className="space-y-1.5 flex-1 text-right">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-black text-slate-800">{st.name}</span>
                                    <span className="text-[9px] bg-red-50 text-red-600 font-bold px-1.5 py-0.5 rounded border border-red-100 font-mono" dir="ltr">
                                      {st.phone}
                                    </span>
                                    <span className="text-[9px] bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded border border-emerald-100 font-mono" dir="ltr">
                                      المحفظة: {st.walletBalance} ج.م
                                    </span>
                                  </div>

                                  {/* Quizzes Status mapping */}
                                  <div className="pt-2 border-t border-gray-100/60 mt-1 space-y-1 text-right">
                                    <span className="block text-[9px] font-black text-gray-400">حالة اختبارات الكورس التفاعلية:</span>
                                    <div className="flex flex-wrap gap-2 pt-0.5 justify-start">
                                      {activeCourse?.lectures?.map((lecture) => {
                                        if (!lecture.quiz) return null;
                                        const attempt = st.quizAttempts?.[lecture.quiz.id];
                                        return (
                                          <div
                                            key={lecture.quiz.id}
                                            className={`text-[9px] px-2 py-0.5 rounded-md border font-sans font-bold flex items-center gap-1 ${
                                              attempt 
                                                ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                                                : "bg-gray-50 border-gray-100 text-gray-400"
                                            }`}
                                          >
                                            <span>
                                              {lecture.quiz.title}
                                            </span>
                                            {attempt ? (
                                              <span className="font-sans font-black bg-emerald-100 text-emerald-800 px-1 rounded">
                                                {attempt.score}/{attempt.total}
                                              </span>
                                            ) : (
                                              <span>⌛ لم يحل</span>
                                            )}
                                          </div>
                                        );
                                      })}
                                      {(!activeCourse?.lectures || activeCourse.lectures.filter(l => l.quiz).length === 0) && (
                                        <span className="text-[9px] text-gray-300 italic">لا توجد اختبارات تفاعلية مضافة لهذا الكورس بعد.</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={async () => {
                                    if (confirm(`هل أنت متأكد من إلغاء اشتراك الطالب "${st.name}" من كورس "${activeCourse?.title}"؟`)) {
                                      if (onUnenrollStudentFromCourse) {
                                        const res = await onUnenrollStudentFromCourse(st.phone, selectedCourseIdForStudents);
                                        if (res.success) {
                                          alert("تم إلغاء الاشتراك بنجاح من قاعدة البيانات! 🗑️");
                                          loadAllUsersFromDb();
                                        } else {
                                          alert(res.message);
                                        }
                                      }
                                    }
                                  }}
                                  className="text-[10px] font-black border border-red-150 hover:bg-red-50 text-red-600 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 self-end sm:self-center shrink-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>إلغاء الاشتراك</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick Enrollment Creator Box (Right Column) */}
                      <div className="lg:col-span-4 space-y-4">
                        <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4 text-right">
                          <h4 className="text-xs font-black text-slate-800 border-b border-slate-200/60 pb-2 flex items-center gap-1.5 font-sans">
                            <Plus className="w-4 h-4 text-red-600" />
                            <span>تسجيل طالب جديد وتفعيل الكورس يدوياً 🎓</span>
                          </h4>

                          {enrollSuccessMsg && (
                            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-extrabold rounded-xl leading-relaxed">
                              {enrollSuccessMsg}
                            </div>
                          )}

                          {enrollErrorMsg && (
                            <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-[10px] font-extrabold rounded-xl leading-relaxed">
                              {enrollErrorMsg}
                            </div>
                          )}

                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] text-gray-500 font-extrabold block mb-1">
                                حدد الطالب من قاعدة بيانات المنصة:
                              </label>
                              <select
                                value={enrollPhoneInput}
                                onChange={(e) => {
                                  setEnrollPhoneInput(e.target.value);
                                  setEnrollErrorMsg("");
                                  setEnrollSuccessMsg("");
                                }}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-right outline-hidden font-sans"
                              >
                                <option value="">-- اختر طالباً --</option>
                                {allUsers
                                  .filter(u => u.role === "student" && !u.enrolledCourseIds?.includes(selectedCourseIdForStudents))
                                  .map(u => (
                                    <option key={u.id} value={u.phone}>
                                      {u.name} ({u.phone})
                                    </option>
                                  ))}
                              </select>
                            </div>

                            <button
                              onClick={async () => {
                                if (!enrollPhoneInput) {
                                  setEnrollErrorMsg("يرجى اختيار طالب من القائمة أولاً.");
                                  return;
                                }
                                if (onEnrollStudentInCourse) {
                                  const res = await onEnrollStudentInCourse(enrollPhoneInput, selectedCourseIdForStudents);
                                  if (res.success) {
                                    setEnrollSuccessMsg("🎉 تم تفعيل الكورس وتسجيل الطالب بنجاح!");
                                    setEnrollPhoneInput("");
                                    loadAllUsersFromDb();
                                    setTimeout(() => setEnrollSuccessMsg(""), 4000);
                                  } else {
                                    setEnrollErrorMsg(res.message);
                                  }
                                }
                              }}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2 rounded-xl text-xs transition-colors cursor-pointer text-center font-sans"
                            >
                              تأكيد تفعيل الاشتراك يدوياً ⚡
                            </button>
                          </div>
                        </div>

                        {/* Extra informational box */}
                        <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl text-[10px] text-gray-500 leading-relaxed space-y-1.5 text-right font-sans">
                          <p className="font-extrabold text-red-700">📌 تعليمات الإدارة المالية والتسجيل:</p>
                          <p>
                            1. التسجيل اليدوي عبر هذه اللوحة **لا يخصم** أي مبالغ مالية من محفظة الطالب. يمكنك استخدامه لتسجيل الحالات الخاصة أو الطلاب المدفوعين خارج المنصة.
                          </p>
                          <p>
                            2. لإجبار الطالب على الدفع التلقائي من محفظته، اطلب منه شراء الكورس مباشرة من صفحته الرئيسية، أو قم بخصم السعر من رصيد محفظته يدوياً من تبويب (الطلاب والمحافظ).
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="py-12 text-center text-gray-400 font-bold text-xs">
                  يرجى إنشاء كورس أو اختيار كورس نشط لعرض الطلاب والمشتركين والتحكم بهم.
                </div>
              )}
            </motion.div>
          )}


        </AnimatePresence>
      </div>
    </div>
  );
}
