import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, ChevronLeft, CheckCircle, X } from "lucide-react";
import newLogo from "@/assets/new logo.png";

const STEPS = ["About You", "Experience", "Availability", "Done!"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const SKILL_OPTIONS = ["First Aid","CPR Certified","Special Needs","Homework Help","Swimming","Cooking","Music","Arts & Crafts","Sports"];
const LANGUAGE_OPTIONS = ["English","Mandarin","Malay","Tamil","Hindi","French","Japanese"];
const teal = "#3DBEB5";

const DarkInput = ({ className = "", style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} style={{ fontSize: "16px", ...style }} className={`w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-3 outline-none focus:border-teal/50 focus:ring-2 focus:ring-teal/10 transition-all ${className}`} />
);
const DarkTextarea = ({ className = "", style, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} style={{ fontSize: "16px", ...style }} className={`w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-3 outline-none focus:border-teal/50 focus:ring-2 focus:ring-teal/10 transition-all resize-none ${className}`} />
);

const BabysitterOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [availability, setAvailability] = useState<{ [day: number]: { start: string; end: string; enabled: boolean } }>({
    0: { start: "09:00", end: "18:00", enabled: false },
    1: { start: "09:00", end: "18:00", enabled: true },
    2: { start: "09:00", end: "18:00", enabled: true },
    3: { start: "09:00", end: "18:00", enabled: true },
    4: { start: "09:00", end: "18:00", enabled: true },
    5: { start: "09:00", end: "18:00", enabled: true },
    6: { start: "09:00", end: "18:00", enabled: false },
  });

  const { register, getValues } = useForm({ defaultValues: { name: "", bio: "", city: "", hourly_rate: "", years_experience: "", max_kids: "1" } });

  const toggleSkill = (s: string) => setSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  const toggleLanguage = (l: string) => setLanguages((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]);
  const toggleDay = (day: number) => setAvailability((prev) => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    const values = getValues();
    await supabase.from("babysitter_profiles").upsert({
      user_id: user.id, name: values.name, bio: values.bio, city: values.city,
      hourly_rate: values.hourly_rate ? parseFloat(values.hourly_rate) : 0,
      years_experience: values.years_experience ? parseInt(values.years_experience) : 0,
      max_kids: values.max_kids ? parseInt(values.max_kids) : 1,
      skills, languages, updated_at: new Date().toISOString(),
    });
    const availRows = Object.entries(availability).filter(([, v]) => v.enabled).map(([day, v]) => ({
      babysitter_id: user.id, day_of_week: parseInt(day), start_time: v.start, end_time: v.end, is_available: true,
    }));
    if (availRows.length > 0) {
      await supabase.from("babysitter_availability").delete().eq("babysitter_id", user.id);
      await supabase.from("babysitter_availability").insert(availRows);
    }
    toast({ title: "Profile live!", description: "Parents in your area can now find you." });
    setLoading(false);
    navigate("/babysitter/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#080F0D" }}>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(61,190,181,0.07) 0%, transparent 70%)" }} />

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 justify-center mb-5">
            <img src={newLogo} alt="BabyCare" className="h-7 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
            <span className="text-lg font-heading font-bold text-white">Baby<span style={{ color: teal }}>Care</span></span>
          </Link>
          <h1 className="text-2xl font-heading font-bold text-white">Create your sitter profile</h1>
          <p className="text-white/40 mt-1 text-sm">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="h-1.5 flex-1 rounded-full transition-colors" style={{ background: i <= step ? teal : "rgba(255,255,255,0.1)" }} />
          ))}
        </div>

        <div className="rounded-2xl p-8" style={{ background: "#0E1E1A", border: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Step 0: About */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-base font-heading font-bold text-white">About you</h2>
              <div className="space-y-1.5"><label className="text-sm font-medium text-white/60">Full name</label><DarkInput placeholder="Jane Smith" {...register("name")} /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium text-white/60">City / Area</label><DarkInput placeholder="e.g. Singapore, Woodlands" {...register("city")} /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium text-white/60">Bio / Introduction</label><DarkTextarea placeholder="Tell parents about yourself..." rows={4} {...register("bio")} /></div>
            </div>
          )}

          {/* Step 1: Experience */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-base font-heading font-bold text-white">Experience & rates</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-sm font-medium text-white/60">Hourly rate (SGD)</label><DarkInput type="number" placeholder="15" min={0} {...register("hourly_rate")} /></div>
                <div className="space-y-1.5"><label className="text-sm font-medium text-white/60">Years experience</label><DarkInput type="number" placeholder="2" min={0} {...register("years_experience")} /></div>
              </div>
              <div className="space-y-1.5"><label className="text-sm font-medium text-white/60">Max children at once</label><DarkInput type="number" placeholder="2" min={1} max={10} {...register("max_kids")} /></div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Skills</label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => toggleSkill(s)} className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                      style={{ borderColor: skills.includes(s) ? teal : "rgba(255,255,255,0.12)", background: skills.includes(s) ? "rgba(61,190,181,0.15)" : "transparent", color: skills.includes(s) ? teal : "rgba(255,255,255,0.45)" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Languages</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((l) => (
                    <button key={l} type="button" onClick={() => toggleLanguage(l)} className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                      style={{ borderColor: languages.includes(l) ? teal : "rgba(255,255,255,0.12)", background: languages.includes(l) ? "rgba(61,190,181,0.15)" : "transparent", color: languages.includes(l) ? teal : "rgba(255,255,255,0.45)" }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Availability */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-heading font-bold text-white">Your availability</h2>
              <p className="text-sm text-white/40">Select the days and hours you're available.</p>
              <div className="space-y-2.5">
                {DAYS.map((day, i) => (
                  <div key={day} className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                    style={{ borderColor: availability[i].enabled ? "rgba(61,190,181,0.3)" : "rgba(255,255,255,0.08)", background: availability[i].enabled ? "rgba(61,190,181,0.06)" : "transparent" }}>
                    <button type="button" onClick={() => toggleDay(i)}
                      className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{ borderColor: availability[i].enabled ? teal : "rgba(255,255,255,0.2)", background: availability[i].enabled ? teal : "transparent" }}>
                      {availability[i].enabled && <X size={10} className="text-white" />}
                    </button>
                    <span className="text-sm font-medium w-24" style={{ color: availability[i].enabled ? "#fff" : "rgba(255,255,255,0.35)" }}>{day}</span>
                    {availability[i].enabled && (
                      <div className="flex items-center gap-2 ml-auto">
                        <input type="time" value={availability[i].start}
                          onChange={(e) => setAvailability((prev) => ({ ...prev, [i]: { ...prev[i], start: e.target.value } }))}
                          className="text-xs rounded-lg px-2 py-1.5 outline-none"
                          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }} />
                        <span className="text-xs text-white/30">to</span>
                        <input type="time" value={availability[i].end}
                          onChange={(e) => setAvailability((prev) => ({ ...prev, [i]: { ...prev[i], end: e.target.value } }))}
                          className="text-xs rounded-lg px-2 py-1.5 outline-none"
                          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(61,190,181,0.15)" }}>
                <CheckCircle className="w-8 h-8" style={{ color: teal }} />
              </div>
              <h2 className="text-xl font-heading font-bold text-white">Profile ready!</h2>
              <p className="text-white/40 text-sm">Your profile is live. Parents in your area can now find and contact you.</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(step - 1)} disabled={step === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium text-white/60 border border-white/10 hover:border-white/20 transition-all disabled:opacity-30">
              <ChevronLeft size={16} /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(step + 1)} className="flex items-center gap-1.5 px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: teal }}>
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleFinish} disabled={loading} className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: teal }}>
                {loading ? "Saving…" : "Go to Dashboard"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BabysitterOnboarding;
