"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Shield,
  Loader2,
  AlertTriangle,
  Monitor,
  LogOut,
  RefreshCw,
  Smartphone,
  CheckCircle,
  Users,
  Activity,
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, getErrorMessage } from "@/lib/utils";

export default function SessionsPage() {
  const { isReady } = useAuth("ADMIN");
  const [overview, setOverview] = useState({
    suspiciousUsers: [],
    normalUsers: [],
    totalActiveSessions: 0,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revoking, setRevoking] = useState(null);
  const [tab, setTab] = useState("suspicious"); // 'suspicious' | 'all'

  useEffect(() => {
    if (isReady) loadOverview();
  }, [isReady]);

  async function loadOverview() {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/sessions/overview");
      setOverview(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadUserSessions(user) {
    setSelectedUser(user);
    setLoadingSessions(true);
    try {
      const { data } = await api.get(`/admin/students/${user.id}/sessions`);
      setSessions(data.sessions);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingSessions(false);
    }
  }

  async function revokeSession(sessionId) {
    setRevoking(sessionId);
    try {
      await api.delete(`/admin/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Session revoked — user will be logged out on next action");
      loadOverview();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRevoking(null);
    }
  }

  async function revokeAllSessions(userId) {
    if (!confirm("Force logout this user from ALL devices?")) return;
    setRevoking("all-" + userId);
    try {
      const { data } = await api.delete(`/admin/students/${userId}/sessions`);
      toast.success(data.message);
      setSessions([]);
      setSelectedUser(null);
      loadOverview();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRevoking(null);
    }
  }

  function getDeviceIcon(deviceInfo) {
    if (!deviceInfo) return Monitor;
    if (deviceInfo.toLowerCase().includes("mobile")) return Smartphone;
    return Monitor;
  }

  const displayUsers =
    tab === "suspicious"
      ? overview.suspiciousUsers
      : [...overview.suspiciousUsers, ...overview.normalUsers];

  if (!isReady)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <Activity className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-gray-900">
              {overview.totalActiveSessions}
            </p>
            <p className="text-xs text-gray-500">Active Sessions</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-gray-900">
              {overview.suspiciousUsers.length}
            </p>
            <p className="text-xs text-gray-500">Multi-Device Users</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-gray-900">
              {overview.suspiciousUsers.length + overview.normalUsers.length}
            </p>
            <p className="text-xs text-gray-500">Users Online</p>
          </div>
        </div>
      </div>

      {/* Info banner — only if suspicious users exist */}
      {overview.suspiciousUsers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {overview.suspiciousUsers.length} user
              {overview.suspiciousUsers.length > 1 ? "s are" : " is"} logged in
              on multiple devices
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              This may indicate credential sharing. Click any user to inspect
              their sessions and force logout specific devices.
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left — user list */}
        <div className="card">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-600" />
              <h2 className="font-display font-semibold text-gray-900">
                Active Users
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {/* Tab toggle */}
              <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setTab("suspicious")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${tab === "suspicious" ? "bg-white shadow-sm text-red-600" : "text-gray-500"}`}
                >
                  Flagged{" "}
                  {overview.suspiciousUsers.length > 0 &&
                    `(${overview.suspiciousUsers.length})`}
                </button>
                <button
                  onClick={() => setTab("all")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${tab === "all" ? "bg-white shadow-sm text-brand-600" : "text-gray-500"}`}
                >
                  All (
                  {overview.suspiciousUsers.length +
                    overview.normalUsers.length}
                  )
                </button>
              </div>
              <button
                onClick={loadOverview}
                disabled={loading}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 text-gray-400 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          ) : displayUsers.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">
                {tab === "suspicious"
                  ? "No multi-device users right now"
                  : "No active sessions"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {tab === "suspicious"
                  ? 'Switch to "All" tab to see everyone online'
                  : "No users are currently logged in"}
              </p>
            </div>
          ) : (
            <div className="divide-y max-h-96 overflow-y-auto">
              {displayUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => loadUserSessions(user)}
                  className={`p-4 flex items-center gap-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedUser?.id === user.id
                      ? "bg-brand-50 border-l-4 border-brand-500"
                      : ""
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center flex-shrink-0 ${
                      user.activeSessions > 1
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {(user.name || user.phone || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.name || "Unnamed"}
                      </p>
                      {user.role === "ADMIN" && (
                        <span className="badge bg-brand-100 text-brand-700 text-xs">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {user.phone || user.email}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full flex-shrink-0 ${
                      user.activeSessions > 1
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    <Monitor className="w-3 h-3" />
                    <span className="text-xs font-bold">
                      {user.activeSessions} device
                      {user.activeSessions > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — session details */}
        <div className="card">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-display font-semibold text-gray-900">
              {selectedUser
                ? `${selectedUser.name || selectedUser.phone} — Sessions`
                : "Select a user"}
            </h2>
            {selectedUser && sessions.length > 0 && (
              <button
                onClick={() => revokeAllSessions(selectedUser.id)}
                disabled={!!revoking}
                className="btn-danger py-1.5 px-3 text-xs"
              >
                {revoking === "all-" + selectedUser?.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                Force Logout All
              </button>
            )}
          </div>

          {!selectedUser ? (
            <div className="p-8 text-center text-gray-400">
              <Monitor className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">
                Click any user to see their active devices
              </p>
            </div>
          ) : loadingSessions ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No active sessions
            </div>
          ) : (
            <div className="divide-y max-h-96 overflow-y-auto">
              {sessions.map((session, idx) => {
                const DeviceIcon = getDeviceIcon(session.deviceInfo);
                return (
                  <div key={session.id} className="p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <DeviceIcon className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-semibold text-gray-800">
                          Device {idx + 1}
                        </p>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {session.deviceInfo || "Unknown device"}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {session.ipAddress && (
                          <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                            {session.ipAddress}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          Active {formatDate(session.lastActiveAt)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => revokeSession(session.id)}
                      disabled={!!revoking}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Revoke this session"
                    >
                      {revoking === session.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
