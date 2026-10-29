import React, { useState } from "react";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthInput } from "../components/auth/AuthInput";
import { PasswordInput } from "../components/auth/PasswordInput";
import { loginCollegeOfficer, AuthResponse } from "../services/auth";
import { Loader2, CheckCircle2, AlertCircle, Building2, ArrowRight } from "lucide-react";

interface CollegeLoginProps {
  onSuccess: (authData: AuthResponse) => void;
  onNavigateToLogin: () => void;
  onNavigateToCollegeRegister: () => void;
}

export const CollegeLoginPage: React.FC<CollegeLoginProps> = ({
  onSuccess,
  onNavigateToLogin,
  onNavigateToCollegeRegister,
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
      setFormError("Please enter your official email address.");
      return;
    }
    if (!password) {
      setFormError("Password is required.");
      return;
    }

    setLoading(true);
    try {
      const data = await loginCollegeOfficer({
        email: cleanEmail,
        password,
      });
      onSuccess(data);
    } catch (err: any) {
      setFormError(err.message || "Invalid college officer credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      subtitle="Sign in to your institution's Placement Cell to access cohort readiness analytics and placement drives."
    >
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#FF6B00]/10 text-[#FF6B00] text-xs font-semibold uppercase tracking-wider mb-2">
            <Building2 className="h-3.5 w-3.5 text-[#FF6B00]" />
            <span>Placement Cell Portal</span>
          </div>
          <h2 className="text-[28px] sm:text-[32px] font-[700] text-[#111315] tracking-tight leading-tight">
            College Officer Login
          </h2>
          <p className="text-[14px] sm:text-[15px] text-[#737373] mt-1.5 leading-relaxed">
            Sign in with your verified institutional placement officer credentials.
          </p>
        </div>

        {/* Form Error */}
        {formError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-[9px] bg-[#FFF5F3] border border-[#FFDCD4] text-[#B91C1C] text-sm flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-[#FF5A36] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#991B1B]">Authentication Error</p>
              <p className="text-[#B91C1C] mt-0.5">{formError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <AuthInput
              id="officer-login-email"
              label="Official Email Address *"
              type="email"
              placeholder="e.g. tpo@nitk.edu.in"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formError) setFormError(null);
              }}
              required
            />
          </div>

          <div>
            <PasswordInput
              id="officer-login-password"
              label="Password *"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (formError) setFormError(null);
              }}
              required
            />
          </div>

          <div className="pt-2">
            <button
              id="btn-officer-login"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-[8px] bg-[#FF6B00] px-4 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#e56000] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:ring-offset-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to College Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <div className="pt-4 space-y-2.5 text-center text-sm text-[#737373]">
            <div>
              New institution?{" "}
              <button
                type="button"
                onClick={onNavigateToCollegeRegister}
                className="font-medium text-[#FF6B00] hover:underline transition-colors outline-none cursor-pointer"
              >
                Register College Placement Cell
              </button>
            </div>
            <div>
              Are you a student?{" "}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="font-medium text-[#111315] hover:underline transition-colors outline-none cursor-pointer"
              >
                Student Sign In
              </button>
            </div>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};
