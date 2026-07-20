/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum CourseCategory {
  PURE = "pure",       // رياضيات بحتة (جبر، هندسة فراغية، تفاضل وتكامل)
  APPLIED = "applied", // رياضيات تطبيقية (استاتيكا، ديناميكا)
  PHYSICS = "physics", // فيزياء
  CHEMISTRY = "chemistry", // كيمياء
  BIOLOGY = "biology", // أحياء
  ARABIC = "arabic", // لغة عربية
  ENGLISH = "english", // لغة إنجليزية
  GEOLOGY = "geology", // جيولوجيا وعلوم بيئية
  HISTORY = "history", // تاريخ
  GEOGRAPHY = "geography", // جغرافيا
  MATH = "math", // الرياضيات العامة
  SCIENCE = "science", // العلوم
  SOCIAL_STUDIES = "social", // الدراسات الاجتماعية
  FRENCH = "french", // اللغة الفرنسية
  GERMAN = "german", // اللغة الألمانية
  ITALIAN = "italian", // اللغة الإيطالية
  COMPUTER = "computer", // الحاسب الآلي والتكنولوجيا
  RELIGION = "religion", // التربية الدينية
  PHILOSOPHY = "philosophy", // الفلسفة والمنطق
  PSYCHOLOGY = "psychology", // علم النفس والاجتماع
}

export enum GradeLevel {
  PRIMARY_1 = "primary_1", // الصف الأول الابتدائي
  PRIMARY_2 = "primary_2", // الصف الثاني الابتدائي
  PRIMARY_3 = "primary_3", // الصف الثالث الابتدائي
  PRIMARY_4 = "primary_4", // الصف الرابع الابتدائي
  PRIMARY_5 = "primary_5", // الصف الخامس الابتدائي
  PRIMARY_6 = "primary_6", // الصف السادس الابتدائي
  PREP_1 = "prep_1",       // الصف الأول الإعدادي
  PREP_2 = "prep_2",       // الصف الثاني الإعدادي
  PREP_3 = "prep_3",       // الصف الثالث الإعدادي
  FIRST = "first",         // الصف الأول الثانوي
  SECOND = "second",       // الصف الثاني الثانوي
  THIRD = "third",         // الصف الثالث الثانوي
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  type?: "mcq" | "true_false" | "text" | "multi_select";
  correctAnswersIndices?: number[]; // For multi-select checkbox questions
  correctTextAnswer?: string;       // For auto-graded text input questions
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

export interface Lecture {
  id: string;
  courseId: string;
  title: string;
  duration: string; // e.g. "45 دقيقة"
  videoUrl: string; // simulated video URL
  pdfUrl: string;   // simulated PDF url or title
  quiz?: Quiz;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  grade: GradeLevel;
  category: CourseCategory;
  price: number; // in EGP
  image: string; // image or icon/color representation
  lecturesCount: number;
  hoursCount: string;
  studentsCount: number;
  lectures: Lecture[];
  rating?: number; // average rating e.g., 4.8
  reviews?: Review[];
  teacherName?: string;
}

export interface Review {
  id: string;
  studentName: string;
  rating: number; // 1 to 5
  comment: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: "student" | "admin" | "teacher";
  walletBalance: number;
  enrolledCourseIds: string[];
  quizAttempts: {
    [quizId: string]: {
      score: number;
      total: number;
      answers: number[]; // user selected indices
      completedAt: string;
    };
  };
  completedLectures: string[]; // completed lecture ids
  parentPhone?: string;
  governorate?: string;
  gender?: "male" | "female";
  password?: string;
  grade?: GradeLevel;
  avatarUrl?: string;
}

export interface PendingPayment {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  method: "vodafone_cash" | "fawry" | "instapay" | "credit_card";
  senderPhoneOrRef: string;
  status: "pending" | "approved" | "rejected";
  timestamp: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  phone: string;
  email?: string;
  courseCount: number;
}

export interface ChargeCode {
  code: string;
  value: number;
  isUsed: boolean;
  usedBy?: string; // student's phone number
  usedByName?: string; // student's name
  usedAt?: string;
  createdAt: string;
}

export interface VideoSettings {
  watermarkTextType: "student_info" | "custom";
  customWatermarkText: string;
  watermarkOpacity: number;
  watermarkPosition: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "center" | "random";
  logoUrl: string;
  logoPosition: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  logoOpacity: number;
  enableRightClickBlock: boolean;
  enableAntiScreenshotAlert: boolean;
}

export interface AdCampaign {
  id: string;
  title: string;
  placement: "landing_top" | "landing_sidebar" | "landing_middle" | "landing_bottom" | "student_top" | "student_sidebar" | "student_bottom" | "student_classroom";
  type: "image" | "html";
  imageUrl?: string;
  linkUrl?: string;
  htmlCode?: string; // Suitable for Google Ads script code or custom banners
  isActive: boolean;
}

export interface PlatformSettings {
  platformName: string;
  logoUrl: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactEmail: string;
  contactTelegram?: string;
  contactFacebook?: string;
  ads: AdCampaign[];
  privacyPolicy?: string;
  termsOfUse?: string;
  supportInfo?: string;
}

export interface AppNotification {
  id: string;
  userId: string; // "all" or specific userId
  title: string;
  message: string;
  isRead: boolean;
  type: "payment_approved" | "payment_rejected" | "new_content" | "system";
  courseId?: string;
  courseTitle?: string;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  actionType: "watched_video" | "solved_quiz" | "recharged_balance" | "course_enrollment" | "book_order";
  title: string;
  details: string;
  timestamp: string;
}

export interface TicketReply {
  id: string;
  senderRole: "student" | "admin";
  senderName: string;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  title: string;
  message: string;
  category: "technical" | "academic" | "financial" | "other";
  status: "open" | "replied" | "closed";
  createdAt: string;
  replies: TicketReply[];
}

export interface LiveQuizParticipant {
  studentId: string;
  studentName: string;
  studentPhone: string;
  score: number;
  solvedCount: number;
  answers: number[];
  isFinished: boolean;
  lastUpdated: string;
}

export interface LiveQuiz {
  id: string; // Matches Quiz ID or a custom ID
  title: string;
  courseId: string;
  courseTitle: string;
  questions: Question[];
  status: "waiting" | "active" | "ended";
  createdAt: string;
  startedAt?: string;
  durationSeconds: number; // e.g., 180 seconds
  currentQuestionIndex: number; // -1 if waiting, otherwise current active question index
  participants: {
    [studentId: string]: LiveQuizParticipant;
  };
}

export interface BookStoreItem {
  id: string;
  title: string;
  author?: string;
  price: number;
  description: string;
  coverUrl?: string;
  imageUrl?: string;
  gradeLevel?: GradeLevel;
  stock: number;
  pages?: number;
}

export interface BookOrder {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  bookId: string;
  bookTitle: string;
  price: number;
  governorate: string;
  address: string;
  status: "pending" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  shippingCompany?: string;
  trackingNumber?: string;
}




