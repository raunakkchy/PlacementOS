import React from "react";
import { Link } from "react-router-dom";
import { PlacementLogo } from "../branding/PlacementLogo";
import { ShieldAlert } from "lucide-react";

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = "" }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      aria-label="Site Footer"
      className={`w-full bg-[#111315] text-neutral-300 border-t border-neutral-800 selection:bg-[#FF6B00] selection:text-white ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Top Section: Brand + Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand & Overview Column (6 columns on desktop) */}
          <div className="lg:col-span-6 space-y-4">
            <Link
              to="/dashboard"
              className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111315] rounded-sm"
              aria-label="Placement OS Home"
            >
              <PlacementLogo inverted size="md" />
            </Link>

            <p className="text-sm font-medium text-white tracking-tight">
              Your Operating System for Career Readiness
            </p>

            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-md">
              Prepare smarter with adaptive AI interviews, personalized skill
              roadmaps and actionable career insights.
            </p>

            <div className="pt-2 text-xs text-neutral-400 flex items-center gap-1.5 flex-wrap">
              <span>Platform designed for ambitious engineering students</span>
              <span aria-hidden="true" className="text-neutral-600">
                ·
              </span>
              <span className="text-neutral-300 font-medium">Placement OS</span>
            </div>
          </div>

          {/* Navigation Column (3 columns on desktop) */}
          <div className="lg:col-span-3 sm:col-span-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Navigation
            </h3>
            <nav aria-label="Platform Links">
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <Link
                    to="/about"
                    className="text-neutral-400 hover:text-[#FF6B00] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111315] rounded-sm"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to="/features"
                    className="text-neutral-400 hover:text-[#FF6B00] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111315] rounded-sm"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-neutral-400 hover:text-[#FF6B00] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111315] rounded-sm"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className="text-neutral-400 hover:text-[#FF6B00] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111315] rounded-sm"
                  >
                    Help / FAQ
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Legal Column (3 columns on desktop) */}
          <div className="lg:col-span-3 sm:col-span-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Legal & Compliance
            </h3>
            <nav aria-label="Legal Links">
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <Link
                    to="/privacy"
                    className="text-neutral-400 hover:text-[#FF6B00] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111315] rounded-sm"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="text-neutral-400 hover:text-[#FF6B00] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111315] rounded-sm"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to="/ai-disclaimer"
                    className="text-neutral-400 hover:text-[#FF6B00] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111315] rounded-sm"
                  >
                    AI Disclaimer
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* AI Limitation Notice Banner */}
        <div className="mt-10 pt-6 border-t border-neutral-800">
          <div className="p-4 rounded-lg bg-neutral-900/90 border border-neutral-800 text-neutral-400 text-xs leading-relaxed flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5" />
            <p>
              <strong className="text-neutral-200 font-medium">
                AI Limitation Notice:
              </strong>{" "}
              AI-generated feedback may be inaccurate or incomplete. Placement OS
              supports career preparation and does not guarantee interviews,
              employment or placement.
            </p>
          </div>
        </div>

        {/* Bottom Section: Copyright & Developer Credit */}
        <div className="mt-8 pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <p className="order-2 sm:order-1 text-center sm:text-left">
            © {currentYear} Placement OS. All rights reserved.
          </p>

          <p className="order-1 sm:order-2 font-medium text-neutral-300">
            Developed by{" "}
            <span className="text-white hover:text-[#FF6B00] transition-colors">
              Raunak Chaudhary
            </span>
            .
          </p>
        </div>
      </div>
    </footer>
  );
};
