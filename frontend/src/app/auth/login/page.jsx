"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  BookOpen,
  Phone,
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  ChevronLeft,
  User,
  Sparkles,
} from "lucide-react";
import api from "@/lib/axios";
import { saveTokens } from "@/lib/auth";
import { useAuthStore } from "@/lib/store";
import { getErrorMessage } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [mode, setMode] = useState("student");
  const [step, setStep] = useState("phone"); // 'phone' | 'otp' | 'name'
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function resetStudentFlow() {
    setStep("phone");
    setOtp("");
    setName("");
    setIsNewUser(false);
  }

  // Step 1 - send OTP
  async function handleSendOtp(e) {
    e.preventDefault();
    if (!phone.match(/^\+[1-9]\d{7,14}$/)) {
      toast.error("Enter phone with country code. Example: +919876543210");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/student/send-otp", { phone });
      setIsNewUser(data.isNewUser);
      setStep("otp");
      toast.success("OTP sent to " + phone);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // Step 2 - verify OTP
  // New users  -> just move to name step (OTP verified on final submit)
  // Old users  -> verify OTP and login immediately
  async function handleVerifyOtp(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isNewUser) {
        // Move to name step; actual verify happens in handleCompleteSignup
        setStep("name");
        setLoading(false);
        return;
      }
      const { data } = await api.post("/auth/student/verify-otp", {
        phone,
        otp,
      });
      saveTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      toast.success("Welcome back, " + (data.user.name || "there") + "!");
      router.replace("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
      setLoading(false);
    }
  }

  // Step 3 - complete signup with name (new users only)
  async function handleCompleteSignup(e) {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Please enter your full name (at least 2 characters)");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/student/verify-otp", {
        phone,
        otp,
        name: name.trim(),
      });
      saveTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      toast.success("Welcome to EduPlatform, " + data.user.name + "!");
      router.replace("/dashboard");
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
      // OTP expired - send them back to start
      if (
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("expired")
      ) {
        resetStudentFlow();
        toast.error("OTP expired. Please request a new one.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/admin/login", { email, password });
      saveTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      toast.success("Welcome, Admin!");
      router.replace("/admin");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const totalSteps = isNewUser ? 3 : 2;
  const currentStepNum = step === "phone" ? 1 : step === "otp" ? 2 : 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="flex items-center gap-2 justify-center mb-8 font-display font-bold text-xl text-brand-700"
        >
          <BookOpen className="w-6 h-6" /> EduPlatform
        </Link>

        <div className="card p-8 shadow-lg animate-slide-up">
          {/* Mode tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {["student", "admin"].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  resetStudentFlow();
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m
                    ? "bg-white shadow-sm text-brand-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m === "student" ? "🎓 Student" : "⚙️ Admin"}
              </button>
            ))}
          </div>

          {/* ─── STUDENT FLOW ─────────────────────────────────── */}
          {mode === "student" && (
            <>
              {/* Progress dots */}
              {step !== "phone" && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-full transition-all duration-300 ${
                        i + 1 < currentStepNum
                          ? "w-2 h-2 bg-brand-600"
                          : i + 1 === currentStepNum
                            ? "w-6 h-2 bg-brand-600"
                            : "w-2 h-2 bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* STEP 1 — Phone */}
              {step === "phone" && (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-gray-900 mb-1">
                      Login or Sign up
                    </h2>
                    <p className="text-sm text-gray-500">
                      Enter your phone number to continue
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      {/* Country code selector */}
                      <select
                        className="input w-28 flex-shrink-0 bg-gray-50 font-medium"
                        value={phone.match(/^\+\d+/)?.[0] || "+91"}
                        onChange={(e) => {
                          const digits = phone.replace(/^\+\d+/, "");
                          setPhone(e.target.value + digits);
                        }}
                      >
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+65">🇸🇬 +65</option>
                        <option value="+60">🇲🇾 +60</option>
                        <option value="+61">🇦🇺 +61</option>
                      </select>
                      {/* Number input */}
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          className="input pl-10 w-full"
                          placeholder="98765 43210"
                          value={phone.replace(/^\+\d+/, "")}
                          onChange={(e) => {
                            const digits = e.target.value.replace(
                              /[^\d\s]/g,
                              "",
                            );
                            const code = phone.match(/^\+\d+/)?.[0] || "+91";
                            setPhone(code + digits);
                          }}
                          required
                          autoFocus
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Select your country code, then enter your number
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Sending
                        OTP...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" /> Send OTP
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2 — OTP */}
              {step === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <button
                    type="button"
                    onClick={resetStudentFlow}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Change number
                  </button>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-display text-2xl font-bold text-gray-900">
                        {isNewUser ? "Verify your number" : "Welcome back!"}
                      </h2>
                      {isNewUser && (
                        <Sparkles className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      OTP sent to{" "}
                      <span className="font-semibold text-gray-800">
                        {phone}
                      </span>
                    </p>
                    {isNewUser && (
                      <p className="text-xs text-brand-600 font-medium mt-1">
                        New account — we will set up your profile next
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      6-digit OTP
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        className="input pl-10 tracking-[0.5em] font-mono text-xl text-center"
                        placeholder="· · · · · ·"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        required
                        autoFocus
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        Valid for 10 minutes
                      </p>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-xs text-brand-600 hover:underline font-medium"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="btn-primary w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />{" "}
                        Verifying...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />{" "}
                        {isNewUser ? "Continue" : "Login"}
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 3 — Name (new users only) */}
              {step === "name" && (
                <form onSubmit={handleCompleteSignup} className="space-y-5">
                  <button
                    type="button"
                    onClick={() => setStep("otp")}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-display text-2xl font-bold text-gray-900">
                        Almost done!
                      </h2>
                      <Sparkles className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-sm text-gray-500">
                      Tell us your name to complete signup
                    </p>
                  </div>

                  {/* Verified phone badge */}
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                    <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700">
                      {phone}
                    </span>
                    <span className="ml-auto text-xs text-green-600 font-bold">
                      ✓ Verified
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        className="input pl-10"
                        placeholder="Ravi Kumar"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        minLength={2}
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      This appears on your profile and course certificates
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || name.trim().length < 2}
                    className="btn-primary w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Creating
                        account...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Start Learning
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          {/* ─── ADMIN FLOW ───────────────────────────────────── */}
          {mode === "admin" && (
            <form onSubmit={handleAdminLogin} className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-gray-900 mb-1">
                  Admin Login
                </h2>
                <p className="text-sm text-gray-500">
                  Sign in with your admin credentials
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    className="input pl-10"
                    placeholder="admin@eduplatform.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    className="input pl-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Sign In as Admin
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
