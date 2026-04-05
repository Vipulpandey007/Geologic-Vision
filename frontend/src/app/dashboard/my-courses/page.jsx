"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, BookOpen, ChevronRight, ShoppingBag } from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore } from "@/lib/store";
import { formatDate, getErrorMessage } from "@/lib/utils";

export default function MyCoursesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    loadPurchases();
  }, [user]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-3">
          <Link href="/dashboard" className="btn-secondary py-1.5 px-3 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Browse
          </Link>
          <h1 className="font-display text-xl font-bold text-gray-900">
            My Courses
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse flex gap-4">
                <div className="w-24 h-20 bg-gray-200 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <h2 className="font-display text-xl font-semibold text-gray-600 mb-2">
              No purchases yet
            </h2>
            <p className="text-gray-400 mb-6">
              Explore our course catalog and start learning
            </p>
            <Link href="/dashboard" className="btn-primary">
              <BookOpen className="w-4 h-4" /> Browse Courses
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {purchases.map((purchase) => (
              <Link
                key={purchase.id}
                href={`/course/${purchase.course.id}`}
                className="card p-4 flex gap-4 hover:shadow-md transition-all group"
              >
                <div className="w-24 h-20 rounded-xl bg-gradient-to-br from-brand-100 to-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
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
                    {purchase.expiryDate && (
                      <>
                        <span>·</span>
                        <span className="text-amber-600">
                          Expires {formatDate(purchase.expiryDate)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 self-center flex-shrink-0 group-hover:text-brand-400 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
