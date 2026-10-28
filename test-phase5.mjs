// test-phase5.mjs
// Comprehensive automated verification test suite for Phase 5: College Placement Dashboard, Skill-Gap Analytics & Reports

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=================================================");
  console.log("STARTING PHASE 5 AUTOMATED TEST SUITE");
  console.log("=================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate Admin
    console.log("\n[Test 1] Authenticating Admin...");
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@placementos.com", password: "Password@123" }),
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminLoginData.user.role === "admin", "Admin logged in successfully");
    const adminToken = adminLoginData.token;

    // 2. Register & Verify College
    console.log("\n[Test 2] Registering & Verifying College for Analytics...");
    const collegeEmail = `officer-analytics-${Date.now()}@analytics-college.edu.in`;
    const collegeRegRes = await fetch(`${BASE_URL}/api/college/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collegeName: "Analytics Institute of Tech",
        code: "AIT-AN",
        city: "Mumbai",
        state: "Maharashtra",
        officerName: "Dr. Ananya Roy",
        officerEmail: collegeEmail,
        officerPhone: "+91 9811122233",
        officerDesignation: "Head of Placement Analytics",
        password: "Password@123",
      }),
    });
    const collegeRegData = await collegeRegRes.json();
    const collegeId = collegeRegData.college.id;

    // Verify via admin
    await fetch(`${BASE_URL}/api/admin/colleges/${collegeId}/verify`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ verificationMethod: "Accreditation Audit" }),
    });

    const officerLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: collegeEmail, password: "Password@123" }),
    });
    const officerLoginData = await officerLoginRes.json();
    const officerToken = officerLoginData.token;

    // 3. Generate Invitation Code
    console.log("\n[Test 3] Generating college invitation code...");
    const invRes = await fetch(`${BASE_URL}/api/college/invitations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${officerToken}`,
      },
      body: JSON.stringify({ label: "Analytics Cohort", maxUses: 20, validityDays: 30 }),
    });
    const invData = await invRes.json();
    assert(invRes.status === 201 && invData.invitation.code, "Invitation code generated successfully");
    const inviteCode = invData.invitation.code;

    // 4. Register and Link Student A with full consent
    console.log("\n[Test 4] Registering Student A and linking with full consent...");
    const studentEmail = `student-a-${Date.now()}@example.com`;
    const studentRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Rahul Verma",
        email: studentEmail,
        password: "Password@123",
        course: "B.Tech",
        branch: "Computer Science",
        semester: 8,
        cgpa: 8.9,
      }),
    });
    const studentRegData = await studentRegRes.json();
    const studentToken = studentRegData.token;
    const studentId = studentRegData.user.id;

    // Link student
    const linkRes = await fetch(`${BASE_URL}/api/student/link-college`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        code: inviteCode,
        consent: {
          shareAcademic: true,
          shareSkillRoadmap: true,
          shareInterviewScores: true,
        },
      }),
    });
    const linkData = await linkRes.json();
    const membershipId = linkData.membership.id;

    // Officer approves Student A
    await fetch(`${BASE_URL}/api/college/memberships/${membershipId}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${officerToken}` },
    });

    // 5. Test College Analytics Endpoint
    console.log("\n[Test 5] Testing College Analytics endpoint...");
    const analyticsRes = await fetch(`${BASE_URL}/api/college/analytics`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    const analyticsData = await analyticsRes.json();
    assert(analyticsRes.status === 200 && analyticsData.success === true, "Analytics endpoint returns 200 success");
    assert(analyticsData.analytics.activeLinkedStudents === 1, "Active linked students count is 1");
    assert(analyticsData.analytics.studentsWithConsent === 1, "Consented students count is 1");
    assert(Array.isArray(analyticsData.analytics.topMissingSkills), "Top missing skills array present");
    assert(Array.isArray(analyticsData.analytics.readinessBands), "Readiness bands array present");

    // 6. Test Individual Student Progress Detail Endpoint
    console.log("\n[Test 6] Testing Individual Student Progress Detail endpoint...");
    const studentProgressRes = await fetch(`${BASE_URL}/api/college/students/${studentId}/progress`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    const studentProgressData = await studentProgressRes.json();
    assert(studentProgressRes.status === 200 && studentProgressData.success === true, "Student progress detail retrieved successfully");
    assert(studentProgressData.student.fullName === "Rahul Verma", "Student full name permitted and correct");

    // 7. Test Cross-College Isolation on Progress Detail
    console.log("\n[Test 7] Testing Cross-College Isolation on student progress...");
    const randomOfficerToken = "invalid-or-other-officer-token";
    const crossAccessRes = await fetch(`${BASE_URL}/api/college/students/${studentId}/progress`, {
      headers: { Authorization: `Bearer ${randomOfficerToken}` },
    });
    assert(crossAccessRes.status === 401 || crossAccessRes.status === 403, "Unauthorized officer blocked from viewing student progress (401/403)");

    // 8. Test CSV Report Export
    console.log("\n[Test 8] Testing CSV Report export...");
    const csvExportRes = await fetch(`${BASE_URL}/api/college/reports/csv`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    const csvText = await csvExportRes.text();
    assert(csvExportRes.status === 200 && csvText.includes("Rahul Verma"), "CSV report exported successfully with student record");
    assert(csvExportRes.headers.get("content-type").includes("text/csv"), "CSV content type correctly set");

    // 9. Test PDF Report Export
    console.log("\n[Test 9] Testing PDF Report export...");
    const pdfExportRes = await fetch(`${BASE_URL}/api/college/reports/pdf`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    const pdfBuffer = await pdfExportRes.arrayBuffer();
    assert(pdfExportRes.status === 200 && pdfBuffer.byteLength > 100, "PDF report exported successfully with valid binary buffer");
    assert(pdfExportRes.headers.get("content-type").includes("application/pdf"), "PDF content type correctly set");

    // 10. Test Consent Withdrawal Removes Access
    console.log("\n[Test 10] Testing consent withdrawal removes access...");
    // Student withdraws interview score consent
    await fetch(`${BASE_URL}/api/student/college-consent`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ shareInterviewScores: false }),
    });

    const postWithdrawRes = await fetch(`${BASE_URL}/api/college/students/${studentId}/progress`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    const postWithdrawData = await postWithdrawRes.json();
    assert(postWithdrawRes.status === 200, "Progress detail accessible");
    assert(postWithdrawData.student.readinessScore === null, "Readiness score strictly withheld after consent withdrawal");

    console.log("\n=================================================");
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution exception:", err);
    process.exit(1);
  }
}

runTests();
