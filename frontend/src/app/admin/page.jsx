"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  BookOpen,
  Users,
  IndianRupee,
  TrendingUp,
  Plus,
  ChevronRight,
  Loader2,
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate, getErrorMessage } from "@/lib/utils";

export default function AdminDashboard() {
  const { isReady, user } = useAuth("ADMIN");
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

  if (!isReady)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );

  const statCards = stats
    ? [
        {
          label: "Total Courses",
          value: stats.totalCourses,
          icon: BookOpen,
          color: "text-brand-700 bg-brand-100",
        },
        {
          label: "Total Students",
          value: stats.totalStudents,
          icon: Users,
          color: "text-emerald-700 bg-emerald-100",
        },
        {
          label: "Total Revenue",
          value: formatCurrency(stats.totalRevenue),
          icon: IndianRupee,
          color: "text-amber-700 bg-amber-100",
        },
        {
          label: "Avg. Per Student",
          value: formatCurrency(
            stats.totalRevenue / Math.max(stats.totalStudents, 1),
          ),
          icon: TrendingUp,
          color: "text-purple-700 bg-purple-100",
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Welcome back, {user?.name?.split(" ")[0] || "Admin"}!
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your platform today.
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-medium text-gray-600">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats */}
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
              <div
                key={label}
                className="card p-5 border border-transparent hover:border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
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
        {/* Recent purchases */}
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
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded" />
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
                <div key={purchase.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
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

        {/* Quick actions */}
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
                icon: BookOpen,
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
                icon: IndianRupee,
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
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-gray-500" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
