"use client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { BookOpen, ShoppingBag, Home, LogOut, User } from "lucide-react";
import { clearTokens } from "@/lib/auth";
import { useAuthStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/dashboard", label: "Browse Courses", icon: Home },
  { href: "/dashboard/my-courses", label: "My Courses", icon: ShoppingBag },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth("STUDENT");
  const { setUser } = useAuthStore();

  function handleLogout() {
    clearTokens();
    setUser(null);
    router.replace("/auth/login");
  }

  function isActive(href) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar ── */}
      <aside className="w-56 bg-white border-r flex-shrink-0 flex flex-col fixed h-full z-30">
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-5 border-b">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-gray-900">
            Geologic Vision
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
              {(user?.name || user?.phone || "S")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {user?.name || "Student"}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.phone || user?.email}
              </p>
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

      {/* ── Main content ── */}
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="bg-white border-b h-16 flex items-center justify-between px-8 sticky top-0 z-20">
          <div>
            <h1 className="font-display text-lg font-bold text-gray-900">
              {navItems.find((n) => isActive(n.href))?.label || "Dashboard"}
            </h1>
            <p className="text-xs text-gray-400">
              Welcome back{user?.name ? `, ${user.name}` : ""} 👋
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border rounded-xl px-3 py-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{user?.name || user?.phone}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
