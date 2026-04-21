"use client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Users,
  LayoutDashboard,
  BookMarked,
  CreditCard,
  LogOut,
  Shield,
} from "lucide-react";
import { clearTokens } from "@/lib/auth";
import { useAuthStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/courses", label: "Courses", icon: BookMarked },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/sessions", label: "Sessions", icon: Shield },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth("ADMIN");
  const { setUser } = useAuthStore();

  function handleLogout() {
    clearTokens();
    setUser(null);
    router.replace("/auth/login");
  }

  function isActive(href) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar ── */}
      <aside className="w-60 bg-white border-r flex-shrink-0 flex flex-col fixed h-full z-30">
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-5 border-b">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-gray-900">
            Geo Netra
          </span>
          <span className="ml-auto text-xs bg-brand-100 text-brand-700 font-semibold px-2 py-0.5 rounded-full">
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(href)
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User + logout */}
        <div className="p-3 border-t">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 mb-1">
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs flex-shrink-0">
              {(user?.name || user?.email || "A")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main content (offset by sidebar width) ── */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="bg-white border-b h-16 flex items-center px-8 sticky top-0 z-20">
          {/* Page title derived from pathname */}
          <div>
            <h1 className="font-display text-lg font-bold text-gray-900">
              {navItems.find((n) => isActive(n.href))?.label || "Admin"}
            </h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
