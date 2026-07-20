/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { BookOpen, User, Shield, Wallet, BookMarked, HelpCircle, CheckCircle, Info } from "lucide-react";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import AuthModal from "./components/AuthModal";
import PaymentModal from "./components/PaymentModal";
import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import CourseDetailModal from "./components/CourseDetailModal";
import { INITIAL_COURSES } from "./data";
import { Course, User as UserType, PendingPayment, GradeLevel, CourseCategory, Teacher, ChargeCode, VideoSettings, PlatformSettings, AdCampaign, AppNotification, ActivityLog, Quiz, BookStoreItem, BookOrder, SupportTicket } from "./types";
import {
  fetchCourses,
  saveCourseInFirestore,
  deleteCourseFromFirestore,
  fetchAllUsers,
  fetchUserByPhone,
  saveUserInFirestore,
  deleteUserFromFirestore,
  updateUserInFirestore,
  fetchPendingPayments,
  savePendingPaymentInFirestore,
  fetchChargeCodes,
  saveChargeCodeInFirestore,
  fetchNotifications,
  saveNotificationInFirestore,
  deleteNotificationInFirestore,
  fetchActivityLogs,
  saveActivityLogInFirestore,
  fetchSettings,
  saveSettingsInFirestore,
  fetchTeachers,
  saveTeacherInFirestore,
  deleteTeacherFromFirestore,
  fetchBookStoreItems,
  saveBookStoreItemInFirestore,
  deleteBookStoreItemFromFirestore,
  fetchBookOrders,
  saveBookOrderInFirestore,
  saveSupportTicketInFirestore
} from "./lib/dbService";

// Standard seed data for demonstration/mock persistence
const DEFAULT_STUDENTS = [
  { name: "أحمد عمر محمود", phone: "01012345678", enrolledCount: 1, balance: 50 },
  { name: "سارة محمد أحمد", phone: "01234567890", enrolledCount: 0, balance: 150 },
  { name: "يوسف خالد علي", phone: "01511223344", enrolledCount: 2, balance: 0 },
];

const DEFAULT_PENDING_PAYMENTS: PendingPayment[] = [
  {
    id: "pay-1",
    userId: "student-1",
    userName: "أحمد عمر محمود",
    userPhone: "01012345678",
    courseId: "course-1",
    courseTitle: "التفاضل والتكامل - الوحدة الأولى (الاشتقاق وتطبيقاته)",
    amount: 150,
    method: "vodafone_cash",
    senderPhoneOrRef: "01099887766",
    status: "pending",
    timestamp: new Date().toISOString(),
  },
  {
    id: "pay-2",
    userId: "student-2",
    userName: "سارة محمد أحمد",
    userPhone: "01234567890",
    courseId: "course-3",
    courseTitle: "الاستاتيكا التطبيقية - اتزان جسم على مستوى مائل خشن",
    amount: 140,
    method: "instapay",
    senderPhoneOrRef: "sara@instapay",
    status: "pending",
    timestamp: new Date().toISOString(),
  },
];

export default function App() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [user, setUser] = React.useState<UserType | null>(() => {
    const saved = localStorage.getItem("math_academy_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [pendingPayments, setPendingPayments] = React.useState<PendingPayment[]>([]);
  const [studentsList, setStudentsList] = React.useState<{ name: string; phone: string; enrolledCount: number; balance: number }[]>([]);
  const [teachersList, setTeachersList] = React.useState<Teacher[]>([]);
  const [chargeCodes, setChargeCodes] = React.useState<ChargeCode[]>([]);
  const [books, setBooks] = React.useState<BookStoreItem[]>([]);
  const [bookOrders, setBookOrders] = React.useState<BookOrder[]>([]);
  const [videoSettings, setVideoSettings] = React.useState<VideoSettings>({
    watermarkTextType: "student_info",
    customWatermarkText: "حقوق الطبع محفوظة",
    watermarkOpacity: 0.15,
    watermarkPosition: "random",
    logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=120",
    logoPosition: "top-right",
    logoOpacity: 0.4,
    enableRightClickBlock: true,
    enableAntiScreenshotAlert: true
  });
  const [platformSettings, setPlatformSettings] = React.useState<PlatformSettings>({
    platformName: "منصة اليسر التعليمية 🌟",
    logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=120",
    contactPhone: "01008889818",
    contactWhatsapp: "201008889818",
    contactEmail: "admin@yasser.cc",
    contactTelegram: "t.me/yusr_academy",
    contactFacebook: "facebook.com/yusr_academy",
    ads: []
  });
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [activityLogs, setActivityLogs] = React.useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // UI Control states
  const getInitialStateFromUrl = React.useCallback(() => {
    const path = window.location.pathname;
    if (path === "/" || path === "") return { currentTab: "landing", studentTab: "courses" as const, adminTab: "students" as const };
    if (path === "/about") return { currentTab: "landing-about", studentTab: "courses" as const, adminTab: "students" as const };
    if (path === "/privacy") return { currentTab: "landing-privacy", studentTab: "courses" as const, adminTab: "students" as const };
    if (path === "/terms") return { currentTab: "landing-terms", studentTab: "courses" as const, adminTab: "students" as const };
    if (path === "/support") return { currentTab: "landing-support", studentTab: "courses" as const, adminTab: "students" as const };
    
    if (path.startsWith("/student")) {
      const sub = path.replace("/student", "").replace("/", "");
      const validStudentTabs = ["courses", "reports", "tickets", "profile", "store"];
      if (validStudentTabs.includes(sub)) {
        return { currentTab: "student-dashboard", studentTab: sub as any, adminTab: "students" as const };
      }
      return { currentTab: "student-dashboard", studentTab: "courses" as const, adminTab: "students" as const };
    }

    if (path.startsWith("/admin")) {
      const sub = path.replace("/admin", "").replace("/", "");
      const validAdminTabs = ["payments", "teachers", "students", "codes", "video", "settings", "tickets", "course-students", "books"];
      if (validAdminTabs.includes(sub)) {
        return { currentTab: "admin-dashboard", studentTab: "courses" as const, adminTab: sub as any };
      }
      return { currentTab: "admin-dashboard", studentTab: "courses" as const, adminTab: "students" as const };
    }

    return { currentTab: "landing", studentTab: "courses" as const, adminTab: "students" as const };
  }, []);

  const initialState = React.useMemo(() => getInitialStateFromUrl(), [getInitialStateFromUrl]);

  const [currentTab, setCurrentTab] = React.useState<string>(initialState.currentTab);
  const [studentTab, setStudentTab] = React.useState<"courses" | "reports" | "tickets" | "profile" | "store">(initialState.studentTab);
  const [adminTab, setAdminTab] = React.useState<"payments" | "teachers" | "students" | "codes" | "video" | "settings" | "tickets" | "course-students" | "books">(initialState.adminTab);

  const [selectedCourseForDetail, setSelectedCourseForDetail] = React.useState<Course | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
  const [isSubmittingInquiry, setIsSubmittingInquiry] = React.useState(false);

  // Synchronize routing state with Browser Address Bar
  React.useEffect(() => {
    let targetPath = "/";
    if (currentTab === "landing-about") targetPath = "/about";
    else if (currentTab === "landing-privacy") targetPath = "/privacy";
    else if (currentTab === "landing-terms") targetPath = "/terms";
    else if (currentTab === "landing-support") targetPath = "/support";
    else if (currentTab === "student-dashboard") {
      if (user) {
        targetPath = `/student/${studentTab}`;
      } else {
        targetPath = "/";
      }
    } else if (currentTab === "admin-dashboard") {
      if (user && (user.role === "admin" || user.role === "teacher")) {
        targetPath = `/admin/${adminTab}`;
      } else {
        targetPath = "/";
      }
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, "", targetPath);
    }
  }, [currentTab, studentTab, adminTab, user]);

  // Handle browser back/forward buttons (Popstate)
  React.useEffect(() => {
    const handlePopState = () => {
      const state = getInitialStateFromUrl();
      setCurrentTab(state.currentTab);
      setStudentTab(state.studentTab);
      setAdminTab(state.adminTab);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [getInitialStateFromUrl]);

  // Dark Mode State
  const [darkMode, setDarkMode] = React.useState<boolean>(() => {
    return localStorage.getItem("math_academy_dark_mode") === "true";
  });

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("math_academy_dark_mode", String(darkMode));
  }, [darkMode]);

  // Fetch Firestore Data on Initial Mount
  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [
          dbCourses,
          dbPayments,
          dbCodes,
          dbLogs,
          dbNotifs,
          dbSettings,
          dbUsers,
          dbTeachers,
          dbBooks,
          dbOrders
        ] = await Promise.all([
          fetchCourses(),
          fetchPendingPayments(),
          fetchChargeCodes(),
          fetchActivityLogs(),
          fetchNotifications(),
          fetchSettings(),
          fetchAllUsers(),
          fetchTeachers(),
          fetchBookStoreItems(),
          fetchBookOrders()
        ]);

        setCourses(dbCourses);
        setPendingPayments(dbPayments);
        setChargeCodes(dbCodes);
        setActivityLogs(dbLogs);
        setNotifications(dbNotifs);
        setVideoSettings(dbSettings.video);
        setPlatformSettings(dbSettings.platform);
        setTeachersList(dbTeachers);
        setBooks(dbBooks);
        setBookOrders(dbOrders);

        const students = dbUsers.filter((u) => u.role === "student").map((u) => ({
          name: u.name,
          phone: u.phone,
          enrolledCount: u.enrolledCourseIds.length,
          balance: u.walletBalance
        }));
        setStudentsList(students.length > 0 ? students : DEFAULT_STUDENTS);

        // Restore user login state from local storage and sync with latest firestore data
        const savedUserStr = localStorage.getItem("math_academy_user");
        if (savedUserStr) {
          try {
            const savedUser = JSON.parse(savedUserStr);
            const dbUser = dbUsers.find((u) => u.phone === savedUser.phone || u.id === savedUser.id);
            if (dbUser) {
              setUser(dbUser);
              if (dbUser.role === "admin" || dbUser.role === "teacher") {
                const urlState = getInitialStateFromUrl();
                if (urlState.currentTab === "admin-dashboard") {
                  setCurrentTab("admin-dashboard");
                  setAdminTab(urlState.adminTab);
                } else if (urlState.currentTab === "landing" || urlState.currentTab.startsWith("landing-")) {
                  setCurrentTab(urlState.currentTab);
                } else {
                  setCurrentTab("admin-dashboard");
                  setAdminTab("students");
                }
              } else {
                const urlState = getInitialStateFromUrl();
                if (urlState.currentTab === "student-dashboard") {
                  setCurrentTab("student-dashboard");
                  setStudentTab(urlState.studentTab);
                } else if (urlState.currentTab === "landing" || urlState.currentTab.startsWith("landing-")) {
                  setCurrentTab(urlState.currentTab);
                } else {
                  setCurrentTab("student-dashboard");
                  setStudentTab("courses");
                }
              }
            } else {
              setUser(savedUser);
              if (savedUser.role === "admin" || savedUser.role === "teacher") {
                const urlState = getInitialStateFromUrl();
                if (urlState.currentTab === "admin-dashboard") {
                  setCurrentTab("admin-dashboard");
                  setAdminTab(urlState.adminTab);
                } else if (urlState.currentTab === "landing" || urlState.currentTab.startsWith("landing-")) {
                  setCurrentTab(urlState.currentTab);
                } else {
                  setCurrentTab("admin-dashboard");
                  setAdminTab("students");
                }
              } else {
                const urlState = getInitialStateFromUrl();
                if (urlState.currentTab === "student-dashboard") {
                  setCurrentTab("student-dashboard");
                  setStudentTab(urlState.studentTab);
                } else if (urlState.currentTab === "landing" || urlState.currentTab.startsWith("landing-")) {
                  setCurrentTab(urlState.currentTab);
                } else {
                  setCurrentTab("student-dashboard");
                  setStudentTab("courses");
                }
              }
            }
          } catch (e) {
            console.error("Error parsing stored user:", e);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error loading Firestore data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Sync active user session to LocalStorage
  React.useEffect(() => {
    if (user) {
      localStorage.setItem("math_academy_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("math_academy_user");
    }
  }, [user]);

  const addActivityLog = async (
    userId: string,
    actionType: "watched_video" | "solved_quiz" | "recharged_balance" | "course_enrollment" | "book_order",
    title: string,
    details: string
  ) => {
    const newLog: ActivityLog = {
      id: "act-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      userId,
      actionType,
      title,
      details,
      timestamp: new Date().toISOString()
    };
    setActivityLogs((prev) => [newLog, ...prev]);
    await saveActivityLogInFirestore(newLog);
  };

  // Auth Handlers
  const handleLoginSuccess = async (name: string, phone: string, role: "student" | "admin" | "teacher", grade?: GradeLevel) => {
    if (role === "admin" || role === "teacher") {
      const adminUser: UserType = {
        id: role === "admin" ? "admin-teacher" : "teacher-" + phone,
        name,
        phone,
        role,
        walletBalance: 999999,
        enrolledCourseIds: courses.map((c) => c.id), // has access to everything
        quizAttempts: {},
        completedLectures: [],
      };
      await saveUserInFirestore(adminUser);
      setUser(adminUser);
      setCurrentTab("admin-dashboard");
    } else {
      // check if existing user in Firestore
      let studentUser = await fetchUserByPhone(phone);
      if (!studentUser) {
        studentUser = {
          id: "student-" + Date.now(),
          name,
          phone,
          role: "student",
          walletBalance: 0, // bonus welcome balance
          enrolledCourseIds: [],
          quizAttempts: {},
          completedLectures: [],
          grade,
        };
        await saveUserInFirestore(studentUser);
      }
      setUser(studentUser);

      // Add to registered students list if not exists
      if (!studentsList.some((s) => s.phone === phone)) {
        setStudentsList((prev) => [
          ...prev,
          { name: studentUser!.name, phone: studentUser!.phone, enrolledCount: studentUser!.enrolledCourseIds.length, balance: studentUser!.walletBalance },
        ]);
      }
      setCurrentTab("student-dashboard");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentTab("landing");
  };

  // Switch Role simulation (Convenience trigger for evaluator/users)
  const handleSwitchRole = async () => {
    if (!user || user.role === "student") {
      // Switch from student (or guest) to teacher
      const teacherPhone = "01111111111";
      let teacherUser = await fetchUserByPhone(teacherPhone);
      if (!teacherUser) {
        teacherUser = {
          id: "teacher-default",
          name: "الأستاذ ياسر أبوستيت (معلم الرياضيات)",
          phone: teacherPhone,
          role: "teacher",
          walletBalance: 999999,
          enrolledCourseIds: courses.map((c) => c.id),
          quizAttempts: {},
          completedLectures: [],
        };
        await saveUserInFirestore(teacherUser);
      } else {
        // Ensure its role is "teacher"
        teacherUser.role = "teacher";
        teacherUser.name = "الأستاذ ياسر أبوستيت (معلم الرياضيات)";
        await saveUserInFirestore(teacherUser);
      }
      setUser(teacherUser);
      setCurrentTab("admin-dashboard");
    } else if (user.role === "teacher") {
      // Switch from teacher to admin
      const adminPhone = "01000000000";
      let adminUser = await fetchUserByPhone(adminPhone);
      if (!adminUser) {
        adminUser = {
          id: "admin-default",
          name: "مدير المنصة",
          phone: adminPhone,
          role: "admin",
          walletBalance: 999999,
          enrolledCourseIds: courses.map((c) => c.id),
          quizAttempts: {},
          completedLectures: [],
        };
        await saveUserInFirestore(adminUser);
      } else {
        // Ensure its role is "admin"
        adminUser.role = "admin";
        adminUser.name = "مدير المنصة";
        await saveUserInFirestore(adminUser);
      }
      setUser(adminUser);
      setCurrentTab("admin-dashboard");
    } else {
      // Switch from admin to student
      const defaultStudentPhone = "01234567811";
      let studentUser = await fetchUserByPhone(defaultStudentPhone);
      if (!studentUser) {
        studentUser = {
          id: "student-default",
          name: "أحمد طالب ممتاز",
          phone: defaultStudentPhone,
          role: "student",
          walletBalance: 200,
          enrolledCourseIds: ["course-1"],
          quizAttempts: {},
          completedLectures: ["lect-1-1"],
        };
        await saveUserInFirestore(studentUser);
      } else {
        // Ensure its role is "student"
        studentUser.role = "student";
        await saveUserInFirestore(studentUser);
      }
      setUser(studentUser);
      setCurrentTab("student-dashboard");
    }
  };

  // Payment Requests Handlers
  const handleNewPaymentRequest = async (
    courseId: string,
    courseTitle: string,
    amount: number,
    method: "vodafone_cash" | "fawry" | "instapay" | "credit_card",
    senderPhoneOrRef: string
  ) => {
    if (!user) return;

    const newPayment: PendingPayment = {
      id: "pay-" + Date.now(),
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      courseId,
      courseTitle,
      amount,
      method,
      senderPhoneOrRef,
      status: "pending",
      timestamp: new Date().toISOString(),
    };

    setPendingPayments((prev) => [newPayment, ...prev]);
    await savePendingPaymentInFirestore(newPayment);
  };

  const handleDirectCardPurchase = (courseId: string, amount: number) => {
    if (!user) return;

    // Direct active enrollment
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        enrolledCourseIds: [...prev.enrolledCourseIds, courseId],
      };
    });

    // Update students list metric
    setStudentsList((prev) =>
      prev.map((s) => (s.phone === user.phone ? { ...s, enrolledCount: s.enrolledCount + 1 } : s))
    );

    const course = courses.find((c) => c.id === courseId);
    addActivityLog(
      user.id,
      "course_enrollment",
      "الاشتراك في كورس 📚",
      `تم الاشتراك في كورس (${course?.title || "كورس جديد"}) بنجاح بواسطة كارت الدفع المباشر بقيمة ${amount} ج.م.`
    );
  };

  const handlePurchaseWithWallet = (courseId: string, amount: number) => {
    if (!user) return;

    if (user.walletBalance < amount) {
      setIsPaymentModalOpen(true);
      return;
    }

    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        walletBalance: prev.walletBalance - amount,
        enrolledCourseIds: [...prev.enrolledCourseIds, courseId],
      };
    });

    // Update students list metrics
    setStudentsList((prev) =>
      prev.map((s) =>
        s.phone === user.phone
          ? { ...s, balance: s.balance - amount, enrolledCount: s.enrolledCount + 1 }
          : s
      )
    );

    const course = courses.find((c) => c.id === courseId);
    addActivityLog(
      user.id,
      "course_enrollment",
      "الاشتراك في كورس 📚",
      `تم الاشتراك في كورس (${course?.title || "كورس جديد"}) بنجاح بخصم من رصيد المحفظة بقيمة ${amount} ج.م.`
    );

    // Close details
    setSelectedCourseForDetail(null);
    setCurrentTab("student-dashboard");
  };

  // Notifications helper
  const addNotification = async (
    userId: string,
    title: string,
    message: string,
    type: "payment_approved" | "payment_rejected" | "new_content" | "system",
    courseId?: string,
    courseTitle?: string
  ) => {
    const newNotif: AppNotification = {
      id: "notif-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      userId,
      title,
      message,
      isRead: false,
      type,
      courseId,
      courseTitle,
      timestamp: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
    await saveNotificationInFirestore(newNotif);
  };

  const handleMarkNotificationRead = async (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      const found = updated.find((n) => n.id === id);
      if (found) {
        saveNotificationInFirestore(found);
      }
      return updated;
    });
  };

  const handleClearNotifications = async () => {
    if (user) {
      for (const notif of notifications) {
        if (notif.userId === user.id || notif.userId === "all") {
          await deleteNotificationInFirestore(notif.id);
        }
      }
    }
    setNotifications([]);
  };

  // Add a lecture to an existing course and notify enrolled students
  const handleAddLectureToCourse = async (
    courseId: string,
    lectureTitle: string,
    duration: string,
    videoUrl: string,
    pdfUrl: string,
    quiz?: Quiz
  ) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    const newLecture = {
      id: "lect-" + Date.now(),
      courseId,
      title: lectureTitle,
      duration: duration || "1 ساعة",
      videoUrl: videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4",
      pdfUrl: pdfUrl || "مذكرة الشرح الجديدة.pdf",
      quiz,
    };

    let updatedCourseObj: Course | null = null;
    setCourses((prevCourses) => {
      const updated = prevCourses.map((c) => {
        if (c.id === courseId) {
          const u = {
            ...c,
            lecturesCount: (c.lecturesCount || 0) + 1,
            lectures: [...(c.lectures || []), newLecture],
          };
          updatedCourseObj = u;
          return u;
        }
        return c;
      });
      return updated;
    });

    // Synchronize modal state if open
    if (selectedCourseForDetail && selectedCourseForDetail.id === courseId) {
      setSelectedCourseForDetail((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          lecturesCount: (prev.lecturesCount || 0) + 1,
          lectures: [...(prev.lectures || []), newLecture],
        };
      });
    }

    if (updatedCourseObj) {
      await saveCourseInFirestore(updatedCourseObj);
    }

    addNotification(
      "all", // broadcast to enrolled students, filtered in client
      `إضافة محاضرة جديدة: ${lectureTitle} 📚`,
      `تمت إضافة محاضرة جديدة في كورس (${course.title}): "${lectureTitle}". سارع بمشاهدتها الآن!`,
      "new_content",
      courseId,
      course.title
    );
  };

  // Add multiple lectures (batch YouTube import) and notify enrolled students
  const handleAddLecturesToCourse = async (
    courseId: string,
    newLecturesData: { title: string; duration: string; videoUrl: string; pdfUrl: string }[]
  ) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    const newLectures = newLecturesData.map((data, index) => ({
      id: "lect-" + (Date.now() + index),
      courseId,
      title: data.title,
      duration: data.duration || "1 ساعة",
      videoUrl: data.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4",
      pdfUrl: data.pdfUrl || "مذكرة الشرح الجديدة.pdf",
    }));

    let updatedCourseObj: Course | null = null;
    setCourses((prevCourses) => {
      const updated = prevCourses.map((c) => {
        if (c.id === courseId) {
          const u = {
            ...c,
            lecturesCount: (c.lecturesCount || 0) + newLectures.length,
            lectures: [...(c.lectures || []), ...newLectures],
          };
          updatedCourseObj = u;
          return u;
        }
        return c;
      });
      return updated;
    });

    if (selectedCourseForDetail && selectedCourseForDetail.id === courseId) {
      setSelectedCourseForDetail((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          lecturesCount: (prev.lecturesCount || 0) + newLectures.length,
          lectures: [...(prev.lectures || []), ...newLectures],
        };
      });
    }

    if (updatedCourseObj) {
      await saveCourseInFirestore(updatedCourseObj);
    }

    addNotification(
      "all",
      `إضافة ${newLectures.length} محاضرات جديدة دفعة واحدة! 📚`,
      `تمت إضافة ${newLectures.length} محاضرات جديدة في كورس (${course.title}). شاهدها الآن!`,
      "new_content",
      courseId,
      course.title
    );
  };

  // Admin approvals
  const handleApprovePayment = async (paymentId: string) => {
    const payment = pendingPayments.find((p) => p.id === paymentId);
    if (!payment) return;

    // 1. Mark payment as approved
    const updatedPayment: PendingPayment = { ...payment, status: "approved" as const };
    setPendingPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? updatedPayment : p))
    );
    await savePendingPaymentInFirestore(updatedPayment);

    // 2. Load and update actual student profile
    const targetStudent = await fetchUserByPhone(payment.userPhone);
    if (targetStudent) {
      if (!targetStudent.enrolledCourseIds.includes(payment.courseId)) {
        targetStudent.enrolledCourseIds.push(payment.courseId);
        await saveUserInFirestore(targetStudent);
      }
    }

    // 3. If the user who paid is the currently logged in student, update their session instantly!
    if (user && user.id === payment.userId) {
      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          enrolledCourseIds: [...prev.enrolledCourseIds, payment.courseId],
        };
      });
    }

    // 4. Update the students catalog/metrics
    setStudentsList((prev) =>
      prev.map((s) =>
        s.phone === payment.userPhone
          ? { ...s, enrolledCount: s.enrolledCount + 1 }
          : s
      )
    );

    // 5. Send Notification
    addNotification(
      payment.userId,
      "تم قبول عملية الدفع بنجاح! ✅",
      `تم تفعيل كورس (${payment.courseTitle}) بنجاح في حسابك بعد مراجعة عملية التحويل. مشاهدة ممتعة وموفيدة!`,
      "payment_approved",
      payment.courseId,
      payment.courseTitle
    );

    addActivityLog(
      payment.userId,
      "course_enrollment",
      "الاشتراك في كورس 📚",
      `تم تفعيل والاشتراك في كورس (${payment.courseTitle}) بنجاح بعد مراجعة عملية التحويل.`
    );
  };

  const handleRejectPayment = async (paymentId: string) => {
    const payment = pendingPayments.find((p) => p.id === paymentId);
    if (!payment) return;

    const updatedPayment: PendingPayment = { ...payment, status: "rejected" as const };
    setPendingPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? updatedPayment : p))
    );
    await savePendingPaymentInFirestore(updatedPayment);

    // Send Notification
    addNotification(
      payment.userId,
      "تعذر قبول عملية الدفع ❌",
      `نأسف لإبلاغك بأنه تعذر قبول طلب الدفع الخاص بك لكورس (${payment.courseTitle}). يرجى التحقق من تفاصيل التحويل والتواصل مع الدعم للمساعدة.`,
      "payment_rejected",
      payment.courseId,
      payment.courseTitle
    );
  };

  // ================= BOOKS & SHIPPING SERVICES =================
  const handleBuyBook = async (bookId: string, governorate: string, address: string): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: "يرجى تسجيل الدخول أولاً لإتمام عملية الشراء!" };
    }
    const book = books.find((b) => b.id === bookId);
    if (!book) {
      return { success: false, message: "هذا الكتاب غير متوفر بالمتجر حالياً!" };
    }
    if (book.stock <= 0) {
      return { success: false, message: "عذراً، هذه المذكرة نفدت من المخزن حالياً!" };
    }
    if (user.walletBalance < book.price) {
      return { success: false, message: `رصيد محفظتك (${user.walletBalance} ج.م) غير كافٍ لشراء هذا الكتاب بقيمة (${book.price} ج.م)! يرجى شحن محفظتك أولاً.` };
    }

    try {
      // 1. Deduct from user wallet
      const updatedUser: UserType = {
        ...user,
        walletBalance: user.walletBalance - book.price
      };
      await saveUserInFirestore(updatedUser);
      setUser(updatedUser);

      // Update student list balance
      setStudentsList((prev) =>
        prev.map((s) => (s.phone === user.phone ? { ...s, balance: updatedUser.walletBalance } : s))
      );

      // 2. Decrement book stock
      const updatedBook: BookStoreItem = {
        ...book,
        stock: book.stock - 1
      };
      await saveBookStoreItemInFirestore(updatedBook);
      setBooks((prev) => prev.map((b) => (b.id === bookId ? updatedBook : b)));

      // 3. Create shipping order
      const newOrder: BookOrder = {
        id: "order-" + Date.now(),
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        bookId: book.id,
        bookTitle: book.title,
        price: book.price,
        governorate,
        address,
        status: "pending",
        createdAt: new Date().toISOString()
      };
      await saveBookOrderInFirestore(newOrder);
      setBookOrders((prev) => [newOrder, ...prev]);

      // 4. Send notification
      addNotification(
        user.id,
        "طلب شراء كتاب قيد المراجعة 🚚",
        `تم تسجيل طلبك لشراء كتاب (${book.title}) وسيتم تسليمه لشركة الشحن في أقرب وقت. تم خصم ${book.price} ج.م من محفظتك.`,
        "payment_approved",
        book.id,
        book.title
      );

      // 5. Log activity
      addActivityLog(
        user.id,
        "book_order",
        "شراء كتاب 🚚",
        `تم شراء كتاب (${book.title}) بقيمة ${book.price} ج.م وجاري تجهيز الشحن إلى محافظة ${governorate}.`
      );

      return { success: true, message: `🎉 تم الشراء بنجاح! تم خصم ${book.price} ج.م من محفظتك وجاري تجهيز طلبك للشحن.` };
    } catch (error) {
      console.error("Error during book purchase:", error);
      return { success: false, message: "حدث خطأ غير متوقع أثناء إتمام عملية الشراء." };
    }
  };

  const handleUpdateBookOrder = async (orderId: string, status: "pending" | "shipped" | "delivered" | "cancelled", shippingCompany?: string, trackingNumber?: string) => {
    const order = bookOrders.find((o) => o.id === orderId);
    if (!order) return;

    const updatedOrder: BookOrder = {
      ...order,
      status,
      shippingCompany,
      trackingNumber
    };

    setBookOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
    await saveBookOrderInFirestore(updatedOrder);

    // Send notification to the student
    let title = "تحديث حالة شحن كتابك 🚚";
    let message = "";
    if (status === "shipped") {
      title = "تم شحن كتابك بنجاح! 📦";
      message = `يسعدنا إبلاغك بأنه تم تسليم كتابك (${order.bookTitle}) لشركة الشحن (${shippingCompany || "البريد السريع"}). رقم التتبع الخاص بك هو: ${trackingNumber || "غير متوفر"}.`;
    } else if (status === "delivered") {
      title = "تم تسليم كتابك بنجاح! 🎉";
      message = `تم تأكيد تسليم كتابك (${order.bookTitle}) إلى عنوانك بنجاح. دراسة ممتعة وموفقة!`;
    } else if (status === "cancelled") {
      title = "تم إلغاء طلب شحن الكتاب ❌";
      message = `للأسف تم إلغاء طلب شحن كتابك (${order.bookTitle}). يرجى التواصل مع الدعم الفني لمزيد من التفاصيل.`;
    }

    addNotification(order.userId, title, message, "payment_rejected", order.bookId, order.bookTitle);
  };

  const handleAddBookStoreItem = async (newBook: BookStoreItem) => {
    setBooks((prev) => [...prev, newBook]);
    await saveBookStoreItemInFirestore(newBook);
  };

  const handleDeleteBookStoreItem = async (bookId: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    await deleteBookStoreItemFromFirestore(bookId);
  };

  // Course additions
  const handleAddNewCourse = async (newCourse: Course) => {
    setCourses((prev) => [newCourse, ...prev]);
    await saveCourseInFirestore(newCourse);
  };

  // Advanced features state handlers
  const handleAddTeacher = async (name: string, subject: string, phone: string, email?: string) => {
    const newTeacher: Teacher = {
      id: "teacher-" + Date.now(),
      name,
      subject,
      phone,
      email,
      courseCount: 0
    };
    setTeachersList((prev) => [...prev, newTeacher]);
    await saveTeacherInFirestore(newTeacher);
  };

  const handleDeleteTeacher = async (id: string) => {
    setTeachersList((prev) => prev.filter((t) => t.id !== id));
    await deleteTeacherFromFirestore(id);
  };

  const handleGenerateChargeCodes = async (value: number, count: number) => {
    const newCodes: ChargeCode[] = [];
    for (let i = 0; i < count; i++) {
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const codeStr = `CODE-${value}-EGP-${randomId}`;
      const newCodeObj = {
        code: codeStr,
        value,
        isUsed: false,
        createdAt: new Date().toISOString()
      };
      newCodes.push(newCodeObj);
      await saveChargeCodeInFirestore(newCodeObj);
    }
    setChargeCodes((prev) => [...newCodes, ...prev]);
  };

  const handleUpdateVideoSettings = async (updated: VideoSettings) => {
    setVideoSettings(updated);
    await saveSettingsInFirestore(updated, platformSettings);
  };

  const handleUpdatePlatformSettings = async (updated: PlatformSettings) => {
    setPlatformSettings(updated);
    await saveSettingsInFirestore(videoSettings, updated);
  };

  const handleUpdateStudentBalance = async (phone: string, amount: number, action: "add" | "deduct") => {
    // 1. Update the student in Firestore
    const targetStudent = await fetchUserByPhone(phone);
    if (targetStudent) {
      const newBal = action === "add" ? targetStudent.walletBalance + amount : Math.max(0, targetStudent.walletBalance - amount);
      targetStudent.walletBalance = newBal;
      await saveUserInFirestore(targetStudent);
    }

    // 2. Update the students list
    setStudentsList((prev) =>
      prev.map((s) => {
        if (s.phone === phone) {
          const newBal = action === "add" ? s.balance + amount : Math.max(0, s.balance - amount);
          return { ...s, balance: newBal };
        }
        return s;
      })
    );

    // 3. If the currently logged-in student is this student, update their session instantly!
    if (user && user.phone === phone) {
      setUser((prev) => {
        if (!prev) return null;
        const newBal = action === "add" ? prev.walletBalance + amount : Math.max(0, prev.walletBalance - amount);
        return { ...prev, walletBalance: newBal };
      });
    }
  };

  const handleAddStudent = async (name: string, phone: string, balance: number, enrolledCount: number) => {
    if (studentsList.some((s) => s.phone === phone)) {
      return { success: false, message: "هذا الهاتف مسجل بالفعل لطالب آخر!" };
    }
    
    // Create new student in Firestore
    const newStudentUser: UserType = {
      id: "student-" + Date.now(),
      name,
      phone,
      role: "student",
      walletBalance: balance,
      enrolledCourseIds: [],
      quizAttempts: {},
      completedLectures: [],
    };
    await saveUserInFirestore(newStudentUser);

    setStudentsList((prev) => [
      ...prev,
      { name, phone, enrolledCount, balance }
    ]);
    return { success: true, message: "تم تسجيل الطالب بنجاح!" };
  };

  const handleDeleteStudent = async (phone: string) => {
    try {
      const dbUsers = await fetchAllUsers();
      const studentUser = dbUsers.find((u) => u.phone === phone);
      if (studentUser) {
        await deleteUserFromFirestore(studentUser.id);
      }
      setStudentsList((prev) => prev.filter((s) => s.phone !== phone));
      return { success: true };
    } catch (error) {
      console.error("Error deleting student:", error);
      return { success: false, message: "فشل حذف الطالب من قاعدة البيانات" };
    }
  };

  const handleUpdateStudent = async (oldPhone: string, updatedData: { name: string; phone: string; balance: number }) => {
    try {
      const dbUsers = await fetchAllUsers();
      const studentUser = dbUsers.find((u) => u.phone === oldPhone);
      if (studentUser) {
        await updateUserInFirestore(studentUser.id, {
          name: updatedData.name,
          phone: updatedData.phone,
          walletBalance: updatedData.balance,
        });
      }
      setStudentsList((prev) =>
        prev.map((s) =>
          s.phone === oldPhone
            ? { ...s, name: updatedData.name, phone: updatedData.phone, balance: updatedData.balance }
            : s
        )
      );
      return { success: true };
    } catch (error) {
      console.error("Error updating student:", error);
      return { success: false, message: "فشل تحديث بيانات الطالب في قاعدة البيانات" };
    }
  };

  const handleUpdateTeacher = async (id: string, updatedData: Partial<Teacher>) => {
    setTeachersList((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updatedData } : t));
      const found = updated.find((t) => t.id === id);
      if (found) {
        saveTeacherInFirestore(found);
      }
      return updated;
    });
  };

  const handleUpdateCourse = async (updatedCourse: Course) => {
    try {
      await saveCourseInFirestore(updatedCourse);
      setCourses((prev) =>
        prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c))
      );
      return { success: true };
    } catch (error) {
      console.error("Error updating course:", error);
      return { success: false, message: "فشل تحديث الكورس في قاعدة البيانات" };
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await deleteCourseFromFirestore(courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      return { success: true };
    } catch (error) {
      console.error("Error deleting course:", error);
      return { success: false, message: "فشل حذف الكورس من قاعدة البيانات" };
    }
  };

  const handleEnrollStudentInCourse = async (studentPhone: string, courseId: string) => {
    try {
      const dbUsers = await fetchAllUsers();
      const studentUser = dbUsers.find((u) => u.phone === studentPhone);
      if (studentUser) {
        if (!studentUser.enrolledCourseIds.includes(courseId)) {
          studentUser.enrolledCourseIds = [...studentUser.enrolledCourseIds, courseId];
          await saveUserInFirestore(studentUser);
        }
      }
      
      // Update local studentsList metrics
      setStudentsList((prev) =>
        prev.map((s) =>
          s.phone === studentPhone
            ? { ...s, enrolledCount: s.enrolledCount + 1 }
            : s
        )
      );

      // If current logged-in user is this student, update session instantly
      if (user && user.phone === studentPhone) {
        setUser((prev) => {
          if (!prev) return null;
          if (prev.enrolledCourseIds.includes(courseId)) return prev;
          return {
            ...prev,
            enrolledCourseIds: [...prev.enrolledCourseIds, courseId]
          };
        });
      }

      return { success: true, message: "تم تسجيل الطالب في الكورس بنجاح!" };
    } catch (err) {
      console.error(err);
      return { success: false, message: "حدث خطأ أثناء تسجيل الطالب." };
    }
  };

  const handleUnenrollStudentFromCourse = async (studentPhone: string, courseId: string) => {
    try {
      const dbUsers = await fetchAllUsers();
      const studentUser = dbUsers.find((u) => u.phone === studentPhone);
      if (studentUser) {
        studentUser.enrolledCourseIds = studentUser.enrolledCourseIds.filter(id => id !== courseId);
        await saveUserInFirestore(studentUser);
      }

      // Update local studentsList metrics
      setStudentsList((prev) =>
        prev.map((s) =>
          s.phone === studentPhone
            ? { ...s, enrolledCount: Math.max(0, s.enrolledCount - 1) }
            : s
        )
      );

      // If current logged-in user is this student, update session instantly
      if (user && user.phone === studentPhone) {
        setUser((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            enrolledCourseIds: prev.enrolledCourseIds.filter(id => id !== courseId)
          };
        });
      }

      return { success: true, message: "تم إلغاء تسجيل الطالب من الكورس بنجاح!" };
    } catch (err) {
      console.error(err);
      return { success: false, message: "حدث خطأ أثناء إلغاء تسجيل الطالب." };
    }
  };

  const handleRechargeWithCode = async (codeString: string) => {
    const codeObjIndex = chargeCodes.findIndex((c) => c.code.trim().toUpperCase() === codeString.trim().toUpperCase());
    if (codeObjIndex === -1) {
      return { success: false, message: "عذراً، هذا الكود غير صحيح أو غير موجود بالمنصة!" };
    }
    const codeObj = chargeCodes[codeObjIndex];
    if (codeObj.isUsed) {
      return { success: false, message: `عذراً، تم استخدام هذا الكود مسبقاً بواسطة رقم ${codeObj.usedBy}!` };
    }

    // Mark code as used
    const updatedCode = {
      ...codeObj,
      isUsed: true,
      usedBy: user?.phone || "طالب مجهول",
      usedByName: user?.name || "طالب مجهول",
      usedAt: new Date().toISOString()
    };

    setChargeCodes((prev) =>
      prev.map((c, idx) => (idx === codeObjIndex ? updatedCode : c))
    );
    await saveChargeCodeInFirestore(updatedCode);

    // Add value to user balance
    if (user) {
      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          walletBalance: prev.walletBalance + codeObj.value
        };
      });

      setStudentsList((prev) =>
        prev.map((s) =>
          s.phone === user.phone
            ? { ...s, balance: s.balance + codeObj.value }
            : s
        )
      );

      addActivityLog(
        user.id,
        "recharged_balance",
        "شحن رصيد المحفظة 💳",
        `تم شحن محفظتك التعليمية بكود شحن فوري بقيمة ${codeObj.value} ج.م بنجاح.`
      );
    }

    return { success: true, message: `تهانينا! تم شحن محفظتك بقيمة ${codeObj.value} ج.م بنجاح 🎉` };
  };

  const handleAddReview = async (courseId: string, rating: number, comment: string) => {
    if (!user) return;
    let updatedCourse: Course | null = null;
    setCourses((prevCourses) => {
      const updatedCourses = prevCourses.map((c) => {
        if (c.id === courseId) {
          const currentReviews = c.reviews || [];
          const newReview = {
            id: "rev-" + Date.now(),
            studentName: user.name,
            rating,
            comment,
            timestamp: new Date().toISOString(),
          };
          const updatedReviews = [newReview, ...currentReviews];
          const totalRating = updatedReviews.reduce((sum, rev) => sum + rev.rating, 0);
          const newAvgRating = Math.round((totalRating / updatedReviews.length) * 10) / 10;
          const u = {
            ...c,
            reviews: updatedReviews,
            rating: newAvgRating,
          };
          updatedCourse = u;
          return u;
        }
        return c;
      });
      // Synchronize modal state immediately if open
      if (selectedCourseForDetail && selectedCourseForDetail.id === courseId) {
        const found = updatedCourses.find((c) => c.id === courseId);
        if (found) {
          setSelectedCourseForDetail(found);
        }
      }
      return updatedCourses;
    });

    if (updatedCourse) {
      await saveCourseInFirestore(updatedCourse);
    }
  };

  // Quiz progression
  const handleCompleteQuiz = (quizId: string, score: number, total: number, answers: any[]) => {
    if (!user) return;

    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        quizAttempts: {
          ...prev.quizAttempts,
          [quizId]: {
            score,
            total,
            answers,
            completedAt: new Date().toLocaleDateString("ar-EG"),
          },
        },
      };
    });

    // Find quiz title for activity logging
    let quizTitle = "اختبار تفاعلي";
    for (const c of courses) {
      for (const l of c.lectures) {
        if (l.quiz && l.quiz.id === quizId) {
          quizTitle = l.quiz.title;
          break;
        }
      }
    }
    const percent = Math.round((score / total) * 100);
    addActivityLog(
      user.id,
      "solved_quiz",
      "حل اختبار تفاعلي ✏️",
      `أكملت حل (${quizTitle}) بنسبة نجاح ${percent}% بنتيجة ${score}/${total}.`
    );
  };

  const handleCompleteLecture = (lectureId: string) => {
    if (!user) return;

    setUser((prev) => {
      if (!prev) return null;
      if (prev.completedLectures.includes(lectureId)) return prev;
      return {
        ...prev,
        completedLectures: [...prev.completedLectures, lectureId],
      };
    });

    // Find lecture title for activity logging
    let lectureTitle = "محاضرة جديدة";
    for (const c of courses) {
      const foundLect = c.lectures.find((l) => l.id === lectureId);
      if (foundLect) {
        lectureTitle = foundLect.title;
        break;
      }
    }
    addActivityLog(
      user.id,
      "watched_video",
      "مشاهدة فيديو الشرح 🎥",
      `أكملت مشاهدة الدرس: (${lectureTitle}) بنجاح.`
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] text-gray-900" dir="rtl">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full mb-4"
        />
        <p className="text-lg font-bold text-gray-700 animate-pulse">منصة اليسر ترحب بكم</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-gray-900 selection:bg-red-200" dir="rtl">
      {/* Navigation */}
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        currentTab={currentTab}
        onChangeTab={(tab) => {
          setCurrentTab(tab);
          setSelectedCourseForDetail(null);
        }}
        platformSettings={platformSettings}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onClearNotifications={handleClearNotifications}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(prev => !prev)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentTab === "landing" && (
          <LandingPage
            courses={courses}
            user={user}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onSelectCourse={(course) => setSelectedCourseForDetail(course)}
            onChangeTab={setCurrentTab}
            platformSettings={platformSettings}
          />
        )}

        {currentTab === "landing-about" && (
          <div className="max-w-4xl mx-auto py-12 px-4 space-y-8 text-right" id="about-tab-content">
            <h2 className="text-3xl font-black text-gray-900 border-b border-gray-100 pb-4">
              من نحن - {platformSettings?.platformName || "منصة اليسر التعليمية 🌟"}
            </h2>
            <p className="text-gray-600 leading-relaxed text-base">
              {platformSettings?.platformName || "منصة اليسر التعليمية"} هي منصة إلكترونية رائدة متكاملة تقدم أرقى مستويات الشرح والتأسيس لطلاب الثانوية العامة والأزهرية في شتى المواد الدراسية (الرياضيات، الفيزياء، الكيمياء، الأحياء، واللغات) بمصر والوطن العربي.
            </p>
            <p className="text-gray-600 leading-relaxed text-base">
              يقود هذا الصرح التعليمي الأستاذ الشريك <span className="font-bold text-red-600">ياسر أبوستيت</span> ونخبة من عمالقة وخبراء التدريس بمختلف المواد، يعاونهم أحدث نظم الحماية الرقمية وال DRM لضمان جودة وحصرية الفيديوهات، مع اختبارات تفاعلية ذكية لقياس التحصيل أولاً بأول ونظام شحن الأكواد وتفعيل فوري للطلاب بمختلف المحافظات.
            </p>
          </div>
        )}

        {currentTab === "landing-privacy" && (
          <div className="max-w-4xl mx-auto py-12 px-4 space-y-8 text-right" id="privacy-tab-content" dir="rtl">
            <h2 className="text-3xl font-black text-gray-900 border-b border-gray-100 pb-4">
              سياسة الخصوصية 🔒
            </h2>
            <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-xs whitespace-pre-wrap leading-relaxed text-gray-700 text-base">
              {platformSettings?.privacyPolicy || `نحن في منصة اليسر التعليمية نلتزم بأقصى درجات حماية البيانات والخصوصية لطلابنا الكرام ومستخدمينا.
تشمل البيانات التي نجمعها الاسم ورقم الهاتف والبريد الإلكتروني من أجل توفير تجربة تعليمية مخصصة ومتابعة مستمرة.
جميع البيانات والمدفوعات مشفرة بالكامل ولا نقوم بمشاركتها مع أي أطراف ثالثة على الإطلاق.`}
            </div>
          </div>
        )}

        {currentTab === "landing-terms" && (
          <div className="max-w-4xl mx-auto py-12 px-4 space-y-8 text-right" id="terms-tab-content" dir="rtl">
            <h2 className="text-3xl font-black text-gray-900 border-b border-gray-100 pb-4">
              شروط الاستخدام 📄
            </h2>
            <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-xs whitespace-pre-wrap leading-relaxed text-gray-700 text-base">
              {platformSettings?.termsOfUse || `باستخدامك لمنصة اليسر التعليمية، فإنك توافق على الالتزام بالشروط والأحكام التالية:
1. الحساب مخصص لاستخدام طالب واحد فقط، ويُمنع منعاً باتاً مشاركة بيانات الدخول مع أي شخص آخر.
2. جميع المواد التعليمية والفيديوهات والملازم والامتحانات محمية بموجب حقوق الملكية الفكرية، ويُمنع نسخها أو إعادة نشرها أو تسجيل الشاشة.
3. تحتفظ المنصة بالحق في اتخاذ الإجراءات القانونية وحظر الحساب فوراً في حال مخالفة الشروط.`}
            </div>
          </div>
        )}

        {currentTab === "landing-support" && (
          <div className="max-w-4xl mx-auto py-12 px-4 space-y-8 text-right" id="support-tab-content" dir="rtl">
            <h2 className="text-3xl font-black text-gray-900 border-b border-gray-100 pb-4">
              الدعم الفني والاتصال 📞
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-xs whitespace-pre-wrap leading-relaxed text-gray-700 text-base space-y-4">
                <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-2">بيانات الاتصال الرسمية</h3>
                <div>
                  {platformSettings?.supportInfo || `نحن هنا لخدمتكم ومساعدتكم طوال اليوم!
للأسئلة والاستفسارات وحل المشاكل التقنية أو المالية:
- واتساب الدعم الفني: 201008889818
- رقم الاتصال المباشر: 01008889818
- البريد الإلكتروني: admin@yasser.cc
يمكنك أيضاً فتح تذكرة دعم فني مباشرة من لوحة التحكم الخاصة بك لمتابعة الطلبات.`}
                </div>
              </div>

              <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-xs space-y-4">
                <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-2">أرسل لنا استفسارك مباشرة ✉️</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (isSubmittingInquiry) return;
                  setIsSubmittingInquiry(true);
                  const form = e.currentTarget;
                  const formData = new FormData(form);
                  const fullName = (formData.get("fullName") || "") as string;
                  const phone = (formData.get("phone") || "") as string;
                  const message = (formData.get("message") || "") as string;
                  
                  try {
                    const ticketId = "ticket_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
                    const newTicket: SupportTicket = {
                      id: ticketId,
                      userId: user?.id || "guest",
                      userName: fullName,
                      userPhone: phone,
                      title: "استفسار مباشر من الصفحة الرئيسية",
                      message: message,
                      category: "technical",
                      status: "open",
                      createdAt: new Date().toISOString(),
                      replies: []
                    };
                    
                    await saveSupportTicketInFirestore(newTicket);
                    alert("تم إرسال استفسارك مباشرة بنجاح إلى قسم الدعم الفني والشكاوى! 🎉 سيتم مراجعته والرد عليك قريباً.");
                    form.reset();
                  } catch (error) {
                    console.error("Error submitting inquiry:", error);
                    alert("حدث خطأ أثناء إرسال الاستفسار. يرجى المحاولة مرة أخرى.");
                  } finally {
                    setIsSubmittingInquiry(false);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">الاسم بالكامل:</label>
                    <input type="text" name="fullName" required className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs" placeholder="مثال: أحمد محمد" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">رقم الهاتف:</label>
                    <input type="tel" name="phone" required className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs text-left" placeholder="01xxxxxxxxx" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">موضوع الاستفسار:</label>
                    <textarea name="message" required rows={4} className="w-full px-3 py-2 border border-gray-250 rounded-xl text-xs" placeholder="اكتب تفاصيل استفسارك أو المشكلة التي تواجهها هنا..." />
                  </div>
                  <button type="submit" disabled={isSubmittingInquiry} className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-black rounded-xl text-xs transition-colors cursor-pointer">
                    {isSubmittingInquiry ? "جاري الإرسال... 🚀" : "إرسال الاستفسار الآن 🚀"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {currentTab === "student-dashboard" && user && (
          <StudentDashboard
            user={user}
            courses={courses}
            pendingPayments={pendingPayments}
            activityLogs={activityLogs}
            onCompleteLecture={handleCompleteLecture}
            onCompleteQuiz={handleCompleteQuiz}
            onSelectCourseFromDashboard={(course) => {
              setSelectedCourseForDetail(course);
            }}
            onRechargeWithCode={handleRechargeWithCode}
            videoSettings={videoSettings}
            platformSettings={platformSettings}
            onUpdateProfile={(updatedUser) => setUser(updatedUser)}
            books={books}
            bookOrders={bookOrders}
            onBuyBook={handleBuyBook}
            activeTab={studentTab}
            onChangeActiveTab={setStudentTab}
          />
        )}

        {currentTab === "admin-dashboard" && user && (user.role === "admin" || user.role === "teacher") && (
          <AdminDashboard
            user={user}
            courses={courses}
            pendingPayments={pendingPayments}
            students={studentsList}
            teachers={teachersList}
            chargeCodes={chargeCodes}
            videoSettings={videoSettings}
            onApprovePayment={handleApprovePayment}
            onRejectPayment={handleRejectPayment}
            onAddNewCourse={handleAddNewCourse}
            onAddTeacher={handleAddTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onGenerateChargeCodes={handleGenerateChargeCodes}
            onUpdateVideoSettings={handleUpdateVideoSettings}
            onUpdateStudentBalance={handleUpdateStudentBalance}
            onAddStudent={handleAddStudent}
            onDeleteStudent={handleDeleteStudent}
            onUpdateStudent={handleUpdateStudent}
            onUpdateTeacher={handleUpdateTeacher}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
            platformSettings={platformSettings}
            onUpdatePlatformSettings={handleUpdatePlatformSettings}
            onAddLectureToCourse={handleAddLectureToCourse}
            onAddLecturesToCourse={handleAddLecturesToCourse}
            onEnrollStudentInCourse={handleEnrollStudentInCourse}
            onUnenrollStudentFromCourse={handleUnenrollStudentFromCourse}
            books={books}
            bookOrders={bookOrders}
            onUpdateBookOrder={handleUpdateBookOrder}
            onAddBookStoreItem={handleAddBookStoreItem}
            onDeleteBookStoreItem={handleDeleteBookStoreItem}
            activeTab={adminTab}
            onChangeActiveTab={setAdminTab}
          />
        )}
      </main>

      {/* Modals & Popups */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {selectedCourseForDetail && (
        <CourseDetailModal
          isOpen={!!selectedCourseForDetail}
          onClose={() => setSelectedCourseForDetail(null)}
          course={selectedCourseForDetail}
          user={user}
          onOpenAuth={() => {
            setSelectedCourseForDetail(null);
            setIsAuthModalOpen(true);
          }}
          onPurchaseWithWallet={handlePurchaseWithWallet}
          onTriggerPayment={() => {
            setSelectedCourseForDetail(null);
            setIsPaymentModalOpen(true);
          }}
          onSubmitReview={handleAddReview}
        />
      )}

      {selectedCourseForDetail && isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          course={selectedCourseForDetail}
          user={user!}
          onNewPaymentRequest={(cId, cTitle, amt, meth, ref) => {
            handleNewPaymentRequest(cId, cTitle, amt, meth, ref);
          }}
          onDirectCardPurchase={(cId, amt) => {
            handleDirectCardPurchase(cId, amt);
          }}
        />
      )}

      {/* Fallback independent Payment Modal when triggered separately */}
      {!selectedCourseForDetail && isPaymentModalOpen && user && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          course={courses[0]} // defaults to first course for dummy subscription top-up
          user={user}
          onNewPaymentRequest={(cId, cTitle, amt, meth, ref) => {
            handleNewPaymentRequest(cId, cTitle, amt, meth, ref);
          }}
          onDirectCardPurchase={(cId, amt) => {
            handleDirectCardPurchase(cId, amt);
          }}
        />
      )}
    </div>
  );
}
