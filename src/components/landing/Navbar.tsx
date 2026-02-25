import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import newLogo from "@/assets/new logo.png";

const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Find a Sitter", href: "/babysitters" },
  { label: "Safety", href: "/#safety" },
  { label: "Pricing", href: "/#pricing" },
];

const TEAL = "#3DBEB5";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const pillRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setDropOpen(false);
    navigate("/");
  };

  const dashboardPath = role === "babysitter" ? "/babysitter/dashboard" : "/parent/dashboard";
  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const email = user?.email || "";
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[2000] flex justify-center"
      style={{ pointerEvents: "none" }}
    >
      <div
        ref={pillRef}
        style={{
          width: scrolled ? "64%" : "96%",
          marginTop: scrolled ? "12px" : "12px",
          padding: scrolled ? "10px 24px" : "14px 32px",
          borderRadius: scrolled ? "9999px" : "0 0 24px 24px",
          background: scrolled ? "rgba(14,30,26,0.92)" : "rgba(14,30,26,0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: scrolled ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(255,255,255,0.06)",
          borderTop: scrolled ? undefined : "none",
          boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
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
            BabySitter<span style={{ color: TEAL }}>Hub</span>
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

        {/* ── Right: CTA / avatar ── */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {user ? (
            <div className="relative" ref={dropRef}>
              {/* Avatar trigger */}
              <button
                onClick={() => setDropOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full transition-all hover:opacity-90 focus:outline-none select-none"
                style={{
                  background: "rgba(61,190,181,0.1)",
                  border: `1px solid ${dropOpen ? "rgba(61,190,181,0.5)" : "rgba(61,190,181,0.2)"}`,
                  padding: "5px 12px 5px 5px",
                }}
              >
                {/* Avatar circle */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: TEAL }}
                >
                  {initials}
                </div>
                <span className="text-sm font-semibold text-white/80 hidden sm:block max-w-[80px] truncate">
                  {displayName}
                </span>
                <ChevronDown
                  size={14}
                  className="text-white/40 transition-transform"
                  style={{ transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>

              {/* Dropdown panel */}
              {dropOpen && (
                <div
                  className="absolute right-0 mt-3 rounded-2xl shadow-2xl overflow-hidden"
                  style={{
                    background: "#0A1714",
                    border: "1px solid rgba(61,190,181,0.15)",
                    minWidth: 220,
                    zIndex: 2001,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(61,190,181,0.08)",
                  }}
                >
                  {/* User info header */}
                  <div
                    className="px-4 py-4"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
                        style={{ background: `linear-gradient(135deg, ${TEAL}, #2a9d95)` }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                        <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-2">
                    <Link
                      to={dashboardPath}
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group"
                      style={{ color: "rgba(255,255,255,0.7)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(61,190,181,0.08)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <LayoutDashboard size={15} style={{ color: TEAL }} />
                      Dashboard
                    </Link>

                    {/* Divider */}
                    <div className="my-1.5 mx-1" style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{ color: "rgba(255,100,100,0.8)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,80,80,0.08)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/signup"
              className="text-sm font-semibold px-6 py-2.5 rounded-full hover:-translate-y-px transition-all"
              style={{ background: TEAL, color: "#fff" }}
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
          className="absolute left-4 right-4 mx-auto backdrop-blur-xl rounded-2xl p-4 md:hidden shadow-2xl"
          style={{ top: "72px", maxWidth: "600px", pointerEvents: "auto", background: "rgba(10,23,20,0.97)", border: "1px solid rgba(61,190,181,0.12)" }}
        >
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                to={href}
                onClick={() => setMobileOpen(false)}
                className="text-sm text-white/60 hover:text-white font-medium px-3 py-2.5 rounded-xl transition-all"
                style={{}}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(61,190,181,0.07)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {label}
              </Link>
            ))}
            {user && (
              <>
                <div className="my-1" style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
                <Link to={dashboardPath} onClick={() => setMobileOpen(false)} className="text-sm font-semibold px-3 py-2.5 rounded-xl" style={{ color: TEAL }}>
                  Dashboard →
                </Link>
                <button onClick={handleLogout} className="text-left text-sm px-3 py-2.5 rounded-xl" style={{ color: "rgba(255,100,100,0.7)" }}>
                  Sign out
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  );
};

export default Navbar;
