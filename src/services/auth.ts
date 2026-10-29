import { User, ReadinessScore, SuggestedJobRole, College } from "../types";

export interface AuthResponse {
  user: User;
  college?: College | null;
  token?: string;
  readinessScore?: ReadinessScore;
  suggestedJobs?: SuggestedJobRole[];
  error?: string;
}

const TOKEN_KEY = "placement_session_token";
const USER_IDENTIFIER_KEY = "placement_user_identifier";

export function saveAuthToken(token?: string, identifier?: string) {
  if (token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  }
  if (identifier) {
    try {
      localStorage.setItem(USER_IDENTIFIER_KEY, identifier);
    } catch {}
  }
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredIdentifier(): string | null {
  try {
    return localStorage.getItem(USER_IDENTIFIER_KEY);
  } catch {
    return null;
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_IDENTIFIER_KEY);
  } catch {}
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["x-session-token"] = token;
  }
  return headers;
}

async function parseApiResponse(res: Response, fallbackErrorMessage: string): Promise<any> {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || fallbackErrorMessage);
      }
      return data;
    } catch (err: any) {
      if (err.message && err.message !== fallbackErrorMessage) {
        throw err;
      }
      throw new Error(fallbackErrorMessage);
    }
  }

  // If server returned HTML (e.g. 404/500 from static host like Vercel)
  const text = await res.text().catch(() => "");
  if (res.status === 404 || text.includes("The page could not be found")) {
    throw new Error(
      "Backend server is not running or API route not found (404). If you deployed on Vercel, Vercel only hosts static frontends by default. Deploy on Render/Railway or configure full-stack backend."
    );
  }
  throw new Error(fallbackErrorMessage || `Server returned error (${res.status})`);
}

export async function loginStudent(credentials: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return loginWithPortal(credentials, "student");
}

export async function loginCollegeOfficer(credentials: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return loginWithPortal(credentials, "college");
}

export async function loginAdmin(credentials: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return loginWithPortal(credentials, "admin");
}

async function loginWithPortal(
  credentials: { email: string; password: string },
  portal: "student" | "college" | "admin"
): Promise<AuthResponse> {
  const email = credentials.email.trim();
  const password = credentials.password;

  if (!email) {
    throw new Error("Please enter your email.");
  }
  if (!password) {
    throw new Error("Password is required.");
  }

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password, portal }),
  });

  const data = await parseApiResponse(res, "Invalid login credentials.");

  if (data.token) {
    saveAuthToken(data.token, data.user?.email || email);
  }

  return data;
}

export async function sendRegistrationOtp(params: {
  email: string;
  fullName: string;
  rollNumber?: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch("/api/auth/send-registration-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  return parseApiResponse(res, "Failed to send registration verification OTP.");
}

export async function registerStudent(
  userData: Record<string, any>
): Promise<AuthResponse> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(userData),
  });

  const data = await parseApiResponse(res, "Registration failed.");

  if (data.token) {
    saveAuthToken(data.token, data.user?.email || userData.email);
  }

  return data;
}

export async function registerCollege(
  collegeData: Record<string, any>
): Promise<AuthResponse & { college?: College }> {
  const res = await fetch("/api/college/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(collegeData),
  });

  const data = await parseApiResponse(res, "College registration failed.");

  if (data.token) {
    saveAuthToken(data.token, data.user?.email || collegeData.officerEmail);
  }

  return data;
}

export async function getCollegeStatus(): Promise<{
  success: boolean;
  role: string;
  verificationStatus: string;
  college: College | null;
}> {
  const res = await fetch("/api/college/status", {
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });

  return parseApiResponse(res, "Failed to retrieve college verification status.");
}

export interface AdminCollegesResponse {
  success: boolean;
  colleges: College[];
  counts: {
    all: number;
    pending: number;
    verified: number;
    rejected: number;
    suspended: number;
  };
}

export async function getAdminColleges(params?: {
  status?: string;
  search?: string;
}): Promise<AdminCollegesResponse> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") query.set("status", params.status);
  if (params?.search) query.set("search", params.search);

  const res = await fetch(`/api/admin/colleges?${query.toString()}`, {
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });

  return parseApiResponse(res, "Failed to fetch college applications.");
}

export async function getAdminCollege(
  id: string
): Promise<{ success: boolean; college: College; officer: User | null }> {
  const res = await fetch(`/api/admin/colleges/${encodeURIComponent(id)}`, {
    headers: {
      ...getAuthHeaders(),
    },
    credentials: "include",
  });

  return parseApiResponse(res, "Failed to fetch college details.");
}

export async function verifyCollege(
  id: string,
  data: { verificationMethod: string; reviewNotes?: string }
): Promise<{ success: boolean; message: string; college: College }> {
  const res = await fetch(`/api/admin/colleges/${encodeURIComponent(id)}/verify`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  return parseApiResponse(res, "Failed to verify college.");
}

export async function rejectCollege(
  id: string,
  data: { rejectionReason: string; reviewNotes?: string }
): Promise<{ success: boolean; message: string; college: College }> {
  const res = await fetch(`/api/admin/colleges/${encodeURIComponent(id)}/reject`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  return parseApiResponse(res, "Failed to reject college.");
}

export async function suspendCollege(
  id: string,
  data: { suspensionReason: string; reviewNotes?: string }
): Promise<{ success: boolean; message: string; college: College }> {
  const res = await fetch(`/api/admin/colleges/${encodeURIComponent(id)}/suspend`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  return parseApiResponse(res, "Failed to suspend college.");
}

export async function updateAdminCredentials(data: {
  currentPassword: string;
  newEmail?: string;
  newPassword?: string;
  confirmPassword?: string;
}): Promise<{ success: boolean; message: string; user: User }> {
  const res = await fetch("/api/admin/credentials", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  return parseApiResponse(res, "Failed to update admin credentials.");
}

export async function getCurrentUser(): Promise<AuthResponse | null> {
  try {
    const res = await fetch("/api/auth/me", {
      headers: {
        ...getAuthHeaders(),
      },
      credentials: "include",
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data.token) {
      saveAuthToken(data.token, data.user?.email);
    }
    return data;
  } catch {
    return null;
  }
}

export async function logoutStudent(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
      credentials: "include",
    });
  } catch (e) {
    console.error("Logout error", e);
  } finally {
    clearAuthToken();
  }
}

export async function changeStudentName(
  fullName: string
): Promise<{ user: User; message: string }> {
  const trimmed = fullName.trim();
  if (!trimmed) {
    throw new Error("Full Name is required.");
  }

  const res = await fetch("/api/account/name", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({
      fullName: trimmed,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to update full name.");
  }

  return data;
}

export async function changeStudentPassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}): Promise<{ message: string }> {
  const res = await fetch("/api/account/password", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
      confirmNewPassword: payload.confirmNewPassword,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to change password.");
  }

  return data;
}

export async function deleteStudentAccount(
  password: string
): Promise<{ message: string }> {
  const res = await fetch("/api/account", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({ password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to delete account.");
  }

  clearAuthToken();
  return data;
}

export async function updateStudentProfile(profileData: any): Promise<{
  user: User;
  readinessScore?: ReadinessScore;
  suggestedJobs?: SuggestedJobRole[];
  aiAnalysis?: any;
  message?: string;
}> {
  const res = await fetch("/api/auth/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(profileData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to update profile.");
  }

  return data;
}

export async function uploadStudentResume(file: File): Promise<{
  user: User;
  readinessScore?: ReadinessScore;
  suggestedJobs?: SuggestedJobRole[];
  aiAnalysis?: any;
  message?: string;
}> {
  const formData = new FormData();
  formData.append("resume", file);

  const headers = getAuthHeaders();
  const requestHeaders: Record<string, string> = {};
  if (headers.Authorization) requestHeaders["Authorization"] = headers.Authorization;
  if (headers["x-session-token"]) requestHeaders["x-session-token"] = headers["x-session-token"];

  const res = await fetch("/api/resume/upload", {
    method: "POST",
    headers: requestHeaders,
    credentials: "include",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to upload resume.");
  }

  return data;
}

export async function deleteStudentResume(): Promise<{
  user: User;
  readinessScore?: ReadinessScore;
  suggestedJobs?: SuggestedJobRole[];
  aiAnalysis?: any;
  message?: string;
}> {
  const res = await fetch("/api/resume", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
  });

  const data = await parseApiResponse(res, "Failed to remove resume.");
  return data;
}

// ----------------------------------------------------
// FORGOT PASSWORD WITH EMAIL OTP VERIFICATION
// ----------------------------------------------------

export async function requestPasswordResetOtp(
  email: string
): Promise<{ message: string }> {
  const cleanEmail = email.trim();
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email: cleanEmail }),
  });

  const data = await parseApiResponse(
    res,
    "Unable to process password reset request. Please try again."
  );
  return data;
}

export async function verifyPasswordResetOtp(
  email: string,
  otp: string
): Promise<{ success: boolean; resetToken: string; message: string }> {
  const cleanEmail = email.trim();
  const cleanOtp = otp.trim();
  const res = await fetch("/api/auth/verify-reset-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
  });

  const data = await parseApiResponse(res, "Invalid or expired OTP. Please try again.");
  return data;
}

export async function resetPasswordWithOtp(payload: {
  resetToken: string;
  newPassword: string;
  confirmPassword?: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await parseApiResponse(res, "Failed to reset password. Please try again.");
  return data;
}

// ----------------------------------------------------
// PHASE 4: STUDENT-COLLEGE LINKING & INVITATION APIS
// ----------------------------------------------------

export async function validateCollegeInvitationCode(code: string) {
  const clean = encodeURIComponent(code.trim().toUpperCase());
  const res = await fetch(`/api/invitations/validate/${clean}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return parseApiResponse(res, "Invalid or expired college invitation code.");
}

export async function linkStudentWithCollege(
  code: string,
  consent: {
    shareAcademic?: boolean;
    shareSkillRoadmap?: boolean;
    shareInterviewScores?: boolean;
  }
) {
  const res = await fetch("/api/student/link-college", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({ code: code.trim().toUpperCase(), consent }),
  });
  return parseApiResponse(res, "Failed to link with college.");
}

export async function getStudentCollegeMembership() {
  const res = await fetch("/api/student/college-membership", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return parseApiResponse(res, "Failed to retrieve college membership.");
}

export async function updateStudentCollegeConsent(consent: {
  shareAcademic?: boolean;
  shareSkillRoadmap?: boolean;
  shareInterviewScores?: boolean;
}) {
  const res = await fetch("/api/student/college-consent", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(consent),
  });
  return parseApiResponse(res, "Failed to update consent preferences.");
}

export async function disconnectStudentCollegeMembership() {
  const res = await fetch("/api/student/college-membership", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return parseApiResponse(res, "Failed to disconnect from college.");
}

// Officer College APIs
export async function getCollegeInvitations() {
  const res = await fetch("/api/college/invitations", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return parseApiResponse(res, "Failed to load college invitations.");
}

export async function createCollegeInvitation(data: {
  label?: string;
  maxUses?: number;
  validityDays?: number;
}) {
  const res = await fetch("/api/college/invitations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return parseApiResponse(res, "Failed to generate invitation code.");
}

export async function revokeCollegeInvitation(id: string) {
  const res = await fetch(`/api/college/invitations/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return parseApiResponse(res, "Failed to revoke invitation code.");
}

export async function getCollegeMemberships(status?: string, search?: string) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (search && search.trim()) params.set("search", search.trim());
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  const res = await fetch(`/api/college/memberships${queryStr}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return parseApiResponse(res, "Failed to fetch student cohort roster.");
}

export async function approveCollegeMembership(id: string) {
  const res = await fetch(`/api/college/memberships/${encodeURIComponent(id)}/approve`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return parseApiResponse(res, "Failed to approve student request.");
}

export async function rejectCollegeMembership(id: string, reason?: string) {
  const res = await fetch(`/api/college/memberships/${encodeURIComponent(id)}/reject`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({ reason }),
  });
  return parseApiResponse(res, "Failed to reject student request.");
}

export async function removeCollegeMembership(id: string) {
  const res = await fetch(`/api/college/memberships/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return parseApiResponse(res, "Failed to remove student from cohort.");
}

// ----------------------------------------------------
// PHASE 5: COLLEGE ANALYTICS & REPORT EXPORT APIS
// ----------------------------------------------------

export async function getCollegeAnalytics() {
  const res = await fetch("/api/college/analytics", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return parseApiResponse(res, "Failed to load college analytics.");
}

export async function getStudentProgressDetail(studentId: string) {
  const res = await fetch(`/api/college/students/${encodeURIComponent(studentId)}/progress`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
  });
  return parseApiResponse(res, "Failed to load student progress detail.");
}

export async function downloadCollegeCsvReport() {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["x-session-token"] = token;
  }

  const res = await fetch("/api/college/reports/csv", {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to download CSV report.");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PlacementOS_Cohort_Report_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function downloadCollegePdfReport() {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["x-session-token"] = token;
  }

  const res = await fetch("/api/college/reports/pdf", {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Failed to download PDF report.");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PlacementOS_Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}




