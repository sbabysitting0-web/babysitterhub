import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { ChevronDown } from "lucide-react";

const parentFaqs = [
  { q: "How do I find a babysitter?", a: "Search by your area or use the filter to narrow by availability, rate, and qualifications. You can message sitters directly and arrange a meet-and-greet before confirming." },
  { q: "Are sitters background checked?", a: "Yes. Every sitter on BabySitterHub goes through ID verification and a background/police check before their profile goes live." },
  { q: "How does payment work?", a: "You pay securely via the platform after a booking is confirmed. Funds are only released to the sitter after care is completed." },
  { q: "Can I cancel a booking?", a: "Yes. You can cancel up to 24 hours before the booking for a full refund. Cancellations within 24 hours may incur a small fee — see our Terms for details." },
  { q: "What if something goes wrong?", a: "Our support team is available 7 days a week. Contact us at hello@babysitterhub.sg and we'll resolve any issue promptly." },
];

const sitterFaqs = [
  { q: "How do I create a profile?", a: "Sign up as a babysitter, complete our verification steps, upload your ID, and fill in your experience, availability and rates. Once approved you'll appear in search results." },
  { q: "When do I get paid?", a: "Payment is released to your account within 24 hours of the booking completing." },
  { q: "What qualifications do I need?", a: "There's no single required certification, but sitters with first aid, CPR, or childcare qualifications rank higher in search results." },
  { q: "Can I set my own rates?", a: "Yes. You set your hourly rate and can adjust it anytime from your dashboard." },
];

const FAQ = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/6 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/3 transition-colors"
      >
        <span className="text-sm font-semibold text-white">{q}</span>
        <ChevronDown size={16} className={`text-teal flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-sm text-white/50 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
};

const HelpPage = () => (
  <div className="min-h-screen" style={{ background: "#080F0D" }}>
    <Navbar />
    <section className="relative overflow-hidden py-24">
      <div className="absolute pointer-events-none" style={{ top: "-60px", right: "-80px", width: "450px", height: "450px", background: "radial-gradient(circle, rgba(61,190,181,0.11) 0%, transparent 65%)", borderRadius: "50%", filter: "blur(55px)" }} />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ width: "65px", height: "130px", background: "linear-gradient(90deg, rgba(61,190,181,0.10) 0%, transparent 100%)", borderRadius: "0 130px 130px 0", border: "1px solid rgba(61,190,181,0.12)", borderLeft: "none" }} />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-teal text-xs font-bold uppercase tracking-widest mb-4">Help & Support</span>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-white mb-4">How can we help?</h1>
          <p className="text-white/50">Find answers to the most common questions below.</p>
        </div>

        <div className="mb-10">
          <h2 className="text-lg font-heading font-bold text-white mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-teal/15 border border-teal/25 flex items-center justify-center text-xs text-teal font-bold">P</span>
            For Parents
          </h2>
          <div className="space-y-3">
            {parentFaqs.map((f) => <FAQ key={f.q} {...f} />)}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-heading font-bold text-white mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-teal/15 border border-teal/25 flex items-center justify-center text-xs text-teal font-bold">S</span>
            For Babysitters
          </h2>
          <div className="space-y-3">
            {sitterFaqs.map((f) => <FAQ key={f.q} {...f} />)}
          </div>
        </div>

        <div className="mt-14 bg-[#0E1E1A] border border-teal/15 rounded-3xl p-8 text-center">
          <p className="text-white font-semibold mb-1">Still need help?</p>
          <p className="text-white/40 text-sm mb-4">Our team replies within a few hours, 7 days a week.</p>
          <a href="mailto:hello@babysitterhub.sg" className="inline-flex items-center gap-2 bg-teal text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-teal/90 transition-all">
            Email us
          </a>
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default HelpPage;
