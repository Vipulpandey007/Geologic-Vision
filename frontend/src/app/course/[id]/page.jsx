"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Lock,
  Unlock,
  CreditCard,
  Loader2,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/axios";
import { useAuthStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, getErrorMessage } from "@/lib/utils";

export default function CoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isReady } = useAuth(null);
  const [course, setCourse] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    // handled by useAuth
    loadCourse();
  }, [isReady, id]);

  async function loadCourse() {
    try {
      const { data } = await api.get(`/courses/${id}`);
      setCourse(data.course);
      setHasPurchased(data.hasPurchased);
    } catch (err) {
      toast.error(getErrorMessage(err));
      router.replace("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase() {
    if (!course || !user) return;
    setPaying(true);
    try {
      const { data } = await api.post("/payments/create-order", {
        courseId: course.id,
      });
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
      script.onload = () => {
        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          order_id: data.order.id,
          amount: data.order.amount,
          currency: data.order.currency,
          name: "EduPlatform",
          description: course.title,
          prefill: { contact: user.phone || "", email: user.email || "" },
          theme: { color: "#6172f3" },
          handler: async (response) => {
            try {
              await api.post("/payments/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              toast.success("Payment successful! Course unlocked 🎉");
              setHasPurchased(true);
              loadCourse();
            } catch (err) {
              toast.error("Payment verification failed. Contact support.");
            }
          },
        });
        rzp.open();
      };
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/dashboard" className="btn-secondary py-1.5 px-3 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
          <span className="text-sm text-gray-400">/</span>
          <span className="text-sm font-medium text-gray-700 line-clamp-1">
            {course.title}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                {course.isFree ? (
                  <span className="badge bg-green-100 text-green-700 text-xs">
                    Free Course
                  </span>
                ) : hasPurchased ? (
                  <span className="badge bg-brand-100 text-brand-700 text-xs">
                    <Unlock className="w-3 h-3" /> Purchased
                  </span>
                ) : (
                  <span className="badge bg-amber-100 text-amber-700 text-xs">
                    <Lock className="w-3 h-3" /> Premium
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl font-bold text-gray-900 mb-3">
                {course.title}
              </h1>
              <p className="text-gray-600 leading-relaxed">
                {course.description}
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-gray-900 mb-4">
                Course Content{" "}
                <span className="text-gray-400 text-base font-normal">
                  ({course.chapters.length} chapters)
                </span>
              </h2>
              <div className="space-y-3">
                {course.chapters.map((chapter, idx) => (
                  <div key={chapter.id} className="card overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {chapter.title}
                          </h3>
                          {chapter.description && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {chapter.description}
                            </p>
                          )}
                        </div>
                        {!hasPurchased && !course.isFree && (
                          <Lock className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        )}
                      </div>

                      {hasPurchased || course.isFree ? (
                        <div className="mt-3 pl-11 space-y-1">
                          {chapter.pdfs.map((pdf) => (
                            <Link
                              key={pdf.id}
                              href={`/course/${course.id}/pdf/${pdf.id}`}
                              className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 px-2 py-1.5 rounded-lg transition-colors group"
                            >
                              <FileText className="w-3.5 h-3.5 text-gray-400 group-hover:text-brand-500" />
                              {pdf.title}
                              <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                            </Link>
                          ))}
                          {chapter.pdfs.length === 0 && (
                            <p className="text-xs text-gray-400 italic">
                              No PDFs yet
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3 pl-11">
                          <p className="text-xs text-gray-400">
                            {chapter.pdfs.length} PDF
                            {chapter.pdfs.length !== 1 ? "s" : ""} — Purchase to
                            unlock
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              {course.isFree ? (
                <div>
                  <div className="text-3xl font-display font-bold text-green-600 mb-1">
                    Free
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    No payment required
                  </p>
                  <div className="btn-primary w-full justify-center">
                    <Unlock className="w-4 h-4" /> Access All Chapters
                  </div>
                </div>
              ) : hasPurchased ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Unlock className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Course Unlocked!
                  </h3>
                  <p className="text-sm text-gray-500">
                    You have full access to all chapters and PDFs.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-3xl font-display font-bold text-gray-900 mb-1">
                    {formatCurrency(course.price)}
                  </div>
                  <p className="text-sm text-gray-500 mb-1">One-time payment</p>
                  <p className="text-xs text-gray-400 mb-5">
                    Lifetime access • All chapters • All PDFs
                  </p>
                  <button
                    onClick={handlePurchase}
                    disabled={paying}
                    className="btn-primary w-full justify-center"
                  >
                    {paying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    {paying ? "Processing..." : "Buy Now with Razorpay"}
                  </button>
                  <p className="text-xs text-center text-gray-400 mt-3">
                    🔒 Secure payment via Razorpay
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
