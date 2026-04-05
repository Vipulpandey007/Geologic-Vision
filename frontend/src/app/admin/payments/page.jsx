"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate, getErrorMessage } from "@/lib/utils";

const STATUS_CONFIG = {
  SUCCESS: {
    label: "Success",
    icon: CheckCircle,
    cls: "bg-green-100 text-green-700",
  },
  PENDING: {
    label: "Pending",
    icon: Clock,
    cls: "bg-amber-100 text-amber-700",
  },
  FAILED: { label: "Failed", icon: XCircle, cls: "bg-red-100 text-red-600" },
};

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { user, isReady } = useAuth("ADMIN");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // handled by useAuth
    loadPayments();
  }, [user, filter, page]);

  async function loadPayments() {
    setLoading(true);
    try {
      const { data } = await api.get("/payments/history", {
        params: {
          status: filter === "all" ? undefined : filter,
          page,
          limit: 20,
        },
      });
      setPayments(data.payments);
      setTotal(data.pagination.total);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const totalRevenue = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="btn-secondary py-1.5 px-3 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <h1 className="font-display text-xl font-bold text-gray-900">
              Payments
            </h1>
          </div>
          <div className="text-sm text-gray-500">
            Page revenue:{" "}
            <span className="font-semibold text-gray-900">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-5">
        <div className="flex gap-2">
          {["all", "SUCCESS", "PENDING", "FAILED"].map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${filter === f ? "bg-brand-600 text-white shadow-sm" : "bg-white border text-gray-600 hover:bg-gray-50"}`}
            >
              {f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/80">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">
                  Student
                </th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">
                  Course
                </th>
                <th className="text-right px-4 py-3.5 font-semibold text-gray-600">
                  Amount
                </th>
                <th className="text-center px-4 py-3.5 font-semibold text-gray-600">
                  Status
                </th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">
                  Date
                </th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">
                  Order ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(6)].map((__, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 bg-gray-100 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-gray-400"
                  >
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const cfg = STATUS_CONFIG[payment.status];
                  const Icon = cfg.icon;
                  return (
                    <tr
                      key={payment.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        {payment.user.name || payment.user.phone || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 max-w-[200px] truncate">
                        {payment.course.title}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`badge text-xs ${cfg.cls}`}>
                          <Icon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">
                        {payment.razorpayOrderId.slice(-10)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {total > 20 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of{" "}
              {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= total}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
