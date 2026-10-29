import React from "react";
import { PublicLayout } from "../components/layout/PublicLayout";
import { FileText, AlertCircle, CheckCircle, Scale, Shield } from "lucide-react";

interface TermsOfServiceProps {
  user?: any | null;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ user }) => {
  return (
    <PublicLayout
      user={user}
      pageTitle="Terms of Service"
      badge="Effective Date: October 2026"
    >
      <div className="space-y-10 text-neutral-800 leading-relaxed text-sm sm:text-base">
        {/* Intro */}
        <section className="space-y-3">
          <p>
            Welcome to <strong>Placement OS</strong>. These Terms of Service
            ("Terms") govern your access to and use of the Placement OS
            web application, developed by <strong>Raunak Chaudhary</strong>.
          </p>
          <p>
            By registering an account, accessing, or using Placement OS, you
            agree to be legally bound by these Terms. If you do not agree, please
            refrain from using the platform.
          </p>
        </section>

        {/* 1. Appropriate Use of the Platform */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <div className="flex items-center gap-2.5 text-[#111315]">
            <CheckCircle className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              1. Platform Purpose & Appropriate Use
            </h2>
          </div>
          <p>
            Placement OS is designed as an educational tool to help college
            students evaluate their skills, prepare for campus recruitment, and
            practice mock interviews.
          </p>
          <p>You agree to use Placement OS solely for lawful, authorized purposes and agree NOT to:</p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-700">
            <li>
              Submit false academic credentials, fake roll numbers, or deceptive
              student identities.
            </li>
            <li>
              Attempt to reverse-engineer, decompile, or extract the source code
              of our proprietary readiness assessment algorithms.
            </li>
            <li>
              Automate requests, scrape content, or abuse server endpoints
              leading to denial of service or excessive API rate limits.
            </li>
            <li>
              Upload malicious files, viruses, or harmful payloads disguised as
              resumes or documents.
            </li>
          </ul>
        </section>

        {/* 2. Account Responsibilities */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <div className="flex items-center gap-2.5 text-[#111315]">
            <Shield className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              2. Student Accounts & Security Responsibilities
            </h2>
          </div>
          <p>
            To utilize the platform, you must register a student account. You are
            solely responsible for maintaining the confidentiality of your
            credentials (email and password).
          </p>
          <p>
            Each account is intended for individual use. You agree to notify us
            immediately at{" "}
            <a
              href="mailto:raunakkchy@gmail.com"
              className="text-[#FF6B00] hover:underline font-medium"
            >
              raunakkchy@gmail.com
            </a>{" "}
            if you suspect unauthorized access to your account.
          </p>
        </section>

        {/* 3. AI-Generated Content & Advisory Nature */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <div className="flex items-center gap-2.5 text-[#111315]">
            <AlertCircle className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              3. AI Limitations & Advisory Disclaimers
            </h2>
          </div>
          <p>
            Placement OS utilizes generative artificial intelligence (including
            Google Gemini models) for mock interview simulations, question
            generation, and feedback delivery.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-700">
            <li>
              <strong>Advisory Nature:</strong> All scores, feedback, strengths,
              weaknesses, and roadmaps are indicative educational aids, not
              definitive assessments of human capability.
            </li>
            <li>
              <strong>No Guarantee of Hiring:</strong> Placement OS does not
              guarantee employment, campus placement, interview invitations, or
              selection with any hiring organization.
            </li>
            <li>
              <strong>Independent Verification:</strong> You are encouraged to
              independently verify interview advice and company hiring criteria
              with your college placement cell and prospective employers.
            </li>
          </ul>
        </section>

        {/* 4. Intellectual Property */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <div className="flex items-center gap-2.5 text-[#111315]">
            <Scale className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              4. Intellectual Property & Proprietary Rights
            </h2>
          </div>
          <p>
            The Placement OS interface, visual branding, Readiness Score
            scoring formulas, and system architecture are the intellectual
            property of <strong>Raunak Chaudhary</strong> and platform
            contributors.
          </p>
          <p>
            You retain ownership of the original text and resume files you
            upload. By uploading your resume, you grant Placement OS a limited,
            non-exclusive license to process and analyze the content strictly for
            delivering your career insights.
          </p>
        </section>

        {/* 5. Pricing and Billing */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#111315]">
            5. Fees, Subscriptions & Billing
          </h2>
          <p>
            In the current release, Placement OS is provided to students free of
            charge. No payment details, credit card numbers, or subscription fees
            are required or collected.
          </p>
          <p>
            If premium institutional features or advanced training tiers are
            introduced in future releases, advance notice and clear pricing
            terms will be posted prior to any charges.
          </p>
        </section>

        {/* 6. Service Availability & Modification */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#111315]">
            6. Service Availability & Modifications
          </h2>
          <p>
            We strive for uninterrupted platform uptime, but Placement OS is
            provided on an <strong>"AS-IS"</strong> and <strong>"AS-AVAILABLE"</strong>{" "}
            basis. We reserve the right to modify, update, or temporarily
            suspend services for maintenance or infrastructure upgrades without
            liability.
          </p>
        </section>

        {/* 7. Suspension & Termination */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#111315]">
            7. Account Suspension & Termination
          </h2>
          <p>
            We reserve the right to suspend or terminate accounts that breach
            these Terms or exhibit abusive behavior. Students may close their
            account at any time via <em>Profile → Delete Account</em>.
          </p>
        </section>

        {/* 8. Legal Jurisdiction Notice */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <div className="flex items-center gap-2.5 text-[#111315]">
            <FileText className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              8. Legal Jurisdiction & Contact
            </h2>
          </div>
          <div className="p-4 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs sm:text-sm space-y-2">
            <p className="font-semibold text-neutral-900">
              Notice regarding legal entity & governing law:
            </p>
            <p>
              <em>
                [Note requiring owner confirmation: Formal registered corporate entity,
                registered office address, and statutory dispute resolution venue
                are subject to official confirmation by platform owner Raunak Chaudhary.]
              </em>
            </p>
            <p>
              For formal legal notices, clarifications, or terms inquiries,
              reach out directly to:
            </p>
            <p>
              <strong>Placement OS Legal & Compliance</strong> ·{" "}
              <a
                href="mailto:legal@placementos.com"
                className="text-[#FF6B00] hover:underline font-medium"
              >
                legal@placementos.com
              </a>
            </p>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};
