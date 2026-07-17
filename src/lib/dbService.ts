import { db } from "../firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  limit
} from "firebase/firestore";
import { Course, User as UserType, PendingPayment, Teacher, ChargeCode, VideoSettings, PlatformSettings, AppNotification, ActivityLog, SupportTicket, LiveQuiz } from "../types";
import { INITIAL_COURSES } from "../data";

// Pre-seeded fallback data
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

const DEFAULT_CHARGE_CODES = [
  { code: "CODE-50-EGP-8739", value: 50, isUsed: false, createdAt: new Date().toISOString() },
  { code: "CODE-100-EGP-1204", value: 100, isUsed: false, createdAt: new Date().toISOString() },
  { code: "CODE-150-EGP-9952", value: 150, isUsed: false, createdAt: new Date().toISOString() },
  { code: "CODE-200-EGP-5460", value: 200, isUsed: false, createdAt: new Date().toISOString() }
];

const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  watermarkTextType: "student_info",
  customWatermarkText: "حقوق الطبع محفوظة",
  watermarkOpacity: 0.15,
  watermarkPosition: "random",
  logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=120",
  logoPosition: "top-right",
  logoOpacity: 0.4,
  enableRightClickBlock: true,
  enableAntiScreenshotAlert: true
};

const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  platformName: "منصة اليسر التعليمية الشاملة 🌟",
  logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=120",
  contactPhone: "01111111111",
  contactWhatsapp: "20111111111",
  contactEmail: "support@yusr-academy.com",
  contactTelegram: "t.me/yusr_academy",
  contactFacebook: "facebook.com/yusr_academy",
  cloudflareEnabled: true,
  cloudflareEmail: "admin@yusr-academy.com",
  cloudflareApiKey: "cf_api_key_8732198075bc9812df",
  cloudflareZoneId: "zone_id_092183709b183ac872a",
  cloudflareTurnstileSiteKey: "0x4AAAAAAABBBCCC111222",
  cloudflareTurnstileSecretKey: "0x4AAAAAAABBBCCC333444555",
  cloudflareStreamEnabled: true,
  cloudflareStreamToken: "stream_token_ab72d897f",
  cloudflareStreamAccountID: "stream_acc_78129a",
  ads: [
    {
      id: "ad-1",
      title: "عرض خاص: اشترك في كورسين واحصل على الثالث مجاناً! 🎫",
      placement: "landing_top",
      type: "image",
      imageUrl: "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=80&w=1200",
      linkUrl: "https://yusr-academy.com",
      isActive: true
    },
    {
      id: "ad-2",
      title: "إعلان جوجل التجريبي في لوحة الطالب 💸",
      placement: "student_top",
      type: "html",
      htmlCode: `<div style="background: #fff4f4; border: 2px dashed #f56565; padding: 15px; border-radius: 12px; text-align: center; color: #c53030; font-weight: bold;">
  <p style="margin-bottom: 5px;">📢 مساحة إعلانية ممولة (Google Adsense) 📢</p>
  <p style="font-size: 11px; color: #742a2a;">انضم لمراجعة ليلة الامتحان النهائية المكثفة وضمان الـ 100%!</p>
</div>`,
      isActive: true
    }
  ],
  privacyPolicy: `نحن في منصة اليسر التعليمية نلتزم بأقصى درجات حماية البيانات والخصوصية لطلابنا الكرام ومستخدمينا.
تشمل البيانات التي نجمعها الاسم ورقم الهاتف والبريد الإلكتروني من أجل توفير تجربة تعليمية مخصصة ومتابعة مستمرة.
جميع البيانات والمدفوعات مشفرة بالكامل ولا نقوم بمشاركتها مع أي أطراف ثالثة على الإطلاق.`,
  termsOfUse: `باستخدامك لمنصة اليسر التعليمية، فإنك توافق على الالتزام بالشروط والأحكام التالية:
1. الحساب مخصص لاستخدام طالب واحد فقط، ويُمنع منعاً باتاً مشاركة بيانات الدخول مع أي شخص آخر.
2. جميع المواد التعليمية والفيديوهات والملازم والامتحانات محمية بموجب حقوق الملكية الفكرية، ويُمنع نسخها أو إعادة نشرها أو تسجيل الشاشة.
3. تحتفظ المنصة بالحق في اتخاذ الإجراءات القانونية وحظر الحساب فوراً في حال مخالفة الشروط.`,
  supportInfo: `نحن هنا لخدمتكم ومساعدتكم طوال اليوم!
للأسئلة والاستفسارات وحل المشاكل التقنية أو المالية:
- واتساب الدعم الفني: 20111111111
- رقم الاتصال المباشر: 01111111111
- البريد الإلكتروني: support@yusr-academy.com
يمكنك أيضاً فتح تذكرة دعم فني مباشرة من لوحة التحكم الخاصة بك لمتابعة الطلبات.`
};

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    userId: "student-default",
    title: "مرحباً بك في الأكاديمية! 🎉",
    message: "أهلاً بك في منصتك التعليمية المتكاملة لجميع المواد الدراسية. يمكنك الآن تصفح الفيديوهات، تحميل ملازم الشرح، وحل الاختبارات التفاعلية الممتعة والمميزة.",
    isRead: false,
    type: "system",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "notif-2",
    userId: "student-default",
    title: "تفعيل كورس التفاضل والتكامل 📐",
    message: "تم تفعيل كورس (التفاضل والتكامل - أساسيات ومراجعة الصف الثالث الثانوي) بنجاح في حسابك. مشاهدة ممتعة ومفيدة!",
    isRead: false,
    type: "payment_approved",
    courseId: "course-1",
    courseTitle: "التفاضل والتكامل - أساسيات ومراجعة الصف الثالث الثانوي",
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
];

const DEFAULT_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: "act-1",
    userId: "student-default",
    actionType: "recharged_balance",
    title: "شحن رصيد المحفظة 💳",
    details: "تم شحن رصيدك بمبلغ 200 ج.م تلقائياً ترحيباً بك بالمنصة.",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: "act-2",
    userId: "student-default",
    actionType: "course_enrollment",
    title: "الاشتراك في كورس 📚",
    details: "تم الاشتراك في كورس (التفاضل والتكامل - أساسيات ومراجعة الصف الثالث الثانوي) بنجاح.",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

// Helper to sanitize Firestore collection name (fallback safety)
const safeCol = (name: string) => collection(db, name);

// ================= MEMORY CACHE LAYER =================
let coursesCache: Course[] | null = null;
let allUsersCache: UserType[] | null = null;
let pendingPaymentsCache: PendingPayment[] | null = null;
let chargeCodesCache: ChargeCode[] | null = null;
let notificationsCache: AppNotification[] | null = null;
let activityLogsCache: ActivityLog[] | null = null;
let settingsCache: { video: VideoSettings; platform: PlatformSettings } | null = null;
let supportTicketsCache: SupportTicket[] | null = null;
let liveQuizzesCache: LiveQuiz[] | null = null;

// ================= COURSES SERVICE =================
export async function fetchCourses(force = false): Promise<Course[]> {
  if (coursesCache && !force) {
    return coursesCache;
  }
  try {
    const querySnapshot = await getDocs(safeCol("courses"));
    const list: Course[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as Course);
    });

    if (list.length === 0) {
      // Seed initial courses if empty
      for (const course of INITIAL_COURSES) {
        await setDoc(doc(db, "courses", course.id), course);
      }
      coursesCache = INITIAL_COURSES;
      return INITIAL_COURSES;
    }
    coursesCache = list;
    return list;
  } catch (error) {
    console.error("Error fetching courses from Firestore, using fallback:", error);
    return INITIAL_COURSES;
  }
}

export async function saveCourseInFirestore(course: Course): Promise<void> {
  try {
    await setDoc(doc(db, "courses", course.id), course);
    if (coursesCache) {
      const idx = coursesCache.findIndex(c => c.id === course.id);
      if (idx !== -1) {
        coursesCache[idx] = course;
      } else {
        coursesCache.push(course);
      }
    } else {
      coursesCache = [course];
    }
  } catch (error) {
    console.error("Error saving course to Firestore:", error);
  }
}

export async function deleteCourseFromFirestore(courseId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "courses", courseId));
    if (coursesCache) {
      coursesCache = coursesCache.filter(c => c.id !== courseId);
    }
  } catch (error) {
    console.error("Error deleting course from Firestore:", error);
  }
}

// ================= USERS & AUTH SERVICE =================
export async function fetchAllUsers(force = false): Promise<UserType[]> {
  if (allUsersCache && !force) {
    return allUsersCache;
  }
  try {
    const querySnapshot = await getDocs(safeCol("users"));
    const list: UserType[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as UserType);
    });
    allUsersCache = list;
    return list;
  } catch (error) {
    console.error("Error fetching users from Firestore:", error);
    return [];
  }
}

export async function fetchUserByPhone(phone: string): Promise<UserType | null> {
  if (allUsersCache) {
    const cachedUser = allUsersCache.find(u => u.phone === phone);
    if (cachedUser) return cachedUser;
  }
  try {
    const q = query(safeCol("users"), where("phone", "==", phone), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const user = snapshot.docs[0].data() as UserType;
      if (allUsersCache) {
        const idx = allUsersCache.findIndex(u => u.id === user.id);
        if (idx !== -1) {
          allUsersCache[idx] = user;
        } else {
          allUsersCache.push(user);
        }
      }
      return user;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user by phone from Firestore:", error);
    return null;
  }
}

export async function saveUserInFirestore(user: UserType): Promise<void> {
  try {
    await setDoc(doc(db, "users", user.id), user);
    if (allUsersCache) {
      const idx = allUsersCache.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        allUsersCache[idx] = user;
      } else {
        allUsersCache.push(user);
      }
    } else {
      allUsersCache = [user];
    }
  } catch (error) {
    console.error("Error saving user to Firestore:", error);
  }
}

// ================= PAYMENTS SERVICE =================
export async function fetchPendingPayments(force = false): Promise<PendingPayment[]> {
  if (pendingPaymentsCache && !force) {
    return pendingPaymentsCache;
  }
  try {
    const snapshot = await getDocs(safeCol("pending_payments"));
    const list: PendingPayment[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as PendingPayment);
    });
    if (list.length === 0) {
      for (const pay of DEFAULT_PENDING_PAYMENTS) {
        await setDoc(doc(db, "pending_payments", pay.id), pay);
      }
      pendingPaymentsCache = DEFAULT_PENDING_PAYMENTS;
      return DEFAULT_PENDING_PAYMENTS;
    }
    pendingPaymentsCache = list;
    return list;
  } catch (error) {
    console.error("Error fetching payments from Firestore:", error);
    return DEFAULT_PENDING_PAYMENTS;
  }
}

export async function savePendingPaymentInFirestore(payment: PendingPayment): Promise<void> {
  try {
    await setDoc(doc(db, "pending_payments", payment.id), payment);
    if (pendingPaymentsCache) {
      const idx = pendingPaymentsCache.findIndex(p => p.id === payment.id);
      if (idx !== -1) {
        pendingPaymentsCache[idx] = payment;
      } else {
        pendingPaymentsCache.push(payment);
      }
    } else {
      pendingPaymentsCache = [payment];
    }
  } catch (error) {
    console.error("Error saving payment to Firestore:", error);
  }
}

// ================= CHARGE CODES SERVICE =================
export async function fetchChargeCodes(force = false): Promise<ChargeCode[]> {
  if (chargeCodesCache && !force) {
    return chargeCodesCache;
  }
  try {
    const snapshot = await getDocs(safeCol("charge_codes"));
    const list: ChargeCode[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as ChargeCode);
    });
    if (list.length === 0) {
      for (const code of DEFAULT_CHARGE_CODES) {
        await setDoc(doc(db, "charge_codes", code.code), code);
      }
      chargeCodesCache = DEFAULT_CHARGE_CODES;
      return DEFAULT_CHARGE_CODES;
    }
    chargeCodesCache = list;
    return list;
  } catch (error) {
    console.error("Error fetching charge codes:", error);
    return DEFAULT_CHARGE_CODES;
  }
}

export async function saveChargeCodeInFirestore(code: ChargeCode): Promise<void> {
  try {
    await setDoc(doc(db, "charge_codes", code.code), code);
    if (chargeCodesCache) {
      const idx = chargeCodesCache.findIndex(c => c.code === code.code);
      if (idx !== -1) {
        chargeCodesCache[idx] = code;
      } else {
        chargeCodesCache.push(code);
      }
    } else {
      chargeCodesCache = [code];
    }
  } catch (error) {
    console.error("Error saving charge code:", error);
  }
}

// ================= NOTIFICATIONS SERVICE =================
export async function fetchNotifications(force = false): Promise<AppNotification[]> {
  if (notificationsCache && !force) {
    return notificationsCache;
  }
  try {
    const snapshot = await getDocs(safeCol("notifications"));
    const list: AppNotification[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as AppNotification);
    });
    if (list.length === 0) {
      for (const notif of DEFAULT_NOTIFICATIONS) {
        await setDoc(doc(db, "notifications", notif.id), notif);
      }
      notificationsCache = DEFAULT_NOTIFICATIONS;
      return DEFAULT_NOTIFICATIONS;
    }
    notificationsCache = list;
    return list;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return DEFAULT_NOTIFICATIONS;
  }
}

export async function saveNotificationInFirestore(notif: AppNotification): Promise<void> {
  try {
    await setDoc(doc(db, "notifications", notif.id), notif);
    if (notificationsCache) {
      const idx = notificationsCache.findIndex(n => n.id === notif.id);
      if (idx !== -1) {
        notificationsCache[idx] = notif;
      } else {
        notificationsCache.push(notif);
      }
    } else {
      notificationsCache = [notif];
    }
  } catch (error) {
    console.error("Error saving notification:", error);
  }
}

export async function deleteNotificationInFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "notifications", id));
    if (notificationsCache) {
      notificationsCache = notificationsCache.filter(n => n.id !== id);
    }
  } catch (error) {
    console.error("Error deleting notification:", error);
  }
}

// ================= ACTIVITY LOGS SERVICE =================
export async function fetchActivityLogs(force = false): Promise<ActivityLog[]> {
  if (activityLogsCache && !force) {
    return activityLogsCache;
  }
  try {
    const snapshot = await getDocs(safeCol("activity_logs"));
    const list: ActivityLog[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as ActivityLog);
    });
    if (list.length === 0) {
      for (const log of DEFAULT_ACTIVITY_LOGS) {
        await setDoc(doc(db, "activity_logs", log.id), log);
      }
      activityLogsCache = DEFAULT_ACTIVITY_LOGS;
      return DEFAULT_ACTIVITY_LOGS;
    }
    activityLogsCache = list;
    return list;
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return DEFAULT_ACTIVITY_LOGS;
  }
}

export async function saveActivityLogInFirestore(log: ActivityLog): Promise<void> {
  try {
    await setDoc(doc(db, "activity_logs", log.id), log);
    if (activityLogsCache) {
      const idx = activityLogsCache.findIndex(l => l.id === log.id);
      if (idx !== -1) {
        activityLogsCache[idx] = log;
      } else {
        activityLogsCache.push(log);
      }
    } else {
      activityLogsCache = [log];
    }
  } catch (error) {
    console.error("Error saving activity log:", error);
  }
}

// ================= SETTINGS SERVICE =================
export async function fetchSettings(force = false): Promise<{ video: VideoSettings; platform: PlatformSettings }> {
  if (settingsCache && !force) {
    return settingsCache;
  }
  try {
    const docSnap = await getDoc(doc(db, "settings", "global"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      const settings = {
        video: data.video || DEFAULT_VIDEO_SETTINGS,
        platform: data.platform || DEFAULT_PLATFORM_SETTINGS
      };
      settingsCache = settings;
      return settings;
    } else {
      const initial = { video: DEFAULT_VIDEO_SETTINGS, platform: DEFAULT_PLATFORM_SETTINGS };
      await setDoc(doc(db, "settings", "global"), initial);
      settingsCache = initial;
      return initial;
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    return { video: DEFAULT_VIDEO_SETTINGS, platform: DEFAULT_PLATFORM_SETTINGS };
  }
}

export async function saveSettingsInFirestore(video: VideoSettings, platform: PlatformSettings): Promise<void> {
  try {
    await setDoc(doc(db, "settings", "global"), { video, platform });
    settingsCache = { video, platform };
  } catch (error) {
    console.error("Error saving settings:", error);
  }
}

// ================= USER PROFILE UPDATE SERVICE =================
export async function updateUserInFirestore(id: string, updates: Partial<UserType>): Promise<void> {
  try {
    await updateDoc(doc(db, "users", id), updates);
    if (allUsersCache) {
      allUsersCache = allUsersCache.map(u => u.id === id ? { ...u, ...updates } : u);
    }
  } catch (error) {
    console.error("Error updating user in Firestore:", error);
  }
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "users", userId));
    if (allUsersCache) {
      allUsersCache = allUsersCache.filter(u => u.id !== userId);
    }
  } catch (error) {
    console.error("Error deleting user from Firestore:", error);
  }
}

// ================= SUPPORT TICKETS SERVICE =================
export async function fetchAllSupportTickets(force = false): Promise<SupportTicket[]> {
  if (supportTicketsCache && !force) {
    return supportTicketsCache;
  }
  try {
    const snapshot = await getDocs(safeCol("support_tickets"));
    const list: SupportTicket[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as SupportTicket);
    });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    supportTicketsCache = list;
    return list;
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    return [];
  }
}

export async function fetchSupportTicketsByUser(userId: string): Promise<SupportTicket[]> {
  if (supportTicketsCache) {
    return supportTicketsCache.filter(t => t.userId === userId);
  }
  try {
    const q = query(safeCol("support_tickets"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const list: SupportTicket[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as SupportTicket);
    });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (error) {
    console.error("Error fetching support tickets by user:", error);
    return [];
  }
}

export async function saveSupportTicketInFirestore(ticket: SupportTicket): Promise<void> {
  try {
    await setDoc(doc(db, "support_tickets", ticket.id), ticket);
    if (supportTicketsCache) {
      const idx = supportTicketsCache.findIndex(t => t.id === ticket.id);
      if (idx !== -1) {
        supportTicketsCache[idx] = ticket;
      } else {
        supportTicketsCache.push(ticket);
      }
      supportTicketsCache.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      supportTicketsCache = [ticket];
    }
  } catch (error) {
    console.error("Error saving support ticket:", error);
  }
}

// ================= LIVE QUIZZES SERVICE =================
export async function fetchLiveQuizzes(force = false): Promise<LiveQuiz[]> {
  if (liveQuizzesCache && !force) {
    return liveQuizzesCache;
  }
  try {
    const snapshot = await getDocs(safeCol("live_quizzes"));
    const list: LiveQuiz[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as LiveQuiz);
    });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    liveQuizzesCache = list;
    return list;
  } catch (error) {
    console.error("Error fetching live quizzes:", error);
    return [];
  }
}

export async function saveLiveQuizInFirestore(liveQuiz: LiveQuiz): Promise<void> {
  try {
    await setDoc(doc(db, "live_quizzes", liveQuiz.id), liveQuiz);
    if (liveQuizzesCache) {
      const idx = liveQuizzesCache.findIndex(q => q.id === liveQuiz.id);
      if (idx !== -1) {
        liveQuizzesCache[idx] = liveQuiz;
      } else {
        liveQuizzesCache.push(liveQuiz);
      }
      liveQuizzesCache.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      liveQuizzesCache = [liveQuiz];
    }
  } catch (error) {
    console.error("Error saving live quiz in Firestore:", error);
  }
}

export async function deleteLiveQuizInFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "live_quizzes", id));
    if (liveQuizzesCache) {
      liveQuizzesCache = liveQuizzesCache.filter(q => q.id !== id);
    }
  } catch (error) {
    console.error("Error deleting live quiz:", error);
  }
}

