import { useEffect, useRef } from "react";
import { Shield, Star, Clock, Users, Award, CheckCircle } from "lucide-react";

const features = [
  { icon: Shield, title: "Background checked", description: "Every sitter goes through a rigorous ID and background verification before joining." },
  { icon: Star, title: "Reviewed & rated", description: "Real ratings from real families. Browse reviews to find the best match." },
  { icon: Clock, title: "Available 24/7", description: "Last-minute care? No problem. Find sitters available on short notice." },
  { icon: Users, title: "12k+ sitters", description: "The largest network of trusted babysitters across Singapore." },
  { icon: Award, title: "CPR certified", description: "Many sitters hold first aid and CPR certifications for your peace of mind." },
  { icon: CheckCircle, title: "Free to browse", description: "No hidden fees. Browse, contact, and shortlist sitters for free." },
];

const FeaturesSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const title = titleRef.current;
    if (title) {
      title.style.opacity = "0";
      title.style.transform = "translateY(40px)";
      title.style.transition = "opacity 0.7s ease, transform 0.7s ease";
      const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) { title.style.opacity = "1"; title.style.transform = "translateY(0)"; obs.disconnect(); } },
        { threshold: 0.15 }
      );
      obs.observe(title);
    }

    const grid = gridRef.current;
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>(".feat-card"));
    cards.forEach((card, i) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(50px) scale(0.96)";
      card.style.transition = `opacity 0.65s ease ${i * 0.1}s, transform 0.65s ease ${i * 0.1}s`;
    });
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          cards.forEach((card) => { card.style.opacity = "1"; card.style.transform = "translateY(0) scale(1)"; });
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-24 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #080F0D 0%, #0A1812 100%)" }}
    >
      {/* Blobs */}
      <div className="absolute pointer-events-none" style={{ top: "10%", left: "-100px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(61,190,181,0.09) 0%, transparent 65%)", borderRadius: "50%", filter: "blur(60px)" }} />
      <div className="absolute pointer-events-none" style={{ bottom: "5%", right: "-80px", width: "380px", height: "380px", background: "radial-gradient(circle, rgba(61,190,181,0.08) 0%, transparent 65%)", borderRadius: "50%", filter: "blur(50px)" }} />
      {/* Small extra blob */}
      <div className="absolute pointer-events-none" style={{ top: "50%", right: "30%", width: "200px", height: "200px", background: "radial-gradient(circle, rgba(61,190,181,0.05) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(40px)" }} />

      {/* Semi-circles */}
      <div className="absolute left-0 top-1/4 pointer-events-none" style={{ width: "65px", height: "130px", background: "linear-gradient(90deg, rgba(61,190,181,0.11) 0%, transparent 100%)", borderRadius: "0 130px 130px 0", border: "1px solid rgba(61,190,181,0.13)", borderLeft: "none" }} />
      <div className="absolute right-0 bottom-1/4 pointer-events-none" style={{ width: "55px", height: "110px", background: "linear-gradient(270deg, rgba(61,190,181,0.09) 0%, transparent 100%)", borderRadius: "110px 0 0 110px", border: "1px solid rgba(61,190,181,0.10)", borderRight: "none" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={titleRef} className="text-center max-w-xl mx-auto mb-16">
          <span className="inline-block text-teal text-xs font-bold uppercase tracking-widest mb-3">Why BabyCare</span>
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-white mb-4">Everything you need to trust your sitter</h2>
          <p className="text-white/40 text-base">We built the safest, simplest way to find family childcare.</p>
        </div>

        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="feat-card bg-[#0E1E1A] border border-white/6 rounded-2xl p-7 hover:border-teal/30 hover:shadow-xl hover:shadow-teal/5 transition-all duration-300 group">
                <div className="w-11 h-11 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center mb-5 group-hover:bg-teal/15 transition-colors">
                  <Icon size={20} className="text-teal" />
                </div>
                <h3 className="font-heading font-bold text-white text-base mb-2">{feat.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{feat.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
