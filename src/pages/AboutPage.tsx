import React from "react";
import { PublicLayout } from "../components/layout/PublicLayout";
import { Compass, Target, Code, GraduationCap, Award } from "lucide-react";

interface AboutPageProps {
  user?: any | null;
}

export const AboutPage: React.FC<AboutPageProps> = ({ user }) => {
  return (
    <PublicLayout
      user={user}
      pageTitle="About Placement OS"
      badge="Career Readiness Operating System"
    >
      <div className="space-y-10 text-neutral-800 leading-relaxed text-sm sm:text-base">
        {/* Hero Concept */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111315]">
            Bridging the Gap Between College Curriculum and Industry Hiring
          </h2>
          <p className="text-base text-neutral-700 leading-relaxed">
            <strong>Placement OS</strong> is an AI-powered adaptive career
            readiness platform created to give engineering and computer science
            students a structured, data-driven approach to cracking campus
            placements.
          </p>
          <p>
            Campus recruitment has evolved far beyond traditional resumes.
            Modern tech companies demand strong Data Structures & Algorithms
            (DSA) fundamentals, sharp aptitude, deep computer science core
            understanding, and clear technical communication. Placement OS unifies
            all these dimensions into one single cohesive operating system.
          </p>
        </section>

        {/* Core Pillars */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#111315]">
            Our Four Foundational Pillars
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-white border border-[#E5E3DE] space-y-2">
              <div className="flex items-center gap-2 text-[#111315] font-semibold">
                <Target className="w-4 h-4 text-[#FF6B00]" />
                <h4>Quantitative Readiness Scoring</h4>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600">
                A dynamic 0–100 benchmark evaluating candidate readiness across
                DSA, Aptitude, Core Subjects, and Communication.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white border border-[#E5E3DE] space-y-2">
              <div className="flex items-center gap-2 text-[#111315] font-semibold">
                <Compass className="w-4 h-4 text-[#FF6B00]" />
                <h4>Adaptive Learning Roadmaps</h4>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600">
                Personalized task phases that evolve with student test performance
                and interview feedback, zeroing in on high-impact gaps.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white border border-[#E5E3DE] space-y-2">
              <div className="flex items-center gap-2 text-[#111315] font-semibold">
                <Code className="w-4 h-4 text-[#FF6B00]" />
                <h4>Real-Time AI Mock Interviews</h4>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600">
                Voice and video enabled interactive mock sessions powered by
                Gemini AI with real-time speech evaluation and feedback.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white border border-[#E5E3DE] space-y-2">
              <div className="flex items-center gap-2 text-[#111315] font-semibold">
                <Award className="w-4 h-4 text-[#FF6B00]" />
                <h4>Intelligent Role Matching</h4>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600">
                Direct matching with company drive requirements to highlight
                role compatibility and specific preparation recommendations.
              </p>
            </div>
          </div>
        </section>

        {/* Developer Attribution Section */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <div className="flex items-center gap-2.5 text-[#111315]">
            <GraduationCap className="w-5 h-5 text-[#FF6B00]" />
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">
              Developer & Project Origin
            </h3>
          </div>
          <div className="p-5 rounded-xl bg-white border border-[#E5E3DE] space-y-3">
            <p className="text-sm font-medium text-neutral-900">
              Placement OS is designed and developed by{" "}
              <strong>Raunak Chaudhary</strong>.
            </p>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Built with modern React 19, TypeScript, Node.js, Express, MongoDB
              Atlas, and Google Gemini API, the platform was engineered to replace
              disjointed spreadsheets and guesswork with a clean, high-performance
              SaaS experience for collegiate placement success.
            </p>
            <div className="pt-2">
              <a
                href="mailto:support@placementos.com"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF6B00] hover:underline"
              >
                Contact Support (support@placementos.com) →
              </a>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};
