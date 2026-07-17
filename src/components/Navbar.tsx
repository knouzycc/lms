/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, User, LogOut, Wallet, Shield, Menu, X, Bell, Trash2, CheckCircle2, AlertTriangle, FileText, Info, Sun, Moon } from "lucide-react";
import { User as UserType, PlatformSettings, AppNotification } from "../types";

interface NavbarProps {
  user: UserType | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSwitchRole: () => void;
  currentTab: string;
  onChangeTab: (tab: string) => void;
  platformSettings?: PlatformSettings;
  notifications?: AppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onClearNotifications?: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Navbar({
  user,
  onOpenAuth,
  onLogout,
  onSwitchRole,
  currentTab,
  onChangeTab,
  platformSettings,
  notifications = [],
  onMarkNotificationRead,
  onClearNotifications,
  darkMode,
  onToggleDarkMode,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  // Close notifications panel on clicking outside
  const notificationRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter notifications for current user
  const studentNotifications = React.useMemo(() => {
    if (!user) return [];
    return notifications.filter((notif) => {
      if (notif.userId === user.id) return true;
      if (notif.userId === "all") {
        if (notif.type === "new_content" && notif.courseId) {
          return user.enrolledCourseIds.includes(notif.courseId);
        }
        return true;
      }
      return false;
    });
  }, [user, notifications]);

  const unreadCount = studentNotifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = (notif: AppNotification) => {
    if (onMarkNotificationRead) {
      onMarkNotificationRead(notif.id);
    }
    setShowNotifications(false);
    if (notif.type === "new_content" || notif.type === "payment_approved") {
      onChangeTab("student-dashboard");
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-[#0f172a] border-b border-gray-100 dark:border-slate-800 shadow-xs" id="main-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Right Side: Logo & Brand in Arabic */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onChangeTab("landing")}
              className="flex items-center gap-2 text-right group cursor-pointer"
              id="logo-button"
            >
              {platformSettings?.logoUrl ? (
                <img
                  src={platformSettings.logoUrl}
                  alt={platformSettings.platformName}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-contain shadow-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-red-200 transition-transform group-hover:scale-105">
                  <span className="font-bold text-xl font-mono">π</span>
                </div>
              )}
              <div>
                <span className="block text-base sm:text-lg font-extrabold text-gray-900 tracking-tight group-hover:text-red-600 transition-colors">
                  {platformSettings?.platformName || "منصة اليسر التعليمية"}
                </span>
                <span className="block text-[10px] sm:text-xs text-red-600 font-medium">
                  المنصة الشاملة لجميع المواد الدراسية 💯
                </span>
              </div>
            </button>
          </div>

          {/* Center Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onChangeTab("landing")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentTab === "landing"
                  ? "text-red-600 bg-red-50/60 font-semibold"
                  : "text-gray-600 hover:text-red-600 hover:bg-gray-50"
              }`}
              id="nav-home"
            >
              الرئيسية
            </button>
            {user && (
              <button
                onClick={() => onChangeTab("student-dashboard")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  currentTab === "student-dashboard"
                    ? "text-red-600 bg-red-50/60 font-semibold"
                    : "text-gray-600 hover:text-red-600 hover:bg-gray-50"
                }`}
                id="nav-dashboard"
              >
                كورساتي ومتابعتي
              </button>
            )}
            <button
              onClick={() => onChangeTab("landing-about")}
              className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg ${
                currentTab === "landing-about"
                  ? "text-red-600 bg-red-50/60 font-semibold"
                  : "text-gray-600 hover:text-red-600 hover:bg-gray-50"
              }`}
            >
              من نحن
            </button>
            <button
              onClick={() => onChangeTab("landing-privacy")}
              className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg ${
                currentTab === "landing-privacy"
                  ? "text-red-600 bg-red-50/60 font-semibold"
                  : "text-gray-600 hover:text-red-600 hover:bg-gray-50"
              }`}
            >
              سياسة الخصوصية
            </button>
            <button
              onClick={() => onChangeTab("landing-terms")}
              className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg ${
                currentTab === "landing-terms"
                  ? "text-red-600 bg-red-50/60 font-semibold"
                  : "text-gray-600 hover:text-red-600 hover:bg-gray-50"
              }`}
            >
              شروط الاستخدام
            </button>
            <button
              onClick={() => onChangeTab("landing-support")}
              className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg ${
                currentTab === "landing-support"
                  ? "text-red-600 bg-red-50/60 font-semibold"
                  : "text-gray-600 hover:text-red-600 hover:bg-gray-50"
              }`}
            >
              الدعم الفني
            </button>
          </div>

          {/* Left Side: Auth & Wallet */}
          <div className="hidden md:flex items-center gap-4">
            {/* Dark Mode Toggle Button */}
            <button
              onClick={onToggleDarkMode}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title={darkMode ? "تفعيل الوضع المضيء ☀️" : "تفعيل الوضع الليلي 🌙"}
              id="dark-mode-toggle"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              <span>{darkMode ? "الوضع المضيء" : "الوضع الليلي"}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                {/* Wallet Balance */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl">
                  <Wallet className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-bold text-gray-800">
                    محفظتي:{" "}
                    <span className="text-red-600 text-base">{user.walletBalance}</span> ج.م
                  </span>
                </div>

                {/* Notification Bell Dropdown */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-red-600 rounded-xl transition-all cursor-pointer relative border border-slate-100/80 flex items-center justify-center"
                    title="الإشعارات والتنبيهات"
                    id="notification-bell-btn"
                  >
                    <Bell className="w-4.5 h-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white font-extrabold text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full animate-pulse border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        className="absolute left-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 text-right"
                        id="notifications-panel"
                      >
                        {/* Header */}
                        <div className="p-4 bg-slate-50/80 border-b border-gray-100 flex items-center justify-between">
                          <h4 className="text-xs font-black text-gray-900">مركز التنبيهات 🔔</h4>
                          {studentNotifications.length > 0 && (
                            <button
                              onClick={() => {
                                if (onClearNotifications) onClearNotifications();
                              }}
                              className="text-[10px] font-extrabold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>تفريغ الكل</span>
                            </button>
                          )}
                        </div>

                        {/* List */}
                        <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                          {studentNotifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 space-y-2">
                              <Bell className="w-8 h-8 mx-auto text-gray-200 stroke-[1.5]" />
                              <p className="text-xs font-bold">لا توجد أي إشعارات حالياً</p>
                              <p className="text-[10px] text-gray-400">سنقوم بتنبيهك فور قبول مدفوعاتك أو إضافة دروس جديدة!</p>
                            </div>
                          ) : (
                            studentNotifications.map((notif) => {
                              // Style according to type
                              let bgClass = "bg-gray-50/20 hover:bg-gray-50";
                              let iconEl = <Info className="w-3.5 h-3.5 text-gray-500" />;
                              if (notif.type === "payment_approved") {
                                bgClass = "bg-emerald-50/30 hover:bg-emerald-50/60";
                                iconEl = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
                              } else if (notif.type === "payment_rejected") {
                                bgClass = "bg-rose-50/30 hover:bg-rose-50/60";
                                iconEl = <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />;
                              } else if (notif.type === "new_content") {
                                bgClass = "bg-sky-50/30 hover:bg-sky-50/60";
                                iconEl = <FileText className="w-3.5 h-3.5 text-sky-600" />;
                              }

                              return (
                                <div
                                  key={notif.id}
                                  onClick={() => handleNotificationClick(notif)}
                                  className={`p-3.5 transition-all cursor-pointer relative ${bgClass} ${
                                    !notif.isRead ? "font-bold" : ""
                                  }`}
                                >
                                  {!notif.isRead && (
                                    <span className="absolute top-4 left-3 w-1.5 h-1.5 bg-red-600 rounded-full" />
                                  )}
                                  <div className="pl-4">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      {iconEl}
                                      <span className="text-xs font-black text-slate-800">
                                        {notif.title}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 leading-relaxed font-normal">
                                      {notif.message}
                                    </p>
                                    <span className="block text-[9px] text-gray-400 mt-2 font-mono font-medium">
                                      {new Date(notif.timestamp).toLocaleTimeString("ar-EG", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}{" "}
                                      -{" "}
                                      {new Date(notif.timestamp).toLocaleDateString("ar-EG", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Dropdown/Profile info */}
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold border border-red-200 shadow-inner">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-right">
                    <span className="block text-xs text-gray-400 font-medium">مرحباً بك</span>
                    <span className="block text-sm font-bold text-gray-800">{user.name}</span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                  title="تسجيل الخروج"
                  id="logout-button"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-red-200 cursor-pointer text-sm"
                id="login-trigger-button"
              >
                <User className="w-4 h-4" />
                <span>تسجيل الدخول / الاشتراك</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-2">
            {/* Mobile Dark Mode Toggle Button */}
            <button
              onClick={onToggleDarkMode}
              className="flex items-center gap-1.5 p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer"
              title={darkMode ? "تفعيل الوضع المضيء ☀️" : "تفعيل الوضع الليلي 🌙"}
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-indigo-600" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-350 hover:text-red-600 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-4 py-4 space-y-4"
        >
          <button
            onClick={() => {
              onChangeTab("landing");
              setMobileMenuOpen(false);
            }}
            className="block w-full text-right px-3 py-2 text-base font-semibold text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            الرئيسية
          </button>
          <button
            onClick={() => {
              onChangeTab("landing-about");
              setMobileMenuOpen(false);
            }}
            className="block w-full text-right px-3 py-2 text-base font-semibold text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            من نحن
          </button>
          <button
            onClick={() => {
              onChangeTab("landing-privacy");
              setMobileMenuOpen(false);
            }}
            className="block w-full text-right px-3 py-2 text-base font-semibold text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            سياسة الخصوصية
          </button>
          <button
            onClick={() => {
              onChangeTab("landing-terms");
              setMobileMenuOpen(false);
            }}
            className="block w-full text-right px-3 py-2 text-base font-semibold text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            شروط الاستخدام
          </button>
          <button
            onClick={() => {
              onChangeTab("landing-support");
              setMobileMenuOpen(false);
            }}
            className="block w-full text-right px-3 py-2 text-base font-semibold text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            الدعم الفني
          </button>
          {user && (
            <button
              onClick={() => {
                onChangeTab("student-dashboard");
                setMobileMenuOpen(false);
              }}
              className="block w-full text-right px-3 py-2 text-base font-semibold text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              كورساتي ومتابعتي
            </button>
          )}

          {user ? (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex items-center justify-between px-3">
                <span className="text-sm font-semibold text-gray-600">الرصيد في المحفظة:</span>
                <span className="text-base font-bold text-red-600">{user.walletBalance} ج.م</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <span className="block text-sm font-bold text-gray-800">{user.name}</span>
                  <span className="block text-xs text-gray-500">{user.phone}</span>
                </div>
              </div>

              {/* Mobile Notifications Expandable */}
              <div className="border-t border-gray-100 pt-3">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="flex items-center justify-between w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-gray-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-red-600" />
                    <span>الإشعارات والتنبيهات</span>
                    {unreadCount > 0 && (
                      <span className="bg-red-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                        {unreadCount} جديد
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400">{showNotifications ? "إغلاق ▲" : "عرض ▼"}</span>
                </button>

                {showNotifications && (
                  <div className="mt-2 bg-white border border-gray-100 rounded-xl divide-y divide-gray-50 overflow-hidden max-h-60 overflow-y-auto">
                    {studentNotifications.length === 0 ? (
                      <p className="p-4 text-center text-xs text-gray-400 font-medium">لا توجد إشعارات حالياً</p>
                    ) : (
                      studentNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            handleNotificationClick(notif);
                            setMobileMenuOpen(false);
                          }}
                          className={`p-3 text-right text-xs cursor-pointer hover:bg-gray-50 ${
                            !notif.isRead ? "bg-red-50/10 font-bold" : ""
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 text-[11px] font-black text-gray-850">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full shrink-0" style={{ display: notif.isRead ? 'none' : 'block' }} />
                            <span>{notif.title}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 font-normal leading-relaxed">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full text-right px-3 py-2 text-base font-semibold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onOpenAuth();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl"
            >
              <User className="w-4 h-4" />
              <span>تسجيل الدخول / حساب جديد</span>
            </button>
          )}
        </motion.div>
      )}
    </nav>
  );
}
