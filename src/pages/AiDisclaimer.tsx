import React from "react";
import { PublicLayout } from "../components/layout/PublicLayout";
import { ShieldAlert, AlertTriangle, Lightbulb, CheckCircle2, Bot } from "lucide-react";

interface AiDisclaimerProps {
  user?: any | null;
}

export const AiDisclaimer: React.FC<AiDisclaimerProps> = ({ user }) => {
  return (
    <PublicLayout
      user={user}
      pageTitle="AI Disclaimer & Limitations"
      badge="Important Student Notice"
    >
      <div className="space-y-10 text-neutral-800 leading-relaxed text-sm sm:text-base">
        {/* Core Limitation Notice Banner */}
        <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-neutral-900 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
            <ShieldAlert className="w-5 h-5 text-[#FF6B00]" />
            <h3>Summary Statement</h3>
          </div>
          <p className="text-sm font-medium leading-relaxed">
            AI-generated feedback may be inaccurate or incomplete. Placement OS
            supports career preparation and does not guarantee interviews,
            employment or placement.
          </p>
        </div>

        {/* 1. Nature of Generative AI */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2.5 text-[#111315]">
            <Bot className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              1. Nature of AI-Powered Features
            </h2>
          </div>
          <p>
            Placement OS integrates large language models developed by Google
            (Gemini API) to automate interview question generation, conduct mock
            interview practice sessions, evaluate candidate answers, and suggest
            customized learning roadmaps.
          </p>
          <p>
            While these AI models are trained on extensive data, they are
            probabilistic systems. They generate plausible responses based on
            statistical patterns rather than conscious understanding. Consequently,
            AI outputs may occasionally contain factual inaccuracies, omissions,
            or outdated programming idioms.
          </p>
        </section>

        {/* 2. Estimates vs Objective Truth */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <div className="flex items-center gap-2.5 text-[#111315]">
            <AlertTriangle className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              2. Scores and Metrics Are Educational Estimates
            </h2>
          </div>
          <p>
            Your Placement Readiness Score (including ratings in DSA, Aptitude,
            Core Technical Subjects, and Communication) represents an algorithmic
            simulation designed for benchmark guidance.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-700">
            <li>
              Scores reflect how closely your answers match standard technical
              interview patterns programmed into our prompts.
            </li>
            <li>
              A high Placement OS readiness score is an indicator of systematic
              preparation, but does <strong>NOT</strong> assure selection in
              on-campus or off-campus recruitment drives.
            </li>
            <li>
              A low readiness score highlights areas for potential skill
              refinement, rather than a definitive reflection of your abilities.
            </li>
          </ul>
        </section>

        {/* 3. Non-Guarantee of Employment */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <div className="flex items-center gap-2.5 text-[#111315]">
            <ShieldAlert className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              3. Strict No-Guarantee Policy
            </h2>
          </div>
          <p>
            <strong>
              Placement OS does not guarantee job placement, interview calls,
              internships, or employment offers of any kind.
            </strong>
          </p>
          <p>
            Company hiring decisions depend on a wide array of factors beyond the
            scope of this platform, including corporate hiring quotas, in-person
            interviewer evaluations, academic cutoff criteria, competitive peer
            performance, and institutional placement policies.
          </p>
        </section>

        {/* 4. Independent Verification Required */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <div className="flex items-center gap-2.5 text-[#111315]">
            <Lightbulb className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              4. Independent Verification & Prudence
            </h2>
          </div>
          <p>
            Students should always cross-reference advice and technical answers
            provided by Placement OS with:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-neutral-700">
            <li>Standard university textbooks and official academic curricula.</li>
            <li>Authoritative technical documentation (e.g., MDN, official language specs).</li>
            <li>Official company job descriptions and placement cell announcements.</li>
            <li>Direct feedback from faculty mentors and industry professionals.</li>
          </ul>
        </section>

        {/* 5. Continuous Improvement */}
        <section className="space-y-4 pt-4 border-t border-[#E5E3DE]">
          <div className="flex items-center gap-2.5 text-[#111315]">
            <CheckCircle2 className="w-5 h-5 text-[#FF6B00]" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              5. Reporting Issues & Improvement
            </h2>
          </div>
          <p>
            If you encounter nonsensical, biased, or incorrect feedback during a
            mock interview or within a generated roadmap, please report it to us.
            User feedback helps us calibrate model prompts and scoring thresholds.
          </p>
          <p>
            Contact the engineering team with suggestions or bug reports:{" "}
            <a
              href="mailto:support@placementos.com"
              className="text-[#FF6B00] hover:underline font-medium"
            >
              support@placementos.com
            </a>
            .
          </p>
        </section>
      </div>
    </PublicLayout>
  );
};
