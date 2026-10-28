import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PlacementLogo } from "../branding/PlacementLogo";
import { Footer } from "../navigation/Footer";
import { Menu, X, ArrowLeft, ArrowUpRight } from "lucide-react";

interface PublicLayoutProps {
  children: React.ReactNode;
  user?: any | null;
  pageTitle?: string;
  badge?: string;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  user,
  pageTitle,
  badge,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: "Features", path: "/features" },
    { label: "About", path: "/about" },
    { label: "FAQ", path: "/faq" },
    { label: "Contact", path: "/contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-[#111315] font-sans selection:bg-[#FF6B00] selection:text-white antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E3DE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            to={user ? "/dashboard" : "/login"}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] rounded-md"
            aria-label="Placement OS Home"
          >
            <PlacementLogo size="sm" />
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Public Navigation"
            className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium"
          >
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`transition-colors py-1.5 border-b-2 ${
                    isActive
                      ? "text-[#FF6B00] border-[#FF6B00] font-semibold"
                      : "text-neutral-600 hover:text-[#111315] border-transparent"
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] rounded-xs`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Button */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#111315] text-white hover:bg-[#222529] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
              >
                Go to Dashboard
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-medium text-neutral-700 hover:text-[#111315] hover:bg-neutral-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#111315] text-white hover:bg-[#222529] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
              className="p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#E5E3DE] bg-white px-4 py-4 space-y-3">
            <nav className="flex flex-col space-y-2 text-sm font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-md ${
                    location.pathname === link.path
                      ? "bg-neutral-100 text-[#FF6B00] font-semibold"
                      : "text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2">
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-xs font-semibold rounded-lg bg-[#111315] text-white"
                >
                  Open Dashboard
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 text-xs font-medium border border-neutral-300 rounded-lg text-neutral-800"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 text-xs font-semibold rounded-lg bg-[#111315] text-white"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero / Header Breadcrumb if provided */}
      {pageTitle && (
        <div className="bg-white border-b border-[#E5E3DE] py-6 sm:py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
              <Link
                to={user ? "/dashboard" : "/login"}
                className="hover:text-[#FF6B00] transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{user ? "Back to Dashboard" : "Back to Home"}</span>
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-neutral-700 font-medium">{pageTitle}</span>
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111315]">
                {pageTitle}
              </h1>
              {badge && (
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200">
                  {badge}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>

      {/* Production-Ready Dark Charcoal Footer */}
      <Footer />
    </div>
  );
};
