import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Users, Heart, Star, Shield } from "lucide-react";

const values = [
  { icon: Heart, title: "Family first", desc: "Every decision we make puts families at the centre. We exist to make childcare simpler and safer." },
  { icon: Shield, title: "Trust & safety", desc: "We verify every sitter with ID checks and background screenings — no exceptions." },
  { icon: Star, title: "Quality care", desc: "We only accept sitters who meet our high standards so families always get the best." },
  { icon: Users, title: "Community", desc: "We're building a community of carers and families who support each other across Singapore." },
];

const AboutPage = () => (
  <div className="min-h-screen" style={{ background: "#080F0D" }}>
    <Navbar />

    {/* Hero */}
    <section className="relative overflow-hidden py-24">
      <div className="absolute pointer-events-none" style={{ top: "-80px", left: "-60px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(61,190,181,0.12) 0%, transparent 65%)", borderRadius: "50%", filter: "blur(55px)" }} />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ width: "75px", height: "150px", background: "linear-gradient(270deg, rgba(61,190,181,0.12) 0%, transparent 100%)", borderRadius: "150px 0 0 150px", border: "1px solid rgba(61,190,181,0.14)", borderRight: "none" }} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-block text-teal text-xs font-bold uppercase tracking-widest mb-4">Our story</span>
        <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-white mb-6 leading-tight">
          Childcare shouldn't be stressful.<br />We made it simple.
        </h1>
        <p className="text-white/50 text-lg leading-relaxed max-w-2xl mx-auto">
          BabyCare was founded in Singapore with one mission: help families find trusted, verified babysitters quickly — and help great sitters find flexible work they love.
        </p>
      </div>
    </section>

    {/* Stats */}
    <section className="py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[{ n: "25k+", l: "Families" }, { n: "12k+", l: "Verified sitters" }, { n: "4.9★", l: "Avg rating" }, { n: "2019", l: "Founded" }].map(({ n, l }) => (
            <div key={l} className="bg-[#0E1E1A] border border-white/6 rounded-2xl p-6 text-center">
              <div className="text-3xl font-heading font-extrabold text-teal mb-1">{n}</div>
              <div className="text-xs text-white/40">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="py-16 relative">
      <div className="absolute pointer-events-none" style={{ bottom: "-40px", right: "-60px", width: "350px", height: "350px", background: "radial-gradient(circle, rgba(61,190,181,0.08) 0%, transparent 65%)", borderRadius: "50%", filter: "blur(45px)" }} />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-white text-center mb-10">Our values</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {values.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-[#0E1E1A] border border-white/6 rounded-2xl p-6 hover:border-teal/25 transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center mb-4">
                <Icon size={18} className="text-teal" />
              </div>
              <h3 className="font-bold text-white text-sm mb-2">{title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <div className="py-12" />
    <Footer />
  </div>
);

export default AboutPage;
