import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, MapPin, Baby, DollarSign, Briefcase, CheckCircle } from "lucide-react";
import newLogo from "@/assets/new logo.png";

const TEAL = "#3DBEB5";
const BG = "#080F0D";
const CARD = "#0E1E1A";
const BDR = "rgba(255,255,255,0.08)";

const JOB_TYPES = ["Regular", "Occasional", "Overnight", "Emergency", "After school", "Full-time nanny"];
const AGE_GROUPS = ["0–1 yr", "1–3 yrs", "3–6 yrs", "6–12 yrs", "12+ yrs"];

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

const PostJob = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [jobType, setJobType] = useState("Regular");
  const [childrenCount, setChildrenCount] = useState("1");
  const [childrenAges, setChildrenAges] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setLoading(true);

    const jobData: Record<string, unknown> = {
      parent_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      city: city.trim() || null,
      address: address.trim() || null,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      job_type: jobType.toLowerCase(),
      children_count: parseInt(childrenCount) || 1,
      children_ages: childrenAges.length > 0 ? childrenAges : null,
      status: "open",
      start_date: startDate || null,
      end_date: endDate || null,
    };

    const { error } = await supabase.from("babysitting_jobs" as any).insert(jobData as any);
    setLoading(false);

    if (error) {
      toast({ title: "Failed to post job", description: error.message, variant: "destructive" });
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: BG }}>
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(61,190,181,0.08) 0%, transparent 70%)" }} />
        <div className="w-full max-w-lg text-center relative z-10">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(61,190,181,0.15)" }}>
            <CheckCircle className="w-10 h-10" style={{ color: TEAL }} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Job posted!</h1>
          <p className="text-white/40 mb-8 max-w-sm mx-auto">
            Your babysitting job is now live. Babysitters in your area can see it and reach out.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/babysitting-jobs"
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all"
              style={{ background: TEAL }}>
              View all jobs
            </Link>
            <Link to="/parent/dashboard"
              className="px-6 py-2.5 rounded-full text-sm font-medium border transition-all"
              style={{ color: "rgba(255,255,255,0.6)", borderColor: BDR }}>
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: BG }}>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(61,190,181,0.08) 0%, transparent 70%)" }} />

      <Link to="/babysitting-jobs"
        className="fixed top-5 left-5 z-50 flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-all"
        style={{ color: "rgba(255,255,255,0.45)" }}>
        <ChevronLeft size={15} /> Back to Jobs
      </Link>

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 justify-center mb-4">
            <img src={newLogo} alt="BabyCare" className="h-7 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
            <span className="text-lg font-bold text-white">Baby<span style={{ color: TEAL }}>Care</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Post a babysitting job</h1>
          <p className="text-white/40 mt-1 text-sm">Describe what you're looking for and let babysitters come to you.</p>
        </div>

        <div className="rounded-2xl p-7 space-y-6" style={{ background: CARD, border: `1px solid ${BDR}` }}>
          {/* Title */}
          <div className="space-y-1.5">
            <Label>Job title *</Label>
            <Input placeholder="e.g. Looking for a babysitter for 2 kids after school" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea placeholder="Describe the job details, schedule expectations, special requirements..." rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* Type of work */}
          <div className="space-y-2">
            <Label>Type of work</Label>
            <div className="flex flex-wrap gap-2">
              {JOB_TYPES.map((t) => (
                <Chip key={t} active={jobType === t} onClick={() => setJobType(t)}>{t}</Chip>
              ))}
            </div>
          </div>

          {/* Children */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Number of children</Label>
              <div className="flex gap-2">
                {["1", "2", "3", "4+"].map((n) => (
                  <button key={n} type="button" onClick={() => setChildrenCount(n)}
                    className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all"
                    style={{ borderColor: childrenCount === n ? TEAL : BDR, background: childrenCount === n ? "rgba(61,190,181,0.15)" : "transparent", color: childrenCount === n ? TEAL : "rgba(255,255,255,0.4)" }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Age groups</Label>
              <div className="flex flex-wrap gap-1.5">
                {AGE_GROUPS.map((ag) => (
                  <Chip key={ag} active={childrenAges.includes(ag)}
                    onClick={() => setChildrenAges(childrenAges.includes(ag) ? childrenAges.filter((x) => x !== ag) : [...childrenAges, ag])}>
                    {ag}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>City / Area</Label>
              <Input placeholder="e.g. Woodlands" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Hourly rate (SGD)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                <Input type="number" placeholder="15" min={0} className="pl-8" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start date <span className="text-white/30 text-xs">(optional)</span></Label>
              <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ colorScheme: "dark" }} />
            </div>
            <div className="space-y-1.5">
              <Label>End date <span className="text-white/30 text-xs">(optional)</span></Label>
              <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ colorScheme: "dark" }} />
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50"
            style={{ background: TEAL }}>
            <Briefcase size={16} />
            {loading ? "Posting..." : "Post job"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostJob;
