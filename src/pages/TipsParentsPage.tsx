import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Search, MessageCircle, Shield, Star, CheckCircle, Clock } from "lucide-react";

const tips = [
  { icon: Search, title: "Write a detailed job posting", body: "Include the ages of your children, the days and hours you need cover, any special requirements, and your preferred communication style. The more detail you give, the better the match." },
  { icon: Shield, title: "Always verify credentials", body: "Even though all sitters are background checked by BabyCare, ask for references from previous families. A brief phone or video call with a reference adds another layer of confidence." },
  { icon: MessageCircle, title: "Arrange a meet-and-greet first", body: "A 20-minute meeting at home or at a café lets you see how the sitter interacts with your children before you commit to a booking. Trust your instincts." },
  { icon: Star, title: "Set clear expectations", body: "Share your house rules, bedtime routines, dietary restrictions, and emergency contacts before the first session. A well-briefed sitter is a confident one." },
  { icon: CheckCircle, title: "Leave a review", body: "After each booking, take two minutes to leave a review. It helps other families and rewards great sitters with better visibility." },
  { icon: Clock, title: "Book regularly to build a relationship", body: "A sitter who knows your family well can handle unexpected situations calmly. Consistent bookings with the same person are often the best outcome for children." },
];

const TipsParentsPage = () => (
  <div className="min-h-screen" style={{ background: "#080F0D" }}>
    <Navbar />
    <section className="relative overflow-hidden py-24">
      <div className="absolute pointer-events-none" style={{ top: "-80px", right: "-60px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(61,190,181,0.11) 0%, transparent 65%)", borderRadius: "50%", filter: "blur(55px)" }} />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ width: "65px", height: "130px", background: "linear-gradient(90deg, rgba(61,190,181,0.10) 0%, transparent 100%)", borderRadius: "0 130px 130px 0", border: "1px solid rgba(61,190,181,0.12)", borderLeft: "none" }} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-teal text-xs font-bold uppercase tracking-widest mb-4">Parents guide</span>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-white mb-5">Tips for parents</h1>
          <p className="text-white/50 text-base max-w-xl mx-auto">
            Make the most of BabyCare. Here's how to find, vet, and work brilliantly with your babysitter.
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
      </div>
    </section>
    <Footer />
  </div>
);

export default TipsParentsPage;
