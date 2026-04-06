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
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate, getErrorMessage } from "@/lib/utils";

export default function AdminCoursesPage() {
  const { isReady } = useAuth("ADMIN");
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
    if (!confirm(`Delete "${title}"? This will remove all chapters and PDFs.`))
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {courses.length} course{courses.length !== 1 ? "s" : ""} total
        </p>
        <Link href="/admin/courses/new" className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> New Course
        </Link>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-44 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="card p-16 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h2 className="font-display text-lg font-semibold text-gray-600 mb-1">
            No courses yet
          </h2>
          <p className="text-gray-400 text-sm mb-5">
            Create your first course to get started
          </p>
          <Link href="/admin/courses/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Create Course
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
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
                <h3 className="font-display font-semibold text-gray-900 line-clamp-1 mb-1">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-2">
                  {course.description}
                </p>
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
                <span className="ml-auto">{formatDate(course.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="btn-primary py-1.5 px-3 text-xs flex-1 justify-center"
                >
                  <ChevronRight className="w-3.5 h-3.5" /> Manage
                </Link>
                <Link
                  href={`/admin/courses/${course.id}/edit`}
                  className="btn-secondary py-1.5 px-3 text-xs"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => togglePublish(course)}
                  disabled={toggling === course.id}
                  className="btn-secondary py-1.5 px-3 text-xs"
                  title={course.isPublished ? "Unpublish" : "Publish"}
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
                  title="Delete"
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
    </div>
  );
}
