import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";

const TEAL   = "#3DBEB5";
const BG     = "#080F0D";
const CARD   = "#0E1E1A";
const BORDER = "rgba(255,255,255,0.08)";

const ReviewPage = () => {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const sitterId = searchParams.get("sitter");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !bookingId || !sitterId) return;
    if (rating === 0) { toast({ title: "Please select a rating", variant: "destructive" }); return; }
    setLoading(true);

    const { error } = await supabase.from("reviews").insert({ booking_id: bookingId, parent_id: user.id, babysitter_id: sitterId, rating, comment: comment || null });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setLoading(false); return; }

    const { data: allReviews } = await supabase.from("reviews").select("rating").eq("babysitter_id", sitterId);
    if (allReviews && allReviews.length > 0) {
      const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await supabase.from("babysitter_profiles").update({ rating_avg: avg, rating_count: allReviews.length }).eq("user_id", sitterId);
    }

    toast({ title: "Review submitted! ⭐", description: "Thank you for your feedback." });
    navigate("/parent/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
      <div className="w-full max-w-md">
        <div className="rounded-2xl p-8" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <h1 className="text-xl font-heading font-bold text-white mb-1">Leave a review</h1>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>How was your experience?</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star rating */}
            <div className="text-center">
              <div className="flex justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} type="button" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(0)} onClick={() => setRating(i)} className="transition-transform hover:scale-110">
                    <Star className={`w-10 h-10 transition-colors ${i <= (hovered || rating) ? "text-amber-400 fill-amber-400" : ""}`}
                      style={i > (hovered || rating) ? { color: "rgba(255,255,255,0.15)" } : {}} />
                  </button>
                ))}
              </div>
              {(hovered || rating) > 0 && (
                <p className="text-sm font-medium" style={{ color: TEAL }}>{labels[hovered || rating]}</p>
              )}
            </div>

            {/* Comment */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">
                Comment <span style={{ color: "rgba(255,255,255,0.35)" }} className="font-normal">(optional)</span>
              </label>
              <textarea placeholder="Tell others about your experience with this babysitter..." value={comment} onChange={(e) => setComment(e.target.value)} rows={4}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white resize-none outline-none focus:ring-1 focus:ring-[#3DBEB5] transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: "#fff" }} />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => navigate(-1)} className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.6)" }}>
                Cancel
              </button>
              <button type="submit" disabled={loading || rating === 0} className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: TEAL }}>
                {loading ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
