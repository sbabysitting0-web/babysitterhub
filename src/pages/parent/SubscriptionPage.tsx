import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Crown, Check, Star } from "lucide-react";
import newLogo from "@/assets/new logo.png";

const TEAL   = "#3DBEB5";
const BG     = "#080F0D";
const CARD   = "#0E1E1A";
const BORDER = "rgba(255,255,255,0.08)";

const plans = [
  {
    id: "basic", name: "Basic", price: "Free", period: "forever",
    description: "Get started with essential features", highlight: false,
    features: ["Browse babysitter profiles", "View ratings & reviews", "1 message per sitter/month", "Basic search filters"],
    cta: "Current plan",
  },
  {
    id: "premium", name: "Premium", price: "SGD 12", period: "/ month",
    description: "Unlimited access + priority features", highlight: true,
    features: ["Everything in Basic", "Unlimited messaging", "Unlimited bookings", "Advanced filters", "Priority support", "Book with one click"],
    cta: "Upgrade to Premium",
  },
];

const SubscriptionPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentSub, setCurrentSub] = useState<{ plan: string; status: string; end_date: string | null } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("subscriptions").select("plan, status, end_date").eq("parent_id", user.id).eq("status", "active").maybeSingle()
      .then(({ data }) => { if (data) setCurrentSub(data as { plan: string; status: string; end_date: string | null }); });
  }, [user]);

  const handleUpgrade = async (planId: string) => {
    if (!user) { navigate("/login"); return; }
    if (planId === "basic") return;
    setLoading(true);
    const endDate = new Date(); endDate.setMonth(endDate.getMonth() + 1);
    await supabase.from("subscriptions").update({ status: "expired" }).eq("parent_id", user.id);
    const { error } = await supabase.from("subscriptions").insert({ parent_id: user.id, plan: planId as "basic" | "premium", status: "active", start_date: new Date().toISOString().split("T")[0], end_date: endDate.toISOString().split("T")[0] });
    setLoading(false);
    if (error) { toast({ title: "Upgrade failed", description: error.message, variant: "destructive" }); return; }
    setCurrentSub({ plan: planId, status: "active", end_date: endDate.toISOString().split("T")[0] });
    toast({ title: "Welcome to Premium! 🎉", description: "You now have full access to all features." });
  };

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Topbar */}
      <header className="sticky top-0 z-30" style={{ background: CARD, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-4xl mx-auto px-4 flex items-center h-14">
          <Link to="/" className="flex items-center gap-2">
            <img src={newLogo} alt="Logo" className="h-6 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
            <span className="font-heading font-bold text-white text-sm">BabySitter<span style={{ color: TEAL }}>Hub</span></span>
          </Link>
        </div>
      </header>

      <div className="container py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(61,190,181,0.12)" }}>
            <Crown className="w-7 h-7" style={{ color: TEAL }} />
          </div>
          <h1 className="text-3xl font-heading font-bold text-white mb-3">Choose your plan</h1>
          <p style={{ color: "rgba(255,255,255,0.45)" }}>Babysitters always use BabySitter for free. Parents choose their plan.</p>
        </div>

        {/* Current subscription banner */}
        {currentSub && (
          <div className="rounded-2xl p-5 mb-8 flex items-center gap-4" style={{ background: "rgba(61,190,181,0.08)", border: "1px solid rgba(61,190,181,0.2)" }}>
            <Crown className="w-5 h-5 shrink-0" style={{ color: TEAL }} />
            <div>
              <p className="font-medium text-white text-sm">You're on the <span className="capitalize font-bold" style={{ color: TEAL }}>{currentSub.plan}</span> plan</p>
              {currentSub.end_date && <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Renews on {new Date(currentSub.end_date).toLocaleDateString("en-SG")}</p>}
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {plans.map((plan) => {
            const isActive = currentSub?.plan === plan.id || (!currentSub && plan.id === "basic");
            return (
              <div key={plan.id} className="relative rounded-2xl p-7 flex flex-col" style={{
                background: plan.highlight ? "rgba(61,190,181,0.05)" : CARD,
                border: plan.highlight ? `2px solid ${TEAL}` : `1px solid ${BORDER}`,
              }}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 text-white" style={{ background: TEAL }}>
                      <Star size={10} fill="currentColor" /> Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h2 className="text-xl font-heading font-bold text-white">{plan.name}</h2>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-heading font-bold text-white">{plan.price}</span>
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{plan.period}</span>
                  </div>
                  <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>{plan.description}</p>
                </div>
                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-white">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: TEAL }} /> {feature}
                    </li>
                  ))}
                </ul>
                <button disabled={isActive || plan.id === "basic" || loading} onClick={() => handleUpgrade(plan.id)}
                  className="w-full py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: plan.highlight ? TEAL : "rgba(255,255,255,0.06)", color: "#fff", border: plan.highlight ? "none" : `1px solid ${BORDER}` }}>
                  {isActive ? "✓ Current plan" : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="rounded-2xl p-6" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <h3 className="font-heading font-bold text-white mb-4">Frequently asked questions</h3>
          <div className="space-y-4">
            {[
              { q: "Is it really free for babysitters?", a: "Yes! Babysitters always use the platform for free. No commission, no fees." },
              { q: "Can I cancel my subscription?", a: "Yes, you can cancel anytime. Your Premium access continues until the end of the billing period." },
              { q: "What payment methods are accepted?", a: "Credit/debit cards, PayNow, and major digital wallets are supported." },
            ].map((item) => (
              <div key={item.q} className="pb-4 last:pb-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <p className="font-medium text-sm text-white mb-1">{item.q}</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
