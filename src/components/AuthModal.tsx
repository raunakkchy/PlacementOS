import React, { useState, useEffect, useRef } from "react";
import { User, ReadinessScore, SuggestedJobRole } from "../types";
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  FileUp,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Award,
  Zap,
  UserPlus,
  LogIn,
  RotateCcw,
  Mail,
  ArrowLeft,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { sendRegistrationOtp, registerStudent, saveAuthToken } from "../services/auth";

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: "login" | "register";
  onClose: () => void;
  onSuccess: (user: User, score?: ReadinessScore, suggestedJobs?: SuggestedJobRole[]) => void;
}

const COMMON_SKILLS = [
  "Data Structures & Algorithms",
  "Java",
  "Python",
  "C++",
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "SQL",
  "MongoDB",
  "System Design",
  "Operating Systems",
  "Computer Networks",
  "DBMS",
  "Docker",
  "AWS Basics",
  "Git",
];

const COMMON_ROLES = [
  "Software Development Engineer (SDE)",
  "Full Stack Developer",
  "Frontend Engineer",
  "Backend Systems Engineer",
  "AI / ML Engineer",
  "Data Analyst",
  "Cloud & DevOps Engineer",
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = "register",
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [course, setCourse] = useState("B.Tech");
  const [branch, setBranch] = useState("Computer Science & Engineering (CSE)");
  const [otherBranch, setOtherBranch] = useState("");
  const [semester, setSemester] = useState<number | "">(6);
  const [cgpa, setCgpa] = useState<number | "">("");
  const [tenthMarks, setTenthMarks] = useState<number | "">("");
  const [twelfthMarks, setTwelfthMarks] = useState<number | "">("");
  const [graduationYear, setGraduationYear] = useState(2026);
  const [backlogs, setBacklogs] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [targetRoles, setTargetRoles] = useState<string[]>([
    "Software Development Engineer (SDE)",
  ]);
  const [resumeText, setResumeText] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");

  // Compulsory Email OTP state
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Decrement OTP resend cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const interval = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpCooldown]);

  // Focus first OTP input when opening OTP step
  useEffect(() => {
    if (isOtpStep) {
      const timer = setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOtpStep]);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setIsOtpStep(false);
      setOtpError(null);
      setOtpSuccess(false);
      setOtpDigits(Array(6).fill(""));
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleToggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills([...selectedSkills, customSkill.trim()]);
      setCustomSkill("");
    }
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setResumeText(result || "");
      };
      reader.readAsText(file);
    }
  };

  // OTP Input handlers
  const handleOtpDigitChange = (index: number, val: string) => {
    if (otpError) setOtpError(null);
    const numericChar = val.replace(/\D/g, "");

    if (!numericChar) {
      const updated = [...otpDigits];
      updated[index] = "";
      setOtpDigits(updated);
      return;
    }

    const char = numericChar.slice(-1);
    const updated = [...otpDigits];
    updated[index] = char;
    setOtpDigits(updated);

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
        const updated = [...otpDigits];
        updated[index - 1] = "";
        setOtpDigits(updated);
      } else {
        const updated = [...otpDigits];
        updated[index] = "";
        setOtpDigits(updated);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (otpError) setOtpError(null);

    const pasted = e.clipboardData.getData("text");
    const digitsOnly = pasted.replace(/\D/g, "").slice(0, 6);

    if (digitsOnly.length > 0) {
      const updated = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        updated[i] = digitsOnly[i] || "";
      }
      setOtpDigits(updated);

      const nextEmpty = updated.findIndex((d) => !d);
      if (nextEmpty !== -1) {
        otpInputRefs.current[nextEmpty]?.focus();
      } else {
        otpInputRefs.current[5]?.focus();
      }
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (otpCooldown > 0 || otpLoading) return;
    setOtpError(null);

    try {
      await sendRegistrationOtp({
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        rollNumber: rollNumber.trim() || undefined,
      });
      setOtpCooldown(60);
      setOtpDigits(Array(6).fill(""));
      otpInputRefs.current[0]?.focus();
    } catch (err: any) {
      setOtpError(err.message || "Failed to resend verification code. Please try again.");
    }
  };

  // Step 1 Submit: Login directly OR send OTP for Registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Authentication request failed");
        }

        if (data.token) {
          saveAuthToken(data.token, data.user?.email || email);
        }

        onSuccess(data.user, data.readinessScore, data.suggestedJobs);
        onClose();
      } else {
        // Registration: validate required fields first
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedName = fullName.trim();
        const trimmedCollege = college.trim();

        if (!trimmedEmail || !password || !trimmedName || !trimmedCollege || !course || !branch || semester === "" || cgpa === "") {
          throw new Error("Please fill in all mandatory fields (Name, Email, Password, College, Course, Branch, Semester, CGPA).");
        }

        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }

        // Send Registration OTP to Email
        await sendRegistrationOtp({
          email: trimmedEmail,
          fullName: trimmedName,
          rollNumber: rollNumber.trim() || undefined,
        });

        setIsOtpStep(true);
        setOtpDigits(Array(6).fill(""));
        setOtpError(null);
        setOtpCooldown(60);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Submit: Verify OTP & Create Account
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join("");

    if (fullOtp.length !== 6) {
      setOtpError("Please enter the complete 6-digit verification code.");
      return;
    }

    setOtpError(null);
    setOtpLoading(true);

    try {
      const finalBranch = branch === "Other" && otherBranch.trim() ? otherBranch.trim() : branch;
      const payload = {
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName.trim(),
        rollNumber: rollNumber.trim() || undefined,
        phone: phone.trim() || undefined,
        college: college.trim(),
        course,
        branch: finalBranch,
        semester: Number(semester),
        cgpa: Number(cgpa),
        tenthMarks: tenthMarks !== "" ? Number(tenthMarks) : undefined,
        twelfthMarks: twelfthMarks !== "" ? Number(twelfthMarks) : undefined,
        graduationYear: Number(graduationYear),
        backlogs: Number(backlogs),
        skills: selectedSkills,
        targetRoles,
        resumeText: resumeText || undefined,
        resumeFileName: resumeFileName || undefined,
        otp: fullOtp,
      };

      const data = await registerStudent(payload);
      setOtpSuccess(true);

      setTimeout(() => {
        onSuccess(data.user, data.readinessScore, data.suggestedJobs);
        onClose();
      }, 700);
    } catch (err: any) {
      setOtpError(err.message || "Invalid or expired verification code. Please check and try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header with gradient banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">PlacementOS</h2>
                <p className="text-xs text-indigo-200">
                  {mode === "register"
                    ? "Create your Student Academic & Placement Profile"
                    : "Welcome back to your Placement Intelligence Hub"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* 2 Options Switcher */}
          <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-xl bg-white/10 p-1.5 border border-white/10">
            <button
              id="tab-register-student-account"
              type="button"
              onClick={() => {
                setMode("register");
                setIsOtpStep(false);
                setError(null);
                setOtpError(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                mode === "register"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-indigo-100 hover:text-white hover:bg-white/10"
              }`}
            >
              <UserPlus className="h-4 w-4 text-indigo-600" />
              <span>1. Register Student Account</span>
            </button>
            <button
              id="tab-login-account"
              type="button"
              onClick={() => {
                setMode("login");
                setIsOtpStep(false);
                setError(null);
                setOtpError(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-indigo-100 hover:text-white hover:bg-white/10"
              }`}
            >
              <LogIn className="h-4 w-4 text-indigo-600" />
              <span>2. Login</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        {mode === "register" && isOtpStep ? (
          <div className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 mb-1">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Verify Your Email Address
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                A 6-digit verification code has been sent to{" "}
                <span className="font-semibold text-slate-800">{email}</span>. Please enter it below to activate your account.
              </p>
            </div>

            {otpError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{otpError}</span>
              </div>
            )}

            {otpSuccess ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-1">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-emerald-900">Email Verified Successfully!</p>
                <p className="text-xs text-emerald-700">Activating your Placement OS dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleVerifyAndRegister} className="space-y-5">
                {/* 6 Digit Inputs */}
                <div className="flex justify-center items-center gap-2 sm:gap-3">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el;
                      }}
                      id={`modal-reg-otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      disabled={otpLoading}
                      aria-label={`Digit ${index + 1} of 6`}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-bold text-xl sm:text-2xl rounded-xl border bg-white text-slate-900 transition-all outline-none ${
                        digit
                          ? "border-indigo-600 bg-indigo-50/40"
                          : "border-slate-300 hover:border-slate-400"
                      } focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20`}
                    />
                  ))}
                </div>

                {/* Verify & Create Account Button */}
                <button
                  id="btn-modal-verify-otp"
                  type="submit"
                  disabled={otpLoading || otpDigits.join("").length !== 6}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {otpLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Verifying & Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Verify & Complete Registration</span>
                    </>
                  )}
                </button>

                {/* Resend & Back buttons */}
                <div className="flex flex-col items-center gap-2 text-center pt-1">
                  {otpCooldown > 0 ? (
                    <p className="text-xs text-slate-500 font-medium">
                      Resend code in{" "}
                      <span className="font-bold text-slate-700 tabular-nums">
                        {String(Math.floor(otpCooldown / 60)).padStart(2, "0")}:
                        {String(otpCooldown % 60).padStart(2, "0")}
                      </span>
                    </p>
                  ) : (
                    <button
                      id="btn-modal-resend-otp"
                      type="button"
                      onClick={handleResendOtp}
                      disabled={otpLoading}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Resend Verification Code</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsOtpStep(false);
                      setOtpError(null);
                    }}
                    disabled={otpLoading}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer pt-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Edit Registration Details</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {mode === "login" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  College Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="student@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Section 1: Basic credentials */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-indigo-600" />
                  1. Basic Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Nair"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      College Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. priya.nair@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Roll / Registration Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 21CS045"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: College & Academics */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                  2. College & Academic Standing
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      College / Institute Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. National Institute of Technology / Engineering College / Polytechnic"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Degree / Course *
                    </label>
                    <select
                      value={course}
                      onChange={(e) => {
                        const newCourse = e.target.value;
                        setCourse(newCourse);
                        const maxSem = newCourse === "Diploma" || newCourse === "BCA" ? 6 : 8;
                        if (typeof semester === "number" && semester > maxSem) {
                          setSemester("");
                        }
                      }}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-white"
                    >
                      <option value="B.Tech">B.Tech (Bachelor of Technology)</option>
                      <option value="B.E.">B.E. (Bachelor of Engineering)</option>
                      <option value="Diploma">Diploma (Polytechnic / Technical Diploma)</option>
                      <option value="MCA">MCA (Master of Computer Applications)</option>
                      <option value="BCA">BCA (Bachelor of Computer Applications)</option>
                      <option value="M.Tech">M.Tech</option>
                      <option value="B.Sc CS/IT">B.Sc Computer Science / IT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      BRANCH *
                    </label>
                    <select
                      value={branch}
                      onChange={(e) => {
                        setBranch(e.target.value);
                        if (e.target.value !== "Other") setOtherBranch("");
                      }}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-white"
                    >
                      <option value="Computer Science & Engineering (CSE)">Computer Science & Engineering (CSE)</option>
                      <option value="Information Technology (IT)">Information Technology (IT)</option>
                      <option value="Electronics & Communication Engineering (ECE)">Electronics & Communication Engineering (ECE)</option>
                      <option value="Electrical Engineering (EE)">Electrical Engineering (EE)</option>
                      <option value="Mechanical Engineering (ME)">Mechanical Engineering (ME)</option>
                      <option value="Civil Engineering (CE)">Civil Engineering (CE)</option>
                      <option value="Artificial Intelligence & Machine Learning (AI/ML)">Artificial Intelligence & Machine Learning (AI/ML)</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {branch === "Other" && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        SPECIFY BRANCH *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Biomedical Engineering, Aeronautical, etc."
                        value={otherBranch}
                        onChange={(e) => setOtherBranch(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Current Semester *
                    </label>
                    <select
                      required
                      value={semester}
                      onChange={(e) => setSemester(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-white"
                    >
                      <option value="">Select Semester</option>
                      {Array.from({ length: course === "Diploma" || course === "BCA" ? 6 : 8 }, (_, i) => i + 1).map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cumulative CGPA (out of 10) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      required
                      placeholder="e.g. 8.2"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Graduation Year *
                    </label>
                    <select
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-white"
                    >
                      <option value="2025">2025 (Immediate Hiring)</option>
                      <option value="2026">2026 (Upcoming Batch)</option>
                      <option value="2027">2027 (Pre-Final Year)</option>
                      <option value="2028">2028</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Active Backlogs Count *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      required
                      value={backlogs}
                      onChange={(e) => setBacklogs(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      10th Board Marks (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="e.g. 88.0"
                      value={tenthMarks}
                      onChange={(e) => setTenthMarks(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      12th / Diploma Marks (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="e.g. 85.5"
                      value={twelfthMarks}
                      onChange={(e) => setTwelfthMarks(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Technical Skills */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span>3. Technical Skills ({selectedSkills.length} selected)</span>
                </h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {COMMON_SKILLS.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleToggleSkill(skill)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {skill}
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Skill */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add other skill (e.g. Next.js, Kafka, Redis)"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-200"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Section 4: Target Job Roles */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  4. Target Job Roles
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_ROLES.map((role) => {
                    const isSelected = targetRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setTargetRoles(targetRoles.filter((r) => r !== role));
                          } else {
                            setTargetRoles([...targetRoles, role]);
                          }
                        }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 5: Resume Upload (Optional) */}
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileUp className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Resume Upload (Optional - PDF or DOCX)
                  </span>
                  <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                    +15 Score Points
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Upload your resume to automatically scan projects, keywords, and tailor your interview questions.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    id="resume-file-input"
                    accept=".pdf,.docx,.txt"
                    onChange={handleResumeFileChange}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  {resumeFileName && (
                    <div className="text-xs font-medium text-emerald-600 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{resumeFileName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 space-y-2.5">
            <button
              id="btn-submit-auth"
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>
                {loading
                  ? mode === "register"
                    ? "Sending Verification Code..."
                    : "Logging in..."
                  : mode === "register"
                  ? "1. Proceed to Email OTP Verification"
                  : "2. Login"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Quick Switch between Option 1 & Option 2 */}
            <div className="text-center text-xs text-slate-500">
              {mode === "register" ? (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError(null);
                    }}
                    className="font-bold text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Click here to Login (Option 2)
                  </button>
                </p>
              ) : (
                <p>
                  Don't have an account yet?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setError(null);
                    }}
                    className="font-bold text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Click here to Register Student Account (Option 1)
                  </button>
                </p>
              )}
            </div>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
