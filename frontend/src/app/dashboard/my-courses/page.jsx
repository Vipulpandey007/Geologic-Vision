"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { BookOpen, ChevronRight, ShoppingBag, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, getErrorMessage } from "@/lib/utils";

export default function MyCoursesPage() {
  const { isReady } = useAuth("STUDENT");
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isReady) loadPurchases();
  }, [isReady]);

  async function loadPurchases() {
    try {
      const { data } = await api.get("/payments/my-purchases");
      setPurchases(data.purchases);
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

  return (
    <div className="space-y-4">
      {loading ? (
        [...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 animate-pulse flex gap-4">
            <div className="w-24 h-20 bg-gray-200 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))
      ) : purchases.length === 0 ? (
        <div className="card p-16 text-center">
          <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h2 className="font-display text-lg font-semibold text-gray-600 mb-1">
            No purchases yet
          </h2>
          <p className="text-gray-400 text-sm mb-5">
            Explore our course catalog and start learning
          </p>
          <Link href="/dashboard" className="btn-primary">
            <BookOpen className="w-4 h-4" /> Browse Courses
          </Link>
        </div>
      ) : (
        purchases.map((purchase) => (
          <Link
            key={purchase.id}
            href={`/course/${purchase.course.id}`}
            className="card p-4 flex gap-4 hover:shadow-md transition-all group"
          >
            <div className="w-24 h-20 rounded-xl bg-gradient-to-br from-brand-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-8 h-8 text-brand-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                {purchase.course.title}
              </h3>
              <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">
                {purchase.course.description}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span>{purchase.course._count.chapters} chapters</span>
                <span>·</span>
                <span>Purchased {formatDate(purchase.createdAt)}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 self-center flex-shrink-0 group-hover:text-brand-400 transition-colors" />
          </Link>
        ))
      )}
    </div>
  );
}
