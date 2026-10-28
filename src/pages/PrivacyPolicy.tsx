import React from "react";
import { PublicLayout } from "../components/layout/PublicLayout";
import { ShieldCheck, Database, Cpu, UserX, Lock, Mail } from "lucide-react";

interface PrivacyPolicyProps {
  user?: any | null;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ user }) => {
  return (
    <PublicLayout
      user={user}
      pageTitle="Privacy Policy"
      badge="Effective Date: October 2026"
    >
      <div className="space-y-10 text-neutral-800 leading-relaxed text-sm sm:text-base">
        {/* Intro */}
        <section className="space-y-3">
          <p>
            Welcome to <strong>Placement OS</strong>. We are committed to
            protecting your privacy and handling your academic and career data
            transparently and securely. This Privacy Policy details our data
            practices for the Placement OS application, developed by{" "}
            <strong>Raunak Chaudhary</strong>.
          </p>
          <p>
            By creating an account or using Placement OS, you acknowledge the
            collection, storage, and processing of your information as described
            in this policy.
          </p>
        </section>

        {/* 1. Information We Collect */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <div className="flex items-center gap-2.5 text-[#111315]">
            <Lock className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              1. Information We Collect
            </h2>
          </div>
          <p>
            Placement OS collects only information necessary to assess your
            placement readiness, build customized preparation roadmaps, and
            conduct AI-driven mock interviews:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-700">
            <li>
              <strong>Account & Academic Profile:</strong> Full name, college roll
              number, email address, degree program (e.g., B.Tech, Diploma,
              BCA), semester, academic branch/specialization, and cumulative
              grade point average (CGPA).
            </li>
            <li>
              <strong>Security Credentials:</strong> Passwords, which are
              salted and hashed using industry-standard <code>bcryptjs</code> before
              being stored in our database. Plaintext passwords are never logged,
              transmitted, or visible to system administrators.
            </li>
            <li>
              <strong>Career Preferences & Skills:</strong> Desired target job
              roles (such as Frontend Developer, Full-Stack Developer, Data
              Engineer), self-reported technical skills, and placement interests.
            </li>
            <li>
              <strong>Resumes & Career Documents:</strong> Uploaded resume files
              in PDF or Microsoft Word (DOCX) formats, processed on our server
              to extract key competencies, project histories, and qualifications.
            </li>
            <li>
              <strong>Mock Interview Submissions:</strong> Spoken responses
              transcribed via browser speech recognition, video session state,
              response timings, and self-evaluations generated during interactive
              interview rooms.
            </li>
          </ul>
        </section>

        {/* 2. Resume & Document Processing */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <div className="flex items-center gap-2.5 text-[#111315]">
            <Database className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              2. Resume, Academic & Document Processing
            </h2>
          </div>
          <p>
            When you upload a resume, file contents are processed using
            open-source document parsers (<code>pdf-parse</code> for PDF files and{" "}
            <code>mammoth</code> for DOCX documents) via memory buffers managed
            by <code>multer</code>.
          </p>
          <p>
            The extracted text is parsed to identify skills, coursework, and
            projects. This information directly informs your 4-pillar Readiness
            Score (DSA, Aptitude, Core Technical Subjects, and Communication)
            and is matched against real-world campus recruitment job profiles.
          </p>
        </section>

        {/* 3. AI Processing with Google Gemini */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <div className="flex items-center gap-2.5 text-[#111315]">
            <Cpu className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              3. Artificial Intelligence & Third-Party Processing
            </h2>
          </div>
          <p>
            Placement OS leverages Google Gemini AI models via the official{" "}
            <code>@google/genai</code> SDK to deliver core intelligent features:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-700">
            <li>
              <strong>Interview Question Generation:</strong> Contextual questions
              generated according to your chosen role and experience level.
            </li>
            <li>
              <strong>Real-Time Answer Evaluation:</strong> Critique of student
              answers assessing technical depth, structure, and communication
              clarity.
            </li>
            <li>
              <strong>Adaptive Roadmaps:</strong> Step-by-step preparation tasks
              dynamically tailored to address your specific skill gaps.
            </li>
          </ul>
          <p className="bg-amber-50/70 border-l-4 border-[#FF6B00] p-4 text-xs sm:text-sm text-neutral-700 rounded-r-md">
            <strong>Disclosure:</strong> Operational text prompts containing
            resume excerpts and interview answers are transmitted over encrypted
            TLS connections to Google Gemini APIs to generate evaluations. We do
            not sell student data to external data brokers or advertisers.
          </p>
        </section>

        {/* 4. Purpose and Lawful Basis */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#111315]">
            4. Purpose & Lawful Basis of Processing
          </h2>
          <p>We process your personal information on the following grounds:</p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-700">
            <li>
              <strong>Service Delivery:</strong> To create your student account,
              authenticate your sessions, calculate placement scores, and provide
              career insights.
            </li>
            <li>
              <strong>Educational Enhancement:</strong> To assist you in preparing
              for campus recruitment through feedback and practice.
            </li>
            <li>
              <strong>System Security:</strong> To prevent unauthorized access,
              enforce rate limits, and protect the integrity of the platform.
            </li>
          </ul>
        </section>

        {/* 5. Data Storage, Retention & Security */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <div className="flex items-center gap-2.5 text-[#111315]">
            <ShieldCheck className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              5. Data Storage, Security & Retention
            </h2>
          </div>
          <p>
            Your account data, readiness scores, and roadmaps are stored in a
            cloud-hosted MongoDB Atlas database configured with TLS encryption in
            transit and encryption at rest.
          </p>
          <p>
            Session security is enforced using signed JSON Web Tokens (JWT) and
            HTTP-only authentication cookies to protect against unauthorized
            token interception and cross-site scripting risks.
          </p>
          <p>
            We retain your data for as long as your account remains active. If
            you discontinue use, you may initiate complete deletion at any time.
          </p>
        </section>

        {/* 6. Account Deletion and Rights */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <div className="flex items-center gap-2.5 text-[#111315]">
            <UserX className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              6. Your Rights & Account Deletion Procedure
            </h2>
          </div>
          <p>
            You maintain full control over your personal data. You have the right
            to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-700">
            <li>Review and update your profile details via the Profile Drawer.</li>
            <li>Export or inspect your calculated readiness scores and roadmaps.</li>
            <li>
              <strong>Permanently Delete Your Account:</strong> You can initiate
              self-service account deletion anytime directly within the
              application by navigating to <em>Profile → Delete Account</em>.
              Executing deletion permanently deletes your student profile,
              academic records, scores, roadmaps, and interview histories from
              our MongoDB database.
            </li>
          </ul>
        </section>

        {/* 7. Contact Information */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <div className="flex items-center gap-2.5 text-[#111315]">
            <Mail className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              7. Privacy Contact & Policy Updates
            </h2>
          </div>
          <p>
            If you have questions, concerns, or requests regarding this Privacy
            Policy or your personal data, please contact the developer:
          </p>
          <div className="p-4 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs sm:text-sm space-y-1">
            <p>
              <strong>Developer & Data Controller:</strong> Raunak Chaudhary
            </p>
            <p>
              <strong>Email:</strong>{" "}
              <a
                href="mailto:raunakkchy@gmail.com"
                className="text-[#FF6B00] hover:underline font-medium"
              >
                raunakkchy@gmail.com
              </a>
            </p>
            <p>
              <strong>Platform:</strong> Placement OS (
              <em>Placement Intelligence & Student Career Readiness</em>)
            </p>
          </div>
          <p className="text-xs text-neutral-500">
            We reserve the right to revise this policy periodically. Any changes
            will be updated directly on this page with an updated effective date.
          </p>
        </section>
      </div>
    </PublicLayout>
  );
};
