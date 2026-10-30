import React, { useState, useEffect } from "react";
import { User, College } from "../types";
import {
  getAdminColleges,
  getAdminCollege,
  verifyCollege,
  rejectCollege,
  suspendCollege,
  unsuspendCollege,
  deleteCollegePermanently,
  updateAdminCredentials,
  AdminCollegesResponse,
} from "../services/auth";
import { Footer } from "../components/navigation/Footer";
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Mail,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  ChevronRight,
  Filter,
  FileText,
  UserCheck,
  X,
  Loader2,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  Calendar,
  ArrowUpDown,
  History,
} from "lucide-react";

interface AdminCollegesProps {
  user: User;
  onLogout: () => void;
}

const VERIFICATION_METHODS = [
  "Official Institutional Domain Email Confirmed (@college.edu/.ac.in)",
  "Registrar / Vice-Chancellor Office Direct Phone Verification",
  "Institutional Accreditation Registry (AICTE / UGC / NAAC / NIRF)",
  "Signed Placement Partnership MOU & Documentation",
  "State Directorate of Technical Education Directory",
  "Campus Placement Cell Letterhead & Authorized Signatory",
];

export const AdminCollegesPage: React.FC<AdminCollegesProps> = ({
  user,
  onLogout,
}) => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    suspended: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Filters, Date Range & Sorting
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Modal states
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [fullCollegeData, setFullCollegeData] = useState<{ college: College; officer: User | null; auditLogs?: any[] } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [actionType, setActionType] = useState<"verify" | "reject" | "suspend" | "unsuspend" | "delete" | "details" | null>(null);
  const [verificationMethod, setVerificationMethod] = useState(VERIFICATION_METHODS[0]);
  const [customMethod, setCustomMethod] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [reviewNotesInput, setReviewNotesInput] = useState("");
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Super Admin Credentials Update Modal state
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [adminEmailDisplay, setAdminEmailDisplay] = useState(user.email);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newEmailInput, setNewEmailInput] = useState(user.email);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [credsLoading, setCredsLoading] = useState(false);
  const [credsError, setCredsError] = useState<string | null>(null);

  const fetchColleges = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError(null);
    try {
      const res: AdminCollegesResponse = await getAdminColleges({
        status: statusFilter,
        search: searchQuery.trim() || undefined,
        sort: sortOrder,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res && res.colleges) {
        setColleges(res.colleges);
        setCounts(res.counts);
      }
    } catch (err: any) {
      console.error("Failed to load colleges:", err);
      setError(err.message || "Failed to load colleges.");
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, [statusFilter, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchColleges(true);
  };

  const handleApplyDateFilter = () => {
    fetchColleges(true);
  };

  const handleClearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    setError(null);
    getAdminColleges({
      status: statusFilter,
      search: searchQuery.trim() || undefined,
      sort: sortOrder,
    }).then((res) => {
      if (res && res.colleges) {
        setColleges(res.colleges);
        setCounts(res.counts);
      }
    });
  };

  const openActionModal = async (
    college: College,
    type: "verify" | "reject" | "suspend" | "unsuspend" | "delete" | "details"
  ) => {
    setSelectedCollege(college);
    setActionType(type);
    setActionError(null);
    setReasonInput("");
    setReviewNotesInput(college.reviewNotes || "");
    setDeleteConfirmInput("");
    setVerificationMethod(VERIFICATION_METHODS[0]);
    setCustomMethod("");

    if (type === "details") {
      setLoadingDetails(true);
      try {
        const fullData = await getAdminCollege(college.id);
        setFullCollegeData(fullData);
      } catch (err: any) {
        console.error("Error fetching full details:", err);
      } finally {
        setLoadingDetails(false);
      }
    }
  };

  const closeActionModal = () => {
    setSelectedCollege(null);
    setFullCollegeData(null);
    setActionType(null);
    setActionError(null);
    setDeleteConfirmInput("");
  };

  const handleConfirmVerify = async () => {
    if (!selectedCollege) return;
    setActionError(null);

    const method =
      verificationMethod === "Other"
        ? customMethod.trim()
        : verificationMethod;

    if (!method) {
      setActionError("Please select or enter the verification method used.");
      return;
    }

    setSubmittingAction(true);
    try {
      await verifyCollege(selectedCollege.id, {
        verificationMethod: method,
        reviewNotes: reviewNotesInput.trim() || undefined,
      });

      setSuccessNotice(`Successfully verified '${selectedCollege.name}'. Placement officer now has full portal access.`);
      closeActionModal();
      fetchColleges(true);
      setTimeout(() => setSuccessNotice(null), 6000);
    } catch (err: any) {
      setActionError(err.message || "Failed to verify college.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedCollege) return;
    setActionError(null);

    if (!reasonInput.trim()) {
      setActionError("Please provide a clear rejection reason for the applicant.");
      return;
    }

    setSubmittingAction(true);
    try {
      await rejectCollege(selectedCollege.id, {
        rejectionReason: reasonInput.trim(),
        reviewNotes: reviewNotesInput.trim() || undefined,
      });

      setSuccessNotice(`Application for '${selectedCollege.name}' has been rejected.`);
      closeActionModal();
      fetchColleges(true);
      setTimeout(() => setSuccessNotice(null), 6000);
    } catch (err: any) {
      setActionError(err.message || "Failed to reject college.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmSuspend = async () => {
    if (!selectedCollege) return;
    setActionError(null);

    if (!reasonInput.trim()) {
      setActionError("Please provide a justification for suspending portal access.");
      return;
    }

    setSubmittingAction(true);
    try {
      await suspendCollege(selectedCollege.id, {
        suspensionReason: reasonInput.trim(),
        reviewNotes: reviewNotesInput.trim() || undefined,
      });

      setSuccessNotice(`Portal access for '${selectedCollege.name}' has been suspended.`);
      closeActionModal();
      fetchColleges(true);
      setTimeout(() => setSuccessNotice(null), 6000);
    } catch (err: any) {
      setActionError(err.message || "Failed to suspend college.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmUnsuspend = async () => {
    if (!selectedCollege) return;
    setActionError(null);
    setSubmittingAction(true);
    try {
      await unsuspendCollege(selectedCollege.id, reviewNotesInput.trim() || undefined);
      setSuccessNotice(`Successfully unsuspended and restored portal access for '${selectedCollege.name}'.`);
      closeActionModal();
      fetchColleges(true);
      setTimeout(() => setSuccessNotice(null), 6000);
    } catch (err: any) {
      setActionError(err.message || "Failed to unsuspend college.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCollege) return;
    if (deleteConfirmInput.trim() !== selectedCollege.name.trim()) {
      setActionError(`Confirmation mismatch. Please type exact institution name: "${selectedCollege.name}".`);
      return;
    }

    setActionError(null);
    setSubmittingAction(true);
    try {
      await deleteCollegePermanently(selectedCollege.id);
      setSuccessNotice(`Permanently deleted college '${selectedCollege.name}' and dissociated affiliated records.`);
      closeActionModal();
      fetchColleges(true);
      setTimeout(() => setSuccessNotice(null), 6000);
    } catch (err: any) {
      setActionError(err.message || "Failed to delete college.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredsError(null);

    if (!currentPasswordInput) {
      setCredsError("Current password is required.");
      return;
    }

    if (newPasswordInput && newPasswordInput !== confirmPasswordInput) {
      setCredsError("New password and confirmation do not match.");
      return;
    }

    const cleanEmail = newEmailInput.trim().toLowerCase();
    const emailChanged = cleanEmail && cleanEmail !== adminEmailDisplay.toLowerCase();
    const passwordChanged = Boolean(newPasswordInput);

    if (!emailChanged && !passwordChanged) {
      setCredsError("Please enter a new email or new password to update.");
      return;
    }

    setCredsLoading(true);
    try {
      const res = await updateAdminCredentials({
        currentPassword: currentPasswordInput,
        newEmail: emailChanged ? cleanEmail : undefined,
        newPassword: passwordChanged ? newPasswordInput : undefined,
        confirmPassword: passwordChanged ? confirmPasswordInput : undefined,
      });

      if (res && res.user && res.user.email) {
        setAdminEmailDisplay(res.user.email);
      }
      setSuccessNotice(res.message || "Super Admin credentials updated successfully.");
      setShowCredsModal(false);
      setCurrentPasswordInput("");
      setNewPasswordInput("");
      setConfirmPasswordInput("");
      setTimeout(() => setSuccessNotice(null), 6000);
    } catch (err: any) {
      setCredsError(err.message || "Failed to update admin credentials.");
    } finally {
      setCredsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1012] text-[#F3F4F6] flex flex-col font-sans selection:bg-[#FF6B00]/30 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#16171A]/90 backdrop-blur-md border-b border-[#26282E] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6B00] text-white font-black text-xl shadow-md shrink-0">
            P
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">
                Placement OS
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#26282E] text-[#FF6B00] border border-[#353840]">
                Operations Admin
              </span>
            </div>
            <p className="text-xs text-[#A1A1AA] hidden sm:block">
              Institutional Verification & Governance Console
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-semibold text-white">
              {user.fullName}
            </span>
            <span className="text-xs text-[#A1A1AA]">
              {adminEmailDisplay} (Platform Admin)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowCredsModal(true);
              setCredsError(null);
              setCurrentPasswordInput("");
              setNewPasswordInput("");
              setConfirmPasswordInput("");
              setNewEmailInput(adminEmailDisplay);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#22242A] hover:bg-[#2C2E35] border border-[#32353E] text-xs font-semibold text-[#E4E4E7] hover:text-white transition-colors cursor-pointer"
            title="Change Super Admin Email / Password"
          >
            <KeyRound className="h-3.5 w-3.5 text-[#FF6B00]" />
            <span className="hidden sm:inline">Change Credentials</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#22242A] hover:bg-[#2C2E35] border border-[#32353E] text-xs font-semibold text-[#E4E4E7] hover:text-white transition-colors cursor-pointer"
            title="Sign out of Admin Console"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Title area */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              College Verification Console
            </h1>
            <p className="text-sm text-[#A1A1AA] mt-1">
              Review institutional registration requests, audit placement cell credentials, and manage authorized portal access.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchColleges(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1E2025] hover:bg-[#282B32] border border-[#32353E] text-xs font-semibold text-white transition-all disabled:opacity-50 shrink-0 cursor-pointer self-start sm:self-center"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh Applications"}</span>
          </button>
        </div>

        {/* Success Alert */}
        {successNotice && (
          <div
            role="status"
            className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-600/40 text-emerald-200 text-sm flex items-center gap-3 animate-in fade-in"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Global Error Alert */}
        {error && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-950/50 border border-rose-600/40 text-rose-200 text-sm flex items-center gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === "pending"
                ? "bg-[#251C14] border-[#D97706] ring-1 ring-[#D97706]/30 shadow-md"
                : "bg-[#16171A] border-[#26282E] hover:border-[#383B44]"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#F59E0B] font-semibold mb-1">
              <span>Pending Review</span>
              <Clock className="h-3.5 w-3.5" />
            </div>
            <div className="text-2xl font-bold text-white">{counts.pending}</div>
            <div className="text-[11px] text-[#A1A1AA] mt-1">Requires review</div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("verified")}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === "verified"
                ? "bg-[#16251A] border-[#16A34A] ring-1 ring-[#16A34A]/30 shadow-md"
                : "bg-[#16171A] border-[#26282E] hover:border-[#383B44]"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-1">
              <span>Verified</span>
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <div className="text-2xl font-bold text-white">{counts.verified}</div>
            <div className="text-[11px] text-[#A1A1AA] mt-1">Authorized access</div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("rejected")}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === "rejected"
                ? "bg-[#251414] border-[#DC2626] ring-1 ring-[#DC2626]/30 shadow-md"
                : "bg-[#16171A] border-[#26282E] hover:border-[#383B44]"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-rose-400 font-semibold mb-1">
              <span>Rejected</span>
              <XCircle className="h-3.5 w-3.5" />
            </div>
            <div className="text-2xl font-bold text-white">{counts.rejected}</div>
            <div className="text-[11px] text-[#A1A1AA] mt-1">Declined requests</div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("suspended")}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === "suspended"
                ? "bg-[#251910] border-[#EA580C] ring-1 ring-[#EA580C]/30 shadow-md"
                : "bg-[#16171A] border-[#26282E] hover:border-[#383B44]"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-orange-400 font-semibold mb-1">
              <span>Suspended</span>
              <Lock className="h-3.5 w-3.5" />
            </div>
            <div className="text-2xl font-bold text-white">{counts.suspended}</div>
            <div className="text-[11px] text-[#A1A1AA] mt-1">Access revoked</div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer col-span-2 sm:col-span-1 ${
              statusFilter === "all"
                ? "bg-[#202228] border-[#FF6B00] ring-1 ring-[#FF6B00]/30 shadow-md"
                : "bg-[#16171A] border-[#26282E] hover:border-[#383B44]"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#D4D4D8] font-semibold mb-1">
              <span>All Colleges</span>
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <div className="text-2xl font-bold text-white">{counts.all}</div>
            <div className="text-[11px] text-[#A1A1AA] mt-1">Total registered</div>
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="rounded-xl bg-[#16171A] border border-[#26282E] p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {[
                { id: "pending", label: "Pending", count: counts.pending },
                { id: "verified", label: "Verified", count: counts.verified },
                { id: "rejected", label: "Rejected", count: counts.rejected },
                { id: "suspended", label: "Suspended", count: counts.suspended },
                { id: "all", label: "All", count: counts.all },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === tab.id
                      ? "bg-[#FF6B00] text-white shadow-xs"
                      : "bg-[#22242A] text-[#A1A1AA] hover:text-white hover:bg-[#2C2E35]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === tab.id ? "bg-black/30 text-white" : "bg-[#16171A] text-[#71717A]"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717A]" />
              <input
                type="text"
                placeholder="Search college, code, email, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-[#1B1D22] border border-[#2E313A] text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF6B00] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    fetchColleges(true);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>
          </div>

          {/* Date Range & Sort Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#23252B] text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[#71717A] flex items-center gap-1 text-[11px] font-medium">
                <Calendar className="h-3.5 w-3.5 text-[#FF6B00]" />
                Registration Date:
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-[#1B1D22] border border-[#2E313A] text-xs text-white focus:outline-none focus:border-[#FF6B00]"
                title="Start Date"
              />
              <span className="text-[#71717A]">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-[#1B1D22] border border-[#2E313A] text-xs text-white focus:outline-none focus:border-[#FF6B00]"
                title="End Date"
              />
              <button
                type="button"
                onClick={handleApplyDateFilter}
                className="px-3 py-1.5 rounded-lg bg-[#FF6B00] hover:bg-[#FF8533] text-white font-semibold text-xs cursor-pointer transition-colors"
              >
                Apply
              </button>
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={handleClearDateFilter}
                  className="px-2.5 py-1.5 rounded-lg bg-[#22242A] hover:bg-[#2C2E35] text-[#A1A1AA] hover:text-white text-xs cursor-pointer transition-colors"
                >
                  Clear Dates
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[#71717A] flex items-center gap-1 text-[11px] font-medium">
                <ArrowUpDown className="h-3.5 w-3.5 text-[#FF6B00]" />
                Sort:
              </span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                className="px-2.5 py-1.5 rounded-lg bg-[#1B1D22] border border-[#2E313A] text-xs text-white focus:outline-none focus:border-[#FF6B00] cursor-pointer"
              >
                <option value="newest">Newest Submission First</option>
                <option value="oldest">Oldest Submission First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="rounded-xl bg-[#16171A] border border-[#26282E] p-12 text-center space-y-3">
            <Loader2 className="h-8 w-8 text-[#FF6B00] animate-spin mx-auto" />
            <p className="text-sm text-[#A1A1AA]">Loading institutional records...</p>
          </div>
        ) : colleges.length === 0 ? (
          <div className="rounded-xl bg-[#16171A] border border-[#26282E] p-12 text-center space-y-3">
            <Building2 className="h-10 w-10 text-[#4B5563] mx-auto" />
            <h3 className="text-base font-semibold text-white">No college applications found</h3>
            <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto">
              {searchQuery
                ? `No colleges match the search query "${searchQuery}".`
                : `There are currently no college registration requests with status "${statusFilter}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {colleges.map((col) => {
              const isPending = col.status === "pending";
              const isVerified = col.status === "verified";
              const isRejected = col.status === "rejected";
              const isSuspended = col.status === "suspended";

              return (
                <div
                  key={col.id}
                  className="rounded-xl bg-[#16171A] border border-[#26282E] hover:border-[#383B44] p-5 sm:p-6 transition-all space-y-4"
                >
                  {/* College Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-lg font-bold text-white tracking-tight">
                          {col.name}
                        </h2>
                        {col.code && (
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#26282E] text-[#D4D4D8] border border-[#383B44]">
                            {col.code}
                          </span>
                        )}
                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            isVerified
                              ? "bg-emerald-950/60 text-emerald-400 border-emerald-600/40"
                              : isPending
                              ? "bg-amber-950/60 text-amber-400 border-amber-600/40"
                              : isRejected
                              ? "bg-rose-950/60 text-rose-400 border-rose-600/40"
                              : "bg-orange-950/60 text-orange-400 border-orange-600/40"
                          }`}
                        >
                          {col.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#A1A1AA] flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-[#71717A]" />
                          {col.city}, {col.state}, {col.country || "India"}
                        </span>
                        {col.domain && (
                          <span className="flex items-center gap-1 font-mono text-[#FF6B00]">
                            <Globe className="h-3.5 w-3.5" />
                            @{col.domain}
                          </span>
                        )}
                        {col.website && (
                          <a
                            href={col.website}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[#A1A1AA] hover:text-[#FF6B00] underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Website
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0 text-xs text-[#71717A]">
                      <span>Submitted: </span>
                      <span className="text-[#D4D4D8] font-mono">
                        {new Date(col.submittedAt || col.createdAt).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Officer Info & Review Summary Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-[#141518] border border-[#22242A] text-xs">
                    {/* Officer In-Charge */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] block">
                        Registered Placement Officer
                      </span>
                      <div className="font-semibold text-white text-sm">
                        {col.officerName}
                      </div>
                      <div className="text-[#A1A1AA]">
                        {col.officerDesignation || "Placement Officer"}
                      </div>
                      <div className="flex items-center gap-4 text-[#D4D4D8] pt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-mono">
                          <Mail className="h-3.5 w-3.5 text-[#71717A]" />
                          {col.officerEmail}
                        </span>
                        {col.officerPhone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="h-3.5 w-3.5 text-[#71717A]" />
                            {col.officerPhone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Reviewer / Decision Details */}
                    <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-[#26282E] pt-3 md:pt-0 md:pl-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] block">
                        Verification Audit Record
                      </span>
                      {col.reviewedAt ? (
                        <>
                          <div className="text-[#D4D4D8]">
                            Reviewed by: <span className="text-white font-medium">{col.reviewedByName || col.reviewedBy || "Admin"}</span>
                          </div>
                          {col.verificationMethod && (
                            <div className="text-emerald-400 font-medium">
                              Method: {col.verificationMethod}
                            </div>
                          )}
                          {col.rejectionReason && (
                            <div className="text-rose-400">
                              Reason: {col.rejectionReason}
                            </div>
                          )}
                          {col.suspensionReason && (
                            <div className="text-orange-400">
                              Suspension: {col.suspensionReason}
                            </div>
                          )}
                          {col.reviewNotes && (
                            <div className="text-[#9CA3AF] italic bg-[#1E2025] p-2 rounded border border-[#2B2D34] mt-1 text-[11px]">
                              Internal note: {col.reviewNotes}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-[#A1A1AA] flex items-center gap-1.5 py-1">
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          <span>Awaiting operational background check & verification</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => openActionModal(col, "details")}
                      className="text-xs text-[#A1A1AA] hover:text-white underline cursor-pointer"
                    >
                      View All Submitted Details
                    </button>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => openActionModal(col, "verify")}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Verify College</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openActionModal(col, "reject")}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#241717] hover:bg-[#321D1D] text-rose-400 border border-rose-800/40 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {isVerified && (
                        <button
                          type="button"
                          onClick={() => openActionModal(col, "suspend")}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#271910] hover:bg-[#352216] text-orange-400 border border-orange-800/40 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          <span>Suspend Access</span>
                        </button>
                      )}

                      {isRejected && (
                        <button
                          type="button"
                          onClick={() => openActionModal(col, "verify")}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Re-evaluate & Verify</span>
                        </button>
                      )}

                      {isSuspended && (
                        <button
                          type="button"
                          onClick={() => openActionModal(col, "unsuspend")}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Unlock className="h-3.5 w-3.5" />
                          <span>Unsuspend / Restore</span>
                        </button>
                      )}

                      {/* Permanent Delete Action Button */}
                      <button
                        type="button"
                        onClick={() => openActionModal(col, "delete")}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#221515] hover:bg-[#321818] text-rose-400 hover:text-rose-300 border border-rose-900/40 text-xs font-semibold transition-colors cursor-pointer"
                        title="Permanently Delete College"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Action Dialog / Modal */}
      {selectedCollege && actionType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#18191D] border border-[#2C2E35] rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#26282E]">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {actionType === "verify" && "Verify College & Authorize Portal"}
                  {actionType === "reject" && "Reject College Application"}
                  {actionType === "suspend" && "Suspend College Portal Access"}
                  {actionType === "unsuspend" && "Unsuspend College & Restore Portal Access"}
                  {actionType === "delete" && "Permanently Delete College (Cascade Deletion)"}
                  {actionType === "details" && "Submitted College Application & Audit Trail"}
                </h3>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  Institution: <span className="text-[#FF6B00] font-semibold">{selectedCollege.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeActionModal}
                className="text-[#71717A] hover:text-white p-1 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error in modal */}
            {actionError && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-600/40 text-rose-300 text-xs">
                {actionError}
              </div>
            )}

            {/* Body per Action */}
            {actionType === "verify" && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-700/40 text-emerald-200 text-xs leading-relaxed">
                  Approving this college will grant verified placement officer status to{" "}
                  <strong className="text-white">{selectedCollege.officerName}</strong> ({selectedCollege.officerEmail}).
                  The college will be authorized to access the Placement OS College Dashboard.
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white block">
                    Verification Method Used *
                  </label>
                  <select
                    value={verificationMethod}
                    onChange={(e) => setVerificationMethod(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#22242A] border border-[#32353E] text-xs text-white focus:outline-none focus:border-[#FF6B00]"
                  >
                    {VERIFICATION_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                    <option value="Other">Other (Specify Custom Method)</option>
                  </select>
                </div>

                {verificationMethod === "Other" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white block">
                      Custom Method Description *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. In-person meeting with Dean of Student Affairs"
                      value={customMethod}
                      onChange={(e) => setCustomMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#22242A] border border-[#32353E] text-xs text-white focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white block">
                    Internal Review Notes (Admin Only)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Document reference ID, call timestamps, verification findings..."
                    value={reviewNotesInput}
                    onChange={(e) => setReviewNotesInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#22242A] border border-[#32353E] text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF6B00]"
                  />
                  <span className="text-[11px] text-[#71717A] block">
                    These notes are confidential and never exposed to students or college officers.
                  </span>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="px-4 py-2 rounded-lg bg-[#22242A] hover:bg-[#2C2E35] text-xs font-semibold text-[#A1A1AA] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmVerify}
                    disabled={submittingAction}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submittingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    <span>Confirm & Authorize College</span>
                  </button>
                </div>
              </div>
            )}

            {actionType === "reject" && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-700/40 text-rose-200 text-xs leading-relaxed">
                  Rejecting this application will inform{" "}
                  <strong className="text-white">{selectedCollege.officerName}</strong> that their request was not approved.
                  The rejection reason provided below will be displayed on their status screen.
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white block">
                    Rejection Reason (Visible to Applicant) *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Could not establish official institutional affiliation for email domain. Please submit authorization on university letterhead."
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#22242A] border border-[#32353E] text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white block">
                    Internal Admin Notes (Confidential)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Internal audit observations..."
                    value={reviewNotesInput}
                    onChange={(e) => setReviewNotesInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#22242A] border border-[#32353E] text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="px-4 py-2 rounded-lg bg-[#22242A] hover:bg-[#2C2E35] text-xs font-semibold text-[#A1A1AA] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReject}
                    disabled={submittingAction}
                    className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submittingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                    <span>Confirm Rejection</span>
                  </button>
                </div>
              </div>
            )}

            {actionType === "suspend" && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-orange-950/30 border border-orange-700/40 text-orange-200 text-xs leading-relaxed">
                  Suspending this college will immediately revoke portal access for{" "}
                  <strong className="text-white">{selectedCollege.officerName}</strong>. Protected college endpoints will reject future requests with 403 Forbidden.
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white block">
                    Suspension Reason *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Officer contact details bounced, pending annual accreditation re-verification."
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#22242A] border border-[#32353E] text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white block">
                    Internal Admin Notes (Confidential)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Internal case reference or tickets..."
                    value={reviewNotesInput}
                    onChange={(e) => setReviewNotesInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#22242A] border border-[#32353E] text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="px-4 py-2 rounded-lg bg-[#22242A] hover:bg-[#2C2E35] text-xs font-semibold text-[#A1A1AA] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSuspend}
                    disabled={submittingAction}
                    className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submittingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                    <span>Confirm Suspension</span>
                  </button>
                </div>
              </div>
            )}

            {actionType === "unsuspend" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-700/40 text-emerald-200 text-xs leading-relaxed">
                  Re-instating this college will unblock portal access for{" "}
                  <strong className="text-white">{selectedCollege.officerName}</strong> ({selectedCollege.officerEmail}).
                  The college account and officer verification status will be restored to Verified.
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white block">
                    Internal Admin Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Reason for unblocking / re-instatement findings..."
                    value={reviewNotesInput}
                    onChange={(e) => setReviewNotesInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#22242A] border border-[#32353E] text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="px-4 py-2 rounded-lg bg-[#22242A] hover:bg-[#2C2E35] text-xs font-semibold text-[#A1A1AA] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmUnsuspend}
                    disabled={submittingAction}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submittingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlock className="h-3.5 w-3.5" />}
                    <span>Confirm Unsuspend & Restore</span>
                  </button>
                </div>
              </div>
            )}

            {actionType === "delete" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-700/60 text-rose-200 text-xs leading-relaxed space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-300">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>Irreversible Destructive Action Warning</span>
                  </div>
                  <p>
                    Permanently deleting <strong className="text-white">{selectedCollege.name}</strong> will execute an immediate cascade deletion:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-[#FCA5A5] pl-1">
                    <li>All college invitation codes will be permanently deleted.</li>
                    <li>All student memberships for this college will be wiped.</li>
                    <li>Affiliated students will be dissociated and reset to "Independent Learner".</li>
                    <li>The placement officer role and active sessions will be revoked.</li>
                    <li>An immutable administrative audit record will be logged.</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white block">
                    Type institution name to confirm: <span className="text-[#FF6B00] font-mono select-all font-bold">{selectedCollege.name}</span>
                  </label>
                  <input
                    type="text"
                    placeholder={`Type "${selectedCollege.name}" exactly`}
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#22242A] border border-rose-700/40 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-rose-500 font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="px-4 py-2 rounded-lg bg-[#22242A] hover:bg-[#2C2E35] text-xs font-semibold text-[#A1A1AA] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={submittingAction || deleteConfirmInput.trim() !== selectedCollege.name.trim()}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submittingAction ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    <span>Permanently Delete College</span>
                  </button>
                </div>
              </div>
            )}

            {actionType === "details" && (
              <div className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
                {loadingDetails ? (
                  <div className="py-8 text-center space-y-2">
                    <Loader2 className="h-6 w-6 text-[#FF6B00] animate-spin mx-auto" />
                    <p className="text-xs text-[#A1A1AA]">Loading complete application record & audit trail...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-[#141518] border border-[#26282E]">
                      <div>
                        <span className="text-[#71717A] block font-medium">Institution Code:</span>
                        <span className="font-mono text-white font-bold">{selectedCollege.code || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[#71717A] block font-medium">Status:</span>
                        <span className="font-bold uppercase tracking-wider text-white">{selectedCollege.status}</span>
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <span className="text-[#71717A] block font-medium">Full Address:</span>
                        <span className="text-white">{selectedCollege.city}, {selectedCollege.state}, {selectedCollege.country || "India"}</span>
                      </div>
                      <div>
                        <span className="text-[#71717A] block font-medium">Domain / Website:</span>
                        <span className="text-[#FF6B00]">{selectedCollege.domain || selectedCollege.website || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[#71717A] block font-medium">Officer Name:</span>
                        <span className="text-white font-semibold">{selectedCollege.officerName}</span>
                      </div>
                      <div>
                        <span className="text-[#71717A] block font-medium">Officer Email:</span>
                        <span className="font-mono text-white select-all">{selectedCollege.officerEmail}</span>
                      </div>
                      <div>
                        <span className="text-[#71717A] block font-medium">Officer Phone:</span>
                        <span className="font-mono text-white">{selectedCollege.officerPhone || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[#71717A] block font-medium">Officer Designation:</span>
                        <span className="text-white">{selectedCollege.officerDesignation || "Placement Officer"}</span>
                      </div>
                      <div>
                        <span className="text-[#71717A] block font-medium">Registration Submission:</span>
                        <span className="text-white font-mono">
                          {new Date(selectedCollege.submittedAt || selectedCollege.createdAt).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                      {selectedCollege.reviewedAt && (
                        <div>
                          <span className="text-[#71717A] block font-medium">Last Reviewed:</span>
                          <span className="text-white font-mono">
                            {new Date(selectedCollege.reviewedAt).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Verification / Suspension / Rejection Notes */}
                    {(selectedCollege.verificationMethod || selectedCollege.rejectionReason || selectedCollege.suspensionReason || selectedCollege.reviewNotes) && (
                      <div className="p-3 rounded-lg bg-[#141518] border border-[#26282E] space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] block">
                          Reviewer Decision Notes
                        </span>
                        {selectedCollege.verificationMethod && (
                          <div className="text-emerald-400">
                            <strong>Verification Method:</strong> {selectedCollege.verificationMethod}
                          </div>
                        )}
                        {selectedCollege.rejectionReason && (
                          <div className="text-rose-400">
                            <strong>Rejection Reason:</strong> {selectedCollege.rejectionReason}
                          </div>
                        )}
                        {selectedCollege.suspensionReason && (
                          <div className="text-orange-400">
                            <strong>Suspension Reason:</strong> {selectedCollege.suspensionReason}
                          </div>
                        )}
                        {selectedCollege.reviewNotes && (
                          <div className="text-[#9CA3AF] italic">
                            <strong>Internal Notes:</strong> {selectedCollege.reviewNotes}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Live Audit Log History */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                        <History className="h-3.5 w-3.5 text-[#FF6B00]" />
                        <span>Audit Trail History</span>
                      </div>
                      {fullCollegeData?.auditLogs && fullCollegeData.auditLogs.length > 0 ? (
                        <div className="rounded-lg border border-[#26282E] overflow-hidden">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-[#1C1E23] text-[#71717A] border-b border-[#26282E]">
                              <tr>
                                <th className="p-2">Action</th>
                                <th className="p-2">Admin / Actor</th>
                                <th className="p-2">Timestamp</th>
                                <th className="p-2">Reason / Note</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#26282E] bg-[#141518]">
                              {fullCollegeData.auditLogs.map((log: any) => (
                                <tr key={log.id} className="hover:bg-[#1B1D22]">
                                  <td className="p-2 font-bold uppercase">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                      log.action === "verify" || log.action === "unsuspend"
                                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-700/40"
                                        : log.action === "suspend"
                                        ? "bg-orange-950/60 text-orange-400 border border-orange-700/40"
                                        : "bg-rose-950/60 text-rose-400 border border-rose-700/40"
                                    }`}>
                                      {log.action}
                                    </span>
                                  </td>
                                  <td className="p-2 text-[#A1A1AA] font-mono">{log.actorEmail}</td>
                                  <td className="p-2 text-[#71717A] font-mono">
                                    {new Date(log.timestamp).toLocaleString("en-IN", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })}
                                  </td>
                                  <td className="p-2 text-white">{log.reason || log.details?.reviewNotes || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#71717A] italic p-2 bg-[#141518] rounded border border-[#26282E]">
                          No previous operational audit logs recorded for this institution.
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="px-4 py-2 rounded-lg bg-[#22242A] hover:bg-[#2C2E35] text-xs font-semibold text-white cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Super Admin Credentials Update Modal */}
      {showCredsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#191B20] border border-[#2D3039] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowCredsModal(false)}
              className="absolute top-4 right-4 text-[#71717A] hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/30 shrink-0">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Update Super Admin Credentials</h3>
                <p className="text-xs text-[#A1A1AA]">Modify your Super Admin login email and password.</p>
              </div>
            </div>

            {credsError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{credsError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateCredentials} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  Current Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password to authorize changes"
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#22242A] border border-[#32353E] text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div className="border-t border-[#26282E] pt-3">
                <label className="text-xs font-semibold text-white block mb-1">
                  Super Admin Email (User ID)
                </label>
                <input
                  type="email"
                  placeholder="admin@placementos.com"
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#22242A] border border-[#32353E] text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF6B00]"
                />
                <span className="text-[11px] text-[#71717A] mt-1 block">
                  Leave unchanged if you only want to update your password.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-white block mb-1">
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Min 8 chars, uppercase, lowercase, number, symbol"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#22242A] border border-[#32353E] text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              {newPasswordInput && (
                <div>
                  <label className="text-xs font-semibold text-white block mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#22242A] border border-[#32353E] text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#26282E]">
                <button
                  type="button"
                  onClick={() => setShowCredsModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#22242A] hover:bg-[#2C2E35] text-xs font-semibold text-[#A1A1AA] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={credsLoading}
                  className="px-4 py-2 rounded-lg bg-[#FF6B00] hover:bg-[#E56000] text-xs font-semibold text-white flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-[#FF6B00]/20"
                >
                  {credsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  <span>Save New Credentials</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};
