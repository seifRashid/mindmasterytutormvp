"use client";

import { useState } from "react";
import {
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Phone,
  Mail,
  BookOpen,
  Calendar,
  Users,
  FileText,
  AlertCircle,
  Eye,
  X,
  Check,
} from "lucide-react";
import type { User, ClassLevel } from "@/lib/types";
import { approveStudentAction, rejectStudentAction } from "@/actions/auth-actions";

interface StudentApprovalsDashboardProps {
  initialUsers: User[];
  classes: ClassLevel[];
  role: "admin" | "teacher";
}

export function StudentApprovalsDashboard({
  initialUsers,
  classes,
  role,
}: StudentApprovalsDashboardProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [rejectingStudent, setRejectingStudent] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Filter students
  const students = users.filter((u) => u.role === "student");
  
  const pendingCount = students.filter((s) => (s.status ?? "approved") === "pending").length;
  const approvedCount = students.filter((s) => (s.status ?? "approved") === "approved").length;
  const rejectedCount = students.filter((s) => s.status === "rejected").length;

  const filteredStudents = students.filter((s) => {
    const status = s.status ?? "approved";
    if (activeTab === "pending" && status !== "pending") return false;
    if (activeTab === "approved" && status !== "approved") return false;
    if (activeTab === "rejected" && status !== "rejected") return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const nameMatch = s.name.toLowerCase().includes(q);
      const emailMatch = s.email.toLowerCase().includes(q);
      const parentMatch = s.parentName?.toLowerCase().includes(q);
      return nameMatch || emailMatch || parentMatch;
    }
    return true;
  });

  const handleApprove = async (studentId: string) => {
    const res = await approveStudentAction(studentId);
    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === studentId ? { ...u, status: "approved" as const } : u))
      );
      setFeedback({ type: "success", msg: res.message });
      setTimeout(() => setFeedback(null), 3000);
      if (selectedStudent?.id === studentId) {
        setSelectedStudent((p) => (p ? { ...p, status: "approved" as const } : null));
      }
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectingStudent) return;
    const res = await rejectStudentAction(rejectingStudent.id, rejectionReason);
    if (res.success) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === rejectingStudent.id
            ? { ...u, status: "rejected" as const, rejectionReason }
            : u
        )
      );
      setFeedback({ type: "success", msg: res.message });
      setTimeout(() => setFeedback(null), 3000);
      setRejectingStudent(null);
      setRejectionReason("");
      if (selectedStudent?.id === rejectingStudent.id) {
        setSelectedStudent((p) => (p ? { ...p, status: "rejected" as const, rejectionReason } : null));
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-lg transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500 text-white shadow-emerald-500/20"
              : "bg-rose-500 text-white shadow-rose-500/20"
          }`}
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)}>
            <X className="w-4 h-4 opacity-80 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "pending"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending Review
            <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-600/40 text-amber-100 text-[10px]">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("approved")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "approved"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved ({approvedCount})
          </button>

          <button
            onClick={() => setActiveTab("rejected")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "rejected"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Rejected ({rejectedCount})
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-slate-800 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            All ({students.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or parent name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Student Registration List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-400 opacity-50" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No student registrations found
            </p>
            <p className="text-xs">
              {activeTab === "pending"
                ? "There are currently no pending student applications requiring approval."
                : "Try adjusting your search query or status filter."}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Student Info</th>
                <th className="p-4 hidden md:table-cell">Assigned Grade</th>
                <th className="p-4 hidden lg:table-cell">Parent / Guardian</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Review & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((student) => {
                const status = student.status ?? "approved";
                const studentClass = classes.find((c) => c.id === student.classId);

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Student Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-extrabold flex items-center justify-center text-xs flex-shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {student.name}
                          </p>
                          <p className="text-slate-500 text-[11px] font-mono">{student.email}</p>
                          {student.phone && (
                            <p className="text-slate-400 text-[11px]">{student.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Grade */}
                    <td className="p-4 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                        <BookOpen className="w-3.5 h-3.5 text-cyan-500" />
                        {studentClass?.name || "Grade Not Set"}
                      </span>
                    </td>

                    {/* Parent Info */}
                    <td className="p-4 hidden lg:table-cell">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {student.parentName || "—"}
                      </p>
                      <p className="text-slate-500 text-[11px] font-mono">
                        {student.parentPhone || student.parentEmail || "No parent contact"}
                      </p>
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      {status === "pending" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold text-[11px]">
                          <Clock className="w-3 h-3" />
                          Pending Review
                        </span>
                      ) : status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold text-[11px]">
                          <XCircle className="w-3 h-3" />
                          Rejected
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View full details */}
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="View Full Profile Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Approve button */}
                        {status !== "approved" && (
                          <button
                            onClick={() => handleApprove(student.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        )}

                        {/* Reject button */}
                        {status !== "rejected" && (
                          <button
                            onClick={() => {
                              setRejectingStudent(student);
                              setRejectionReason("");
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 font-bold text-[11px] transition-all"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── MODAL 1: Full Student Profile View ────────────────────────────── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-black flex items-center justify-center text-lg">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {selectedStudent.name}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedStudent.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {/* Student details */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950">
                <div>
                  <p className="text-slate-400 font-semibold">Assigned Grade</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {classes.find((c) => c.id === selectedStudent.classId)?.name || "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">Age & Gender</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedStudent.age || "N/A"} yrs · {selectedStudent.gender || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">Student Phone</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedStudent.phone || "None"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">Account Status</p>
                  <p className="font-bold capitalize mt-0.5" style={{
                    color: selectedStudent.status === "approved" ? "#10b981" : selectedStudent.status === "rejected" ? "#ef4444" : "#f59e0b"
                  }}>
                    {selectedStudent.status || "approved"}
                  </p>
                </div>
              </div>

              {/* Parent details */}
              <div className="space-y-2">
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  Parent / Guardian Details
                </p>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedStudent.parentName || "No parent name provided"}
                  </p>
                  <p className="text-slate-500">Phone: {selectedStudent.parentPhone || "None"}</p>
                  {selectedStudent.parentEmail && (
                    <p className="text-slate-500">Email: {selectedStudent.parentEmail}</p>
                  )}
                </div>
              </div>

              {/* Institution notes */}
              {selectedStudent.notes && (
                <div className="space-y-1">
                  <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Institution Notes / Special Requirements
                  </p>
                  <p className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 italic">
                    {selectedStudent.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Action buttons inside modal */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              {selectedStudent.status !== "approved" && (
                <button
                  onClick={() => handleApprove(selectedStudent.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  <UserCheck className="w-4 h-4" />
                  Approve Student
                </button>
              )}
              {selectedStudent.status !== "rejected" && (
                <button
                  onClick={() => {
                    setRejectingStudent(selectedStudent);
                    setSelectedStudent(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  <UserX className="w-4 h-4" />
                  Reject Application
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL 2: Rejection Reason Dialog ───────────────────────────────── */}
      {rejectingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-500">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Reject Student Application
                </h3>
              </div>
              <button
                onClick={() => setRejectingStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Rejecting <strong>{rejectingStudent.name}</strong> will prevent them from accessing platform content.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                Rejection Reason (Shown to Student)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete parent guardian phone information..."
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingStudent(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
