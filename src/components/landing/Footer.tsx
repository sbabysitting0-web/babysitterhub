import { Link } from "react-router-dom";
import { Heart, Mail, Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { useState } from "react";
import newLogo from "@/assets/new logo.png";

const platformLinks = [
  { label: "How it works", href: "/#how-it-works", anchor: true },
  { label: "Help & Support", href: "/help" },
  { label: "Terms & Privacy", href: "/terms" },
  { label: "Safety", href: "/#safety", anchor: true },
];

const discoverLinks = [
  { label: "About us", href: "/about" },
  { label: "Tips for Parents", href: "/tips/parents" },
  { label: "Tips for Babysitters", href: "/tips/babysitters" },
  { label: "Special Needs Care", href: "/special-needs" },
];

const Footer = () => {
  const [email, setEmail] = useState("");

  return (
    <footer
      className="relative overflow-hidden"
      style={{
        background: "#060C0A",
        // Respect iOS home indicator safe area
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Top separator line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(61,190,181,0.3) 50%, transparent 100%)" }}
      />

      {/* Blobs */}
      <div className="absolute pointer-events-none" style={{ top: "-80px", left: "-60px", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(61,190,181,0.07) 0%, transparent 65%)", borderRadius: "50%", filter: "blur(50px)" }} />
      <div className="absolute pointer-events-none" style={{ bottom: "-40px", right: "-40px", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(61,190,181,0.06) 0%, transparent 65%)", borderRadius: "50%", filter: "blur(40px)" }} />

      {/* Semi-circle left */}
      <div className="absolute left-0 top-1/3 pointer-events-none" style={{ width: "55px", height: "110px", background: "linear-gradient(90deg, rgba(61,190,181,0.09) 0%, transparent 100%)", borderRadius: "0 110px 110px 0", border: "1px solid rgba(61,190,181,0.10)", borderLeft: "none" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand col */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <img
                src={newLogo}
                alt="BabyCare"
                className="h-7 w-auto"
                style={{ filter: "brightness(0) invert(1)" }}
              />
              <span className="text-base font-heading font-bold text-white">
                Baby<span className="text-teal">Care</span>
              </span>
            </Link>

            <p className="text-sm text-white/40 leading-relaxed mb-6 max-w-xs">
              Connecting trusted babysitters with loving families across Singapore.
              Safe, verified, and always affordable.
            </p>

            {/* Newsletter */}
            <p className="text-xs font-semibold text-white/60 mb-2.5">
              Get parenting tips &amp; updates
            </p>
            <div className="flex max-w-xs">
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-l-xl px-3 py-2.5 text-xs text-white placeholder-white/25 outline-none focus:border-teal/50 transition-colors"
              />
              <button className="bg-teal text-white text-xs font-semibold px-4 py-2.5 rounded-r-xl hover:bg-teal/90 transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-2 mt-6">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center hover:bg-teal/15 hover:border-teal/30 hover:text-teal transition-all text-white/40"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-heading font-bold text-sm text-white mb-5">Platform</h4>
            <ul className="space-y-3">
              {platformLinks.map((l) => (
                <li key={l.label}>
                  {l.anchor ? (
                    <a href={l.href} className="text-sm text-white/40 hover:text-teal transition-colors">{l.label}</a>
                  ) : (
                    <Link to={l.href} className="text-sm text-white/40 hover:text-teal transition-colors">{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Discover */}
          <div>
            <h4 className="font-heading font-bold text-sm text-white mb-5">Discover</h4>
            <ul className="space-y-3">
              {discoverLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="text-sm text-white/40 hover:text-teal transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact row */}
        <div className="border-t border-white/6 pt-8 mb-8">
          <a
            href="mailto:hello@babycare.sg"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-teal transition-colors"
          >
            <Mail size={14} />
            hello@babycare.sg
          </a>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} BabyCare. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link to="/terms" className="text-xs text-white/25 hover:text-white/60 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-xs text-white/25 hover:text-white/60 transition-colors">Terms of Service</Link>
            <a href="#" className="text-xs text-white/25 hover:text-white/60 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
