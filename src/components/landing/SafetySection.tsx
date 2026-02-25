import { useEffect, useRef } from "react";
import { Shield, CheckCircle, Lock, UserCheck } from "lucide-react";

const checks = [
  { icon: UserCheck, title: "Identity verified", desc: "Government ID confirmed for every sitter." },
  { icon: Shield, title: "Background screened", desc: "Police and criminal background checks run before approval." },
  { icon: CheckCircle, title: "Reference checked", desc: "At least two past employer references validated." },
  { icon: Lock, title: "Secure payments", desc: "All transactions encrypted. Money released only after care is confirmed." },
];

const stats = [
  { num: "25k+", label: "Families served" },
  { num: "98%", label: "Satisfaction rate" },
  { num: "12k+", label: "Verified sitters" },
  { num: "4.9", label: "Average rating" },
];

const SafetySection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const statsEl = statsRef.current;
    if (statsEl) {
      const statNums = Array.from(statsEl.querySelectorAll<HTMLElement>(".stat-num"));
      statNums.forEach((el, i) => {
        el.style.opacity = "0";
        el.style.transform = "translateY(20px)";
        el.style.transition = `opacity 0.6s ease ${i * 0.12}s, transform 0.6s ease ${i * 0.12}s`;
      });
      const obsStats = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            statNums.forEach((el) => { el.style.opacity = "1"; el.style.transform = "translateY(0)"; });
            obsStats.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      obsStats.observe(statsEl);
    }

    const left = leftRef.current;
    const right = rightRef.current;
    if (left) { left.style.opacity = "0"; left.style.transform = "translateX(-60px)"; left.style.transition = "opacity 0.8s ease, transform 0.8s ease"; }
    if (right) { right.style.opacity = "0"; right.style.transform = "translateX(60px)"; right.style.transition = "opacity 0.8s ease, transform 0.8s ease"; }

    const section = sectionRef.current;
    if (!section) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (left) { left.style.opacity = "1"; left.style.transform = "translateX(0)"; }
          if (right) { right.style.opacity = "1"; right.style.transform = "translateX(0)"; }
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="safety" ref={sectionRef} className="py-24 relative overflow-hidden" style={{ background: "#080F0D" }}>
      {/* Blobs */}
      <div className="absolute pointer-events-none" style={{ top: "0%", right: "-60px", width: "450px", height: "450px", background: "radial-gradient(circle, rgba(61,190,181,0.09) 0%, transparent 65%)", borderRadius: "50%", filter: "blur(55px)" }} />
      <div className="absolute pointer-events-none" style={{ bottom: "10%", left: "-80px", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(61,190,181,0.08) 0%, transparent 65%)", borderRadius: "50%", filter: "blur(50px)" }} />
      <div className="absolute pointer-events-none" style={{ top: "50%", left: "40%", width: "250px", height: "250px", background: "radial-gradient(circle, rgba(61,190,181,0.05) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(40px)" }} />

      {/* Semi-circles */}
      <div className="absolute right-0 top-1/3 pointer-events-none" style={{ width: "80px", height: "160px", background: "linear-gradient(270deg, rgba(61,190,181,0.12) 0%, transparent 100%)", borderRadius: "160px 0 0 160px", border: "1px solid rgba(61,190,181,0.14)", borderRight: "none" }} />
      <div className="absolute left-0 bottom-1/3 pointer-events-none" style={{ width: "60px", height: "120px", background: "linear-gradient(90deg, rgba(61,190,181,0.10) 0%, transparent 100%)", borderRadius: "0 120px 120px 0", border: "1px solid rgba(61,190,181,0.12)", borderLeft: "none" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats bar */}
        <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20 border border-white/6 rounded-3xl bg-[#0E1E1A] p-8">
          {stats.map(({ num, label }) => (
            <div key={label} className="text-center">
              <div className="stat-num text-3xl font-heading font-extrabold text-teal mb-1">{num}</div>
              <div className="text-xs text-white/40 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* Two columns */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div ref={leftRef}>
            <span className="inline-block text-teal text-xs font-bold uppercase tracking-widest mb-3">Safety first</span>
            <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-white mb-5 leading-tight">
              Every sitter is rigorously verified before you ever see them
            </h2>
            <p className="text-white/40 text-base leading-relaxed mb-8">
              We take trust seriously. Our multi-step verification process ensures only qualified, safe, and caring sitters make it onto the platform.
            </p>
            <div className="space-y-5">
              {checks.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center mt-0.5">
                    <Icon size={18} className="text-teal" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{title}</p>
                    <p className="text-white/40 text-sm mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div ref={rightRef} className="relative rounded-3xl overflow-hidden border border-teal/15 shadow-2xl" style={{ boxShadow: "0 0 50px rgba(61,190,181,0.08)" }}>
            <img
              src="https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=800&q=85"
              alt="Safe babysitter with children"
              className="w-full h-[420px] object-cover"
              style={{ filter: "brightness(0.85) saturate(0.85)" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080F0D]/65 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 bg-[#0E1E1A]/85 backdrop-blur-sm border border-teal/15 rounded-2xl px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-teal/15 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-teal" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">100% verified sitters</p>
                <p className="text-xs text-white/40">Background checked &amp; ID confirmed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SafetySection;
