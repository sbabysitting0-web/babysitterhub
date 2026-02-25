import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Star, MapPin, Clock, DollarSign, Users, Languages,
  Shield, ChevronLeft, Calendar, MessageCircle,
} from "lucide-react";
import { getCurrencyForCity } from "@/lib/utils";
import newLogo from "@/assets/new logo.png";

const TEAL   = "#3DBEB5";
const BG     = "#080F0D";
const CARD   = "#0E1E1A";
const BORDER = "rgba(255,255,255,0.08)";
const DAYS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface SitterProfile {
  id: string; user_id: string; name: string; photo_url: string | null;
  bio: string | null; city: string | null; hourly_rate: number | null;
  years_experience: number | null; rating_avg: number | null; rating_count: number | null;
  skills: string[] | null; languages: string[] | null; is_verified: boolean | null; max_kids: number | null;
}
interface Review { id: string; rating: number; comment: string | null; created_at: string; parent_id: string; }
interface AvailabilityRow { day_of_week: number; start_time: string; end_time: string; }

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl p-6 ${className}`} style={{ background: CARD, border: `1px solid ${BORDER}` }}>{children}</div>
);

const SitterProfilePage = () => {
  const { id } = useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [sitter, setSitter] = useState<SitterProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const timeout = <T,>(p: Promise<T>): Promise<T> =>
        Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000))]);
      try {
        const [sitterRes, reviewsRes, availRes] = await Promise.all([
          timeout(supabase.from("babysitter_profiles").select("*").eq("id", id).single()),
          timeout(supabase.from("reviews").select("*").eq("babysitter_id", id).order("created_at", { ascending: false }).limit(10)),
          timeout(supabase.from("babysitter_availability").select("day_of_week, start_time, end_time").eq("babysitter_id", id)),
        ]);
        if (sitterRes.data) setSitter(sitterRes.data as SitterProfile);
        if (reviewsRes.data) setReviews(reviewsRes.data);
        if (availRes.data) setAvailability(availRes.data);
      } catch { /* silently fall through */ }
      setLoading(false);
    };
    load();
  }, [id, user]);

  const handleContact = () => { if (!user) { navigate("/login"); return; } navigate(`/parent/inbox?with=${sitter?.user_id}`); };
  const handleBooking = () => { if (!user) { navigate("/login"); return; } navigate(`/parent/booking/${id}`); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${TEAL} transparent transparent transparent` }} />
      </div>
    );
  }
  if (!sitter) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="text-center">
          <p className="text-white/50">Babysitter not found.</p>
          <Link to="/babysitters" className="text-sm mt-2 block" style={{ color: TEAL }}>Back to search</Link>
        </div>
      </div>
    );
  }

  const currency = getCurrencyForCity(sitter.city ?? "");

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Top nav */}
      <header className="sticky top-0 z-30" style={{ background: CARD, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-3 h-14">
          <Link to="/" className="flex items-center gap-2">
            <img src={newLogo} alt="Logo" className="h-6 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
            <span className="font-heading font-bold text-white text-sm hidden sm:block">BabySitter<span style={{ color: TEAL }}>Hub</span></span>
          </Link>
        </div>
      </header>

      <div className="container py-8 max-w-5xl">
        <Link to="/babysitters" className="inline-flex items-center gap-1 text-sm mb-6 transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.45)" }}>
          <ChevronLeft size={16} /> Back to search
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Profile */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header card */}
            <Section>
              <div className="flex gap-5 mb-4">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl shrink-0 overflow-hidden" style={{ background: "rgba(61,190,181,0.12)" }}>
                  {sitter.photo_url ? <img src={sitter.photo_url} alt={sitter.name} className="w-full h-full object-cover" /> : "👩"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-heading font-bold text-white">{sitter.name}</h1>
                    {sitter.is_verified && <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(61,190,181,0.12)", color: TEAL, border: "1px solid rgba(61,190,181,0.2)" }}><Shield size={10} /> Verified</span>}
                  </div>
                  {sitter.city && <p className="text-sm flex items-center gap-1 mt-1" style={{ color: "rgba(255,255,255,0.4)" }}><MapPin size={13} />{sitter.city}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    {sitter.rating_avg ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="font-semibold text-white">{Number(sitter.rating_avg).toFixed(1)}</span>
                        <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>({sitter.rating_count} reviews)</span>
                      </div>
                    ) : <span className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No reviews yet</span>}
                  </div>
                </div>
              </div>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                {[
                  { icon: DollarSign, label: "Per hour", value: sitter.hourly_rate ? `${currency.symbol} ${Number(sitter.hourly_rate)}` : "—" },
                  { icon: Clock, label: "Experience", value: `${sitter.years_experience ?? 0}yr` },
                  { icon: Users, label: "Max kids", value: sitter.max_kids ?? 1 },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1" style={{ color: TEAL }}>
                      <Icon size={15} /><span className="font-heading font-bold text-lg text-white">{value}</span>
                    </div>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Bio */}
            {sitter.bio && (
              <Section>
                <h2 className="font-heading font-bold text-white mb-3">About</h2>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{sitter.bio}</p>
              </Section>
            )}

            {/* Skills & Languages */}
            {((sitter.skills?.length ?? 0) > 0 || (sitter.languages?.length ?? 0) > 0) && (
              <Section className="space-y-4">
                {(sitter.skills?.length ?? 0) > 0 && (
                  <div>
                    <h2 className="font-heading font-bold text-white mb-3">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {sitter.skills?.map((skill) => (
                        <span key={skill} className="text-sm px-3 py-1 rounded-full" style={{ background: "rgba(61,190,181,0.1)", color: TEAL }}>{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(sitter.languages?.length ?? 0) > 0 && (
                  <div>
                    <h2 className="font-heading font-bold text-white mb-3 flex items-center gap-2"><Languages size={16} /> Languages</h2>
                    <div className="flex flex-wrap gap-2">
                      {sitter.languages?.map((lang) => (
                        <span key={lang} className="text-sm px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" }}>{lang}</span>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* Availability */}
            {availability.length > 0 && (
              <Section>
                <h2 className="font-heading font-bold text-white mb-4 flex items-center gap-2"><Calendar size={16} /> Availability</h2>
                <div className="space-y-2">
                  {DAYS.map((day, i) => {
                    const slot = availability.find((a) => a.day_of_week === i);
                    return (
                      <div key={day} className="flex items-center gap-3 text-sm">
                        <span className="w-10 font-medium" style={{ color: slot ? "#fff" : "rgba(255,255,255,0.3)" }}>{day}</span>
                        {slot ? (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(61,190,181,0.1)", color: TEAL }}>{slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}</span>
                        ) : (
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Not available</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Reviews */}
            <Section>
              <h2 className="font-heading font-bold text-white mb-4">
                Reviews {reviews.length > 0 && <span className="font-normal text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>({reviews.length})</span>}
              </h2>
              {reviews.length === 0 ? (
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="pb-4 last:pb-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "text-amber-400 fill-amber-400" : ""}`} style={i >= review.rating ? { color: "rgba(255,255,255,0.1)" } : {}} />)}</div>
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                      {review.comment && <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{review.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* Right: Booking card */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl p-6 sticky top-24 space-y-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="text-center">
                <span className="text-3xl font-heading font-bold text-white">{sitter.hourly_rate ? `${currency.symbol} ${Number(sitter.hourly_rate)}` : "Contact for rate"}</span>
                {sitter.hourly_rate && <span className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>/hr</span>}
              </div>
              {role !== "babysitter" && (
                <div className="space-y-3">
                  <button onClick={handleBooking} className="w-full py-3 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: TEAL }}>
                    {!user ? "Sign in to Book" : "Book Now"}
                  </button>
                  <button onClick={handleContact} className="w-full py-3 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2" style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.7)" }}>
                    <MessageCircle size={15} /> Send Message
                  </button>
                </div>
              )}
              <div className="pt-4 space-y-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                <p className="text-xs flex items-center gap-2" style={{ color: "rgba(255,255,255,0.4)" }}><Shield size={12} style={{ color: TEAL }} /> Identity verified</p>
                <p className="text-xs flex items-center gap-2" style={{ color: "rgba(255,255,255,0.4)" }}><Star size={12} className="text-amber-400" /> {sitter.rating_count ?? 0} reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SitterProfilePage;
