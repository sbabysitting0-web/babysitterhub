import { useEffect, useRef } from "react";
import { Heart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const AppSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;

    if (left) { left.style.opacity = "0"; left.style.transform = "translateX(-60px)"; left.style.transition = "opacity 0.8s ease, transform 0.8s ease"; }
    if (right) { right.style.opacity = "0"; right.style.transform = "translateX(60px)"; right.style.transition = "opacity 0.8s ease, transform 0.8s ease"; }

    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (left) { left.style.opacity = "1"; left.style.transform = "translateX(0)"; }
          if (right) { right.style.opacity = "1"; right.style.transform = "translateX(0)"; }
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0A1812 0%, #0D2318 40%, #0A1C14 70%, #080F0D 100%)",
      }}
    >
      {/* Blobs */}
      <div className="absolute pointer-events-none" style={{ top: "-80px", left: "-60px", width: "550px", height: "550px", background: "radial-gradient(circle, rgba(61,190,181,0.15) 0%, transparent 60%)", borderRadius: "50%", filter: "blur(60px)" }} />
      <div className="absolute pointer-events-none" style={{ bottom: "-60px", right: "-40px", width: "420px", height: "420px", background: "radial-gradient(circle, rgba(61,190,181,0.12) 0%, transparent 60%)", borderRadius: "50%", filter: "blur(50px)" }} />
      <div className="absolute pointer-events-none" style={{ top: "40%", right: "30%", width: "280px", height: "280px", background: "radial-gradient(circle, rgba(61,190,181,0.07) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(40px)" }} />

      {/* Semi-circle – left edge */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ width: "90px", height: "180px", background: "linear-gradient(90deg, rgba(61,190,181,0.18) 0%, transparent 100%)", borderRadius: "0 180px 180px 0", border: "1px solid rgba(61,190,181,0.20)", borderLeft: "none" }} />
      {/* Semi-circle – right edge */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ width: "90px", height: "180px", background: "linear-gradient(270deg, rgba(61,190,181,0.18) 0%, transparent 100%)", borderRadius: "180px 0 0 180px", border: "1px solid rgba(61,190,181,0.20)", borderRight: "none" }} />
      {/* Top subtle arc */}
      <div className="absolute left-0 right-0 top-0 pointer-events-none" style={{ height: "2px", background: "linear-gradient(90deg, transparent 0%, rgba(61,190,181,0.25) 50%, transparent 100%)" }} />
      {/* Bottom subtle arc */}
      <div className="absolute left-0 right-0 bottom-0 pointer-events-none" style={{ height: "2px", background: "linear-gradient(90deg, transparent 0%, rgba(61,190,181,0.25) 50%, transparent 100%)" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div ref={leftRef}>
            <div className="inline-flex items-center gap-2 bg-teal/15 border border-teal/25 text-teal text-xs font-bold px-4 py-1.5 rounded-full mb-6">
              <Heart size={12} className="fill-teal" />
              Available on iOS &amp; Android
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-white leading-tight mb-4">
              Childcare is always within reach with our app
            </h2>
            <p className="text-white/60 mb-8 leading-relaxed text-base">
              Quickly view available babysitters, manage your bookings, and
              chat with sitters — all from your phone. Childcare has never
              been this easy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <a
                href="#"
                className="inline-flex items-center gap-3 bg-[#0E1E1A] border border-white/10 text-white px-6 py-3.5 rounded-xl text-sm font-semibold hover:border-teal/30 hover:bg-[#132620] transition-all group"
              >
                <svg className="w-6 h-6 text-teal" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                <div>
                  <p className="text-[10px] text-white/40 leading-none">Download on the</p>
                  <p className="text-sm font-bold leading-tight">App Store</p>
                </div>
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-3 bg-[#0E1E1A] border border-white/10 text-white px-6 py-3.5 rounded-xl text-sm font-semibold hover:border-teal/30 hover:bg-[#132620] transition-all group"
              >
                <svg className="w-6 h-6 text-teal" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302-2.302 2.302L15.396 12l2.302-2.302zM5.864 3.469L16.8 9.802l-2.302 2.302L5.864 3.47z" />
                </svg>
                <div>
                  <p className="text-[10px] text-white/40 leading-none">Get it on</p>
                  <p className="text-sm font-bold leading-tight">Google Play</p>
                </div>
              </a>
            </div>

            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-teal text-white font-semibold px-7 py-3.5 rounded-full hover:bg-teal/90 transition-all hover:shadow-lg hover:shadow-teal/30"
            >
              Sign up for free <ArrowRight size={16} />
            </Link>
          </div>

          {/* Right — mock phone UI */}
          <div ref={rightRef} className="flex justify-center">
            <div className="relative">
              {/* Glow behind phone */}
              <div className="absolute inset-0 scale-110 rounded-[3rem] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(61,190,181,0.15) 0%, transparent 70%)", filter: "blur(20px)" }} />

              {/* Phone frame */}
              <div className="relative w-52 h-[420px] bg-[#0A1812] rounded-[2.5rem] shadow-2xl border border-teal/20 overflow-hidden">
                {/* Status bar */}
                <div className="bg-teal h-10 flex items-center justify-between px-5 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Heart size={12} className="text-white fill-white" />
                    <span className="text-white text-[10px] font-bold">BabySitterHub</span>
                  </div>
                  <div className="w-5 h-3 rounded-sm border border-white/50 flex items-center px-0.5">
                    <div className="w-3 h-1.5 bg-white/70 rounded-sm" />
                  </div>
                </div>

                {/* App content */}
                <div className="bg-[#EAF6F4] h-full p-3 space-y-2">
                  {/* Search bar */}
                  <div className="bg-white rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
                    <div className="w-3 h-3 rounded-full border border-gray-300" />
                    <span className="text-[9px] text-gray-400">Search area...</span>
                  </div>

                  {/* Mini sitter cards */}
                  {[
                    { name: "Aaishah R.", rate: "$18/h", rating: "4.9★", color: "bg-teal/10" },
                    { name: "Victoria L.", rate: "$15/h", rating: "4.8★", color: "bg-teal/15" },
                    { name: "Wendy T.", rate: "$16/h", rating: "4.7★", color: "bg-teal/20" },
                  ].map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-2.5 shadow-sm flex items-center gap-2">
                      <div className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center`}>
                        <span className="text-[8px] font-bold text-gray-600">{s.name[0]}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] font-bold text-gray-800">{s.name}</p>
                        <p className="text-[8px] text-teal font-semibold">{s.rate}</p>
                      </div>
                      <span className="text-[8px] text-amber-500 font-bold">{s.rating}</span>
                    </div>
                  ))}

                  {/* Bottom nav */}
                  <div className="absolute bottom-4 left-3 right-3 bg-white rounded-2xl shadow-lg py-2 px-4 flex items-center justify-around">
                    {["🏠", "🔍", "❤️", "👤"].map((icon, i) => (
                      <div key={i} className={`text-sm ${i === 0 ? "opacity-100" : "opacity-40"}`}>{icon}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating notification */}
              <div className="absolute -top-3 -right-8 bg-[#0E1E1A] border border-teal/20 rounded-xl shadow-xl px-3 py-2 w-44">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-5 h-5 bg-teal rounded-full flex items-center justify-center">
                    <span className="text-[8px] text-white font-bold">✓</span>
                  </div>
                  <span className="text-[10px] font-bold text-white">Booking confirmed!</span>
                </div>
                <p className="text-[9px] text-white/40 ml-7">Aaishah for Sat, 3pm</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppSection;
