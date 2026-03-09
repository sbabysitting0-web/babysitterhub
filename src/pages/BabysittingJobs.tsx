import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  Search, MapPin, Baby, Briefcase, ShieldCheck, SlidersHorizontal,
  Clock, X, Crosshair, Star, CheckCircle2,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import { resolveCoords, TILE_URL, TILE_ATTR } from "@/utils/mapHelpers";

/* ── Design tokens ───────────────────────────────────────────────────── */
const TEAL = "#3DBEB5";
const BG   = "#080F0D";
const CARD = "#0E1E1A";
const BDR  = "rgba(255,255,255,0.08)";
const PINK = "#E91E8C";


/* ── Filter options ──────────────────────────────────────────────────── */
const TYPE_OPTIONS     = ["Regular","Occasional","Overnight","Emergency","After school","Full-time nanny"];
const CHILDREN_OPTIONS = ["1 child","2 children","3+ children"];

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
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Filter pill (top bar) ───────────────────────────────────────────── */
function FilterPill({
  icon: Icon, label, count, open, onClick,
}: {
  icon: React.ElementType; label: string; count?: number; open?: boolean; onClick: () => void;
}) {
  const active = (count ?? 0) > 0 || open;
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-semibold border transition-all whitespace-nowrap"
      style={{
        borderColor: active ? TEAL : "rgba(255,255,255,0.12)",
        background: active ? "rgba(61,190,181,0.10)" : "rgba(255,255,255,0.04)",
        color: active ? TEAL : "rgba(255,255,255,0.6)",
      }}>
      <Icon size={14} />
      {label}
      {count != null && count > 0 && (
        <span className="ml-0.5 text-[10px] font-bold bg-[#3DBEB5] text-white rounded-full w-4 h-4 flex items-center justify-center">{count}</span>
      )}
    </button>
  );
}

/* ── Selectable chip (dropdown) ──────────────────────────────────────── */
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
      style={{
        borderColor: active ? TEAL : "rgba(255,255,255,0.12)",
        background: active ? "rgba(61,190,181,0.15)" : "transparent",
        color: active ? TEAL : "rgba(255,255,255,0.45)",
      }}>
      {label}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
/*                         MAIN COMPONENT                               */
/* ══════════════════════════════════════════════════════════════════════ */
const BabysittingJobs = () => {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<L.Map | null>(null);

  const [jobs, setJobs]       = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  /* babysitter state */
  const [babysitters, setBabysitters] = useState<Babysitter[]>([]);
  /* babysitters visible in current map viewport */
  const [visibleSitters, setVisibleSitters] = useState<Babysitter[]>([]);

  /* filter state */
  const [selTypes, setSelTypes]       = useState<string[]>([]);
  const [selChildren, setSelChildren] = useState<string[]>([]);
  const [openPanel, setOpenPanel]     = useState<"type"|"children"|"more"|null>(null);

  /* user home location */
  const [homeCoords, setHomeCoords] = useState<[number, number] | null>(null);
  const [homeCity, setHomeCity]     = useState<string | null>(null);

  /* ── Load user home location from profile ────────────────────── */
  useEffect(() => {
    if (!user) return;
    const loadHome = async () => {
      const { data: bp } = await supabase.from("babysitter_profiles")
        .select("city, location_lat, location_lng")
        .eq("user_id", user.id).maybeSingle();
      if (bp?.location_lat && bp?.location_lng) {
        setHomeCoords([bp.location_lat, bp.location_lng]);
        setHomeCity(bp.city ?? null);
        return;
      }
      const { data: pp } = await supabase.from("parent_profiles")
        .select("city, location_lat, location_lng").eq("user_id", user.id).maybeSingle();
      if (pp?.location_lat && pp?.location_lng) {
        setHomeCoords([pp.location_lat, pp.location_lng]);
        setHomeCity(pp.city ?? null);
        return;
      }
      const city = bp?.city || pp?.city;
      if (city) {
        setHomeCity(city);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`);
          const results = await res.json();
          if (results?.[0]) setHomeCoords([parseFloat(results[0].lat), parseFloat(results[0].lon)]);
        } catch { /* silently fail */ }
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
        const parentIds = [...new Set((data as any[]).map((j: any) => j.parent_id))];
        let nameMap: Record<string, string> = {};
        if (parentIds.length > 0) {
          const { data: parents } = await supabase.from("parent_profiles").select("user_id, name").in("user_id", parentIds);
          if (parents) parents.forEach((p) => { nameMap[p.user_id] = p.name; });
        }
        setJobs((data as any[]).map((j: any) => ({ ...j, parent_name: nameMap[j.parent_id] ?? "Parent" })));
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
        .select("id, user_id, name, photo_url, bio, city, location_lat, location_lng, hourly_rate, max_kids, is_verified, rating_avg, rating_count, years_experience, languages, skills, updated_at");
      console.log("[BabysittingJobs] Fetched babysitters:", data?.length, "error:", error);
      if (data) {
        const mapped = data.map((b, idx) => {
          const coords = resolveCoords(b.location_lat, b.location_lng, b.city, idx);
          if (coords) return { ...b, location_lat: coords.lat, location_lng: coords.lng };
          return null;
        }).filter(Boolean) as typeof data;
        console.log("[BabysittingJobs] Babysitters with coords:", mapped.length);
        setBabysitters(mapped);
      }
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
          if (payload.eventType === "INSERT" && rec?.location_lat && rec?.location_lng) {
            setBabysitters((prev) => [...prev, rec]);
          } else if (payload.eventType === "UPDATE" && rec) {
            setBabysitters((prev) => {
              const without = prev.filter((b) => b.id !== rec.id);
              return rec.location_lat && rec.location_lng ? [...without, rec] : without;
            });
          } else if (payload.eventType === "DELETE" && oldRec?.id) {
            setBabysitters((prev) => prev.filter((b) => b.id !== oldRec.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  /* ── Update visible sitters when map moves ──────────────────────── */
  const updateVisibleSitters = useCallback(() => {
    const map = mapInst.current;
    if (!map) { setVisibleSitters(babysitters); return; }
    const bounds = map.getBounds();
    const inView = babysitters.filter((b) =>
      b.location_lat != null && b.location_lng != null &&
      bounds.contains([b.location_lat!, b.location_lng!])
    );
    setVisibleSitters(inView);
  }, [babysitters]);

  /* ── Filtered jobs ──────────────────────────────────────────────── */
  const filtered = jobs.filter((j) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!j.title?.toLowerCase().includes(q) && !j.city?.toLowerCase().includes(q) && !j.description?.toLowerCase().includes(q)) return false;
    }
    if (selTypes.length > 0 && !selTypes.some((t) => t.toLowerCase() === (j.job_type ?? "regular").toLowerCase())) return false;
    if (selChildren.length > 0) {
      const cnt = j.children_count ?? 1;
      if (!selChildren.some((c) => c === "1 child" ? cnt === 1 : c === "2 children" ? cnt === 2 : cnt >= 3)) return false;
    }
    return true;
  });

  /* ── Search-filtered visible sitters ────────────────────────────── */
  const displayedSitters = visibleSitters.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return b.name?.toLowerCase().includes(q) || b.city?.toLowerCase().includes(q) || b.bio?.toLowerCase().includes(q);
  });

  /* ── Leaflet map ────────────────────────────────────────────────── */
  const setupMap = useCallback(() => {
    if (!mapRef.current) return;
    if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }

    const withCoords = filtered.filter((j) => j.location_lat && j.location_lng);
    const center: [number, number] = homeCoords
      ? homeCoords
      : withCoords.length > 0
        ? [withCoords[0].location_lat!, withCoords[0].location_lng!]
        : [28.6139, 77.2090]; // Delhi default

    const map = L.map(mapRef.current, {
      center, zoom: homeCoords ? 11 : withCoords.length > 0 ? 11 : 6,
      zoomControl: false,
    });
    mapInst.current = map;

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTR,
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    /* Home marker */
    if (homeCoords) {
      const homeIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:40px;height:40px;
          background:rgba(244,180,192,0.85);
          border:3px solid rgba(255,255,255,0.9);
          border-radius:50%;
          box-shadow:0 2px 12px rgba(0,0,0,0.35);
          display:flex;align-items:center;justify-content:center;
        "><svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><polyline points="9 22 9 12 15 12 15 22" fill="rgba(244,180,192,0.85)" stroke="rgba(244,180,192,0.85)"/></svg></div>`,
        iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -24],
      });
      L.marker(homeCoords, { icon: homeIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`<div style="font-family:system-ui,sans-serif;text-align:center;padding:2px 0">
          <p style="font-weight:700;font-size:13px;margin:0 0 2px;color:#1c1917">📍 Your location</p>
          ${homeCity ? `<p style="font-size:11px;color:#78716c;margin:0">${homeCity}</p>` : ""}
        </div>`);
    }

    /* Job pin markers (teal) */
    const pinIcon = L.divIcon({
      className: "",
      html: `<div style="
        width:30px;height:30px;
        background:linear-gradient(135deg,${TEAL},#2a9d95);
        border:3px solid rgba(255,255,255,0.85);
        border-radius:50%;
        box-shadow:0 2px 10px rgba(0,0,0,0.45);
        display:flex;align-items:center;justify-content:center;
      "><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`,
      iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -18],
    });
    withCoords.forEach((j) => {
      const popup = `
        <div style="min-width:190px;font-family:system-ui,sans-serif;padding:2px 0">
          <p style="font-weight:700;font-size:13px;margin:0 0 3px;color:#1c1917">${j.title}</p>
          ${j.city ? `<p style="font-size:11px;color:#78716c;margin:0 0 3px">📍 ${j.city}</p>` : ""}
          ${j.hourly_rate ? `<p style="font-size:12px;font-weight:600;color:${TEAL};margin:0 0 4px">₹${Number(j.hourly_rate).toFixed(0)}/hr</p>` : ""}
          <p style="font-size:11px;color:#a8a29e;margin:0">${j.parent_name} · ${j.children_count ?? 1} child${(j.children_count ?? 1) > 1 ? "ren" : ""}</p>
        </div>`;
      L.marker([j.location_lat!, j.location_lng!], { icon: pinIcon }).addTo(map).bindPopup(popup);
    });

    /* Babysitter pin markers (pink/magenta) */
    const sitterIcon = L.divIcon({
      className: "",
      html: `<div style="
        width:34px;height:34px;
        background:linear-gradient(135deg,#E91E8C,#C2185B);
        border:3px solid rgba(255,255,255,0.9);
        border-radius:50%;
        box-shadow:0 2px 12px rgba(233,30,140,0.45);
        display:flex;align-items:center;justify-content:center;
      "><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`,
      iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -20],
    });
    babysitters.forEach((b) => {
      const stars = b.rating_avg ? `⭐ ${Number(b.rating_avg).toFixed(1)}` : "";
      const verified = b.is_verified ? `<span style="color:#16a34a;font-size:11px;font-weight:600">✓ Verified</span>` : "";
      const popup = `
        <div style="min-width:200px;font-family:system-ui,sans-serif;padding:2px 0">
          <p style="font-weight:700;font-size:14px;margin:0 0 3px;color:#1c1917">${b.name}</p>
          ${b.city ? `<p style="font-size:11px;color:#78716c;margin:0 0 3px">📍 ${b.city}</p>` : ""}
          ${b.bio ? `<p style="font-size:11px;color:#57534e;margin:0 0 4px;max-width:220px">${b.bio.length > 100 ? b.bio.slice(0, 100) + "…" : b.bio}</p>` : ""}
          ${b.hourly_rate ? `<p style="font-size:13px;font-weight:700;color:#E91E8C;margin:0 0 3px">₹${Number(b.hourly_rate).toFixed(0)}/hr</p>` : ""}
          <div style="display:flex;align-items:center;gap:8px;margin:0 0 2px">
            ${stars ? `<span style="font-size:11px;color:#a8a29e">${stars}</span>` : ""}
            ${verified}
          </div>
          ${b.years_experience ? `<p style="font-size:10px;color:#a8a29e;margin:0">${b.years_experience} yr${b.years_experience > 1 ? "s" : ""} experience</p>` : ""}
        </div>`;
      L.marker([b.location_lat!, b.location_lng!], { icon: sitterIcon }).addTo(map).bindPopup(popup);
    });

    /* Listen for map move/zoom to update visible sitters in left panel */
    const onMapMove = () => {
      const bounds = map.getBounds();
      const inView = babysitters.filter((b) =>
        b.location_lat != null && b.location_lng != null &&
        bounds.contains([b.location_lat!, b.location_lng!])
      );
      setVisibleSitters(inView);
    };
    map.on("moveend", onMapMove);
    map.on("zoomend", onMapMove);
    // Initial sync
    setTimeout(onMapMove, 100);

  }, [filtered, babysitters, homeCoords, homeCity]);

  useEffect(() => {
    const t = setTimeout(setupMap, 80);
    return () => { clearTimeout(t); if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } };
  }, [setupMap]);

  const toggle = (arr: string[], val: string, set: React.Dispatch<React.SetStateAction<string[]>>) =>
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  /* ── Time-ago helper ───────────────────────────────────────────────── */
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return days === 1 ? "yesterday" : `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  /* ══════════════════════════════════════════════════════════════════ */
  /*                           RENDER                                  */
  /* ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>
      <Navbar />

      {/* ── Search + filter bar ────────────────────────────────────── */}
      <div className="pt-[76px]">
        <div style={{ background: CARD, borderBottom: `1px solid ${BDR}` }}>
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }} />
              <input
                type="text"
                placeholder="Search babysitters or jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border text-white placeholder-white/30 rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:border-[#3DBEB5]/50 transition-all"
                style={{ borderColor: "rgba(255,255,255,0.1)", fontSize: 13 }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }}>
                  <X size={14} />
                </button>
              )}
            </div>
            <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: TEAL }}>
              <Search size={15} className="text-white" />
            </button>
            <Link to="/post-job"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold text-white hover:opacity-90 transition-all whitespace-nowrap"
              style={{ background: "rgba(61,190,181,0.2)", border: `1px solid ${TEAL}`, color: TEAL }}>
              + Post a job
            </Link>
          </div>

          <div className="max-w-7xl mx-auto px-4 pb-3 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <FilterPill icon={Briefcase} label="Type of work" count={selTypes.length}
              open={openPanel === "type"} onClick={() => setOpenPanel(openPanel === "type" ? null : "type")} />
            <FilterPill icon={Baby} label="Children" count={selChildren.length}
              open={openPanel === "children"} onClick={() => setOpenPanel(openPanel === "children" ? null : "children")} />
            <FilterPill icon={ShieldCheck} label="Verifications" onClick={() => {}} />
            <FilterPill icon={SlidersHorizontal} label="More filters" open={openPanel === "more"}
              onClick={() => setOpenPanel(openPanel === "more" ? null : "more")} />
          </div>
        </div>

        {/* Dropdown filter panel */}
        {openPanel && (
          <div className="max-w-7xl mx-auto px-4">
            <div className="rounded-b-2xl p-5 space-y-4 shadow-2xl" style={{ background: CARD, border: `1px solid ${BDR}`, borderTop: "none" }}>
              {openPanel === "type" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white/60">Type of work</label>
                  <div className="flex flex-wrap gap-2">
                    {TYPE_OPTIONS.map((t) => <Chip key={t} label={t} active={selTypes.includes(t)} onClick={() => toggle(selTypes, t, setSelTypes)} />)}
                  </div>
                </div>
              )}
              {openPanel === "children" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white/60">Number of children</label>
                  <div className="flex flex-wrap gap-2">
                    {CHILDREN_OPTIONS.map((c) => <Chip key={c} label={c} active={selChildren.includes(c)} onClick={() => toggle(selChildren, c, setSelChildren)} />)}
                  </div>
                </div>
              )}
              {openPanel === "more" && (
                <p className="text-sm text-white/40">More filter options coming soon.</p>
              )}
              <div className="flex items-center gap-4 pt-1">
                <button onClick={() => { setSelTypes([]); setSelChildren([]); }}
                  className="text-xs font-medium hover:opacity-80 transition" style={{ color: TEAL }}>Clear all</button>
                <button onClick={() => setOpenPanel(null)}
                  className="text-xs font-medium px-4 py-1.5 rounded-full text-white" style={{ background: TEAL }}>Apply</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Split layout: listings (left) + map (right) ───────────── */}
      <div className="flex-1 flex flex-col lg:flex-row" style={{ minHeight: 0 }}>

        {/* ── Left panel ──────────────────────────────────────────── */}
        <div className="w-full lg:w-[42%] xl:w-[38%] flex flex-col px-4 lg:pl-6 lg:pr-4 py-5 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 160px)", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>

          <h1 className="text-lg sm:text-xl font-bold text-white leading-snug">
            Babysitting jobs in selected map area
          </h1>
          <p className="text-sm mt-1.5 mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
            {loading
              ? "Loading..."
              : `${displayedSitters.length} babysitter${displayedSitters.length !== 1 ? "s" : ""} available in this area. Find the perfect babysitter here!`}
          </p>

          {/* Babysitter count badge */}
          {displayedSitters.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: "rgba(233,30,140,0.10)", color: PINK, border: "1px solid rgba(233,30,140,0.2)" }}>
                🧑‍🍼 {displayedSitters.length} babysitter{displayedSitters.length !== 1 ? "s" : ""} in view
              </span>
              {filtered.length > 0 && (
                <span className="text-xs font-medium inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(61,190,181,0.10)", color: TEAL, border: `1px solid rgba(61,190,181,0.2)` }}>
                  📋 {filtered.length} job{filtered.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}

          {/* ── Babysitter cards (like reference image) ──────────── */}
          <div className="flex-1 space-y-3">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BDR}` }}>
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-3/4 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
                      <div className="h-4 w-1/2 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
                      <div className="h-3 w-full rounded animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
                    </div>
                  </div>
                </div>
              ))
            ) : displayedSitters.length === 0 ? (
              <div className="rounded-2xl p-7 text-center" style={{ background: "rgba(61,190,181,0.06)", border: "1px solid rgba(61,190,181,0.15)" }}>
                <h3 className="text-base font-bold text-white mb-1.5">No babysitters in this area?</h3>
                <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Zoom out on the map to find babysitters in a wider area, or add your profile today.
                </p>
                <Link to="/profile-wizard"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all"
                  style={{ background: TEAL }}>
                  Get started
                </Link>
              </div>
            ) : (
              /* ── Babysitter info cards ───────────────────────── */
              displayedSitters.map((sitter) => {
                const dist = homeCoords
                  ? distanceKm(homeCoords[0], homeCoords[1], sitter.location_lat!, sitter.location_lng!)
                  : null;
                return (
                  <div key={sitter.id}
                    className="rounded-2xl p-4 hover:brightness-110 transition-all cursor-pointer group relative"
                    style={{ background: CARD, border: `1px solid ${BDR}` }}
                    onClick={() => {
                      if (mapInst.current && sitter.location_lat && sitter.location_lng) {
                        mapInst.current.flyTo([sitter.location_lat, sitter.location_lng], 14, { duration: 0.8 });
                      }
                    }}
                  >
                    <div className="flex gap-4">
                      {/* Avatar / Photo */}
                      <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                        {sitter.photo_url ? (
                          <img src={sitter.photo_url} alt={sitter.name}
                            className="w-[72px] h-[72px] rounded-xl object-cover border-2"
                            style={{ borderColor: "rgba(255,255,255,0.1)" }} />
                        ) : (
                          <div className="w-[72px] h-[72px] rounded-xl flex items-center justify-center text-xl font-bold text-white"
                            style={{ background: `linear-gradient(135deg, ${PINK}, #C2185B)` }}>
                            {sitter.name?.charAt(0).toUpperCase() ?? "B"}
                          </div>
                        )}
                        {dist != null && (
                          <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: TEAL }}>
                            ~ {dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}
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
                            <CheckCircle2 size={14} style={{ color: "#16a34a", flexShrink: 0 }} />
                          )}
                          {/* Favorite heart placeholder */}
                          <div className="ml-auto flex items-center gap-1 flex-shrink-0">
                            <span style={{ color: PINK }} className="text-sm">♥</span>
                            {sitter.rating_count != null && sitter.rating_count > 0 && (
                              <span className="text-[10px] font-bold" style={{ color: PINK }}>{sitter.rating_count}</span>
                            )}
                          </div>
                        </div>

                        {/* City */}
                        {sitter.city && (
                          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                            Babysitter in {sitter.city}
                          </p>
                        )}

                        {/* Bio */}
                        {sitter.bio && (
                          <p className="text-xs mt-1 line-clamp-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                            {sitter.bio}
                          </p>
                        )}

                        {/* Detail chips */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                          {sitter.max_kids && (
                            <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: TEAL }}>
                              <Baby size={11} /> Max {sitter.max_kids} children
                            </span>
                          )}
                          {sitter.years_experience != null && sitter.years_experience > 0 && (
                            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                              ⚡ {sitter.years_experience} yr{sitter.years_experience > 1 ? "s" : ""} exp
                            </span>
                          )}
                          {sitter.rating_avg != null && sitter.rating_avg > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[11px]" style={{ color: "#fbbf24" }}>
                              <Star size={10} fill="#fbbf24" /> {Number(sitter.rating_avg).toFixed(1)}
                            </span>
                          )}
                          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                            <Clock size={10} className="inline mr-0.5" />
                            Last active: {timeAgo(sitter.updated_at)}
                          </span>
                        </div>

                        {/* Rate */}
                        {sitter.hourly_rate != null && (
                          <p className="text-xs font-bold mt-2 text-right" style={{ color: PINK }}>
                            INR {Number(sitter.hourly_rate).toFixed(2)}/hr
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right arrow */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 group-hover:opacity-70 transition-opacity">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Breadcrumb */}
          <div className="mt-5 pt-3" style={{ borderTop: `1px solid ${BDR}` }}>
            <div className="flex items-center gap-1.5 text-xs">
              <Link to="/" className="font-medium underline" style={{ color: "rgba(255,255,255,0.45)" }}>Babysits</Link>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
              <span className="font-medium underline" style={{ color: "rgba(255,255,255,0.45)" }}>Babysitting job</span>
            </div>
          </div>
        </div>

        {/* ── Right panel: map ────────────────────────────────────── */}
        <div className="w-full lg:w-[58%] xl:w-[62%] flex-shrink-0 relative">
          <div ref={mapRef} className="w-full" style={{ height: "calc(100vh - 160px)", minHeight: 400 }} />
          {homeCoords && (
            <button
              onClick={() => { if (mapInst.current && homeCoords) mapInst.current.flyTo(homeCoords, 14, { duration: 0.8 }); }}
              className="absolute z-[1000] flex items-center justify-center"
              style={{
                top: 120, right: 10,
                width: 36, height: 36, borderRadius: 4,
                background: "#fff", border: "2px solid rgba(0,0,0,0.15)",
                boxShadow: "0 1px 5px rgba(0,0,0,0.3)", cursor: "pointer",
              }}
              title="Go to my location">
              <Crosshair size={17} style={{ color: "#333" }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BabysittingJobs;
