import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search, Star, SlidersHorizontal, X, MapPin, Clock,
  DollarSign, Shield, ArrowLeft, Users, ChevronRight,
} from "lucide-react";
import newLogo from "@/assets/new logo.png";

const TEAL  = "#3DBEB5";
const BG    = "#080F0D";
const CARD  = "#0E1E1A";
const BORDER = "rgba(255,255,255,0.08)";

interface Sitter {
  id: string; user_id: string; name: string; photo_url: string | null;
  bio: string | null; city: string | null; hourly_rate: number | null;
  years_experience: number | null; rating_avg: number | null; rating_count: number | null;
  skills: string[] | null; languages: string[] | null; is_verified: boolean | null; max_kids: number | null;
}

const fieldCls = "h-9 w-full rounded-xl px-3 text-sm text-white outline-none focus:ring-1 focus:ring-[#3DBEB5] transition-all";
const fieldStyle = { background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: "#fff" };

const SearchSitters = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [searchParams] = useSearchParams();
  const [sitters, setSitters] = useState<Sitter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ city: searchParams.get("city") || "", maxRate: "", minExperience: "", language: "" });

  const fetchSitters = async (activeFilters = filters) => {
    setLoading(true);
    let query = supabase.from("babysitter_profiles").select("*");
    if (activeFilters.city) query = query.ilike("city", `%${activeFilters.city}%`);
    if (activeFilters.maxRate) query = query.lte("hourly_rate", parseFloat(activeFilters.maxRate));
    if (activeFilters.minExperience) query = query.gte("years_experience", parseInt(activeFilters.minExperience));
    const { data, error } = await query.order("rating_avg", { ascending: false });
    if (!error && data) setSitters(data as Sitter[]);
    setLoading(false);
  };

  useEffect(() => {
    const cityParam = searchParams.get("city");
    if (cityParam) {
      const initial = { city: cityParam, maxRate: "", minExperience: "", language: "" };
      setFilters(initial); fetchSitters(initial);
    } else { fetchSitters({ city: "", maxRate: "", minExperience: "", language: "" }); }
  }, []);

  const filtered = sitters.filter((s) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q) || s.bio?.toLowerCase().includes(q) || s.skills?.some((sk) => sk.toLowerCase().includes(q));
  });

  const clearFilters = () => setFilters({ city: "", maxRate: "", minExperience: "", language: "" });
  const hasActiveFilters = Object.values(filters).some(Boolean);

  const avatarColors = [TEAL, "#60A5FA", "#A78BFA", "#F472B6", "#FB923C", "#34D399"];

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Top nav */}
      <header className="sticky top-0 z-30" style={{ background: CARD, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}>
              <ArrowLeft size={15} />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <img src={newLogo} alt="Logo" className="h-6 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
              <span className="font-heading font-bold text-white text-sm hidden sm:block">BabySitter<span style={{ color: TEAL }}>Hub</span></span>
            </Link>
          </div>
          {user ? (
            <Link to={role === "babysitter" ? "/babysitter/dashboard" : "/parent/dashboard"} className="text-xs font-medium flex items-center gap-1 transition-colors" style={{ color: TEAL }}>
              Dashboard <ChevronRight size={13} />
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>Log in</Link>
              <Link to="/signup" className="text-xs font-semibold px-4 py-1.5 rounded-full text-white" style={{ background: TEAL }}>Sign up free</Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero / Search */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-3" style={{ background: "rgba(61,190,181,0.12)", color: TEAL }}>
              <Shield size={11} /> Verified Sitters Only
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-2">Find a Babysitter</h1>
            <p className="mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>Browse {sitters.length > 0 ? `${sitters.length} trusted` : "trusted"} babysitters available near you</p>

            {/* Search row */}
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-full px-4 py-2.5" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}` }}>
                <Search className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, city, or skill…"
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none" />
                {search && <button onClick={() => setSearch("")} style={{ color: "rgba(255,255,255,0.3)" }}><X size={14} /></button>}
              </div>
              <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 h-[42px] rounded-full text-sm font-semibold border transition-all"
                style={{ background: hasActiveFilters ? TEAL : "rgba(255,255,255,0.05)", color: hasActiveFilters ? "#fff" : "rgba(255,255,255,0.6)", borderColor: hasActiveFilters ? TEAL : BORDER }}>
                <SlidersHorizontal size={15} /> Filters
                {hasActiveFilters && <span className="w-4 h-4 rounded-full bg-white/25 text-[10px] flex items-center justify-center font-bold">{Object.values(filters).filter(Boolean).length}</span>}
              </button>
            </div>

            {/* Filters panel */}
            {showFilters && (
              <div className="mt-3 p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-white">Filter results</span>
                  {hasActiveFilters && <button onClick={clearFilters} className="text-xs text-red-400 flex items-center gap-1"><X size={11} /> Clear all</button>}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium flex items-center gap-1" style={{ color: "rgba(255,255,255,0.45)" }}><MapPin size={11} /> City / Area</label>
                    <input placeholder="e.g. Woodlands" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} className={fieldCls} style={fieldStyle} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium flex items-center gap-1" style={{ color: "rgba(255,255,255,0.45)" }}><DollarSign size={11} /> Max rate (SGD/hr)</label>
                    <input type="number" placeholder="e.g. 25" value={filters.maxRate} onChange={(e) => setFilters({ ...filters, maxRate: e.target.value })} className={fieldCls} style={fieldStyle} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium flex items-center gap-1" style={{ color: "rgba(255,255,255,0.45)" }}><Clock size={11} /> Min experience (yrs)</label>
                    <input type="number" placeholder="e.g. 2" value={filters.minExperience} onChange={(e) => setFilters({ ...filters, minExperience: e.target.value })} className={fieldCls} style={fieldStyle} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>Language</label>
                    <input placeholder="e.g. English" value={filters.language} onChange={(e) => setFilters({ ...filters, language: e.target.value })} className={fieldCls} style={fieldStyle} />
                  </div>
                </div>
                <button onClick={() => fetchSitters(filters)} className="mt-4 font-semibold rounded-full px-5 py-2 text-sm text-white transition-all hover:opacity-90" style={{ background: TEAL }}>Apply Filters</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
            {loading ? "Searching…" : <><span className="text-white font-bold">{filtered.length}</span> babysitter{filtered.length !== 1 ? "s" : ""} found</>}
          </p>
          {!loading && filtered.length > 0 && <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Sorted by rating</p>}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div className="flex gap-4 mb-4"><div className="w-16 h-16 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)" }} /><div className="flex-1 space-y-2 pt-1"><div className="h-4 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", width: "75%" }} /><div className="h-3 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", width: "50%" }} /></div></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.2)" }}><Search size={28} /></div>
            <h3 className="text-lg font-heading font-bold text-white mb-2">No sitters found</h3>
            <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>Try adjusting your search or removing filters</p>
            {hasActiveFilters && <button onClick={clearFilters} className="text-sm font-medium underline underline-offset-2" style={{ color: TEAL }}>Clear all filters</button>}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((sitter, idx) => (
              <Link key={sitter.id} to={`/babysitters/${sitter.id}`}
                className="group rounded-2xl p-5 hover:brightness-110 hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                {/* Top */}
                <div className="flex gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0 overflow-hidden" style={{ background: avatarColors[idx % avatarColors.length] }}>
                    {sitter.photo_url ? <img src={sitter.photo_url} alt={sitter.name} className="w-full h-full object-cover" /> : sitter.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-heading font-bold text-white group-hover:text-[#3DBEB5] transition-colors truncate text-base leading-tight">{sitter.name}</h3>
                      {sitter.is_verified && <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold mt-0.5" style={{ background: "rgba(61,190,181,0.12)", color: TEAL, border: "1px solid rgba(61,190,181,0.2)" }}><Shield size={9} /> Verified</span>}
                    </div>
                    {sitter.city && <p className="text-xs flex items-center gap-0.5 mt-1" style={{ color: "rgba(255,255,255,0.4)" }}><MapPin size={10} />{sitter.city}</p>}
                    {sitter.rating_avg ? (
                      <div className="flex items-center gap-1 mt-1.5">
                        {[1,2,3,4,5].map((s) => <Star key={s} size={11} className={s <= Math.round(Number(sitter.rating_avg)) ? "text-amber-400 fill-amber-400" : "fill-current"} style={s > Math.round(Number(sitter.rating_avg)) ? { color: "rgba(255,255,255,0.1)" } : {}} />)}
                        <span className="text-xs font-semibold text-white">{Number(sitter.rating_avg).toFixed(1)}</span>
                        {sitter.rating_count ? <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>({sitter.rating_count})</span> : null}
                      </div>
                    ) : <p className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>No reviews yet</p>}
                  </div>
                </div>

                {sitter.bio && <p className="text-sm line-clamp-2 mb-4 leading-relaxed flex-1" style={{ color: "rgba(255,255,255,0.5)" }}>{sitter.bio}</p>}

                {/* Stats */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {sitter.hourly_rate && <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl" style={{ background: "rgba(61,190,181,0.1)", color: TEAL }}><DollarSign size={11} />SGD {Number(sitter.hourly_rate)}/hr</div>}
                  {sitter.years_experience != null && sitter.years_experience > 0 && <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl" style={{ background: "rgba(96,165,250,0.1)", color: "#60A5FA" }}><Clock size={11} />{sitter.years_experience}yr exp</div>}
                  {sitter.max_kids != null && <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}><Users size={11} />{sitter.max_kids} kids</div>}
                </div>

                {/* Skills */}
                {(sitter.skills?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sitter.skills?.slice(0, 3).map((skill) => <span key={skill} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>{skill}</span>)}
                    {(sitter.skills?.length ?? 0) > 3 && <span className="text-[11px] px-1 self-center" style={{ color: "rgba(255,255,255,0.3)" }}>+{(sitter.skills?.length ?? 0) - 3} more</span>}
                  </div>
                )}

                {/* CTA */}
                <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Tap to view full profile</span>
                  <span className="w-7 h-7 rounded-full flex items-center justify-center transition-all group-hover:scale-110" style={{ background: "rgba(61,190,181,0.12)", color: TEAL }}>
                    <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchSitters;
