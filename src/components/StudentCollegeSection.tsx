import React, { useState, useEffect } from "react";
import { User, CollegeMembership, College } from "../types";
import {
  getStudentCollegeMembership,
  validateCollegeInvitationCode,
  linkStudentWithCollege,
  updateStudentCollegeConsent,
  disconnectStudentCollegeMembership,
} from "../services/auth";
import {
  Building2,
  CheckCircle2,
  Clock,
  Shield,
  ShieldCheck,
  AlertCircle,
  Unlink,
  Check,
  Loader2,
  Lock,
  ExternalLink,
  MapPin,
  Sparkles,
} from "lucide-react";

interface StudentCollegeSectionProps {
  user: User;
  onCollegeUpdated?: (collegeName: string) => void;
}

export const StudentCollegeSection: React.FC<StudentCollegeSectionProps> = ({
  user,
  onCollegeUpdated,
}) => {
  const [membership, setMembership] = useState<CollegeMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Link form state
  const [inviteCode, setInviteCode] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);
  const [validatedCollege, setValidatedCollege] = useState<College | null>(null);
  const [validatedInvitation, setValidatedInvitation] = useState<any | null>(null);

  // Granular consent state
  const [shareAcademic, setShareAcademic] = useState(true);
  const [shareSkillRoadmap, setShareSkillRoadmap] = useState(true);
  const [shareInterviewScores, setShareInterviewScores] = useState(true);
  const [submittingLink, setSubmittingLink] = useState(false);

  // Existing membership consent editing
  const [updatingConsent, setUpdatingConsent] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const fetchMembership = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStudentCollegeMembership();
      if (res && res.membership) {
        setMembership(res.membership);
        if (res.membership.consent) {
          setShareAcademic(Boolean(res.membership.consent.shareAcademic));
          setShareSkillRoadmap(Boolean(res.membership.consent.shareSkillRoadmap));
          setShareInterviewScores(Boolean(res.membership.consent.shareInterviewScores));
        }
      } else {
        setMembership(null);
      }
    } catch (err: any) {
      console.warn("Failed to load college membership:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembership();
  }, [user]);

  // Handle validate code
  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setValidatedCollege(null);
    setValidatedInvitation(null);

    const clean = inviteCode.trim().toUpperCase();
    if (!clean) {
      setError("Please enter a valid invitation code.");
      return;
    }

    setValidatingCode(true);
    try {
      const res = await validateCollegeInvitationCode(clean);
      if (res && res.valid) {
        setValidatedCollege(res.college);
        setValidatedInvitation(res.invitation);
        setSuccess(`Verified invitation from ${res.college.name}`);
      } else {
        setError(res.error || "Invalid invitation code.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to validate code.");
    } finally {
      setValidatingCode(false);
    }
  };

  // Handle submit link
  const handleSubmitLink = async () => {
    if (!validatedInvitation || !validatedCollege) return;
    setError(null);
    setSuccess(null);
    setSubmittingLink(true);

    try {
      const res = await linkStudentWithCollege(validatedInvitation.code, {
        shareAcademic,
        shareSkillRoadmap,
        shareInterviewScores,
      });

      setSuccess(res.message || "Affiliation request submitted successfully!");
      setMembership(res.membership);
      setValidatedCollege(null);
      setValidatedInvitation(null);
      setInviteCode("");
      if (onCollegeUpdated && res.college?.name) {
        onCollegeUpdated(res.college.name);
      }
      await fetchMembership();
    } catch (err: any) {
      setError(err.message || "Failed to link with college.");
    } finally {
      setSubmittingLink(false);
    }
  };

  // Handle save consent updates
  const handleSaveConsent = async () => {
    setError(null);
    setSuccess(null);
    setUpdatingConsent(true);

    try {
      const res = await updateStudentCollegeConsent({
        shareAcademic,
        shareSkillRoadmap,
        shareInterviewScores,
      });
      setSuccess("Data-sharing consent updated successfully.");
      setTimeout(() => setSuccess(null), 3500);
      await fetchMembership();
    } catch (err: any) {
      setError(err.message || "Failed to update consent preferences.");
    } finally {
      setUpdatingConsent(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    setError(null);
    setSuccess(null);
    setDisconnecting(true);

    try {
      const res = await disconnectStudentCollegeMembership();
      setSuccess(res.message || "Successfully disconnected from college.");
      setMembership(null);
      setConfirmDisconnect(false);
      if (onCollegeUpdated) {
        onCollegeUpdated("Independent Learner");
      }
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err.message || "Failed to disconnect.");
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        <span className="text-xs text-slate-500 font-medium">Checking college affiliation...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs">
      {/* Informative Banner */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <span>College Placement Cell Affiliation</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">
                Optional
              </span>
            </h4>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Placement OS empowers you to prepare independently. Linking your account with your college placement cell allows your campus officers to review your readiness scores for recruitment drives, under your granular consent.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-700 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="text-xs font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-700 flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
          <span className="text-xs font-medium">{success}</span>
        </div>
      )}

      {/* Case 1: Student is Connected or Pending Affiliation */}
      {membership && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
            <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 font-black text-sm">
                  {membership.college?.name ? membership.college.name.charAt(0) : "C"}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {membership.college?.name || user.college || "Affiliated Institution"}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                    {membership.college?.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {membership.college.city}, {membership.college.state}
                      </span>
                    )}
                    {membership.college?.code && (
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                        {membership.college.code}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {membership.status === "active" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified Active
                  </span>
                ) : membership.status === "pending" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="h-3.5 w-3.5" />
                    Pending Approval
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                    {membership.status}
                  </span>
                )}
              </div>
            </div>

            {membership.status === "pending" && (
              <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3 text-amber-800 text-[11px] leading-relaxed">
                Your affiliation request was submitted on {new Date(membership.requestedAt).toLocaleDateString()}. The placement officer is reviewing your profile. Once approved, your consented metrics will appear in the college roster.
              </div>
            )}

            {/* Granular Consent Controls */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" />
                  Your Granular Data-Sharing Preferences
                </span>
                <span className="text-[10px] text-slate-400">Manage anytime</span>
              </div>

              <div className="space-y-2.5">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50/60 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareAcademic}
                    onChange={(e) => setShareAcademic(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block text-xs">
                      Share Academic Credentials
                    </span>
                    <span className="text-slate-500 text-[11px] leading-snug">
                      Roll number, course, branch, semester, CGPA, graduation year, and backlogs.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50/60 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareSkillRoadmap}
                    onChange={(e) => setShareSkillRoadmap(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block text-xs">
                      Share Skill Gap Analysis & Roadmap Progress
                    </span>
                    <span className="text-slate-500 text-[11px] leading-snug">
                      Identified missing skills, technical target roles, and roadmap completion percentage.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50/60 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareInterviewScores}
                    onChange={(e) => setShareInterviewScores(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block text-xs">
                      Share AI Mock Interview Scores & Readiness Score
                    </span>
                    <span className="text-slate-500 text-[11px] leading-snug">
                      Overall placement readiness score, technical/communication sub-scores, and interview performance summary.
                    </span>
                  </div>
                </label>
              </div>

              {/* Data Privacy Guarantee Badge */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-600 flex items-start gap-2.5">
                <Lock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Privacy Guarantee:</strong> Placement OS never shares your raw interview transcripts, private AI chat sessions, or uploaded resume files with your college.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveConsent}
                  disabled={updatingConsent}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {updatingConsent ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Preferences...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Update Sharing Preferences</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Disconnect Action */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/30 p-4 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-rose-900 text-xs">Disconnect From College</h4>
                <p className="text-[11px] text-rose-700">
                  Withdraw all permissions and immediately remove your profile from the college roster.
                </p>
              </div>

              {confirmDisconnect ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDisconnect(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 shadow-xs"
                  >
                    {disconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
                    Confirm Disconnect
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDisconnect(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 bg-white text-xs font-bold text-rose-700 hover:bg-rose-50 shadow-2xs transition-colors shrink-0"
                >
                  <Unlink className="h-3.5 w-3.5" />
                  Disconnect College
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Case 2: Student is Independent / Not Connected */}
      {!membership && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sparkles className="h-4 w-4 text-[#FF6B00]" />
              <h3 className="font-bold text-slate-900 text-xs">
                Connect With Your College Placement Cell
              </h3>
            </div>

            <p className="text-slate-600 text-[11px] leading-relaxed">
              If your college or training & placement cell has issued an institutional invitation code, enter it below to join your campus placement cohort.
            </p>

            <form onSubmit={handleValidateCode} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  College Invitation Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="e.g. 7A9F4B2E"
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono uppercase text-slate-900 focus:border-indigo-600 focus:outline-none bg-white tracking-wider"
                  />
                  <button
                    type="submit"
                    disabled={validatingCode || !inviteCode.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors shrink-0 shadow-xs"
                  >
                    {validatingCode ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <span>Verify Code</span>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Validated College Card & Consent Agreement */}
            {validatedCollege && validatedInvitation && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                      {validatedCollege.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Verified Institutional Partner
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {validatedCollege.name}
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        {validatedCollege.city}, {validatedCollege.state}
                        {validatedCollege.code && ` • Campus Code: ${validatedCollege.code}`}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Valid Code
                  </span>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-emerald-200/60">
                  <span className="font-bold text-slate-900 text-xs block">
                    Choose what information you share with this placement cell:
                  </span>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-emerald-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shareAcademic}
                      onChange={(e) => setShareAcademic(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 block text-xs">
                        Academic Profile
                      </span>
                      <span className="text-slate-500 text-[10px] block">
                        Roll number, branch, semester, CGPA, graduation year, and backlogs.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-emerald-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shareSkillRoadmap}
                      onChange={(e) => setShareSkillRoadmap(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 block text-xs">
                        Skill Gaps & Roadmap Progress
                      </span>
                      <span className="text-slate-500 text-[10px] block">
                        Target roles, identified skill gaps, and learning completion %.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-emerald-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shareInterviewScores}
                      onChange={(e) => setShareInterviewScores(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 block text-xs">
                        Mock Interview Scores & Readiness Score
                      </span>
                      <span className="text-slate-500 text-[10px] block">
                        Placement readiness score and high-level interview category scores.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSubmitLink}
                    disabled={submittingLink}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-xs transition-colors"
                  >
                    {submittingLink ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Confirm & Connect to {validatedCollege.name}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
