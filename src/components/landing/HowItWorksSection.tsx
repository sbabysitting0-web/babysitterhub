import { useEffect, useRef } from "react";
import { Search, MessageCircle, CalendarCheck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Search & browse",
    description:
      "Enter your area and browse verified babysitters in your neighbourhood. Filter by availability, rate and skills.",
  },
  {
    icon: MessageCircle,
    number: "02",
    title: "Message & meet",
    description:
      "Chat directly with sitters. Arrange a meet-and-greet to make sure it's the perfect fit for your family.",
  },
  {
    icon: CalendarCheck,
    number: "03",
    title: "Book with confidence",
    description:
      "Confirm your booking, pay securely, and get on with your day knowing your kids are in great hands.",
  },
];

const HowItWorksSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

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

    const container = cardsRef.current;
    if (!container) return;
    const cards = Array.from(container.querySelectorAll<HTMLElement>(".step-card"));
    cards.forEach((card, i) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(60px)";
      card.style.transition = `opacity 0.7s ease ${i * 0.15}s, transform 0.7s ease ${i * 0.15}s`;
    });
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          cards.forEach((card) => { card.style.opacity = "1"; card.style.transform = "translateY(0)"; });
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="py-24 relative overflow-hidden"
      style={{ background: "#080F0D" }}
    >
      {/* Blobs */}
      <div className="absolute pointer-events-none" style={{ top: "-60px", right: "-80px", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(61,190,181,0.10) 0%, transparent 65%)", borderRadius: "50%", filter: "blur(50px)" }} />
      <div className="absolute pointer-events-none" style={{ bottom: "-40px", left: "-60px", width: "320px", height: "320px", background: "radial-gradient(circle, rgba(61,190,181,0.08) 0%, transparent 65%)", borderRadius: "50%", filter: "blur(40px)" }} />

      {/* Semi-circle – right edge */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ width: "70px", height: "140px", background: "linear-gradient(270deg, rgba(61,190,181,0.10) 0%, transparent 100%)", borderRadius: "140px 0 0 140px", border: "1px solid rgba(61,190,181,0.12)", borderRight: "none" }} />
      {/* Semi-circle – left edge bottom */}
      <div className="absolute left-0 bottom-12 pointer-events-none" style={{ width: "50px", height: "100px", background: "linear-gradient(90deg, rgba(61,190,181,0.08) 0%, transparent 100%)", borderRadius: "0 100px 100px 0", border: "1px solid rgba(61,190,181,0.10)", borderLeft: "none" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={titleRef} className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-teal text-xs font-bold uppercase tracking-widest mb-3">Simple steps</span>
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-white mb-4">Find your perfect sitter in minutes</h2>
          <p className="text-white/40 text-base">No complicated forms. Just search, connect, and book.</p>
        </div>

        {/* Cards */}
        <div ref={cardsRef} className="grid md:grid-cols-3 gap-6 mb-12">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="step-card relative bg-[#0E1E1A] border border-white/6 rounded-3xl p-8 hover:border-teal/30 hover:shadow-xl hover:shadow-teal/5 transition-all duration-300 group">
                <div className="absolute top-7 right-7 text-5xl font-extrabold text-white/4 font-heading leading-none select-none">{step.number}</div>
                <div className="w-12 h-12 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center mb-6 group-hover:bg-teal/15 transition-colors">
                  <Icon size={22} className="text-teal" />
                </div>
                <h3 className="font-heading font-bold text-white text-lg mb-3">{step.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{step.description}</p>
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-[2px] bg-teal/20" />
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/babysitters" className="inline-flex items-center gap-2 bg-teal text-white font-semibold px-8 py-4 rounded-full hover:bg-teal/90 hover:shadow-lg hover:shadow-teal/25 hover:-translate-y-0.5 transition-all text-sm">
            Browse babysitters <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
