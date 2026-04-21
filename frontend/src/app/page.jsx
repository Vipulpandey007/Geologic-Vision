"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Shield,
  Zap,
  Users,
  ChevronRight,
  Star,
  Lock,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-bold text-xl text-brand-700">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            >
              <BookOpen className="w-6 h-6" />
            </motion.div>
            Geo Netra
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
        
        {/* Static Background Blobs for Performance */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-brand-200/40 rounded-full blur-2xl" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-indigo-200/40 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 left-1/2 w-80 h-80 bg-purple-200/40 rounded-full blur-2xl" />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative max-w-4xl mx-auto px-6 text-center"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-6 shadow-sm border border-brand-200">
            <Star className="w-3.5 h-3.5 fill-brand-500 animate-pulse" /> Trusted by 10,000+
            learners
          </motion.div>
          <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Learn with <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">chapter-wise</span>
            <br />
            structured courses
          </motion.h1>
          <motion.p variants={fadeUp} className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Access premium PDF-based courses. Secure content, beautiful viewer,
            no downloads. Pay once, learn forever.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="btn-primary px-8 py-3.5 text-base shadow-brand-500/30 shadow-lg">
              Browse Courses <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/login"
              className="btn-secondary px-8 py-3.5 text-base"
            >
              Student Login
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 max-w-6xl mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            Everything you need to learn
          </h2>
          <p className="text-center text-gray-500 mb-16 text-lg">
            Built for serious learners and educators
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-6"
        >
          {[
            {
              icon: Shield,
              title: "Secure PDF Viewer",
              desc: "Watermarked, no-download PDFs rendered in-browser. Your content stays protected.",
              color: "text-green-600 bg-green-50 border-green-100",
            },
            {
              icon: Zap,
              title: "Instant Access",
              desc: "Purchase with Razorpay and get immediate access to all chapters and PDFs.",
              color: "text-amber-600 bg-amber-50 border-amber-100",
            },
            {
              icon: Lock,
              title: "Private & Signed URLs",
              desc: "PDFs served from private S3 with 5-minute expiring signed URLs. Zero exposure.",
              color: "text-brand-600 bg-brand-50 border-brand-100",
            },
            {
              icon: BookOpen,
              title: "Chapter-wise Learning",
              desc: "Organized curriculum with ordered chapters and multiple topic-wise PDFs per chapter.",
              color: "text-purple-600 bg-purple-50 border-purple-100",
            },
            {
              icon: Users,
              title: "OTP Authentication",
              desc: "No password to remember. Login with your phone OTP, stay logged in with JWT.",
              color: "text-rose-600 bg-rose-50 border-rose-100",
            },
            {
              icon: Star,
              title: "Free & Paid Courses",
              desc: "Offer free previews alongside premium content. Full admin control over pricing.",
              color: "text-indigo-600 bg-indigo-50 border-indigo-100",
            },
          ].map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div
              variants={fadeUp}
              key={title}
              className="card p-8 group hover:-translate-y-1"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${color}`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-semibold text-gray-900 mb-3">
                {title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto px-6 text-center relative z-10"
        >
          <h2 className="font-display text-4xl font-bold text-white mb-6">
            Start learning today
          </h2>
          <p className="text-brand-100 mb-10 text-lg">
            Join thousands of students already on the platform.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-8 py-4 rounded-xl hover:bg-brand-50 hover:scale-105 hover:shadow-xl transition-all duration-300"
          >
            Get Started Free <ChevronRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-gray-400 bg-gray-50">
        © {new Date().getFullYear()} Geo Netra. All rights reserved.
      </footer>
    </div>
  );
}
