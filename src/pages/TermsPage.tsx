import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const tabs = ["Terms of Service", "Privacy Policy"] as const;
type Tab = typeof tabs[number];

const terms = `**Effective date:** 1 January 2024

## 1. Acceptance of Terms
By accessing or using BabySitterHub ("Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.

## 2. Eligibility
You must be at least 18 years old to use the Platform. By using it, you represent that you meet this requirement.

## 3. Account Responsibilities
You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.

## 4. Platform Role
BabySitterHub is a marketplace connecting families with independent childcare providers. We do not employ sitters and are not liable for the conduct of any user.

## 5. Payments
All payments are processed securely through the Platform. Funds are held and released only upon confirmation of completed care.

## 6. Termination
We reserve the right to suspend or terminate accounts that violate these Terms without prior notice.

## 7. Limitation of Liability
To the maximum extent permitted by law, BabySitterHub shall not be liable for any indirect, incidental, or consequential damages arising from Platform use.

## 8. Governing Law
These Terms are governed by the laws of Singapore.`;

const privacy = `**Effective date:** 1 January 2024

## 1. Information We Collect
We collect information you provide (name, email, ID documents) and usage data (pages visited, search queries) to operate and improve the Platform.

## 2. How We Use It
Your information is used to match families with sitters, process payments, send updates, and comply with legal obligations.

## 3. Sharing
We do not sell your data. We share only what is necessary with payment processors and identity verification partners, subject to their own privacy policies.

## 4. Data Retention
We retain your data for as long as your account is active or as required by law.

## 5. Your Rights
You may request access to, correction of, or deletion of your personal data at any time by emailing hello@babysitterhub.sg.

## 6. Cookies
We use cookies to maintain sessions and analyse usage. You can disable cookies in your browser settings.

## 7. Contact
For privacy queries, contact us at hello@babysitterhub.sg.`;

const renderMd = (text: string) =>
  text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) return <h2 key={i} className="text-base font-heading font-bold text-white mt-8 mb-2">{line.slice(3)}</h2>;
    if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="text-xs text-teal font-semibold mb-4">{line.slice(2, -2)}</p>;
    if (!line.trim()) return <div key={i} className="h-1" />;
    return <p key={i} className="text-sm text-white/45 leading-relaxed mb-1">{line}</p>;
  });

const TermsPage = () => {
  const [active, setActive] = useState<Tab>("Terms of Service");
  return (
    <div className="min-h-screen" style={{ background: "#080F0D" }}>
      <Navbar />
      <section className="relative overflow-hidden py-20">
        <div className="absolute pointer-events-none" style={{ top: "-60px", left: "-60px", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(61,190,181,0.10) 0%, transparent 65%)", borderRadius: "50%", filter: "blur(50px)" }} />
        <div className="absolute right-0 top-1/3 pointer-events-none" style={{ width: "65px", height: "130px", background: "linear-gradient(270deg, rgba(61,190,181,0.10) 0%, transparent 100%)", borderRadius: "130px 0 0 130px", border: "1px solid rgba(61,190,181,0.12)", borderRight: "none" }} />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-teal text-xs font-bold uppercase tracking-widest mb-4">Legal</span>
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-white">Terms & Privacy</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-[#0E1E1A] border border-white/6 rounded-2xl p-1.5 mb-8">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActive(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${active === t ? "bg-teal text-white shadow-lg" : "text-white/40 hover:text-white"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="bg-[#0E1E1A] border border-white/6 rounded-3xl p-8">
            {renderMd(active === "Terms of Service" ? terms : privacy)}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default TermsPage;
