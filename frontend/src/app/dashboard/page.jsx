"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { BookOpen, Search, Lock, Unlock, Star, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, getErrorMessage } from "@/lib/utils";

export default function DashboardPage() {
  const { isReady } = useAuth("STUDENT");
  const [courses, setCourses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (isReady) loadData();
  }, [isReady]);

  async function loadData() {
    try {
      const [coursesRes, purchasesRes] = await Promise.all([
        api.get("/courses"),
        api.get("/payments/my-purchases"),
      ]);
      setCourses(coursesRes.data.courses);
      setPurchases(purchasesRes.data.purchases.map((p) => p.course.id));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const filtered = courses.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "free" && c.isFree) ||
      (filter === "paid" && !c.isFree);
    return matchSearch && matchFilter;
  });

  if (!isReady)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1">
          {["all", "free", "paid"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filter === f ? "bg-white shadow-sm text-brand-700" : "text-gray-500"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Courses grid */}
      {loading ? (
        <div className="grid md:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-36 bg-gray-200 rounded-xl mb-4" />
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No courses found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          {filtered.map((course) => {
            const owned = course.isFree || purchases.includes(course.id);
            return (
              <Link
                key={course.id}
                href={`/course/${course.id}`}
                className="card hover:shadow-md transition-all duration-200 overflow-hidden group"
              >
                <div className="h-36 bg-gradient-to-br from-brand-100 to-indigo-100 relative overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${course.thumbnail}`}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-brand-300" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    {course.isFree ? (
                      <span className="badge bg-green-100 text-green-700">
                        <Star className="w-3 h-3" /> Free
                      </span>
                    ) : owned ? (
                      <span className="badge bg-brand-100 text-brand-700">
                        <Unlock className="w-3 h-3" /> Owned
                      </span>
                    ) : (
                      <span className="badge bg-gray-900/80 text-white">
                        <Lock className="w-3 h-3" />{" "}
                        {formatCurrency(course.price)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display font-semibold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-brand-600 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{course._count.chapters} chapters</span>
                    {!owned && !course.isFree && (
                      <span className="font-semibold text-brand-600">
                        {formatCurrency(course.price)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
