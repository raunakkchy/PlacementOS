// test-admin-routing.mjs
// Automated regression test suite for Placement OS Private Super Admin Route Hardening
// Covers: repeated slashes, encoded paths, path traversal, bare routes, invalid secrets,
// legacy admin routes, valid secret route, session role-based authorization, and student/college route preservation.

import http from "http";

const BASE_HOST = "localhost";
const BASE_PORT = 3000;
const BASE_URL = `http://${BASE_HOST}:${BASE_PORT}`;

// High-entropy fallback secret used in dev mode
const VALID_DEV_SECRET = process.env.ADMIN_ROUTE_SECRET?.trim() || "sec_7f9b2d8e4c1a5b3f6e8d2a4c9b1e7f3a8d0c2e4b6f8a1c3e5d7b9a0f2c4e6b8";

// Raw HTTP request helper that sends paths exactly as-is over the socket
// (avoids client-side URL normalization in standard fetch / curl)
function rawRequest(rawPath, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: BASE_HOST,
        port: BASE_PORT,
        path: rawPath,
        method: "GET",
        headers: {
          Host: `${BASE_HOST}:${BASE_PORT}`,
          Connection: "close",
          ...headers,
        },
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body,
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function runRegressionSuite() {
  console.log("================================================================================");
  console.log("PLACEMENT OS — SUPER ADMIN PRIVATE ROUTE HARDENING REGRESSION TEST SUITE");
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ""}`);
      failed++;
    }
  }

  // Helper for JSON API calls
  async function jsonPost(path, data) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, headers: res.headers, json };
  }

  // -------------------------------------------------------------------------
  // SECTION 1: Repeated Slashes & Malformed Delimiters
  // -------------------------------------------------------------------------
  console.log("\n[Section 1] Repeated Slashes & Malformed Delimiters");
  {
    const tests = [
      { path: "/private-control//", name: "GET /private-control// (double trailing slash)" },
      { path: "/private-control///", name: "GET /private-control/// (triple trailing slash)" },
      { path: "/private-control////", name: "GET /private-control//// (quad trailing slash)" },
      { path: "//private-control", name: "GET //private-control (double leading slash)" },
      { path: "///private-control", name: "GET ///private-control (triple leading slash)" },
      { path: "//private-control/", name: "GET //private-control/ (double leading with slash)" },
      { path: "//private-control//", name: "GET //private-control// (double leading & trailing)" },
      { path: `/private-control//${VALID_DEV_SECRET}`, name: "GET /private-control//<secret> (consecutive slash before secret)" },
      { path: `/private-control/${VALID_DEV_SECRET}//`, name: "GET /private-control/<secret>// (consecutive slash after secret)" },
      { path: `/private-control/${VALID_DEV_SECRET}///`, name: "GET /private-control/<secret>/// (triple slash after secret)" },
      { path: `/private-control/${VALID_DEV_SECRET}//colleges`, name: "GET /private-control/<secret>//colleges (consecutive slash before subpath)" },
      { path: "/admin//", name: "GET /admin// (legacy route with repeated slash)" },
      { path: "//admin", name: "GET //admin (legacy route with double leading slash)" },
      { path: "///admin", name: "GET ///admin (legacy route with triple leading slash)" },
      { path: "//admin/login", name: "GET //admin/login (legacy login with double leading slash)" },
      { path: "//admin/colleges", name: "GET //admin/colleges (legacy colleges with double leading slash)" },
    ];

    for (const t of tests) {
      const res = await rawRequest(t.path);
      assert(res.status === 404, t.name, `expected 404, got ${res.status}`);
      assert(!res.body.includes(VALID_DEV_SECRET), `${t.name} does not leak secret in body`);
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 2: Encoded Paths, Slashes & Malformed URI Sequences
  // -------------------------------------------------------------------------
  console.log("\n[Section 2] Encoded Paths, Slashes & Malformed URI Sequences");
  {
    const tests = [
      { path: "/private-control%2f", name: "GET /private-control%2f (encoded lowercase slash)" },
      { path: "/private-control%2F", name: "GET /private-control%2F (encoded uppercase slash)" },
      { path: "/private-control/%2f", name: "GET /private-control/%2f (slash followed by encoded slash)" },
      { path: "/%2fprivate-control", name: "GET /%2fprivate-control (encoded leading slash)" },
      { path: "/private-control/%2e%2e", name: "GET /private-control/%2e%2e (encoded double dot)" },
      { path: "/private-control%2e%2e", name: "GET /private-control%2e%2e (direct encoded double dot)" },
      { path: `/private-control/${VALID_DEV_SECRET}%2f`, name: "GET /private-control/<secret>%2f (encoded slash on valid secret)" },
      { path: `/private-control/${VALID_DEV_SECRET}/%2f`, name: "GET /private-control/<secret>/%2f (subpath encoded slash)" },
      { path: "/%2fadmin", name: "GET /%2fadmin (encoded slash before admin)" },
      { path: "/admin%2f", name: "GET /admin%2f (encoded slash after admin)" },
      { path: "/admin/%2e%2e", name: "GET /admin/%2e%2e (encoded traversal on legacy admin)" },
      { path: "/private-control/%c0%af", name: "GET /private-control/%c0%af (malformed UTF-8 overlong sequence)" },
    ];

    for (const t of tests) {
      const res = await rawRequest(t.path);
      assert(res.status === 404, t.name, `expected 404, got ${res.status}`);
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 3: Path Traversal
  // -------------------------------------------------------------------------
  console.log("\n[Section 3] Path Traversal");
  {
    const tests = [
      { path: "/private-control/..", name: "GET /private-control/.. (raw dot-dot)" },
      { path: "/private-control/../", name: "GET /private-control/../ (raw dot-dot with slash)" },
      { path: "/private-control/../something", name: "GET /private-control/../something (relative hop)" },
      { path: `/private-control/${VALID_DEV_SECRET}/..`, name: "GET /private-control/<secret>/.. (traversal after secret)" },
      { path: "/admin/..", name: "GET /admin/.. (legacy admin traversal)" },
      { path: "/admin/../login", name: "GET /admin/../login (legacy admin nested traversal)" },
      { path: "/something/../admin", name: "GET /something/../admin (relative route to admin)" },
    ];

    for (const t of tests) {
      const res = await rawRequest(t.path);
      assert(res.status === 404, t.name, `expected 404, got ${res.status}`);
      // Must not be a redirect
      assert(res.status !== 301 && res.status !== 302, `${t.name} does not redirect`);
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 4: Bare Private-Control & Query Variations
  // -------------------------------------------------------------------------
  console.log("\n[Section 4] Bare Private-Control & Query Variations");
  {
    const tests = [
      { path: "/private-control", name: "GET /private-control (bare, no secret)" },
      { path: "/private-control/", name: "GET /private-control/ (bare with slash, no secret)" },
      { path: "/private-control?ref=test", name: "GET /private-control?ref=test (bare with query string)" },
      { path: "/private-control/?ref=test", name: "GET /private-control/?ref=test (slash with query string)" },
      { path: "/private-control//?ref=test", name: "GET /private-control//?ref=test (double slash with query)" },
    ];

    for (const t of tests) {
      const res = await rawRequest(t.path);
      assert(res.status === 404, t.name, `expected 404, got ${res.status}`);
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 5: Invalid Secrets
  // -------------------------------------------------------------------------
  console.log("\n[Section 5] Invalid Secrets");
  {
    const truncatedSecret = VALID_DEV_SECRET.slice(0, 20);
    const alteredSecret = VALID_DEV_SECRET.slice(0, -1) + (VALID_DEV_SECRET.endsWith("a") ? "b" : "a");

    const tests = [
      { path: "/private-control/wrong-secret", name: "GET /private-control/wrong-secret" },
      { path: "/private-control/wrong-secret/", name: "GET /private-control/wrong-secret/" },
      { path: "/private-control/wrong-secret/colleges", name: "GET /private-control/wrong-secret/colleges" },
      { path: "/private-control/12345", name: "GET /private-control/12345 (short secret)" },
      { path: "/private-control/admin", name: "GET /private-control/admin (guess 'admin')" },
      { path: "/private-control/login", name: "GET /private-control/login (guess 'login')" },
      { path: `/private-control/${truncatedSecret}`, name: "GET /private-control/<truncatedSecret>" },
      { path: `/private-control/${alteredSecret}`, name: "GET /private-control/<singleBitAlteredSecret>" },
      { path: `/private-control/${VALID_DEV_SECRET}x`, name: "GET /private-control/<secretWithExtraChar>" },
    ];

    for (const t of tests) {
      const res = await rawRequest(t.path);
      assert(res.status === 404, t.name, `expected 404, got ${res.status}`);
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 6: Legacy Admin Routes
  // -------------------------------------------------------------------------
  console.log("\n[Section 6] Legacy Admin Routes");
  {
    const tests = [
      { path: "/admin", name: "GET /admin" },
      { path: "/admin/", name: "GET /admin/" },
      { path: "/admin/login", name: "GET /admin/login" },
      { path: "/admin/colleges", name: "GET /admin/colleges" },
      { path: "/admin/users", name: "GET /admin/users" },
      { path: "/Admin", name: "GET /Admin (case variation)" },
      { path: "/ADMIN/LOGIN", name: "GET /ADMIN/LOGIN (uppercase variation)" },
      { path: "/ADMIN/COLLEGES", name: "GET /ADMIN/COLLEGES (uppercase colleges)" },
    ];

    for (const t of tests) {
      const res = await rawRequest(t.path);
      assert(res.status === 404, t.name, `expected 404, got ${res.status}`);
      // Verify no secret leak and no redirect header
      assert(!res.headers["location"], `${t.name} does not return redirect Location header`);
      assert(!res.body.includes(VALID_DEV_SECRET), `${t.name} does not leak secret`);
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 7: Valid Secret Route & Role Authorization Behavior
  // -------------------------------------------------------------------------
  console.log("\n[Section 7] Valid Secret Route & Role Authorization Behavior");
  {
    // A. Unauthenticated visitor -> 200 OK (serves SPA index.html, loads AdminLoginPage)
    const unauthRes = await rawRequest(`/private-control/${VALID_DEV_SECRET}`);
    assert(unauthRes.status === 200, "Unauthenticated visitor to /private-control/<secret> gets 200 OK");
    assert(unauthRes.body.includes("<html") || unauthRes.body.includes("<!DOCTYPE"), "Unauthenticated visitor receives SPA HTML");

    const unauthSlashRes = await rawRequest(`/private-control/${VALID_DEV_SECRET}/`);
    assert(unauthSlashRes.status === 200, "Unauthenticated visitor to /private-control/<secret>/ gets 200 OK");

    const unauthSubpathRes = await rawRequest(`/private-control/${VALID_DEV_SECRET}/colleges`);
    assert(unauthSubpathRes.status === 200, "Unauthenticated visitor to /private-control/<secret>/colleges gets 200 OK");

    const unauthQueryRes = await rawRequest(`/private-control/${VALID_DEV_SECRET}?tab=pending`);
    assert(unauthQueryRes.status === 200, "Unauthenticated visitor with query param gets 200 OK");

    // B. Register & Authenticate as a Synthetic Student (Isolated Test Fixture)
    const syntheticStudentEmail = `student-routing-${Date.now()}@test.edu.in`;
    const studentReg = await jsonPost("/api/auth/register", {
      fullName: "Regression Test Student",
      email: syntheticStudentEmail,
      password: "Password@123",
      rollNumber: `TEST-${Date.now().toString().slice(-6)}`,
      college: "Regression Testing Engineering College",
      course: "B.Tech",
      branch: "Computer Science",
      semester: 6,
      cgpa: 8.5,
      graduationYear: 2026,
    });
    assert(studentReg.status === 201, "Synthetic student registered successfully");

    const studentLogin = await jsonPost("/api/auth/login", {
      email: syntheticStudentEmail,
      password: "Password@123",
    });
    const studentToken = studentLogin.json.token;
    assert(studentLogin.status === 200 && studentToken, "Student logged in successfully");

    // Student visits private control -> 403 Forbidden
    const studentAccessRes = await rawRequest(`/private-control/${VALID_DEV_SECRET}`, {
      Cookie: `placement_session_token=${studentToken}`,
    });
    assert(studentAccessRes.status === 403, "Student accessing /private-control/<secret> receives HTTP 403 Forbidden");
    assert(studentAccessRes.body.includes("403 Forbidden") && studentAccessRes.body.includes("Access Denied"), "Student receives styled 403 Access Denied HTML");

    // C. Register & Authenticate as Placement Officer
    const uniqueEmail = `officer-regtest-${Date.now()}@regtest-college.edu.in`;
    const collegeReg = await jsonPost("/api/college/register", {
      collegeName: "Regression Testing College",
      code: "RTC-01",
      city: "Bengaluru",
      state: "Karnataka",
      officerName: "Prof. Test Officer",
      officerEmail: uniqueEmail,
      officerPhone: "+91 9988776655",
      officerDesignation: "Placement Head",
      password: "Password@123",
    });
    assert(collegeReg.status === 201, "College Officer registered successfully");

    const officerLogin = await jsonPost("/api/auth/login", {
      email: uniqueEmail,
      password: "Password@123",
    });
    const officerToken = officerLogin.json.token;
    assert(officerLogin.status === 200 && officerToken, "College Officer logged in successfully");

    // Officer visits private control -> 403 Forbidden
    const officerAccessRes = await rawRequest(`/private-control/${VALID_DEV_SECRET}`, {
      Cookie: `placement_session_token=${officerToken}`,
    });
    assert(officerAccessRes.status === 403, "Placement Officer accessing /private-control/<secret> receives HTTP 403 Forbidden");

    // D. Authenticate as Admin
    const adminLogin = await jsonPost("/api/auth/login", {
      email: "admin@placementos.com",
      password: "Password@123",
    });
    const adminToken = adminLogin.json.token;
    assert(adminLogin.status === 200 && adminLogin.json.user?.role === "admin", "Admin logged in successfully");

    // Admin visits private control -> 200 OK
    const adminAccessRes = await rawRequest(`/private-control/${VALID_DEV_SECRET}`, {
      Cookie: `placement_session_token=${adminToken}`,
    });
    assert(adminAccessRes.status === 200, "Super Admin accessing /private-control/<secret> receives HTTP 200 OK");

    // E. Independent /api/admin/colleges RBAC enforcement
    const apiUnauth = await fetch(`${BASE_URL}/api/admin/colleges`);
    assert(apiUnauth.status === 401, "GET /api/admin/colleges (unauthenticated) returns 401 Unauthorized");

    const apiStudent = await fetch(`${BASE_URL}/api/admin/colleges`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(apiStudent.status === 403, "GET /api/admin/colleges (Student) returns 403 Forbidden");

    const apiOfficer = await fetch(`${BASE_URL}/api/admin/colleges`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    assert(apiOfficer.status === 403, "GET /api/admin/colleges (Placement Officer) returns 403 Forbidden");

    const apiAdmin = await fetch(`${BASE_URL}/api/admin/colleges`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const apiAdminData = await apiAdmin.json().catch(() => ({}));
    assert(apiAdmin.status === 200 && Array.isArray(apiAdminData.colleges), "GET /api/admin/colleges (Admin) returns 200 OK with colleges array");
  }

  // -------------------------------------------------------------------------
  // SECTION 8: Preservation of Public, Student, and College Routes
  // -------------------------------------------------------------------------
  console.log("\n[Section 8] Preservation of Public, Student, and College Routes");
  {
    const routes = [
      { path: "/", name: "GET / (landing page)" },
      { path: "/login", name: "GET /login (student login)" },
      { path: "/register", name: "GET /register (student register)" },
      { path: "/forgot-password", name: "GET /forgot-password (forgot password)" },
      { path: "/dashboard", name: "GET /dashboard (student dashboard)" },
      { path: "/college/login", name: "GET /college/login (college login)" },
      { path: "/college/register", name: "GET /college/register (college register)" },
      { path: "/college/dashboard", name: "GET /college/dashboard (college dashboard)" },
      { path: "/privacy", name: "GET /privacy (privacy policy)" },
      { path: "/terms", name: "GET /terms (terms of service)" },
      { path: "/ai-disclaimer", name: "GET /ai-disclaimer (ai disclaimer)" },
      { path: "/about", name: "GET /about (about page)" },
      { path: "/features", name: "GET /features (features page)" },
      { path: "/contact", name: "GET /contact (contact page)" },
      { path: "/faq", name: "GET /faq (faq page)" },
      { path: "/api/health", name: "GET /api/health (system health API)" },
    ];

    for (const r of routes) {
      const res = await rawRequest(r.path);
      assert(res.status === 200, r.name, `expected 200, got ${res.status}`);
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 9: Confidentiality & Zero Secret Leakage Check
  // -------------------------------------------------------------------------
  console.log("\n[Section 9] Confidentiality & Information Leakage Audit");
  {
    // Probe legacy admin
    const legacyProbe = await rawRequest("/admin");
    assert(!legacyProbe.body.includes(VALID_DEV_SECRET), "Legacy /admin response contains zero secret tokens");
    assert(!legacyProbe.body.toLowerCase().includes("private-control"), "Legacy /admin response does not mention private-control");

    // Probe malformed private control
    const malformedProbe = await rawRequest("/private-control//");
    assert(!malformedProbe.body.includes(VALID_DEV_SECRET), "Malformed /private-control// contains zero secret tokens");
    assert(malformedProbe.status === 404, "Malformed /private-control// strictly returns opaque 404");
  }

  console.log("\n================================================================================");
  console.log(`REGRESSION TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runRegressionSuite().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
