import { useEffect, useRef } from "react";
import { Shield, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import babysitterImg from "@/assets/babysitter.png";

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const badge = badgeRef.current;
    const headline = headlineRef.current;
    const sub = subRef.current;
    const cta = ctaRef.current;
    const img = imgRef.current;
    const cards = [card1Ref.current, card2Ref.current, card3Ref.current];

    const setInitial = (el: HTMLElement | null, props: Partial<CSSStyleDeclaration>) => {
      if (!el) return;
      Object.assign(el.style, { opacity: "0", transition: "none", ...props });
    };

    setInitial(badge, { transform: "translateY(20px)" });
    setInitial(headline, { transform: "translateY(30px)" });
    setInitial(sub, { transform: "translateY(20px)" });
    setInitial(cta, { transform: "translateY(20px)" });
    setInitial(img, { transform: "translateX(60px) scale(0.95)" });
    cards.forEach((c) => setInitial(c, { transform: "translateY(30px)" }));

    const animate = (el: HTMLElement | null, delay: number, duration = "0.7s") => {
      if (!el) return;
      setTimeout(() => {
        el.style.transition = `opacity ${duration} ease, transform ${duration} ease`;
        el.style.opacity = "1";
        el.style.transform = "none";
      }, delay);
    };

    animate(badge, 100);
    animate(headline, 300);
    animate(sub, 550);
    animate(cta, 700);
    animate(img, 400, "0.8s");
    animate(card1Ref.current, 600);
    animate(card2Ref.current, 750);
    animate(card3Ref.current, 900);

    const styleTag = document.createElement("style");
    styleTag.textContent = `@keyframes floatY { from { transform: translateY(0); } to { transform: translateY(-12px); } }`;
    document.head.appendChild(styleTag);

    setTimeout(() => {
      if (card1Ref.current) card1Ref.current.style.animation = "floatY 3.5s ease-in-out 0s infinite alternate";
      if (card2Ref.current) card2Ref.current.style.animation = "floatY 4.2s ease-in-out 0.8s infinite alternate";
      if (card3Ref.current) card3Ref.current.style.animation = "floatY 3.8s ease-in-out 1.4s infinite alternate";
    }, 1000);

    const handleScroll = () => {
      const progress = window.scrollY / (sectionRef.current?.offsetHeight || 1);
      if (orb1Ref.current) orb1Ref.current.style.transform = `translateY(${-progress * 120}px)`;
      if (orb2Ref.current) orb2Ref.current.style.transform = `translateY(${-progress * 60}px)`;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      styleTag.remove();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden min-h-[92vh] flex items-center"
      style={{ background: "#080F0D" }}
    >
      {/* ── Ambient blobs ── */}
      <div
        ref={orb1Ref}
        className="absolute pointer-events-none"
        style={{
          top: "-120px", left: "-100px",
          width: "600px", height: "600px",
          background: "radial-gradient(circle, rgba(61,190,181,0.18) 0%, transparent 65%)",
          borderRadius: "50%",
          filter: "blur(40px)",
        }}
      />
      <div
        ref={orb2Ref}
        className="absolute pointer-events-none"
        style={{
          bottom: "-140px", right: "-80px",
          width: "500px", height: "500px",
          background: "radial-gradient(circle, rgba(61,190,181,0.13) 0%, transparent 65%)",
          borderRadius: "50%",
          filter: "blur(50px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "30%", right: "20%",
          width: "300px", height: "300px",
          background: "radial-gradient(circle, rgba(61,190,181,0.07) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(60px)",
        }}
      />

      {/* ── Semi-circle decorations ── */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: "80px", height: "160px",
          background: "linear-gradient(90deg, rgba(61,190,181,0.12) 0%, transparent 100%)",
          borderRadius: "0 160px 160px 0",
          border: "1px solid rgba(61,190,181,0.15)",
          borderLeft: "none",
        }}
      />
      <div
        className="absolute right-0 top-1/3 pointer-events-none"
        style={{
          width: "60px", height: "120px",
          background: "linear-gradient(270deg, rgba(61,190,181,0.10) 0%, transparent 100%)",
          borderRadius: "120px 0 0 120px",
          border: "1px solid rgba(61,190,181,0.12)",
          borderRight: "none",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10 w-full">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* LEFT */}
          <div className="relative z-10">
            <div
              ref={badgeRef}
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-teal text-xs font-bold px-4 py-1.5 rounded-full mb-7 backdrop-blur-sm"
            >
              <Shield size={12} className="text-teal" />
              Trusted by 25,000+ families in Singapore
            </div>

            <h1
              ref={headlineRef}
              className="text-5xl sm:text-6xl lg:text-[68px] font-heading font-extrabold text-white leading-[1.05] mb-6 tracking-tight overflow-hidden"
            >
              {["Quickly", "find", "a"].map((w) => (
                <span key={w} className="word inline-block mr-[0.25em]">{w}</span>
              ))}
              <span className="word inline-block text-teal mr-[0.25em] relative">
                babysitter
                <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 200 6" fill="none">
                  <path d="M2 4 Q50 1 100 3 Q150 5 198 2" stroke="#3DBEB5" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
                </svg>
              </span>
              <br />
              {["your", "kids", "will", "love"].map((w) => (
                <span key={w} className="word inline-block mr-[0.25em]">{w}</span>
              ))}
            </h1>

            <p ref={subRef} className="text-white/50 text-base leading-relaxed mb-8 max-w-md">
              Browse verified babysitters, nannies, and childminders near you.
              Find the care that fits your family — anytime, anywhere.
            </p>

            <div ref={ctaRef} className="flex flex-wrap gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-teal text-white font-semibold px-8 py-4 rounded-full hover:bg-teal/90 transition-all hover:shadow-lg hover:shadow-teal/30 hover:-translate-y-0.5 text-sm"
              >
                Find a babysitter <ArrowRight size={16} />
              </Link>
            </div>

            <div className="flex gap-8 mt-12">
              {[
                { num: "25k+", label: "Families" },
                { num: "12k+", label: "Sitters" },
                { num: "4.9★", label: "Avg rating" },
              ].map(({ num, label }) => (
                <div key={label}>
                  <div className="text-2xl font-heading font-extrabold text-white">{num}</div>
                  <div className="text-xs text-white/40 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT – babysitter image + floating cards */}
          <div className="relative flex justify-center lg:justify-end items-center pt-4 lg:pt-0">
            <div
              ref={imgRef}
              className="relative z-10 rounded-3xl overflow-hidden shadow-2xl w-full max-w-[480px] aspect-[4/3.3] border border-teal/15"
              style={{ boxShadow: "0 0 60px rgba(61,190,181,0.12)" }}
            >
              <img
                src={babysitterImg}
                alt="Babysitter playing with kids"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080F0D]/50 via-transparent to-transparent" />
            </div>

            {/* Floating card 1 – verified */}
            <div
              ref={card1Ref}
              className="absolute top-4 -left-4 lg:-left-8 bg-[#0E1E1A]/90 border border-teal/20 rounded-2xl shadow-xl px-4 py-3 z-20 backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal/15 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-teal" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Verified sitters</p>
                  <p className="text-[11px] text-white/40">ID &amp; background checked</p>
                </div>
              </div>
            </div>

            {/* Floating card 2 – rating */}
            <div
              ref={card2Ref}
              className="absolute -bottom-4 right-4 lg:right-0 bg-[#0E1E1A]/90 border border-teal/20 rounded-2xl shadow-xl px-4 py-3 z-20 backdrop-blur-md"
            >
              <div className="flex items-center gap-2 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={12} className="text-amber-400 fill-amber-400" />
                ))}
                <span className="text-xs font-bold text-white ml-0.5">4.9</span>
              </div>
              <p className="text-[11px] text-white/40">
                Avg rating from <span className="font-semibold text-white/70">2,600+</span> reviews
              </p>
            </div>

            {/* Floating card 3 – sitters online */}
            <div
              ref={card3Ref}
              className="absolute bottom-8 -left-4 lg:-left-8 bg-[#0E1E1A]/90 border border-teal/20 rounded-2xl shadow-lg px-4 py-2.5 z-20 backdrop-blur-md flex items-center gap-3"
            >
              <div className="flex -space-x-2">
                {[
                  "https://randomuser.me/api/portraits/women/44.jpg",
                  "https://randomuser.me/api/portraits/women/68.jpg",
                  "https://randomuser.me/api/portraits/women/32.jpg",
                ].map((src, i) => (
                  <img key={i} src={src} alt="sitter" className="w-8 h-8 rounded-full border-2 border-[#0E1E1A] object-cover" />
                ))}
              </div>
              <div>
                <p className="text-xs font-bold text-white">12k+ sitters</p>
                <p className="text-[10px] text-white/40">Available now</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
