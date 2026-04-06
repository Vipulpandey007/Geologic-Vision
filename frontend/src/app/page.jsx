"use client";
import Link from "next/link";
import {
  BookOpen,
  Shield,
  Zap,
  Users,
  ChevronRight,
  Star,
  Lock,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-bold text-xl text-brand-700">
            <BookOpen className="w-6 h-6" />
            Geologic Vision
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="btn-secondary text-sm py-2 px-4"
            >
              Sign In
            </Link>
            <Link href="/auth/login" className="btn-primary text-sm py-2 px-4">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-indigo-50 pt-20 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-100/40 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
            <Star className="w-3.5 h-3.5 fill-brand-500" /> Trusted by 10,000+
            learners
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Learn with <span className="text-brand-600">chapter-wise</span>
            <br />
            structured courses
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Access premium PDF-based courses. Secure content, beautiful viewer,
            no downloads. Pay once, learn forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard" className="btn-primary px-8 py-3 text-base">
              Browse Courses <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="btn-secondary px-8 py-3 text-base"
            >
              Student Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <h2 className="font-display text-3xl font-bold text-center text-gray-900 mb-3">
          Everything you need to learn
        </h2>
        <p className="text-center text-gray-500 mb-12">
          Built for serious learners and educators
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Shield,
              title: "Secure PDF Viewer",
              desc: "Watermarked, no-download PDFs rendered in-browser. Your content stays protected.",
              color: "text-green-600 bg-green-50",
            },
            {
              icon: Zap,
              title: "Instant Access",
              desc: "Purchase with Razorpay and get immediate access to all chapters and PDFs.",
              color: "text-amber-600 bg-amber-50",
            },
            {
              icon: Lock,
              title: "Private & Signed URLs",
              desc: "PDFs served from private S3 with 5-minute expiring signed URLs. Zero exposure.",
              color: "text-brand-600 bg-brand-50",
            },
            {
              icon: BookOpen,
              title: "Chapter-wise Learning",
              desc: "Organized curriculum with ordered chapters and multiple topic-wise PDFs per chapter.",
              color: "text-purple-600 bg-purple-50",
            },
            {
              icon: Users,
              title: "OTP Authentication",
              desc: "No password to remember. Login with your phone OTP, stay logged in with JWT.",
              color: "text-rose-600 bg-rose-50",
            },
            {
              icon: Star,
              title: "Free & Paid Courses",
              desc: "Offer free previews alongside premium content. Full admin control over pricing.",
              color: "text-indigo-600 bg-indigo-50",
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="card p-6 hover:shadow-md transition-shadow"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-gray-900 mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Start learning today
          </h2>
          <p className="text-brand-200 mb-8">
            Join thousands of students already on the platform.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-8 py-3 rounded-xl hover:bg-brand-50 transition-colors"
          >
            Get Started Free <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Geologic Vision. All rights reserved.
      </footer>
    </div>
  );
}
