import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronRight, ChevronLeft, CheckCircle, X, Camera, User, Star, Baby, Calendar,
} from "lucide-react";


const TEAL = "#3DBEB5";
const BG = "#080F0D";
const CARD = "#0E1E1A";
const BDR = "rgba(255,255,255,0.08)";

const STEPS = [
  { label: "Photo & Intro", icon: Camera },
  { label: "About You",     icon: User },
  { label: "Experience",    icon: Star },
  { label: "Skills",        icon: Baby },
  { label: "Availability",  icon: Calendar },
  { label: "Done!",         icon: CheckCircle },
];

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const SKILLS = ["First Aid","CPR Certified","Special Needs","Homework Help","Swimming","Cooking","Music","Arts & Crafts","Sports","Newborn Care","Meal Prep","Tutoring","Pet Care","Driving"];
const LANGS  = ["English","Mandarin","Malay","Tamil","Hindi","French","Japanese","Korean","Spanish"];
const GENDERS = ["Male","Female","Non-binary","Prefer not to say"];
const AGE_GROUPS = [
  { label: "0–1 yr",   sub: "Newborn/Infant" },
  { label: "1–3 yrs",  sub: "Toddler" },
  { label: "3–6 yrs",  sub: "Preschool" },
  { label: "6–12 yrs", sub: "School-age" },
  { label: "12+ yrs",  sub: "Teen" },
];

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", style, ...props }, ref) => (
    <input ref={ref} {...props} style={{ fontSize: 16, ...style }}
      className={`w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-3 outline-none focus:border-[#3DBEB5]/50 transition-all ${className}`} />
  )
);
Input.displayName = "Input";

const Textarea = ({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
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

const toggle = (arr: string[], val: string) =>
  arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

const BabysitterOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [maxKids, setMaxKids] = useState("1");
  const [ageGroups, setAgeGroups] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [availability, setAvailability] = useState<{ [d: number]: { start: string; end: string; enabled: boolean } }>({
    0: { start: "09:00", end: "18:00", enabled: false },
    1: { start: "09:00", end: "18:00", enabled: true },
    2: { start: "09:00", end: "18:00", enabled: true },
    3: { start: "09:00", end: "18:00", enabled: true },
    4: { start: "09:00", end: "18:00", enabled: true },
    5: { start: "09:00", end: "18:00", enabled: true },
    6: { start: "09:00", end: "18:00", enabled: false },
  });

  // Load
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: p }, { data: av }] = await Promise.all([
        supabase.from("babysitter_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("babysitter_availability").select("*").eq("babysitter_id", user.id),
      ]);
      if (p) {
        setIsEditing(true);
        setName(p.name ?? "");
        setBio(p.bio ?? "");
        setCity(p.city ?? "");
        setHourlyRate(p.hourly_rate != null ? String(p.hourly_rate) : "");
        setYearsExp(p.years_experience != null ? String(p.years_experience) : "");
        setMaxKids(p.max_kids != null ? String(p.max_kids) : "1");
        setSkills(p.skills ?? []);
        setLanguages(p.languages ?? []);
        setPhotoUrl(p.photo_url ?? null);
        setPhotoPreview(p.photo_url ?? null);
        setHeadline((p as any).headline ?? "");
        setGender((p as any).gender ?? "");
        setAgeGroups((p as any).age_groups_served ?? []);
      }
      if (av && av.length > 0) {
        const next = { ...availability };
        av.forEach((r) => { next[r.day_of_week] = { start: r.start_time, end: r.end_time, enabled: r.is_available ?? true }; });
        setAvailability(next);
      }
      setDataLoading(false);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoUploading(true);
    const ext = file.name.split(".").pop();
    const path = `babysitters/${user.id}.${ext}`;
    await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    setPhotoUrl(urlData.publicUrl);
    setPhotoUploading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setLoading(true);
    const base: any = {
      user_id: user.id,
      name: name || user.email?.split("@")[0] || "Sitter",
      bio: bio || null,
      city: city || null,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : 0,
      years_experience: yearsExp ? parseInt(yearsExp) : 0,
      max_kids: maxKids ? parseInt(maxKids.replace("+","")) : 1,
      skills, languages,
      photo_url: photoUrl,
      updated_at: new Date().toISOString(),
    };
    // Try with new columns first
    const extra = { ...base, headline: headline || null, gender: gender || null, age_groups_served: ageGroups };
    const { error } = await supabase.from("babysitter_profiles").upsert(extra, { onConflict: "user_id" });
    if (error) await supabase.from("babysitter_profiles").upsert(base, { onConflict: "user_id" });

    const rows = Object.entries(availability).filter(([,v]) => v.enabled).map(([day,v]) => ({
      babysitter_id: user.id, day_of_week: parseInt(day), start_time: v.start, end_time: v.end, is_available: true,
    }));
    await supabase.from("babysitter_availability").delete().eq("babysitter_id", user.id);
    if (rows.length > 0) await supabase.from("babysitter_availability").insert(rows);
    Promise.resolve(supabase.rpc("ensure_user_record", { p_role: "babysitter" })).catch(() => {});
    toast({ title: "Profile saved!", description: "Parents in your area can now find you." });
    setLoading(false);
  };

  const goNext = async () => {
    if (step === STEPS.length - 2) {
      await saveProfile();
      setStep(STEPS.length - 1);
    } else {
      setStep(step + 1);
    }
  };

  const goDashboard = () => navigate("/babysitter/dashboard");

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-10" style={{ background: BG }}>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(61,190,181,0.08) 0%, transparent 70%)" }} />

      {isEditing && (
        <Link to="/babysitter/dashboard"
          className="fixed top-5 left-5 z-50 flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-all"
          style={{ color: "rgba(255,255,255,0.45)" }}>
          <ChevronLeft size={15} /> Back to Dashboard
        </Link>
      )}

      <div className="w-full max-w-xl relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 justify-center mb-4">

            <span className="text-lg font-bold text-white">Baby<span style={{ color: TEAL }}>Care</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {dataLoading ? "Loading…" : isEditing ? "Edit your profile" : "Create your sitter profile"}
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
                    {done
                      ? <CheckCircle size={16} className="text-white" />
                      : <Icon size={16} style={{ color: active ? TEAL : "rgba(255,255,255,0.25)" }} />}
                  </div>
                  <span className="text-[10px] hidden sm:block" style={{ color: active ? TEAL : "rgba(255,255,255,0.25)" }}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="h-px flex-1 mx-1 transition-all duration-300" style={{ background: i < step ? TEAL : BDR }} />
                )}
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

            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-white">Photo &amp; introduction</h2>
                <p className="text-sm text-white/40">A photo makes parents 3× more likely to reach out.</p>
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 flex items-center justify-center cursor-pointer group"
                    style={{ borderColor: TEAL, background: "rgba(61,190,181,0.08)" }}
                    onClick={() => fileRef.current?.click()}>
                    {photoPreview
                      ? <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                      : <Camera size={32} style={{ color: TEAL }} />}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Camera size={20} className="text-white" />
                    </div>
                    {photoUploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: TEAL, borderTopColor: "transparent" }} />
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => fileRef.current?.click()} className="text-sm font-medium" style={{ color: TEAL }}>
                    {photoPreview ? "Change photo" : "Upload photo"}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </div>
                <div className="space-y-1.5"><Label>Full name *</Label><Input placeholder="e.g. Jane Smith" value={name} onChange={e => setName(e.target.value)} /></div>
                <div className="space-y-1.5">
                  <Label>Headline <span className="text-white/30 text-xs">(optional)</span></Label>
                  <Input placeholder="e.g. Experienced babysitter & early childhood educator" value={headline} onChange={e => setHeadline(e.target.value)} maxLength={80} />
                  <p className="text-xs text-white/25 text-right">{headline.length}/80</p>
                </div>
                <div className="space-y-1.5"><Label>City / Area *</Label><Input placeholder="e.g. Singapore, Woodlands" value={city} onChange={e => setCity(e.target.value)} /></div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-white">About you</h2>
                <div className="space-y-1.5">
                  <Label>Bio / Introduction *</Label>
                  <Textarea placeholder="Tell parents about yourself, your experience and approach to childcare..." rows={5} value={bio} onChange={e => setBio(e.target.value)} />
                  <p className="text-xs text-white/25 text-right">{bio.length} characters</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Gender <span className="text-white/30 text-xs">(optional)</span></Label>
                  <div className="flex flex-wrap gap-2">
                    {GENDERS.map(g => <Chip key={g} active={gender === g} onClick={() => setGender(gender === g ? "" : g)}>{g}</Chip>)}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Date of birth <span className="text-white/30 text-xs">(optional)</span></Label>
                  <Input type="date" value={dob} onChange={e => setDob(e.target.value)} style={{ colorScheme: "dark" }} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-white">Experience &amp; rates</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Hourly rate (SGD)</Label>
                    <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                      <Input type="number" placeholder="15" min={0} className="pl-8" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} /></div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Years of experience</Label>
                    <Input type="number" placeholder="2" min={0} value={yearsExp} onChange={e => setYearsExp(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Max children at once</Label>
                  <div className="flex gap-2">
                    {["1","2","3","4","5+"].map(n => (
                      <button key={n} type="button" onClick={() => setMaxKids(n)}
                        className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all"
                        style={{ borderColor: maxKids === n ? TEAL : BDR, background: maxKids === n ? "rgba(61,190,181,0.15)" : "transparent", color: maxKids === n ? TEAL : "rgba(255,255,255,0.4)" }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Age groups you care for</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {AGE_GROUPS.map(ag => {
                      const active = ageGroups.includes(ag.label);
                      return (
                        <button key={ag.label} type="button" onClick={() => setAgeGroups(toggle(ageGroups, ag.label))}
                          className="p-3 rounded-xl border text-left transition-all"
                          style={{ borderColor: active ? TEAL : BDR, background: active ? "rgba(61,190,181,0.1)" : "transparent" }}>
                          <div className="text-sm font-semibold" style={{ color: active ? TEAL : "white" }}>{ag.label}</div>
                          <div className="text-xs text-white/35">{ag.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-white">Skills &amp; languages</h2>
                <div className="space-y-2">
                  <Label>Skills &amp; certifications</Label>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map(s => <Chip key={s} active={skills.includes(s)} onClick={() => setSkills(toggle(skills,s))}>{s}</Chip>)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Languages spoken</Label>
                  <div className="flex flex-wrap gap-2">
                    {LANGS.map(l => <Chip key={l} active={languages.includes(l)} onClick={() => setLanguages(toggle(languages,l))}>{l}</Chip>)}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">Your availability</h2>
                <p className="text-sm text-white/40">Toggle the days you're available and set your hours.</p>
                {DAYS.map((day, i) => (
                  <div key={day} className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                    style={{ borderColor: availability[i].enabled ? "rgba(61,190,181,0.3)" : BDR, background: availability[i].enabled ? "rgba(61,190,181,0.05)" : "transparent" }}>
                    <button type="button" onClick={() => setAvailability(p => ({ ...p, [i]: { ...p[i], enabled: !p[i].enabled } }))}
                      className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{ borderColor: availability[i].enabled ? TEAL : "rgba(255,255,255,0.2)", background: availability[i].enabled ? TEAL : "transparent" }}>
                      {availability[i].enabled && <X size={10} className="text-white" />}
                    </button>
                    <span className="text-sm font-medium w-24" style={{ color: availability[i].enabled ? "#fff" : "rgba(255,255,255,0.3)" }}>{day}</span>
                    {availability[i].enabled && (
                      <div className="flex items-center gap-2 ml-auto">
                        <input type="time" value={availability[i].start} onChange={e => setAvailability(p => ({ ...p, [i]: { ...p[i], start: e.target.value } }))}
                          className="text-xs rounded-lg px-2 py-1.5 outline-none"
                          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "white", colorScheme: "dark" }} />
                        <span className="text-xs text-white/30">–</span>
                        <input type="time" value={availability[i].end} onChange={e => setAvailability(p => ({ ...p, [i]: { ...p[i], end: e.target.value } }))}
                          className="text-xs rounded-lg px-2 py-1.5 outline-none"
                          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "white", colorScheme: "dark" }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {step === 5 && (
              <div className="text-center space-y-5 py-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(61,190,181,0.15)" }}>
                  <CheckCircle className="w-10 h-10" style={{ color: TEAL }} />
                </div>
                <h2 className="text-2xl font-bold text-white">Profile ready!</h2>
                <p className="text-white/40 max-w-xs mx-auto">Your profile is live. Parents in your area can now find and contact you.</p>
                <div className="flex items-center justify-center gap-6 text-sm text-white/40 pt-1">
                  {skills.length > 0 && <span><strong className="text-white">{skills.length}</strong> skills</span>}
                  {languages.length > 0 && <span><strong className="text-white">{languages.length}</strong> languages</span>}
                  {Object.values(availability).filter(v => v.enabled).length > 0 && (
                    <span><strong className="text-white">{Object.values(availability).filter(v => v.enabled).length}</strong> days available</span>
                  )}
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
                <button onClick={goDashboard}
                  className="px-7 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all"
                  style={{ background: TEAL }}>
                  Go to Dashboard
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

export default BabysitterOnboarding;
