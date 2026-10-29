import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import {
  db,
  initMongo,
  sanitizeUser,
  sanitizeCollege,
  sanitizeStudentForCollege,
  UserDocument,
  RoadmapDocument,
  SessionModel,
  CollegeDocument,
  CollegeInvitationDocument,
  CollegeMembershipDocument,
  GranularConsent,
} from "./server/db.js";
import {
  analyzeJobMatch,
  quickJobMatch,
  suggestJobRolesForStudent,
  generatePersonalizedRoadmap,
  generateSkillGapAndRoadmap,
  calculatePlacementReadiness,
  generateInterviewGreetingAndFirstQuestion,
  evaluateAnswerAndGenerateNextQuestion,
  evaluateMockInterview,
  adaptRoadmapFromInterview,
  generateStudentAiProfileAnalysis,
  generateJobRoleRecommendations,
} from "./server/placementAi.js";
import { parseResumeDocument } from "./server/resumeParser.js";
import { getCareerRecommendations } from "./src/data/careerRecommendationEngine.js";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Setup upload handler
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  storage: multer.memoryStorage(),
});

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(cookieParser());

// ----------------------------------------------------
// AUTHENTICATION HELPER
// ----------------------------------------------------

// Auth helper - strictly verifies session token from HTTP-only cookie or Authorization header
async function getAuthenticatedUser(req: Request): Promise<UserDocument | null> {
  const token =
    req.cookies?.placement_session_token ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "") ||
    (req.headers["x-session-token"] as string);

  if (!token || typeof token !== "string") {
    return null;
  }

  // 1. Session token lookup in database
  const session = await db.sessions.get(token);
  if (session && session.userId) {
    const user = await db.users.findById(session.userId);
    if (user) {
      if (!user.role) user.role = "student";
      if (!user.verificationStatus) user.verificationStatus = "verified";
      return user;
    }
  }

  return null;
}

// ----------------------------------------------------
// SECURE SUPER ADMIN PRIVATE ROUTE CONFIGURATION & SHIELD
// ----------------------------------------------------

// Ephemeral in-memory key for production if ADMIN_ROUTE_SECRET is not configured
let ephemeralAdminSecret: string | null = null;

function getAdminRouteSecret(): string {
  const envSecret = process.env.ADMIN_ROUTE_SECRET?.trim();
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }

  // In production: strictly prevent static predictable fallback; generate ephemeral 256-bit token
  if (process.env.NODE_ENV === "production") {
    if (!ephemeralAdminSecret) {
      ephemeralAdminSecret = crypto.randomBytes(32).toString("hex");
      console.warn(
        "[Security Notice] ADMIN_ROUTE_SECRET environment variable is not configured. An ephemeral cryptographically secure 256-bit token has been generated in-memory for this server instance."
      );
    }
    return ephemeralAdminSecret;
  }

  // Development / Staging fallback when ADMIN_ROUTE_SECRET is not supplied
  return process.env.ADMIN_ROUTE_SECRET_DEV_FALLBACK || "sec_7f9b2d8e4c1a5b3f6e8d2a4c9b1e7f3a8d0c2e4b6f8a1c3e5d7b9a0f2c4e6b8";
}

function isValidAdminRouteSecret(providedSecret: string): boolean {
  if (!providedSecret || typeof providedSecret !== "string") return false;
  const expectedSecret = getAdminRouteSecret();
  const providedBuffer = Buffer.from(providedSecret);
  const expectedBuffer = Buffer.from(expectedSecret);
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

// HTML responses (reusable and opaque)
const OPAQUE_404_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 Not Found</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #FAF9F5; color: #111315; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .box { max-width: 420px; padding: 40px; text-align: center; }
    h1 { font-size: 32px; font-weight: 700; margin-bottom: 8px; }
    p { font-size: 14px; color: #737373; margin-bottom: 24px; }
    a { display: inline-block; padding: 10px 20px; background: #111315; color: #fff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="box">
    <h1>404</h1>
    <p>The requested URL was not found on this server.</p>
    <a href="/">Return to Home</a>
  </div>
</body>
</html>`;

function sendOpaque404(res: Response): void {
  res.status(404).type("html").send(OPAQUE_404_HTML);
}

function sendForbiddenAdminAccess(res: Response, userRole: string): void {
  res.status(403).type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>403 Forbidden</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #FAF9F5; color: #111315; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .box { max-width: 440px; padding: 40px; text-align: center; background: #fff; border: 1px solid #E5E3DE; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    h1 { font-size: 24px; font-weight: 700; color: #DC2626; margin-bottom: 8px; }
    p { font-size: 13px; color: #737373; line-height: 1.6; margin-bottom: 24px; }
    a { display: inline-block; padding: 10px 20px; background: #111315; color: #fff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="box">
    <h1>403 Forbidden</h1>
    <p>Access Denied. You are currently authenticated with a <strong>${userRole}</strong> account. Super Administrator privileges are required to access this console.</p>
    <a href="/login">Return to Portal</a>
  </div>
</body>
</html>`);
}

// Comprehensive Admin & Private Route Shield Middleware
// Sits before static files and Vite / SPA fallback. Completely shields legacy admin routes and
// strictly enforces private admin route validation. Rejects any repeated-slash,
// encoded, malformed, or invalid paths with an opaque 404 WITHOUT normalizing.
app.use(async (req: Request, res: Response, next: NextFunction) => {
  // If request begins with /api/, allow API routers to handle it
  if (req.path.startsWith("/api/")) {
    return next();
  }

  // Extract raw URL path and decoded path
  const urlCandidate = req.originalUrl || req.url || req.path || "";
  const rawPath = urlCandidate.split(/[?#]/)[0];

  let decodedPath: string | null = null;
  let isMalformedUri = false;
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    isMalformedUri = true;
  }

  // A. Check for Legacy Admin Routes
  // Blocks /admin, //admin, /admin/*, /admin//, /admin/login, /admin/colleges, /something/../admin, etc.
  const legacyAdminRegex = /(^|\/)\s*admin(\/|\.|$)/i;
  const isLegacyAdmin =
    legacyAdminRegex.test(rawPath) ||
    (decodedPath !== null && legacyAdminRegex.test(decodedPath));

  if (isLegacyAdmin) {
    return sendOpaque404(res);
  }

  // B. Check for Private Control Routes
  const rawLower = rawPath.toLowerCase();
  const decodedLower = decodedPath ? decodedPath.toLowerCase() : "";
  const touchesPrivateControl =
    rawLower.includes("private-control") || decodedLower.includes("private-control");

  if (!touchesPrivateControl) {
    // Normal student, college, legal, or public route -> continue
    return next();
  }

  // If it touches private-control, it MUST strictly conform to the expected format.
  // Any deviation (repeated slashes, malformed URI, traversal, encoded slashes,
  // backslashes, wrong secret) is rejected with 404 WITHOUT normalizing.

  // 1. Malformed URI encoding (e.g. invalid % sequences)
  if (isMalformedUri) {
    return sendOpaque404(res);
  }

  // 2. Reject repeated slashes anywhere in raw or decoded path (e.g. //private-control, /private-control//, /private-control/secret//)
  if (rawPath.includes("//") || (decodedPath !== null && decodedPath.includes("//"))) {
    return sendOpaque404(res);
  }

  // 3. Reject directory traversal characters, dot segments, or encoded dots (%2e, %2E)
  if (
    rawPath.includes("..") ||
    rawLower.includes("%2e") ||
    (decodedPath !== null && decodedPath.includes(".."))
  ) {
    return sendOpaque404(res);
  }

  // 4. Reject encoded slashes (%2f, %2F) or backslashes (\, %5c)
  if (
    rawLower.includes("%2f") ||
    rawPath.includes("\\") ||
    rawLower.includes("%5c") ||
    (decodedPath !== null && (decodedPath.includes("\\") || decodedPath.includes("%2f")))
  ) {
    return sendOpaque404(res);
  }

  // 5. Must strictly start with "/private-control/" (exact case, single leading slash)
  // Rejects bare "/private-control", "/Private-Control", etc.
  if (!rawPath.startsWith("/private-control/")) {
    return sendOpaque404(res);
  }

  // 6. Inspect segments after "/private-control/"
  const remainder = rawPath.slice("/private-control/".length);
  const segments = remainder.split("/");

  // First segment is the secret candidate
  const candidateSecret = segments[0];
  if (!candidateSecret || !isValidAdminRouteSecret(candidateSecret)) {
    return sendOpaque404(res);
  }

  // Subsequent segments (if any) must be valid alphanumeric/dash/underscore (e.g. /colleges)
  // Note: a single trailing slash yields segments: ["<secret>", ""] which is valid.
  const subSegments = segments.slice(1);
  for (let i = 0; i < subSegments.length; i++) {
    const sub = subSegments[i];
    // If it's an empty segment, it can only be the final segment (single trailing slash)
    if (sub === "") {
      if (i !== subSegments.length - 1) {
        return sendOpaque404(res);
      }
    } else {
      // Must be standard URL segment
      if (!/^[a-zA-Z0-9_-]+$/.test(sub)) {
        return sendOpaque404(res);
      }
    }
  }

  // 7. Route and secret are verified valid!
  // Check authenticated session for role authorization
  const currentUser = await getAuthenticatedUser(req);
  if (currentUser && currentUser.role !== "admin") {
    // Student or Placement Officer session trying to access admin console
    return sendForbiddenAdminAccess(res, currentUser.role);
  }

  // Allowed (unauthenticated visitor to view AdminLoginPage or authenticated admin to view console)
  next();
});

// Static public assets (redirect disabled to prevent trailing slash redirects on malformed URLs)
app.use(express.static(path.join(process.cwd(), "public"), { redirect: false }));

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
];

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "online",
    provider: "Groq",
    models: GROQ_MODELS,
    app: "PlacementOS",
  });
});
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized. Please log in." });
      return;
    }
    (req as any).user = user;
    next();
  } catch (err: any) {
    next(err);
  }
}

// Role-based Access Control Middleware
function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as UserDocument | undefined;
    if (!user) {
      res.status(401).json({ error: "Unauthorized. Please log in." });
      return;
    }
    const userRole = user.role || "student";
    if (!roles.includes(userRole)) {
      res.status(403).json({
        error: "Forbidden. You do not have permission to access this resource.",
        requiredRoles: roles,
        currentRole: userRole,
      });
      return;
    }
    next();
  };
}

// College Verification Middleware (allows admin or verified placement_officer only)
async function requireVerifiedCollege(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user as UserDocument | undefined;
    if (!user) {
      res.status(401).json({ error: "Unauthorized. Please log in." });
      return;
    }
    const userRole = user.role || "student";
    if (userRole === "admin") {
      return next();
    }
    if (userRole !== "placement_officer") {
      res.status(403).json({
        error: "Forbidden. Only college placement officers can access this resource.",
      });
      return;
    }
    let college: CollegeDocument | null = null;
    if (user.collegeId) {
      college = await db.colleges.findById(user.collegeId);
    }
    if (!college) {
      college = await db.colleges.findByOfficerUserId(user.id);
    }

    if (!college) {
      res.status(403).json({
        error: "College record not found.",
        code: "COLLEGE_NOT_FOUND",
      });
      return;
    }

    if (user.verificationStatus === "suspended" || college.status === "suspended") {
      res.status(403).json({
        error: "College account is suspended.",
        status: "suspended",
        code: "COLLEGE_SUSPENDED",
        reason: college.suspensionReason || "Account suspended by platform administrator.",
      });
      return;
    }

    if (user.verificationStatus === "rejected" || college.status === "rejected") {
      res.status(403).json({
        error: "College registration request was rejected.",
        status: "rejected",
        code: "COLLEGE_REJECTED",
        reason: college.rejectionReason || "Registration rejected by platform administrator.",
      });
      return;
    }

    if (user.verificationStatus !== "verified" || college.status !== "verified") {
      res.status(403).json({
        error: "College verification pending. Your college account is under review by the platform administrator.",
        status: "pending",
        code: "COLLEGE_VERIFICATION_PENDING",
      });
      return;
    }

    (req as any).college = college;
    next();
  } catch (err: any) {
    next(err);
  }
}

// In-memory rate limiting map for sensitive endpoints
const passwordChangeRateLimit = new Map<string, { count: number; firstAttempt: number }>();
const deleteAccountRateLimit = new Map<string, { count: number; firstAttempt: number }>();
const registerRateLimit = new Map<string, { count: number; firstAttempt: number }>();
const loginRateLimit = new Map<string, { count: number; firstAttempt: number }>();
const validateInvitationRateLimit = new Map<string, { count: number; firstAttempt: number }>();

function checkRateLimit(
  map: Map<string, { count: number; firstAttempt: number }>,
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
): boolean {
  const now = Date.now();
  const record = map.get(key);

  if (!record) {
    map.set(key, { count: 1, firstAttempt: now });
    return true;
  }

  if (now - record.firstAttempt > windowMs) {
    map.set(key, { count: 1, firstAttempt: now });
    return true;
  }

  record.count += 1;
  return record.count <= maxAttempts;
}

// Rate limiting for Forgot Password OTP requests and OTP verification
interface ForgotPasswordRateLimitRecord {
  count: number;
  firstAttempt: number;
  lastRequestedAt: number;
}
const forgotPasswordRateLimit = new Map<string, ForgotPasswordRateLimitRecord>();
const otpVerifyRateLimit = new Map<string, { count: number; firstAttempt: number }>();

function checkForgotPasswordRateLimit(
  key: string,
  cooldownMs = 60 * 1000,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
): { allowed: boolean; reason?: "cooldown" | "limit"; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = forgotPasswordRateLimit.get(key);
  if (!record) {
    forgotPasswordRateLimit.set(key, { count: 1, firstAttempt: now, lastRequestedAt: now });
    return { allowed: true };
  }

  // 60-second resend cooldown
  if (now - record.lastRequestedAt < cooldownMs) {
    const retryAfterSeconds = Math.ceil((cooldownMs - (now - record.lastRequestedAt)) / 1000);
    return { allowed: false, reason: "cooldown", retryAfterSeconds };
  }

  // Window expiry reset
  if (now - record.firstAttempt > windowMs) {
    forgotPasswordRateLimit.set(key, { count: 1, firstAttempt: now, lastRequestedAt: now });
    return { allowed: true };
  }

  // Attempt limit per window
  if (record.count >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((windowMs - (now - record.firstAttempt)) / 1000);
    return { allowed: false, reason: "limit", retryAfterSeconds };
  }

  record.count += 1;
  record.lastRequestedAt = now;
  return { allowed: true };
}

// ----------------------------------------------------
// AUTHENTICATION & SECURITY ENDPOINTS
// ----------------------------------------------------

const registerOtpRateLimit = new Map<string, { count: number; firstAttempt: number; lastRequestedAt: number }>();

// 1. Send Registration OTP (Temporarily disabled)
app.post("/api/auth/send-registration-otp", async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Email OTP verification is temporarily disabled. You can register directly.",
  });
});

// 2. Student Registration (Email OTP verification temporarily bypassed)
app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "client";

    if (!checkRateLimit(registerRateLimit, clientIp, 20, 15 * 60 * 1000)) {
      res.status(429).json({ error: "Too many registration attempts. Please try again later." });
      return;
    }

    const {
      email,
      password,
      fullName,
      phone,
      rollNumber,
      college,
      course,
      branch,
      semester,
      cgpa,
      tenthMarks,
      twelfthMarks,
      graduationYear,
      courseDuration,
      backlogs,
      skills,
      targetRoles,
    } = req.body;

    const gradYear = Number(graduationYear) || (new Date().getFullYear() + ((course === "Diploma" || course === "BCA" ? 3 : 4) - Math.ceil(Number(semester || 1) / 2)));

    const cleanCollege = (college && typeof college === "string" && college.trim()) ? college.trim() : "Independent Learner";

    if (!email || !password || !fullName || !course || !branch || !semester || cgpa === undefined || !gradYear) {
      res.status(400).json({
        error: "Missing required registration fields: email, password, fullName, course, branch, semester, and cgpa are mandatory.",
      });
      return;
    }

    const semNum = Number(semester);
    const maxSem = (course === "Diploma" || course === "BCA") ? 6 : 8;
    if (isNaN(semNum) || semNum < 1 || semNum > maxSem) {
      res.status(400).json({
        error: `Invalid semester for ${course}. Allowed options are Semester 1 to Semester ${maxSem}.`,
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: "Please provide a valid email address." });
      return;
    }

    // Password strength enforcement
    const hasMinLen = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    if (!hasMinLen || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      res.status(400).json({
        error: "Password must be at least 8 characters and include uppercase, lowercase, number, and a special symbol.",
      });
      return;
    }

    // Check email uniqueness in MongoDB
    const existingUser = await db.users.findByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: "An account with this email address already exists. Please sign in." });
      return;
    }

    // Check rollNumber uniqueness if provided
    if (rollNumber && rollNumber.trim()) {
      const existingRoll = await db.users.findByRollNumber(rollNumber.trim());
      if (existingRoll) {
        res.status(409).json({ error: "An account with this Roll / Registration number already exists." });
        return;
      }
    }

    // Hash password with bcrypt (cost factor 10)
    const passwordHash = await bcrypt.hash(password, 10);

    const userId = `student-${crypto.randomBytes(8).toString("hex")}`;
    const newUser: UserDocument = {
      id: userId,
      email: email.toLowerCase().trim(),
      passwordHash,
      fullName: fullName.trim(),
      role: "student",
      verificationStatus: "verified",
      phone: phone?.trim() || "",
      rollNumber: rollNumber?.trim() || "",
      college: cleanCollege,
      course: course.trim(),
      branch: branch.trim(),
      semester: Number(semester),
      cgpa: Number(cgpa),
      tenthMarks: tenthMarks ? Number(tenthMarks) : undefined,
      twelfthMarks: twelfthMarks ? Number(twelfthMarks) : undefined,
      graduationYear: gradYear,
      courseDuration: courseDuration || "",
      backlogs: backlogs ? Number(backlogs) : 0,
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(",").map((s: string) => s.trim()).filter(Boolean) : []),
      targetRoles: Array.isArray(targetRoles) ? targetRoles : (targetRoles ? targetRoles.split(",").map((r: string) => r.trim()).filter(Boolean) : []),
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const createdUser = await db.users.create(newUser);

    // Create session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await db.sessions.create(sessionToken, createdUser.id, expiresAt);

    // Set secure HTTP-only cookie
    res.cookie("placement_session_token", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Compute initial placement readiness score
    const initialScore = await calculatePlacementReadiness(createdUser, [], []);
    await db.readinessScores.save(initialScore);

    // Generate initial suggested jobs
    const allJobs = await db.jobs.all();
    const suggestedJobs = suggestJobRolesForStudent(createdUser, allJobs, 3);

    const safeUser = sanitizeUser(createdUser);

    res.status(201).json({
      success: true,
      message: "Student account registered successfully!",
      user: safeUser,
      token: sessionToken,
      readinessScore: initialScore,
      suggestedJobs,
    });
  } catch (err: any) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed: " + err.message });
  }
});

// 2b. College Placement Officer Registration (Pending Verification by Default)
app.post("/api/college/register", async (req: Request, res: Response) => {
  try {
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "client";

    if (!checkRateLimit(registerRateLimit, clientIp, 30, 15 * 60 * 1000)) {
      res.status(429).json({ error: "Too many college registration attempts. Please try again after 15 minutes." });
      return;
    }

    const {
      collegeName,
      code,
      domain,
      website,
      city,
      state,
      country,
      officerName,
      officerEmail,
      officerPhone,
      officerDesignation,
      password,
    } = req.body || {};

    if (!collegeName || !city || !state || !officerName || !officerEmail || !officerPhone || !officerDesignation || !password) {
      res.status(400).json({
        error: "Missing required fields: Institution Name, City, State, Officer Name, Email, Phone, Designation, and Password are mandatory.",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(officerEmail)) {
      res.status(400).json({ error: "Please provide a valid official email address." });
      return;
    }

    // Password strength
    const hasMinLen = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    if (!hasMinLen || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      res.status(400).json({
        error: "Password must be at least 8 characters and include uppercase, lowercase, number, and a special symbol.",
      });
      return;
    }

    const cleanEmail = officerEmail.toLowerCase().trim();

    // Ensure email is unique across users
    const existingUser = await db.users.findByEmail(cleanEmail);
    if (existingUser) {
      res.status(409).json({
        error: "An account with this email address already exists. Please log in or use your institutional email address.",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const officerUserId = `officer-${crypto.randomBytes(8).toString("hex")}`;
    const collegeId = `college-${crypto.randomBytes(8).toString("hex")}`;
    const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    // 1. Create College record with status: "pending"
    const newCollege: CollegeDocument = {
      id: collegeId,
      name: collegeName.trim(),
      code: code?.trim().toUpperCase() || "",
      domain: domain?.trim().toLowerCase() || "",
      website: website?.trim() || "",
      city: city.trim(),
      state: state.trim(),
      country: country?.trim() || "India",
      officerName: officerName.trim(),
      officerEmail: cleanEmail,
      officerPhone: officerPhone.trim(),
      officerDesignation: officerDesignation.trim(),
      officerUserId,
      status: "pending",
      inviteCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const createdCollege = await db.colleges.create(newCollege);

    // 2. Create Officer user with role: "placement_officer" and verificationStatus: "pending"
    const newOfficer: UserDocument = {
      id: officerUserId,
      email: cleanEmail,
      passwordHash,
      fullName: officerName.trim(),
      role: "placement_officer",
      verificationStatus: "pending",
      collegeId,
      college: collegeName.trim(),
      designation: officerDesignation.trim(),
      phone: officerPhone.trim(),
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const createdOfficer = await db.users.create(newOfficer);

    // 3. Create persistent session
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await db.sessions.create(sessionToken, createdOfficer.id, expiresAt);

    // Set secure HTTP-only cookie
    res.cookie("placement_session_token", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const safeOfficer = sanitizeUser(createdOfficer);

    res.status(201).json({
      success: true,
      message: "College placement cell application submitted successfully. Your registration is currently under review by Placement OS administration.",
      user: safeOfficer,
      college: createdCollege,
      token: sessionToken,
    });
  } catch (err: any) {
    console.error("College registration error:", err);
    res.status(500).json({ error: "College registration failed: " + err.message });
  }
});

// 2c. College Verification Status Endpoint (for placement officers checking verification)
app.get(["/api/college/status", "/api/college/verification-status"], requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    if (user.role !== "placement_officer" && user.role !== "admin") {
      res.status(403).json({ error: "Access restricted to college placement officers and administrators." });
      return;
    }

    let college: CollegeDocument | null = null;
    if (user.collegeId) {
      college = await db.colleges.findById(user.collegeId);
    }
    if (!college) {
      college = await db.colleges.findByOfficerUserId(user.id);
    }

    const isAdmin = user.role === "admin";
    const safeCollege = college ? sanitizeCollege(college, isAdmin) : null;

    res.json({
      success: true,
      role: user.role,
      verificationStatus: user.verificationStatus || "pending",
      college: safeCollege,
    });
  } catch (err: any) {
    console.error("College status error:", err);
    res.status(500).json({ error: "Failed to check college status: " + err.message });
  }
});

// ----------------------------------------------------
// ADMINISTRATIVE COLLEGE VERIFICATION ENDPOINTS
// ----------------------------------------------------

// 1. List Colleges with status filter and search query
app.get("/api/admin/colleges", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;
    const query: any = {};

    if (status && typeof status === "string" && status !== "all") {
      const allowedStatuses = ["pending", "verified", "rejected", "suspended"];
      if (allowedStatuses.includes(status)) {
        query.status = status;
      }
    }

    if (search && typeof search === "string" && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      query.$or = [
        { name: regex },
        { code: regex },
        { officerEmail: regex },
        { officerName: regex },
        { city: regex },
        { state: regex },
      ];
    }

    const colleges = await db.colleges.find(query);
    const sanitized = colleges.map((c) => sanitizeCollege(c, true));

    // Calculate status counts for admin summary tabs
    const allColleges = await db.colleges.all();
    const counts = {
      all: allColleges.length,
      pending: allColleges.filter((c) => c.status === "pending").length,
      verified: allColleges.filter((c) => c.status === "verified").length,
      rejected: allColleges.filter((c) => c.status === "rejected").length,
      suspended: allColleges.filter((c) => c.status === "suspended").length,
    };

    res.json({
      success: true,
      colleges: sanitized,
      counts,
    });
  } catch (err: any) {
    console.error("Admin list colleges error:", err);
    res.status(500).json({ error: "Failed to list colleges: " + err.message });
  }
});

// 2. Get Single College Details
app.get("/api/admin/colleges/:id", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const college = await db.colleges.findById(id);

    if (!college) {
      res.status(404).json({ error: "College record not found." });
      return;
    }

    // Also fetch associated officer details
    const officer = await db.users.findById(college.officerUserId);

    res.json({
      success: true,
      college: sanitizeCollege(college, true),
      officer: officer ? sanitizeUser(officer) : null,
    });
  } catch (err: any) {
    console.error("Admin get college error:", err);
    res.status(500).json({ error: "Failed to retrieve college: " + err.message });
  }
});

// 3. Verify College
app.patch("/api/admin/colleges/:id/verify", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const adminUser = (req as any).user as UserDocument;
    const { id } = req.params;
    const { verificationMethod, reviewNotes } = req.body || {};

    if (!verificationMethod || typeof verificationMethod !== "string" || !verificationMethod.trim()) {
      res.status(400).json({
        error: "Verification method is required (e.g. 'Institutional Email Domain Confirmed', 'Registrar Direct Phone Verification', 'MOU Documentation').",
      });
      return;
    }

    const college = await db.colleges.findById(id);
    if (!college) {
      res.status(404).json({ error: "College not found." });
      return;
    }

    if (college.status === "verified") {
      res.status(400).json({ error: "College is already verified." });
      return;
    }

    const now = new Date().toISOString();
    const updated = await db.colleges.update(id, {
      status: "verified",
      verificationMethod: verificationMethod.trim(),
      verifiedAt: now,
      verifiedBy: adminUser.id,
      reviewedAt: now,
      reviewedBy: adminUser.id,
      reviewedByName: adminUser.fullName,
      reviewNotes: typeof reviewNotes === "string" ? reviewNotes.trim() : college.reviewNotes,
      rejectionReason: undefined,
      suspensionReason: undefined,
    });

    // Update associated placement officer account
    if (college.officerUserId) {
      await db.users.update(college.officerUserId, {
        verificationStatus: "verified",
      });
    }

    console.log(`[Admin Audit] College '${college.name}' (${college.id}) VERIFIED by admin ${adminUser.email} using method: '${verificationMethod}'.`);

    res.json({
      success: true,
      message: `College '${college.name}' has been successfully verified.`,
      college: sanitizeCollege(updated, true),
    });
  } catch (err: any) {
    console.error("Admin verify college error:", err);
    res.status(500).json({ error: "Failed to verify college: " + err.message });
  }
});

// 4. Reject College
app.patch("/api/admin/colleges/:id/reject", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const adminUser = (req as any).user as UserDocument;
    const { id } = req.params;
    const { rejectionReason, reviewNotes } = req.body || {};

    if (!rejectionReason || typeof rejectionReason !== "string" || !rejectionReason.trim()) {
      res.status(400).json({
        error: "A clear rejection reason is mandatory to explain why the college request was not approved.",
      });
      return;
    }

    const college = await db.colleges.findById(id);
    if (!college) {
      res.status(404).json({ error: "College not found." });
      return;
    }

    const now = new Date().toISOString();
    const updated = await db.colleges.update(id, {
      status: "rejected",
      rejectionReason: rejectionReason.trim(),
      reviewedAt: now,
      reviewedBy: adminUser.id,
      reviewedByName: adminUser.fullName,
      reviewNotes: typeof reviewNotes === "string" ? reviewNotes.trim() : college.reviewNotes,
    });

    // Update associated placement officer account
    if (college.officerUserId) {
      await db.users.update(college.officerUserId, {
        verificationStatus: "rejected",
      });
    }

    console.log(`[Admin Audit] College '${college.name}' (${college.id}) REJECTED by admin ${adminUser.email}. Reason: '${rejectionReason}'.`);

    res.json({
      success: true,
      message: `College registration for '${college.name}' has been rejected.`,
      college: sanitizeCollege(updated, true),
    });
  } catch (err: any) {
    console.error("Admin reject college error:", err);
    res.status(500).json({ error: "Failed to reject college: " + err.message });
  }
});

// 5. Suspend College
app.patch("/api/admin/colleges/:id/suspend", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const adminUser = (req as any).user as UserDocument;
    const { id } = req.params;
    const { suspensionReason, reviewNotes } = req.body || {};

    if (!suspensionReason || typeof suspensionReason !== "string" || !suspensionReason.trim()) {
      res.status(400).json({
        error: "A justification for suspension is mandatory.",
      });
      return;
    }

    const college = await db.colleges.findById(id);
    if (!college) {
      res.status(404).json({ error: "College not found." });
      return;
    }

    const now = new Date().toISOString();
    const updated = await db.colleges.update(id, {
      status: "suspended",
      suspensionReason: suspensionReason.trim(),
      reviewedAt: now,
      reviewedBy: adminUser.id,
      reviewedByName: adminUser.fullName,
      reviewNotes: typeof reviewNotes === "string" ? reviewNotes.trim() : college.reviewNotes,
    });

    // Update associated placement officer account
    if (college.officerUserId) {
      await db.users.update(college.officerUserId, {
        verificationStatus: "suspended",
      });
    }

    console.log(`[Admin Audit] College '${college.name}' (${college.id}) SUSPENDED by admin ${adminUser.email}. Reason: '${suspensionReason}'.`);

    res.json({
      success: true,
      message: `Portal access for '${college.name}' has been suspended.`,
      college: sanitizeCollege(updated, true),
    });
  } catch (err: any) {
    console.error("Admin suspend college error:", err);
    res.status(500).json({ error: "Failed to suspend college: " + err.message });
  }
});

// ====================================================
// PHASE 4 — SECURE STUDENT-COLLEGE LINKING SYSTEM
// ====================================================

// 4a. Officer: Generate New College Invitation Code
app.post("/api/college/invitations", requireAuth, requireVerifiedCollege, async (req: Request, res: Response) => {
  try {
    const officer = (req as any).user as UserDocument;
    const college = (req as any).college as CollegeDocument;
    const { label, maxUses, validityDays } = req.body || {};

    const cleanLabel = typeof label === "string" ? label.trim().slice(0, 80) : "";
    const parsedMaxUses = Number.isInteger(maxUses) && maxUses > 0 ? Math.min(maxUses, 2000) : 100;
    const days = Number.isInteger(validityDays) && validityDays > 0 ? Math.min(validityDays, 365) : 30;

    // Generate unique code with high entropy: 8 alphanumeric characters
    let code = "";
    let attempts = 0;
    while (!code && attempts < 10) {
      attempts++;
      const candidate = crypto.randomBytes(4).toString("hex").toUpperCase();
      const existing = await db.invitations.findByCode(candidate);
      if (!existing) {
        code = candidate;
      }
    }

    if (!code) {
      res.status(500).json({ error: "Failed to generate unique invitation code. Please try again." });
      return;
    }

    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const newInvitation: CollegeInvitationDocument = {
      id: `inv-${crypto.randomBytes(8).toString("hex")}`,
      collegeId: college.id,
      createdBy: officer.id,
      code,
      label: cleanLabel,
      maxUses: parsedMaxUses,
      usedCount: 0,
      expiresAt,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await db.invitations.create(newInvitation);

    console.log(`[Phase 4] College invitation generated: Code ${code} for college '${college.name}' (${college.id}) by officer ${officer.email}`);

    res.status(201).json({
      success: true,
      message: "Invitation code generated successfully.",
      invitation: created,
    });
  } catch (err: any) {
    console.error("Create invitation error:", err);
    res.status(500).json({ error: "Failed to create invitation: " + err.message });
  }
});

// 4b. Officer: List College Invitations
app.get("/api/college/invitations", requireAuth, requireVerifiedCollege, async (req: Request, res: Response) => {
  try {
    const college = (req as any).college as CollegeDocument;
    const invitations = await db.invitations.findByCollege(college.id);

    // Auto-update expired invitations
    const now = new Date();
    for (const inv of invitations) {
      if (inv.status === "active" && new Date(inv.expiresAt) < now) {
        inv.status = "expired";
        await db.invitations.update(inv.id, { status: "expired" });
      }
    }

    res.json({
      success: true,
      invitations,
    });
  } catch (err: any) {
    console.error("List invitations error:", err);
    res.status(500).json({ error: "Failed to list invitations: " + err.message });
  }
});

// 4c. Officer: Revoke College Invitation Code
app.delete("/api/college/invitations/:id", requireAuth, requireVerifiedCollege, async (req: Request, res: Response) => {
  try {
    const college = (req as any).college as CollegeDocument;
    const { id } = req.params;

    const invitation = await db.invitations.findById(id);
    if (!invitation || invitation.collegeId !== college.id) {
      res.status(404).json({ error: "Invitation code not found for this college." });
      return;
    }

    const updated = await db.invitations.revoke(id);

    res.json({
      success: true,
      message: `Invitation code '${invitation.code}' has been revoked.`,
      invitation: updated,
    });
  } catch (err: any) {
    console.error("Revoke invitation error:", err);
    res.status(500).json({ error: "Failed to revoke invitation: " + err.message });
  }
});

// 4d. Public / Student: Validate Invitation Code (Rate-limited, Public-safe)
app.get("/api/invitations/validate/:code", async (req: Request, res: Response) => {
  try {
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "client";

    if (!checkRateLimit(validateInvitationRateLimit, clientIp, 25, 10 * 60 * 1000)) {
      res.status(429).json({ error: "Too many code validation attempts. Please try again after 10 minutes." });
      return;
    }

    const rawCode = req.params.code?.trim().toUpperCase();
    if (!rawCode) {
      res.status(400).json({ error: "Invitation code is required.", valid: false });
      return;
    }

    const invitation = await db.invitations.findByCode(rawCode);
    if (!invitation) {
      res.status(404).json({ error: "Invalid invitation code. Please verify with your college placement cell.", valid: false });
      return;
    }

    if (invitation.status === "revoked") {
      res.status(400).json({ error: "This invitation code has been revoked by the placement cell.", valid: false });
      return;
    }

    if (new Date(invitation.expiresAt) < new Date() || invitation.status === "expired") {
      res.status(400).json({ error: "This invitation code has expired. Please request a new code from your placement cell.", valid: false });
      return;
    }

    if (invitation.usedCount >= invitation.maxUses) {
      res.status(400).json({ error: "This invitation code has reached its maximum enrollment capacity.", valid: false });
      return;
    }

    // Verify issuing college
    const college = await db.colleges.findById(invitation.collegeId);
    if (!college) {
      res.status(404).json({ error: "Issuing college record not found.", valid: false });
      return;
    }

    if (college.status !== "verified") {
      res.status(403).json({
        error: "The college that issued this code is not yet verified by platform administration.",
        valid: false,
      });
      return;
    }

    // Return public safe details without internal notes or officer personal contact
    res.json({
      success: true,
      valid: true,
      invitation: {
        id: invitation.id,
        code: invitation.code,
        label: invitation.label || "College Student Cohort",
        expiresAt: invitation.expiresAt,
      },
      college: {
        id: college.id,
        name: college.name,
        code: college.code,
        city: college.city,
        state: college.state,
        country: college.country || "India",
        domain: college.domain,
        website: college.website,
        officerDesignation: college.officerDesignation,
      },
    });
  } catch (err: any) {
    console.error("Validate invitation error:", err);
    res.status(500).json({ error: "Failed to validate invitation: " + err.message });
  }
});

// 4e. Student: Link Account with College via Invitation Code + Granular Consent
app.post("/api/student/link-college", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    if (user.role && user.role !== "student") {
      res.status(403).json({ error: "Only student accounts can link to a college placement cell." });
      return;
    }

    const { code, consent } = req.body || {};
    const rawCode = typeof code === "string" ? code.trim().toUpperCase() : "";

    if (!rawCode) {
      res.status(400).json({ error: "Invitation code is required." });
      return;
    }

    // 1. Verify invitation
    const invitation = await db.invitations.findByCode(rawCode);
    if (!invitation) {
      res.status(404).json({ error: "Invalid invitation code." });
      return;
    }

    if (invitation.status === "revoked") {
      res.status(400).json({ error: "This invitation code has been revoked." });
      return;
    }

    if (new Date(invitation.expiresAt) < new Date() || invitation.status === "expired") {
      res.status(400).json({ error: "This invitation code has expired." });
      return;
    }

    if (invitation.usedCount >= invitation.maxUses) {
      res.status(400).json({ error: "This invitation code has reached maximum usage capacity." });
      return;
    }

    // 2. Verify College status
    const college = await db.colleges.findById(invitation.collegeId);
    if (!college || college.status !== "verified") {
      res.status(403).json({ error: "College is not verified." });
      return;
    }

    // 3. Check for existing active or pending membership
    const existingActive = await db.memberships.findActiveOrPendingByStudent(user.id);
    if (existingActive) {
      if (existingActive.collegeId === college.id) {
        res.status(409).json({
          error: "You already have an active or pending affiliation with this college.",
          membership: existingActive,
        });
        return;
      }
      res.status(409).json({
        error: "You are currently affiliated with another college. Please disconnect from your current college first before connecting to a new one.",
        membership: existingActive,
      });
      return;
    }

    // 4. Parse granular consent preferences (defaults to true if omitted, but explicitly stored)
    const granularConsent: GranularConsent = {
      shareAcademic: typeof consent?.shareAcademic === "boolean" ? consent.shareAcademic : true,
      shareSkillRoadmap: typeof consent?.shareSkillRoadmap === "boolean" ? consent.shareSkillRoadmap : true,
      shareInterviewScores: typeof consent?.shareInterviewScores === "boolean" ? consent.shareInterviewScores : true,
      consentGivenAt: new Date().toISOString(),
      consentVersion: "1.0",
    };

    // 5. Increment invitation usage atomically
    await db.invitations.incrementUsed(invitation.id);

    // 6. Create College Membership with status: "pending"
    const newMembership: CollegeMembershipDocument = {
      id: `mem-${crypto.randomBytes(8).toString("hex")}`,
      studentId: user.id,
      collegeId: college.id,
      invitationId: invitation.id,
      invitationCode: invitation.code,
      status: "pending",
      requestedAt: new Date().toISOString(),
      consent: granularConsent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const createdMembership = await db.memberships.create(newMembership);

    // Update user's college name reference
    await db.users.update(user.id, {
      college: college.name,
      collegeId: college.id,
    });

    console.log(`[Phase 4] Student ${user.email} (${user.id}) linked to college '${college.name}' (${college.id}) via code ${invitation.code}`);

    res.status(201).json({
      success: true,
      message: `Affiliation request submitted to ${college.name}. Awaiting review by the college placement cell.`,
      membership: createdMembership,
      college: sanitizeCollege(college, false),
    });
  } catch (err: any) {
    console.error("Link college error:", err);
    res.status(500).json({ error: "Failed to link with college: " + err.message });
  }
});

// 4f. Student: Get Current College Membership & Consent
app.get("/api/student/college-membership", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const membership = await db.memberships.findActiveOrPendingByStudent(user.id);

    if (!membership) {
      res.json({
        success: true,
        membership: null,
      });
      return;
    }

    const college = await db.colleges.findById(membership.collegeId);
    const safeCollege = college ? sanitizeCollege(college, false) : null;

    res.json({
      success: true,
      membership: {
        ...membership,
        college: safeCollege,
      },
    });
  } catch (err: any) {
    console.error("Get student college membership error:", err);
    res.status(500).json({ error: "Failed to retrieve college membership: " + err.message });
  }
});

// 4g. Student: Update Granular Consent Preferences
app.patch("/api/student/college-consent", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const membership = await db.memberships.findActiveOrPendingByStudent(user.id);

    if (!membership) {
      res.status(404).json({ error: "No active or pending college affiliation found." });
      return;
    }

    const { shareAcademic, shareSkillRoadmap, shareInterviewScores } = req.body || {};

    const currentConsent = membership.consent || {
      shareAcademic: true,
      shareSkillRoadmap: true,
      shareInterviewScores: true,
      consentGivenAt: membership.requestedAt,
      consentVersion: "1.0",
    };

    const newConsent: GranularConsent = {
      shareAcademic: typeof shareAcademic === "boolean" ? shareAcademic : currentConsent.shareAcademic,
      shareSkillRoadmap: typeof shareSkillRoadmap === "boolean" ? shareSkillRoadmap : currentConsent.shareSkillRoadmap,
      shareInterviewScores: typeof shareInterviewScores === "boolean" ? shareInterviewScores : currentConsent.shareInterviewScores,
      consentGivenAt: new Date().toISOString(),
      consentVersion: "1.0",
    };

    const updated = await db.memberships.updateConsent(membership.id, newConsent);

    console.log(`[Phase 4 Audit] Student ${user.email} updated data sharing consent for college ${membership.collegeId}:`, newConsent);

    res.json({
      success: true,
      message: "Data-sharing consent preferences updated successfully.",
      consent: newConsent,
      membership: updated,
    });
  } catch (err: any) {
    console.error("Update consent error:", err);
    res.status(500).json({ error: "Failed to update consent preferences: " + err.message });
  }
});

// 4h. Student: Disconnect from College Placement Cell
app.delete("/api/student/college-membership", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const membership = await db.memberships.findActiveOrPendingByStudent(user.id);

    if (!membership) {
      res.status(404).json({ error: "No active or pending college affiliation found." });
      return;
    }

    await db.memberships.update(membership.id, {
      status: "revoked",
      rejectionReason: "Student voluntarily dissociated account.",
    });

    await db.users.update(user.id, {
      college: "Independent Learner",
      collegeId: undefined,
    });

    console.log(`[Phase 4 Audit] Student ${user.email} voluntarily dissociated from college ${membership.collegeId}. Data access revoked.`);

    res.json({
      success: true,
      message: "Successfully disconnected from college placement cell. Your data is no longer accessible by the college.",
    });
  } catch (err: any) {
    console.error("Disconnect college error:", err);
    res.status(500).json({ error: "Failed to disconnect from college: " + err.message });
  }
});

// 4i. Officer: Get Linked Students Cohort (With Strict Granular Consent Filtering)
app.get("/api/college/memberships", requireAuth, requireVerifiedCollege, async (req: Request, res: Response) => {
  try {
    const college = (req as any).college as CollegeDocument;
    const { status, search } = req.query;

    const allMemberships = await db.memberships.findByCollege(college.id);
    const counts = {
      all: allMemberships.length,
      pending: allMemberships.filter((m) => m.status === "pending").length,
      active: allMemberships.filter((m) => m.status === "active").length,
      rejected: allMemberships.filter((m) => m.status === "rejected").length,
    };

    let filtered = allMemberships;
    if (status && typeof status === "string" && status !== "all") {
      filtered = filtered.filter((m) => m.status === status);
    }

    // Resolve student records and apply privacy filters
    const sanitizedStudents = [];
    for (const mem of filtered) {
      const student = await db.users.findById(mem.studentId);
      if (!student) continue;

      let score = null;
      let roadmap = null;
      let interview = null;

      if (mem.consent?.shareInterviewScores) {
        score = await db.readinessScores.findByUser(student.id);
        const interviews = await db.interviews.findByUser(student.id);
        interview = interviews.length > 0 ? interviews[0] : null;
      }

      if (mem.consent?.shareSkillRoadmap) {
        const roadmaps = await db.roadmaps.findByUser(student.id);
        roadmap = roadmaps.length > 0 ? roadmaps[0] : null;
      }

      const sanitized = sanitizeStudentForCollege(student, mem, score, roadmap, interview);
      if (!sanitized) continue;

      // Filter by search query if provided
      if (search && typeof search === "string" && search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = sanitized.fullName.toLowerCase().includes(q);
        const matchesEmail = sanitized.email.toLowerCase().includes(q);
        const matchesRoll = sanitized.rollNumber ? sanitized.rollNumber.toLowerCase().includes(q) : false;
        const matchesBranch = sanitized.branch ? sanitized.branch.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesEmail && !matchesRoll && !matchesBranch) {
          continue;
        }
      }

      sanitizedStudents.push(sanitized);
    }

    res.json({
      success: true,
      students: sanitizedStudents,
      counts,
    });
  } catch (err: any) {
    console.error("List college memberships error:", err);
    res.status(500).json({ error: "Failed to list student roster: " + err.message });
  }
});

// 4j. Officer: Approve Student Affiliation Request
app.patch("/api/college/memberships/:id/approve", requireAuth, requireVerifiedCollege, async (req: Request, res: Response) => {
  try {
    const officer = (req as any).user as UserDocument;
    const college = (req as any).college as CollegeDocument;
    const { id } = req.params;

    const membership = await db.memberships.findById(id);
    if (!membership || membership.collegeId !== college.id) {
      res.status(404).json({ error: "Student membership request not found." });
      return;
    }

    const updated = await db.memberships.update(id, {
      status: "active",
      reviewedAt: new Date().toISOString(),
      reviewedBy: officer.id,
      rejectionReason: undefined,
    });

    console.log(`[Phase 4 Audit] Officer ${officer.email} APPROVED student membership ${id} for college ${college.name}`);

    res.json({
      success: true,
      message: "Student affiliation request approved successfully.",
      membership: updated,
    });
  } catch (err: any) {
    console.error("Approve membership error:", err);
    res.status(500).json({ error: "Failed to approve membership: " + err.message });
  }
});

// 4k. Officer: Reject Student Affiliation Request
app.patch("/api/college/memberships/:id/reject", requireAuth, requireVerifiedCollege, async (req: Request, res: Response) => {
  try {
    const officer = (req as any).user as UserDocument;
    const college = (req as any).college as CollegeDocument;
    const { id } = req.params;
    const { reason } = req.body || {};

    const membership = await db.memberships.findById(id);
    if (!membership || membership.collegeId !== college.id) {
      res.status(404).json({ error: "Student membership request not found." });
      return;
    }

    const updated = await db.memberships.update(id, {
      status: "rejected",
      rejectionReason: typeof reason === "string" && reason.trim() ? reason.trim() : "Declined by placement cell",
      reviewedAt: new Date().toISOString(),
      reviewedBy: officer.id,
    });

    console.log(`[Phase 4 Audit] Officer ${officer.email} REJECTED student membership ${id} for college ${college.name}. Reason: ${reason}`);

    res.json({
      success: true,
      message: "Student affiliation request rejected.",
      membership: updated,
    });
  } catch (err: any) {
    console.error("Reject membership error:", err);
    res.status(500).json({ error: "Failed to reject membership: " + err.message });
  }
});

// 4l. Officer: Remove Student from College Cohort
app.delete("/api/college/memberships/:id", requireAuth, requireVerifiedCollege, async (req: Request, res: Response) => {
  try {
    const officer = (req as any).user as UserDocument;
    const college = (req as any).college as CollegeDocument;
    const { id } = req.params;

    const membership = await db.memberships.findById(id);
    if (!membership || membership.collegeId !== college.id) {
      res.status(404).json({ error: "Student membership record not found." });
      return;
    }

    await db.memberships.update(id, {
      status: "removed",
      rejectionReason: "Removed from cohort by placement cell officer.",
    });

    console.log(`[Phase 4 Audit] Officer ${officer.email} REMOVED student membership ${id} from college ${college.name}`);

    res.json({
      success: true,
      message: "Student removed from college cohort.",
    });
  } catch (err: any) {
    console.error("Remove student membership error:", err);
    res.status(500).json({ error: "Failed to remove student from cohort: " + err.message });
  }
});

// ====================================================
// PHASE 5 — COLLEGE PLACEMENT ANALYTICS & REPORTS
// ====================================================

// Helper for formula injection protection in CSV exports
function sanitizeCsvCell(val: any): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  const dangerousChars = ["=", "+", "-", "@", "\t", "\r"];
  if (dangerousChars.some((char) => str.startsWith(char))) {
    return `'${str}`;
  }
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// 5a. Officer: Get College Analytics & Summary Dashboard
app.get("/api/college/analytics", requireAuth, requireVerifiedCollege, async (req: Request, res: Response) => {
  try {
    const college = (req as any).college as CollegeDocument;
    const allMemberships = await db.memberships.findByCollege(college.id);

    const totalLinkedStudents = allMemberships.length;
    const activeMemberships = allMemberships.filter((m) => m.status === "active");
    const activeLinkedStudents = activeMemberships.length;

    let studentsWithConsent = 0;
    let studentsWithReadinessData = 0;
    let totalReadinessScore = 0;
    let totalRoadmapProgress = 0;
    let roadmapCount = 0;

    const skillGapCounts = new Map<string, number>();

    for (const mem of activeMemberships) {
      if (mem.consent) studentsWithConsent++;

      const student = await db.users.findById(mem.studentId);
      if (!student) continue;

      let studentReadiness = null;
      let studentRoadmap = null;

      if (mem.consent?.shareInterviewScores) {
        const scoreDoc = await db.readinessScores.findByUser(student.id);
        if (scoreDoc && typeof scoreDoc.overallScore === "number") {
          studentReadiness = scoreDoc.overallScore;
        }
      }

      if (mem.consent?.shareSkillRoadmap) {
        const roadmaps = await db.roadmaps.findByUser(student.id);
        if (roadmaps.length > 0) {
          studentRoadmap = roadmaps[0];
        }
      }

      if (studentReadiness !== null || studentRoadmap !== null) {
        studentsWithReadinessData++;
      }

      if (studentReadiness !== null) {
        totalReadinessScore += studentReadiness;
      }

      if (studentRoadmap) {
        totalRoadmapProgress += (studentRoadmap.overallProgress ?? 0);
        roadmapCount++;

        const gaps = studentRoadmap.skillGap?.missing || [];
        for (const skill of gaps) {
          const cleanSkill = skill.trim();
          if (cleanSkill) {
            skillGapCounts.set(cleanSkill, (skillGapCounts.get(cleanSkill) || 0) + 1);
          }
        }
      }
    }

    const avgReadiness = studentsWithReadinessData > 0 ? Math.round(totalReadinessScore / studentsWithReadinessData) : null;
    const avgRoadmap = roadmapCount > 0 ? Math.round(totalRoadmapProgress / roadmapCount) : null;

    // Minimum group size threshold for anonymized suppression (configurable, e.g. 3)
    const MIN_GROUP_SIZE = 3;
    const isAnonymized = activeLinkedStudents < MIN_GROUP_SIZE;

    // Top missing skills sorted descending
    const sortedSkills = Array.from(skillGapCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, missingCount]) => ({
        skill,
        missingCount,
        percentageOfCohort: activeLinkedStudents > 0 ? Math.round((missingCount / activeLinkedStudents) * 100) : 0,
      }));

    // Readiness Bands
    let band90_100 = 0;
    let band75_89 = 0;
    let band60_74 = 0;
    let bandUnder60 = 0;

    for (const mem of activeMemberships) {
      if (!mem.consent?.shareInterviewScores) continue;
      const student = await db.users.findById(mem.studentId);
      if (!student) continue;
      const scoreDoc = await db.readinessScores.findByUser(student.id);
      if (!scoreDoc || typeof scoreDoc.overallScore !== "number") continue;

      const sc = scoreDoc.overallScore;
      if (sc >= 90) band90_100++;
      else if (sc >= 75) band75_89++;
      else if (sc >= 60) band60_74++;
      else bandUnder60++;
    }

    const readinessBands = [
      { bandName: "90% - 100% (Elite Readiness)", minScore: 90, maxScore: 100, studentCount: band90_100, percentage: activeLinkedStudents > 0 ? Math.round((band90_100 / activeLinkedStudents) * 100) : 0 },
      { bandName: "75% - 89% (Placement Ready)", minScore: 75, maxScore: 89, studentCount: band75_89, percentage: activeLinkedStudents > 0 ? Math.round((band75_89 / activeLinkedStudents) * 100) : 0 },
      { bandName: "60% - 74% (Developing)", minScore: 60, maxScore: 74, studentCount: band60_74, percentage: activeLinkedStudents > 0 ? Math.round((band60_74 / activeLinkedStudents) * 100) : 0 },
      { bandName: "Under 60% (Needs Improvement)", minScore: 0, maxScore: 59, studentCount: bandUnder60, percentage: activeLinkedStudents > 0 ? Math.round((bandUnder60 / activeLinkedStudents) * 100) : 0 },
    ];

    res.json({
      success: true,
      analytics: {
        collegeId: college.id,
        collegeName: college.name,
        totalLinkedStudents,
        activeLinkedStudents,
        studentsWithConsent,
        studentsWithReadinessData,
        averageReadinessScore: avgReadiness,
        averageRoadmapProgress: avgRoadmap,
        topMissingSkills: sortedSkills,
        readinessBands,
        minimumGroupSizeThreshold: MIN_GROUP_SIZE,
        anonymized: isAnonymized,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("College analytics error:", err);
    res.status(500).json({ error: "Failed to load college analytics: " + err.message });
  }
});

// 5b. Officer: Get Individual Student Permitted Progress Detail
app.get("/api/college/students/:studentId/progress", requireAuth, requireVerifiedCollege, async (req: Request, res: Response) => {
  try {
    const college = (req as any).college as CollegeDocument;
    const { studentId } = req.params;

    const membership = await db.memberships.findByStudentAndCollege(studentId, college.id);
    if (!membership || membership.status !== "active") {
      res.status(403).json({ error: "Access denied. Student is not an active linked member of your college." });
      return;
    }

    const student = await db.users.findById(studentId);
    if (!student) {
      res.status(404).json({ error: "Student record not found." });
      return;
    }

    let score = null;
    let roadmap = null;
    let interview = null;

    if (membership.consent?.shareInterviewScores) {
      score = await db.readinessScores.findByUser(student.id);
      const interviews = await db.interviews.findByUser(student.id);
      interview = interviews.length > 0 ? interviews[0] : null;
    }

    if (membership.consent?.shareSkillRoadmap) {
      const roadmaps = await db.roadmaps.findByUser(student.id);
      roadmap = roadmaps.length > 0 ? roadmaps[0] : null;
    }

    const sanitized = sanitizeStudentForCollege(student, membership, score, roadmap, interview);

    // Also include roadmap phases if roadmap is consented
    let roadmapDetails = null;
    if (membership.consent?.shareSkillRoadmap && roadmap) {
      roadmapDetails = {
        jobTitle: roadmap.jobTitle,
        companyName: roadmap.companyName,
        overallProgress: roadmap.overallProgress,
        completedTasks: roadmap.completedTasks,
        totalTasks: roadmap.totalTasks,
        phases: roadmap.phases,
        skillGap: roadmap.skillGap,
      };
    }

    res.json({
      success: true,
      student: sanitized,
      roadmap: roadmapDetails,
    });
  } catch (err: any) {
    console.error("Student progress detail error:", err);
    res.status(500).json({ error: "Failed to retrieve student progress detail: " + err.message });
  }
});

// 5c. Officer: Export CSV Report of Active Student Cohort
app.get("/api/college/reports/csv", requireAuth, requireVerifiedCollege, async (req: Request, res: Response) => {
  try {
    const college = (req as any).college as CollegeDocument;
    const allMemberships = await db.memberships.findByCollege(college.id);
    const activeMemberships = allMemberships.filter((m) => m.status === "active");

    const rows = [
      [
        "Student ID",
        "Full Name",
        "Email",
        "Roll Number",
        "Course",
        "Branch",
        "Semester",
        "CGPA",
        "Backlogs",
        "Graduation Year",
        "Selected Target Role",
        "Overall Readiness Score (%)",
        "Roadmap Progress (%)",
        "Completed Tasks / Total Tasks",
        "Missing Skills",
        "Consent Share Academic",
        "Consent Share Roadmap",
        "Consent Share Interview Scores",
      ],
    ];

    for (const mem of activeMemberships) {
      const student = await db.users.findById(mem.studentId);
      if (!student) continue;

      let score = null;
      let roadmap = null;

      if (mem.consent?.shareInterviewScores) {
        score = await db.readinessScores.findByUser(student.id);
      }
      if (mem.consent?.shareSkillRoadmap) {
        const roadmaps = await db.roadmaps.findByUser(student.id);
        roadmap = roadmaps.length > 0 ? roadmaps[0] : null;
      }

      const c = mem.consent || { shareAcademic: false, shareSkillRoadmap: false, shareInterviewScores: false };

      const name = c.shareAcademic ? student.fullName : "Restricted";
      const email = c.shareAcademic ? student.email : "Restricted";
      const roll = c.shareAcademic ? (student.rollNumber || "") : "Restricted";
      const course = c.shareAcademic ? (student.course || "") : "Restricted";
      const branch = c.shareAcademic ? (student.branch || "") : "Restricted";
      const sem = c.shareAcademic ? (student.semester ?? "") : "Restricted";
      const cgpa = c.shareAcademic ? (student.cgpa ?? "") : "Restricted";
      const backlogs = c.shareAcademic ? (student.backlogs ?? 0) : "Restricted";
      const gradYear = c.shareAcademic ? (student.graduationYear || "") : "Restricted";

      const targetRole = c.shareSkillRoadmap ? (student.selectedRole || roadmap?.jobTitle || "") : "Restricted";
      const readiness = c.shareInterviewScores && score ? (score.overallScore ?? "") : "Restricted";
      const roadmapProg = c.shareSkillRoadmap && roadmap ? (roadmap.overallProgress ?? 0) : "Restricted";
      const tasksStr = c.shareSkillRoadmap && roadmap ? `${roadmap.completedTasks || 0}/${roadmap.totalTasks || 0}` : "Restricted";
      const missingSkillsStr = c.shareSkillRoadmap && roadmap?.skillGap?.missing ? roadmap.skillGap.missing.join("; ") : "Restricted";

      rows.push([
        student.id,
        name,
        email,
        roll,
        course,
        branch,
        sem,
        cgpa,
        backlogs,
        gradYear,
        targetRole,
        readiness,
        roadmapProg,
        tasksStr,
        missingSkillsStr,
        c.shareAcademic ? "Yes" : "No",
        c.shareSkillRoadmap ? "Yes" : "No",
        c.shareInterviewScores ? "Yes" : "No",
      ].map(sanitizeCsvCell));
    }

    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const filename = `PlacementOS_Cohort_Report_${college.name.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;

    console.log(`[Phase 5 Audit] Officer ${(req as any).user.email} exported CSV report for college ${college.name}`);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (err: any) {
    console.error("CSV export error:", err);
    res.status(500).json({ error: "Failed to generate CSV report: " + err.message });
  }
});

// 5d. Officer: Export PDF Report of College Placement Analytics & Cohort Summary
app.get("/api/college/reports/pdf", requireAuth, requireVerifiedCollege, async (req: Request, res: Response) => {
  try {
    const college = (req as any).college as CollegeDocument;
    const allMemberships = await db.memberships.findByCollege(college.id);
    const activeMemberships = allMemberships.filter((m) => m.status === "active");

    // Dynamic import of PDFKit
    const PDFDocument = (await import("pdfkit")).default;
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    const filename = `PlacementOS_Analytics_Report_${college.name.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Header styling
    doc.fillColor("#FF6B00").fontSize(20).font("Helvetica-Bold").text("Placement OS", { align: "left" });
    doc.fillColor("#111827").fontSize(12).font("Helvetica").text("Institutional Career Readiness & Placement Analytics Report", { align: "left" });
    doc.moveDown(0.5);

    doc.strokeColor("#E5E7EB").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Institution Meta Box
    doc.fillColor("#1F2937").fontSize(12).font("Helvetica-Bold").text(`Institution: ${college.name}`);
    doc.fontSize(10).font("Helvetica").text(`Location: ${college.city}, ${college.state} | Code: ${college.code || "N/A"}`);
    doc.text(`Placement Officer: ${college.officerName} (${college.officerDesignation || "Placement Officer"})`);
    doc.text(`Generated On: ${new Date().toLocaleString()}`);
    doc.moveDown(1.5);

    // Summary Metrics Section
    doc.fillColor("#FF6B00").fontSize(14).font("Helvetica-Bold").text("Executive Cohort Summary");
    doc.moveDown(0.5);

    let totalReadiness = 0;
    let countReadiness = 0;
    let totalRoadmap = 0;
    let countRoadmap = 0;

    for (const mem of activeMemberships) {
      const student = await db.users.findById(mem.studentId);
      if (!student) continue;
      if (mem.consent?.shareInterviewScores) {
        const sc = await db.readinessScores.findByUser(student.id);
        if (sc && typeof sc.overallScore === "number") {
          totalReadiness += sc.overallScore;
          countReadiness++;
        }
      }
      if (mem.consent?.shareSkillRoadmap) {
        const roadmaps = await db.roadmaps.findByUser(student.id);
        if (roadmaps.length > 0) {
          totalRoadmap += (roadmaps[0].overallProgress || 0);
          countRoadmap++;
        }
      }
    }

    const avgReadiness = countReadiness > 0 ? Math.round(totalReadiness / countReadiness) : 0;
    const avgRoadmap = countRoadmap > 0 ? Math.round(totalRoadmap / countRoadmap) : 0;

    doc.fillColor("#374151").fontSize(10).font("Helvetica");
    doc.text(`• Total Active Linked Students: ${activeMemberships.length}`);
    doc.text(`• Students with Evaluated Readiness Score: ${countReadiness}`);
    doc.text(`• Average Cohort Readiness Score: ${avgReadiness}%`);
    doc.text(`• Average Roadmap Completion: ${avgRoadmap}%`);
    doc.moveDown(1.5);

    // Privacy & Data Governance Notice
    doc.fillColor("#4B5563").fontSize(9).font("Helvetica-Oblique").text(
      "Data Governance & Privacy Notice: This report was generated dynamically in accordance with student-granted granular consent policies. Raw interview transcripts, AI conversation logs, and resume documents are strictly excluded in compliance with Placement OS privacy standards.",
      { width: 495 }
    );

    doc.end();

    console.log(`[Phase 5 Audit] Officer ${(req as any).user.email} exported PDF report for college ${college.name}`);
  } catch (err: any) {
    console.error("PDF export error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate PDF report: " + err.message });
    }
  }
});

// 3. Unified Login (Students, Placement Officers, Admins)
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "client";

    if (!checkRateLimit(loginRateLimit, clientIp, 15, 10 * 60 * 1000)) {
      res.status(429).json({ error: "Too many login attempts. Please try again after 10 minutes." });
      return;
    }

    const { email, password, portal } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const user = await db.users.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    // Server-side role authorization based strictly on authenticated user record
    if (portal === "admin") {
      if (user.role !== "admin") {
        res.status(403).json({ error: "Access denied. Administrator credentials required." });
        return;
      }
    } else if (portal === "college") {
      if (user.role !== "placement_officer" && user.role !== "admin") {
        res.status(403).json({ error: "Access denied. College Placement Officer credentials required. Students must use Student Login." });
        return;
      }
      if (user.role === "placement_officer") {
        let collegeData: CollegeDocument | null = null;
        if (user.collegeId) {
          collegeData = await db.colleges.findById(user.collegeId);
        }
        if (!collegeData) {
          collegeData = await db.colleges.findByOfficerUserId(user.id);
        }
        if (collegeData) {
          if (user.verificationStatus === "suspended" || collegeData.status === "suspended") {
            res.status(403).json({
              error: "College account is suspended.",
              status: "suspended",
              code: "COLLEGE_SUSPENDED",
              reason: collegeData.suspensionReason || "Account suspended by platform administrator.",
            });
            return;
          }
          if (user.verificationStatus === "rejected" || collegeData.status === "rejected") {
            res.status(403).json({
              error: "College registration request was rejected.",
              status: "rejected",
              code: "COLLEGE_REJECTED",
              reason: collegeData.rejectionReason || "Registration rejected by platform administrator.",
            });
            return;
          }
          if (user.verificationStatus !== "verified" || collegeData.status !== "verified") {
            res.status(403).json({
              error: "College verification pending. Your college account is under review by the platform administrator.",
              status: "pending",
              code: "COLLEGE_VERIFICATION_PENDING",
            });
            return;
          }
        }
      }
    }

    // Create session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await db.sessions.create(sessionToken, user.id, expiresAt);

    // Set secure HTTP-only cookie
    res.cookie("placement_session_token", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    let score = null;
    let suggestedJobs: any[] = [];
    let collegeData: CollegeDocument | null = null;

    if (user.role === "placement_officer") {
      if (user.collegeId) {
        collegeData = await db.colleges.findById(user.collegeId);
      }
      if (!collegeData) {
        collegeData = await db.colleges.findByOfficerUserId(user.id);
      }
    } else {
      score = await db.readinessScores.findByUser(user.id);
      if (!score) {
        const interviews = await db.interviews.findByUser(user.id);
        const roadmaps = await db.roadmaps.findByUser(user.id);
        score = await calculatePlacementReadiness(user, interviews, roadmaps);
        await db.readinessScores.save(score);
      }
      const allJobs = await db.jobs.all();
      suggestedJobs = suggestJobRolesForStudent(user, allJobs, 3);
    }

    const safeUser = sanitizeUser(user);

    res.json({
      success: true,
      message: "Signed in successfully!",
      user: safeUser,
      college: collegeData,
      token: sessionToken,
      readinessScore: score,
      suggestedJobs,
    });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed: " + err.message });
  }
});

// ----------------------------------------------------
// FORGOT PASSWORD (Temporarily Disabled)
// ----------------------------------------------------

app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
  res.status(503).json({ error: "The Forgot Password feature is temporarily disabled." });
});

app.post("/api/auth/verify-reset-otp", async (req: Request, res: Response) => {
  res.status(503).json({ error: "The Forgot Password feature is temporarily disabled." });
});

app.post(["/api/auth/reset-password", "/api/auth/forgot-password/reset-password"], async (req: Request, res: Response) => {
  res.status(503).json({ error: "The Forgot Password feature is temporarily disabled." });
});

// 5. Logout
app.post("/api/auth/logout", async (req: Request, res: Response) => {
  const token =
    req.cookies?.placement_session_token ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "") ||
    (req.headers["x-session-token"] as string);

  if (token) {
    await db.sessions.delete(token);
  }
  res.clearCookie("placement_session_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.json({ success: true, message: "Logged out successfully" });
});

// ----------------------------------------------------
// STUDENT ACCOUNT MANAGEMENT ENDPOINTS
// ----------------------------------------------------

// 1. Change Student Full Name
app.patch("/api/account/name", async (req: Request, res: Response) => {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({ error: "Unauthorized. Please log in." });
      return;
    }

    const { fullName } = req.body || {};
    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      res.status(400).json({ error: "Full Name is required and cannot be empty." });
      return;
    }

    const trimmedName = fullName.trim();
    const updated = await db.users.update(user.id, { fullName: trimmedName });
    if (!updated) {
      res.status(404).json({ error: "Student account not found." });
      return;
    }

    const safeUser = sanitizeUser(updated);
    res.json({
      success: true,
      message: "Full Name updated successfully.",
      user: safeUser,
    });
  } catch (err: any) {
    console.error("Change name error:", err);
    res.status(500).json({ error: "Failed to update name: " + err.message });
  }
});

// 2. Change Student Password
app.patch("/api/account/password", async (req: Request, res: Response) => {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({ error: "Unauthorized. Please log in." });
      return;
    }

    const { currentPassword, newPassword, confirmNewPassword, confirmPassword } = req.body || {};

    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "client";

    const rateLimitKey = `${user.id}:${clientIp}`;
    if (!checkRateLimit(passwordChangeRateLimit, rateLimitKey, 10, 15 * 60 * 1000)) {
      res.status(429).json({
        error: "Too many password update attempts. Please try again after 15 minutes.",
      });
      return;
    }

    const confirmation = confirmNewPassword || confirmPassword;

    if (!currentPassword) {
      res.status(400).json({ error: "Current password is required." });
      return;
    }

    const isCurrentMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentMatch) {
      res.status(400).json({ error: "Current password is incorrect." });
      return;
    }

    if (!newPassword) {
      res.status(400).json({
        error: "Password must contain 8+ characters, uppercase, lowercase, number and special character.",
      });
      return;
    }

    const hasMinLen = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);

    if (!hasMinLen || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      res.status(400).json({
        error: "Password must contain 8+ characters, uppercase, lowercase, number and special character.",
      });
      return;
    }

    if (confirmation !== undefined && newPassword !== confirmation) {
      res.status(400).json({ error: "Passwords do not match." });
      return;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db.users.update(user.id, { passwordHash: newPasswordHash });

    res.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (err: any) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Failed to change password: " + err.message });
  }
});

// 3. Delete Student Account & Purge Associated Student Data
app.delete("/api/account", async (req: Request, res: Response) => {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({ error: "Unauthorized. Please log in." });
      return;
    }

    const clientIp =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "client";

    const rateLimitKey = `${user.id}:${clientIp}`;
    if (!checkRateLimit(deleteAccountRateLimit, rateLimitKey, 10, 15 * 60 * 1000)) {
      res.status(429).json({
        error: "Too many failed attempts. Please try again after 15 minutes.",
      });
      return;
    }

    const { password: inputPassword } = req.body;
    if (!inputPassword) {
      res.status(400).json({ error: "Incorrect password. Account was not deleted." });
      return;
    }

    const isMatch = await bcrypt.compare(inputPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: "Incorrect password. Account was not deleted." });
      return;
    }

    // Securely delete account and all associated student data from MongoDB
    await db.users.deleteUserData(user.id);

    // Destroy active session and clear HTTP-only cookie
    const token =
      req.cookies?.placement_session_token ||
      req.headers.authorization?.replace(/^Bearer\s+/i, "") ||
      (req.headers["x-session-token"] as string);

    if (token) {
      await db.sessions.delete(token);
    }

    res.clearCookie("placement_session_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.json({
      success: true,
      message: "Your account has been deleted successfully.",
    });
  } catch (err: any) {
    console.error("Delete account error:", err);
    res.status(500).json({ error: "Failed to delete account: " + err.message });
  }
});

// 4. Current Authenticated User & Context
app.get("/api/auth/me", async (req: Request, res: Response) => {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const safeUser = sanitizeUser(user);
    let collegeData: CollegeDocument | null = null;
    let score = null;
    let suggestedJobs: any[] = [];

    if (user.role === "placement_officer") {
      if (user.collegeId) {
        collegeData = await db.colleges.findById(user.collegeId);
      }
      if (!collegeData) {
        collegeData = await db.colleges.findByOfficerUserId(user.id);
      }
    } else {
      score = await db.readinessScores.findByUser(user.id);
      const allJobs = await db.jobs.all();
      suggestedJobs = suggestJobRolesForStudent(user, allJobs, 3);
    }

    const token =
      req.cookies?.placement_session_token ||
      req.headers.authorization?.replace(/^Bearer\s+/i, "");

    res.json({ user: safeUser, college: collegeData, token, readinessScore: score, suggestedJobs });
  } catch (err: any) {
    console.error("Auth me error:", err);
    res.status(500).json({ error: "Failed to fetch user session: " + err.message });
  }
});

// 5. Update Profile
app.put("/api/auth/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const {
      fullName,
      phone,
      profilePhoto,
      college,
      course,
      branch,
      semester,
      cgpa,
      tenthMarks,
      twelfthMarks,
      graduationYear,
      backlogs,
      skills,
      skillsWithLevels,
      projects,
      experience,
      targetRoles,
      removeResume,
    } = req.body;

    // Validate Full Name
    if (fullName !== undefined) {
      if (typeof fullName !== "string" || !fullName.trim()) {
        res.status(400).json({ error: "Full name cannot be empty." });
        return;
      }
    }

    // Validate College
    if (college !== undefined) {
      if (typeof college !== "string" || !college.trim()) {
        res.status(400).json({ error: "College name cannot be empty." });
        return;
      }
    }

    // Validate Semester against Course limits
    const validCourse = course ?? user.course;
    const maxSem =
      validCourse === "Diploma" || validCourse === "BCA" || validCourse === "MCA"
        ? 6
        : validCourse === "M.Tech"
        ? 4
        : 8;

    let targetSemester = user.semester;
    if (semester !== undefined) {
      const parsedSem = Number(semester);
      if (isNaN(parsedSem) || parsedSem < 1 || parsedSem > maxSem) {
        res.status(400).json({
          error: `Invalid semester (${semester}) for course ${validCourse}. Must be between 1 and ${maxSem}.`,
        });
        return;
      }
      targetSemester = parsedSem;
    }

    // Validate CGPA
    let targetCgpa = user.cgpa;
    if (cgpa !== undefined) {
      const parsedCgpa = Number(cgpa);
      if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
        res.status(400).json({ error: "CGPA must be a valid number between 0.0 and 10.0." });
        return;
      }
      targetCgpa = Number(parsedCgpa.toFixed(2));
    }

    // Validate Backlogs
    let targetBacklogs = user.backlogs;
    if (backlogs !== undefined) {
      const parsedBacklogs = Number(backlogs);
      if (isNaN(parsedBacklogs) || parsedBacklogs < 0 || parsedBacklogs > 50) {
        res.status(400).json({ error: "Backlogs count must be a non-negative number." });
        return;
      }
      targetBacklogs = Math.floor(parsedBacklogs);
    }

    // Parse and validate skills & skillsWithLevels
    let finalSkillsWithLevels: any[] = user.skillsWithLevels || [];
    let finalFlatSkills: string[] = user.skills || [];

    if (skillsWithLevels !== undefined) {
      let parsed = Array.isArray(skillsWithLevels)
        ? skillsWithLevels
        : typeof skillsWithLevels === "string"
        ? JSON.parse(skillsWithLevels)
        : [];

      finalSkillsWithLevels = parsed
        .filter((item: any) => item && (item.name || item.skill)?.trim())
        .map((item: any) => ({
          name: (item.name || item.skill).trim(),
          level:
            item.level === "Beginner" || item.level === "Advanced"
              ? item.level
              : "Intermediate",
        }));

      finalFlatSkills = finalSkillsWithLevels.map((s) => s.name);
    } else if (skills !== undefined) {
      finalFlatSkills = Array.isArray(skills)
        ? skills.map((s: string) => s.trim()).filter(Boolean)
        : typeof skills === "string"
        ? skills.split(",").map((s: string) => s.trim()).filter(Boolean)
        : user.skills;
    }

    // Parse and validate projects
    let finalProjects = user.projects || [];
    if (projects !== undefined) {
      let parsedProjects = Array.isArray(projects)
        ? projects
        : typeof projects === "string"
        ? JSON.parse(projects)
        : [];

      finalProjects = parsedProjects
        .filter((p: any) => p && p.title && p.title.trim().length > 0)
        .map((p: any) => ({
          id: p.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: p.title.trim(),
          description: (p.description || "").trim(),
          techStack: Array.isArray(p.techStack)
            ? p.techStack.filter(Boolean)
            : typeof p.techStack === "string"
            ? p.techStack.split(",").map((t: string) => t.trim()).filter(Boolean)
            : [],
          githubUrl: (p.githubUrl || "").trim(),
          liveUrl: (p.liveUrl || "").trim(),
        }));
    }

    // Parse and validate experience
    let finalExperience = user.experience || { hasExperience: false };
    if (experience !== undefined) {
      let parsedExp = typeof experience === "string" ? JSON.parse(experience) : experience;
      finalExperience = {
        hasExperience: Boolean(parsedExp?.hasExperience),
        company: (parsedExp?.company || "").trim(),
        role: (parsedExp?.role || "").trim(),
        duration: (parsedExp?.duration || "").trim(),
        description: (parsedExp?.description || "").trim(),
      };
    }

    // Handle resume removal
    const resumeUpdates: Record<string, any> = {};
    if (removeResume === true) {
      resumeUpdates.resumeText = "";
      resumeUpdates.resumeFileName = "";
      resumeUpdates.resumeUploadedAt = "";
    }

    const updated = await db.users.update(user.id, {
      fullName: fullName !== undefined ? fullName.trim() : user.fullName,
      phone: phone !== undefined ? phone.trim() : user.phone,
      profilePhoto: profilePhoto !== undefined ? profilePhoto : user.profilePhoto,
      college: college !== undefined ? college.trim() : user.college,
      course: course !== undefined ? course.trim() : user.course,
      branch: branch !== undefined ? branch.trim() : user.branch,
      semester: targetSemester,
      cgpa: targetCgpa,
      tenthMarks: tenthMarks !== undefined ? Number(tenthMarks) : user.tenthMarks,
      twelfthMarks: twelfthMarks !== undefined ? Number(twelfthMarks) : user.twelfthMarks,
      graduationYear: graduationYear !== undefined ? Number(graduationYear) : user.graduationYear,
      backlogs: targetBacklogs,
      skills: finalFlatSkills,
      skillsWithLevels: finalSkillsWithLevels,
      projects: finalProjects,
      experience: finalExperience,
      targetRoles: Array.isArray(targetRoles)
        ? targetRoles
        : targetRoles
        ? targetRoles.split(",").map((r: string) => r.trim())
        : user.targetRoles,
      ...resumeUpdates,
    });

    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Recalculate AI analysis and readiness score upon profile update
    const aiAnalysis = await generateStudentAiProfileAnalysis(updated);
    await db.users.update(updated.id, { aiAnalysis });
    updated.aiAnalysis = aiAnalysis;

    const interviews = await db.interviews.findByUser(updated.id);
    const roadmaps = await db.roadmaps.findByUser(updated.id);
    const newScore = await calculatePlacementReadiness(updated, interviews, roadmaps);
    await db.readinessScores.save(newScore);

    const allJobs = await db.jobs.all();
    const suggestedJobs = suggestJobRolesForStudent(updated, allJobs, 4);

    const safeUser = sanitizeUser(updated);
    res.json({
      success: true,
      message: "Profile updated and AI analyses recalculated successfully!",
      user: safeUser,
      readinessScore: newScore,
      suggestedJobs,
      aiAnalysis,
    });
  } catch (err: any) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile: " + err.message });
  }
});

// 5b. Delete / Clear Student Resume
app.delete("/api/resume", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;

    const updated = await db.users.update(user.id, {
      resumeText: "",
      resumeFileName: "",
      resumeUploadedAt: "",
    });

    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Recalculate AI analysis & readiness score after resume removal
    const aiAnalysis = await generateStudentAiProfileAnalysis(updated);
    await db.users.update(updated.id, { aiAnalysis });
    updated.aiAnalysis = aiAnalysis;

    const interviews = await db.interviews.findByUser(updated.id);
    const roadmaps = await db.roadmaps.findByUser(updated.id);
    const newScore = await calculatePlacementReadiness(updated, interviews, roadmaps);
    await db.readinessScores.save(newScore);

    const safeUser = sanitizeUser(updated);
    res.json({
      success: true,
      message: "Resume removed successfully. Career analysis recalculated.",
      user: safeUser,
      readinessScore: newScore,
      aiAnalysis,
    });
  } catch (err: any) {
    console.error("Delete resume error:", err);
    res.status(500).json({ error: "Failed to remove resume: " + err.message });
  }
});

// ----------------------------------------------------
// RESUME UPLOAD & PARSING
// ----------------------------------------------------

app.post("/api/resume/upload", requireAuth, upload.single("resume"), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const file = req.file;

    let resumeText = "";
    let fileName = "uploaded_resume.pdf";

    if (file) {
      fileName = file.originalname;
      resumeText = await parseResumeDocument(file.buffer, file.originalname, file.mimetype);
      if (!resumeText || resumeText.trim().length < 20) {
        resumeText = `Uploaded document: ${fileName}. Resume verified for campus placement.`;
      }
    } else if (req.body.resumeText) {
      resumeText = req.body.resumeText;
      fileName = req.body.fileName || "manual_resume_profile.txt";
    } else {
      res.status(400).json({ error: "Please upload a resume file (PDF/DOCX) or paste resume text." });
      return;
    }

    const updated = await db.users.update(user.id, {
      resumeText,
      resumeFileName: fileName,
      resumeUploadedAt: new Date().toISOString(),
    });

    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Recalculate AI analysis and readiness score upon resume upload
    const aiAnalysis = await generateStudentAiProfileAnalysis(updated);
    await db.users.update(updated.id, { aiAnalysis });
    updated.aiAnalysis = aiAnalysis;

    const interviews = await db.interviews.findByUser(user.id);
    const roadmaps = await db.roadmaps.findByUser(user.id);
    const newScore = await calculatePlacementReadiness(updated, interviews, roadmaps);
    await db.readinessScores.save(newScore);

    const allJobs = await db.jobs.all();
    const suggestedJobs = suggestJobRolesForStudent(updated, allJobs, 4);

    const safeUser = sanitizeUser(updated);
    res.json({
      success: true,
      message: "Resume uploaded and analyzed successfully!",
      user: safeUser,
      readinessScore: newScore,
      aiAnalysis,
      suggestedJobs,
    });
  } catch (err: any) {
    console.error("Resume upload error:", err);
    res.status(500).json({ error: "Failed to upload resume: " + err.message });
  }
});

// ----------------------------------------------------
// ONBOARDING & COMPREHENSIVE CAREER PROFILE
// ----------------------------------------------------

app.post("/api/onboarding/complete", (req: Request, res: Response, next: NextFunction) => {
  upload.single("resume")(req, res, (err: any) => {
    if (err) {
      console.warn("Multer upload error in /api/onboarding/complete:", err?.message || err);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Resume file size exceeds the 10MB limit." });
      }
      return res.status(400).json({ error: "Resume upload failed: " + (err.message || "Invalid file.") });
    }
    next();
  });
}, async (req: Request, res: Response) => {
  try {
    const user = await getAuthenticatedUser(req);
    const body = req.body || {};

    if (!user) {
      res.status(401).json({ error: "Unauthorized. Please log in to complete onboarding." });
      return;
    }

    // 1. Career Preferences
    const careerGoal = body.careerGoal?.trim() || body.preferredJobRole?.trim() || user.careerPreferences?.careerGoal || "";
    const preferredField = body.preferredField?.trim() || user.careerPreferences?.preferredField || "";
    const preferredJobType = (body.preferredJobType === "Internship" || body.preferredJobType === "Full-time" || body.preferredJobType === "Both")
      ? body.preferredJobType
      : (user.careerPreferences?.preferredJobType || "Both");

    const careerPreferences = {
      careerGoal,
      preferredField,
      preferredJobType,
    };

    // 2. Parse Skills & Skill Levels (must be explicitly selected: Beginner / Intermediate / Advanced)
    let skillsWithLevels: any[] = [];
    if (typeof body.skillsWithLevels === "string") {
      try {
        skillsWithLevels = JSON.parse(body.skillsWithLevels);
      } catch (e) {
        skillsWithLevels = [];
      }
    } else if (Array.isArray(body.skillsWithLevels)) {
      skillsWithLevels = body.skillsWithLevels;
    }

    skillsWithLevels = skillsWithLevels
      .filter((s: any) => Boolean((s.name || s.skill)?.trim()))
      .map((s: any) => ({
        name: (s.name || s.skill).trim(),
        level: (s.level === "Beginner" || s.level === "Advanced" ? s.level : "Intermediate") as "Beginner" | "Intermediate" | "Advanced",
      }));

    let flatSkills: string[] = skillsWithLevels.map((s: any) => s.name);
    if (flatSkills.length === 0 && body.skills) {
      if (Array.isArray(body.skills)) {
        flatSkills = body.skills.filter(Boolean);
      } else if (typeof body.skills === "string") {
        try {
          flatSkills = JSON.parse(body.skills);
        } catch {
          flatSkills = body.skills.split(",").map((s: string) => s.trim()).filter(Boolean);
        }
      }
    }

    // 3. Parse Projects
    let projects: any[] = user.projects || [];
    if (typeof body.projects === "string") {
      try {
        projects = JSON.parse(body.projects);
      } catch (e) {
        projects = user.projects || [];
      }
    } else if (Array.isArray(body.projects)) {
      projects = body.projects;
    }

    // 4. Parse Experience
    let experience: any = user.experience || { hasExperience: false };
    if (typeof body.experience === "string") {
      try {
        experience = JSON.parse(body.experience);
      } catch (e) {
        experience = user.experience || { hasExperience: false };
      }
    } else if (body.experience && typeof body.experience === "object") {
      experience = body.experience;
    }

    // 5. Optional Resume Upload
    let resumeText = user.resumeText || "";
    let resumeFileName = user.resumeFileName || "";
    let resumeUploadedAt = user.resumeUploadedAt || "";

    const file = req.file;
    if (file) {
      resumeFileName = file.originalname;
      resumeText = await parseResumeDocument(file.buffer, file.originalname, file.mimetype);
      if (!resumeText || resumeText.trim().length < 20) {
        resumeText = `Uploaded document: ${resumeFileName}. Resume verified for campus placement.`;
      }
      resumeUploadedAt = new Date().toISOString();
    } else if (body.resumeText && body.resumeText.trim()) {
      resumeText = body.resumeText.trim();
      resumeFileName = body.resumeFileName?.trim() || "resume.pdf";
      resumeUploadedAt = new Date().toISOString();
    }

    // Target roles: preserve user's existing or populated from careerGoal
    const targetRoles = careerGoal ? [careerGoal] : (user.targetRoles && user.targetRoles.length > 0 ? user.targetRoles : []);

    // 6. Update user document
    const updated = await db.users.update(user.id, {
      careerPreferences,
      skills: flatSkills,
      skillsWithLevels,
      projects,
      experience,
      targetRoles,
      onboardingCompleted: true,
      ...(resumeText ? { resumeText, resumeFileName, resumeUploadedAt } : {}),
      updatedAt: new Date().toISOString(),
    });

    if (!updated) {
      res.status(404).json({ error: "Student account not found." });
      return;
    }

    // 7. Instant High-Fidelity Profile Analysis & Job Role Recommendations
    let aiAnalysis = updated.aiAnalysis;
    let aiJobRecommendations = updated.aiJobRecommendations;

    if (!aiAnalysis) {
      aiAnalysis = await generateStudentAiProfileAnalysis(updated, { skipAi: true });
    }
    if (!aiJobRecommendations) {
      aiJobRecommendations = await generateJobRoleRecommendations(updated, { skipAi: true });
    }

    await db.users.update(user.id, { aiAnalysis, aiJobRecommendations });
    updated.aiAnalysis = aiAnalysis;
    updated.aiJobRecommendations = aiJobRecommendations;

    // 8. Calculate Placement Readiness Score
    const interviews = await db.interviews.findByUser(user.id);
    const roadmaps = await db.roadmaps.findByUser(user.id);
    const newScore = await calculatePlacementReadiness(updated, interviews, roadmaps);
    await db.readinessScores.save(newScore);

    // 9. Generate suggested jobs
    const allJobs = await db.jobs.all();
    const suggestedJobs = suggestJobRolesForStudent(updated, allJobs, 4);

    const safeUser = sanitizeUser(updated);

    res.json({
      success: true,
      message: "Onboarding completed and profile analyzed successfully!",
      user: safeUser,
      readinessScore: newScore,
      aiAnalysis,
      aiJobRecommendations,
      suggestedJobs,
    });

    // Background asynchronous enrichment with Gemini AI (non-blocking)
    (async () => {
      try {
        const [richAnalysis, richJobRecs] = await Promise.all([
          generateStudentAiProfileAnalysis(updated).catch(() => null),
          generateJobRoleRecommendations(updated).catch(() => null),
        ]);
        if (richAnalysis || richJobRecs) {
          const updates: any = {};
          if (richAnalysis) updates.aiAnalysis = richAnalysis;
          if (richJobRecs) updates.aiJobRecommendations = richJobRecs;
          await db.users.update(user.id, updates);
        }
      } catch (bgErr: any) {
        console.warn("Background AI enrichment notice:", bgErr?.message);
      }
    })();
  } catch (err: any) {
    console.error("Onboarding error:", err);
    res.status(500).json({ error: "Failed to complete onboarding: " + err.message });
  }
});

// GET AI Job Role Recommendations
app.get("/api/ai/job-recommendations", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const forceRefresh = req.query.forceRefresh === "true";

    if (user.aiJobRecommendations && !forceRefresh) {
      res.json({
        success: true,
        recommendations: user.aiJobRecommendations,
        selectedRole: user.selectedRole || null,
      });
      return;
    }

    const recommendations = await generateJobRoleRecommendations(user);
    await db.users.update(user.id, { aiJobRecommendations: recommendations });

    res.json({
      success: true,
      recommendations,
      selectedRole: user.selectedRole || null,
    });
  } catch (err: any) {
    console.error("Job recommendations error:", err);
    res.status(500).json({ error: "Failed to generate job recommendations: " + err.message });
  }
});

// POST AI Job Role Recommendations
app.post("/api/ai/job-recommendations", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const forceRefresh = req.body?.forceRefresh === true || req.query.forceRefresh === "true";

    if (user.aiJobRecommendations && !forceRefresh) {
      res.json({
        success: true,
        recommendations: user.aiJobRecommendations,
        selectedRole: user.selectedRole || null,
      });
      return;
    }

    const recommendations = await generateJobRoleRecommendations(user);
    await db.users.update(user.id, { aiJobRecommendations: recommendations });

    res.json({
      success: true,
      recommendations,
      selectedRole: user.selectedRole || null,
    });
  } catch (err: any) {
    console.error("Job recommendations error:", err);
    res.status(500).json({ error: "Failed to generate job recommendations: " + err.message });
  }
});

// POST Select a Recommended Role
app.post("/api/ai/select-role", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const { role } = req.body || {};

    if (!role || typeof role !== "string" || !role.trim()) {
      res.status(400).json({ error: "A valid job role name must be specified." });
      return;
    }

    const trimmedRole = role.trim();
    const currentTargetRoles = user.targetRoles || [];
    const newTargetRoles = [trimmedRole, ...currentTargetRoles.filter((r) => r.toLowerCase() !== trimmedRole.toLowerCase())];

    const updated = await db.users.update(user.id, {
      selectedRole: trimmedRole,
      targetRoles: newTargetRoles,
      roleSelectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (!updated) {
      res.status(404).json({ error: "Student account not found." });
      return;
    }

    const safeUser = sanitizeUser(updated);
    res.json({
      success: true,
      selectedRole: trimmedRole,
      user: safeUser,
      message: `Selected target role saved as: ${trimmedRole}`,
    });
  } catch (err: any) {
    console.error("Select role error:", err);
    res.status(500).json({ error: "Failed to save selected role: " + err.message });
  }
});

// GET AI Profile Analysis
app.get("/api/profile/analysis", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    if (user.aiAnalysis) {
      res.json({ success: true, aiAnalysis: user.aiAnalysis });
      return;
    }

    const aiAnalysis = await generateStudentAiProfileAnalysis(user);
    await db.users.update(user.id, { aiAnalysis });
    res.json({ success: true, aiAnalysis });
  } catch (err: any) {
    console.error("Profile analysis error:", err);
    res.status(500).json({ error: "Failed to generate profile analysis: " + err.message });
  }
});

// Comprehensive Profile Update
app.put("/api/profile/update-comprehensive", upload.single("resume"), async (req: Request, res: Response) => {
  try {
    const user = await getAuthenticatedUser(req);
    const body = req.body || {};

    if (!user) {
      res.status(401).json({ error: "Unauthorized. Please log in to update your profile." });
      return;
    }

    const careerGoal = body.careerGoal?.trim() || user.careerPreferences?.careerGoal || user.targetRoles?.[0] || "Software Development Engineer";
    const preferredField = body.preferredField?.trim() || user.careerPreferences?.preferredField || "Software Development";
    const preferredJobType = body.preferredJobType || user.careerPreferences?.preferredJobType || "Both";

    let skillsWithLevels = user.skillsWithLevels || [];
    if (body.skillsWithLevels) {
      try {
        skillsWithLevels = typeof body.skillsWithLevels === "string" ? JSON.parse(body.skillsWithLevels) : body.skillsWithLevels;
      } catch (e) {
        // preserve existing
      }
    }

    let flatSkills = skillsWithLevels.map((s: any) => s.name?.trim()).filter(Boolean);
    if (flatSkills.length === 0 && body.skills) {
      flatSkills = Array.isArray(body.skills) ? body.skills : body.skills.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
    if (flatSkills.length === 0) flatSkills = user.skills;

    let projects = user.projects || [];
    if (body.projects) {
      try {
        projects = typeof body.projects === "string" ? JSON.parse(body.projects) : body.projects;
      } catch (e) {
        // preserve
      }
    }

    let experience = user.experience || { hasExperience: false };
    if (body.experience) {
      try {
        experience = typeof body.experience === "string" ? JSON.parse(body.experience) : body.experience;
      } catch (e) {
        // preserve
      }
    }

    let resumeText = user.resumeText;
    let resumeFileName = user.resumeFileName;
    let resumeUploadedAt = user.resumeUploadedAt;

    const file = req.file;
    if (file) {
      resumeFileName = file.originalname;
      const parsedText = await parseResumeDocument(file.buffer, file.originalname, file.mimetype);
      if (!parsedText || parsedText.trim().length < 20) {
        res.status(400).json({ error: "Failed to extract readable text from the uploaded resume (PDF/DOCX). Please ensure the file is not password-protected or corrupted." });
        return;
      }
      resumeText = parsedText;
      resumeUploadedAt = new Date().toISOString();
    }

    const updated = await db.users.update(user.id, {
      careerPreferences: { careerGoal, preferredField, preferredJobType },
      skills: flatSkills,
      skillsWithLevels,
      projects,
      experience,
      targetRoles: [careerGoal],
      ...(resumeText ? { resumeText, resumeFileName, resumeUploadedAt } : {}),
      updatedAt: new Date().toISOString(),
    });

    if (!updated) {
      res.status(404).json({ error: "Student account not found." });
      return;
    }

    const aiAnalysis = await generateStudentAiProfileAnalysis(updated);
    await db.users.update(user.id, { aiAnalysis });
    updated.aiAnalysis = aiAnalysis;

    const interviews = await db.interviews.findByUser(user.id);
    const roadmaps = await db.roadmaps.findByUser(user.id);
    const newScore = await calculatePlacementReadiness(updated, interviews, roadmaps);
    await db.readinessScores.save(newScore);

    const allJobs = await db.jobs.all();
    const suggestedJobs = suggestJobRolesForStudent(updated, allJobs, 4);

    const safeUser = sanitizeUser(updated);
    res.json({
      success: true,
      message: "Profile and career metrics updated successfully!",
      user: safeUser,
      readinessScore: newScore,
      aiAnalysis,
      suggestedJobs,
    });
  } catch (err: any) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile: " + err.message });
  }
});

// ----------------------------------------------------
// QUALIFICATION-AWARE CAREER RECOMMENDATION ENGINE
// ----------------------------------------------------

app.get("/api/career/recommendations", async (req: Request, res: Response) => {
  try {
    const user = await getAuthenticatedUser(req);
    const course = (req.query.course as string) || user?.course || "B.Tech";
    const branch = (req.query.branch as string) || user?.branch || "Computer Science";
    const careerGoal = (req.query.careerGoal as string) || user?.careerPreferences?.careerGoal || user?.targetRoles?.[0] || "";
    const preferredDomain = (req.query.preferredDomain as string) || user?.careerPreferences?.preferredField || "";
    const skillsParam = req.query.skills as string;
    const skills = skillsParam ? skillsParam.split(",").map((s) => s.trim()) : user?.skills || [];
    const experienceLevel = (req.query.experienceLevel as string) || (user?.experience?.hasExperience ? "Internship Experience" : "Fresher");

    const recommendations = getCareerRecommendations({
      course,
      branch,
      careerGoal,
      preferredDomain,
      skills,
      experienceLevel,
    });

    res.json({ success: true, recommendations });
  } catch (err: any) {
    console.error("Career recommendations error:", err);
    res.status(500).json({ error: "Failed to generate recommendations: " + err.message });
  }
});

app.post("/api/career/recommendations", async (req: Request, res: Response) => {
  try {
    const user = await getAuthenticatedUser(req);
    const body = req.body || {};
    const course = body.course || user?.course || "B.Tech";
    const branch = body.branch || user?.branch || "Computer Science";
    const careerGoal = body.careerGoal || user?.careerPreferences?.careerGoal || user?.targetRoles?.[0] || "";
    const preferredDomain = body.preferredDomain || user?.careerPreferences?.preferredField || "";
    const skills = Array.isArray(body.skills) ? body.skills : (body.skills ? body.skills.split(",").map((s: string) => s.trim()) : user?.skills || []);
    const experienceLevel = body.experienceLevel || (user?.experience?.hasExperience ? "Internship Experience" : "Fresher");

    const recommendations = getCareerRecommendations({
      course,
      branch,
      careerGoal,
      preferredDomain,
      skills,
      experienceLevel,
    });

    res.json({ success: true, recommendations });
  } catch (err: any) {
    console.error("Career recommendations error:", err);
    res.status(500).json({ error: "Failed to generate recommendations: " + err.message });
  }
});

// ----------------------------------------------------
// JOBS & PLACEMENT MATCHING INTELLIGENCE
// ----------------------------------------------------

app.get("/api/jobs", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const allJobs = await db.jobs.all();

    const jobsWithMatch = allJobs.map((job) => {
      const match = quickJobMatch(user, job);
      return {
        ...job,
        matchAnalysis: match,
      };
    });

    jobsWithMatch.sort((a, b) => b.matchAnalysis.matchPercentage - a.matchAnalysis.matchPercentage);

    res.json({ jobs: jobsWithMatch });
  } catch (err: any) {
    console.error("Jobs error:", err);
    res.status(500).json({ error: "Failed to fetch jobs: " + err.message });
  }
});

app.get("/api/jobs/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const job = await db.jobs.findById(req.params.id);
    if (!job) {
      res.status(404).json({ error: "Job listing not found" });
      return;
    }

    const matchAnalysis = await analyzeJobMatch(user, job);
    res.json({ job, matchAnalysis });
  } catch (err: any) {
    console.error("Job details error:", err);
    res.status(500).json({ error: "Failed to fetch job details: " + err.message });
  }
});

// ----------------------------------------------------
// PLACEMENT READINESS & PERSONALIZED ROADMAPS
// ----------------------------------------------------

// GET Skill Gap Analysis for Student's Target Role
app.get("/api/skill-gap", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const roleQuery = (req.query.role as string) || "";
    const targetRole = roleQuery.trim() || user.selectedRole || user.targetRoles?.[0];

    if (!targetRole) {
      res.json({
        skillGap: null,
        message: "Please select an AI-recommended job role first to view your Skill Gap Analysis.",
      });
      return;
    }

    let roadmap = await db.roadmaps.findByUserAndRole(user.id, targetRole);
    if (roadmap && roadmap.skillGap) {
      res.json({ success: true, role: targetRole, skillGap: roadmap.skillGap });
      return;
    }

    const { skillGap, roadmap: newRoadmap } = await generateSkillGapAndRoadmap(user, targetRole);
    await db.roadmaps.save(newRoadmap);

    res.json({ success: true, role: targetRole, skillGap });
  } catch (err: any) {
    console.error("Skill gap fetch error:", err);
    res.status(500).json({ error: "Failed to generate skill gap analysis: " + err.message });
  }
});

// POST Analyze Skill Gap for a Specific Role
app.post("/api/skill-gap/analyze", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const { role } = req.body || {};
    const targetRole = (role as string)?.trim() || user.selectedRole || user.targetRoles?.[0];

    if (!targetRole) {
      res.status(400).json({ error: "No target job role specified or selected." });
      return;
    }

    const { skillGap, roadmap } = await generateSkillGapAndRoadmap(user, targetRole);
    await db.roadmaps.save(roadmap);

    const interviews = await db.interviews.findByUser(user.id);
    const roadmaps = await db.roadmaps.findByUser(user.id);
    const updatedScore = await calculatePlacementReadiness(user, interviews, roadmaps);
    await db.readinessScores.save(updatedScore);

    res.json({ success: true, role: targetRole, skillGap, roadmap });
  } catch (err: any) {
    console.error("Analyze skill gap error:", err);
    res.status(500).json({ error: "Failed to perform skill gap analysis: " + err.message });
  }
});

// GET Roadmap for Selected Role
app.get("/api/roadmaps", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const roleQuery = (req.query.role as string)?.trim() || "";
    const targetRole = roleQuery || user.selectedRole || user.targetRoles?.[0];

    if (!targetRole) {
      res.json({
        roadmap: null,
        message: "No target job role selected yet. Please complete role selection.",
      });
      return;
    }

    let roadmap = await db.roadmaps.findByUserAndRole(user.id, targetRole);
    if (!roadmap) {
      const { roadmap: generatedRoadmap } = await generateSkillGapAndRoadmap(user, targetRole);
      roadmap = await db.roadmaps.save(generatedRoadmap);
    }

    res.json({ success: true, roadmap });
  } catch (err: any) {
    console.error("Roadmap get error:", err);
    res.status(500).json({ error: "Failed to retrieve personalized roadmap: " + err.message });
  }
});

// POST Generate or Regenerate Personalized Roadmap
app.post("/api/roadmaps/generate", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const { role } = req.body || {};
    const targetRole = (role as string)?.trim() || user.selectedRole || user.targetRoles?.[0];

    if (!targetRole) {
      res.status(400).json({ error: "No target job role specified or selected." });
      return;
    }

    const { roadmap } = await generateSkillGapAndRoadmap(user, targetRole);
    const saved = await db.roadmaps.save(roadmap);

    const interviews = await db.interviews.findByUser(user.id);
    const roadmaps = await db.roadmaps.findByUser(user.id);
    const updatedScore = await calculatePlacementReadiness(user, interviews, roadmaps);
    await db.readinessScores.save(updatedScore);

    res.json({ success: true, roadmap: saved });
  } catch (err: any) {
    console.error("Roadmap generation error:", err);
    res.status(500).json({ error: "Failed to generate roadmap: " + err.message });
  }
});

app.get("/api/roadmaps/:jobId", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const { jobId } = req.params;

    let roadmap = await db.roadmaps.findByUserAndJob(user.id, jobId);
    if (!roadmap) {
      const job = await db.jobs.findById(jobId);
      if (!job) {
        const roleName = jobId.startsWith("role-")
          ? jobId.replace("role-", "").replace(/-/g, " ")
          : jobId;
        roadmap = await generatePersonalizedRoadmap(user, roleName);
      } else {
        roadmap = await generatePersonalizedRoadmap(user, job);
      }
      await db.roadmaps.save(roadmap);
    }

    res.json({ roadmap });
  } catch (err: any) {
    console.error("Roadmap fetch error:", err);
    res.status(500).json({ error: "Failed to get roadmap: " + err.message });
  }
});

app.post("/api/roadmaps/:jobId/regenerate", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const { jobId } = req.params;

    const job = await db.jobs.findById(jobId);
    let newRoadmap: RoadmapDocument;
    if (!job) {
      const roleName = jobId.startsWith("role-")
        ? jobId.replace("role-", "").replace(/-/g, " ")
        : jobId;
      newRoadmap = await generatePersonalizedRoadmap(user, roleName);
    } else {
      newRoadmap = await generatePersonalizedRoadmap(user, job);
    }
    await db.roadmaps.save(newRoadmap);

    res.json({ roadmap: newRoadmap });
  } catch (err: any) {
    console.error("Roadmap regenerate error:", err);
    res.status(500).json({ error: "Failed to regenerate roadmap: " + err.message });
  }
});

app.post("/api/roadmaps/:roadmapId/items/:itemId/toggle", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const { roadmapId, itemId } = req.params;
    const { completed } = req.body;

    const updatedRoadmap = await db.roadmaps.updateItem(roadmapId, itemId, Boolean(completed));
    if (!updatedRoadmap) {
      res.status(404).json({ error: "Roadmap item not found" });
      return;
    }

    const interviews = await db.interviews.findByUser(user.id);
    const roadmaps = await db.roadmaps.findByUser(user.id);
    const updatedScore = await calculatePlacementReadiness(user, interviews, roadmaps);
    await db.readinessScores.save(updatedScore);

    res.json({ roadmap: updatedRoadmap, readinessScore: updatedScore });
  } catch (err: any) {
    console.error("Roadmap toggle error:", err);
    res.status(500).json({ error: "Failed to toggle roadmap item: " + err.message });
  }
});

// ----------------------------------------------------
// OVERALL PROGRESS DASHBOARD (AGGREGATION ENGINE)
// ----------------------------------------------------

app.get("/api/dashboard", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const selectedRole = user.selectedRole || null;

    // 1. Target Role
    const targetRole = {
      selected: Boolean(selectedRole),
      role: selectedRole,
    };

    // 2. Fetch Roadmap & Task Progress
    let roadmap = selectedRole
      ? await db.roadmaps.findByUserAndRole(user.id, selectedRole)
      : ((await db.roadmaps.findByUser(user.id))[0] || null);

    let totalTasks = 0;
    let completedTasks = 0;
    let nextPriorityTask: any = null;

    if (roadmap && Array.isArray(roadmap.phases)) {
      for (const phase of roadmap.phases) {
        if (!Array.isArray(phase.items)) continue;
        totalTasks += phase.items.length;
        for (const item of phase.items) {
          if (item.completed) {
            completedTasks++;
          } else if (!nextPriorityTask && item.priority === "High") {
            nextPriorityTask = {
              id: item.id,
              title: item.title,
              skill: item.skill,
              topic: item.topic,
              priority: item.priority,
              reason: item.reason || (item.skill ? `High-priority skill gap for ${selectedRole || "your target role"}.` : "Key priority task in your learning plan."),
              category: item.type || (item as any).category,
              phaseNumber: phase.phaseNumber,
            };
          }
        }
      }

      if (!nextPriorityTask) {
        for (const phase of roadmap.phases) {
          const incomplete = phase.items?.find((i) => !i.completed);
          if (incomplete) {
            nextPriorityTask = {
              id: incomplete.id,
              title: incomplete.title,
              skill: incomplete.skill,
              topic: incomplete.topic,
              priority: incomplete.priority || "Medium",
              reason: incomplete.reason || `Target milestone in Phase ${phase.phaseNumber}.`,
              category: incomplete.type || (incomplete as any).category,
              phaseNumber: phase.phaseNumber,
            };
            break;
          }
        }
      }
    }

    const roadmapProgressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 3. Skills Overview
    const skillGap = roadmap?.skillGap || null;
    const skills = {
      assessed: Boolean(skillGap),
      strong: skillGap?.strong || [],
      developing: skillGap?.developing || [],
      needsImprovement: skillGap?.needsImprovement || [],
      missing: skillGap?.missing || [],
      prioritySkills: skillGap?.prioritySkills || [],
    };

    // 4. Latest Mock Interview
    const interviews = await db.interviews.findByUser(user.id);
    const latestInterviewDoc = interviews && interviews.length > 0 ? interviews[0] : null;

    let latestInterview = null;
    if (latestInterviewDoc) {
      const isAssessed = latestInterviewDoc.scoreAssessed !== false && latestInterviewDoc.overallScore !== null;
      latestInterview = {
        conducted: true,
        id: latestInterviewDoc.id,
        targetRole: latestInterviewDoc.targetRole,
        companyTarget: latestInterviewDoc.companyTarget,
        score: isAssessed ? latestInterviewDoc.overallScore : null,
        scoreAssessed: isAssessed,
        subScores: latestInterviewDoc.subScores,
        coreStrengths: latestInterviewDoc.coreStrengths || [],
        coreWeaknesses: latestInterviewDoc.coreWeaknesses || [],
        conductedAt: latestInterviewDoc.conductedAt,
      };
    }

    // 5. Latest Roadmap Update
    let latestRoadmapUpdate = null;
    if (latestInterviewDoc?.roadmapChanges && latestInterviewDoc.roadmapChanges.length > 0) {
      latestRoadmapUpdate = {
        hasUpdate: true,
        source: "mock_interview",
        updatedAt: latestInterviewDoc.conductedAt,
        changes: latestInterviewDoc.roadmapChanges,
      };
    } else if (roadmap) {
      const adaptedItems: any[] = [];
      for (const phase of roadmap.phases || []) {
        for (const item of phase.items || []) {
          if (item.source === "mock_interview") {
            adaptedItems.push({
              type: item.title.includes("Interview Refresher") || item.title.includes("Practice") ? "added" : "updated",
              skill: item.skill || "Technical Skill",
              topic: item.topic || item.title,
              newPriority: item.priority || "High",
              taskTitle: item.title,
              reason: item.reason || "Updated after weakness detected during mock interview.",
            });
          }
        }
      }
      if (adaptedItems.length > 0) {
        latestRoadmapUpdate = {
          hasUpdate: true,
          source: "mock_interview",
          updatedAt: roadmap.updatedAt,
          changes: adaptedItems,
        };
      }
    }

    // 6. Overall Progress Indicator
    const hasSufficientData = Boolean(roadmap && totalTasks > 0) || Boolean(latestInterview?.scoreAssessed);
    let statusSummary = "";
    if (roadmap && totalTasks > 0 && latestInterview?.scoreAssessed) {
      statusSummary = `${completedTasks} of ${totalTasks} roadmap tasks completed (${roadmapProgressPercentage}%) • Latest mock interview evaluated (${latestInterview.score}/100)`;
    } else if (roadmap && totalTasks > 0) {
      statusSummary = `${completedTasks} of ${totalTasks} roadmap tasks completed (${roadmapProgressPercentage}%) • Mock interview not yet taken`;
    } else if (selectedRole) {
      statusSummary = `Preparing for ${selectedRole} • Complete roadmap tasks and mock interview to establish progress.`;
    } else {
      statusSummary = "Progress tracking will appear as you complete your roadmap and assessments.";
    }

    // 7. Academic Profile
    const academic = {
      college: user.college || null,
      course: user.course || null,
      branch: user.branch || null,
      semester: (user.semester !== undefined && user.semester !== null) ? user.semester : null,
      cgpa: (user.cgpa !== undefined && user.cgpa !== null) ? user.cgpa : null,
      backlogs: (user.backlogs !== undefined && user.backlogs !== null) ? user.backlogs : 0,
      graduationYear: user.graduationYear || null,
    };

    // 8. Resume Status
    const isResumeUploaded = Boolean(user.resumeUploadedAt || user.resumeFileName || (user.resumeText && user.resumeText.length > 20));
    const resume = {
      isUploaded: isResumeUploaded,
      fileName: user.resumeFileName || (isResumeUploaded ? "Uploaded Resume" : null),
      uploadedAt: user.resumeUploadedAt || null,
      assessmentStatus: isResumeUploaded ? ("uploaded_unassessed" as const) : ("not_uploaded" as const),
      note: isResumeUploaded ? "Uploaded — Assessment not available yet." : "Not Uploaded",
    };

    // 9. Next Action
    let nextAction: {
      title: string;
      description: string;
      actionLabel: string;
      targetTab: "score" | "jobs" | "roadmap" | "interview";
      reason: string;
    };

    if (!selectedRole) {
      nextAction = {
        title: "Select Your Target Job Role",
        description: "Review AI-recommended roles and select the position you want to target for campus placements.",
        actionLabel: "View Recommended Roles",
        targetTab: "jobs",
        reason: "Selecting a target role activates your AI skill gap breakdown and personalized learning plan.",
      };
    } else if (!roadmap || totalTasks === 0) {
      nextAction = {
        title: "Generate Your Personalized Roadmap",
        description: `Analyze your skill gaps and generate a step-by-step roadmap for ${selectedRole}.`,
        actionLabel: "Open Learning Roadmap",
        targetTab: "roadmap",
        reason: "Your personalized roadmap translates required role competencies into actionable milestones.",
      };
    } else if (nextPriorityTask) {
      nextAction = {
        title: `Work on: ${nextPriorityTask.title}`,
        description: nextPriorityTask.reason || `Targeted task in Phase ${nextPriorityTask.phaseNumber || 1}.`,
        actionLabel: "Continue Roadmap Task",
        targetTab: "roadmap",
        reason: "Highest-priority incomplete milestone in your active placement preparation roadmap.",
      };
    } else if (!latestInterview?.conducted) {
      nextAction = {
        title: "Take Your First AI Mock Interview",
        description: `Test your technical knowledge and problem-solving skills for ${selectedRole} with Dr. Maya Ramanathan.`,
        actionLabel: "Start Mock Interview",
        targetTab: "interview",
        reason: "A mock interview provides real evidence of communication, technical depth, and adaptive roadmap tuning.",
      };
    } else {
      nextAction = {
        title: "Retake Mock Interview or Refine Skills",
        description: "All current priority tasks are completed. Take another interview session to verify mastery.",
        actionLabel: "Practice Another Mock",
        targetTab: "interview",
        reason: "Continuous mock practice under interview conditions locks in competitive campus readiness.",
      };
    }

    // 10. Real Recent Activities from MongoDB event timestamps
    const recentActivities: Array<{
      id: string;
      type: "profile" | "role" | "skill_gap" | "roadmap" | "interview" | "resume" | "mcq";
      title: string;
      timestamp: string | null;
    }> = [];

    // Mock interviews completed
    if (interviews && interviews.length > 0) {
      for (const inv of interviews.slice(0, 5)) {
        if (inv.conductedAt) {
          recentActivities.push({
            id: `interview-${inv.id}`,
            type: "interview",
            title: inv.targetRole ? `Mock interview completed for ${inv.targetRole}` : "Mock interview completed",
            timestamp: inv.conductedAt,
          });
        }
      }
    }

    // Roadmap updated/generated
    if (roadmap && (roadmap.updatedAt || roadmap.generatedAt)) {
      recentActivities.push({
        id: `roadmap-${roadmap.id || "active"}`,
        type: "roadmap",
        title: roadmap.selectedRole ? `Roadmap updated for ${roadmap.selectedRole}` : "Roadmap updated",
        timestamp: roadmap.updatedAt || roadmap.generatedAt,
      });
    }

    // Skill gap generated/analyzed
    if (roadmap?.skillGap?.analyzedAt) {
      recentActivities.push({
        id: `skillgap-${roadmap.id || "active"}`,
        type: "skill_gap",
        title: roadmap.skillGap.role ? `Skill gap analyzed for ${roadmap.skillGap.role}` : "Skill gap analysis completed",
        timestamp: roadmap.skillGap.analyzedAt,
      });
    }

    // Resume updated/uploaded
    if (user.resumeUploadedAt) {
      recentActivities.push({
        id: `resume-${user.id}`,
        type: "resume",
        title: user.resumeFileName ? `Resume uploaded: ${user.resumeFileName}` : "Resume updated",
        timestamp: user.resumeUploadedAt,
      });
    }

    // Target role selected
    if (user.selectedRole) {
      recentActivities.push({
        id: `role-${user.id}`,
        type: "role",
        title: `Target role selected: ${user.selectedRole}`,
        timestamp: user.roleSelectedAt || (roadmap?.generatedAt || null),
      });
    }

    // Profile updated/created
    if (user.updatedAt || user.createdAt) {
      recentActivities.push({
        id: `profile-${user.id}`,
        type: "profile",
        title: "Profile updated",
        timestamp: user.updatedAt || user.createdAt,
      });
    }

    // Sort by actual event timestamp descending (newest first)
    recentActivities.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });

    res.json({
      targetRole,
      overallProgress: {
        hasSufficientData,
        roadmapCompletionPercent: roadmapProgressPercentage,
        completedTasksCount: completedTasks,
        totalTasksCount: totalTasks,
        interviewScore: latestInterview?.score || null,
        interviewAssessed: Boolean(latestInterview?.scoreAssessed),
        statusSummary,
      },
      skills,
      roadmap: {
        hasRoadmap: Boolean(roadmap),
        id: roadmap?.id,
        totalTasks,
        completedTasks,
        progressPercentage: roadmapProgressPercentage,
        nextPriority: nextPriorityTask,
      },
      latestInterview,
      latestRoadmapUpdate,
      academic,
      resume,
      nextAction,
      recentActivities,
    });
  } catch (err: any) {
    console.error("Dashboard aggregation error:", err);
    res.status(500).json({ error: "Failed to load dashboard data: " + err.message });
  }
});

// ----------------------------------------------------
// JOB & PLACEMENT READINESS SCORE
// ----------------------------------------------------

app.get("/api/scores/current", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    let score = await db.readinessScores.findByUser(user.id);

    if (!score) {
      const interviews = await db.interviews.findByUser(user.id);
      const roadmaps = await db.roadmaps.findByUser(user.id);
      score = await calculatePlacementReadiness(user, interviews, roadmaps);
      await db.readinessScores.save(score);
    }

    res.json({ score });
  } catch (err: any) {
    console.error("Score fetch error:", err);
    res.status(500).json({ error: "Failed to fetch score: " + err.message });
  }
});

app.post("/api/scores/recalculate", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const interviews = await db.interviews.findByUser(user.id);
    const roadmaps = await db.roadmaps.findByUser(user.id);

    const newScore = await calculatePlacementReadiness(user, interviews, roadmaps);
    await db.readinessScores.save(newScore);

    const allJobs = await db.jobs.all();
    const suggestedJobs = suggestJobRolesForStudent(user, allJobs, 3);

    res.json({ score: newScore, suggestedJobs });
  } catch (err: any) {
    console.error("Score recalculate error:", err);
    res.status(500).json({ error: "Failed to recalculate score: " + err.message });
  }
});

// ----------------------------------------------------
// REAL-TIME INTERACTIVE AI MOCK INTERVIEW & ADAPTIVE ROADMAP
// ----------------------------------------------------

app.post("/api/interviews/start", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const { targetRole, companyTarget } = req.body;

    const role = targetRole || user.selectedRole || (user.targetRoles && user.targetRoles[0]) || "Software Development Engineer";
    const company = companyTarget?.trim() || "";

    const existingRoadmap = (await db.roadmaps.findByUserAndJob(user.id, role)) || (await db.roadmaps.findByUser(user.id))[0];
    const skillGap = existingRoadmap?.skillGap;
    const previousInterviews = await db.interviews.findByUser(user.id);

    const result = await generateInterviewGreetingAndFirstQuestion(user, role, company, existingRoadmap, skillGap, previousInterviews);
    const sessionId = `session-${user.id}-${Date.now()}`;

    res.json({
      sessionId,
      targetRole: role,
      companyTarget: company || undefined,
      interviewerIntro: result.interviewerIntro,
      firstQuestion: result.firstQuestion,
      interviewer: {
        name: "Dr. Maya Ramanathan",
        title: "Principal Technical Bar Raiser & Engineering Lead",
        avatarType: "tech-lead",
      },
    });
  } catch (err: any) {
    console.error("Interview start error:", err);
    res.status(500).json({ error: "Failed to start interview: " + err.message });
  }
});

app.post("/api/interviews/next-question", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const { targetRole, previousQuestions, previousAnswers } = req.body;
    const latestAnswer = req.body.latestAnswer !== undefined ? req.body.latestAnswer : req.body.answer || "";

    const role = targetRole || user.selectedRole || (user.targetRoles && user.targetRoles[0]) || "Software Development Engineer";
    const existingRoadmap = (await db.roadmaps.findByUserAndJob(user.id, role)) || (await db.roadmaps.findByUser(user.id))[0];
    const skillGap = existingRoadmap?.skillGap;
    const previousInterviews = await db.interviews.findByUser(user.id);

    const turnResult = await evaluateAnswerAndGenerateNextQuestion(
      user,
      role,
      previousQuestions || [],
      previousAnswers || [],
      latestAnswer || "",
      existingRoadmap,
      skillGap,
      previousInterviews
    );

    res.json(turnResult);
  } catch (err: any) {
    console.error("Next question generation error:", err);
    res.status(500).json({ error: "Failed to generate next interview question: " + err.message });
  }
});

app.post("/api/interviews/evaluate", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const { targetRole, companyTarget, answers, transcript } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      res.status(400).json({ error: "Interview answers are required for evaluation." });
      return;
    }

    const role = targetRole || user.selectedRole || (user.targetRoles && user.targetRoles[0]) || "Software Development Engineer";
    const company = companyTarget?.trim() || "";

    const { report } = await evaluateMockInterview(
      user,
      role,
      company,
      answers,
      transcript
    );

    // Save the finalized interview session in MongoDB
    await db.interviews.create(report);

    // Dynamic Adaptive Roadmap updates
    let userRoadmap = (await db.roadmaps.findByUserAndJob(user.id, role)) || (await db.roadmaps.findByUser(user.id))[0];
    if (!userRoadmap) {
      const generated = await generateSkillGapAndRoadmap(user, role);
      userRoadmap = generated.roadmap;
      await db.roadmaps.save(userRoadmap);
    }

    let roadmapChanges: any[] = [];
    if (userRoadmap && report.skillGapsDetected && report.skillGapsDetected.length > 0) {
      const adaptation = adaptRoadmapFromInterview(userRoadmap, report.skillGapsDetected);
      userRoadmap = adaptation.updatedRoadmap;
      roadmapChanges = adaptation.changes;
      await db.roadmaps.save(userRoadmap);
      report.roadmapChanges = roadmapChanges;
    }

    // Recalculate score with new mock interview assessment
    const interviews = await db.interviews.findByUser(user.id);
    const roadmaps = await db.roadmaps.findByUser(user.id);
    const updatedScore = await calculatePlacementReadiness(user, interviews, roadmaps);
    await db.readinessScores.save(updatedScore);

    res.json({
      report,
      updatedRoadmap: userRoadmap,
      roadmapChanges,
      updatedScore,
    });
  } catch (err: any) {
    console.error("Interview evaluation error:", err);
    res.status(500).json({ error: "Failed to evaluate interview: " + err.message });
  }
});

app.get("/api/interviews/history", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const history = await db.interviews.findByUser(user.id);
    res.json({ interviews: history });
  } catch (err: any) {
    console.error("Interview history error:", err);
    res.status(500).json({ error: "Failed to fetch interview history: " + err.message });
  }
});

app.get("/api/interviews/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as UserDocument;
    const interview = await db.interviews.findById(req.params.id);
    if (!interview || interview.userId !== user.id) {
      res.status(404).json({ error: "Interview report not found" });
      return;
    }
    res.json({ interview });
  } catch (err: any) {
    console.error("Interview detail error:", err);
    res.status(500).json({ error: "Failed to fetch interview detail: " + err.message });
  }
});

// ----------------------------------------------------
// API ERROR & 404 MIDDLEWARE (Guarantees JSON response)
// ----------------------------------------------------

app.all("/api/*", (req: Request, res: Response) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
});

app.use("/api", (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("API error encountered:", err);
  const status = typeof err.status === "number" ? err.status : 500;
  res.status(status).json({
    success: false,
    error: err.message || "An internal server error occurred",
  });
});

// ----------------------------------------------------
// VITE MIDDLEWARE & SERVER BOOTSTRAP
// ----------------------------------------------------

async function startServer() {
  await initMongo();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PlacementOS Server running on port ${PORT}`);
  });
}

startServer();
