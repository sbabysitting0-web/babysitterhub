import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { User, Star, Shield, Clock, Award, MessageCircle } from "lucide-react";

const tips = [
  { icon: User, title: "Build a stand-out profile", body: "Add a friendly photo, write a warm bio, and list all your childcare experience. Families shortlist sitters in seconds — first impressions matter." },
  { icon: Award, title: "Get certified", body: "Sitters with first aid or CPR certificates appear higher in search results and can often charge higher rates. Look into courses at the Singapore Red Cross." },
  { icon: Star, title: "Collect reviews early", body: "After your first few bookings, politely ask families to leave a review. A handful of five-star reviews dramatically increases your visibility." },
  { icon: Clock, title: "Keep your availability up to date", body: "Families searching for last-minute care need sitters who respond fast. Keeping your calendar accurate means you show up in the right searches." },
  { icon: MessageCircle, title: "Communicate proactively", body: "If you're running late, let the family know immediately. Clear, timely communication builds trust and leads to repeat bookings." },
  { icon: Shield, title: "Know your limits", body: "Be honest about what ages or care needs you can confidently handle. Specialising (babies, toddlers, special needs) can make you a top pick in your niche." },
];

const TipsBabysittersPage = () => (
  <div className="min-h-screen" style={{ background: "#080F0D" }}>
    <Navbar />
    <section className="relative overflow-hidden py-24">
      <div className="absolute pointer-events-none" style={{ top: "-80px", left: "-60px", width: "480px", height: "480px", background: "radial-gradient(circle, rgba(61,190,181,0.11) 0%, transparent 65%)", borderRadius: "50%", filter: "blur(55px)" }} />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ width: "65px", height: "130px", background: "linear-gradient(270deg, rgba(61,190,181,0.10) 0%, transparent 100%)", borderRadius: "130px 0 0 130px", border: "1px solid rgba(61,190,181,0.12)", borderRight: "none" }} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-teal text-xs font-bold uppercase tracking-widest mb-4">Sitters guide</span>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-white mb-5">Tips for babysitters</h1>
          <p className="text-white/50 text-base max-w-xl mx-auto">
            Grow your bookings, build your reputation, and make childcare a career you love.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {tips.map(({ icon: Icon, title, body }, i) => (
            <div key={i} className="bg-[#0E1E1A] border border-white/6 rounded-2xl p-7 hover:border-teal/25 hover:shadow-xl hover:shadow-teal/5 transition-all group">
              <div className="w-11 h-11 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center mb-5 group-hover:bg-teal/15 transition-colors">
                <Icon size={20} className="text-teal" />
              </div>
              <h3 className="font-heading font-bold text-white text-base mb-3">{title}</h3>
              <p className="text-sm text-white/45 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-[#0E1E1A] border border-teal/15 rounded-3xl p-8 text-center">
          <p className="text-white font-semibold mb-1">Ready to start earning?</p>
          <p className="text-white/40 text-sm mb-5">Join 12,000+ sitters already working with great families across Singapore.</p>
          <a href="/signup?role=babysitter" className="inline-flex items-center gap-2 bg-teal text-white font-semibold px-7 py-3.5 rounded-full text-sm hover:bg-teal/90 transition-all hover:shadow-lg hover:shadow-teal/25">
            Create your sitter profile
          </a>
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default TipsBabysittersPage;
