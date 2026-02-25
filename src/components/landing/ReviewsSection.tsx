import { useEffect, useRef } from "react";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Sarah M.",
    location: "Tampines, Singapore",
    rating: 5,
    text: "Found an amazing sitter within 2 hours. She was warm, professional and my kids absolutely adore her. BabyCare is a lifesaver!",
    photo: "https://randomuser.me/api/portraits/women/45.jpg",
  },
  {
    name: "James K.",
    location: "Jurong West, Singapore",
    rating: 5,
    text: "As a single dad I was nervous about leaving my 3-year-old with someone new. The verification process gave me so much confidence. Highly recommended.",
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Priya N.",
    location: "Bedok, Singapore",
    rating: 5,
    text: "The sitters here are genuinely caring. We've been using the same sitter every Friday for 6 months now. Absolutely worth it.",
    photo: "https://randomuser.me/api/portraits/women/61.jpg",
  },
  {
    name: "David L.",
    location: "Woodlands, Singapore",
    rating: 5,
    text: "Booking is so smooth. Love that I can see ratings and read actual reviews from other parents before I decide. Brilliant platform.",
    photo: "https://randomuser.me/api/portraits/men/55.jpg",
  },
];

const StarRow = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} size={13} className={s <= rating ? "text-amber-400 fill-amber-400" : "text-white/10 fill-white/10"} />
    ))}
  </div>
);

const ReviewsSection = () => {
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
    const cards = Array.from(grid.querySelectorAll<HTMLElement>(".review-card"));
    cards.forEach((card, i) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(50px)";
      card.style.transition = `opacity 0.7s ease ${i * 0.12}s, transform 0.7s ease ${i * 0.12}s`;
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
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 relative overflow-hidden" style={{ background: "#080F0D" }}>
      {/* Blobs */}
      <div className="absolute pointer-events-none" style={{ top: "-50px", left: "20%", width: "450px", height: "450px", background: "radial-gradient(circle, rgba(61,190,181,0.08) 0%, transparent 65%)", borderRadius: "50%", filter: "blur(55px)" }} />
      <div className="absolute pointer-events-none" style={{ bottom: "-60px", right: "10%", width: "350px", height: "350px", background: "radial-gradient(circle, rgba(61,190,181,0.07) 0%, transparent 65%)", borderRadius: "50%", filter: "blur(45px)" }} />

      {/* Semi-circles */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ width: "70px", height: "140px", background: "linear-gradient(90deg, rgba(61,190,181,0.10) 0%, transparent 100%)", borderRadius: "0 140px 140px 0", border: "1px solid rgba(61,190,181,0.12)", borderLeft: "none" }} />
      <div className="absolute right-0 top-16 pointer-events-none" style={{ width: "50px", height: "100px", background: "linear-gradient(270deg, rgba(61,190,181,0.08) 0%, transparent 100%)", borderRadius: "100px 0 0 100px", border: "1px solid rgba(61,190,181,0.10)", borderRight: "none" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={titleRef} className="text-center max-w-xl mx-auto mb-14">
          <span className="inline-block text-teal text-xs font-bold uppercase tracking-widest mb-3">Reviews</span>
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-white mb-4">Loved by thousands of families</h2>
          <p className="text-white/40">Don't just take our word for it — here's what Singapore parents say.</p>
        </div>

        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {reviews.map((r, idx) => (
            <div key={idx} className="review-card bg-[#0E1E1A] border border-white/6 rounded-2xl p-6 hover:border-teal/20 hover:shadow-xl hover:shadow-teal/5 transition-all duration-300 flex flex-col">
              <StarRow rating={r.rating} />
              <p className="text-white/60 text-sm leading-relaxed mt-4 mb-5 flex-1">"{r.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/6">
                <img src={r.photo} alt={r.name} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                <div>
                  <p className="text-sm font-semibold text-white">{r.name}</p>
                  <p className="text-xs text-white/30">{r.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
