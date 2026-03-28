import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  MapPin,
  Baby,
  Briefcase,
  ShieldCheck,
  SlidersHorizontal,
  Clock,
  X,
  Star,
  CheckCircle2,
  Home,
  MessageCircle,
  LogOut,
} from "lucide-react";

/* ── Design tokens ───────────────────────────────────────────────────── */
const TEAL = "#3DBEB5";
const BG = "#080F0D";
const CARD = "#0E1E1A";
const BDR = "rgba(255,255,255,0.08)";
const PINK = "#E91E8C";

/* ── Filter options ──────────────────────────────────────────────────── */
const TYPE_OPTIONS = [
  "Regular",
  "Occasional",
  "Overnight",
  "Emergency",
  "After school",
  "Full-time nanny",
];
const CHILDREN_OPTIONS = ["1 child", "2 children", "3+ children"];

/* ── Types ───────────────────────────────────────────────────────────── */
interface Job {
  id: string;
  parent_id: string;
  title: string;
  description: string | null;
  city: string | null;
  address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  hourly_rate: number | null;
  job_type: string | null;
  children_count: number | null;
  children_ages: string[] | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  parent_name?: string;
}

interface Babysitter {
  id: string;
  user_id: string;
  name: string;
  photo_url: string | null;
  bio: string | null;
  city: string | null;
  location_lat: number | null;
  location_lng: number | null;
  hourly_rate: number | null;
  max_kids: number | null;
  is_verified: boolean | null;
  rating_avg: number | null;
  rating_count: number | null;
  years_experience: number | null;
  languages: string[] | null;
  skills: string[] | null;
  updated_at: string;
}

/* ── Haversine distance (km) ─────────────────────────────────────────── */
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Filter pill (top bar) ───────────────────────────────────────────── */
function FilterPill({
  icon: Icon,
  label,
  count,
  open,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  count?: number;
  open?: boolean;
  onClick: () => void;
}) {
  const active = (count ?? 0) > 0 || open;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-semibold border transition-all whitespace-nowrap"
      style={{
        borderColor: active ? TEAL : "rgba(255,255,255,0.12)",
        background: active ? "rgba(61,190,181,0.10)" : "rgba(255,255,255,0.04)",
        color: active ? TEAL : "rgba(255,255,255,0.6)",
      }}
    >
      <Icon size={14} />
      {label}
      {count != null && count > 0 && (
        <span className="ml-0.5 text-[10px] font-bold bg-[#3DBEB5] text-white rounded-full w-4 h-4 flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
}

/* ── Selectable chip (dropdown) ──────────────────────────────────────── */
function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
      style={{
        borderColor: active ? TEAL : "rgba(255,255,255,0.12)",
        background: active ? "rgba(61,190,181,0.15)" : "transparent",
        color: active ? TEAL : "rgba(255,255,255,0.45)",
      }}
    >
      {label}
    </button>
  );
}

function SidebarLink({
  icon: Icon,
  label,
  href,
  active,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      to={href}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full"
      style={{
        background: active ? "rgba(61,190,181,0.12)" : "transparent",
        color: active ? TEAL : "rgba(255,255,255,0.45)",
      }}
    >
      <Icon size={17} />
      {label}
    </Link>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
/*                         MAIN COMPONENT                               */
/* ══════════════════════════════════════════════════════════════════════ */
const BabysittingJobs = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  /* babysitter state */
  const [babysitters, setBabysitters] = useState<Babysitter[]>([]);

  /* filter state */
  const [selTypes, setSelTypes] = useState<string[]>([]);
  const [selChildren, setSelChildren] = useState<string[]>([]);
  const [openPanel, setOpenPanel] = useState<
    "type" | "children" | "more" | null
  >(null);

  /* user home location */
  const [homeCoords, setHomeCoords] = useState<[number, number] | null>(null);
  const [homeCity, setHomeCity] = useState<string | null>(null);
  const dashboardPath =
    role === "babysitter" ? "/babysitter/dashboard" : "/parent/dashboard";
  const inboxPath = "/parent/inbox";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  /* ── Load user home location from profile ────────────────────── */
  useEffect(() => {
    if (!user) return;
    const loadHome = async () => {
      const { data: bp } = await supabase
        .from("babysitter_profiles")
        .select("city, location_lat, location_lng")
        .eq("user_id", user.id)
        .maybeSingle();
      if (bp?.location_lat && bp?.location_lng) {
        setHomeCoords([bp.location_lat, bp.location_lng]);
        setHomeCity(bp.city ?? null);
        return;
      }
      const { data: pp } = await supabase
        .from("parent_profiles")
        .select("city, location_lat, location_lng")
        .eq("user_id", user.id)
        .maybeSingle();
      if (pp?.location_lat && pp?.location_lng) {
        setHomeCoords([pp.location_lat, pp.location_lng]);
        setHomeCity(pp.city ?? null);
        return;
      }
      const city = bp?.city || pp?.city;
      if (city) {
        setHomeCity(city);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`,
          );
          const results = await res.json();
          if (results?.[0])
            setHomeCoords([
              parseFloat(results[0].lat),
              parseFloat(results[0].lon),
            ]);
        } catch {
          /* silently fail */
        }
      }
    };
    loadHome();
  }, [user]);

  /* ── Load jobs ──────────────────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("babysitting_jobs" as any)
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (data && Array.isArray(data)) {
        const parentIds = [
          ...new Set((data as any[]).map((j: any) => j.parent_id)),
        ];
        let nameMap: Record<string, string> = {};
        if (parentIds.length > 0) {
          const { data: parents } = await supabase
            .from("parent_profiles")
            .select("user_id, name")
            .in("user_id", parentIds);
          if (parents)
            parents.forEach((p) => {
              nameMap[p.user_id] = p.name;
            });
        }
        setJobs(
          (data as any[]).map((j: any) => ({
            ...j,
            parent_name: nameMap[j.parent_id] ?? "Parent",
          })),
        );
      }
      setLoading(false);
    };
    load();
  }, []);

  /* ── Load babysitters + real-time subscription ─────────────────── */
  useEffect(() => {
    const loadBabysitters = async () => {
      const { data, error } = await supabase
        .from("babysitter_profiles")
        .select(
          "id, user_id, name, photo_url, bio, city, location_lat, location_lng, hourly_rate, max_kids, is_verified, rating_avg, rating_count, years_experience, languages, skills, updated_at",
        );
      if (error)
        console.error("[BabysittingJobs] Failed to load babysitters", error);
      if (data) setBabysitters(data);
    };
    loadBabysitters();

    const channel = supabase
      .channel("babysitter-locations")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "babysitter_profiles" },
        (payload: any) => {
          const rec = payload.new as Babysitter | undefined;
          const oldRec = payload.old as { id?: string } | undefined;
          if (
            payload.eventType === "INSERT" &&
            rec?.location_lat &&
            rec?.location_lng
          ) {
            setBabysitters((prev) => [...prev, rec]);
          } else if (payload.eventType === "UPDATE" && rec) {
            setBabysitters((prev) => {
              const without = prev.filter((b) => b.id !== rec.id);
              return rec.location_lat && rec.location_lng
                ? [...without, rec]
                : without;
            });
          } else if (payload.eventType === "DELETE" && oldRec?.id) {
            setBabysitters((prev) => prev.filter((b) => b.id !== oldRec.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ── Filtered jobs ──────────────────────────────────────────────── */
  const filtered = jobs.filter((j) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !j.title?.toLowerCase().includes(q) &&
        !j.city?.toLowerCase().includes(q) &&
        !j.description?.toLowerCase().includes(q)
      )
        return false;
    }
    if (
      selTypes.length > 0 &&
      !selTypes.some(
        (t) => t.toLowerCase() === (j.job_type ?? "regular").toLowerCase(),
      )
    )
      return false;
    if (selChildren.length > 0) {
      const cnt = j.children_count ?? 1;
      if (
        !selChildren.some((c) =>
          c === "1 child"
            ? cnt === 1
            : c === "2 children"
              ? cnt === 2
              : cnt >= 3,
        )
      )
        return false;
    }
    return true;
  });

  /* ── Search-filtered babysitters ────────────────────────────────── */
  const displayedSitters = babysitters.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.name?.toLowerCase().includes(q) ||
      b.city?.toLowerCase().includes(q) ||
      b.bio?.toLowerCase().includes(q)
    );
  });
  const toggle = (
    arr: string[],
    val: string,
    set: React.Dispatch<React.SetStateAction<string[]>>,
  ) => set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  /* ── Time-ago helper ───────────────────────────────────────────────── */
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return days === 1 ? "yesterday" : `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  /* ══════════════════════════════════════════════════════════════════ */
  /*                           RENDER                                  */
  /* ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <aside
        className="hidden lg:flex flex-col w-[252px] fixed inset-y-0 left-0 z-40"
        style={{ background: CARD, borderRight: `1px solid ${BDR}` }}
      >
        <div className="px-6 pt-6 pb-7">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="text-base font-heading font-bold text-white">
              Baby<span style={{ color: TEAL }}>Care</span>
            </span>
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          <SidebarLink icon={Home} label="Dashboard" href={dashboardPath} />
          <SidebarLink
            icon={Briefcase}
            label="Babysitting Jobs"
            href="/babysitting-jobs"
            active
          />
          <SidebarLink icon={MessageCircle} label="Messages" href={inboxPath} />
        </nav>
        <div className="px-3 pb-5">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all w-full text-left hover:text-red-400"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="lg:ml-[252px] min-h-screen flex flex-col pb-8">
        <div className="sticky top-0 z-30 px-4 pt-4">
          <div
            className="max-w-7xl mx-auto rounded-2xl overflow-hidden backdrop-blur-sm"
            style={{
              background: "rgba(14,30,26,0.92)",
              border: `1px solid ${BDR}`,
            }}
          >
            <div className="px-4 py-3.5 flex flex-wrap lg:flex-nowrap items-center gap-3">
              <div className="flex-1 relative">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                />
                <input
                  type="text"
                  placeholder="Search babysitters or jobs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border text-white placeholder-white/30 rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:border-[#3DBEB5]/50 transition-all"
                  style={{ borderColor: "rgba(255,255,255,0.1)", fontSize: 13 }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: TEAL }}
              >
                <Search size={15} className="text-white" />
              </button>
              <Link
                to="/post-job"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold text-white hover:opacity-90 transition-all whitespace-nowrap"
                style={{
                  background: "rgba(61,190,181,0.2)",
                  border: `1px solid ${TEAL}`,
                  color: TEAL,
                }}
              >
                + Post a job
              </Link>
            </div>

            <div
              className="px-4 pb-4 pt-1 flex items-center gap-2 overflow-x-auto"
              style={{ scrollbarWidth: "none", borderTop: `1px solid ${BDR}` }}
            >
              <FilterPill
                icon={Briefcase}
                label="Type of work"
                count={selTypes.length}
                open={openPanel === "type"}
                onClick={() =>
                  setOpenPanel(openPanel === "type" ? null : "type")
                }
              />
              <FilterPill
                icon={Baby}
                label="Children"
                count={selChildren.length}
                open={openPanel === "children"}
                onClick={() =>
                  setOpenPanel(openPanel === "children" ? null : "children")
                }
              />
              <FilterPill
                icon={ShieldCheck}
                label="Verifications"
                onClick={() => {}}
              />
              <FilterPill
                icon={SlidersHorizontal}
                label="More filters"
                open={openPanel === "more"}
                onClick={() =>
                  setOpenPanel(openPanel === "more" ? null : "more")
                }
              />
            </div>
          </div>

          {/* Dropdown filter panel */}
          {openPanel && (
            <div className="max-w-7xl mx-auto">
              <div
                className="rounded-2xl mt-2 p-5 space-y-4 shadow-2xl"
                style={{ background: CARD, border: `1px solid ${BDR}` }}
              >
                {openPanel === "type" && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white/60">
                      Type of work
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {TYPE_OPTIONS.map((t) => (
                        <Chip
                          key={t}
                          label={t}
                          active={selTypes.includes(t)}
                          onClick={() => toggle(selTypes, t, setSelTypes)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {openPanel === "children" && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-white/60">
                      Number of children
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CHILDREN_OPTIONS.map((c) => (
                        <Chip
                          key={c}
                          label={c}
                          active={selChildren.includes(c)}
                          onClick={() => toggle(selChildren, c, setSelChildren)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {openPanel === "more" && (
                  <p className="text-sm text-white/40">
                    More filter options coming soon.
                  </p>
                )}
                <div className="flex items-center gap-4 pt-1">
                  <button
                    onClick={() => {
                      setSelTypes([]);
                      setSelChildren([]);
                    }}
                    className="text-xs font-medium hover:opacity-80 transition"
                    style={{ color: TEAL }}
                  >
                    Clear all
                  </button>
                  <button
                    onClick={() => setOpenPanel(null)}
                    className="text-xs font-medium px-4 py-1.5 rounded-full text-white"
                    style={{ background: TEAL }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 px-4 lg:px-6 py-7">
          <div className="max-w-7xl mx-auto">
            <div
              className="rounded-2xl px-4 sm:px-6 py-5 mb-6"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${BDR}`,
              }}
            >
              <h1 className="text-lg sm:text-2xl font-bold text-white leading-snug">
                Babysitters and jobs near you
              </h1>
              <p
                className="text-sm mt-1.5"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                {loading
                  ? "Loading listings..."
                  : `${displayedSitters.length} babysitter${displayedSitters.length !== 1 ? "s" : ""} and ${filtered.length} job${filtered.length !== 1 ? "s" : ""} found.`}
              </p>

              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span
                  className="text-xs font-medium inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{
                    background: "rgba(233,30,140,0.10)",
                    color: PINK,
                    border: "1px solid rgba(233,30,140,0.2)",
                  }}
                >
                  {displayedSitters.length} babysitter
                  {displayedSitters.length !== 1 ? "s" : ""}
                </span>
                <span
                  className="text-xs font-medium inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{
                    background: "rgba(61,190,181,0.10)",
                    color: TEAL,
                    border: `1px solid rgba(61,190,181,0.2)`,
                  }}
                >
                  {filtered.length} open job{filtered.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] items-start">
              <section
                className="space-y-4 rounded-2xl p-4 sm:p-5"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${BDR}`,
                }}
              >
                <div
                  className="flex items-center justify-between pb-2"
                  style={{ borderBottom: `1px solid ${BDR}` }}
                >
                  <h2 className="text-base font-semibold text-white">
                    Available Babysitters
                  </h2>
                  <span
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    {displayedSitters.length} results
                  </span>
                </div>

                <div
                  className="space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto pr-1"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(255,255,255,0.08) transparent",
                  }}
                >
                  {loading ? (
                    [1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="rounded-2xl p-5"
                        style={{ background: CARD, border: `1px solid ${BDR}` }}
                      >
                        <div className="flex gap-4">
                          <div
                            className="w-20 h-20 rounded-xl animate-pulse"
                            style={{ background: "rgba(255,255,255,0.06)" }}
                          />
                          <div className="flex-1 space-y-3">
                            <div
                              className="h-5 w-3/4 rounded animate-pulse"
                              style={{ background: "rgba(255,255,255,0.06)" }}
                            />
                            <div
                              className="h-4 w-1/2 rounded animate-pulse"
                              style={{ background: "rgba(255,255,255,0.04)" }}
                            />
                            <div
                              className="h-3 w-full rounded animate-pulse"
                              style={{ background: "rgba(255,255,255,0.03)" }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : displayedSitters.length === 0 ? (
                    <div
                      className="rounded-2xl p-7 text-center"
                      style={{
                        background: "rgba(61,190,181,0.06)",
                        border: "1px solid rgba(61,190,181,0.15)",
                      }}
                    >
                      <h3 className="text-base font-bold text-white mb-1.5">
                        No babysitters found
                      </h3>
                      <p
                        className="text-sm mb-5"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                      >
                        Try adjusting your search or filters, or add your
                        profile today.
                      </p>
                      <Link
                        to="/profile-wizard"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all"
                        style={{ background: TEAL }}
                      >
                        Get started
                      </Link>
                    </div>
                  ) : (
                    /* ── Babysitter info cards ───────────────────────── */
                    displayedSitters.map((sitter) => {
                      const dist = homeCoords
                        ? distanceKm(
                            homeCoords[0],
                            homeCoords[1],
                            sitter.location_lat!,
                            sitter.location_lng!,
                          )
                        : null;
                      return (
                        <div
                          key={sitter.id}
                          className="rounded-2xl p-4 hover:brightness-110 transition-all cursor-pointer group relative"
                          style={{
                            background: CARD,
                            border: `1px solid ${BDR}`,
                          }}
                        >
                          <div className="flex gap-4">
                            {/* Avatar / Photo */}
                            <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                              {sitter.photo_url ? (
                                <img
                                  src={sitter.photo_url}
                                  alt={sitter.name}
                                  className="w-[72px] h-[72px] rounded-xl object-cover border-2"
                                  style={{
                                    borderColor: "rgba(255,255,255,0.1)",
                                  }}
                                />
                              ) : (
                                <div
                                  className="w-[72px] h-[72px] rounded-xl flex items-center justify-center text-xl font-bold text-white"
                                  style={{
                                    background: `linear-gradient(135deg, ${PINK}, #C2185B)`,
                                  }}
                                >
                                  {sitter.name?.charAt(0).toUpperCase() ?? "B"}
                                </div>
                              )}
                              {dist != null && (
                                <span
                                  className="text-[10px] font-medium whitespace-nowrap"
                                  style={{ color: TEAL }}
                                >
                                  ~{" "}
                                  {dist < 1
                                    ? `${Math.round(dist * 1000)} m`
                                    : `${dist.toFixed(1)} km`}
                                </span>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-white group-hover:text-[#E91E8C] transition-colors truncate">
                                  {sitter.name}
                                </h3>
                                {sitter.is_verified && (
                                  <CheckCircle2
                                    size={14}
                                    style={{ color: "#16a34a", flexShrink: 0 }}
                                  />
                                )}
                                {/* Favorite heart placeholder */}
                                <div className="ml-auto flex items-center gap-1 flex-shrink-0">
                                  <span
                                    style={{ color: PINK }}
                                    className="text-sm"
                                  >
                                    ♥
                                  </span>
                                  {sitter.rating_count != null &&
                                    sitter.rating_count > 0 && (
                                      <span
                                        className="text-[10px] font-bold"
                                        style={{ color: PINK }}
                                      >
                                        {sitter.rating_count}
                                      </span>
                                    )}
                                </div>
                              </div>

                              {/* City */}
                              {sitter.city && (
                                <p
                                  className="text-xs mt-0.5"
                                  style={{ color: "rgba(255,255,255,0.4)" }}
                                >
                                  Babysitter in {sitter.city}
                                </p>
                              )}

                              {/* Bio */}
                              {sitter.bio && (
                                <p
                                  className="text-xs mt-1 line-clamp-2"
                                  style={{ color: "rgba(255,255,255,0.35)" }}
                                >
                                  {sitter.bio}
                                </p>
                              )}

                              {/* Detail chips */}
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                                {sitter.max_kids && (
                                  <span
                                    className="inline-flex items-center gap-1 text-[11px]"
                                    style={{ color: TEAL }}
                                  >
                                    <Baby size={11} /> Max {sitter.max_kids}{" "}
                                    children
                                  </span>
                                )}
                                {sitter.years_experience != null &&
                                  sitter.years_experience > 0 && (
                                    <span
                                      className="text-[11px]"
                                      style={{
                                        color: "rgba(255,255,255,0.35)",
                                      }}
                                    >
                                      ⚡ {sitter.years_experience} yr
                                      {sitter.years_experience > 1 ? "s" : ""}{" "}
                                      exp
                                    </span>
                                  )}
                                {sitter.rating_avg != null &&
                                  sitter.rating_avg > 0 && (
                                    <span
                                      className="inline-flex items-center gap-0.5 text-[11px]"
                                      style={{ color: "#fbbf24" }}
                                    >
                                      <Star size={10} fill="#fbbf24" />{" "}
                                      {Number(sitter.rating_avg).toFixed(1)}
                                    </span>
                                  )}
                                <span
                                  className="text-[11px]"
                                  style={{ color: "rgba(255,255,255,0.25)" }}
                                >
                                  <Clock size={10} className="inline mr-0.5" />
                                  Last active: {timeAgo(sitter.updated_at)}
                                </span>
                              </div>

                              {/* Rate */}
                              {sitter.hourly_rate != null && (
                                <p
                                  className="text-xs font-bold mt-2 text-right"
                                  style={{ color: PINK }}
                                >
                                  INR {Number(sitter.hourly_rate).toFixed(2)}/hr
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right arrow */}
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 group-hover:opacity-70 transition-opacity">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="2"
                            >
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              <section
                className="space-y-4 rounded-2xl p-4 sm:p-5"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${BDR}`,
                }}
              >
                <div
                  className="flex items-center justify-between pb-2"
                  style={{ borderBottom: `1px solid ${BDR}` }}
                >
                  <h2 className="text-base font-semibold text-white">
                    Open Babysitting Jobs
                  </h2>
                  <span
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    {filtered.length} results
                  </span>
                </div>

                <div
                  className="space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto pr-1"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(255,255,255,0.08) transparent",
                  }}
                >
                  {loading ? (
                    [1, 2, 3].map((i) => (
                      <div
                        key={`job-skeleton-${i}`}
                        className="rounded-2xl p-5"
                        style={{ background: CARD, border: `1px solid ${BDR}` }}
                      >
                        <div
                          className="h-5 w-2/3 rounded animate-pulse"
                          style={{ background: "rgba(255,255,255,0.06)" }}
                        />
                        <div
                          className="h-4 w-1/3 mt-3 rounded animate-pulse"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                        />
                        <div
                          className="h-4 w-full mt-3 rounded animate-pulse"
                          style={{ background: "rgba(255,255,255,0.03)" }}
                        />
                      </div>
                    ))
                  ) : filtered.length === 0 ? (
                    <div
                      className="rounded-2xl p-7 text-center"
                      style={{
                        background: "rgba(61,190,181,0.06)",
                        border: "1px solid rgba(61,190,181,0.15)",
                      }}
                    >
                      <h3 className="text-base font-bold text-white mb-1.5">
                        No jobs found
                      </h3>
                      <p
                        className="text-sm mb-5"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                      >
                        Try changing your filters or search terms.
                      </p>
                      <Link
                        to="/post-job"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all"
                        style={{ background: TEAL }}
                      >
                        Post a job
                      </Link>
                    </div>
                  ) : (
                    filtered.map((job) => (
                      <article
                        key={job.id}
                        className="rounded-2xl p-4"
                        style={{ background: CARD, border: `1px solid ${BDR}` }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              background: "rgba(61,190,181,0.15)",
                              color: TEAL,
                            }}
                          >
                            <Briefcase size={17} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-white truncate">
                              {job.title}
                            </h3>
                            <div
                              className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px]"
                              style={{ color: "rgba(255,255,255,0.45)" }}
                            >
                              {job.city && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin size={11} />
                                  {job.city}
                                </span>
                              )}
                              <span>
                                {job.children_count ?? 1} child
                                {(job.children_count ?? 1) > 1 ? "ren" : ""}
                              </span>
                              {job.job_type && <span>{job.job_type}</span>}
                            </div>
                            {job.description && (
                              <p
                                className="text-xs mt-2 line-clamp-2"
                                style={{ color: "rgba(255,255,255,0.35)" }}
                              >
                                {job.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-3">
                              <div
                                className="text-[11px]"
                                style={{ color: "rgba(255,255,255,0.35)" }}
                              >
                                Posted by {job.parent_name ?? "Parent"}
                              </div>
                              {job.hourly_rate != null && (
                                <div
                                  className="text-xs font-bold"
                                  style={{ color: TEAL }}
                                >
                                  INR {Number(job.hourly_rate).toFixed(2)}/hr
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Breadcrumb */}
            <div
              className="mt-5 pt-3"
              style={{ borderTop: `1px solid ${BDR}` }}
            >
              <div className="flex items-center gap-1.5 text-xs">
                <Link
                  to="/"
                  className="font-medium underline"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  BabyCare
                </Link>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
                <span
                  className="font-medium underline"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  Babysitting job
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BabysittingJobs;
