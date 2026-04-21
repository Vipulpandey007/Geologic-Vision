"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { BookOpen, Search, Lock, Unlock, Star, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, getErrorMessage } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function DashboardPage() {
  const { isReady, user } = useAuth("STUDENT");
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
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
          <BookOpen className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
            Welcome back, {user?.name?.split(" ")[0] || "Student"}! ✨
          </h1>
          <p className="text-brand-100 text-lg max-w-xl">
            Ready to learn something new today? Pick up where you left off or discover new courses.
          </p>
        </div>
      </motion.div>

      {/* Search + Filter */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="input pl-9 shadow-sm"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-100">
          {["all", "free", "paid"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-full text-sm font-semibold capitalize transition-all ${filter === f ? "bg-brand-50 text-brand-700" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Courses grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid md:grid-cols-3 gap-5"
          >
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-36 bg-gray-200 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-20 text-gray-400"
          >
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-medium text-lg">No courses found</p>
          </motion.div>
        ) : (
          <motion.div 
            key="grid"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-3 gap-6"
          >
            {filtered.map((course) => {
              const owned = course.isFree || purchases.includes(course.id);
              return (
                <motion.div variants={itemVariants} key={course.id}>
                  <Link
                    href={`/course/${course.id}`}
                    className="card flex flex-col h-full border border-transparent hover:border-brand-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
                  >
                    <div className="h-40 bg-gradient-to-br from-brand-100 to-indigo-100 relative overflow-hidden">
                      {course.thumbnail ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}${course.thumbnail}`}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                          <BookOpen className="w-12 h-12 text-brand-300" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        {course.isFree ? (
                          <span className="badge bg-green-100 text-green-700 shadow-sm border border-green-200">
                            <Star className="w-3 h-3" /> Free
                          </span>
                        ) : owned ? (
                          <span className="badge bg-brand-100 text-brand-700 shadow-sm border border-brand-200">
                            <Unlock className="w-3 h-3" /> Owned
                          </span>
                        ) : (
                          <span className="badge bg-gray-900/80 backdrop-blur text-white shadow-sm">
                            <Lock className="w-3 h-3" />{" "}
                            {formatCurrency(course.price)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-display font-semibold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                        {course.description}
                      </p>
                      <div className="flex items-center justify-between text-xs font-medium text-gray-500 pt-3 border-t border-gray-50">
                        <span className="bg-gray-100 px-2 py-1 rounded-md">{course._count.chapters} chapters</span>
                        {!owned && !course.isFree && (
                          <span className="font-bold text-brand-600 text-sm">
                            {formatCurrency(course.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
