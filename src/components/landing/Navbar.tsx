import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import newLogo from "@/assets/new logo.png";

const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Find a Sitter", href: "/babysitters" },
  { label: "Safety", href: "/#safety" },
  { label: "Pricing", href: "/#pricing" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, role } = useAuth();
  const pillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex justify-center"
      style={{ pointerEvents: "none" }}
    >
      <div
        ref={pillRef}
        style={{
          width: scrolled ? "55%" : "92%",
          marginTop: scrolled ? "12px" : "12px",
          padding: scrolled ? "10px 24px" : "14px 32px",
          borderRadius: scrolled ? "9999px" : "0 0 24px 24px",
          background: scrolled
            ? "rgba(14,30,26,0.92)"
            : "rgba(14,30,26,0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: scrolled
            ? "1px solid rgba(255,255,255,0.10)"
            : "1px solid rgba(255,255,255,0.06)",
          borderTop: scrolled ? undefined : "none",
          boxShadow: scrolled
            ? "0 8px 32px rgba(0,0,0,0.4)"
            : "none",
          transition: "width 0.6s ease, margin-top 0.6s ease, padding 0.6s ease, border-radius 0.6s ease, background 0.4s ease, box-shadow 0.4s ease, border 0.4s ease",
          pointerEvents: "auto",
        }}
        className="flex items-center justify-between"
      >
        {/* ── Left: logo + brand ── */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <img
            src={newLogo}
            alt="BabySitterHub"
            className="w-auto"
            style={{
              height: scrolled ? "28px" : "34px",
              filter: "brightness(0) invert(1)",
              transition: "height 0.6s ease",
            }}
          />
          <span className="text-base font-heading font-bold text-white tracking-tight">
            BabySitter<span className="text-teal">Hub</span>
          </span>
        </Link>

        {/* ── Centre: nav links ── */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              to={href}
              className="text-sm text-white/60 hover:text-white font-medium transition-colors whitespace-nowrap"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* ── Right: CTA ── */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {user ? (
            <Link
              to={role === "babysitter" ? "/babysitter/dashboard" : "/parent/dashboard"}
              className="text-sm bg-teal text-white font-semibold px-5 py-2 rounded-full hover:bg-teal/90 hover:shadow-lg hover:shadow-teal/25 transition-all"
            >
              Dashboard →
            </Link>
          ) : (
            <Link
              to="/signup"
              className="text-sm bg-teal text-white font-semibold px-6 py-2.5 rounded-full hover:bg-teal/90 hover:shadow-lg hover:shadow-teal/25 hover:-translate-y-px transition-all"
            >
              Sign up free
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white/70 hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="absolute left-4 right-4 mx-auto bg-[#0E1E1A]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:hidden shadow-2xl"
          style={{ top: "72px", maxWidth: "600px", pointerEvents: "auto" }}
        >
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                to={href}
                onClick={() => setMobileOpen(false)}
                className="text-sm text-white/60 hover:text-white font-medium px-3 py-2 rounded-xl hover:bg-white/5 transition-all"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
};

export default Navbar;
