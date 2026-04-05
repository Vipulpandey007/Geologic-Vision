"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  BookOpen,
  Users,
  IndianRupee,
  TrendingUp,
  Plus,
  LogOut,
  LayoutDashboard,
  BookMarked,
  CreditCard,
  ChevronRight,
  Loader2,
} from "lucide-react";
import api from "@/lib/axios";
import { clearTokens } from "@/lib/auth";
import { useAuthStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate, getErrorMessage } from "@/lib/utils";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isReady } = useAuth("ADMIN");
  const { setUser } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isReady) loadStats();
  }, [isReady]);

  async function loadStats() {
    try {
      const { data } = await api.get("/admin/stats");
      setStats(data.stats);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearTokens();
    setUser(null);
    router.replace("/auth/login");
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const statCards = stats
    ? [
        {
          label: "Total Courses",
          value: stats.totalCourses,
          icon: BookOpen,
          color: "text-brand-600 bg-brand-50",
        },
        {
          label: "Total Students",
          value: stats.totalStudents,
          icon: Users,
          color: "text-emerald-600 bg-emerald-50",
        },
        {
          label: "Total Revenue",
          value: formatCurrency(stats.totalRevenue),
          icon: IndianRupee,
          color: "text-amber-600 bg-amber-50",
        },
        {
          label: "Avg. Per Student",
          value: formatCurrency(
            stats.totalRevenue / Math.max(stats.totalStudents, 1),
          ),
          icon: TrendingUp,
          color: "text-purple-600 bg-purple-50",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-60 bg-white border-r flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center gap-2 px-5 border-b font-display font-bold text-lg text-brand-700">
          <BookOpen className="w-5 h-5" /> EduPlatform
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
            { href: "/admin/courses", label: "Courses", icon: BookMarked },
            { href: "/admin/students", label: "Students", icon: Users },
            { href: "/admin/payments", label: "Payments", icon: CreditCard },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-brand-50 hover:text-brand-700 transition-colors"
            >
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="px-3 py-2 text-xs text-gray-400 mb-1">
            Logged in as:{" "}
            <span className="font-medium text-gray-600">{user?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b h-16 flex items-center justify-between px-8">
          <div>
            <h1 className="font-display text-xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="text-xs text-gray-400">
              Welcome back, {user?.name || user?.email}
            </p>
          </div>
          <Link href="/admin/courses/new" className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> New Course
          </Link>
        </header>

        <main className="p-8 space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading
              ? [...Array(4)].map((_, i) => (
                  <div key={i} className="card p-5 animate-pulse">
                    <div className="h-10 w-10 bg-gray-100 rounded-xl mb-3" />
                    <div className="h-6 bg-gray-200 rounded mb-1.5 w-20" />
                    <div className="h-3 bg-gray-100 rounded w-16" />
                  </div>
                ))
              : statCards.map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="card p-5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="font-display text-2xl font-bold text-gray-900 mb-0.5">
                      {value}
                    </div>
                    <div className="text-sm text-gray-500">{label}</div>
                  </div>
                ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="p-5 border-b flex items-center justify-between">
                <h2 className="font-display font-semibold text-gray-900">
                  Recent Purchases
                </h2>
                <Link
                  href="/admin/payments"
                  className="text-xs text-brand-600 hover:underline flex items-center gap-1"
                >
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="p-4 flex gap-3 animate-pulse">
                      <div className="w-8 h-8 bg-gray-100 rounded-full" />
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded mb-1.5" />
                        <div className="h-2.5 bg-gray-100 rounded w-2/3" />
                      </div>
                    </div>
                  ))
                ) : stats?.recentPurchases.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    No purchases yet
                  </div>
                ) : (
                  stats?.recentPurchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="p-4 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">
                        {(purchase.user.name ||
                          purchase.user.phone ||
                          "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {purchase.course.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {purchase.user.name || purchase.user.phone} ·{" "}
                          {formatDate(purchase.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-display font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-2">
                {[
                  {
                    href: "/admin/courses/new",
                    label: "Create New Course",
                    desc: "Add a new course with chapters",
                    icon: Plus,
                    color: "text-brand-600 bg-brand-50",
                  },
                  {
                    href: "/admin/courses",
                    label: "Manage Courses",
                    desc: "Edit, delete, or publish courses",
                    icon: BookMarked,
                    color: "text-indigo-600 bg-indigo-50",
                  },
                  {
                    href: "/admin/students",
                    label: "View Students",
                    desc: "Browse all registered students",
                    icon: Users,
                    color: "text-emerald-600 bg-emerald-50",
                  },
                  {
                    href: "/admin/payments",
                    label: "Payment History",
                    desc: "View all transactions",
                    icon: CreditCard,
                    color: "text-amber-600 bg-amber-50",
                  },
                ].map(({ href, label, desc, icon: Icon, color }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {label}
                      </p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
