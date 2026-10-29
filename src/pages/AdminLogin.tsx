import React, { useState } from "react";
import { loginAdmin, AuthResponse } from "../services/auth";
import { Loader2, AlertCircle, ShieldAlert, ArrowRight, Lock, LogIn } from "lucide-react";

interface AdminLoginProps {
  onSuccess: (authData: AuthResponse) => void;
  onNavigateToStudentLogin: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginProps> = ({
  onSuccess,
  onNavigateToStudentLogin,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFormError("Administrator email is required.");
      return;
    }
    if (!password) {
      setFormError("Password is required.");
      return;
    }

    setLoading(true);
    try {
      const data = await loginAdmin({
        email: cleanEmail,
        password,
      });
      onSuccess(data);
    } catch (err: any) {
      setFormError(err.message || "Access denied. Administrator credentials required.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1012] text-[#F3F4F6] flex flex-col justify-center items-center px-4 font-sans selection:bg-[#FF6B00]/30 selection:text-white">
      <div className="w-full max-w-[420px] bg-[#16171A] border border-[#26282E] rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B00] text-white shadow-lg">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Super Admin Console
          </h1>
          <p className="text-xs text-[#A1A1AA]">
            Placement OS Platform Operations & Institutional Governance
          </p>
        </div>

        {/* Form Error */}
        {formError && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-950/50 border border-rose-600/40 text-rose-200 text-sm flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">Access Denied</p>
              <p className="text-rose-200/90 mt-0.5 text-xs">{formError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">
              Admin Email
            </label>
            <input
              id="admin-login-email"
              type="email"
              required
              placeholder="admin@placementos.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formError) setFormError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E2025] border border-[#32353E] text-white text-sm placeholder-[#71717A] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">
              Password
            </label>
            <input
              id="admin-login-password"
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (formError) setFormError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E2025] border border-[#32353E] text-white text-sm placeholder-[#71717A] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              id="btn-admin-login"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#FF6B00] hover:bg-[#e56000] px-4 py-3 text-sm font-semibold text-white shadow-md active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Authenticating Admin...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Console</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className="pt-4 text-center text-xs text-[#A1A1AA]">
            <button
              type="button"
              onClick={onNavigateToStudentLogin}
              className="hover:text-white transition-colors underline cursor-pointer"
            >
              Return to Student Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
