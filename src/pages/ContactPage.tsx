import React, { useState } from "react";
import { PublicLayout } from "../components/layout/PublicLayout";
import { Mail, Send, CheckCircle2, Copy, Check } from "lucide-react";

interface ContactPageProps {
  user?: any | null;
}

export const ContactPage: React.FC<ContactPageProps> = ({ user }) => {
  const [name, setName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const officialEmail = "raunakkchy@gmail.com";

  const handleCopy = () => {
    navigator.clipboard.writeText(officialEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    // Direct mailto opening as real fallback
    const mailtoUrl = `mailto:${officialEmail}?subject=${encodeURIComponent(
      subject || "Placement OS Inquiry"
    )}&body=${encodeURIComponent(
      `From: ${name} (${email})\n\n${message}`
    )}`;
    window.location.href = mailtoUrl;
    setSubmitted(true);
  };

  return (
    <PublicLayout
      user={user}
      pageTitle="Contact & Support"
      badge="Direct Developer Channel"
    >
      <div className="space-y-10 text-neutral-800 leading-relaxed text-sm sm:text-base">
        {/* Intro */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111315]">
            Get in Touch with Placement OS
          </h2>
          <p className="text-neutral-700 leading-relaxed">
            Have questions about your placement readiness score, mock interview
            simulations, bug reports, or feature requests? Reach out directly to
            the developer.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-[#E5E3DE]">
          {/* Contact Details Card (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-xl bg-white border border-[#E5E3DE] space-y-4">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-[#FF6B00]">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#111315]">
                Direct Developer Email
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600">
                You can email developer Raunak Chaudhary directly for support,
                account questions, or feedback:
              </p>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-100 border border-neutral-200">
                <span className="text-xs font-mono font-medium text-neutral-900 select-all truncate flex-1">
                  {officialEmail}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 rounded-md hover:bg-white text-neutral-600 hover:text-[#111315] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                  title="Copy email to clipboard"
                  aria-label="Copy developer email address"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="pt-2">
                <a
                  href={`mailto:${officialEmail}?subject=Placement%20OS%20Support`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#111315] text-white hover:bg-[#222529] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                >
                  Open in Email Client
                </a>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-neutral-100 border border-neutral-200 text-xs text-neutral-600 space-y-1.5">
              <p className="font-semibold text-neutral-800">
                Placement OS Transparency:
              </p>
              <p>
                We do not display fictional physical office addresses or
                unmonitored hotline numbers. All developer communications are
                monitored directly via the verified email above.
              </p>
            </div>
          </div>

          {/* Quick Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-xl bg-white border border-[#E5E3DE] space-y-6">
              <h3 className="text-base font-bold text-[#111315]">
                Send an Inquiry or Message
              </h3>

              {submitted ? (
                <div className="p-5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Inquiry Prepared</span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    Your email client should have opened with your message
                    addressed to <strong>{officialEmail}</strong>. If not, feel
                    free to send your email directly!
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="text-xs font-semibold text-emerald-700 hover:underline pt-2"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-semibold text-neutral-700 mb-1"
                    >
                      Your Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-semibold text-neutral-700 mb-1"
                    >
                      Your Email Address *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. student@college.edu"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="block text-xs font-semibold text-neutral-700 mb-1"
                    >
                      Subject
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Bug Report, Feature Request, Feedback"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-xs font-semibold text-neutral-700 mb-1"
                    >
                      Message / Details *
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-[#FF6B00] text-white text-xs sm:text-sm font-semibold hover:bg-[#e05e00] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Inquiry to Developer</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};
