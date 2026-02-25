import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, LayoutDashboard, ChevronDown, Menu, X } from "lucide-react";
import newLogo from "@/assets/new logo.png";

const NAV_LINKS = [
  { label: "How it works", href: "/", hash: "how-it-works" },
  { label: "Find a Sitter", href: "/babysitters", hash: "" },
  { label: "Safety", href: "/", hash: "safety" },
];

const TEAL = "#3DBEB5";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const { user, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pillRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close avatar dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleNavClick = (e: React.MouseEvent, hash: string) => {
    if (!hash) return;
    e.preventDefault();
    setMobileOpen(false);
    const scrollToSection = () => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    if (location.pathname === "/") {
      scrollToSection();
    } else {
      navigate("/");
      setTimeout(scrollToSection, 400);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setDropOpen(false);
    setMobileOpen(false);
    navigate("/");
  };

  const dashboardPath = role === "babysitter" ? "/babysitter/dashboard" : "/parent/dashboard";
  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const email = user?.email || "";
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[2000] flex flex-col items-center"
      style={{ pointerEvents: "none" }}
    >
      {/* ── Main bar ── */}
      <div
        ref={pillRef}
        style={{
          width: scrolled ? "clamp(280px, 64%, 900px)" : "clamp(280px, 96%, 1200px)",
          marginTop: "12px",
          padding: scrolled ? "8px 20px" : "12px 20px",
          borderRadius: scrolled ? "9999px" : "0 0 20px 20px",
          background: scrolled ? "rgba(14,30,26,0.95)" : "rgba(14,30,26,0.80)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: scrolled ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(255,255,255,0.06)",
          borderTop: scrolled ? undefined : "none",
          boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
          transition: "all 0.5s ease",
          pointerEvents: "auto",
        }}
        className="flex items-center justify-between gap-3"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img
            src={newLogo}
            alt="BabySitterHub"
            className="w-auto"
            style={{
              height: scrolled ? "26px" : "30px",
              filter: "brightness(0) invert(1)",
              transition: "height 0.5s ease",
            }}
          />
          <span className="text-sm sm:text-base font-heading font-bold text-white tracking-tight whitespace-nowrap">
            BabySitter<span style={{ color: TEAL }}>Hub</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
          {NAV_LINKS.map(({ label, href, hash }) => (
            <Link
              key={label}
              to={hash ? "/" : href}
              onClick={(e) => handleNavClick(e, hash)}
              className="text-sm text-white/60 hover:text-white font-medium transition-colors whitespace-nowrap"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {user ? (
            /* Avatar dropdown — desktop */
            <div className="relative hidden md:block" ref={dropRef}>
              <button
                onClick={() => setDropOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full transition-all hover:opacity-90 focus:outline-none select-none"
                style={{
                  background: "rgba(61,190,181,0.1)",
                  border: `1px solid ${dropOpen ? "rgba(61,190,181,0.5)" : "rgba(61,190,181,0.2)"}`,
                  padding: "5px 10px 5px 5px",
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: TEAL }}
                >
                  {initials}
                </div>
                <span className="text-sm font-semibold text-white/80 max-w-[72px] truncate hidden lg:block">
                  {displayName}
                </span>
                <ChevronDown
                  size={13}
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
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                  }}
                >
                  <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
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
                  <div className="p-2">
                    <Link
                      to={dashboardPath}
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{ color: "rgba(255,255,255,0.7)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(61,190,181,0.08)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <LayoutDashboard size={15} style={{ color: TEAL }} />
                      Dashboard
                    </Link>
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
            /* Sign up — desktop only */
            <Link
              to="/signup"
              className="hidden md:inline-flex text-sm font-semibold px-5 py-2 rounded-full hover:-translate-y-px transition-all whitespace-nowrap"
              style={{ background: TEAL, color: "#fff" }}
            >
              Sign up free
            </Link>
          )}

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-full transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)" }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div
          className="w-[calc(100%-24px)] mt-2 rounded-2xl shadow-2xl overflow-hidden md:hidden"
          style={{
            background: "rgba(10,23,20,0.98)",
            border: "1px solid rgba(61,190,181,0.14)",
            backdropFilter: "blur(24px)",
            pointerEvents: "auto",
          }}
        >
          {/* User info banner (if logged in) */}
          {user && (
            <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
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
          )}

          {/* Nav links */}
          <nav className="flex flex-col p-3 gap-0.5">
            {NAV_LINKS.map(({ label, href, hash }) => (
              <Link
                key={label}
                to={hash ? "/" : href}
                onClick={(e) => { setMobileOpen(false); handleNavClick(e, hash); }}
                className="flex items-center text-sm font-medium px-4 py-3 rounded-xl transition-colors"
                style={{ color: "rgba(255,255,255,0.65)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Auth actions */}
          <div className="px-3 pb-3 flex flex-col gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {user ? (
              <>
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 mt-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: `rgba(61,190,181,0.15)`, color: TEAL }}
                >
                  <LayoutDashboard size={15} />
                  Go to Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ color: "rgba(255,100,100,0.75)" }}
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 mt-3">
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: TEAL }}
                >
                  Sign up free
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Log in
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
