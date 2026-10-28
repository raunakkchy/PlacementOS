import React, { useState, useEffect } from "react";
import { User, College, CollegeInvitation, CollegeStudentRosterItem } from "../types";
import {
  getCollegeStatus,
  getCollegeInvitations,
  createCollegeInvitation,
  revokeCollegeInvitation,
  getCollegeMemberships,
  approveCollegeMembership,
  rejectCollegeMembership,
  removeCollegeMembership,
  getCollegeAnalytics,
  getStudentProgressDetail,
  downloadCollegeCsvReport,
  downloadCollegePdfReport,
} from "../services/auth";
import { Footer } from "../components/navigation/Footer";
import {
  Building2,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  Lock,
  RefreshCw,
  LogOut,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Users,
  BarChart3,
  Calendar,
  Sparkles,
  ExternalLink,
  Plus,
  Copy,
  Check,
  Search,
  Eye,
  Trash2,
  XCircle,
  Unlink,
  Loader2,
  Ticket,
  Sliders,
  Filter,
  Download,
  PieChart,
  TrendingUp,
} from "lucide-react";

interface CollegeDashboardProps {
  user: User;
  onLogout: () => void;
}

type CollegeTabKey = "overview" | "analytics" | "roster" | "requests" | "invitations";

export const CollegeDashboard: React.FC<CollegeDashboardProps> = ({
  user,
  onLogout,
}) => {
  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CollegeTabKey>("overview");

  // Roster state
  const [students, setStudents] = useState<CollegeStudentRosterItem[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterSearch, setRosterSearch] = useState("");
  const [counts, setCounts] = useState({ all: 0, pending: 0, active: 0, rejected: 0 });

  // Selected student for details modal
  const [selectedStudent, setSelectedStudent] = useState<CollegeStudentRosterItem | null>(null);

  // Invitations state
  const [invitations, setInvitations] = useState<CollegeInvitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Analytics state
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Detailed student progress view state
  const [detailedStudentProgress, setDetailedStudentProgress] = useState<any | null>(null);
  const [detailedStudentRoadmap, setDetailedStudentRoadmap] = useState<any | null>(null);
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);

  // Export report loading states
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // New Invitation form state
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [inviteLabel, setInviteLabel] = useState("");
  const [inviteMaxUses, setInviteMaxUses] = useState(100);
  const [inviteDays, setInviteDays] = useState(30);
  const [creatingInviteLoading, setCreatingInviteLoading] = useState(false);

  // Rejection modal
  const [rejectingStudentId, setRejectingStudentId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchStatus = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError(null);
    try {
      const res = await getCollegeStatus();
      if (res && res.college) {
        setCollege(res.college);
      }
    } catch (err: any) {
      console.warn("Error fetching college status:", err);
      setError(err.message || "Failed to retrieve status.");
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  const fetchRoster = async () => {
    setRosterLoading(true);
    try {
      const res = await getCollegeMemberships("all", rosterSearch);
      if (res && res.students) {
        setStudents(res.students);
        if (res.counts) setCounts(res.counts);
      }
    } catch (err: any) {
      console.warn("Error fetching roster:", err);
    } finally {
      setRosterLoading(false);
    }
  };

  const fetchInvitations = async () => {
    setInvitationsLoading(true);
    try {
      const res = await getCollegeInvitations();
      if (res && res.invitations) {
        setInvitations(res.invitations);
      }
    } catch (err: any) {
      console.warn("Error fetching invitations:", err);
    } finally {
      setInvitationsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await getCollegeAnalytics();
      if (res && res.analytics) {
        setAnalytics(res.analytics);
      }
    } catch (err: any) {
      console.warn("Error fetching college analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchStudentProgress = async (studentId: string) => {
    setStudentDetailLoading(true);
    setDetailedStudentProgress(null);
    setDetailedStudentRoadmap(null);
    try {
      const res = await getStudentProgressDetail(studentId);
      if (res && res.student) {
        setDetailedStudentProgress(res.student);
        setDetailedStudentRoadmap(res.roadmap || null);
      }
    } catch (err: any) {
      alert("Failed to load student progress detail: " + err.message);
    } finally {
      setStudentDetailLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      await downloadCollegeCsvReport();
    } catch (err: any) {
      alert("CSV export failed: " + err.message);
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await downloadCollegePdfReport();
    } catch (err: any) {
      alert("PDF export failed: " + err.message);
    } finally {
      setExportingPdf(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user]);

  useEffect(() => {
    if (college?.status === "verified") {
      fetchRoster();
      fetchInvitations();
      fetchAnalytics();
    }
  }, [college?.status]);

  const status = college?.status || user.verificationStatus || "pending";

  // Handle invitation creation
  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingInviteLoading(true);
    try {
      await createCollegeInvitation({
        label: inviteLabel.trim() || undefined,
        maxUses: Number(inviteMaxUses),
        validityDays: Number(inviteDays),
      });
      setIsCreatingInvite(false);
      setInviteLabel("");
      setInviteMaxUses(100);
      setInviteDays(30);
      await fetchInvitations();
    } catch (err: any) {
      alert("Failed to create invitation: " + err.message);
    } finally {
      setCreatingInviteLoading(false);
    }
  };

  // Handle revoke invitation
  const handleRevokeInvitation = async (id: string, code: string) => {
    if (!window.confirm(`Revoke invitation code "${code}"? Students will no longer be able to use this code to connect.`)) {
      return;
    }
    try {
      await revokeCollegeInvitation(id);
      await fetchInvitations();
    } catch (err: any) {
      alert("Failed to revoke invitation: " + err.message);
    }
  };

  // Copy code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Handle approve student
  const handleApproveStudent = async (membershipId: string) => {
    setActionLoadingId(membershipId);
    try {
      await approveCollegeMembership(membershipId);
      await fetchRoster();
    } catch (err: any) {
      alert("Failed to approve student: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle reject student
  const handleRejectStudent = async (membershipId: string) => {
    setActionLoadingId(membershipId);
    try {
      await rejectCollegeMembership(membershipId, rejectionReason);
      setRejectingStudentId(null);
      setRejectionReason("");
      await fetchRoster();
    } catch (err: any) {
      alert("Failed to reject student: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle remove student
  const handleRemoveStudent = async (membershipId: string, studentName: string) => {
    if (!window.confirm(`Remove ${studentName} from this college cohort? Their student account will remain independent, but will be disconnected from your placement portal.`)) {
      return;
    }
    setActionLoadingId(membershipId);
    try {
      await removeCollegeMembership(membershipId);
      await fetchRoster();
    } catch (err: any) {
      alert("Failed to remove student: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const activeRosterStudents = students.filter((s) => s.status === "active");
  const pendingRequests = students.filter((s) => s.status === "pending");

  return (
    <div className="min-h-screen bg-[#0F1012] text-[#F3F4F6] flex flex-col font-sans selection:bg-[#FF6B00]/30 selection:text-white">
      {/* Top Navigation Bar */}
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
                College Portal
              </span>
            </div>
            <p className="text-xs text-[#A1A1AA] hidden sm:block">
              Institutional Career Readiness & Placement Cell Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-semibold text-white">
              {user.fullName}
            </span>
            <span className="text-xs text-[#A1A1AA]">
              {user.designation || "Placement Officer"}
            </span>
          </div>
          <button
            id="btn-college-logout"
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#22242A] hover:bg-[#2C2E35] border border-[#32353E] text-xs font-semibold text-[#E4E4E7] hover:text-white transition-colors cursor-pointer"
            title="Sign out of portal"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Verification Status Banner */}
        {status === "pending" && (
          <div className="rounded-xl bg-gradient-to-r from-[#211B14] via-[#1C1813] to-[#16171A] border border-[#D97706]/40 p-6 sm:p-7 shadow-lg relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-[#D97706]/20 border border-[#D97706]/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="h-6 w-6 text-[#F59E0B]" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Application Under Review
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D97706]/20 text-[#F59E0B] border border-[#D97706]/40 uppercase tracking-wider">
                      Pending Verification
                    </span>
                  </div>
                  <p className="text-sm text-[#FBBF24] font-medium mt-1.5">
                    Your college registration request is under review. Student roster and invitation features will be enabled once approved.
                  </p>
                  <p className="text-xs text-[#A1A1AA] mt-1 max-w-2xl leading-relaxed">
                    Placement OS administration verifies institution legitimacy, domain ownership, and placement cell authority to protect student privacy.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchStatus(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#272930] hover:bg-[#32353E] border border-[#3E424C] text-xs font-semibold text-white transition-all disabled:opacity-50 shrink-0 cursor-pointer self-start md:self-center"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                <span>{refreshing ? "Checking..." : "Refresh Status"}</span>
              </button>
            </div>
          </div>
        )}

        {status === "rejected" && (
          <div className="rounded-xl bg-[#2A1515] border border-[#DC2626]/40 p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#DC2626]/20 border border-[#DC2626]/30 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="h-6 w-6 text-[#EF4444]" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-white">Registration Application Rejected</h1>
                <p className="text-sm text-[#FCA5A5]">
                  {college?.rejectionReason || "Your institutional registration could not be verified by platform administration."}
                </p>
              </div>
            </div>
          </div>
        )}

        {status === "suspended" && (
          <div className="rounded-xl bg-[#2A1515] border border-[#DC2626]/40 p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#DC2626]/20 border border-[#DC2626]/30 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="h-6 w-6 text-[#EF4444]" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-white">Portal Access Suspended</h1>
                <p className="text-sm text-[#FCA5A5]">
                  {college?.suspensionReason || "This college placement account has been suspended by platform administration."}
                </p>
              </div>
            </div>
          </div>
        )}

        {status === "verified" && (
          <div className="rounded-xl bg-gradient-to-r from-[#142318] to-[#16171A] border border-[#16A34A]/40 p-5 shadow-lg flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-[#16A34A]/20 border border-[#16A34A]/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6 text-[#22C55E]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-lg font-bold text-white">
                    {college?.name || user.college || "Verified Institution"}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#16A34A]/20 text-[#22C55E] border border-[#16A34A]/40 uppercase tracking-wider">
                    Verified Partner
                  </span>
                </div>
                <p className="text-xs text-[#86EFAC] font-medium mt-0.5">
                  Full Placement Portal active. Invite students and monitor campus recruitment readiness cohorts.
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-[#1B1D22] border border-[#2E313A] text-center">
                <span className="text-[10px] uppercase font-bold text-[#A1A1AA] block">Active Students</span>
                <span className="text-base font-bold text-white">{counts.active}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[#1B1D22] border border-[#2E313A] text-center">
                <span className="text-[10px] uppercase font-bold text-[#F59E0B] block">Pending Requests</span>
                <span className="text-base font-bold text-[#F59E0B]">{counts.pending}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[#1B1D22] border border-[#2E313A] text-center">
                <span className="text-[10px] uppercase font-bold text-[#FF6B00] block">Invites</span>
                <span className="text-base font-bold text-[#FF6B00]">
                  {invitations.filter((i) => i.status === "active").length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation (Enabled for verified colleges) */}
        {status === "verified" && (
          <nav className="flex items-center gap-2 border-b border-[#26282E] pb-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-[#FF6B00] text-white shadow-md"
                  : "bg-[#18191D] text-[#A1A1AA] hover:text-white hover:bg-[#22242A]"
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Overview & Credentials</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("analytics");
                fetchAnalytics();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-[#FF6B00] text-white shadow-md"
                  : "bg-[#18191D] text-[#A1A1AA] hover:text-white hover:bg-[#22242A]"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Skill-Gap Analytics & Reports</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("roster");
                fetchRoster();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "roster"
                  ? "bg-[#FF6B00] text-white shadow-md"
                  : "bg-[#18191D] text-[#A1A1AA] hover:text-white hover:bg-[#22242A]"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Student Cohort Roster ({counts.active})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("requests");
                fetchRoster();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                activeTab === "requests"
                  ? "bg-[#FF6B00] text-white shadow-md"
                  : "bg-[#18191D] text-[#A1A1AA] hover:text-white hover:bg-[#22242A]"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Affiliation Requests</span>
              {counts.pending > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#F59E0B] text-slate-950">
                  {counts.pending}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("invitations");
                fetchInvitations();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "invitations"
                  ? "bg-[#FF6B00] text-white shadow-md"
                  : "bg-[#18191D] text-[#A1A1AA] hover:text-white hover:bg-[#22242A]"
              }`}
            >
              <Ticket className="h-4 w-4" />
              <span>Invitation Codes</span>
            </button>
          </nav>
        )}

        {/* TAB 1: OVERVIEW & CREDENTIALS */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Institutional Information */}
              <div className="rounded-xl bg-[#16171A] border border-[#26282E] p-6 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#26282E]">
                  <Building2 className="h-5 w-5 text-[#FF6B00]" />
                  <h2 className="text-base font-bold text-white">Institution Profile</h2>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs font-medium text-[#71717A] uppercase tracking-wider block">
                      Institution Name
                    </span>
                    <span className="font-semibold text-white text-base">
                      {college?.name || user.college || "Registered Institution"}
                    </span>
                  </div>

                  {college?.code && (
                    <div>
                      <span className="text-xs font-medium text-[#71717A] uppercase tracking-wider block">
                        Campus Code
                      </span>
                      <span className="text-[#E4E4E7] font-mono">{college.code}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[#D4D4D8]">
                    <MapPin className="h-4 w-4 text-[#A1A1AA] shrink-0" />
                    <span>
                      {college?.city || "N/A"}, {college?.state || "N/A"}, {college?.country || "India"}
                    </span>
                  </div>

                  {college?.domain && (
                    <div className="flex items-center gap-2 text-[#D4D4D8]">
                      <Globe className="h-4 w-4 text-[#A1A1AA] shrink-0" />
                      <span className="font-mono text-xs text-[#FF6B00]">@{college.domain}</span>
                    </div>
                  )}

                  {college?.website && (
                    <div className="flex items-center gap-2 text-[#D4D4D8]">
                      <ExternalLink className="h-4 w-4 text-[#A1A1AA] shrink-0" />
                      <a
                        href={college.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#A1A1AA] hover:text-[#FF6B00] transition-colors underline truncate"
                      >
                        {college.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Placement Officer Information */}
              <div className="rounded-xl bg-[#16171A] border border-[#26282E] p-6 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#26282E]">
                  <ShieldCheck className="h-5 w-5 text-[#FF6B00]" />
                  <h2 className="text-base font-bold text-white">Placement Officer Credentials</h2>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs font-medium text-[#71717A] uppercase tracking-wider block">
                      Officer Name
                    </span>
                    <span className="font-semibold text-white text-base">
                      {college?.officerName || user.fullName}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-[#71717A] uppercase tracking-wider block">
                      Designation
                    </span>
                    <span className="text-[#E4E4E7]">
                      {college?.officerDesignation || user.designation || "Head of Training & Placement"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[#D4D4D8]">
                    <Mail className="h-4 w-4 text-[#A1A1AA] shrink-0" />
                    <span className="text-xs font-mono">{college?.officerEmail || user.email}</span>
                  </div>

                  {college?.officerPhone && (
                    <div className="flex items-center gap-2 text-[#D4D4D8]">
                      <Phone className="h-4 w-4 text-[#A1A1AA] shrink-0" />
                      <span className="text-xs font-mono">{college.officerPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Guide for Verified Officers */}
            {status === "verified" && (
              <div className="rounded-xl bg-[#16171A] border border-[#26282E] p-6 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#26282E]">
                  <Sparkles className="h-4 w-4 text-[#FF6B00]" />
                  <h3 className="text-sm font-bold text-white">How To Onboard Your Campus Students</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#A1A1AA]">
                  <div className="p-4 rounded-xl bg-[#1B1D22] border border-[#2E313A] space-y-1.5">
                    <span className="text-[#FF6B00] font-bold text-[11px] block">STEP 1</span>
                    <h4 className="font-bold text-white text-xs">Generate Invitation Code</h4>
                    <p className="leading-relaxed">
                      Go to the <strong>Invitation Codes</strong> tab and generate a code with your custom capacity and validity window.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#1B1D22] border border-[#2E313A] space-y-1.5">
                    <span className="text-[#FF6B00] font-bold text-[11px] block">STEP 2</span>
                    <h4 className="font-bold text-white text-xs">Share With Students</h4>
                    <p className="leading-relaxed">
                      Circulate the code to students. Students sign in to Placement OS, visit their profile, and enter your invitation code.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#1B1D22] border border-[#2E313A] space-y-1.5">
                    <span className="text-[#FF6B00] font-bold text-[11px] block">STEP 3</span>
                    <h4 className="font-bold text-white text-xs">Review & Approve</h4>
                    <p className="leading-relaxed">
                      Check the <strong>Affiliation Requests</strong> tab to approve genuine candidates and track student readiness metrics in the Roster.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SKILL-GAP ANALYTICS & REPORTS */}
        {activeTab === "analytics" && status === "verified" && (
          <div className="space-y-6">
            {/* Header & Export Actions */}
            <div className="flex items-center justify-between bg-[#16171A] p-4 rounded-xl border border-[#26282E] flex-wrap gap-4">
              <div>
                <h3 className="font-bold text-white text-base">Campus Placement & Skill-Gap Analytics</h3>
                <p className="text-xs text-[#A1A1AA]">
                  Aggregate readiness insights across authorized student cohorts under strict granular consent.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={exportingCsv}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#22242A] hover:bg-[#2C2E35] border border-[#32353E] text-xs font-semibold text-white transition-all disabled:opacity-50 cursor-pointer"
                >
                  {exportingCsv ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 text-emerald-400" />}
                  <span>Export CSV Report</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-xs font-bold text-white transition-all disabled:opacity-50 shadow-md cursor-pointer"
                >
                  {exportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 text-white" />}
                  <span>Export PDF Report</span>
                </button>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="p-16 text-center text-[#71717A] space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#FF6B00]" />
                <p className="text-xs font-medium">Computing aggregate analytics from consented records...</p>
              </div>
            ) : !analytics ? (
              <div className="p-12 bg-[#16171A] border border-[#26282E] rounded-xl text-center space-y-2">
                <BarChart3 className="h-10 w-10 text-[#71717A] mx-auto" />
                <h4 className="font-bold text-white text-sm">No Analytics Available</h4>
                <p className="text-xs text-[#A1A1AA]">Analytics require active linked students with valid data consent.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Anonymization Suppression Banner */}
                {analytics.anonymized && (
                  <div className="rounded-xl bg-amber-950/40 border border-amber-600/40 p-4 text-amber-200 text-xs flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
                    <div>
                      <strong>Minimum Group Size Notice:</strong> Your active cohort has fewer than {analytics.minimumGroupSizeThreshold} students. Some aggregate distributions are suppressed to preserve student confidentiality.
                    </div>
                  </div>
                )}

                {/* 4 Summary Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-xl bg-[#16171A] border border-[#26282E] space-y-1">
                    <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider">Active Linked Students</span>
                    <div className="text-2xl font-black text-white">{analytics.activeLinkedStudents}</div>
                    <span className="text-[10px] text-[#A1A1AA]">Total linked: {analytics.totalLinkedStudents}</span>
                  </div>

                  <div className="p-5 rounded-xl bg-[#16171A] border border-[#26282E] space-y-1">
                    <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider">Consented Students</span>
                    <div className="text-2xl font-black text-emerald-400">{analytics.studentsWithConsent}</div>
                    <span className="text-[10px] text-[#A1A1AA]">Granted data sharing permissions</span>
                  </div>

                  <div className="p-5 rounded-xl bg-[#16171A] border border-[#26282E] space-y-1">
                    <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider">Average Readiness Score</span>
                    <div className="text-2xl font-black text-blue-400">
                      {analytics.averageReadinessScore !== null ? `${analytics.averageReadinessScore}%` : "N/A"}
                    </div>
                    <span className="text-[10px] text-[#A1A1AA]">Across evaluated consented candidates</span>
                  </div>

                  <div className="p-5 rounded-xl bg-[#16171A] border border-[#26282E] space-y-1">
                    <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider">Avg Roadmap Progress</span>
                    <div className="text-2xl font-black text-[#FF6B00]">
                      {analytics.averageRoadmapProgress !== null ? `${analytics.averageRoadmapProgress}%` : "N/A"}
                    </div>
                    <span className="text-[10px] text-[#A1A1AA]">Target milestones completed</span>
                  </div>
                </div>

                {/* Two-Column Analytics Grid: Skill Gaps & Readiness Bands */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Most Frequently Missing Skills */}
                  <div className="p-6 rounded-xl bg-[#16171A] border border-[#26282E] space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#26282E]">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-[#FF6B00]" />
                        Top Missing Skills Across Cohort
                      </h4>
                      <span className="text-[10px] text-[#71717A]">Consented Student Data</span>
                    </div>

                    {analytics.topMissingSkills.length === 0 ? (
                      <p className="text-xs text-[#71717A] py-8 text-center">No skill gaps detected in current cohort data.</p>
                    ) : (
                      <div className="space-y-3">
                        {analytics.topMissingSkills.map((item: any, idx: number) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-white">{item.skill}</span>
                              <span className="text-[#A1A1AA] font-mono">{item.missingCount} students ({item.percentageOfCohort}%)</span>
                            </div>
                            <div className="h-2 w-full bg-[#1F2127] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#FF6B00] rounded-full"
                                style={{ width: `${item.percentageOfCohort}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Readiness Bands Distribution */}
                  <div className="p-6 rounded-xl bg-[#16171A] border border-[#26282E] space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#26282E]">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <PieChart className="h-4 w-4 text-emerald-400" />
                        Student Readiness Band Distribution
                      </h4>
                      <span className="text-[10px] text-[#71717A]">AI Evaluation Score</span>
                    </div>

                    <div className="space-y-3.5">
                      {analytics.readinessBands.map((band: any, idx: number) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-[#1B1D22] border border-[#2E313A] space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white">{band.bandName}</span>
                            <span className="font-mono text-emerald-400 font-bold">{band.studentCount} students ({band.percentage}%)</span>
                          </div>
                          <div className="h-2 w-full bg-[#26282E] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${band.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STUDENT COHORT ROSTER */}
        {activeTab === "roster" && status === "verified" && (
          <div className="space-y-4">
            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#16171A] p-4 rounded-xl border border-[#26282E]">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717A]" />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchRoster()}
                  placeholder="Search students by name, roll no, branch..."
                  className="w-full bg-[#1B1D22] border border-[#2E313A] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchRoster}
                  disabled={rosterLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#22242A] hover:bg-[#2C2E35] border border-[#32353E] text-xs font-semibold text-white transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${rosterLoading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Students Table / Cards */}
            {rosterLoading ? (
              <div className="p-12 text-center text-[#71717A] space-y-2">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#FF6B00]" />
                <p className="text-xs">Loading linked students cohort...</p>
              </div>
            ) : activeRosterStudents.length === 0 ? (
              <div className="p-12 rounded-xl bg-[#16171A] border border-[#26282E] text-center space-y-3">
                <Users className="h-10 w-10 text-[#71717A] mx-auto" />
                <h3 className="font-bold text-white text-sm">No Active Students Yet</h3>
                <p className="text-xs text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
                  Generate an invitation code from the <strong>Invitation Codes</strong> tab and share it with your students to begin tracking campus readiness.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("invitations")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6B00] text-xs font-bold text-white hover:bg-[#e05e00] shadow-md"
                >
                  <Ticket className="h-4 w-4" />
                  <span>Create Invitation Code</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#26282E] bg-[#16171A]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#26282E] bg-[#1A1C20] text-[#71717A] uppercase text-[10px] tracking-wider font-bold">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Academics</th>
                      <th className="py-3 px-4">Readiness & Interviews</th>
                      <th className="py-3 px-4">Roadmap Progress</th>
                      <th className="py-3 px-4">Sharing Consent</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#26282E]">
                    {activeRosterStudents.map((item) => (
                      <tr key={item.membershipId} className="hover:bg-[#1C1E23] transition-colors">
                        {/* Student Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-[#2A2D35] flex items-center justify-center font-bold text-white text-xs shrink-0">
                              {item.profilePhoto ? (
                                <img src={item.profilePhoto} alt={item.fullName} className="h-full w-full rounded-full object-cover" />
                              ) : (
                                item.fullName.charAt(0)
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-white block">{item.fullName}</span>
                              <span className="text-[11px] text-[#71717A] font-mono">{item.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Academics */}
                        <td className="py-3.5 px-4">
                          {item.consent.shareAcademic ? (
                            <div>
                              <span className="text-[#E4E4E7] font-semibold block">
                                {item.branch || item.course || "Branch unselected"}
                              </span>
                              <span className="text-[11px] text-[#A1A1AA]">
                                {item.rollNumber ? `Roll: ${item.rollNumber}` : ""}
                                {item.cgpa !== null && item.cgpa !== undefined ? ` • CGPA: ${item.cgpa}` : ""}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#71717A] italic flex items-center gap-1">
                              <Lock className="h-3 w-3" /> Restricted by student
                            </span>
                          )}
                        </td>

                        {/* Readiness & Interview Scores */}
                        <td className="py-3.5 px-4">
                          {item.consent.shareInterviewScores ? (
                            <div>
                              {item.readinessScore !== null && item.readinessScore !== undefined ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-sm">
                                    {item.readinessScore}/100
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">
                                    Ready
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[#71717A] text-[11px]">No score calculated</span>
                              )}
                              {item.lastInterviewScore !== null && item.lastInterviewScore !== undefined && (
                                <span className="text-[10px] text-[#A1A1AA] block">
                                  Last Mock: {item.lastInterviewScore}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#71717A] italic flex items-center gap-1">
                              <Lock className="h-3 w-3" /> Restricted by student
                            </span>
                          )}
                        </td>

                        {/* Roadmap Progress */}
                        <td className="py-3.5 px-4">
                          {item.consent.shareSkillRoadmap ? (
                            <div className="space-y-1 max-w-[120px]">
                              <div className="flex justify-between text-[10px] text-[#A1A1AA]">
                                <span>{item.roadmapOverallProgress ?? 0}%</span>
                                <span>{item.completedTasks ?? 0}/{item.totalTasks ?? 0}</span>
                              </div>
                              <div className="h-1.5 w-full bg-[#26282E] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#FF6B00] rounded-full"
                                  style={{ width: `${item.roadmapOverallProgress ?? 0}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#71717A] italic flex items-center gap-1">
                              <Lock className="h-3 w-3" /> Restricted by student
                            </span>
                          )}
                        </td>

                        {/* Consent Badges */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span
                              title={item.consent.shareAcademic ? "Academic data shared" : "Academic data withheld"}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                item.consent.shareAcademic
                                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                                  : "bg-[#202228] text-[#71717A] border-[#2C2E35]"
                              }`}
                            >
                              Acad
                            </span>
                            <span
                              title={item.consent.shareSkillRoadmap ? "Roadmap shared" : "Roadmap withheld"}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                item.consent.shareSkillRoadmap
                                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                                  : "bg-[#202228] text-[#71717A] border-[#2C2E35]"
                              }`}
                            >
                              Roadmap
                            </span>
                            <span
                              title={item.consent.shareInterviewScores ? "Interview scores shared" : "Scores withheld"}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                item.consent.shareInterviewScores
                                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                                  : "bg-[#202228] text-[#71717A] border-[#2C2E35]"
                              }`}
                            >
                              Scores
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedStudent(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#22242A] hover:bg-[#2C2E35] border border-[#32353E] text-white font-semibold text-[11px] transition-colors"
                              title="View student snapshot"
                            >
                              <Eye className="h-3.5 w-3.5 inline mr-1" />
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveStudent(item.membershipId, item.fullName)}
                              disabled={actionLoadingId === item.membershipId}
                              className="p-1.5 rounded-lg hover:bg-rose-950/50 text-[#71717A] hover:text-rose-400 transition-colors"
                              title="Remove from cohort"
                            >
                              <Unlink className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AFFILIATION REQUESTS */}
        {activeTab === "requests" && status === "verified" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#16171A] p-4 rounded-xl border border-[#26282E]">
              <div>
                <h3 className="font-bold text-white text-sm">Pending Student Requests</h3>
                <p className="text-xs text-[#A1A1AA]">
                  Review and verify students requesting to join your institutional placement cohort.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchRoster}
                disabled={rosterLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22242A] hover:bg-[#2C2E35] border border-[#32353E] text-xs font-semibold text-white transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${rosterLoading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-12 rounded-xl bg-[#16171A] border border-[#26282E] text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-white text-sm">All Requests Cleared</h3>
                <p className="text-xs text-[#A1A1AA]">There are no pending student affiliation requests at this time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRequests.map((req) => (
                  <div key={req.membershipId} className="p-5 rounded-xl bg-[#16171A] border border-[#26282E] space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#2A2D35] flex items-center justify-center font-bold text-white text-sm">
                          {req.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{req.fullName}</h4>
                          <span className="text-xs text-[#A1A1AA] font-mono">{req.email}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40">
                        Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#1B1D22] p-3 rounded-lg border border-[#2E313A]">
                      <div>
                        <span className="text-[#71717A] text-[10px] block">Branch / Course</span>
                        <span className="font-semibold text-white">{req.branch || req.course || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[#71717A] text-[10px] block">Roll Number</span>
                        <span className="font-semibold text-white font-mono">{req.rollNumber || "Not provided"}</span>
                      </div>
                      <div>
                        <span className="text-[#71717A] text-[10px] block">Requested On</span>
                        <span className="text-[#A1A1AA]">{new Date(req.requestedAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-[#71717A] text-[10px] block">CGPA</span>
                        <span className="font-semibold text-white">{req.cgpa ?? "N/A"}</span>
                      </div>
                    </div>

                    {/* Approve / Reject Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#26282E]">
                      <button
                        type="button"
                        onClick={() => setRejectingStudentId(req.membershipId)}
                        disabled={actionLoadingId === req.membershipId}
                        className="px-3 py-1.5 rounded-lg border border-rose-900/60 bg-rose-950/20 text-rose-400 hover:bg-rose-950/40 text-xs font-semibold transition-colors"
                      >
                        Decline
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApproveStudent(req.membershipId)}
                        disabled={actionLoadingId === req.membershipId}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm"
                      >
                        {actionLoadingId === req.membershipId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        <span>Approve Request</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: INVITATION CODES MANAGER */}
        {activeTab === "invitations" && status === "verified" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-[#16171A] p-4 rounded-xl border border-[#26282E] flex-wrap gap-3">
              <div>
                <h3 className="font-bold text-white text-sm">College Invitation Codes</h3>
                <p className="text-xs text-[#A1A1AA]">
                  Create secure, high-entropy codes to distribute to your students or specific department batches.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreatingInvite(!isCreatingInvite)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-xs font-bold text-white transition-all shadow-md cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Generate Invitation Code</span>
              </button>
            </div>

            {/* Create Code Form */}
            {isCreatingInvite && (
              <form onSubmit={handleCreateInvitation} className="p-5 rounded-xl bg-[#18191D] border border-[#FF6B00]/40 space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 pb-2 border-b border-[#26282E]">
                  <Ticket className="h-4 w-4 text-[#FF6B00]" />
                  <h4 className="font-bold text-white text-xs">Configure New Invitation Code</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-[#A1A1AA] mb-1 font-semibold">Cohort Label (Optional)</label>
                    <input
                      type="text"
                      value={inviteLabel}
                      onChange={(e) => setInviteLabel(e.target.value)}
                      placeholder="e.g. 2026 Batch CSE"
                      className="w-full bg-[#1F2127] border border-[#2E313A] rounded-xl px-3 py-2 text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#A1A1AA] mb-1 font-semibold">Capacity (Max Uses)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={2000}
                      value={inviteMaxUses}
                      onChange={(e) => setInviteMaxUses(Number(e.target.value))}
                      className="w-full bg-[#1F2127] border border-[#2E313A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#A1A1AA] mb-1 font-semibold">Validity Window</label>
                    <select
                      value={inviteDays}
                      onChange={(e) => setInviteDays(Number(e.target.value))}
                      className="w-full bg-[#1F2127] border border-[#2E313A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FF6B00]"
                    >
                      <option value={7}>7 Days</option>
                      <option value={14}>14 Days</option>
                      <option value={30}>30 Days (1 Month)</option>
                      <option value={90}>90 Days (1 Semester)</option>
                      <option value={365}>1 Year</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingInvite(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#A1A1AA] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingInviteLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-xs font-bold text-white shadow-md transition-colors"
                  >
                    {creatingInviteLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    <span>Create Code</span>
                  </button>
                </div>
              </form>
            )}

            {/* Invitations List */}
            {invitationsLoading ? (
              <div className="p-10 text-center text-[#71717A]">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#FF6B00] mb-2" />
                <span className="text-xs">Loading invitation codes...</span>
              </div>
            ) : invitations.length === 0 ? (
              <div className="p-12 rounded-xl bg-[#16171A] border border-[#26282E] text-center space-y-2">
                <Ticket className="h-8 w-8 text-[#71717A] mx-auto" />
                <h4 className="font-bold text-white text-sm">No Active Codes</h4>
                <p className="text-xs text-[#A1A1AA]">Generate your first invitation code above to begin onboarding students.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {invitations.map((inv) => (
                  <div key={inv.id} className="p-4 rounded-xl bg-[#16171A] border border-[#26282E] space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider block">
                          {inv.label || "General Student Cohort"}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-base font-extrabold text-white tracking-widest bg-[#1F2127] px-2.5 py-1 rounded border border-[#2E313A]">
                            {inv.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(inv.code)}
                            className="p-1.5 rounded-lg bg-[#22242A] hover:bg-[#2C2E35] text-[#A1A1AA] hover:text-white transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === inv.code ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        {inv.status === "active" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800 uppercase">
                            Active
                          </span>
                        ) : inv.status === "revoked" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/60 text-rose-400 border border-rose-800 uppercase">
                            Revoked
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#202228] text-[#71717A] border border-[#2C2E35] uppercase">
                            Expired
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] text-[#A1A1AA] bg-[#1B1D22] p-2.5 rounded-lg border border-[#2E313A]">
                      <div className="flex justify-between">
                        <span>Used capacity:</span>
                        <span className="font-semibold text-white font-mono">{inv.usedCount} / {inv.maxUses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expires on:</span>
                        <span className="text-white">{new Date(inv.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {inv.status === "active" && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleRevokeInvitation(inv.id, inv.code)}
                          className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          Revoke Code
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* STUDENT DETAIL SNAPSHOT MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#16171A] border border-[#26282E] rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between pb-3 border-b border-[#26282E]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#2A2D35] flex items-center justify-center font-bold text-white text-base">
                  {selectedStudent.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{selectedStudent.fullName}</h3>
                  <span className="text-xs text-[#A1A1AA] font-mono">{selectedStudent.email}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-lg text-[#71717A] hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Academic Details (Consent check) */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-[#FF6B00]" />
                Academic Snapshot
              </span>
              {selectedStudent.consent.shareAcademic ? (
                <div className="grid grid-cols-2 gap-2 text-xs bg-[#1B1D22] p-3 rounded-xl border border-[#2E313A]">
                  <div>
                    <span className="text-[#71717A] text-[10px] block">Course & Branch</span>
                    <span className="font-semibold text-white">{selectedStudent.course} • {selectedStudent.branch}</span>
                  </div>
                  <div>
                    <span className="text-[#71717A] text-[10px] block">Roll Number</span>
                    <span className="font-mono text-white">{selectedStudent.rollNumber || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[#71717A] text-[10px] block">Current CGPA</span>
                    <span className="font-bold text-emerald-400">{selectedStudent.cgpa ?? "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[#71717A] text-[10px] block">Graduation Year</span>
                    <span className="text-white">{selectedStudent.graduationYear ?? "N/A"}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#1B1D22] border border-[#2E313A] text-xs text-[#71717A] italic">
                  Academic credentials withheld under student's privacy preferences.
                </div>
              )}
            </div>

            {/* Readiness & Scores (Consent check) */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-[#FF6B00]" />
                Placement Readiness Metrics
              </span>
              {selectedStudent.consent.shareInterviewScores ? (
                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-[#1B1D22] p-3 rounded-xl border border-[#2E313A]">
                  <div>
                    <span className="text-[#71717A] text-[10px] block">Overall Readiness</span>
                    <span className="text-lg font-bold text-white">{selectedStudent.readinessScore ?? "—"}/100</span>
                  </div>
                  <div>
                    <span className="text-[#71717A] text-[10px] block">Technical Skills</span>
                    <span className="text-lg font-bold text-emerald-400">{selectedStudent.technicalSkillsScore ?? "—"}</span>
                  </div>
                  <div>
                    <span className="text-[#71717A] text-[10px] block">Communication</span>
                    <span className="text-lg font-bold text-blue-400">{selectedStudent.communicationScore ?? "—"}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#1B1D22] border border-[#2E313A] text-xs text-[#71717A] italic">
                  Interview and readiness scores withheld under student's privacy preferences.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 rounded-xl bg-[#22242A] hover:bg-[#2C2E35] text-xs font-bold text-white"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#16171A] border border-[#26282E] rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-sm">Decline Student Affiliation</h3>
            <p className="text-xs text-[#A1A1AA]">
              Provide an optional note explaining why the student affiliation is not accepted (e.g. wrong batch or unrecognized roll number).
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Roll number does not match current semester roster."
              className="w-full bg-[#1B1D22] border border-[#2E313A] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#FF6B00]"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setRejectingStudentId(null);
                  setRejectionReason("");
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#A1A1AA] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRejectStudent(rejectingStudentId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-md"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};
