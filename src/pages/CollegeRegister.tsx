import React, { useState, useMemo } from "react";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthInput } from "../components/auth/AuthInput";
import { PasswordInput } from "../components/auth/PasswordInput";
import {
  PasswordStrengthIndicator,
  evaluatePassword,
} from "../components/auth/PasswordStrengthIndicator";
import { registerCollege, AuthResponse } from "../services/auth";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Building2,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  School,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";

interface CollegeRegisterProps {
  onNavigateToLogin: () => void;
  onNavigateToStudentRegister: () => void;
  onSuccess?: (authData: AuthResponse) => void;
}

export const CollegeRegisterPage: React.FC<CollegeRegisterProps> = ({
  onNavigateToLogin,
  onNavigateToStudentRegister,
  onSuccess,
}) => {
  // Institution details
  const [collegeName, setCollegeName] = useState("");
  const [code, setCode] = useState("");
  const [domain, setDomain] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");

  // Placement Officer details
  const [officerName, setOfficerName] = useState("");
  const [officerEmail, setOfficerEmail] = useState("");
  const [officerPhone, setOfficerPhone] = useState("");
  const [officerDesignation, setOfficerDesignation] = useState("");

  // Credentials
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Live password validation
  const passwordEvaluation = useMemo(() => evaluatePassword(password), [password]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!collegeName.trim()) {
      errors.collegeName = "Institution Name is required.";
    }

    if (!city.trim()) {
      errors.city = "City is required.";
    }

    if (!state.trim()) {
      errors.state = "State is required.";
    }

    if (!officerName.trim()) {
      errors.officerName = "Officer Full Name is required.";
    }

    if (!officerEmail.trim()) {
      errors.officerEmail = "Official Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(officerEmail.trim())) {
      errors.officerEmail = "Enter a valid official email address.";
    }

    if (!officerPhone.trim()) {
      errors.officerPhone = "Contact Phone Number is required.";
    }

    if (!officerDesignation.trim()) {
      errors.officerDesignation = "Officer Designation is required.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (!passwordEvaluation.isValid) {
      errors.password =
        "Password must contain 8+ characters, uppercase, lowercase, number and special character.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirm Password is required.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!validateForm()) {
      setErrorMsg("Please complete all required fields correctly.");
      return;
    }

    setLoading(true);

    try {
      const response = await registerCollege({
        collegeName: collegeName.trim(),
        code: code.trim().toUpperCase() || undefined,
        domain: domain.trim().toLowerCase() || undefined,
        website: website.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        country: country.trim() || "India",
        officerName: officerName.trim(),
        officerEmail: officerEmail.trim().toLowerCase(),
        officerPhone: officerPhone.trim(),
        officerDesignation: officerDesignation.trim(),
        password,
      });

      setSuccessMsg(
        "Application submitted! Your college placement cell registration is under review."
      );

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(response);
        }
      }, 900);
    } catch (err: any) {
      const msg = err.message || "College registration failed. Please try again.";
      setErrorMsg(msg);
      if (msg.toLowerCase().includes("email")) {
        setFieldErrors((prev) => ({ ...prev, officerEmail: msg }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      showHero={false}
      wide={true}
    >
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#FF6B00]/10 text-[#FF6B00] text-xs font-semibold uppercase tracking-wider mb-2">
            <Building2 className="h-3.5 w-3.5 text-[#FF6B00]" />
            <span>College Placement Cell Portal</span>
          </div>
          <h2 className="text-[28px] sm:text-[32px] font-[700] text-[#111315] tracking-tight leading-tight">
            Register Institution
          </h2>
          <p className="text-[14px] sm:text-[15px] text-[#737373] mt-1.5 leading-relaxed">
            Submit your college details for verification. Once approved, you can
            invite cohorts and view student readiness scores.
          </p>
        </div>

        {/* Student Switch Banner */}
        <div className="mb-6 p-3.5 rounded-[9px] bg-[#18191B] border border-[#2B2D31] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5">
            <School className="h-4 w-4 text-[#FF6B00] shrink-0" />
            <span className="text-[13px] text-[#D4D4D8]">
              Are you an individual student preparing for interviews?
            </span>
          </div>
          <button
            type="button"
            onClick={onNavigateToStudentRegister}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#FF6B00] hover:text-[#ff8533] transition-colors whitespace-nowrap text-left"
          >
            <span>Student Sign Up</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div
            role="status"
            className="mb-6 p-4 rounded-[9px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-900">Application Submitted</p>
              <p className="text-emerald-700 mt-0.5">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-[9px] bg-[#FFF5F3] border border-[#FFDCD4] text-[#B91C1C] text-sm flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-[#FF5A36] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#991B1B]">Registration Error</p>
              <p className="text-[#B91C1C] mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* SECTION 1: Institution Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-[#E5E3DE]">
              <Building2 className="h-4 w-4 text-[#111315]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#111315]">
                1. College / University Profile
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
              {/* Institution Name */}
              <div className="sm:col-span-2">
                <AuthInput
                  id="college-reg-name"
                  label="Institution / University Name *"
                  placeholder="e.g. National Institute of Technology Karnataka"
                  value={collegeName}
                  onChange={(e) => {
                    setCollegeName(e.target.value);
                    if (fieldErrors.collegeName) {
                      setFieldErrors((prev) => ({ ...prev, collegeName: "" }));
                    }
                  }}
                  error={fieldErrors.collegeName}
                  required
                />
              </div>

              {/* Institution Code / Acronym */}
              <div>
                <AuthInput
                  id="college-reg-code"
                  label="College Code / Acronym"
                  placeholder="e.g. NITK, DTU, IITB"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              {/* Campus Domain */}
              <div>
                <AuthInput
                  id="college-reg-domain"
                  label="Institutional Email Domain"
                  placeholder="e.g. nitk.edu.in"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </div>

              {/* Official Website */}
              <div className="sm:col-span-2">
                <AuthInput
                  id="college-reg-website"
                  label="Official Website URL"
                  placeholder="e.g. https://www.nitk.ac.in"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              {/* City */}
              <div>
                <AuthInput
                  id="college-reg-city"
                  label="City *"
                  placeholder="e.g. Mangalore, Bengaluru, Delhi"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (fieldErrors.city) {
                      setFieldErrors((prev) => ({ ...prev, city: "" }));
                    }
                  }}
                  error={fieldErrors.city}
                  required
                />
              </div>

              {/* State */}
              <div>
                <AuthInput
                  id="college-reg-state"
                  label="State / Province *"
                  placeholder="e.g. Karnataka, Maharashtra, Delhi"
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    if (fieldErrors.state) {
                      setFieldErrors((prev) => ({ ...prev, state: "" }));
                    }
                  }}
                  error={fieldErrors.state}
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Placement Officer Credentials */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-1 border-b border-[#E5E3DE]">
              <UserCheck className="h-4 w-4 text-[#111315]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#111315]">
                2. Placement Officer In-Charge
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
              {/* Officer Full Name */}
              <div>
                <AuthInput
                  id="officer-name"
                  label="Officer Full Name *"
                  placeholder="e.g. Prof. Rajesh Sharma"
                  value={officerName}
                  onChange={(e) => {
                    setOfficerName(e.target.value);
                    if (fieldErrors.officerName) {
                      setFieldErrors((prev) => ({ ...prev, officerName: "" }));
                    }
                  }}
                  error={fieldErrors.officerName}
                  required
                />
              </div>

              {/* Officer Designation */}
              <div>
                <AuthInput
                  id="officer-designation"
                  label="Designation / Role *"
                  placeholder="e.g. Head - Training & Placement Cell"
                  value={officerDesignation}
                  onChange={(e) => {
                    setOfficerDesignation(e.target.value);
                    if (fieldErrors.officerDesignation) {
                      setFieldErrors((prev) => ({ ...prev, officerDesignation: "" }));
                    }
                  }}
                  error={fieldErrors.officerDesignation}
                  required
                />
              </div>

              {/* Officer Official Email */}
              <div>
                <AuthInput
                  id="officer-email"
                  label="Official Email Address *"
                  type="email"
                  placeholder="e.g. tpo@nitk.edu.in"
                  value={officerEmail}
                  onChange={(e) => {
                    setOfficerEmail(e.target.value);
                    if (fieldErrors.officerEmail) {
                      setFieldErrors((prev) => ({ ...prev, officerEmail: "" }));
                    }
                  }}
                  error={fieldErrors.officerEmail}
                  required
                />
              </div>

              {/* Officer Contact Phone */}
              <div>
                <AuthInput
                  id="officer-phone"
                  label="Official Phone / Mobile *"
                  placeholder="e.g. +91 9876543210"
                  value={officerPhone}
                  onChange={(e) => {
                    setOfficerPhone(e.target.value);
                    if (fieldErrors.officerPhone) {
                      setFieldErrors((prev) => ({ ...prev, officerPhone: "" }));
                    }
                  }}
                  error={fieldErrors.officerPhone}
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Account Password */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-1 border-b border-[#E5E3DE]">
              <Lock className="h-4 w-4 text-[#111315]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#111315]">
                3. Portal Password
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <PasswordInput
                  id="officer-password"
                  label="Create Password *"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: "" }));
                    }
                  }}
                  error={fieldErrors.password}
                  required
                />
                <PasswordStrengthIndicator password={password} evaluation={passwordEvaluation} />
              </div>

              <div>
                <PasswordInput
                  id="officer-confirm-password"
                  label="Confirm Password *"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                    }
                  }}
                  error={fieldErrors.confirmPassword}
                  required
                />
              </div>
            </div>
          </div>

          {/* Verification Protocol Notice */}
          <div className="p-4 rounded-[10px] bg-[#FAFAFA] border border-[#E5E3DE] text-[13px] text-[#52525B] space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#18181B]">
              <ShieldCheck className="h-4 w-4 text-[#FF6B00]" />
              <span>Administrative Verification Policy</span>
            </div>
            <p className="leading-relaxed">
              To safeguard student privacy and ensure data integrity, all institutional
              registrations are verified by Placement OS operations within 24–48 business hours.
              During review, your account will be active with status{" "}
              <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                Pending Verification
              </span>
              . Student cohort data will remain restricted until verification is complete.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-submit-college-register"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-[8px] bg-[#FF6B00] px-4 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#e56000] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:ring-offset-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <span>Submit College Registration</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* Sign In Link */}
          <div className="text-center pt-2 text-sm text-[#737373]">
            Already registered your institution?{" "}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="font-medium text-[#111315] hover:underline transition-colors outline-none cursor-pointer"
            >
              Sign In to Placement OS
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};
