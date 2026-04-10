import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle token expiry and session revocation
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const code = error.response?.data?.code;
    const status = error.response?.status;

    // Session was force-revoked by admin — logout immediately
    if (status === 401 && code === "SESSION_REVOKED") {
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
      // Clear zustand store
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth-storage");
        window.location.href = "/auth/login?reason=session_revoked";
      }
      return Promise.reject(error);
    }

    // Access token expired — try refresh
    if (status === 401 && code === "TOKEN_EXPIRED" && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = Cookies.get("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken },
        );

        Cookies.set("accessToken", data.accessToken, {
          expires: 7,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Strict",
        });
        Cookies.set("refreshToken", data.refreshToken, {
          expires: 30,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Strict",
        });

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth-storage");
          window.location.href = "/auth/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
