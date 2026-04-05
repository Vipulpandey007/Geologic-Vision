"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Upload,
  Loader2,
  BookOpen,
  IndianRupee,
} from "lucide-react";
import api from "@/lib/axios";
import { getErrorMessage } from "@/lib/utils";

export default function NewCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [thumbnail, setThumbnail] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    isFree: false,
  });

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    if (!form.isFree && (!form.price || parseFloat(form.price) <= 0)) {
      toast.error("Enter a valid price for paid courses");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("isFree", String(form.isFree));
      formData.append("price", form.isFree ? "0" : form.price);
      if (thumbnail) formData.append("thumbnail", thumbnail);
      const { data } = await api.post("/courses", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Course created!");
      router.replace(`/admin/courses/${data.course.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-3">
          <Link
            href="/admin/courses"
            className="btn-secondary py-1.5 px-3 text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Courses
          </Link>
          <h1 className="font-display text-xl font-bold text-gray-900">
            New Course
          </h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6 space-y-5">
            <h2 className="font-display font-semibold text-gray-800 text-lg">
              Course Details
            </h2>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Course Title *
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="input"
                placeholder="e.g. Complete React.js Masterclass"
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
                placeholder="What will students learn?"
                required
                rows={4}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Thumbnail Image
              </label>
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-brand-300 transition-colors cursor-pointer"
                onClick={() =>
                  document.getElementById("thumbnail-input").click()
                }
              >
                {thumbnail ? (
                  <div>
                    <img
                      src={URL.createObjectURL(thumbnail)}
                      alt="Preview"
                      className="h-28 object-cover rounded-lg mx-auto mb-2"
                    />
                    <p className="text-xs text-gray-500">{thumbnail.name}</p>
                  </div>
                ) : (
                  <>
                    <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Click to upload thumbnail
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      JPG, PNG, WEBP up to 5MB
                    </p>
                  </>
                )}
                <input
                  id="thumbnail-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          </div>
          <div className="card p-6 space-y-4">
            <h2 className="font-display font-semibold text-gray-800 text-lg">
              Pricing
            </h2>
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50">
              <input
                type="checkbox"
                name="isFree"
                checked={form.isFree}
                onChange={handleChange}
                className="w-4 h-4 rounded text-brand-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">Free Course</p>
                <p className="text-xs text-gray-400">
                  Students can access without paying
                </p>
              </div>
            </label>
            {!form.isFree && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Price (INR) *
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    className="input pl-9"
                    placeholder="999"
                    min="1"
                    step="1"
                    required={!form.isFree}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <Link href="/admin/courses" className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-8"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {loading ? "Creating..." : "Create Course"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
