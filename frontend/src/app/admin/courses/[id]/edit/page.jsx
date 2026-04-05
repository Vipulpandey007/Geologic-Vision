"use client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Save, IndianRupee } from "lucide-react";
import api from "@/lib/axios";
import { getErrorMessage } from "@/lib/utils";

export default function EditCoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    isFree: false,
    isPublished: false,
  });

  useEffect(() => {
    loadCourse();
  }, [id]);

  async function loadCourse() {
    try {
      const { data } = await api.get("/courses/admin/all");
      const course = data.courses.find((c) => c.id === id);
      if (!course) {
        toast.error("Course not found");
        router.replace("/admin/courses");
        return;
      }
      setForm({
        title: course.title,
        description: course.description,
        price: String(course.price),
        isFree: course.isFree,
        isPublished: course.isPublished,
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/courses/${id}`, {
        ...form,
        price: form.isFree ? 0 : parseFloat(form.price),
      });
      toast.success("Course updated!");
      router.push(`/admin/courses/${id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-3">
          <Link
            href={`/admin/courses/${id}`}
            className="btn-secondary py-1.5 px-3 text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
          <h1 className="font-display text-xl font-bold text-gray-900">
            Edit Course
          </h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Title *
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="input min-h-24 resize-none"
                rows={4}
                required
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50">
              <input
                type="checkbox"
                name="isFree"
                checked={form.isFree}
                onChange={handleChange}
                className="w-4 h-4 rounded text-brand-600"
              />
              <span className="text-sm font-medium text-gray-700">
                Free Course
              </span>
            </label>
            {!form.isFree && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Price (INR)
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    className="input pl-9"
                    min="1"
                  />
                </div>
              </div>
            )}
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50">
              <input
                type="checkbox"
                name="isPublished"
                checked={form.isPublished}
                onChange={handleChange}
                className="w-4 h-4 rounded text-brand-600"
              />
              <span className="text-sm font-medium text-gray-700">
                Published (visible to students)
              </span>
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <Link href={`/admin/courses/${id}`} className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
