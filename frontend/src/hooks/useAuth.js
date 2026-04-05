import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

/**
 * useAuth hook — waits for Zustand to hydrate from localStorage
 * before checking auth, so refresh doesn't cause logout.
 *
 * @param {string} requiredRole - 'STUDENT' | 'ADMIN' | null (any logged in user)
 * @returns {{ user, isReady }} — isReady is false while hydrating
 */
export function useAuth(requiredRole = null) {
  const router = useRouter();
  const { user } = useAuthStore();

  // Track if Zustand has finished loading from localStorage
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // This runs only on the client after mount
    // By this point Zustand persist has already loaded from localStorage
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Don't redirect until hydration is complete
    if (!isHydrated) return;

    // Not logged in → go to login
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // Wrong role → redirect to correct place
    if (requiredRole === "ADMIN" && user.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }

    if (requiredRole === "STUDENT" && user.role === "ADMIN") {
      router.replace("/admin");
      return;
    }
  }, [isHydrated, user, requiredRole]);

  return {
    user,
    isReady: isHydrated && !!user,
  };
}
