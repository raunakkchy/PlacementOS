import React from "react";
import { PublicLayout } from "../components/layout/PublicLayout";
import {
  BarChart3,
  Video,
  FileCheck2,
  Route,
  Briefcase,
  Cpu,
  CheckCircle2,
} from "lucide-react";

interface FeaturesPageProps {
  user?: any | null;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ user }) => {
  const features = [
    {
      icon: BarChart3,
      title: "Placement Readiness Score (0-100)",
      description:
        "A holistic scoring engine synthesizing your performance across DSA, Aptitude, Core CS subjects, and Communication into one actionable metric.",
      bullets: [
        "Dynamic recalculation as you complete practice tasks",
        "Visual breakdown by core technical and soft skill pillars",
        "Target threshold comparison against average hiring cutoffs",
      ],
    },
    {
      icon: Video,
      title: "Real-Time AI Video Mock Interviews",
      description:
        "Immersive interview practice powered by the Google Gemini API with camera and microphone integration.",
      bullets: [
        "Contextual technical questions tailored to your target job profile",
        "Live speech transcription and pacing analysis",
        "Immediate post-interview feedback highlighting strengths and specific improvement areas",
      ],
    },
    {
      icon: Route,
      title: "Personalized Skill Roadmaps",
      description:
        "Step-by-step curriculum generated to systematically close the gaps between your current skill level and your dream role.",
      bullets: [
        "Phased progression covering fundamentals through advanced problem-solving",
        "Checklist tracking with live progress synchronization",
        "Regeneration option to adapt as your career targets change",
      ],
    },
    {
      icon: FileCheck2,
      title: "Resume Parsing & Skill Extraction",
      description:
        "Fast server-side document parsing supporting PDF and Word (DOCX) resumes.",
      bullets: [
        "Automatic extraction of skills, education, and internship experiences",
        "Pre-populates your candidate profile during onboarding",
        "Secure in-memory processing with no unauthorized data sharing",
      ],
    },
    {
      icon: Briefcase,
      title: "AI Job Role Matching & Drive Tracking",
      description:
        "Intelligent compatibility scoring comparing your student profile with campus placement drives.",
      bullets: [
        "Percentage match calculated based on required tech stacks",
        "Identifies missing prerequisite skills before application",
        "Centralized drive information and status tracking",
      ],
    },
    {
      icon: Cpu,
      title: "Gemini AI Placement Intelligence",
      description:
        "Modern integration with Google GenAI SDK (`@google/genai`) providing low-latency, context-aware evaluations.",
      bullets: [
        "Nuanced understanding of code logic and architecture questions",
        "Constructive feedback without generic boilerplate responses",
        "Continually calibrated for collegiate placement scenarios",
      ],
    },
  ];

  return (
    <PublicLayout
      user={user}
      pageTitle="Platform Features"
      badge="Full Capabilities Overview"
    >
      <div className="space-y-10 text-neutral-800 leading-relaxed text-sm sm:text-base">
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111315]">
            Engineered for Comprehensive Career Readiness
          </h2>
          <p className="text-neutral-700">
            Placement OS provides a cohesive suite of tools designed to guide
            students from their first semester preparation through final company
            placement rounds.
          </p>
        </section>

        {/* Feature Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E5E3DE]">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-xl bg-white border border-[#E5E3DE] hover:border-neutral-400 transition-colors space-y-3 shadow-2xs"
              >
                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-[#FF6B00]">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#111315]">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-1.5 pt-2 border-t border-neutral-100">
                  {feature.bullets.map((b, bIdx) => (
                    <li
                      key={bIdx}
                      className="text-xs text-neutral-600 flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6B00] shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      </div>
    </PublicLayout>
  );
};
