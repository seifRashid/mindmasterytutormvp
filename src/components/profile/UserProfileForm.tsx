"use client";

import { useState, useTransition } from "react";
import { User, ClassLevel } from "@/lib/types";
import { updateProfileDetailsAction, updateProfilePasswordAction } from "@/actions/profile-actions";
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Lock,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Sparkles,
  ShieldAlert,
  Loader2,
} from "lucide-react";

interface UserProfileFormProps {
  user: User;
  classes?: ClassLevel[];
}

const AVATAR_OPTIONS = [
  { value: "👨‍🎓", label: "Student" },
  { value: "👩‍🏫", label: "Teacher" },
  { value: "👨‍💻", label: "Admin" },
  { value: "🧠", label: "Brain" },
  { value: "🚀", label: "Rocket" },
  { value: "🦁", label: "Lion" },
  { value: "🦊", label: "Fox" },
  { value: "🐼", label: "Panda" },
  { value: "🦄", label: "Unicorn" },
  { value: "🌟", label: "Star" },
];

export function UserProfileForm({ user, classes = [] }: UserProfileFormProps) {
  const [activeTab, setActiveTab] = useState<"personal" | "parent" | "security">("personal");
  const [isPending, startTransition] = useTransition();

  // Profile fields state
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "");
  const [age, setAge] = useState(user.age ? String(user.age) : "");
  const [gender, setGender] = useState(user.gender || "");
  const [classId, setClassId] = useState(user.classId || "");
  const [parentName, setParentName] = useState(user.parentName || "");
  const [parentPhone, setParentPhone] = useState(user.parentPhone || "");
  const [parentEmail, setParentEmail] = useState(user.parentEmail || "");
  const [selectedAvatar, setSelectedAvatar] = useState(user.image || "👨‍🎓");

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [detailsMessage, setDetailsMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [securityMessage, setSecurityMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsMessage(null);

    startTransition(async () => {
      const res = await updateProfileDetailsAction({
        name,
        email,
        phone,
        age: age ? Number(age) : undefined,
        gender: gender as any,
        classId: user.role === "student" ? classId : undefined,
        parentName: user.role === "student" ? parentName : undefined,
        parentPhone: user.role === "student" ? parentPhone : undefined,
        parentEmail: user.role === "student" ? parentEmail : undefined,
        image: selectedAvatar,
      });

      if (res.error) {
        setDetailsMessage({ type: "error", text: res.error });
      } else {
        setDetailsMessage({ type: "success", text: "Profile details updated successfully!" });
      }
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage(null);

    if (newPassword !== confirmPassword) {
      setSecurityMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    if (newPassword.length < 6) {
      setSecurityMessage({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }

    startTransition(async () => {
      const res = await updateProfilePasswordAction({
        current: currentPassword,
        newPass: newPassword,
      });

      if (res.error) {
        setSecurityMessage({ type: "error", text: res.error });
      } else {
        setSecurityMessage({ type: "success", text: "Password changed successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  };

  const isStudent = user.role === "student";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Avatar & Overview */}
      <div className="space-y-8">
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-6 text-center">
          {/* Avatar Showcase */}
          <div className="relative w-28 h-28 bg-slate-100 dark:bg-slate-950 border-4 border-blue-500/20 rounded-full flex items-center justify-center text-5xl mx-auto select-none shadow-inner">
            {selectedAvatar}
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-blue-600 border border-white dark:border-slate-900 text-white shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white line-clamp-1">{name || "Your Name"}</h2>
            <p className="text-xs text-slate-500 font-medium">{email}</p>
            <div className="pt-2 flex justify-center gap-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border capitalize ${
                user.role === "admin"
                  ? "bg-rose-100 dark:bg-rose-950/40 text-rose-600 border-rose-300 dark:border-rose-800"
                  : user.role === "teacher"
                  ? "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 border-indigo-300 dark:border-indigo-800"
                  : "bg-blue-100 dark:bg-blue-950/40 text-blue-600 border-blue-300 dark:border-blue-800"
              }`}>
                {user.role === "admin" ? <ShieldAlert className="w-3 h-3" /> : user.role === "teacher" ? <Sparkles className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                {user.role}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-300 dark:border-emerald-800">
                <CheckCircle className="w-3 h-3" />
                Active
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-semibold border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Member since: {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Emoji Avatar Chooser */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Choose Avatar</h3>
            <p className="text-xs text-slate-500 mt-0.5">Select a personalized avatar badge to show in the interface.</p>
          </div>
          <div className="grid grid-cols-5 gap-2.5">
            {AVATAR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedAvatar(opt.value)}
                className={`w-11 h-11 text-2xl flex items-center justify-center rounded-xl border-2 transition-all active:scale-95 cursor-pointer ${
                  selectedAvatar === opt.value
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 shadow-sm"
                    : "border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950"
                }`}
                title={opt.label}
              >
                {opt.value}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Details Tabs & Forms */}
      <div className="lg:col-span-2 space-y-6">
        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm">
          <button
            onClick={() => setActiveTab("personal")}
            className={`pb-3 font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "personal"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Personal Details
          </button>
          {isStudent && (
            <button
              onClick={() => setActiveTab("parent")}
              className={`pb-3 font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === "parent"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Users className="w-4 h-4" />
              Parent Contact Info
            </button>
          )}
          <button
            onClick={() => setActiveTab("security")}
            className={`pb-3 font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "security"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Lock className="w-4 h-4" />
            Security & Password
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
          {activeTab === "personal" && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {detailsMessage && (
                <div className={`p-4 rounded-2xl border flex items-start gap-3 text-sm ${
                  detailsMessage.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300"
                }`}>
                  {detailsMessage.type === "success" ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                  <span>{detailsMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Age
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {isStudent && classes.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Grade / Class Level
                    </label>
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer select-none"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === "parent" && isStudent && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {detailsMessage && (
                <div className={`p-4 rounded-2xl border flex items-start gap-3 text-sm ${
                  detailsMessage.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300"
                }`}>
                  {detailsMessage.type === "success" ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                  <span>{detailsMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Parent / Guardian Name
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Parent Phone Number
                  </label>
                  <input
                    type="text"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Parent Email Address
                  </label>
                  <input
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer select-none"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              {securityMessage && (
                <div className={`p-4 rounded-2xl border flex items-start gap-3 text-sm ${
                  securityMessage.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300"
                }`}>
                  {securityMessage.type === "success" ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                  <span>{securityMessage.text}</span>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full max-w-md px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full max-w-md px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full max-w-md px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-start">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer select-none"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline fallback since Lucide Users icon might not be imported separately
function Users(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
