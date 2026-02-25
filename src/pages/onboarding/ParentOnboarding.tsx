import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, ChevronLeft, Plus, Trash2, CheckCircle } from "lucide-react";
import newLogo from "@/assets/new logo.png";

interface Child { name: string; age: string; special_needs: string; }
const STEPS = ["Your Profile", "Your Children", "Location", "Done!"];

const DarkInput = ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal/50 focus:ring-2 focus:ring-teal/10 transition-all ${className}`} />
);
const DarkTextarea = ({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className={`w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal/50 focus:ring-2 focus:ring-teal/10 transition-all resize-none ${className}`} />
);

const ParentOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([{ name: "", age: "", special_needs: "" }]);

  const { register, getValues, reset } = useForm({
    defaultValues: { name: "", phone: "", about: "", city: "", address: "" },
  });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setDataLoading(true);
      const [{ data: profile }, { data: existingChildren }] = await Promise.all([
        supabase.from("parent_profiles").select("name, phone, about, city, address").eq("user_id", user.id).maybeSingle(),
        supabase.from("children").select("name, age, special_needs").eq("parent_id", user.id),
      ]);
      if (profile) reset({ name: profile.name ?? "", phone: profile.phone ?? "", about: profile.about ?? "", city: profile.city ?? "", address: profile.address ?? "" });
      if (existingChildren && existingChildren.length > 0) {
        setChildren(existingChildren.map((c) => ({ name: c.name ?? "", age: c.age != null ? String(c.age) : "", special_needs: c.special_needs ?? "" })));
      }
      setDataLoading(false);
    };
    load();
  }, [user, reset]);

  const addChild = () => setChildren([...children, { name: "", age: "", special_needs: "" }]);
  const removeChild = (i: number) => setChildren(children.filter((_, idx) => idx !== i));
  const updateChild = (i: number, field: keyof Child, val: string) => {
    const updated = [...children]; updated[i][field] = val; setChildren(updated);
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    const values = getValues();
    const { error: profileError } = await supabase.from("parent_profiles").upsert({
      user_id: user.id,
      name: values.name || user.email?.split("@")[0] || "Parent",
      phone: values.phone || null,
      about: values.about || null,
      city: values.city || null,
      address: values.address || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    if (profileError) {
      toast({ title: "Failed to save profile", description: profileError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const { error: rpcError } = await supabase.rpc("ensure_user_record", { p_role: "parent" });
    if (rpcError) await supabase.from("users").upsert({ id: user.id, role: "parent" }, { onConflict: "id" });
    await supabase.from("user_roles").upsert({ user_id: user.id, role: "parent" }, { onConflict: "user_id" });

    const validChildren = children.filter((c) => c.name.trim());
    await supabase.from("children").delete().eq("parent_id", user.id);
    if (validChildren.length > 0) {
      await supabase.from("children").insert(validChildren.map((c) => ({
        parent_id: user.id, name: c.name.trim(), age: c.age ? parseInt(c.age) : null, special_needs: c.special_needs.trim() || null,
      })));
    }

    toast({ title: "Profile saved!", description: "Welcome to BabySitterHub!" });
    setLoading(false);
    navigate("/parent/dashboard");
  };

  const teal = "#3DBEB5";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#080F0D" }}>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(61,190,181,0.07) 0%, transparent 70%)" }} />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 justify-center mb-5">
            <img src={newLogo} alt="BabySitterHub" className="h-7 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
            <span className="text-lg font-heading font-bold text-white">BabySitter<span style={{ color: teal }}>Hub</span></span>
          </Link>
          <h1 className="text-2xl font-heading font-bold text-white">
            {dataLoading ? "Loading your profile…" : "Set up your profile"}
          </h1>
          <p className="text-white/40 mt-1 text-sm">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="h-1.5 flex-1 rounded-full transition-colors" style={{ background: i <= step ? teal : "rgba(255,255,255,0.1)" }} />
          ))}
        </div>

        {dataLoading ? (
          <div className="rounded-2xl p-8 space-y-4" style={{ background: "#0E1E1A", border: "1px solid rgba(255,255,255,0.08)" }}>
            {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />)}
          </div>
        ) : (
          <div className="rounded-2xl p-8" style={{ background: "#0E1E1A", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Step 0: Profile */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-base font-heading font-bold text-white">About you</h2>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/60">Full name</label>
                  <DarkInput placeholder="Jane Smith" {...register("name", { required: true })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/60">Phone number</label>
                  <DarkInput placeholder="+65 9123 4567" {...register("phone")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/60">About you <span className="text-white/30 text-xs">(optional)</span></label>
                  <DarkTextarea placeholder="Tell babysitters a little about yourself..." {...register("about")} rows={3} />
                </div>
              </div>
            )}

            {/* Step 1: Children */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-base font-heading font-bold text-white">Your children</h2>
                {children.map((child, i) => (
                  <div key={i} className="rounded-xl p-4 space-y-3" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white/70">Child {i + 1}</span>
                      {children.length > 1 && (
                        <button onClick={() => removeChild(i)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 size={16} /></button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-white/50">Name</label>
                        <DarkInput placeholder="Emma" value={child.name} onChange={(e) => updateChild(i, "name", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-white/50">Age</label>
                        <DarkInput type="number" placeholder="3" min={0} max={18} value={child.age} onChange={(e) => updateChild(i, "age", e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/50">Special needs / notes <span className="text-white/30">(optional)</span></label>
                      <DarkInput placeholder="Allergies, dietary needs, etc." value={child.special_needs} onChange={(e) => updateChild(i, "special_needs", e.target.value)} />
                    </div>
                  </div>
                ))}
                <button onClick={addChild} className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80" style={{ color: teal }}>
                  <Plus size={16} /> Add another child
                </button>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-base font-heading font-bold text-white">Your location</h2>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/60">City / Area</label>
                  <DarkInput placeholder="e.g. Singapore, Woodlands" {...register("city")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/60">Address <span className="text-white/30 text-xs">(optional)</span></label>
                  <DarkInput placeholder="Street address" {...register("address")} />
                </div>
              </div>
            )}

            {/* Step 3: Done */}
            {step === 3 && (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(61,190,181,0.15)" }}>
                  <CheckCircle className="w-8 h-8" style={{ color: teal }} />
                </div>
                <h2 className="text-xl font-heading font-bold text-white">You're all set!</h2>
                <p className="text-white/40 text-sm">Your profile is ready. Start browsing babysitters near you.</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(step - 1)}
                disabled={step === 0}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium text-white/60 border border-white/10 hover:border-white/20 transition-all disabled:opacity-30"
              >
                <ChevronLeft size={16} /> Back
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: teal }}
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: teal }}
                >
                  {loading ? "Saving…" : "Save & Go to Dashboard"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentOnboarding;
