"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
  ChevronRight,
  Loader2,
  BookMarked,
  Users,
  ArrowLeft,
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate, getErrorMessage } from "@/lib/utils";

export default function AdminCoursesPage() {
  const { user, isReady } = useAuth("ADMIN");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    if (isReady) loadCourses();
  }, [isReady]);

  async function loadCourses() {
    try {
      const { data } = await api.get("/courses/admin/all");
      setCourses(data.courses);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function togglePublish(course) {
    setToggling(course.id);
    try {
      await api.put(`/courses/${course.id}`, {
        isPublished: !course.isPublished,
      });
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id ? { ...c, isPublished: !c.isPublished } : c,
        ),
      );
      toast.success(
        `Course ${!course.isPublished ? "published" : "unpublished"}`,
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggling(null);
    }
  }

  async function deleteCourse(id, title) {
    if (
      !confirm(
        `Delete "${title}"? This will remove all chapters and PDFs permanently.`,
      )
    )
      return;
    setDeleting(id);
    try {
      await api.delete(`/courses/${id}`);
      setCourses((prev) => prev.filter((c) => c.id !== id));
      toast.success("Course deleted");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  }

  if (!isReady)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="btn-secondary py-1.5 px-3 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <h1 className="font-display text-xl font-bold text-gray-900">
              Courses
            </h1>
          </div>
          <Link href="/admin/courses/new" className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> New Course
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="card p-5 h-44 animate-pulse bg-gray-100"
              />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-14 h-14 mx-auto text-gray-300 mb-4" />
            <h2 className="font-display text-xl font-semibold text-gray-600 mb-2">
              No courses yet
            </h2>
            <Link href="/admin/courses/new" className="btn-primary">
              <Plus className="w-4 h-4" /> Create Course
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div key={course.id} className="card p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`badge text-xs ${course.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {course.isPublished ? "Published" : "Draft"}
                      </span>
                      <span
                        className={`badge text-xs ${course.isFree ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}
                      >
                        {course.isFree ? "Free" : formatCurrency(course.price)}
                      </span>
                    </div>
                    <h3 className="font-display font-semibold text-gray-900 line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2 mt-0.5">
                      {course.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <BookMarked className="w-3.5 h-3.5" />
                    {course._count.chapters} chapters
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {course._count.purchases} students
                  </span>
                  <span>{formatDate(course.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t">
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="btn-primary py-1.5 px-3 text-xs flex-1 justify-center"
                  >
                    <ChevronRight className="w-3.5 h-3.5" /> Manage
                  </Link>
                  <Link
                    href={`/admin/courses/${course.id}/edit`}
                    className="btn-secondary py-1.5 px-3 text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => togglePublish(course)}
                    disabled={toggling === course.id}
                    className="btn-secondary py-1.5 px-3 text-xs"
                  >
                    {toggling === course.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : course.isPublished ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteCourse(course.id, course.title)}
                    disabled={deleting === course.id}
                    className="btn-danger py-1.5 px-3 text-xs"
                  >
                    {deleting === course.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
