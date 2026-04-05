"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  FileText,
  GripVertical,
  Loader2,
  ChevronDown,
  ChevronRight,
  Edit2,
  Check,
  X,
} from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore } from "@/lib/store";
import { getErrorMessage } from "@/lib/utils";

export default function AdminCourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newChapter, setNewChapter] = useState({ title: "", description: "" });
  const [addingChapter, setAddingChapter] = useState(false);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(null);
  const [pdfForms, setPdfForms] = useState({});

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      router.replace("/auth/login");
      return;
    }
    loadCourse();
  }, [user, id]);

  async function loadCourse() {
    try {
      const [allCoursesRes, chaptersRes] = await Promise.all([
        api.get("/courses/admin/all"),
        api
          .get(`/chapters/course/${id}`)
          .catch(() => ({ data: { chapters: [] } })),
      ]);
      const found = allCoursesRes.data.courses.find((c) => c.id === id);
      setCourse(found);
      setChapters(
        (chaptersRes.data?.chapters || []).map((c) => ({
          ...c,
          expanded: true,
        })),
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function addChapter() {
    if (!newChapter.title.trim()) {
      toast.error("Chapter title is required");
      return;
    }
    setAddingChapter(true);
    try {
      const { data } = await api.post("/chapters", {
        courseId: id,
        title: newChapter.title,
        description: newChapter.description,
      });
      setChapters((prev) => [
        ...prev,
        { ...data.chapter, pdfs: [], expanded: true },
      ]);
      setNewChapter({ title: "", description: "" });
      setShowChapterForm(false);
      toast.success("Chapter added!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAddingChapter(false);
    }
  }

  async function deleteChapter(chapterId) {
    if (!confirm("Delete this chapter and all its PDFs?")) return;
    try {
      await api.delete(`/chapters/${chapterId}`);
      setChapters((prev) => prev.filter((c) => c.id !== chapterId));
      toast.success("Chapter deleted");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function uploadPdf(chapterId) {
    const form = pdfForms[chapterId];
    if (!form?.file || !form?.title.trim()) {
      toast.error("PDF file and title required");
      return;
    }
    setUploadingPdf(chapterId);
    try {
      const formData = new FormData();
      formData.append("pdf", form.file);
      formData.append("title", form.title.trim());
      const { data } = await api.post(`/pdfs/upload/${chapterId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setChapters((prev) =>
        prev.map((c) =>
          c.id === chapterId ? { ...c, pdfs: [...c.pdfs, data.pdf] } : c,
        ),
      );
      setPdfForms((prev) => ({
        ...prev,
        [chapterId]: { title: "", file: null },
      }));
      toast.success("PDF uploaded!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploadingPdf(null);
    }
  }

  async function deletePdf(chapterId, pdfId) {
    if (!confirm("Delete this PDF?")) return;
    try {
      await api.delete(`/pdfs/${pdfId}`);
      setChapters((prev) =>
        prev.map((c) =>
          c.id === chapterId
            ? { ...c, pdfs: c.pdfs.filter((p) => p.id !== pdfId) }
            : c,
        ),
      );
      toast.success("PDF deleted");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function toggleChapter(chapterId) {
    setChapters((prev) =>
      prev.map((c) =>
        c.id === chapterId ? { ...c, expanded: !c.expanded } : c,
      ),
    );
  }

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin/courses"
              className="btn-secondary py-1.5 px-3 text-xs flex-shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Courses
            </Link>
            <h1 className="font-display font-bold text-gray-900 truncate">
              {course?.title}
            </h1>
          </div>
          <Link
            href={`/admin/courses/${id}/edit`}
            className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Course
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-gray-900">
              Chapters{" "}
              <span className="text-gray-400 text-base font-normal">
                ({chapters.length})
              </span>
            </h2>
            <button
              onClick={() => setShowChapterForm(true)}
              className="btn-primary text-sm"
            >
              <Plus className="w-4 h-4" /> Add Chapter
            </button>
          </div>

          {showChapterForm && (
            <div className="card p-5 border-2 border-brand-200 animate-slide-up">
              <h3 className="font-semibold text-gray-800 mb-3">New Chapter</h3>
              <div className="space-y-3">
                <input
                  value={newChapter.title}
                  onChange={(e) =>
                    setNewChapter((p) => ({ ...p, title: e.target.value }))
                  }
                  className="input"
                  placeholder="Chapter title *"
                  autoFocus
                />
                <input
                  value={newChapter.description}
                  onChange={(e) =>
                    setNewChapter((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  className="input"
                  placeholder="Short description (optional)"
                />
                <div className="flex gap-2">
                  <button
                    onClick={addChapter}
                    disabled={addingChapter}
                    className="btn-primary text-sm"
                  >
                    {addingChapter ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    {addingChapter ? "Adding..." : "Add Chapter"}
                  </button>
                  <button
                    onClick={() => setShowChapterForm(false)}
                    className="btn-secondary text-sm"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {chapters.length === 0 && !showChapterForm ? (
            <div className="card p-10 text-center">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No chapters yet</p>
              <p className="text-sm text-gray-400">
                Add your first chapter to get started
              </p>
            </div>
          ) : (
            chapters.map((chapter, idx) => (
              <div key={chapter.id} className="card overflow-hidden">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleChapter(chapter.id)}
                >
                  <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">
                      {chapter.title}
                    </p>
                    {chapter.description && (
                      <p className="text-xs text-gray-400">
                        {chapter.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {chapter.pdfs.length} PDF
                    {chapter.pdfs.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChapter(chapter.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {chapter.expanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>

                {chapter.expanded && (
                  <div className="border-t bg-gray-50/50 p-4 space-y-3">
                    {chapter.pdfs.map((pdf) => (
                      <div
                        key={pdf.id}
                        className="flex items-center gap-2 p-2.5 bg-white rounded-xl border"
                      >
                        <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 flex-1 truncate">
                          {pdf.title}
                        </span>
                        <button
                          onClick={() => deletePdf(chapter.id, pdf.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <div className="flex gap-2 flex-wrap">
                      <input
                        value={pdfForms[chapter.id]?.title || ""}
                        onChange={(e) =>
                          setPdfForms((p) => ({
                            ...p,
                            [chapter.id]: {
                              ...p[chapter.id],
                              title: e.target.value,
                            },
                          }))
                        }
                        className="input text-sm flex-1 min-w-32"
                        placeholder="PDF title"
                      />
                      <label className="btn-secondary text-xs cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        {pdfForms[chapter.id]?.file
                          ? pdfForms[chapter.id].file.name.slice(0, 20) + "…"
                          : "Choose PDF"}
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) =>
                            setPdfForms((p) => ({
                              ...p,
                              [chapter.id]: {
                                ...p[chapter.id],
                                file: e.target.files?.[0] || null,
                              },
                            }))
                          }
                        />
                      </label>
                      <button
                        onClick={() => uploadPdf(chapter.id)}
                        disabled={
                          uploadingPdf === chapter.id ||
                          !pdfForms[chapter.id]?.file ||
                          !pdfForms[chapter.id]?.title
                        }
                        className="btn-primary text-xs"
                      >
                        {uploadingPdf === chapter.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        {uploadingPdf === chapter.id
                          ? "Uploading..."
                          : "Upload"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
