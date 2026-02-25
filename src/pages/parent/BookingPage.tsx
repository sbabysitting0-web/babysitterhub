import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { getCurrencyForCity } from "@/lib/utils";
import { ClockPicker } from "@/components/ClockPicker";

const TEAL   = "#3DBEB5";
const BG     = "#080F0D";
const CARD   = "#0E1E1A";
const BORDER = "rgba(255,255,255,0.08)";

interface SitterProfile {
  id: string; user_id: string; name: string; hourly_rate: number | null; city: string | null; photo_url: string | null;
}

const fieldCls = "w-full h-11 rounded-xl px-4 text-sm text-white outline-none focus:ring-2 focus:ring-[#3DBEB5]/40 focus:border-[#3DBEB5]/60 transition-all";
const fieldStyle = { background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: "#fff", colorScheme: "dark" };

function getDuration(start: string, end: string): string | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = eh * 60 + em - sh * 60 - sm;
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 && m > 0 ? `${h}h ${m}m` : h > 0 ? `${h}h` : `${m}m`;
}

const BookingPage = () => {
  const { sitterId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sitter, setSitter] = useState<SitterProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ date: "", startTime: "", endTime: "", notes: "" });

  useEffect(() => {
    if (!sitterId) return;
    supabase.from("babysitter_profiles").select("id, user_id, name, hourly_rate, city, photo_url").eq("id", sitterId).single().then(({ data }) => { if (data) setSitter(data as SitterProfile); });
  }, [sitterId]);

  const calcTotal = () => {
    if (!form.startTime || !form.endTime || !sitter?.hourly_rate) return null;
    const [sh, sm] = form.startTime.split(":").map(Number);
    const [eh, em] = form.endTime.split(":").map(Number);
    const hours = (eh * 60 + em - sh * 60 - sm) / 60;
    if (hours <= 0) return null;
    return (hours * Number(sitter.hourly_rate)).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !sitter) return;
    if (!form.date || !form.startTime || !form.endTime) {
      toast({ title: "Missing fields", description: "Please fill in all date and time fields.", variant: "destructive" });
      return;
    }
    const startDatetime = new Date(`${form.date}T${form.startTime}`).toISOString();
    const endDatetime = new Date(`${form.date}T${form.endTime}`).toISOString();
    const total = calcTotal();
    setLoading(true);

    const { data: parentProfile } = await supabase.from("parent_profiles").select("user_id").eq("user_id", user.id).maybeSingle();
    if (!parentProfile) { setLoading(false); toast({ title: "Profile incomplete", description: "Please complete your parent profile before booking.", variant: "destructive" }); navigate("/onboarding/parent"); return; }

    await supabase.from("users").upsert({ id: user.id, role: "parent" }, { onConflict: "id" });
    await supabase.from("users").upsert({ id: sitter.user_id, role: "babysitter" }, { onConflict: "id" });

    const { data: usersRow } = await supabase.from("users").select("id").eq("id", user.id).maybeSingle();
    if (!usersRow) { setLoading(false); toast({ title: "Account setup incomplete", description: "Click to fix it in 1 step.", variant: "destructive" }); navigate("/fix-account"); return; }

    const { error } = await supabase.from("bookings").insert({ parent_id: user.id, babysitter_id: sitter.user_id, start_time: startDatetime, end_time: endDatetime, status: "pending", total_price: total ? parseFloat(total) : null, notes: form.notes || null });
    setLoading(false);
    if (error) {
      let description = error.message;
      if (error.code === "23505") description = "A booking with this sitter at the same time already exists.";
      else if (error.code === "23503") description = "A database constraint is blocking the booking. Please run the fix SQL from the Fix Account page.";
      toast({ title: "Booking failed", description, variant: "destructive" });
      return;
    }
    toast({ title: "Booking request sent!", description: "The babysitter will confirm shortly." });
    navigate("/parent/dashboard");
  };

  const total = calcTotal();

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <div className="container py-8 max-w-2xl">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm mb-6 transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.45)" }}>
          <ChevronLeft size={16} /> Back
        </button>
        <h1 className="text-2xl font-heading font-bold text-white mb-2">Book a Babysitter</h1>
        {sitter && (
          <p className="mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
            Booking with <span className="font-medium text-white">{sitter.name}</span>
            {sitter.hourly_rate && <span> · {getCurrencyForCity(sitter.city).symbol} {Number(sitter.hourly_rate)}/hr</span>}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date & Time */}
          <div className="rounded-2xl" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(61,190,181,0.15)" }}>
                <Calendar size={16} style={{ color: TEAL }} />
              </div>
              <div>
                <h2 className="font-heading font-semibold text-white text-sm">Date & Time</h2>
                <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Select your preferred session schedule</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Date field */}
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>Session Date</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: TEAL }}>
                    <Calendar size={15} />
                  </span>
                  <input
                    type="date"
                    value={form.date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full h-12 rounded-xl pl-10 pr-4 text-sm text-white outline-none focus:ring-2 transition-all"
                    style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${form.date ? "rgba(61,190,181,0.5)" : BORDER}`, color: "#fff", colorScheme: "dark" }}
                    required
                  />
                  {form.date && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(61,190,181,0.15)", color: TEAL }}>
                      {new Date(form.date + "T00:00:00").toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
              </div>

              {/* Time fields */}
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>Session Hours</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Start time */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium flex items-center gap-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                      <Clock size={11} /> Start time
                    </p>
                    <ClockPicker
                      label="Start time"
                      value={form.startTime}
                      onChange={(v) => setForm({ ...form, startTime: v })}
                    />
                  </div>
                  {/* End time */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium flex items-center gap-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                      <Clock size={11} /> End time
                    </p>
                    <ClockPicker
                      label="End time"
                      value={form.endTime}
                      onChange={(v) => setForm({ ...form, endTime: v })}
                    />
                  </div>
                </div>
              </div>

              {/* Duration pill */}
              {(() => {
                const dur = getDuration(form.startTime, form.endTime);
                return dur ? (
                  <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl" style={{ background: "rgba(61,190,181,0.08)", border: "1px solid rgba(61,190,181,0.2)" }}>
                    <Clock size={13} style={{ color: TEAL }} />
                    <span className="text-sm font-semibold" style={{ color: TEAL }}>Session duration: {dur}</span>
                    {form.startTime && form.endTime && (
                      <span className="text-xs ml-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {form.startTime} <ChevronRight size={11} className="inline" /> {form.endTime}
                      </span>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl p-6 space-y-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h2 className="font-heading font-semibold text-white">Notes for the babysitter</h2>
            <textarea placeholder="Any special instructions, address details, children's routines..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white resize-none outline-none focus:ring-1 focus:ring-[#3DBEB5] transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: "#fff" }} />
          </div>

          {/* Price summary */}
          {total && (
            <div className="rounded-2xl p-5" style={{ background: "rgba(61,190,181,0.06)", border: "1px solid rgba(61,190,181,0.2)" }}>
              <h2 className="font-heading font-semibold text-white mb-3 flex items-center gap-2">
                <DollarSign size={16} style={{ color: TEAL }} /> Price Estimate
              </h2>
              <div className="flex justify-between text-sm">
                <span style={{ color: "rgba(255,255,255,0.5)" }}>Estimated total</span>
                <span className="font-heading font-bold text-white text-lg">{getCurrencyForCity(sitter?.city).symbol} {total}</span>
              </div>
              <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>Final payment upon booking confirmation.</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold rounded-full text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: TEAL }}>
            {loading ? "Sending request..." : "Send Booking Request"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingPage;
