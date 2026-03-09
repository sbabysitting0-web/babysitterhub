import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronRight, ChevronLeft, CheckCircle, User, Baby, MapPin, Heart, Plus, Trash2,
} from "lucide-react";
import newLogo from "@/assets/new logo.png";

const TEAL = "#3DBEB5";
const BG = "#080F0D";
const CARD = "#0E1E1A";
const BDR = "rgba(255,255,255,0.08)";

const STEPS = [
  { label: "About You",   icon: User },
  { label: "Children",    icon: Baby },
  { label: "Location",    icon: MapPin },
  { label: "Preferences", icon: Heart },
  { label: "Done!",       icon: CheckCircle },
];

const CARE_TYPES = ["Regular babysitting","Occasional babysitting","After school care","Overnight care","Emergency care","Full-time nanny"];
const GENDERS = ["Male","Female","Non-binary","Prefer not to say"];

interface Child { name: string; age: string; special_needs: string; }

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", style, ...props }, ref) => (
    <input ref={ref} {...props} style={{ fontSize: 16, ...style }}
      className={`w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-3 outline-none focus:border-[#3DBEB5]/50 transition-all ${className}`} />
  )
);
Input.displayName = "Input";

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} style={{ fontSize: 16, ...(props.style ?? {}) }}
    className={`w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-3 outline-none focus:border-[#3DBEB5]/50 transition-all resize-none ${props.className ?? ""}`} />
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-sm font-medium text-white/60 mb-1.5">{children}</label>
);

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick}
    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
    style={{ borderColor: active ? TEAL : "rgba(255,255,255,0.12)", background: active ? "rgba(61,190,181,0.15)" : "transparent", color: active ? TEAL : "rgba(255,255,255,0.45)" }}>
    {children}
  </button>
);

const YesNo = ({ value, onChange, label }: { value: boolean | null; onChange: (v: boolean) => void; label: string }) => (
  <div className="flex items-center justify-between p-4 rounded-xl border" style={{ border: `1px solid ${BDR}`, background: "rgba(255,255,255,0.02)" }}>
    <span className="text-sm text-white/70">{label}</span>
    <div className="flex gap-2">
      {[true, false].map(v => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          className="px-4 py-1.5 rounded-full text-xs font-medium border transition-all"
          style={{ borderColor: value === v ? TEAL : "rgba(255,255,255,0.12)", background: value === v ? "rgba(61,190,181,0.15)" : "transparent", color: value === v ? TEAL : "rgba(255,255,255,0.45)" }}>
          {v ? "Yes" : "No"}
        </button>
      ))}
    </div>
  </div>
);

const ParentOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // About
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [about, setAbout] = useState("");

  // Children
  const [children, setChildren] = useState<Child[]>([{ name: "", age: "", special_needs: "" }]);

  // Location
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  // Preferences
  const [careTypes, setCareTypes] = useState<string[]>([]);
  const [petsAtHome, setPetsAtHome] = useState<boolean | null>(null);
  const [sitterWithPets, setSitterWithPets] = useState<boolean | null>(null);

  // Load existing data
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: p }, { data: kids }] = await Promise.all([
        supabase.from("parent_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("children").select("*").eq("parent_id", user.id),
      ]);
      if (p) {
        setIsEditing(true);
        setName(p.name ?? "");
        setPhone(p.phone ?? "");
        setAbout(p.about ?? "");
        setCity(p.city ?? "");
        setAddress(p.address ?? "");
        const prefs = (p as any).preferences ?? {};
        setCareTypes(prefs.care_types ?? []);
        setPetsAtHome(prefs.pets_at_home ?? null);
        setSitterWithPets(prefs.sitter_with_pets ?? null);
        setGender((p as any).gender ?? "");
      }
      if (kids && kids.length > 0) {
        setChildren(kids.map(c => ({ name: c.name ?? "", age: c.age != null ? String(c.age) : "", special_needs: c.special_needs ?? "" })));
      }
      setDataLoading(false);
    };
    load();
  }, [user]);

  const addChild = () => setChildren(prev => [...prev, { name: "", age: "", special_needs: "" }]);
  const removeChild = (i: number) => setChildren(prev => prev.filter((_, idx) => idx !== i));
  const updateChild = (i: number, field: keyof Child, val: string) => {
    setChildren(prev => { const n = [...prev]; n[i][field] = val; return n; });
  };

  const saveAll = async () => {
    if (!user) return;
    setLoading(true);
    const preferences = { care_types: careTypes, pets_at_home: petsAtHome, sitter_with_pets: sitterWithPets };
    const base: any = {
      user_id: user.id,
      name: name || user.email?.split("@")[0] || "Parent",
      phone: phone || null,
      about: about || null,
      city: city || null,
      address: address || null,
      updated_at: new Date().toISOString(),
    };
    const extra = { ...base, preferences, gender: gender || null };
    const { error } = await supabase.from("parent_profiles").upsert(extra, { onConflict: "user_id" });
    if (error) await supabase.from("parent_profiles").upsert(base, { onConflict: "user_id" });

    Promise.resolve(supabase.rpc("ensure_user_record", { p_role: "parent" })).catch(() => {});
    await supabase.from("user_roles").upsert({ user_id: user.id, role: "parent" }, { onConflict: "user_id" });

    const valid = children.filter(c => c.name.trim());
    await supabase.from("children").delete().eq("parent_id", user.id);
    if (valid.length > 0) {
      await supabase.from("children").insert(valid.map(c => ({
        parent_id: user.id, name: c.name.trim(), age: c.age ? parseInt(c.age) : null, special_needs: c.special_needs.trim() || null,
      })));
    }
    toast({ title: "Profile saved!", description: "Welcome to BabyCare!" });
    setLoading(false);
  };

  const goNext = async () => {
    if (step === STEPS.length - 2) {
      await saveAll();
      setStep(STEPS.length - 1);
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-10" style={{ background: BG }}>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(61,190,181,0.08) 0%, transparent 70%)" }} />

      {isEditing && (
        <Link to="/parent/dashboard"
          className="fixed top-5 left-5 z-50 flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-all"
          style={{ color: "rgba(255,255,255,0.45)" }}>
          <ChevronLeft size={15} /> Back to Dashboard
        </Link>
      )}

      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 justify-center mb-4">
            <img src={newLogo} alt="BabyCare" className="h-7 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
            <span className="text-lg font-bold text-white">Baby<span style={{ color: TEAL }}>Care</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {dataLoading ? "Loading…" : isEditing ? "Edit your profile" : "Set up your profile"}
          </h1>
          <p className="text-white/40 mt-1 text-sm">
            {step === STEPS.length - 1 ? "All done!" : `Step ${step + 1} of ${STEPS.length} — ${STEPS[step].label}`}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6 px-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <React.Fragment key={s.label}>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300"
                    style={{ borderColor: done || active ? TEAL : BDR, background: done ? TEAL : active ? "rgba(61,190,181,0.15)" : "transparent" }}>
                    {done ? <CheckCircle size={16} className="text-white" /> : <Icon size={16} style={{ color: active ? TEAL : "rgba(255,255,255,0.25)" }} />}
                  </div>
                  <span className="text-[10px] hidden sm:block" style={{ color: active ? TEAL : "rgba(255,255,255,0.25)" }}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className="h-px flex-1 mx-1 transition-all duration-300" style={{ background: i < step ? TEAL : BDR }} />}
              </React.Fragment>
            );
          })}
        </div>

        {dataLoading ? (
          <div className="rounded-2xl p-8 space-y-4" style={{ background: CARD, border: `1px solid ${BDR}` }}>
            {[1,2,3].map(i => <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />)}
          </div>
        ) : (
          <div className="rounded-2xl p-8" style={{ background: CARD, border: `1px solid ${BDR}` }}>

            {/* Step 0: About */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-white">About you</h2>
                <div className="space-y-1.5"><Label>Full name *</Label><Input placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Phone number</Label><Input placeholder="+65 9123 4567" value={phone} onChange={e => setPhone(e.target.value)} /></div>
                <div className="space-y-1.5">
                  <Label>Gender <span className="text-white/30 text-xs">(optional)</span></Label>
                  <div className="flex flex-wrap gap-2">
                    {GENDERS.map(g => <Chip key={g} active={gender === g} onClick={() => setGender(gender === g ? "" : g)}>{g}</Chip>)}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>About you <span className="text-white/30 text-xs">(optional)</span></Label>
                  <Textarea placeholder="Tell babysitters a little about your family..." rows={3} value={about} onChange={e => setAbout(e.target.value)} />
                </div>
              </div>
            )}

            {/* Step 1: Children */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-white">Your children</h2>
                <p className="text-sm text-white/40">Help babysitters understand who they'll be caring for.</p>
                {children.map((child, i) => (
                  <div key={i} className="rounded-xl p-4 space-y-3" style={{ border: `1px solid ${BDR}`, background: "rgba(255,255,255,0.02)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white/70">Child {i + 1}</span>
                      {children.length > 1 && (
                        <button onClick={() => removeChild(i)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 size={15} /></button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><label className="text-xs text-white/50">Name</label><Input placeholder="Emma" value={child.name} onChange={e => updateChild(i, "name", e.target.value)} /></div>
                      <div className="space-y-1"><label className="text-xs text-white/50">Age</label><Input type="number" placeholder="3" min={0} max={18} value={child.age} onChange={e => updateChild(i, "age", e.target.value)} /></div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-white/50">Special needs / notes <span className="text-white/30">(optional)</span></label>
                      <Input placeholder="Allergies, dietary needs, etc." value={child.special_needs} onChange={e => updateChild(i, "special_needs", e.target.value)} />
                    </div>
                  </div>
                ))}
                <button onClick={addChild} className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-all" style={{ color: TEAL }}>
                  <Plus size={16} /> Add another child
                </button>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-white">Your location</h2>
                <p className="text-sm text-white/40">This helps match you with babysitters nearby.</p>
                <div className="space-y-1.5"><Label>City / Area *</Label><Input placeholder="e.g. Singapore, Woodlands" value={city} onChange={e => setCity(e.target.value)} /></div>
                <div className="space-y-1.5">
                  <Label>Address <span className="text-white/30 text-xs">(optional)</span></Label>
                  <Input placeholder="Street address" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              </div>
            )}

            {/* Step 3: Preferences */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-white">Care preferences</h2>
                <p className="text-sm text-white/40">Help us find the right babysitter for your family.</p>
                <div className="space-y-2">
                  <Label>Type of care needed</Label>
                  <div className="flex flex-wrap gap-2">
                    {CARE_TYPES.map(t => (
                      <Chip key={t} active={careTypes.includes(t)}
                        onClick={() => setCareTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}>
                        {t}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Home &amp; comfort</Label>
                  <YesNo value={petsAtHome} onChange={setPetsAtHome} label="Do you have pets at home?" />
                  <YesNo value={sitterWithPets} onChange={setSitterWithPets} label="Are you OK with a babysitter who has pets?" />
                </div>
              </div>
            )}

            {/* Step 4: Done */}
            {step === 4 && (
              <div className="text-center space-y-5 py-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(61,190,181,0.15)" }}>
                  <CheckCircle className="w-10 h-10" style={{ color: TEAL }} />
                </div>
                <h2 className="text-2xl font-bold text-white">You're all set!</h2>
                <p className="text-white/40 max-w-xs mx-auto">Your profile is ready. Start browsing babysitters near you.</p>
                <div className="flex items-center justify-center gap-6 text-sm text-white/40 pt-1">
                  {children.filter(c => c.name.trim()).length > 0 && (
                    <span><strong className="text-white">{children.filter(c => c.name.trim()).length}</strong> {children.filter(c => c.name.trim()).length === 1 ? "child" : "children"}</span>
                  )}
                  {careTypes.length > 0 && <span><strong className="text-white">{careTypes.length}</strong> care types</span>}
                  {city && <span><strong className="text-white">{city}</strong></span>}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium border transition-all disabled:opacity-30"
                style={{ color: "rgba(255,255,255,0.6)", borderColor: BDR }}>
                <ChevronLeft size={16} /> Back
              </button>
              {step === STEPS.length - 1 ? (
                <button onClick={() => navigate("/parent/dashboard")}
                  className="px-7 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all"
                  style={{ background: TEAL }}>
                  Find babysitters
                </button>
              ) : (
                <button onClick={goNext} disabled={loading}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50"
                  style={{ background: TEAL }}>
                  {loading ? "Saving…" : "Next"} <ChevronRight size={16} />
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
