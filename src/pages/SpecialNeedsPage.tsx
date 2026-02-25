import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Heart, Search, MessageCircle, Shield, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  { icon: Search, title: "Dedicated filters", body: "Filter sitters by specific experience: autism, ADHD, physical disabilities, sensory sensitivities, and more." },
  { icon: Heart, title: "Caring & trained sitters", body: "Many of our sitters have worked with children with special needs professionally or have personal experience with family members." },
  { icon: MessageCircle, title: "Direct messaging", body: "Chat openly with sitters before booking. Share your child's routine, triggers, preferred communication style — everything that makes care work." },
  { icon: Shield, title: "Background verified", body: "Every sitter on our platform is ID-checked and background-screened regardless of the care type." },
  { icon: CheckCircle, title: "Trial bookings", body: "We recommend a short trial booking first. This lets your child get comfortable with the sitter before a full session." },
];

const SpecialNeedsPage = () => (
  <div className="min-h-screen" style={{ background: "#080F0D" }}>
    <Navbar />

    {/* Hero */}
    <section className="relative overflow-hidden py-24">
      <div className="absolute pointer-events-none" style={{ top: "-80px", right: "-60px", width: "520px", height: "520px", background: "radial-gradient(circle, rgba(61,190,181,0.12) 0%, transparent 65%)", borderRadius: "50%", filter: "blur(60px)" }} />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ width: "70px", height: "140px", background: "linear-gradient(90deg, rgba(61,190,181,0.11) 0%, transparent 100%)", borderRadius: "0 140px 140px 0", border: "1px solid rgba(61,190,181,0.13)", borderLeft: "none" }} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-teal text-xs font-bold uppercase tracking-widest mb-4">Inclusive care</span>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-white mb-5">
            Special needs childcare in Singapore
          </h1>
          <p className="text-white/50 text-base max-w-2xl mx-auto leading-relaxed">
            Every child deserves a sitter who truly understands them. BabySitterHub helps families with children with additional needs find experienced, compassionate carers.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {features.map(({ icon: Icon, title, body }, i) => (
            <div key={i} className="bg-[#0E1E1A] border border-white/6 rounded-2xl p-6 hover:border-teal/25 hover:shadow-xl hover:shadow-teal/5 transition-all group">
              <div className="w-11 h-11 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center mb-5 group-hover:bg-teal/15 transition-colors">
                <Icon size={20} className="text-teal" />
              </div>
              <h3 className="font-heading font-bold text-white text-sm mb-2">{title}</h3>
              <p className="text-xs text-white/45 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Tips box */}
        <div className="bg-[#0E1E1A] border border-white/6 rounded-3xl p-8 mb-10">
          <h2 className="text-lg font-heading font-bold text-white mb-5">Tips for finding the right sitter</h2>
          <ul className="space-y-3">
            {[
              "Use the search filters to select your child's specific needs.",
              "In your message to the sitter, share your child's daily routine and any non-negotiables.",
              "Ask the sitter how they handle meltdowns or sensory overload.",
              "Start with a shorter trial booking — 1–2 hours with you at home.",
              "After a successful trial, build a regular schedule for consistency.",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-teal/15 border border-teal/25 text-teal text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-sm text-white/50">{tip}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/babysitters" className="inline-flex items-center gap-2 bg-teal text-white font-semibold px-8 py-4 rounded-full text-sm hover:bg-teal/90 transition-all hover:shadow-lg hover:shadow-teal/30">
            Find a special needs sitter <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

export default SpecialNeedsPage;
