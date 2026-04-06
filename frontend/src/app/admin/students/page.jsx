"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Search,
  Users,
  ToggleLeft,
  ToggleRight,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, getErrorMessage } from "@/lib/utils";

export default function AdminStudentsPage() {
  const { isReady } = useAuth("ADMIN");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (isReady) loadStudents();
  }, [isReady, page, search]);

  async function loadStudents() {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/students", {
        params: { page, limit: 20, search: search || undefined },
      });
      setStudents(data.students);
      setTotal(data.pagination.total);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function toggleStudent(id) {
    setToggling(id);
    try {
      const { data } = await api.patch(`/admin/students/${id}/toggle`);
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: data.isActive } : s)),
      );
      toast.success(data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggling(null);
    }
  }

  if (!isReady)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <span className="text-sm text-gray-500">{total} students total</span>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/80">
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600">
                Student
              </th>
              <th className="text-left px-4 py-3.5 font-semibold text-gray-600">
                Contact
              </th>
              <th className="text-left px-4 py-3.5 font-semibold text-gray-600">
                Joined
              </th>
              <th className="text-center px-4 py-3.5 font-semibold text-gray-600">
                Purchases
              </th>
              <th className="text-center px-4 py-3.5 font-semibold text-gray-600">
                Status
              </th>
              <th className="text-center px-4 py-3.5 font-semibold text-gray-600">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(6)].map((__, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-4 bg-gray-100 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : students.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-gray-400"
                >
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No students found
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {(student.name ||
                          student.phone ||
                          "?")[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">
                        {student.name || "Unnamed"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500">
                    {student.phone || student.email || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-gray-400">
                    {formatDate(student.createdAt)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="flex items-center justify-center gap-1 text-gray-600">
                      <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
                      {student._count.purchases}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`badge text-xs ${student.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                    >
                      {student.isActive ? "Active" : "Blocked"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => toggleStudent(student.id)}
                      disabled={toggling === student.id}
                      className={`p-1.5 rounded-lg transition-colors ${student.isActive ? "text-gray-400 hover:text-red-500 hover:bg-red-50" : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}
                    >
                      {toggling === student.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : student.isActive ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of{" "}
            {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= total}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
